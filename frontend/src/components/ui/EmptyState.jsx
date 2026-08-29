// ============================================================
// components/ui/EmptyState.jsx — Estado vacío con mensaje claro
// e invitación a actuar (copy accionable, nunca "sin datos").
// ============================================================

export default function EmptyState({
  icon,
  title = 'Sin datos',
  message = '',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-crema-borde bg-white/70 px-6 py-14 text-center">
      {icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mostaza-suave text-dorado-oscuro">
          {icon}
        </span>
      )}
      <div>
        <h3 className="font-display text-lg font-semibold text-carbon">{title}</h3>
        {message && <p className="mx-auto mt-1 max-w-md text-sm text-carbon/70">{message}</p>}
      </div>
      {action}
    </div>
  );
}