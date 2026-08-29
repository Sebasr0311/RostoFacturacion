// ============================================================
// format.js — Helpers de formato (moneda COP, fechas, etc.).
// ============================================================

// Peso colombiano, sin decimales (precios de restaurante en COP).
const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCOP(value) {
  const n = Number(value);
  return Number.isFinite(n) ? copFormatter.format(n) : copFormatter.format(0);
}

const fechaFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const horaFormatter = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
});

const fechaSolaFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
});

/**
 * Formatea una fecha ISO o Date a "12 jun 2026, 3:45 p. m.".
 * Es tolerante con strings que vienen como ISO del backend.
 */
export function formatFecha(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return fechaFormatter.format(d);
}

export function formatHora(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return horaFormatter.format(d);
}

export function formatFechaSola(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return fechaSolaFormatter.format(d);
}

/**
 * Fecha local de hoy en formato YYYY-MM-DD (la que espera el backend).
 */
export function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

/**
 * Iniciales para el avatar de usuario.
 */
export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const letters = parts.slice(0, 2).map((p) => p[0]);
  return letters.join('').toUpperCase();
}

/**
 * Recorta un número a 2 decimales (para evitar ruido de floats).
 */
export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}