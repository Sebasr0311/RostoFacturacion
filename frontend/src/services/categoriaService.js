// ============================================================
// services/categoriaService.js — Categorías.
// GET /api/categorias devuelve filas con claves en MAYÚSCULAS
// (OUT_FORMAT_OBJECT, sin mapeo en el controller): se normalizan aquí.
// ============================================================

import { api, extractData } from './api';

function normalizeCategoria(row) {
  return {
    id_categoria: row.ID_CATEGORIA ?? row.id_categoria,
    nombre: row.NOMBRE ?? row.nombre,
    estado: row.ESTADO ?? row.estado,
  };
}

/**
 * Lista categorías, opcionalmente filtradas por estado.
 * @param {{ estado?: 'ACTIVO'|'INACTIVO' }} [params]
 */
export async function listarCategorias(params = {}) {
  const res = await api.get('/categorias', { params });
  const rows = extractData(res) || [];
  return rows.map(normalizeCategoria);
}