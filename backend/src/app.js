// ============================================================
// src/app.js — Ensambla la aplicación Express.
//  - Middleware de seguridad (helmet, cors, json).
//  - Mount de rutas bajo /api.
//  - Manejo centralizado de errores y 404 con el envelope estándar.
// ============================================================

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { corsOrigin } = require('./config/env');
const { fail } = require('./utils/apiResponse');
const { translateOracleError } = require('./utils/oracleErrors');

// Routers
const authRoutes = require('./routes/auth');
const productoRoutes = require('./routes/productos');
const categoriaRoutes = require('./routes/categorias');
const facturaRoutes = require('./routes/facturas');
const reporteRoutes = require('./routes/reportes');
const { health } = require('./controllers/healthController');

const app = express();

// ---- Seguridad y parsing ----
app.use(helmet());
app.use(
  cors({
    origin: corsOrigin(),
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

// ---- Health (público) ----
app.get('/api/health', health);

// ---- Rutas de negocio ----
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/reportes', reporteRoutes);

// ---- 404 para rutas inexistentes ----
app.use((req, res) => {
  return fail(res, 404, 'Recurso no encontrado.');
});

// ---- Error handler central ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Errores de multer (subida de archivos)
  if (err && err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera el tamaño máximo permitido (5 MB).' : 'Error al subir el archivo.';
    return fail(res, 400, msg);
  }
  if (err && err.message && /solo se permiten archivos de imagen/i.test(err.message)) {
    return fail(res, 400, 'Solo se permiten archivos de imagen.');
  }

  // Si es un error de dominio con status (p.ej. 503 BD no disponible)
  if (err && err.status) {
    return fail(res, err.status, err.message || 'Error del servidor.');
  }

  // Errores de Oracle
  const t = translateOracleError(err);
  if (t.status !== 500) {
    return fail(res, t.status, t.message);
  }

  // Por defecto: 500 genérico sin exponer internals.
  console.error('[error]', err);
  return fail(res, 500, 'Ocurrió un error interno en el servidor.');
});

module.exports = app;
