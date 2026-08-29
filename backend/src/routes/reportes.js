// ============================================================
// routes/reportes.js — Rutas de reportes.
// ============================================================

const express = require('express');

const {
  ventasDia,
  ventasDiaExcel,
  ventasRango,
  ventasRangoExcel,
} = require('../controllers/reporteController');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.get('/ventas-dia', authRequired, ventasDia);
router.get('/ventas-dia/excel', authRequired, ventasDiaExcel);
router.get('/ventas-rango', authRequired, ventasRango);
router.get('/ventas-rango/excel', authRequired, ventasRangoExcel);

module.exports = router;
