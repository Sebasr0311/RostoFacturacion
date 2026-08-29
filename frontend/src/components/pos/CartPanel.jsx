// ============================================================
// components/pos/CartPanel.jsx — Carrito de la orden.
// Desktop: panel fijo a la derecha. Móvil/tablet: drawer deslizante
// (controlado por `open` desde PosPage).
//
// Nota de contrato: el backend recibe `descuento` en COP absolutos.
// La UI pide un porcentaje y aquí se convierte: desc = subtotal*pct/100.
// ============================================================

import { useState } from 'react';
import {
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  XIcon,
  ChevronDownIcon,
  ReceiptIcon,
} from '../ui/Icons';
import Spinner from '../ui/Spinner';
import { formatCOP, round2 } from '../../utils/format';
import { METODOS_PAGO, IVA_PORCENTAJE_PREVIEW } from '../../utils/constants';

function ClienteSection({ cliente, onChange }) {
  const [open, setOpen] = useState(false);

  const setField = (field) => (e) => onChange({ ...cliente, [field]: e.target.value });

  return (
    <div className="rounded-xl border border-cream-200 bg-cream-50/60 p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold text-cacao-800"
      >
        <span>Datos del cliente (opcional)</span>
        <ChevronDownIcon
          size={18}
          className={`text-cacao-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-cacao-600">
            Nombre
            <input
              type="text"
              value={cliente.nombre}
              onChange={setField('nombre')}
              maxLength={150}
              placeholder="Nombre del cliente"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-cacao-900 outline-none transition placeholder:text-cacao-500/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <label className="block text-xs font-medium text-cacao-600">
            Documento
            <input
              type="text"
              value={cliente.documento}
              onChange={setField('documento')}
              maxLength={30}
              placeholder="CC / NIT"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-cacao-900 outline-none transition placeholder:text-cacao-500/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <label className="block text-xs font-medium text-cacao-600 sm:col-span-2">
            Teléfono
            <input
              type="tel"
              value={cliente.telefono}
              onChange={setField('telefono')}
              maxLength={30}
              placeholder="300 000 0000"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-cacao-900 outline-none transition placeholder:text-cacao-500/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default function CartPanel({
  open = false,
  onClose,
  cart = [],
  cliente = {},
  onClienteChange,
  metodoPago = 'EFECTIVO',
  onMetodoPagoChange,
  descuentoPct = 0,
  onDescuentoPctChange,
  observaciones = '',
  onObservacionesChange,
  subtotal = 0,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onGenerar,
  generating = false,
}) {
  const count = cart.reduce((acc, i) => acc + i.cantidad, 0);
  const descuentoCOP = round2((subtotal * (Number(descuentoPct) || 0)) / 100);
  const ivaPreview = round2(subtotal * (IVA_PORCENTAJE_PREVIEW / 100));
  const totalPreview = round2(subtotal + ivaPreview - descuentoCOP);

  const content = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cream-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon size={20} className="text-brand-600" />
          <h2 className="font-display text-base font-semibold text-cacao-900">Carrito</h2>
          {count > 0 && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg p-1.5 text-cacao-500 transition hover:bg-cream-100 hover:text-brand-600"
              title="Vaciar carrito"
            >
              <TrashIcon size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-cacao-500 transition hover:bg-cream-100 hover:text-cacao-900 lg:hidden"
            aria-label="Cerrar carrito"
          >
            <XIcon size={20} />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-cacao-500">
              <ShoppingCartIcon size={30} />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-cacao-900">El carrito está vacío</p>
              <p className="mt-1 text-xs text-cacao-600">
                Toca un producto del catálogo para agregarlo a la orden.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {cart.map((item) => (
              <li
                key={item.id_producto}
                className="flex gap-3 rounded-xl border border-cream-200 bg-white p-2.5 shadow-sm"
              >
                {item.imagen_url ? (
                  <img
                    src={item.imagen_url}
                    alt={item.nombre}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-2xl">
                    🍗
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-cacao-900">{item.nombre}</p>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id_producto)}
                      className="rounded p-1 text-cacao-400 transition hover:bg-cream-100 hover:text-brand-600"
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-cacao-600">{formatCOP(item.precio)} c/u</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg border border-cream-200 bg-cream-50 p-0.5">
                      <button
                        type="button"
                        onClick={() => onDecrement(item.id_producto)}
                        className="rounded-md p-1 text-cacao-700 transition hover:bg-white hover:text-brand-600"
                        aria-label="Disminuir cantidad"
                      >
                        <MinusIcon size={14} />
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-cacao-900">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => onIncrement(item.id_producto)}
                        className="rounded-md p-1 text-cacao-700 transition hover:bg-white hover:text-brand-600"
                        aria-label="Aumentar cantidad"
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-cacao-900">
                      {formatCOP(item.precio * item.cantidad)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Config + totales */}
      {cart.length > 0 && (
        <div className="space-y-3 border-t border-cream-200 px-4 py-3">
          <ClienteSection cliente={cliente} onChange={onClienteChange} />

          {/* Método de pago */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-cacao-600">
              Método de pago
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METODOS_PAGO.map((m) => {
                const selected = metodoPago === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => onMetodoPagoChange(m.value)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      selected
                        ? 'border-brand-600 bg-brand-600 text-white shadow-card'
                        : 'border-cream-200 bg-white text-cacao-700 hover:border-brand-300'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descuento + observaciones */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block text-xs font-medium text-cacao-600">
              Descuento (%)
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={descuentoPct}
                onChange={(e) => onDescuentoPctChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-cacao-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block text-xs font-medium text-cacao-600">
              Observaciones
              <input
                type="text"
                value={observaciones}
                onChange={(e) => onObservacionesChange(e.target.value)}
                maxLength={500}
                placeholder="Nota en la factura"
                className="mt-1 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-cacao-900 outline-none transition placeholder:text-cacao-500/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
          </div>

          {/* Totales */}
          <div className="space-y-1 rounded-xl bg-cream-100/70 p-3 text-sm">
            <div className="flex justify-between text-cacao-700">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-cacao-700">
              <span>IVA ({IVA_PORCENTAJE_PREVIEW} %)</span>
              <span className="font-semibold">{formatCOP(ivaPreview)}</span>
            </div>
            {descuentoCOP > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento</span>
                <span className="font-semibold">− {formatCOP(descuentoCOP)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-cream-300 pt-1.5 font-display text-base font-bold text-cacao-900">
              <span>Total estimado</span>
              <span className="text-brand-600">{formatCOP(totalPreview)}</span>
            </div>
            <p className="text-[11px] text-cacao-500">
              El servidor calcula los valores finales de la factura (IVA y precios de BD).
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerar}
            disabled={generating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-display text-base font-bold text-white shadow-card transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? <Spinner size={20} light /> : <ReceiptIcon size={20} />}
            {generating ? 'Generando factura…' : 'Generar factura'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-cacao-950/50 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* Drawer móvil (dentro del flujo, a la derecha) */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(92vw,400px)] flex-col bg-white shadow-soft transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {content}
      </div>
      {/* Panel fijo desktop */}
      <div className="fixed inset-y-0 right-0 z-20 hidden w-[400px] flex-col border-l border-cream-200 bg-white shadow-soft lg:flex" style={{ marginTop: 0 }}>
        {content}
      </div>
    </>
  );
}