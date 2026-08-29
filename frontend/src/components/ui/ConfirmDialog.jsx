// ============================================================
// components/ui/ConfirmDialog.jsx — Confirmación de acciones
// sensibles (anular factura, eliminar producto) con copy que
// respeta el nombre de la acción en todo el flujo.
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
            danger ? 'bg-brasa-suave text-rojo-brasa' : 'bg-mostaza-suave text-dorado-oscuro'
          }`}
        >
          <AlertIcon size={22} />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-carbon">{title}</h3>
          {message && <p className="mt-1 text-sm text-carbon/75">{message}</p>}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-crema-borde bg-white px-4 py-2 text-sm font-semibold text-carbon shadow-sm transition hover:bg-crema-suave-osc"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-card transition disabled:cursor-not-allowed disabled:opacity-60 ${
            danger
              ? 'bg-rojo-brasa hover:bg-rojo-brasa-oscuro'
              : 'bg-carbon hover:bg-carbon-claro'
          }`}
        >
          {loading && <Spinner size={16} light />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}