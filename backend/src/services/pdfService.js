// ============================================================
// services/pdfService.js — Generación de PDF de factura (pdfkit).
//
// Genera un PDF con: encabezado del restaurante, datos del cliente,
// tabla de líneas (cantidad, producto, precio unitario, subtotal),
// subtotal, impuesto, descuento, total, método de pago, número de
// factura, fecha y estado. Devuelve un Buffer listo para la respuesta.
// ============================================================

const PDFDocument = require('pdfkit');

// Datos del restaurante (encabezado). Ajustar en producción.
const RESTAURANTE = {
  nombre: 'Rosto — Pollo a la Brasa',
  direccion: 'Av. Principal #23-45, Bogotá',
  telefono: '+57 300 000 0000',
  nit: 'NIT 900.000.000-0',
};

/**
 * Formatea un número como moneda COP (pesos colombianos).
 * @param {number} n
 * @returns {string}
 */
function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

/**
 * Construye el PDF de una factura.
 * @param {object} factura datos de cabecera
 * @param {Array} factura.detalle líneas [{nombre, cantidad, precio_unitario, subtotal_linea}]
 * @returns {Promise<Buffer>}
 */
function generarPdfFactura(factura) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // --- Encabezado ---
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#c0392b').text(RESTAURANTE.nombre, { align: 'center' });
    doc.font('Helvetica').fontSize(10).fillColor('#333333');
    doc.text(RESTAURANTE.direccion, { align: 'center' });
    doc.text(`${RESTAURANTE.telefono}   •   ${RESTAURANTE.nit}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#c0392b').lineWidth(1.5).stroke();
    doc.moveDown(0.5);

    // --- Datos de la factura ---
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111111').text('FACTURA');
    doc.font('Helvetica').fontSize(10).fillColor('#333333');
    doc.text(`N° ${factura.numero_factura || '—'}`);
    doc.text(`Fecha: ${factura.fecha_factura || '—'}`);
    doc.text(`Estado: ${factura.estado || 'PAGADA'}`);
    doc.text(`Método de pago: ${factura.metodo_pago || '—'}`);
    doc.moveDown(0.5);

    // --- Datos del cliente ---
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text('Cliente');
    doc.font('Helvetica').fontSize(10).fillColor('#333333');
    const cli = factura.cliente || {};
    doc.text(`Nombre: ${cli.NOMBRE || cli.nombre || 'Consumidor final'}`);
    if (cli.DOCUMENTO || cli.documento) doc.text(`Documento: ${cli.DOCUMENTO || cli.documento}`);
    if (cli.TELEFONO || cli.telefono) doc.text(`Teléfono: ${cli.TELEFONO || cli.telefono}`);
    doc.moveDown(0.5);

    // --- Tabla de líneas ---
    const y0 = doc.y;
    doc.moveTo(40, y0).lineTo(555, y0).strokeColor('#999999').lineWidth(0.5).stroke();

    const headers = ['Cant.', 'Producto', 'P. Unitario', 'Subtotal'];
    const colX = [40, 80, 410, 490];
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.rect(40, y0, 515, 18).fill('#c0392b');
    doc.fillColor('#ffffff');
    doc.text(headers[0], colX[0] + 6, y0 + 5, { width: 40 });
    doc.text(headers[1], colX[1], y0 + 5, { width: 320 });
    doc.text(headers[2], colX[2], y0 + 5, { width: 70, align: 'right' });
    doc.text(headers[3], colX[3] + 8, y0 + 5, { width: 70, align: 'right' });

    let yy = y0 + 18;
    const rows = factura.detalle || [];
    doc.font('Helvetica').fontSize(9).fillColor('#222222');

    for (const r of rows) {
      doc.text(String(r.cantidad), colX[0] + 6, yy, { width: 40 });
      doc.text(r.nombre || '—', colX[1], yy, { width: 320 });
      doc.text(formatCOP(r.precio_unitario), colX[2], yy, { width: 70, align: 'right' });
      doc.text(formatCOP(r.subtotal_linea), colX[3] + 8, yy, { width: 70, align: 'right' });
      yy += 16;
    }

    drawLine(doc, yy);

    // --- Totales ---
    yy += 6;
    const totals = [
      ['Subtotal', factura.subtotal],
      ['IVA (impuesto)', factura.impuestos],
      ['Descuento', factura.descuento],
      ['TOTAL', factura.total],
    ];
    totals.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fontSize(label === 'TOTAL' ? 12 : 10).fillColor(label === 'TOTAL' ? '#c0392b' : '#111111');
      doc.text(`${label}:`, 360, yy, { width: 120, align: 'right' });
      doc.text(formatCOP(value), 480, yy, { width: 70, align: 'right' });
      yy += 16;
    });

    if (factura.observaciones) {
      yy += 6;
      doc.font('Helvetica').fontSize(9).fillColor('#555555');
      doc.text(`Observaciones: ${factura.observaciones}`, 40, yy, { width: 515 });
    }

    yy += 24;
    doc.moveTo(40, yy).lineTo(555, yy).strokeColor('#999999').lineWidth(0.5).stroke();
    yy += 6;
    doc.font('Helvetica').fontSize(9).fillColor('#777777').text(
      '¡Gracias por su compra! Este documento es una factura representativa del sistema interno del restaurante.',
      40,
      yy,
      { width: 515, align: 'center' }
    );

    doc.end();
  });
}

function drawLine(doc, y) {
  doc.moveTo(40, y).lineTo(555, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
}

module.exports = { generarPdfFactura, formatCOP };
