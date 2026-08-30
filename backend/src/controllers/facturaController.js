// ============================================================
// controllers/facturaController.js — Facturación.
//   POST /api/facturas            -> crear factura
//   GET  /api/facturas            -> listar (filtros fecha, estado)
//   GET  /api/facturas/activos    -> pedidos activos (PAGADA + envio PENDIENTE)
//   GET  /api/facturas/:id        -> detalle completo
//   GET  /api/facturas/:id/pdf    -> PDF de la factura
//   PUT  /api/facturas/:id/enviar -> marcar factura como ENVIADA
//   PUT  /api/facturas/:id/anular -> anular factura
// ============================================================

const { z } = require('zod');

const { ok, fail } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { zodErrorMessages } = require('../utils/zodHelpers');
const { getConnection } = require('../config/oracle');
const { translateOracleError } = require('../utils/oracleErrors');
const { crearFactura } = require('../services/facturaService');
const { generarPdfFactura } = require('../services/pdfService');

const crearSchema = z.object({
  cliente: z
    .object({
      nombre: z.string().max(150).optional(),
      documento: z.string().max(30).optional(),
      telefono: z.string().max(30).optional(),
      correo: z.string().email('Correo inválido.').max(150).optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        id_producto: z.coerce.number().int().positive('Producto inválido.'),
        cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0.'),
      })
    )
    .min(1, 'Debe incluir al menos un producto.'),
  metodo_pago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO'], {
    required_error: 'El método de pago es obligatorio.',
  }),
  descuento: z.coerce.number().min(0, 'El descuento no puede ser negativo.').optional().default(0),
  observaciones: z.string().max(500).optional().default(''),
  aplicar_iva: z.boolean().optional().default(false),
});

/**
 * POST /api/facturas — crea la factura (cálculo 100% en backend).
 */
const crear = asyncHandler(async (req, res) => {
  const parsed = crearSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return fail(res, 400, 'Datos de la factura inválidos.', zodErrorMessages(parsed.error));
  }
  const { cliente, items, metodo_pago, descuento, observaciones, aplicar_iva } = parsed.data;
  const id_usuario = req.usuario && req.usuario.id_usuario;

  try {
    const factura = await crearFactura({
      cliente,
      items,
      metodo_pago,
      descuento,
      observaciones,
      aplicar_iva,
      id_usuario,
    });
    return ok(res, factura, 'Factura generada correctamente.', 201);
  } catch (err) {
    if (err.status === 400) {
      return fail(res, 400, err.message);
    }
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  }
});

/**
 * GET /api/facturas  (filtros: fecha YYYY-MM-DD, estado)
 */
const listar = asyncHandler(async (req, res) => {
  const { fecha, estado } = req.query;
  const conn = await getConnection();
  try {
    let sql = `SELECT f.id_factura, f.numero_factura, f.fecha_factura, f.subtotal,
                      f.impuestos, f.descuento, f.total, f.metodo_pago, f.estado,
                      f.estado_envio, f.fecha_envio, f.aplicar_iva,
                      c.nombre AS cliente
                 FROM facturas f
                 LEFT JOIN clientes c ON c.id_cliente = f.id_cliente
                WHERE 1 = 1`;
    const binds = {};
    if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      // comparar solo la parte de fecha (TRUNC sobre la columna)
      sql += ` AND TRUNC(f.fecha_factura) = TO_DATE(:fecha, 'YYYY-MM-DD')`;
      binds.fecha = fecha;
    }
    if (estado && (estado === 'PAGADA' || estado === 'ANULADA')) {
      sql += ` AND f.estado = :estado`;
      binds.estado = estado;
    }
    sql += ` ORDER BY f.fecha_factura DESC`;
    const result = await conn.execute(sql, binds);
    return ok(res, result.rows, 'Facturas obtenidas.');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * GET /api/facturas/activos — pedidos activos: facturas PAGADA con
 * estado_envio 'PENDIENTE'. Ordenadas por fecha_factura ASC (más
 * antiguas primero). Cada elemento incluye datos del cliente y un
 * resumen de productos (nombre, cantidad) desde detalle_factura.
 */
const activos = asyncHandler(async (req, res) => {
  const conn = await getConnection();
  try {
    const head = await conn.execute(
      `SELECT f.id_factura, f.numero_factura, f.fecha_factura, f.total,
              c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
         FROM facturas f
         LEFT JOIN clientes c ON c.id_cliente = f.id_cliente
        WHERE f.estado = 'PAGADA'
          AND f.estado_envio = 'PENDIENTE'
        ORDER BY f.fecha_factura ASC`
    );
    const ids = head.rows.map((r) => r.ID_FACTURA);
    const detalles = new Map();
    if (ids.length > 0) {
      const ph = ids.map((_, i) => `:id${i}`).join(', ');
      const binds = {};
      ids.forEach((id, i) => { binds[`id${i}`] = id; });
      const det = await conn.execute(
        `SELECT d.id_factura, p.nombre, d.cantidad
           FROM detalle_factura d
           JOIN productos p ON p.id_producto = d.id_producto
          WHERE d.id_factura IN (${ph})
          ORDER BY d.id_factura`,
        binds
      );
      for (const row of det.rows) {
        if (!detalles.has(row.ID_FACTURA)) detalles.set(row.ID_FACTURA, []);
        detalles.get(row.ID_FACTURA).push({
          nombre: row.NOMBRE,
          cantidad: Number(row.CANTIDAD),
        });
      }
    }
    const data = head.rows.map((r) => ({
      id_factura: r.ID_FACTURA,
      numero_factura: r.NUMERO_FACTURA,
      fecha_factura: r.FECHA_FACTURA,
      total: Number(r.TOTAL),
      cliente: {
        nombre: r.CLIENTE_NOMBRE,
        telefono: r.CLIENTE_TELEFONO,
      },
      productos: detalles.get(r.ID_FACTURA) || [],
    }));
    return ok(res, data, 'Pedidos activos obtenidos.');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * GET /api/facturas/:id — detalle completo (cabecera + líneas + cliente).
 */
const obtener = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 400, 'Identificador de factura inválido.');
  }
  const conn = await getConnection();
  try {
    const cab = await conn.execute(
      `SELECT f.id_factura, f.numero_factura, f.id_cliente, f.fecha_factura,
              f.subtotal, f.impuestos, f.descuento, f.total, f.metodo_pago,
              f.estado, f.estado_envio, f.fecha_envio, f.aplicar_iva, f.observaciones,
              c.nombre AS cliente_nombre, c.documento AS cliente_documento,
              c.telefono AS cliente_telefono, c.correo AS cliente_correo,
              u.nombre_completo AS usuario
         FROM facturas f
         LEFT JOIN clientes c ON c.id_cliente = f.id_cliente
         LEFT JOIN usuarios u ON u.id_usuario = f.id_usuario
        WHERE f.id_factura = :id`,
      { id }
    );
    if (cab.rows.length === 0) {
      return fail(res, 404, 'Factura no encontrada.');
    }
    const f = cab.rows[0];

    const det = await conn.execute(
      `SELECT d.id_detalle, d.id_producto, d.cantidad, d.precio_unitario, d.subtotal_linea,
              p.nombre AS producto
         FROM detalle_factura d
         LEFT JOIN productos p ON p.id_producto = d.id_producto
        WHERE d.id_factura = :id
        ORDER BY d.id_detalle`,
      { id }
    );

    return ok(
      res,
      {
        id_factura: f.ID_FACTURA,
        numero_factura: f.NUMERO_FACTURA,
        fecha_factura: f.FECHA_FACTURA,
        subtotal: Number(f.SUBTOTAL),
        impuestos: Number(f.IMPUESTOS),
        descuento: Number(f.DESCUENTO),
        total: Number(f.TOTAL),
        metodo_pago: f.METODO_PAGO,
        estado: f.ESTADO,
        estado_envio: f.ESTADO_ENVIO,
        fecha_envio: f.FECHA_ENVIO,
        aplicar_iva: Boolean(f.APLICAR_IVA),
        observaciones: f.OBSERVACIONES,
        usuario: f.USUARIO,
        cliente: {
          nombre: f.CLIENTE_NOMBRE,
          documento: f.CLIENTE_DOCUMENTO,
          telefono: f.CLIENTE_TELEFONO,
          correo: f.CLIENTE_CORREO,
        },
        detalle: det.rows,
      },
      'Factura obtenida.'
    );
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * GET /api/facturas/:id/pdf — genera y responde el PDF de la factura.
 */
const pdf = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 400, 'Identificador de factura inválido.');
  }
  const conn = await getConnection();
  try {
    const cab = await conn.execute(
      `SELECT f.id_factura, f.numero_factura, f.fecha_factura, f.subtotal,
              f.impuestos, f.descuento, f.total, f.metodo_pago, f.estado, f.observaciones,
              c.nombre, c.documento, c.telefono, c.correo
         FROM facturas f
         LEFT JOIN clientes c ON c.id_cliente = f.id_cliente
        WHERE f.id_factura = :id`,
      { id }
    );
    if (cab.rows.length === 0) {
      return fail(res, 404, 'Factura no encontrada.');
    }
    const f = cab.rows[0];

    const det = await conn.execute(
      `SELECT d.cantidad, d.precio_unitario, d.subtotal_linea, p.nombre
         FROM detalle_factura d
         LEFT JOIN productos p ON p.id_producto = d.id_producto
        WHERE d.id_factura = :id
        ORDER BY d.id_detalle`,
      { id }
    );

    const facturaData = {
      numero_factura: f.NUMERO_FACTURA,
      fecha_factura: f.FECHA_FACTURA,
      estado: f.ESTADO,
      metodo_pago: f.METODO_PAGO,
      subtotal: Number(f.SUBTOTAL),
      impuestos: Number(f.IMPUESTOS),
      descuento: Number(f.DESCUENTO),
      total: Number(f.TOTAL),
      observaciones: f.OBSERVACIONES,
      cliente: { NOMBRE: f.NOMBRE, DOCUMENTO: f.DOCUMENTO, TELEFONO: f.TELEFONO, CORREO: f.CORREO },
      detalle: det.rows,
    };

    const buffer = await generarPdfFactura(facturaData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="factura-${f.NUMERO_FACTURA}.pdf"`
    );
    return res.send(buffer);
  } finally {
    await conn.close();
  }
});

/**
 * PUT /api/facturas/:id/anular — pone el estado en 'ANULADA'.
 */
const anular = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 400, 'Identificador de factura inválido.');
  }
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `UPDATE facturas SET estado = 'ANULADA' WHERE id_factura = :id AND estado = 'PAGADA'`,
      { id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      // Puede no existir o ya estar anulada
      const exists = await conn.execute(`SELECT estado FROM facturas WHERE id_factura = :id`, { id });
      if (exists.rows.length === 0) {
        return fail(res, 404, 'Factura no encontrada.');
      }
      return fail(res, 409, 'La factura ya se encuentra anulada o no puede anularse.');
    }
    return ok(res, null, 'Factura anulada correctamente.');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * PUT /api/facturas/:id/enviar — marca la factura como ENVIADA
 * (estado_envio='ENVIADO', fecha_envio=SYSTIMESTAMP). Rechaza con 409
 * si la factura ya fue enviada o si está ANULADA. Responde la factura
 * actualizada completa (cabecera + líneas + cliente).
 */
const enviar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 400, 'Identificador de factura inválido.');
  }
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `UPDATE facturas
          SET estado_envio = 'ENVIADO', fecha_envio = SYSTIMESTAMP
        WHERE id_factura = :id
          AND estado = 'PAGADA'
          AND estado_envio = 'PENDIENTE'`,
      { id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      const exists = await conn.execute(
        `SELECT estado, estado_envio FROM facturas WHERE id_factura = :id`,
        { id }
      );
      if (exists.rows.length === 0) {
        return fail(res, 404, 'Factura no encontrada.');
      }
      const f = exists.rows[0];
      if (f.ESTADO === 'ANULADA') {
        return fail(res, 409, 'La factura está anulada y no puede enviarse.');
      }
      if (f.ESTADO_ENVIO === 'ENVIADO') {
        return fail(res, 409, 'La factura ya fue enviada.');
      }
      return fail(res, 409, 'La factura no puede enviarse en su estado actual.');
    }
    const cab = await conn.execute(
      `SELECT f.id_factura, f.numero_factura, f.id_cliente, f.fecha_factura,
              f.subtotal, f.impuestos, f.descuento, f.total, f.metodo_pago,
              f.estado, f.estado_envio, f.fecha_envio, f.aplicar_iva, f.observaciones,
              c.nombre AS cliente_nombre, c.documento AS cliente_documento,
              c.telefono AS cliente_telefono, c.correo AS cliente_correo,
              u.nombre_completo AS usuario
         FROM facturas f
         LEFT JOIN clientes c ON c.id_cliente = f.id_cliente
         LEFT JOIN usuarios u ON u.id_usuario = f.id_usuario
        WHERE f.id_factura = :id`,
      { id }
    );
    const f = cab.rows[0];

    const det = await conn.execute(
      `SELECT d.id_detalle, d.id_producto, d.cantidad, d.precio_unitario, d.subtotal_linea,
              p.nombre AS producto
         FROM detalle_factura d
         LEFT JOIN productos p ON p.id_producto = d.id_producto
        WHERE d.id_factura = :id
        ORDER BY d.id_detalle`,
      { id }
    );

    return ok(
      res,
      {
        id_factura: f.ID_FACTURA,
        numero_factura: f.NUMERO_FACTURA,
        fecha_factura: f.FECHA_FACTURA,
        subtotal: Number(f.SUBTOTAL),
        impuestos: Number(f.IMPUESTOS),
        descuento: Number(f.DESCUENTO),
        total: Number(f.TOTAL),
        metodo_pago: f.METODO_PAGO,
        estado: f.ESTADO,
        estado_envio: f.ESTADO_ENVIO,
        fecha_envio: f.FECHA_ENVIO,
        aplicar_iva: Boolean(f.APLICAR_IVA),
        observaciones: f.OBSERVACIONES,
        usuario: f.USUARIO,
        cliente: {
          nombre: f.CLIENTE_NOMBRE,
          documento: f.CLIENTE_DOCUMENTO,
          telefono: f.CLIENTE_TELEFONO,
          correo: f.CLIENTE_CORREO,
        },
        detalle: det.rows,
      },
      'Factura marcada como enviada.'
    );
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

module.exports = { crear, listar, obtener, pdf, anular, activos, enviar };
