// ============================================================
// utils/zodHelpers.js — Helpers para errores de validación zod.
// Convierte el detalle de zod (según la versión) en una lista
// legible de errores en español para el envelope de respuesta.
// ============================================================

/**
 * Extrae un arreglo de mensajes legibles desde un error de zod.
 * Tolera tanto zod v3 (error.errors) como v4 (error.issues).
 * @param {Error} zodError error lanzado por schema.safeParse()/parse()
 * @returns {string[]}
 */
function zodErrorMessages(zodError) {
  const issues = (zodError && (zodError.issues || zodError.errors)) || [];
  if (!Array.isArray(issues) || issues.length === 0) {
    return [zodError && zodError.message ? zodError.message : 'Datos de entrada inválidos.'];
  }
  return issues.map((issue) => {
    const path = Array.isArray(issue.path) && issue.path.length ? issue.path.join('.') : '';
    const base = path ? `${path}: ` : '';
    return base + (issue.message || 'Valor inválido.');
  });
}

module.exports = { zodErrorMessages };
