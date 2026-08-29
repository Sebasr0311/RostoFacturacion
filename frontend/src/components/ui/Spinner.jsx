// ============================================================
// components/ui/Spinner.jsx — Indicador de carga giratorio.
// ============================================================

export default function Spinner({ size = 20, light = false, className = '' }) {
  return (
    <svg
      className={`inline-block animate-spin ${light ? 'text-white' : 'text-rojo-brasa'} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Cargando"
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}