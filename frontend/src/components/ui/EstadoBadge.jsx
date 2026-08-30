// ============================================================
// components/ui/EstadoBadge.jsx — Badge de estado reutilizable.
// Deriva la semántica visual directo del estado:
//   FACTURA  PAGADA  -> mostaza (positivo)
//   FACTURA  ANULADA -> brasa   (danger)
//   PRODUCTO ACTIVO  -> mostaza (positivo)
//   PRODUCTO INACTIVO-> crema   (neutro/desactivado)
// Cualquier estado desconocido cae a la superficie neutra.
// ============================================================

import { ESTADO_FACTURA, ESTADO_PRODUCTO } from '../../utils/constants';

const CLASES_POR_ESTADO = {
  PAGADA: 'bg-mostaza-suave text-carbon',
  ANULADA: 'bg-brasa-suave text-rojo-brasa-oscuro',
  ACTIVO: 'bg-mostaza-suave text-carbon',
  INACTIVO: 'bg-crema-borde text-carbon/70',
};

export default function EstadoBadge({ estado }) {
  const info = ESTADO_FACTURA[estado] || ESTADO_PRODUCTO[estado] || { label: estado };
  const clases = CLASES_POR_ESTADO[estado] || 'bg-crema-borde text-carbon/70';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${clases}`}
    >
      {info.label}
    </span>
  );
}