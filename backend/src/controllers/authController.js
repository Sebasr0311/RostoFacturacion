// ============================================================
// controllers/authController.js — Autenticación.
//   POST /api/auth/login     -> login, devuelve JWT
//   POST /api/auth/registrar -> crear usuario administrador (protegido)
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const oracledb = require('oracledb');
const { z } = require('zod');

const { ok, fail } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { zodErrorMessages } = require('../utils/zodHelpers');
const { getConnection } = require('../config/oracle');
const { translateOracleError } = require('../utils/oracleErrors');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Esquema de login
const loginSchema = z.object({
  correo: z.string({ required_error: 'El correo es obligatorio.' }).email('Correo inválido.'),
  password: z.string({ required_error: 'La contraseña es obligatoria.' }).min(1, 'La contraseña es obligatoria.'),
});

// Esquema de registro de usuario
const registrarSchema = z.object({
  nombre_completo: z
    .string({ required_error: 'El nombre completo es obligatorio.' })
    .min(3, 'El nombre completo debe tener al menos 3 caracteres.')
    .max(150, 'El nombre completo no puede superar 150 caracteres.'),
  correo: z.string({ required_error: 'El correo es obligatorio.' }).email('Correo inválido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  rol: z.enum(['ADMIN', 'CAJERO']).default('ADMIN'),
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'Datos de acceso inválidos.', zodErrorMessages(parsed.error));
  }
  const { correo, password } = parsed.data;

  if (!JWT_SECRET) {
    return fail(res, 500, 'El servidor no está configurado correctamente (falta JWT_SECRET).');
  }

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT id_usuario, nombre_completo, correo, password_hash, rol, estado
         FROM usuarios
        WHERE correo = :correo`,
      { correo }
    );

    if (result.rows.length === 0) {
      return fail(res, 401, 'Credenciales incorrectas.');
    }
    const user = result.rows[0];

    if (user.ESTADO !== 'ACTIVO') {
      return fail(res, 403, 'El usuario está inactivo.');
    }

    const valid = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!valid) {
      return fail(res, 401, 'Credenciales incorrectas.');
    }

    const token = jwt.sign(
      {
        id_usuario: user.ID_USUARIO,
        nombre_completo: user.NOMBRE_COMPLETO,
        correo: user.CORREO,
        rol: user.ROL,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return ok(
      res,
      {
        token,
        usuario: {
          id_usuario: user.ID_USUARIO,
          nombre_completo: user.NOMBRE_COMPLETO,
          correo: user.CORREO,
          rol: user.ROL,
        },
      },
      'Sesión iniciada correctamente.'
    );
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

/**
 * POST /api/auth/registrar — PROtegido (solo admin).
 * Crea un usuario administrador/cajero con password hasheado.
 */
const registrar = asyncHandler(async (req, res) => {
  const parsed = registrarSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'Datos de registro inválidos.', zodErrorMessages(parsed.error));
  }
  const { nombre_completo, correo, password, rol } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 10);

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `INSERT INTO usuarios (nombre_completo, correo, password_hash, rol)
       VALUES (:nombre_completo, :correo, :password_hash, :rol)
       RETURNING id_usuario INTO :id`,
      {
        nombre_completo,
        correo,
        password_hash: passwordHash,
        rol,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }, // bind OUT number
      },
      { autoCommit: true }
    );

    const id_usuario = Array.isArray(result.outBinds.id) ? result.outBinds.id[0] : result.outBinds.id;

    return ok(
      res,
      { id_usuario, nombre_completo, correo, rol },
      'Usuario registrado correctamente.',
      201
    );
  } catch (err) {
    const t = translateOracleError(err);
    return fail(res, t.status, t.message);
  } finally {
    await conn.close();
  }
});

module.exports = { login, registrar };
