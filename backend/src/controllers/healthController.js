// ============================================================
// controllers/healthController.js — Health check.
//   GET /api/health -> { success: true, data: { status, db } }
// Consulta la BD en vivo: si el pool no está o falla, informa
// db:'disconnected' sin tirar el proceso.
// ============================================================

const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { getConnection, dbState } = require('../config/oracle');

/**
 * GET /api/health
 */
const health = asyncHandler(async (req, res) => {
  let db = 'disconnected';
  if (dbState.connected) {
    try {
      const conn = await getConnection();
      try {
        await conn.execute(`SELECT 1 AS "ok" FROM dual`);
        db = 'connected';
      } finally {
        await conn.close();
      }
    } catch (_err) {
      db = 'disconnected';
    }
  }
  return ok(res, { status: 'ok', db }, 'Health check.');
});

module.exports = { health };
