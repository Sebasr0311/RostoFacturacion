// ============================================================
// routes/facturas.js — Rutas de facturación.
// ============================================================

const express = require('express');

const {
  crear,
  listar,
  obtener,
  pdf,
  anular,
  activos,
  enviar,
} = require('../controllers/facturaController');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.post('/', authRequired, crear);
router.get('/', authRequired, listar);
// 'activos' DEBE declararse antes de '/:id' para que Express no lo tome como id.
router.get('/activos', authRequired, activos);
router.get('/:id/pdf', authRequired, pdf);
router.get('/:id', authRequired, obtener);
router.put('/:id/enviar', authRequired, enviar);
router.put('/:id/anular', authRequired, anular);

module.exports = router;
