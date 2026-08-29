// ============================================================
// components/ui/Toast.jsx — Toasts globales por eventos.
// Uso: toast.success('Producto creado.') desde cualquier capa
// (incluidos los servicios); <ToastHost/> se monta una vez en main.
// ============================================================

import { useEffect, useState } from 'react';
import { CheckIcon, AlertIcon, InfoIcon, XIcon } from './Icons';

const listeners = new Set();
let counter = 0;

function emit(type, message) {
  const toastItem = { id: ++counter, type, message };
  listeners.forEach((fn) => fn(toastItem));
}

export const toast = {
  success: (message) => emit('success', message),
  error: (message) => emit('error', message),
  info: (message) => emit('info', message),
};

const STYLES = {
  success: {
    box: 'border-emerald-200 bg-white text-emerald-800',
    icon: 'bg-emerald-500 text-white',
    Icon: CheckIcon,
  },
  error: {
    box: 'border-brand-200 bg-white text-brand-700',
    icon: 'bg-brand-600 text-white',
    Icon: AlertIcon,
  },
  info: {
    box: 'border-sky-200 bg-white text-sky-800',
    icon: 'bg-sky-500 text-white',
    Icon: InfoIcon,
  },
};

export function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const subscribe = (item) => {
      setToasts((prev) => [...prev, item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 4500);
    };
    listeners.add(subscribe);
    return () => listeners.delete(subscribe);
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const s = STYLES[t.type];
        const { Icon } = s;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-soft animate-[toast-in_.25s_ease-out] ${s.box}`}
          >
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.icon}`}>
              <Icon size={14} />
            </span>
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 text-cacao-500 transition hover:bg-cacao-100/60 hover:text-cacao-900"
              aria-label="Cerrar notificación"
            >
              <XIcon size={16} />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}