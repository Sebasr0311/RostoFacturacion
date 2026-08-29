// ============================================================
// components/pos/ProductCard.jsx — Tarjeta de producto del catálogo.
//
// FIRMA (a): micro-animación de "añadido al carrito".
// - click: la tarjeta hace un "pop" de escala (300ms, easing suave,
//   vía Web Animations API) y un chip dorado "✓ Añadido" aparece
//   sobre la imagen; el ícono del carrito rebota en CartPanel.
// - respeta prefers-reduced-motion (se omite el pop).
// - el botón "+" es SIEMPRE visible (touch, tablet), no solo hover.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { PlusIcon, FlameIcon } from '../ui/Icons';
import { formatCOP } from '../../utils/format';

function ProductImage({ producto }) {
  const [broken, setBroken] = useState(false);
  const src = producto?.imagen_url;

  if (!src || broken) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-gradient-to-br from-dorado-frito/25 via-mostaza-suave to-crema-suave-osc text-5xl">
        <FlameIcon size={44} className="text-dorado-oscuro" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={producto.nombre}
      loading="lazy"
      onError={() => setBroken(true)}
      className="aspect-[4/3] w-full rounded-xl object-cover"
    />
  );
}

export default function ProductCard({ producto, onAdd }) {
  const cardRef = useRef(null);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef(null);

  // Limpia el timer si el componente se desmonta.
  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const handleAdd = () => {
    onAdd(producto);

    // Pop de escala (firma): 300ms, solo si no hay reduced motion.
    const el = cardRef.current;
    if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(0.96)' },
          { transform: 'scale(1)' },
        ],
        { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }

    // Chip "Añadido" (~1s, transición de opacidad de 150ms).
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1000);
  };

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={handleAdd}
      className="group relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl border border-crema-borde bg-white p-3 text-left shadow-card transition duration-200 hover:-translate-y-1 hover:border-dorado-frito hover:shadow-soft motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      aria-label={`Agregar ${producto.nombre} al carrito`}
    >
      <div className="relative">
        <ProductImage producto={producto} />
        {/* Chip "Añadido" — firma (a) */}
        <span
          className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-carbon px-2.5 py-1 text-xs font-bold text-dorado-frito shadow-card transition-opacity duration-150 motion-safe:animate-pop-in ${
            added ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Añadido
        </span>
        <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-dorado-frito text-carbon shadow-card transition group-hover:bg-dorado-oscuro group-focus-visible:bg-dorado-oscuro">
          <PlusIcon size={18} />
        </span>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-carbon">
          {producto.nombre}
        </h3>
        <p className="mt-1 font-display text-lg font-bold tabular-nums text-rojo-brasa">
          {formatCOP(producto.precio)}
        </p>
      </div>
    </button>
  );
}