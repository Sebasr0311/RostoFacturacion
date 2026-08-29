// ============================================================
// utils/oracleErrors.js — Mapeo de errores Oracle a mensajes legibles
// para el cliente. NUNCA filtramos internals de la BD al usuario.
// ============================================================

/**
 * Extrae el código ORA-XXXXX de un error Oracle si existe.
 * @param {*} err
 * @returns {string|null}
 */
function oracleCode(err) {
  if (!err) return null;
  if (typeof err.errorNum === 'number' && err.errorNum > 0) {
    // node-oracledb numeriza el ORA-xxxxx sin ceros a la izquierda (ej. ORA-1).
    return `ORA-${String(err.errorNum).padStart(5, '0')}`;
  }
  if (typeof err.message === 'string') {
    const m = err.message.match(/ORA-(\d{5})/);
    return m ? `ORA-${m[1]}` : null;
  }
  return null;
}

/**
 * Traduce un error de Oracle (o genérico) a un mensaje amigable en español.
 * @param {*} err error capturado
 * @returns {{ message: string, status: number }}
 */
function translateOracleError(err) {
  const code = oracleCode(err);
  switch (code) {
    case 'ORA-00001':
      return { message: 'Ya existe un registro con ese valor único.', status: 409 };
    case 'ORA-02291':
      return { message: 'Referencia inválida: el registro relacionado no existe.', status: 409 };
    case 'ORA-02292':
      return { message: 'No se puede eliminar: hay registros relacionados.', status: 409 };
    case 'ORA-00054':
      return { message: 'El recurso está bloqueado. Inténtalo de nuevo.', status: 503 };
    case 'ORA-12154':
    case 'ORA-12504':
    case 'ORA-12514':
      return { message: 'No se pudo conectar a la base de datos (cadena de conexión inválida).', status: 503 };
    case 'ORA-28000':
      return { message: 'La cuenta de base de datos está bloqueada.', status: 503 };
    case 'ORA-01017':
      return { message: 'Credenciales de base de datos inválidas.', status: 503 };
    default:
      // No exponemos el detalle crudo del error interno por defecto.
      return { message: 'Ocurrió un error en la base de datos.', status: 500 };
  }
}

module.exports = { translateOracleError, oracleCode };
