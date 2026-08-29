// ============================================================
// middlewares/auth.js — Autenticación JWT para rutas protegidas.
//
// Middleware `authRequired`: valida el header `Authorization: Bearer <token>`.
// Si el token es válido, adjunta `req.usuario` (id, rol, correo, nombre).
// Si falla, responde 401 con el envelope estándar.
// ============================================================

const jwt = require('jsonwebtoken');

const { fail } = require('../utils/apiResponse');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware de autenticación obligatoria.
 */
function authRequired(req, res, next) {
  if (!JWT_SECRET) {
    return fail(res, 500, 'El servidor no está configurado correctamente (falta JWT_SECRET).');
  }

  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return fail(res, 401, 'No autorizado: token no proporcionado.');
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = {
      id_usuario: payload.id_usuario,
      nombre_completo: payload.nombre_completo,
      correo: payload.correo,
      rol: payload.rol,
    };
    return next();
  } catch (err) {
    return fail(res, 401, 'No autorizado: token inválido o expirado.');
  }
}

/**
 * Middleware para rutas de administración (solo rol ADMIN).
 * Debe usarse DESPUÉS de authRequired.
 */
function adminOnly(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'ADMIN') {
    return fail(res, 403, 'Acceso denegado: se requiere rol de administrador.');
  }
  return next();
}

module.exports = { authRequired, adminOnly };
