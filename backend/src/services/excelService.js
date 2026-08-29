// ============================================================
// services/excelService.js — Exportación a Excel (.xlsx) de ventas.
//
// Genera un libro con 3 hojas EXACTAS:
//   - "Resumen": total vendido, nº facturas, ticket promedio,
//     producto más vendido, forma de pago con más transacciones.
//   - "Detalle Facturas": una fila por factura (nº, hora, cliente,
//     método de pago, total).
//   - "Detalle Productos": una fila por línea (factura, producto,
//     cantidad, precio unitario, subtotal).
//
// Formato: encabezados en negrita con color de marca (naranja/rojo),
// columnas autoajustadas y formato moneda COP con separador de miles.
// ============================================================

const ExcelJS = require('exceljs');

// Color de marca (rojo/naranja comida). Cabeceras en blanco sobre este fondo.
const BRAND_COLOR = 'FFC0392B';
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } };

// Formato de moneda COP: separador de miles sin decimales.
const COP_FORMAT = '#,##0';

/**
 * Aplica estilo de cabecera a una fila reduciendo el rango con datos.
 * @param {import('exceljs').Row} headerRow
 * @param {number} colCount
 */
function styleHeader(headerRow, colCount) {
  headerRow.height = 20;
  for (let c = 1; c <= colCount; c++) {
    const cell = headerRow.getCell(c);
    cell.font = HEADER_FONT;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_COLOR },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF7B241C' } },
    };
  }
}

/**
 * Auto-ajusta el ancho de las columnas según el contenido máximo.
 * @param {import('exceljs').Worksheet} ws
 * @param {number} colCount
 */
function autoFit(ws, colCount) {
  ws.columns.forEach((col, idx) => {
    if (idx >= colCount) return;
    let maxLen = (col.header ? String(col.header).length : 10) + 2;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const v = cell.value == null ? '' : String(cell.value);
      maxLen = Math.max(maxLen, v.length + 2);
    });
    col.width = Math.min(maxLen, 60);
  });
}

/**
 * Genera el workbook de ventas y devuelve un Buffer .xlsx.
 *
 * @param {object} data
 * @param {object} data.resumen { total_vendido, numero_facturas, ticket_promedio,
 *                                producto_mas_vendido, forma_pago_top }
 * @param {Array} data.facturas filas: { numero_factura, fecha_factura, cliente,
 *                                 metodo_pago, total }
 * @param {Array} data.detalle filas: { numero_factura, producto, cantidad,
 *                                 precio_unitario, subtotal_linea }
 * @returns {Promise<Buffer>}
 */
async function generarExcelVentas({ resumen, facturas, detalle }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Rosto Facturación';
  wb.created = new Date();

  // ---------- Hoja 1: Resumen ----------
  const ws1 = wb.addWorksheet('Resumen');
  ws1.columns = [{ header: 'Métrica' }, { header: 'Valor' }];
  const rows1 = [
    ['Total vendido', resumen.total_vendido],
    ['Número de facturas', resumen.numero_facturas],
    ['Ticket promedio', resumen.ticket_promedio],
    ['Producto más vendido', resumen.producto_mas_vendido],
    ['Forma de pago con más transacciones', resumen.forma_pago_top],
  ];
  rows1.forEach((r) => ws1.addRow(r));
  styleHeader(ws1.getRow(1), 2);
  // Formato de moneda en la columna de valores (filas 2..n)
  for (let r = 2; r <= rows1.length + 1; r++) {
    const cell = ws1.getCell(r, 2);
    if (typeof cell.value === 'number') {
      cell.numFmt = COP_FORMAT;
      cell.alignment = { horizontal: 'right' };
    }
  }
  autoFit(ws1, 2);

  // ---------- Hoja 2: Detalle Facturas ----------
  const ws2 = wb.addWorksheet('Detalle Facturas');
  ws2.columns = [
    { header: 'N° Factura' },
    { header: 'Hora' },
    { header: 'Cliente' },
    { header: 'Método de pago' },
    { header: 'Total' },
  ];
  (facturas || []).forEach((f) => {
    ws2.addRow([f.numero_factura, f.fecha_factura, f.cliente, f.metodo_pago, f.total]);
  });
  styleHeader(ws2.getRow(1), 5);
  for (let r = 2; r <= (facturas || []).length + 1; r++) {
    ws2.getCell(r, 5).numFmt = COP_FORMAT; // Total
  }
  autoFit(ws2, 5);

  // ---------- Hoja 3: Detalle Productos ----------
  const ws3 = wb.addWorksheet('Detalle Productos');
  ws3.columns = [
    { header: 'N° Factura' },
    { header: 'Producto' },
    { header: 'Cantidad' },
    { header: 'Precio unitario' },
    { header: 'Subtotal' },
  ];
  (detalle || []).forEach((d) => {
    ws3.addRow([d.numero_factura, d.producto, d.cantidad, d.precio_unitario, d.subtotal_linea]);
  });
  styleHeader(ws3.getRow(1), 5);
  for (let r = 2; r <= (detalle || []).length + 1; r++) {
    ws3.getCell(r, 4).numFmt = COP_FORMAT; // Precio unitario
    ws3.getCell(r, 5).numFmt = COP_FORMAT; // Subtotal
  }
  autoFit(ws3, 5);

  return wb.xlsx.writeBuffer();
}

module.exports = { generarExcelVentas };
