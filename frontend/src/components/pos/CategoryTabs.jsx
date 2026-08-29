// ============================================================
// components/pos/CategoryTabs.jsx — Pestañas de categorías.
// Muestra "Todos" + categorías activas con conteo de productos.
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
    <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
      {items.map((tab) => {
        const isActive = String(tab.id) === String(active);
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? 'bg-cacao-900 text-white shadow-card'
                : 'border border-cream-200 bg-white text-cacao-700 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            <span>{tab.nombre}</span>
            <span
              className={`rounded-full px-1.5 text-[11px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-cream-100 text-cacao-600'
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