// ============================================================
// components/pos/CartPanel.jsx — Carrito de la orden.
// Desktop: panel fijo a la derecha (protagonista del módulo).
// Móvil/tablet: drawer deslizante (controlado por `open`).
//
// FIRMA (a): el ícono del carrito hace un rebote pequeño cada vez
// que el conteo cambia (key={count} re-dispara la animación,
// 300ms; motion-reduce la desactiva).
//
// Nota de contrato: el backend recibe `descuento` en COP absolutos.
// La UI pide un porcentaje y aquí se convierte: desc = subtotal*pct/100.
// ============================================================

import { memo, useEffect, useRef, useState } from 'react';
import {
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  XIcon,
  ChevronDownIcon,
  ReceiptIcon,
  FlameIcon,
} from '../ui/Icons';
import Spinner from '../ui/Spinner';
import { formatCOP, round2 } from '../../utils/format';
import { METODOS_PAGO, IVA_PORCENTAJE_PREVIEW } from '../../utils/constants';

function ClienteSection({ cliente, onChange }) {
  const [open, setOpen] = useState(false);

  const setField = (field) => (e) => onChange({ ...cliente, [field]: e.target.value });

  return (
    <div className="rounded-xl border border-crema-borde bg-crema-suave p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-2 text-sm font-semibold text-carbon"
      >
        <span>Datos del cliente (opcional)</span>
        <ChevronDownIcon
          size={18}
          className={`shrink-0 text-carbon/60 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-carbon/75">
            Nombre
            <input
              type="text"
              value={cliente.nombre}
              onChange={setField('nombre')}
              maxLength={150}
              placeholder="Nombre del cliente"
              className="mt-1 w-full rounded-lg border border-crema-borde bg-white px-3 py-2 text-sm text-carbon placeholder:text-carbon/60"
            />
          </label>
          <label className="block text-xs font-medium text-carbon/75">
            Documento
            <input
              type="text"
              value={cliente.documento}
              onChange={setField('documento')}
              maxLength={30}
              placeholder="CC / NIT"
              className="mt-1 w-full rounded-lg border border-crema-borde bg-white px-3 py-2 text-sm text-carbon placeholder:text-carbon/60"
            />
          </label>
          <label className="block text-xs font-medium text-carbon/75 sm:col-span-2">
            Teléfono
            <input
              type="tel"
              value={cliente.telefono}
              onChange={setField('telefono')}
              maxLength={30}
              placeholder="300 000 0000"
              className="mt-1 w-full rounded-lg border border-crema-borde bg-white px-3 py-2 text-sm text-carbon placeholder:text-carbon/60"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default memo(function CartPanel({
  open = false,
  onClose,
  cart = [],
  cliente = {},
  onClienteChange,
  metodoPago = 'EFECTIVO',
  onMetodoPagoChange,
  descuentoPct = 0,
  onDescuentoPctChange,
  aplicarIva = false,
  onAplicarIvaChange,
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
  const ivaPreview = aplicarIva ? round2(subtotal * (IVA_PORCENTAJE_PREVIEW / 100)) : 0;
  const totalPreview = round2(subtotal + ivaPreview - descuentoCOP);

  // FIRMA (a): rebote del carrito y pop-in del badge re-disparados con
  // Web Animations API (patrón del proyecto, igual que ProductCard)
  // en cada cambio del conteo — en vez de `key={count}` (que remonta y
  // genera warning). Respeta prefers-reduced-motion.
  const cartIconRef = useRef(null);
  const badgeRef = useRef(null);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const cartEl = cartIconRef.current;
    if (cartEl) {
      cartEl.animate(
        [
          { transform: 'scale(1) rotate(0deg)' },
          { transform: 'scale(1.18) rotate(-8deg)' },
          { transform: 'scale(1) rotate(0deg)' },
        ],
        { duration: 300, easing }
      );
    }
    const badgeEl = badgeRef.current;
    if (badgeEl) {
      badgeEl.animate(
        [
          { transform: 'scale(0.6)', opacity: 0 },
          { transform: 'scale(1.08)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration: 300, easing }
      );
    }
  }, [count]);

  const content = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-crema-borde px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Rebote del carrito al cambiar el conteo (firma) */}
          <ShoppingCartIcon
            ref={cartIconRef}
            size={22}
            className="text-dorado-oscuro"
          />
          <h2 className="font-display text-lg font-semibold text-carbon">Tu orden</h2>
          {count > 0 && (
            <span
              ref={badgeRef}
              aria-live="polite"
              className="rounded-full bg-carbon px-2.5 py-0.5 text-xs font-bold tabular-nums text-dorado-frito"
            >
              {count} ítems
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-carbon/50 transition hover:bg-crema-suave-osc hover:text-rojo-brasa"
              title="Vaciar carrito"
              aria-label="Vaciar carrito"
            >
              <TrashIcon size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-carbon/50 transition hover:bg-crema-suave-osc hover:text-carbon lg:hidden"
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
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mostaza-suave text-dorado-oscuro">
              <ShoppingCartIcon size={30} />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-carbon">
                Tu orden está vacía
              </p>
              <p className="mx-auto mt-1 max-w-[240px] text-sm text-carbon/70">
                Toca un producto del catálogo para agregarlo a la orden.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {cart.map((item) => (
              <li
                key={item.id_producto}
                className="flex gap-3 rounded-xl border border-crema-borde bg-white p-2.5 shadow-sm"
              >
                {item.imagen_url ? (
                  <img
                    src={item.imagen_url}
                    alt={item.nombre}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-mostaza-suave text-dorado-oscuro">
                    <FlameIcon size={28} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-carbon">
                      {item.nombre}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id_producto)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-carbon/40 transition hover:bg-brasa-suave hover:text-rojo-brasa"
                      aria-label={`Quitar ${item.nombre} de la orden`}
                      title={`Quitar ${item.nombre}`}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs tabular-nums text-carbon/75">
                    {formatCOP(item.precio)} c/u
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div
                      className="flex items-center gap-1 rounded-xl border border-crema-borde bg-crema-suave p-1"
                      role="group"
                      aria-label={`Cantidad de ${item.nombre}`}
                    >
                      <button
                        type="button"
                        onClick={() => onDecrement(item.id_producto)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-carbon transition hover:bg-white hover:text-rojo-brasa active:scale-95"
                        aria-label={`Disminuir cantidad de ${item.nombre}`}
                      >
                        <MinusIcon size={16} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums text-carbon">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => onIncrement(item.id_producto)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-carbon transition hover:bg-white hover:text-dorado-oscuro active:scale-95"
                        aria-label={`Aumentar cantidad de ${item.nombre}`}
                      >
                        <PlusIcon size={16} />
                      </button>
                    </div>
                    <p className="font-display text-base font-bold tabular-nums text-carbon">
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
        <div className="space-y-3 border-t border-crema-borde px-4 py-3">
          <ClienteSection cliente={cliente} onChange={onClienteChange} />

          {/* Método de pago */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-carbon/75">
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
                    aria-pressed={selected}
                    className={`min-h-11 rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      selected
                        ? 'border-rojo-brasa bg-rojo-brasa text-white shadow-card'
                        : 'border-crema-borde bg-white text-carbon/80 hover:border-dorado-frito'
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
            <label className="block text-xs font-medium text-carbon/75">
              Descuento (%)
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={descuentoPct}
                onChange={(e) => onDescuentoPctChange(e.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-crema-borde bg-white px-3 py-2 text-sm tabular-nums text-carbon placeholder:text-carbon/60"
              />
            </label>
            <label className="block text-xs font-medium text-carbon/75">
              Observaciones
              <input
                type="text"
                value={observaciones}
                onChange={(e) => onObservacionesChange(e.target.value)}
                maxLength={500}
                placeholder="Nota en la factura"
                className="mt-1 w-full rounded-lg border border-crema-borde bg-white px-3 py-2 text-sm text-carbon placeholder:text-carbon/60"
              />
            </label>
          </div>

          {/* Incluir IVA */}
          <label className="flex items-start justify-between gap-3 rounded-xl border border-crema-borde bg-white p-3">
            <span className="text-sm font-semibold text-carbon">
              Incluir IVA ({IVA_PORCENTAJE_PREVIEW} %)
              <span className="mt-0.5 block text-xs font-normal text-carbon/60">Sin IVA por defecto</span>
            </span>
            <input
              type="checkbox"
              checked={aplicarIva}
              onChange={(e) => onAplicarIvaChange(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-rojo-brasa"
            />
          </label>

          {/* Totales */}
          <div className="space-y-1.5 rounded-2xl border border-crema-borde bg-white p-4 shadow-card text-sm">
            <div className="flex justify-between text-carbon/75">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums">{formatCOP(subtotal)}</span>
            </div>
            {aplicarIva && (
              <div className="flex justify-between text-carbon/75">
                <span>IVA ({IVA_PORCENTAJE_PREVIEW} %)</span>
                <span className="font-semibold tabular-nums">{formatCOP(ivaPreview)}</span>
              </div>
            )}
            {descuentoCOP > 0 && (
              <div className="flex justify-between text-rojo-brasa-oscuro">
                <span>Descuento</span>
                <span className="font-semibold tabular-nums">− {formatCOP(descuentoCOP)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-crema-borde pt-2">
              <span className="font-display text-base font-semibold text-carbon">
                Total estimado
              </span>
              <span className="font-display text-2xl font-bold tabular-nums text-rojo-brasa">
                {formatCOP(totalPreview)}
              </span>
            </div>
            <p className="text-[11px] text-carbon/50">
              El servidor calcula los valores finales de la factura (IVA y precios de BD).
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerar}
            disabled={generating}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rojo-brasa px-4 py-3 font-display text-base font-bold text-white shadow-brasa transition hover:bg-rojo-brasa-oscuro active:scale-[0.99] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="fixed inset-0 z-40 bg-carbon/50 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* Drawer móvil (dentro del flujo, a la derecha) */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(92vw,400px)] flex-col bg-crema-suave shadow-soft transition-transform duration-300 motion-reduce:transition-none lg:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {content}
      </div>
      {/* Panel fijo desktop */}
      <div className="fixed inset-y-0 right-0 z-20 hidden w-[400px] flex-col border-l border-crema-borde bg-crema-suave shadow-soft lg:flex">
        {content}
      </div>
    </>
  );
});