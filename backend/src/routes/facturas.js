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
} = require('../controllers/facturaController');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.post('/', authRequired, crear);
router.get('/', authRequired, listar);
router.get('/:id/pdf', authRequired, pdf);
router.get('/:id', authRequired, obtener);
router.put('/:id/anular', authRequired, anular);

module.exports = router;
