// ============================================================
// constants.js — Constantes compartidas del frontend.
// (Los valores de negocio los define el backend; esto es solo UI.)
// ============================================================

// Métodos de pago aceptados por POST /api/facturas (orden de UI).
export const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'MIXTO', label: 'Mixto' },
];

export const METODO_PAGO_LABEL = Object.fromEntries(
  METODOS_PAGO.map((m) => [m.value, m.label])
);

export const ESTADO_FACTURA = {
  PAGADA: { label: 'Pagada' },
  ANULADA: { label: 'Anulada' },
};

// IVA usado SOLO para la vista previa del carrito. El cálculo real
// lo hace el backend (config IMPUESTO_PORCENTAJE, default 19).
export const IVA_PORCENTAJE_PREVIEW = 19;

// Claves de localStorage.
export const TOKEN_KEY = 'rosto_token';
export const USER_KEY = 'rosto_usuario';

// Límite de imagen (mirror del backend: multer 5 MB).
export const IMAGEN_MAX_MB = 5;
export const IMAGEN_MAX_BYTES = IMAGEN_MAX_MB * 1024 * 1024;

// Labels de productos.
export const ESTADO_PRODUCTO = {
  ACTIVO: { label: 'Activo' },
  INACTIVO: { label: 'Inactivo' },
};