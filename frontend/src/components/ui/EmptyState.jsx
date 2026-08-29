// ============================================================
// components/ui/EmptyState.jsx — Estado vacío con mensaje claro.
// ============================================================

export default function EmptyState({
  icon,
  title = 'Sin datos',
  message = '',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cream-200 bg-white/60 px-6 py-14 text-center">
      {icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-cacao-500">
          {icon}
        </span>
      )}
      <div>
        <h3 className="font-display text-base font-semibold text-cacao-900">{title}</h3>
        {message && <p className="mt-1 max-w-sm text-sm text-cacao-600">{message}</p>}
      </div>
      {action}
    </div>
  );
}