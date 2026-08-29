// ============================================================
// controllers/productoController.js — CRUD de productos.
//   GET    /api/productos           -> listar (filtros estado, id_categoria)
//   GET    /api/productos/:id       -> obtener uno
//   POST   /api/productos           -> crear (incluye subida de imagen)
//   PUT    /api/productos/:id       -> editar
//   DELETE /api/productos/:id       -> eliminar (soft delete -> INACTIVO)
// ============================================================

const oracledb = require('oracledb');
const { z } = require('zod');

const { ok, fail } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { zodErrorMessages } = require('../utils/zodHelpers');
const { getConnection } = require('../config/oracle');
const { translateOracleError } = require('../utils/oracleErrors');
const { uploadProductImage, effectiveMode } = require('../services/imageService');

const crearSchema = z.object({
  nombre: z.string({ required_error: 'El nombre del producto es obligatorio.' }).min(1, 'El nombre es obligatorio.').max(150),
  descripcion: z.string().max(500).optional().default(''),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  id_categoria: z.coerce.number().int().positive('Categoría inválida.'),
  estado: z.enum(['ACTIVO', 'INACTIVO']).default('ACTIVO'),
  imagen_url: z.string().max(500).optional().default(''),
});

const actualizarSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(150).optional(),
  descripcion: z.string().max(500).optional(),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo.').optional(),
  id_categoria: z.coerce.number().int().positive('Categoría inválida.').optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
  imagen_url: z.string().max(500).optional(),
});

/**
 * GET /api/productos  (filtros: estado, id_categoria)
 */
const listar = asyncHandler(async (req, res) => {
  const { estado, id_categoria } = req.query;
  const conn = await getConnection();
  try {
    let sql = `SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.imagen_url,
                      p.id_categoria, p.estado, c.nombre AS categoria_nombre
                 FROM productos p
                 LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
                WHERE 1 = 1`;
    const binds = {};
    if (estado && (estado === 'ACTIVO' || estado === 'INACTIVO')) {
      sql += ` AND p.estado = :estado`;
      binds.estado = estado;
    }
    if (id_categoria) {
      const cat = Number(id_categoria);
      if (Number.isInteger(cat) && cat > 0) {
        sql += ` AND p.id_categoria = :id_categoria`;
        binds.id_categoria = cat;
      }
    }
    sql += ` ORDER BY p.nombre ASC`;
    const result = await conn.execute(sql, binds);
    return ok(res, result.rows, 'Productos obtenidos.');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * GET /api/productos/:id
 */
const obtener = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 400, 'Identificador de producto inválido.');
  }
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.imagen_url,
              p.id_categoria, p.estado, c.nombre AS categoria_nombre
         FROM productos p
         LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
        WHERE p.id_producto = :id`,
      { id }
    );
    if (result.rows.length === 0) {
      return fail(res, 404, 'Producto no encontrado.');
    }
    return ok(res, result.rows[0], 'Producto obtenido.');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * POST /api/productos  (multipart: campo 'imagen', o JSON con imagen_url)
 */
const crear = asyncHandler(async (req, res) => {
  const body = req.body || {};
  // Coerciones para multipart (multer entrega strings)
  const parsed = crearSchema.safeParse(body);
  if (!parsed.success) {
    return fail(res, 400, 'Datos del producto inválidos.', zodErrorMessages(parsed.error));
  }
  let { nombre, descripcion, precio, id_categoria, estado, imagen_url } = parsed.data;

  // Resolución de imagen: archivo subido > imagen_url del body > null
  let urlImagen = imagen_url || null;
  if (req.file && req.file.buffer) {
    try {
      urlImagen = await uploadProductImage(req.file.buffer, 'rosto/productos');
    } catch (err) {
      // Degrada: si subir a cloudinary falla, dejamos la URL explícita o null.
      urlImagen = imagen_url || null;
    }
  } else if (effectiveMode() === 'url') {
    // En modo url, el cliente manda image_url directo (ya está en urlImagen).
  }

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `INSERT INTO productos (nombre, descripcion, precio, imagen_url, id_categoria, estado)
       VALUES (:nombre, :descripcion, :precio, :imagen_url, :id_categoria, :estado)
       RETURNING id_producto INTO :id`,
      {
        nombre,
        descripcion: descripcion || null,
        precio,
        imagen_url: urlImagen,
        id_categoria,
        estado,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );
    const id_producto = Array.isArray(result.outBinds.id) ? result.outBinds.id[0] : result.outBinds.id;
    return ok(
      res,
      { id_producto, nombre, descripcion, precio, imagen_url: urlImagen, id_categoria, estado },
      'Producto creado.',
      201
    );
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * PUT /api/productos/:id
 */
const actualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 400, 'Identificador de producto inválido.');
  }
  const parsed = actualizarSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return fail(res, 400, 'Datos del producto inválidos.', zodErrorMessages(parsed.error));
  }
  const { nombre, descripcion, precio, id_categoria, estado, imagen_url } = parsed.data;

  // Si subieron un archivo nuevo, lo procesamos; si no, mantenemos la URL.
  let urlImagen = imagen_url;
  if (req.file && req.file.buffer) {
    try {
      urlImagen = await uploadProductImage(req.file.buffer, 'rosto/productos');
    } catch (_err) {
      // degrada: mantenemos la url actual
    }
  }

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `UPDATE productos
          SET nombre       = NVL(:nombre, nombre),
              descripcion  = NVL(:descripcion, descripcion),
              precio       = NVL(:precio, precio),
              id_categoria = NVL(:id_categoria, id_categoria),
              estado       = NVL(:estado, estado),
              imagen_url   = NVL(:imagen_url, imagen_url),
              fecha_actualizacion = SYSTIMESTAMP
        WHERE id_producto = :id`,
      {
        nombre: nombre || null,
        descripcion: descripcion != null ? descripcion : null,
        precio: precio != null ? precio : null,
        id_categoria: id_categoria || null,
        estado: estado || null,
        imagen_url: urlImagen != null ? urlImagen : null,
        id,
      },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return fail(res, 404, 'Producto no encontrado.');
    }
    return ok(res, { id_producto: id }, 'Producto actualizado.');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * DELETE /api/productos/:id — soft delete (estado -> INACTIVO)
 */
const eliminar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return fail(res, 400, 'Identificador de producto inválido.');
  }
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `UPDATE productos SET estado = 'INACTIVO' WHERE id_producto = :id`,
      { id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return fail(res, 404, 'Producto no encontrado.');
    }
    return ok(res, null, 'Producto eliminado (inactivado).');
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
