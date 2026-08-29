// ============================================================
// scripts/bootstrap-db.js — Bootstrap del usuario de aplicación en
// Oracle Autonomous Database (modo thin, SIN wallet, TLS).
//
// Uso (solo una vez / re-ejecutable sin romper nada):
//   node scripts/bootstrap-db.js
//
// Lee credenciales de backend/.env.oracle.local (NO versionado):
//   ORACLE_ADMIN_USER, ORACLE_ADMIN_PASSWORD, ORACLE_CONNECT_STRING,
//   APP_DB_USER, APP_DB_PASSWORD
//
// Hace:
//   1. Se conecta como ADMIN contra ORACLE_CONNECT_STRING (TLS).
//   2. Si APP_DB_USER no existe en all_users, lo crea con DWROLE,
//      UNLIMITED TABLESPACE y QUOTA UNLIMITED en DATA.
//   3. Si ya existe, solo informa y continúa (idempotente).
// 
// No forma parte del arranque normal del server. No imprime
// contraseñas.
// ============================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.oracle.local') });
const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function bootstrap() {
  const adminUser = process.env.ORACLE_ADMIN_USER;
  const adminPassword = process.env.ORACLE_ADMIN_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;
  const appUser = process.env.APP_DB_USER;
  const appPassword = process.env.APP_DB_PASSWORD;

  if (!adminUser || !adminPassword || !connectString || !appUser || !appPassword) {
    console.error('[bootstrap] Faltan variables en backend/.env.oracle.local.');
    console.error('[bootstrap] Requeridas: ORACLE_ADMIN_USER, ORACLE_ADMIN_PASSWORD, ORACLE_CONNECT_STRING, APP_DB_USER, APP_DB_PASSWORD.');
    process.exit(1);
  }

  let conn;
  try {
    conn = await oracledb.getConnection({
      user: adminUser,
      password: adminPassword,
      connectString,
    });
    console.log(`[bootstrap] Conectado como ${adminUser} (TLS sin wallet).`);

    const res = await conn.execute(
      `SELECT username FROM all_users WHERE username = UPPER(:u)`,
      { u: appUser }
    );

    if (res.rows.length > 0) {
      console.log(`[bootstrap] El usuario ${appUser} ya existe: no se modifica nada.`);
    } else {
      console.log(`[bootstrap] Creando usuario ${appUser} ...`);
      await conn.execute(`CREATE USER ${appUser} IDENTIFIED BY "${appPassword}"`);
      await conn.execute(`GRANT DWROLE TO ${appUser}`);
      await conn.execute(`GRANT UNLIMITED TABLESPACE TO ${appUser}`);
      await conn.execute(`ALTER USER ${appUser} QUOTA UNLIMITED ON DATA`);
      console.log(`[bootstrap] ${appUser} creado con DWROLE y cuota ilimitada en DATA.`);
    }
  } catch (err) {
    console.error(`[bootstrap] ERROR: ${err.message}`);
    process.exit(1);
  } finally {
    if (conn) {
      try { await conn.close(); } catch { /* noop */ }
    }
  }
}

bootstrap();