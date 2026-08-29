// ============================================================
// routes/categorias.js — Rutas de categorías.
// ============================================================

const express = require('express');

const {
  listar,
  crear,
  actualizar,
  eliminar,
} = require('../controllers/categoriaController');
const { authRequired, adminOnly } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authRequired, listar);
router.post('/', authRequired, adminOnly, crear);
router.put('/:id', authRequired, adminOnly, actualizar);
router.delete('/:id', authRequired, adminOnly, eliminar);

module.exports = router;
