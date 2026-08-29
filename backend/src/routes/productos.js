// ============================================================
// routes/productos.js — Rutas de productos.
// ============================================================

const express = require('express');

const {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
} = require('../controllers/productoController');
const { authRequired, adminOnly } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

const router = express.Router();

// Lectura: autenticado (el catálogo se usa en el POS y en el panel).
router.get('/', authRequired, listar);
router.get('/:id', authRequired, obtener);

// Escritura: solo admin, con campo multipart 'imagen'.
router.post('/', authRequired, adminOnly, upload.single('imagen'), crear);
router.put('/:id', authRequired, adminOnly, upload.single('imagen'), actualizar);
router.delete('/:id', authRequired, adminOnly, eliminar);

module.exports = router;
