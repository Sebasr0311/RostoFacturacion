// ============================================================
// scripts/run-sql-file.js — Ejecuta un archivo .sql contra Oracle
// Autonomous Database (modo thin, SIN wallet, TLS).
//
// Uso:
//   node scripts/run-sql-file.js sql/schema.sql
//   node scripts/run-sql-file.js sql/seed.sql
//
// Lee credenciales de backend/.env.oracle.local (NO versionado):
//   ORACLE_CONNECT_STRING, APP_DB_USER, APP_DB_PASSWORD
//
// Separación de sentencias:
//   - Terminador normal: ';' al final de la sentencia FUERA de un
//     bloque PL/SQL.
//   - Bloques PL/SQL (CREATE OR REPLACE TRIGGER / PROCEDURE /
//     FUNCTION, o bloques BEGIN..END): adoptan el modo plsql desde
//     su primera línea hasta una línea cuyo trim sea '/', que es el
//     terminador de Oracle (el '/' no se envía al driver).
//   - Las líneas de comentarios (-- ...) no se ejecutan solas.
//   - Se ignora la sentencia EXIT; (propia de SQL*Plus).
//
// Si una sentencia falla, imprime el error (código ORA-xxxxx) y se
// detiene; no continúa en silencio.
// ============================================================

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.oracle.local') });
const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

function splitStatements(sqlText) {
  const lines = sqlText.split(/\r?\n/);
  const stmts = [];
  let acc = '';
  let inPlsql = false;

  const flush = (viaSlash) => {
    let clean = acc.trim();
    acc = '';
    if (!clean) return;
    const upper = clean.toUpperCase();
    if (upper === 'EXIT' || upper === 'EXIT;' || upper.startsWith('EXIT ')) return; // SQL*Plus only
    // En bloques PL/SQL terminados por '/' el ';' final del END es OBLIGATORIO;
    // en sentencias SQL normales ';' es opcional y se elimina.
    if (!viaSlash) clean = clean.replace(/;\s*$/, '');
    stmts.push({ sql: clean, isPlsql: viaSlash });
    inPlsql = false;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const noComment = line.replace(/^\s*--.*$/, '').trim();

    if (line === '/') {
      // Terminador de bloque PL/SQL: ejecuta lo acumulado (sin tocar el ';').
      flush(true);
      continue;
    }

    const accUpper = (acc + '\n' + raw).toUpperCase();
    if (!inPlsql && /CREATE\s+OR\s+REPLACE\s+(TRIGGER|PROCEDURE|FUNCTION)|^\s*BEGIN\b|^\s*DECLARE\b/.test(accUpper)) {
      inPlsql = true;
    }

    // Sentencia vacía de solo comentarios -> no acumular para ejecutar sola.
    if (!noComment && line.startsWith('--')) continue;

    acc += raw + '\n';

    if (!inPlsql && noComment.endsWith(';')) {
      flush(false);
    }
  }
  if (acc.trim() && !/^\s*--/.test(acc.trim())) flush(false);
  return stmts;
}

async function runFile(filePath) {
  const connectString = process.env.ORACLE_CONNECT_STRING;
  const user = process.env.APP_DB_USER;
  const password = process.env.APP_DB_PASSWORD;

  if (!connectString || !user || !password) {
    console.error('[run-sql] Faltan variables en backend/.env.oracle.local: ORACLE_CONNECT_STRING, APP_DB_USER, APP_DB_PASSWORD.');
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error(`[run-sql] No existe el archivo: ${filePath}`);
    process.exit(1);
  }

  const sqlText = fs.readFileSync(filePath, 'utf8');
  const stmts = splitStatements(sqlText);
  console.log(`[run-sql] ${filePath}: ${stmts.length} sentencia(s) por ejecutar.`);

  let conn;
  try {
    conn = await oracledb.getConnection({ user, password, connectString });
    console.log(`[run-sql] Conectado como ${user} (TLS sin wallet).`);

    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i];
      const label = stmt.sql.split('\n')[0].trim().slice(0, 90) || `(bloque ${i + 1})`;
      try {
        const result = await conn.execute(stmt.sql, [], { autoCommit: true });
        const rows = result.rows && result.rows.length ? result.rows : null;
        console.log(`  [ok ${i + 1}/${stmts.length}] ${label}${rows ? ' -> ' + JSON.stringify(rows) : ''}`);
      } catch (e) {
        const isDrop = /^\s*DROP\b/i.test(stmt.sql);
        const tolerance = /ORA-(00942|04043|04080|01432|01418|02289)/.test(e.message || '');
        if (isDrop && tolerance) {
          console.log(`  [skip ${i + 1}/${stmts.length}] ${label} (objeto no existe, DROP ignorado) ${e.message.split('\n')[0]}`);
          continue;
        }
        console.error(`  [ERROR ${i + 1}/${stmts.length}] ${label}`);
        console.error(`  ${e.message}`);
        process.exit(1);
      }
    }
    console.log('[run-sql] Archivo ejecutado correctamente.');
  } catch (err) {
    console.error(`[run-sql] ERROR de conexión: ${err.message}`);
    process.exit(1);
  } finally {
    if (conn) {
      try { await conn.close(); } catch { /* noop */ }
    }
  }
}

const target = process.argv[2];
if (!target) {
  console.error('[run-sql] Uso: node scripts/run-sql-file.js <ruta.sql>');
  process.exit(1);
}
runFile(path.resolve(target));