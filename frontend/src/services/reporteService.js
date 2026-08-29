// ============================================================
// services/reporteService.js — Reportes de ventas.
//
// El backend devuelve (claves en minúsculas, ya mapeadas):
//   { resumen: { total_vendido, numero_facturas, ticket_promedio,
//                producto_mas_vendido, producto_mas_vendido_cantidad,
//                forma_pago_top, forma_pago_top_transacciones },
//     facturas: [{ numero_factura, fecha_factura (hora), cliente,
//                  metodo_pago, total }],
//     productos: [{ numero_factura, producto, cantidad,
//                   precio_unitario, subtotal_linea }] }
// ============================================================

import { api, extractData, fetchBlob } from './api';

/**
 * Resumen de ventas.
 * - Sin rango: GET /api/reportes/ventas-dia (día actual de la BD).
 * - Con rango: GET /api/reportes/ventas-rango?desde&hasta (YYYY-MM-DD).
 */
export async function obtenerResumenVentas({ desde, hasta } = {}) {
  const hasRange = Boolean(desde && hasta);
  const url = hasRange ? '/reportes/ventas-rango' : '/reportes/ventas-dia';
  const params = hasRange ? { desde, hasta } : {};
  const res = await api.get(url, { params });
  return extractData(res);
}

/**
 * Excel de ventas del día (GET /api/reportes/ventas-dia/excel).
 */
export async function obtenerExcelVentasDia() {
  return fetchBlob('/reportes/ventas-dia/excel');
}

/**
 * Excel de ventas por rango (GET /api/reportes/ventas-rango/excel).
 */
export async function obtenerExcelVentasRango(desde, hasta) {
  return fetchBlob('/reportes/ventas-rango/excel', { params: { desde, hasta } });
}