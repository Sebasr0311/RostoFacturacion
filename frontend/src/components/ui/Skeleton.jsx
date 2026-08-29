// ============================================================
// components/ui/Skeleton.jsx — Esqueletos de carga (skeleton UI).
// ============================================================

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-cream-200/80 ${className}`} />;
}

/** Skeleton para filas de tabla. */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 rounded-xl border border-cream-100 bg-white p-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={c === 0 ? 'h-12 w-12 rounded-xl' : 'h-4 flex-1'} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton para tarjetas de producto (POS). */
export function ProductCardSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-cream-100 bg-white p-3 shadow-card">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-5 w-1/2" />
        </div>
      ))}
    </div>
  );
}