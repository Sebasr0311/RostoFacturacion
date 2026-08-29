// ============================================================
// services/reporteService.js — Consultas de reportes de ventas.
//
// Todos los reportes consideran SOLO facturas estado='PAGADA'.
// "Producto más vendido" y "forma de pago con más transacciones" se
// calculan sobre las tablas reales (detalle_factura / facturas), no
// sobre la vista vw_ventas_dia.
// ============================================================

const { getConnection } = require('../config/oracle');

/**
 * Construye el filtro de rango de fechas en SQL.
 * @param {object} conn
 * @param {string|null} desde 'YYYY-MM-DD'
 * @param {string|null} hasta 'YYYY-MM-DD'
 * @returns {{ where: string, binds: object }}
 */
function rangoFiltro(desde, hasta) {
  const conds = [`f.estado = 'PAGADA'`];
  const binds = {};
  const valida = (v) => v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  if (valida(desde)) {
    conds.push(`TRUNC(f.fecha_factura) >= TO_DATE(:desde, 'YYYY-MM-DD')`);
    binds.desde = desde;
  }
  if (valida(hasta)) {
    conds.push(`TRUNC(f.fecha_factura) <= TO_DATE(:hasta, 'YYYY-MM-DD')`);
    binds.hasta = hasta;
  }
  return { where: conds.join(' AND '), binds };
}

/**
 * Genera el resumen de ventas para un día o un rango.
 * @param {string|null} desde fecha 'YYYY-MM-DD' (para ventas-dia puede venir hoy)
 * @param {string|null} hasta
 * @returns {Promise<object>} resumen
 */
async function resumenVentas({ desde = null, hasta = null }) {
  const conn = await getConnection();
  try {
    // Para "ventas del día" tomamos el día actual de la BD.
    let effDesde = desde;
    let effHasta = hasta;
    if (!desde && !hasta) {
      const today = await conn.execute(`SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD') AS "dia" FROM dual`);
      const dia = today.rows[0].DIA;
      effDesde = dia;
      effHasta = dia;
    }

    const { where, binds } = rangoFiltro(effDesde, effHasta);

    // --- Total vendido, nº facturas, ticket promedio ---
    const agg = await conn.execute(
      `SELECT NVL(SUM(f.total), 0) AS total_vendido,
              COUNT(*) AS numero_facturas,
              NVL(AVG(f.total), 0) AS ticket_promedio
         FROM facturas f
        WHERE ${where}`,
      binds
    );
    const a = agg.rows[0] || {};

    // --- Producto más vendido (por cantidad) sobre tablas reales ---
    const prod = await conn.execute(
      `SELECT p.nombre AS producto, SUM(d.cantidad) AS total_cantidad, SUM(d.subtotal_linea) AS total_venta
         FROM detalle_factura d
         JOIN facturas f ON f.id_factura = d.id_factura
         JOIN productos p ON p.id_producto = d.id_producto
        WHERE ${where}
        GROUP BY p.nombre
        ORDER BY total_cantidad DESC
       FETCH FIRST 1 ROWS ONLY`,
      binds
    );

    // --- Forma de pago con más transacciones ---
    const pago = await conn.execute(
      `SELECT f.metodo_pago AS metodo_pago, COUNT(*) AS transacciones
         FROM facturas f
        WHERE ${where}
        GROUP BY f.metodo_pago
        ORDER BY transacciones DESC
       FETCH FIRST 1 ROWS ONLY`,
      binds
    );

    const resumen = {
      total_vendido: Number(a.TOTAL_VENDIDO || 0),
      numero_facturas: Number(a.NUMERO_FACTURAS || 0),
      ticket_promedio: Number(a.TICKET_PROMEDIO || 0),
      producto_mas_vendido: prod.rows.length ? prod.rows[0].PRODUCTO : null,
      producto_mas_vendido_cantidad: prod.rows.length ? Number(prod.rows[0].TOTAL_CANTIDAD || 0) : 0,
      forma_pago_top: pago.rows.length ? pago.rows[0].METODO_PAGO : null,
      forma_pago_top_transacciones: pago.rows.length ? Number(pago.rows[0].TRANSACCIONES || 0) : 0,
    };
    return resumen;
  } finally {
    await conn.close();
  }
}

/**
 * Lista de facturas (detalle facturas) para el rango.
 * Una fila por factura: número, hora, cliente, método de pago, total.
 * @returns {Promise<Array>}
 */
async function detalleFacturas({ desde = null, hasta = null }) {
  const conn = await getConnection();
  try {
    let effDesde = desde;
    let effHasta = hasta;
    if (!desde && !hasta) {
      const today = await conn.execute(`SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD') AS "dia" FROM dual`);
      effDesde = today.rows[0].DIA;
      effHasta = today.rows[0].DIA;
    }
    const { where, binds } = rangoFiltro(effDesde, effHasta);
    const result = await conn.execute(
      `SELECT f.numero_factura,
              TO_CHAR(f.fecha_factura, 'HH24:MI:SS') AS hora,
              NVL(c.nombre, 'CONSUMIDOR FINAL') AS cliente,
              f.metodo_pago,
              f.total
         FROM facturas f
         LEFT JOIN clientes c ON c.id_cliente = f.id_cliente
        WHERE ${where}
        ORDER BY f.fecha_factura ASC`,
      binds
    );
    return result.rows;
  } finally {
    await conn.close();
  }
}

/**
 * Lista de líneas (detalle productos) para el rango.
 * Una fila por línea: factura, producto, cantidad, precio unitario, subtotal.
 * @returns {Promise<Array>}
 */
async function detalleProductos({ desde = null, hasta = null }) {
  const conn = await getConnection();
  try {
    let effDesde = desde;
    let effHasta = hasta;
    if (!desde && !hasta) {
      const today = await conn.execute(`SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD') AS "dia" FROM dual`);
      effDesde = today.rows[0].DIA;
      effHasta = today.rows[0].DIA;
    }
    const { where, binds } = rangoFiltro(effDesde, effHasta);
    const result = await conn.execute(
      `SELECT f.numero_factura, p.nombre AS producto, d.cantidad,
              d.precio_unitario, d.subtotal_linea
         FROM detalle_factura d
         JOIN facturas f ON f.id_factura = d.id_factura
         JOIN productos p ON p.id_producto = d.id_producto
        WHERE ${where}
        ORDER BY f.fecha_factura ASC`,
      binds
    );
    return result.rows;
  } finally {
    await conn.close();
  }
}

module.exports = { resumenVentas, detalleFacturas, detalleProductos };
