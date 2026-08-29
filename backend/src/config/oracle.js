// ============================================================
// config/oracle.js — Conexión a Oracle (driver oracledb, modo THIN).
//
// modo thin = JS puro: no requiere Oracle Client instalado ni compilación
// nativa, funciona en Render/Windows igual que en cualquier plataforma.
//
// El pool se crea SIEMPRE que haya credenciales. El estado de conexión se
// expone en `dbState` para que el health check y otras rutas puedan saber
// si la BD está disponible sin lanzar excepciones en el arranque.
// ============================================================

const oracledb = require('oracledb');

// Estado compartido de la conexión (leído por /api/health y helpers).
const dbState = {
  connected: false,
  lastError: null,
};

// El pool se llena durante initDb().
let pool = null;

// Configuración global del driver en modo thin.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // resultados como objetos

/**
 * Devuelve la configuración mínima para crear el pool.
 * Si se indica ORACLE_WALLET_DIR, lo declaramos para mTLS (Autonomous DB).
 */
function poolConfig() {
  const config = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMax: 50,
    poolMin: 2,
    poolIncrement: 1,
    poolTimeout: 60,
  };

  const walletDir = process.env.ORACLE_WALLET_DIR;
  if (walletDir) {
    // Para Autonomous Database con wallet mTLS. En modo thin, oracledb usa
    // configDir/walletLocation para localizar los archivos del wallet.
    config.configDir = walletDir;
    config.walletLocation = walletDir;
  }

  return config;
}

/**
 * Crea (o recrea) el pool de Oracle. Resuelve y actualiza dbState.
 * NO lanza errores: cualquier fallo queda registrado en dbState y el
 * servidor continúa. Devuelve true/false según éxito.
 */
async function initDb() {
  const hasCreds = process.env.ORACLE_USER && process.env.ORACLE_PASSWORD && process.env.ORACLE_CONNECT_STRING;

  if (!hasCreds) {
    dbState.connected = false;
    dbState.lastError = 'Faltan variables ORACLE_USER / ORACLE_PASSWORD / ORACLE_CONNECT_STRING';
    console.warn('[oracle] No hay credenciales de Oracle configuradas. BD desconectada.');
    return false;
  }

  try {
    pool = await oracledb.createPool(poolConfig());
    // Verificación en vivo: una query trivial valida que la conexión funciona.
    const conn = await pool.getConnection();
    try {
      await conn.execute(`SELECT 1 AS "ok" FROM dual`);
    } finally {
      await conn.close();
    }
    dbState.connected = true;
    dbState.lastError = null;
    console.log('[oracle] Pool creado correctamente (modo thin). BD conectada.');
    return true;
  } catch (err) {
    dbState.connected = false;
    dbState.lastError = err.message;
    console.warn(`[oracle] AVISO: no se pudo conectar a Oracle. ${err.message}`);
    return false;
  }
}

/**
 * Devuelve una conexión del pool. Si el pool no existe o no está conectado,
 * lanza un error del dominio (mensaje legible) para el manejador central.
 */
async function getConnection() {
  if (!pool) {
    const e = new Error('Base de datos no disponible: el pool de Oracle no está inicializado.');
    e.status = 503;
    throw e;
  }
  try {
    return await pool.getConnection();
  } catch (err) {
    const e = new Error('No se pudo obtener una conexión a la base de datos.');
    e.status = 503;
    e.cause = err;
    throw e;
  }
}

/**
 * Ejecuta una query con bind variables en una conexión nueva del pool
 * (commit automático). Útil para lecturas simples.
 */
async function execute(sql, binds = {}, options = {}) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, binds, options);
    return result;
  } finally {
    await conn.close();
  }
}

module.exports = {
  oracledb,
  get pool() {
    return pool;
  },
  dbState,
  initDb,
  getConnection,
  execute,
};
