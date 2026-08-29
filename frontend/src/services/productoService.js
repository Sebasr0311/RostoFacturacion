// ============================================================
// services/productoService.js — CRUD de productos.
//
// IMPORTANTE (evitar drift con el backend):
// - GET /api/productos devuelve filas con claves en MAYÚSCULAS
//   (oracledb OUT_FORMAT_OBJECT) -> se normalizan a camelCase.
// - POST/PUT consumen multipart FormData (campo 'imagen' opcional).
// - POST devuelve el objeto ya mapeado en minúsculas.
// ============================================================

import { api, extractData } from './api';

function normalizeProducto(row) {
  return {
    id_producto: row.ID_PRODUCTO ?? row.id_producto,
    nombre: row.NOMBRE ?? row.nombre,
    descripcion: row.DESCRIPCION ?? row.descripcion ?? '',
    precio: Number(row.PRECIO ?? row.precio ?? 0),
    imagen_url: row.IMAGEN_URL ?? row.imagen_url ?? '',
    id_categoria: row.ID_CATEGORIA ?? row.id_categoria,
    estado: row.ESTADO ?? row.estado ?? 'ACTIVO',
    categoria_nombre: row.CATEGORIA_NOMBRE ?? row.categoria_nombre ?? '',
  };
}

/**
 * Lista productos. Filtros soportados por el backend: estado, id_categoria.
 * @param {{ estado?: string, id_categoria?: number|string }} [params]
 */
export async function listarProductos(params = {}) {
  const res = await api.get('/productos', { params });
  const rows = extractData(res) || [];
  return rows.map(normalizeProducto);
}

export async function obtenerProducto(id) {
  const res = await api.get(`/productos/${id}`);
  return normalizeProducto(extractData(res));
}

/**
 * Crea un producto. `formData` debe incluir nombre, descripcion, precio,
 * id_categoria, estado y, opcionalmente, el archivo 'imagen'.
 */
export async function crearProducto(formData) {
  const res = await api.post('/productos', formData);
  return extractData(res);
}

/**
 * Actualiza un producto (multipart, mismo contrato que crear).
 */
export async function actualizarProducto(id, formData) {
  const res = await api.put(`/productos/${id}`, formData);
  return extractData(res);
}

/**
 * Soft delete: el backend pone el estado en INACTIVO.
 */
export async function eliminarProducto(id) {
  const res = await api.delete(`/productos/${id}`);
  return extractData(res);
}