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

import { METODO_PAGO_LABEL } from '../../utils/constants';
import { formatCOP, formatFecha } from '../../utils/format';
import { FlameIcon } from '../ui/Icons';
import EstadoBadge from '../ui/EstadoBadge';

export default function FacturaView({ factura }) {
  if (!factura) return null;

  const cliente = factura.cliente;
  const clienteNombre = cliente?.nombre || 'CONSUMIDOR FINAL';
  const detalle = factura.detalle || [];

  return (
    <div id="print-area" className="rounded-2xl border border-crema-borde bg-white p-5 shadow-card">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-dashed border-crema-borde pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-dorado-frito text-rojo-brasa shadow-card">
            <FlameIcon size={28} />
          </span>
          <div>
            <p className="font-display text-xl font-bold text-carbon">Rosto</p>
            <p className="text-xs text-carbon/75">Pollo a la brasa · Factura de venta</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold text-rojo-brasa">
            {factura.numero_factura}
          </p>
          <p className="text-xs tabular-nums text-carbon/75">{formatFecha(factura.fecha_factura)}</p>
          <div className="mt-1">
            <EstadoBadge estado={factura.estado} />
          </div>
        </div>
      </div>

      {/* Datos cliente / usuario / método */}
      <div className="grid grid-cols-2 gap-3 border-b border-crema-borde py-3 text-sm lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-carbon/75">Cliente</p>
          <p className="font-semibold text-carbon">{clienteNombre}</p>
          {cliente?.documento && <p className="text-xs text-carbon/75">Doc. {cliente.documento}</p>}
          {cliente?.telefono && <p className="text-xs text-carbon/75">Tel. {cliente.telefono}</p>}
          {cliente?.correo && <p className="text-xs text-carbon/75">{cliente.correo}</p>}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-carbon/75">
            Método de pago
          </p>
          <p className="font-semibold text-carbon">
            {METODO_PAGO_LABEL[factura.metodo_pago] || factura.metodo_pago}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-carbon/75">Atendió</p>
          <p className="font-semibold text-carbon">{factura.usuario || '—'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-carbon/75">
            Observaciones
          </p>
          <p className="font-semibold text-carbon">{factura.observaciones || '—'}</p>
        </div>
      </div>

      {/* Líneas */}
      <table className="mt-4 w-full text-sm">
        <caption className="sr-only">Detalle de los productos de la factura</caption>
        <thead>
          <tr className="border-b border-crema-borde text-left text-[11px] font-semibold uppercase tracking-wide text-carbon/75">
            <th scope="col" className="py-2 pr-2">Producto</th>
            <th scope="col" className="py-2 pr-2 text-center">Cant.</th>
            <th scope="col" className="py-2 pr-2 text-right">P. unitario</th>
            <th scope="col" className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {detalle.map((d, i) => (
            <tr key={i} className="border-b border-crema-borde">
              <td className="py-2 pr-2 font-medium text-carbon">{d.nombre || d.producto}</td>
              <td className="py-2 pr-2 text-center tabular-nums text-carbon/70">{d.cantidad}</td>
              <td className="py-2 pr-2 text-right tabular-nums text-carbon/70">
                {formatCOP(d.precio_unitario)}
              </td>
              <td className="py-2 text-right font-semibold tabular-nums text-carbon">
                {formatCOP(d.subtotal_linea)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between text-carbon/70">
          <span>Subtotal</span>
          <span className="font-semibold tabular-nums">{formatCOP(factura.subtotal)}</span>
        </div>
        {Number(factura.impuestos) !== 0 && (
          <div className="flex justify-between text-carbon/70">
            <span>IVA</span>
            <span className="font-semibold tabular-nums">{formatCOP(factura.impuestos)}</span>
          </div>
        )}
        {Number(factura.descuento) > 0 && (
          <div className="flex justify-between text-rojo-brasa-oscuro">
            <span>Descuento</span>
            <span className="font-semibold tabular-nums">− {formatCOP(factura.descuento)}</span>
          </div>
        )}
        <div className="flex justify-between border-t-2 border-dashed border-crema-borde pt-2 font-display text-lg font-bold text-carbon">
          <span>Total</span>
          <span className="tabular-nums text-rojo-brasa">{formatCOP(factura.total)}</span>
        </div>
      </div>
    </div>
  );
}