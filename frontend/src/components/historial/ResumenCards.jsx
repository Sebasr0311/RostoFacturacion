// ============================================================
// components/historial/ResumenCards.jsx — Tarjetas de resumen.
// El NÚMERO es el protagonista (font-display grande, tabular-nums);
// la etiqueta queda secundaria. Cada tarjeta tiene una superficie
// de la paleta (carbón/dorado/blanco) — sin numeración decorativa.
//
// Consume el `resumen` de GET /api/reportes/ventas-dia (o ventas-rango):
//   { total_vendido, numero_facturas, ticket_promedio,
//     producto_mas_vendido, forma_pago_top }
// ============================================================

import { Skeleton } from '../ui/Skeleton';
import { formatCOP } from '../../utils/format';
import { METODO_PAGO_LABEL } from '../../utils/constants';

function Card({ label, value, sub, variant = 'blanco' }) {
  const variants = {
    carbon: 'bg-carbon text-crema-suave shadow-soft',
    dorado: 'bg-dorado-frito text-carbon shadow-card',
    blanco: 'bg-white text-carbon border border-crema-borde shadow-card',
  };
  const valueColor = {
    carbon: 'text-dorado-frito',
    dorado: 'text-carbon',
    blanco: 'text-rojo-brasa',
  };
  return (
    <div className={`rounded-2xl p-5 ${variants[variant]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p
        className={`mt-1 truncate font-display text-3xl font-bold tabular-nums ${valueColor[variant]}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
    </div>
  );
}

export default function ResumenCards({ resumen, loading = false, derived = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!resumen) return null;

  const topMetodo = resumen.forma_pago_top
    ? METODO_PAGO_LABEL[resumen.forma_pago_top] || resumen.forma_pago_top
    : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          label="Total vendido"
          value={formatCOP(resumen.total_vendido)}
          sub={derived ? 'derivado del listado' : 'ventas pagadas del día'}
          variant="carbon"
        />
        <Card
          label="N.º de facturas"
          value={String(resumen.numero_facturas)}
          sub="facturas emitidas"
          variant="dorado"
        />
        <Card
          label="Ticket promedio"
          value={formatCOP(resumen.ticket_promedio)}
          variant="blanco"
        />
      </div>
      {(resumen.producto_mas_vendido || topMetodo) && !derived && (
        <div className="flex flex-wrap gap-2">
          {resumen.producto_mas_vendido && (
            <span className="inline-flex items-center gap-2 rounded-full border border-crema-borde bg-white px-3 py-1.5 text-xs font-medium text-carbon/80 shadow-sm">
              Más vendido: <strong className="text-carbon">{resumen.producto_mas_vendido}</strong>
              <span className="text-carbon/75">
                ({resumen.producto_mas_vendido_cantidad} uds.)
              </span>
            </span>
          )}
          {topMetodo && (
            <span className="inline-flex items-center gap-2 rounded-full border border-crema-borde bg-white px-3 py-1.5 text-xs font-medium text-carbon/80 shadow-sm">
              Pago más usado: <strong className="text-carbon">{topMetodo}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}