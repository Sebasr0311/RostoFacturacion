// ============================================================
// components/historial/ResumenCards.jsx — Tarjetas de resumen.
// Consume el `resumen` de GET /api/reportes/ventas-dia (o ventas-rango):
//   { total_vendido, numero_facturas, ticket_promedio,
//     producto_mas_vendido, forma_pago_top }
// ============================================================

import { Skeleton } from '../ui/Skeleton';
import { formatCOP } from '../../utils/format';
import { METODO_PAGO_LABEL } from '../../utils/constants';

function Card({ label, value, sub, accent }) {
  const accents = {
    brand: 'from-brand-600 to-brand-700 text-white',
    orange: 'from-orange-400 to-orange-500 text-white',
    cream: 'bg-white text-cacao-900',
  };
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br p-4 shadow-card ${accents[accent] || accents.cream}`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          accent === 'cream' ? 'text-cacao-500' : 'text-white/70'
        }`}
      >
        {label}
      </p>
      <p className="mt-1 truncate font-display text-2xl font-bold">{value}</p>
      {sub && (
        <p className={`mt-0.5 text-xs ${accent === 'cream' ? 'text-cacao-600' : 'text-white/80'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function ResumenCards({ resumen, loading = false, derived = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
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
          sub={derived ? 'derivado del listado' : null}
          accent="brand"
        />
        <Card
          label="Facturas"
          value={String(resumen.numero_facturas)}
          sub="emitidas (pagadas)"
          accent="orange"
        />
        <Card
          label="Ticket promedio"
          value={formatCOP(resumen.ticket_promedio)}
          accent="cream"
        />
      </div>
      {(resumen.producto_mas_vendido || topMetodo) && !derived && (
        <div className="flex flex-wrap gap-2">
          {resumen.producto_mas_vendido && (
            <span className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cacao-700 shadow-sm">
              🏆 Más vendido: <strong className="text-cacao-900">{resumen.producto_mas_vendido}</strong>
              <span className="text-cacao-500">({resumen.producto_mas_vendido_cantidad} uds.)</span>
            </span>
          )}
          {topMetodo && (
            <span className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cacao-700 shadow-sm">
              💳 Pago más usado: <strong className="text-cacao-900">{topMetodo}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}