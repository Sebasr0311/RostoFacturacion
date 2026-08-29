// ============================================================
// controllers/reporteController.js — Reportes de ventas.
//   GET /api/reportes/ventas-dia          -> resumen JSON del día
//   GET /api/reportes/ventas-dia/excel    -> .xlsx del día
//   GET /api/reportes/ventas-rango        -> resumen JSON por rango (?desde&hasta)
//   GET /api/reportes/ventas-rango/excel  -> .xlsx por rango
// ============================================================

const { ok, fail } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  resumenVentas,
  detalleFacturas,
  detalleProductos,
} = require('../services/reporteService');
const { generarExcelVentas } = require('../services/excelService');

const validaFecha = (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * Construye la respuesta JSON de ventas (día o rango).
 */
const ventasJson = asyncHandler(async (req, res) => {
  const { desde, hasta } = req.query;
  if (!validaFecha(desde) || !validaFecha(hasta)) {
    return fail(res, 400, 'Las fechas deben tener formato YYYY-MM-DD.');
  }
  try {
    const resumen = await resumenVentas({ desde: desde || null, hasta: hasta || null });
    const facturas = await detalleFacturas({ desde: desde || null, hasta: hasta || null });
    const productos = await detalleProductos({ desde: desde || null, hasta: hasta || null });
    return ok(res, { resumen, facturas, productos }, 'Reporte de ventas generado.');
  } catch (err) {
    return fail(res, 500, 'Ocurrió un error al generar el reporte.');
  }
});

/**
 * Construye el Excel de ventas (día o rango).
 */
const ventasExcel = asyncHandler(async (req, res) => {
  const { desde, hasta } = req.query;
  if (!validaFecha(desde) || !validaFecha(hasta)) {
    return fail(res, 400, 'Las fechas deben tener formato YYYY-MM-DD.');
  }
  const sDesde = desde || null;
  const sHasta = hasta || null;

  const resumen = await resumenVentas({ desde: sDesde, hasta: sHasta });
  const factRows = await detalleFacturas({ desde: sDesde, hasta: sHasta });
  const prodRows = await detalleProductos({ desde: sDesde, hasta: sHasta });

  // Mapear filas (claves en mayúsculas desde OUT_FORMAT_OBJECT) al shape del servicio.
  const facturas = factRows.map((r) => ({
    numero_factura: r.NUMERO_FACTURA,
    fecha_factura: r.HORA,
    cliente: r.CLIENTE,
    metodo_pago: r.METODO_PAGO,
    total: Number(r.TOTAL),
  }));
  const detalle = prodRows.map((r) => ({
    numero_factura: r.NUMERO_FACTURA,
    producto: r.PRODUCTO,
    cantidad: Number(r.CANTIDAD),
    precio_unitario: Number(r.PRECIO_UNITARIO),
    subtotal_linea: Number(r.SUBTOTAL_LINEA),
  }));

  const buffer = await generarExcelVentas({ resumen, facturas, detalle });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="reporte-ventas.xlsx"'
  );
  return res.send(Buffer.from(buffer));
});

/**
 * GET /api/reportes/ventas-dia
 */
const ventasDia = (req, res) => ventasJson(req, res);

/**
 * GET /api/reportes/ventas-dia/excel
 */
const ventasDiaExcel = (req, res) => ventasExcel(req, res);

/**
 * GET /api/reportes/ventas-rango?desde&hasta
 */
const ventasRango = (req, res) => ventasJson(req, res);

/**
 * GET /api/reportes/ventas-rango/excel?desde&hasta
 */
const ventasRangoExcel = (req, res) => ventasExcel(req, res);

module.exports = { ventasDia, ventasDiaExcel, ventasRango, ventasRangoExcel };
