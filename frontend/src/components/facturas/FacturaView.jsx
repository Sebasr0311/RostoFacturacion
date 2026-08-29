// ============================================================
// components/facturas/FacturaView.jsx — Render de una factura.
// Componente REUTILIZABLE: se usa en el modal del POS (respuesta de
// POST /api/facturas) y en el modal de Historial (GET /api/facturas/:id).
//
// Acepta una factura normalizada: { numero_factura, fecha_factura,
//   subtotal, impuestos, descuento, total, metodo_pago, estado,
//   observaciones, usuario, cliente?, detalle: [{ nombre, cantidad,
//   precio_unitario, subtotal_linea }] }
// El root lleva id="print-area" para imprimir con Ctrl+P.
// ============================================================

import { METODO_PAGO_LABEL, ESTADO_FACTURA } from '../../utils/constants';
import { formatCOP, formatFecha } from '../../utils/format';

function EstadoBadge({ estado }) {
  const info = ESTADO_FACTURA[estado] || { label: estado };
  const isAnulada = estado === 'ANULADA';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        isAnulada ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {info.label}
    </span>
  );
}

export default function FacturaView({ factura }) {
  if (!factura) return null;

  const cliente = factura.cliente;
  const clienteNombre = cliente?.nombre || 'CONSUMIDOR FINAL';
  const detalle = factura.detalle || [];

  return (
    <div id="print-area" className="rounded-2xl border border-cream-200 bg-white p-5 shadow-card">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-dashed border-cream-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-2xl shadow-card">
            🍗
          </span>
          <div>
            <p className="font-display text-xl font-bold text-cacao-900">Rosto</p>
            <p className="text-xs text-cacao-600">Pollo a la brasa · Factura de venta</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold text-brand-600">{factura.numero_factura}</p>
          <p className="text-xs text-cacao-600">{formatFecha(factura.fecha_factura)}</p>
          <div className="mt-1">
            <EstadoBadge estado={factura.estado} />
          </div>
        </div>
      </div>

      {/* Datos cliente / usuario / método */}
      <div className="grid grid-cols-2 gap-3 border-b border-cream-100 py-3 text-sm lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cacao-500">Cliente</p>
          <p className="font-semibold text-cacao-900">{clienteNombre}</p>
          {cliente?.documento && <p className="text-xs text-cacao-600">Doc. {cliente.documento}</p>}
          {cliente?.telefono && <p className="text-xs text-cacao-600">Tel. {cliente.telefono}</p>}
          {cliente?.correo && <p className="text-xs text-cacao-600">{cliente.correo}</p>}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cacao-500">Método de pago</p>
          <p className="font-semibold text-cacao-900">
            {METODO_PAGO_LABEL[factura.metodo_pago] || factura.metodo_pago}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cacao-500">Atendió</p>
          <p className="font-semibold text-cacao-900">{factura.usuario || '—'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cacao-500">Observaciones</p>
          <p className="font-semibold text-cacao-900">{factura.observaciones || '—'}</p>
        </div>
      </div>

      {/* Líneas */}
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-cream-200 text-left text-[11px] font-semibold uppercase tracking-wide text-cacao-500">
            <th className="py-2 pr-2">Producto</th>
            <th className="py-2 pr-2 text-center">Cant.</th>
            <th className="py-2 pr-2 text-right">P. unitario</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {detalle.map((d, i) => (
            <tr key={i} className="border-b border-cream-100">
              <td className="py-2 pr-2 font-medium text-cacao-900">{d.nombre || d.producto}</td>
              <td className="py-2 pr-2 text-center text-cacao-700">{d.cantidad}</td>
              <td className="py-2 pr-2 text-right text-cacao-700">{formatCOP(d.precio_unitario)}</td>
              <td className="py-2 text-right font-semibold text-cacao-900">
                {formatCOP(d.subtotal_linea)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between text-cacao-700">
          <span>Subtotal</span>
          <span className="font-semibold">{formatCOP(factura.subtotal)}</span>
        </div>
        <div className="flex justify-between text-cacao-700">
          <span>IVA</span>
          <span className="font-semibold">{formatCOP(factura.impuestos)}</span>
        </div>
        {Number(factura.descuento) > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Descuento</span>
            <span className="font-semibold">− {formatCOP(factura.descuento)}</span>
          </div>
        )}
        <div className="flex justify-between border-t-2 border-dashed border-cream-300 pt-2 font-display text-lg font-bold text-cacao-900">
          <span>Total</span>
          <span className="text-brand-600">{formatCOP(factura.total)}</span>
        </div>
      </div>
    </div>
  );
}