// ============================================================
// components/pos/CategoryTabs.jsx — Pestañas reales de categoría.
// "Todos" + categorías activas con conteo. Estado activo claro:
// píldora carbón con texto dorado (contraste 7.16:1) — el carbón
// encendido marca la selección sin depender solo del color.
// Touch target >= 44px (tablet del POS).
// ============================================================

export default function CategoryTabs({
  categorias = [],
  active = 'TODAS',
  onSelect,
  getCount,
}) {
  const items = [
    { id: 'TODAS', nombre: 'Todos', count: getCount(null) },
    ...categorias.map((c) => ({
      id: c.id_categoria,
      nombre: c.nombre,
      count: getCount(c.id_categoria),
    })),
  ];

  return (
    <div
      role="group"
      aria-label="Categorías de productos"
      className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]"
    >
      {items.map((tab) => {
        const isActive = String(tab.id) === String(active);
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-pressed={isActive}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? 'bg-carbon text-dorado-frito shadow-card'
                : 'border border-crema-borde bg-white text-carbon/80 hover:border-dorado-frito hover:text-carbon'
            }`}
          >
            <span>{tab.nombre}</span>
            <span
              className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                isActive
                  ? 'bg-dorado-frito text-carbon'
                  : 'bg-crema-suave-osc text-carbon/70'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}