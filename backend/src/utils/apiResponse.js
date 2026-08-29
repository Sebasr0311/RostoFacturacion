// ============================================================
// utils/apiResponse.js — Envelope JSON consistente para TODA respuesta.
//
// Formato uniforme:
//   Éxito (HTTP 2xx): { success: true,  message: string, data: ... }
//   Error (HTTP 4xx/5xx): { success: false, message: string, errors?: [...] }
// ============================================================

/**
 * Envuelve una respuesta exitosa.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 * @param {number} [statusCode]
 */
function ok(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

/**
 * Envuelve una respuesta de error con el envelope estándar.
 * `errors` es opcional y se usa para errores de validación (zod).
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {Array} [errors]
 */
function fail(res, statusCode, message, errors) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { ok, fail };
