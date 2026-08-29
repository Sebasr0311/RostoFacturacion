// ============================================================
// server.js — Punto de entrada de la API REST de facturación
// Rosto Facturación.
//
// Responsabilidades:
//   - Cargar variables de entorno.
//   - Inicializar Oracle (pool) de forma no bloqueante: si falla,
//     el servidor continúa sirviendo y el health check lo reporta.
//   - Montar la app Express y escuchar en el puerto configurado.
// ============================================================

require('dotenv').config();

const app = require('./src/app');

const { initDb, pool, dbState } = require('./src/config/oracle');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Intenta crear el pool de Oracle. Si falla (sin credenciales, sin red,
    // Oracle no disponible), NO tiramos el proceso: logueamos un warning claro
    // y el resto del servidor arranca igual. /api/health reportará db:"disconnected".
    await initDb();
  } catch (err) {
    console.warn(
      '[oracle] AVISO: no se pudo inicializar la conexión a Oracle. ' +
        'El servidor continuará, pero las rutas que usan BD devolverán error. ' +
        `Detalle: ${err.message}`
    );
  }

  app.listen(PORT, () => {
    console.log(`[server] API escuchando en http://localhost:${PORT}`);
    console.log(`[server] Estado BD: ${dbState.connected ? 'conectada' : 'desconectada'}`);
  });
}

process.on('SIGINT', async () => {
  try {
    if (pool) await pool.close(0);
  } catch (_) {
    /* noop */
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  try {
    if (pool) await pool.close(0);
  } catch (_) {
    /* noop */
  }
  process.exit(0);
});

// Si hay un error global no capturado, lo registramos pero no matamos el server.
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection:', reason);
});

start();
