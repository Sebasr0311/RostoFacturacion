// ============================================================
// components/ui/Modal.jsx — Modal genérico (overlay + panel).
// Cierra con ESC, clic en el backdrop o botón X. Props:
//   open, onClose, title, size ('md'|'lg'|'xl'), children, footer.
// ============================================================

import { useEffect, useRef } from 'react';
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
  const panelRef = useRef(null);
  const FOCUSABLES =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  // Cicla el foco con Tab entre los elementos enfocables del panel,
  // envolviendo del primero al último (trampa de foco).
  function handleTab(e) {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll(FOCUSABLES)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
    if (items.length === 0) {
      e.preventDefault();
      panel.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  useEffect(() => {
    if (!open) return undefined;
    const prevFocus = document.activeElement;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Enfocar el panel al abrir (tabIndex={-1} lo hace seguro).
    panelRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-carbon/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Diálogo'}
        onKeyDown={handleTab}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-soft motion-safe:animate-fade-in outline-none sm:rounded-2xl ${SIZES[size]}`}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 border-b border-crema-borde px-5 py-4">
            <h3 className="font-display text-lg font-semibold text-carbon">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-carbon/60 transition hover:bg-crema-suave-osc hover:text-carbon"
              aria-label="Cerrar"
            >
              <XIcon size={20} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-crema-borde bg-crema-suave px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}