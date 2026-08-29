// ============================================================
// components/ui/Modal.jsx — Modal genérico (overlay + panel).
// Cierra con ESC, clic en el backdrop o botón X. Props:
//   open, onClose, title, size ('md'|'lg'|'xl'), children, footer.
// ============================================================

import { useEffect } from 'react';
import { XIcon } from './Icons';

const SIZES = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open = false,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-cacao-950/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Diálogo'}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-soft sm:rounded-2xl ${SIZES[size]}`}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 border-b border-cream-100 px-5 py-4">
            <h3 className="font-display text-lg font-semibold text-cacao-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-cacao-500 transition hover:bg-cream-100 hover:text-cacao-900"
              aria-label="Cerrar"
            >
              <XIcon size={20} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-cream-100 bg-cream-50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}