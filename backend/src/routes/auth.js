// ============================================================
// routes/auth.js — Rutas de autenticación.
// ============================================================

const express = require('express');
const rateLimit = require('express-rate-limit');

const { login, registrar } = require('../controllers/authController');
const { authRequired, adminOnly } = require('../middlewares/auth');

const router = express.Router();

// Rate-limit ligero en el login para mitigar fuerza bruta.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Inténtalo más tarde.',
  },
});

// POST /api/auth/login
router.post('/login', loginLimiter, login);

// POST /api/auth/registrar — protegido, solo admin.
router.post('/registrar', authRequired, adminOnly, registrar);

module.exports = router;
