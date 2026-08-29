// ============================================================
// components/ui/ConfirmDialog.jsx — Confirmación destructiva.
// Uso típico: eliminar producto, anular factura.
// ============================================================

import Modal from './Modal';
import Spinner from './Spinner';
import { AlertIcon } from './Icons';

export default function ConfirmDialog({
  open = false,
  title = '¿Confirmar acción?',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel} size="md">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            danger ? 'bg-brand-100 text-brand-600' : 'bg-sky-100 text-sky-600'
          }`}
        >
          <AlertIcon size={22} />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-cacao-900">{title}</h3>
          {message && <p className="mt-1 text-sm text-cacao-700">{message}</p>}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-cacao-800 shadow-sm transition hover:bg-cream-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
            danger ? 'bg-brand-600 hover:bg-brand-700' : 'bg-sky-600 hover:bg-sky-700'
          }`}
        >
          {loading && <Spinner size={16} light />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}