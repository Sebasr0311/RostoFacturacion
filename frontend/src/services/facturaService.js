// ============================================================
// services/facturaService.js — Facturación.
//
// Contratos derivados del backend:
// - POST /api/facturas: body { cliente?, items:[{id_producto,cantidad}],
//   metodo_pago, descuento (COP absoluto), observaciones? }.
//   -> devuelve la factura completa en minúsculas (id_factura,
//      numero_factura, subtotal, impuestos, descuento, total,
//      metodo_pago, estado, detalle[]).
// - GET /api/facturas?fecha&estado: filas en MAYÚSCULAS (listado).
// - GET /api/facturas/:id: detalle en minúsculas (detalle[] en MAYÚSCULAS).
// - GET /api/facturas/:id/pdf: binario PDF (requiere auth).
// - PUT /api/facturas/:id/anular: soft-anula la factura.
// ============================================================

import { api, extractData, fetchBlob } from './api';

function normalizeFacturaLista(row) {
  return {
    id_factura: row.ID_FACTURA ?? row.id_factura,
    numero_factura: row.NUMERO_FACTURA ?? row.numero_factura,
    fecha_factura: row.FECHA_FACTURA ?? row.fecha_factura,
    subtotal: Number(row.SUBTOTAL ?? row.subtotal ?? 0),
    impuestos: Number(row.IMPUESTOS ?? row.impuestos ?? 0),
    descuento: Number(row.DESCUENTO ?? row.descuento ?? 0),
    total: Number(row.TOTAL ?? row.total ?? 0),
    metodo_pago: row.METODO_PAGO ?? row.metodo_pago,
    estado: row.ESTADO ?? row.estado,
    cliente: row.CLIENTE ?? row.cliente ?? null,
  };
}

function normalizeDetalle(row) {
  return {
    id_detalle: row.ID_DETALLE ?? row.id_detalle,
    id_producto: row.ID_PRODUCTO ?? row.id_producto,
    nombre: row.PRODUCTO ?? row.nombre ?? '',
    cantidad: Number(row.CANTIDAD ?? row.cantidad ?? 0),
    precio_unitario: Number(row.PRECIO_UNITARIO ?? row.precio_unitario ?? 0),
    subtotal_linea: Number(row.SUBTOTAL_LINEA ?? row.subtotal_linea ?? 0),
  };
}

function normalizeFacturaDetalle(f) {
  return {
    id_factura: f.id_factura,
    numero_factura: f.numero_factura,
    fecha_factura: f.fecha_factura,
    subtotal: Number(f.subtotal ?? 0),
    impuestos: Number(f.impuestos ?? 0),
    descuento: Number(f.descuento ?? 0),
    total: Number(f.total ?? 0),
    metodo_pago: f.metodo_pago,
    estado: f.estado,
    observaciones: f.observaciones ?? '',
    usuario: f.usuario ?? '',
    cliente: f.cliente ?? null,
    detalle: (f.detalle || []).map(normalizeDetalle),
  };
}

/**
 * Crea una factura. El backend recalcula TODO (precios, IVA, total).
 */
export async function crearFactura(payload) {
  const res = await api.post('/facturas', payload);
  return extractData(res);
}

/**
 * Lista facturas. Filtros backend: fecha (YYYY-MM-DD), estado (PAGADA|ANULADA).
 */
export async function listarFacturas(params = {}) {
  const res = await api.get('/facturas', { params });
  const rows = extractData(res) || [];
  return rows.map(normalizeFacturaLista);
}

/**
 * Detalle completo de una factura (cabecera + cliente + líneas).
 */
export async function obtenerFactura(id) {
  const res = await api.get(`/facturas/${id}`);
  return normalizeFacturaDetalle(extractData(res));
}

/**
 * Anula una factura (solo si está PAGADA).
 */
export async function anularFactura(id) {
  const res = await api.put(`/facturas/${id}/anular`);
  return extractData(res);
}

/**
 * Pedidos activos (GET /api/facturas/activos): facturas PAGADA con
 * estado_envio PENDIENTE, más antiguas primero. El backend devuelve ya
 * en minúsculas { id_factura, numero_factura, fecha_factura, total,
 * cliente:{nombre,telefono}, productos:[{nombre,cantidad}] }.
 */
export async function listarPedidosActivos() {
  const res = await api.get('/facturas/activos');
  const rows = extractData(res) || [];
  return rows.map((p) => ({
    id_factura: p.id_factura,
    numero_factura: p.numero_factura,
    fecha_factura: p.fecha_factura,
    total: Number(p.total ?? 0),
    cliente: {
      nombre: p.cliente?.nombre ?? null,
      telefono: p.cliente?.telefono ?? null,
    },
    productos: (p.productos || []).map((x) => ({
      nombre: x.nombre ?? '',
      cantidad: Number(x.cantidad ?? 0),
    })),
  }));
}

/**
 * Marca un pedido como ENVIADO (PUT /api/facturas/:id/enviar).
 * Devuelve la factura actualizada completa (mismo shape que obtenerFactura).
 */
export async function marcarPedidoEnviado(id) {
  const res = await api.put(`/facturas/${id}/enviar`);
  return normalizeFacturaDetalle(extractData(res));
}

/**
 * Trae el PDF de la factura como Blob (con auth).
 */
export async function obtenerPdfFactura(id) {
  return fetchBlob(`/facturas/${id}/pdf`);
}