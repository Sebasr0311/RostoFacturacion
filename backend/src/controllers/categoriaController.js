// ============================================================
// controllers/categoriaController.js — CRUD de categorías.
//   GET    /api/categorias         -> listar (todas, con estado)
//   POST   /api/categorias         -> crear
//   PUT    /api/categorias/:id     -> actualizar
//   DELETE /api/categorias/:id     -> eliminar (soft delete -> INACTIVO)
// ============================================================

const oracledb = require('oracledb');
const { z } = require('zod');

const { ok, fail } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { zodErrorMessages } = require('../utils/zodHelpers');
const { getConnection } = require('../config/oracle');
const { translateOracleError } = require('../utils/oracleErrors');

const crearSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre de la categoría es obligatorio.' })
    .min(1, 'El nombre de la categoría es obligatorio.')
    .max(100, 'El nombre no puede superar 100 caracteres.'),
  estado: z.enum(['ACTIVO', 'INACTIVO']).default('ACTIVO'),
});

const actualizarSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .min(1, 'El nombre es obligatorio.')
    .max(100, 'El nombre no puede superar 100 caracteres.')
    .optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
});

/**
 * GET /api/categorias
 */
const listar = asyncHandler(async (req, res) => {
  // Filtro opcional por estado
  const estado = req.query.estado;
  const conn = await getConnection();
  try {
    let sql = `SELECT id_categoria, nombre, estado FROM categorias WHERE 1 = 1`;
    const binds = {};
    if (estado && (estado === 'ACTIVO' || estado === 'INACTIVO')) {
      sql += ` AND estado = :estado`;
      binds.estado = estado;
    }
    sql += ` ORDER BY nombre ASC`;
    const result = await conn.execute(sql, binds);
    return ok(res, result.rows, 'Categorías obtenidas.');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * POST /api/categorias
 */
const crear = asyncHandler(async (req, res) => {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'Datos de la categoría inválidos.', zodErrorMessages(parsed.error));
  }
  const { nombre, estado } = parsed.data;
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `INSERT INTO categorias (nombre, estado)
       VALUES (:nombre, :estado)
       RETURNING id_categoria INTO :id`,
      { nombre, estado, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );
    const id_categoria = Array.isArray(result.outBinds.id) ? result.outBinds.id[0] : result.outBinds.id;
    return ok(res, { id_categoria, nombre, estado }, 'Categoría creada.', 201);
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * PUT /api/categorias/:id
 */
const actualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 400, 'Identificador de categoría inválido.');
  }
  const parsed = actualizarSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'Datos de la categoría inválidos.', zodErrorMessages(parsed.error));
  }
  const { nombre, estado } = parsed.data;

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `UPDATE categorias
          SET nombre = NVL(:nombre, nombre),
              estado = NVL(:estado, estado)
        WHERE id_categoria = :id`,
      { nombre: nombre || null, estado: estado || null, id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return fail(res, 404, 'Categoría no encontrada.');
    }
    return ok(res, { id_categoria: id }, 'Categoría actualizada.');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * DELETE /api/categorias/:id — soft delete (estado -> INACTIVO)
 */
const eliminar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 400, 'Identificador de categoría inválido.');
  }
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `UPDATE categorias SET estado = 'INACTIVO' WHERE id_categoria = :id`,
      { id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return fail(res, 404, 'Categoría no encontrada.');
    }
    return ok(res, null, 'Categoría eliminada (inactivada).');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

module.exports = { listar, crear, actualizar, eliminar };
