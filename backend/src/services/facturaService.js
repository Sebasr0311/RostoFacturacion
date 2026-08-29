// ============================================================
// services/facturaService.js — Lógica de creación de facturas.
//
// El cálculo de la factura SIEMPRE ocurre en el backend:
//   - Recibe [{ id_producto, cantidad }] y NO confía en ningún precio del frontend.
//   - Consulta el precio REAL de cada producto en la BD.
//   - Recalcula subtotal, impuesto (IVA configurable), descuento y total.
//
// TRANSACCIONES en oracledb (modo thin):
//   oracledb no expone beginTransaction(); la transacción es IMPLÍCITA:
//   el primer DML sobre una conexión la inicia, y se cierra con
//   connection.commit() o connection.rollback(). Por eso este servicio
//   toma una conexión ya obtenida y gestiona commit/rollback explícitos.
// ============================================================

const oracledb = require('oracledb');
const { impuestoPorcentaje } = require('../config/env');
const { getConnection } = require('../config/oracle');

/**
 * Crea una factura completa (cabecera + líneas + cliente) en una transacción.
 *
 * @param {object} params
 * @param {object|undefined} params.cliente { nombre?, documento?, telefono?, correo? }
 * @param {Array<{id_producto:number, cantidad:number}>} params.items
 * @param {string} params.metodo_pago EFECTIVO|TARJETA|TRANSFERENCIA|MIXTO
 * @param {number} [params.descuento]
 * @param {string} [params.observaciones]
 * @param {number} params.id_usuario el usuario que factura (desde JWT)
 * @returns {Promise<object>} la factura completa (cabecera + líneas + cliente)
 */
async function crearFactura({ cliente, items, metodo_pago, descuento = 0, observaciones = null, id_usuario }) {
  const conn = await getConnection();
  try {
    // --- 1. Obtener precios REALES de la BD para cada producto ---
    const lineas = [];
    const ids = [...new Set(items.map((i) => Number(i.id_producto)))];
    for (const id of ids) {
      const r = await conn.execute(
        `SELECT id_producto, nombre, precio, estado FROM productos WHERE id_producto = :id`,
        { id }
      );
      const p = r.rows[0];
      if (!p) {
        const e = new Error(`El producto con id ${id} no existe.`);
        e.status = 400;
        throw e;
      }
      if (p.ESTADO !== 'ACTIVO') {
        const e = new Error(`El producto "${p.NOMBRE}" no está activo.`);
        e.status = 400;
        throw e;
      }
      // Sumamos cantidades si el producto se repite en el carrito
      const cantidad = items
        .filter((i) => Number(i.id_producto) === id)
        .reduce((acc, i) => acc + Number(i.cantidad), 0);
      lineas.push({ id_producto: id, nombre: p.NOMBRE, precio_unitario: Number(p.PRECIO), cantidad });
    }

    // --- 2. Calcular subtotal, impuesto, descuento y total ---
    const subtotal = lineas.reduce((acc, l) => acc + l.precio_unitario * l.cantidad, 0);
    const impuesPct = impuestoPorcentaje();
    const impuestos = subtotal * (impuesPct / 100);
    const desc = Number(descuento) || 0;
    const total = subtotal + impuestos - desc;
    // Redondeo a 2 decimales COP
    const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

    // --- 3. Cliente: buscar por documento o crear ---
    let id_cliente = null;
    if (cliente && (cliente.documento || cliente.nombre)) {
      const doc = cliente.documento || null;
      if (doc) {
        const found = await conn.execute(`SELECT id_cliente FROM clientes WHERE documento = :documento`, {
          documento: doc,
        });
        if (found.rows.length > 0) {
          id_cliente = found.rows[0].ID_CLIENTE;
        }
      }
      if (!id_cliente) {
        const ins = await conn.execute(
          `INSERT INTO clientes (nombre, documento, telefono, correo)
           VALUES (:nombre, :documento, :telefono, :correo)
           RETURNING id_cliente INTO :id`,
          {
            nombre: cliente.nombre || null,
            documento: cliente.documento || null,
            telefono: cliente.telefono || null,
            correo: cliente.correo || null,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          }
        );
        id_cliente = Array.isArray(ins.outBinds.id) ? ins.outBinds.id[0] : ins.outBinds.id;
      }
    }

    // --- 4. Insertar cabecera de factura ---
    // El TRIGGER trg_factura_numero completa numero_factura antes del insert.
    // RETURNING devuelve el valor ya generado por el trigger (FAC-AAAA-NNNNNN).
    const ins1 = await conn.execute(
      `INSERT INTO facturas (id_cliente, id_usuario, subtotal, impuestos, descuento, total, metodo_pago, observaciones)
       VALUES (:id_cliente, :id_usuario, :subtotal, :impuestos, :descuento, :total, :metodo_pago, :observaciones)
       RETURNING id_factura, numero_factura INTO :id, :num`,
      {
        id_cliente,
        id_usuario,
        subtotal: round2(subtotal),
        impuestos: round2(impuestos),
        descuento: round2(desc),
        total: round2(total),
        metodo_pago,
        observaciones: observaciones || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        num: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
      }
    );
    const id_factura = Array.isArray(ins1.outBinds.id) ? ins1.outBinds.id[0] : ins1.outBinds.id;
    const numero_factura = Array.isArray(ins1.outBinds.num)
      ? ins1.outBinds.num[0]
      : ins1.outBinds.num || null;

    // --- 5. Insertar líneas de detalle ---
    for (const l of lineas) {
      await conn.execute(
        `INSERT INTO detalle_factura (id_factura, id_producto, cantidad, precio_unitario, subtotal_linea)
         VALUES (:id_factura, :id_producto, :cantidad, :precio_unitario, :subtotal_linea)`,
        {
          id_factura,
          id_producto: l.id_producto,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          subtotal_linea: round2(l.precio_unitario * l.cantidad),
        }
      );
    }

    // --- 6. Confirmar transacción ---
    await conn.commit();

    return {
      id_factura,
      numero_factura,
      id_cliente,
      fecha_factura: new Date().toISOString(),
      subtotal: round2(subtotal),
      impuestos: round2(impuestos),
      descuento: round2(desc),
      total: round2(total),
      metodo_pago,
      estado: 'PAGADA',
      observaciones: observaciones || null,
      detalle: lineas.map((l) => ({
        id_producto: l.id_producto,
        nombre: l.nombre,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal_linea: round2(l.precio_unitario * l.cantidad),
      })),
    };
  } catch (err) {
    // Revertir cualquier cambio parcial
    try {
      await conn.rollback();
    } catch (_) {
      /* noop */
    }
    throw err;
  } finally {
    await conn.close();
  }
}

module.exports = { crearFactura };
