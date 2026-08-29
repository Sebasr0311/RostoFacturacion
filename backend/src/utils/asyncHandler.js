// ============================================================
// utils/asyncHandler.js — Envuelve controladores async para que
// cualquier rechazo (promesa) llegue al middleware de error central.
// Compatible con Express 4 y 5.
// ============================================================

/**
 * @param {Function} fn controlador async (req, res, next)
 * @returns {Function} controlador envuelto
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
