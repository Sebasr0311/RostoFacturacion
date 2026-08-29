// ============================================================
// config/env.js — Valores de entorno normalizados y con defaults.
// Centralizar aquí evita esparcir `process.env.X || default` por todo el código.
// ============================================================

/**
 * Porcentaje de IVA (Colombia, default 19). Se valida como número 0..100.
 */
function impuestoPorcentaje() {
  const raw = process.env.IMPUESTO_PORCENTAJE;
  const n = Number(raw);
  if (raw === undefined || Number.isNaN(n) || n < 0 || n > 100) {
    return 19;
  }
  return n;
}

/**
 * Origen CORS permitido.
 * - En producción: el dominio de GitHub Pages (ej: https://usuario.github.io).
 * - Si no está definido, permite http://localhost:5173 (Vite en desarrollo).
 */
function corsOrigin() {
  return process.env.CORS_ORIGIN || 'http://localhost:5173';
}

/**
 * Modo de almacenamiento de imágenes: 'cloudinary' (default) | 'url'.
 * Cualquier valor no reconocido cae en 'url' para no romper el CRUD.
 */
function imageStorage() {
  const raw = (process.env.IMAGE_STORAGE || 'cloudinary').toLowerCase();
  return raw === 'cloudinary' ? 'cloudinary' : 'url';
}

module.exports = {
  impuestoPorcentaje,
  corsOrigin,
  imageStorage,
};
