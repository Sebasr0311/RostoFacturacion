// ============================================================
// components/pos/ProductCard.jsx — Tarjeta de producto del catálogo.
// Click en cualquier parte de la tarjeta agrega al carrito.
// ============================================================

import { useState } from 'react';
import { PlusIcon } from '../ui/Icons';
import { formatCOP } from '../../utils/format';

function ProductImage({ producto }) {
  const [broken, setBroken] = useState(false);
  const src = producto?.imagen_url;

  if (!src || broken) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-gradient-to-br from-cream-100 to-cream-200 text-5xl">
        🍗
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
  return (
    <button
      type="button"
      onClick={() => onAdd(producto)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white p-3 text-left shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label={`Agregar ${producto.nombre} al carrito`}
    >
      <div className="relative">
        <ProductImage producto={producto} />
        <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <PlusIcon size={18} />
        </span>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-sm font-semibold text-cacao-900">{producto.nombre}</h3>
        <p className="mt-1 font-display text-lg font-bold text-brand-600">
          {formatCOP(producto.precio)}
        </p>
      </div>
    </button>
  );
}