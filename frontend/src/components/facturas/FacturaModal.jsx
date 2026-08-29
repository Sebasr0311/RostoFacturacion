// ============================================================
// components/facturas/FacturaModal.jsx — Modal de factura con acciones.
//
// - Recibe `factura` completa (caso POS: respuesta de POST) O
//   `facturaId` (caso Historial: carga GET /api/facturas/:id).
// - Flujo POS (recibe `onNewSale`): título "Factura generada" con
//   animación de check (firma) y CTA "Volver al punto de venta".
// - Acciones: Descargar PDF (blob + auth -> download), Imprimir
//   (blob + auth -> pestaña nueva) y, si `annulable`, "Anular factura"
//   con confirmación cuyo copy repite el nombre de la acción.
// ============================================================

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { Skeleton } from '../ui/Skeleton';
import ConfirmDialog from '../ui/ConfirmDialog';
import FacturaView from './FacturaView';
import { DownloadIcon, PrinterIcon, BanIcon, CheckIcon } from '../ui/Icons';
import { obtenerFactura, obtenerPdfFactura, anularFactura } from '../../services/facturaService';
import { errorMessage, saveBlob, openBlobInNewTab } from '../../services/api';
import { toast } from '../ui/Toast';

export default function FacturaModal({
  open,
  onClose,
  facturaId = null,
  factura = null,
  annulable = false,
  onAnnulled,
  onNewSale,
}) {
  const [loaded, setLoaded] = useState(factura);
  const [loading, setLoading] = useState(Boolean(facturaId && !factura));
  const [bussy, setBussy] = useState(false);
  const [confirmAnular, setConfirmAnular] = useState(false);
  const [anulando, setAnulando] = useState(false);

  const invoice = factura || loaded;
  const id = invoice?.id_factura || facturaId;
  const esFlujoPos = Boolean(onNewSale);

  // Carga del detalle cuando llega facturaId (Historial).
  useEffect(() => {
    if (!open) return;
    if (factura) {
      setLoaded(factura);
      setLoading(false);
      return;
    }
    if (!facturaId) return;
    let cancelled = false;
    setLoading(true);
    obtenerFactura(facturaId)
      .then((data) => {
        if (!cancelled) setLoaded(data);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            errorMessage(err, 'No se pudo cargar la factura. Verifica la conexión y volvé a intentar.')
          );
          onClose?.();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, factura, facturaId, onClose]);

  // Reset al cerrar.
  useEffect(() => {
    if (!open) {
      setLoaded(null);
      setConfirmAnular(false);
    }
  }, [open]);

  const handleDescargar = async () => {
    if (!id) return;
    setBussy(true);
    try {
      const blob = await obtenerPdfFactura(id);
      saveBlob(blob, `factura-${invoice.numero_factura}.pdf`);
      toast.success('PDF de la factura descargado.');
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo descargar el PDF. Verifica la conexión y volvé a intentar.'));
    } finally {
      setBussy(false);
    }
  };

  // Imprimir: abre el PDF del servidor en una pestaña nueva (el visor
  // nativo del navegador ofrece imprimir). Se usa blob + auth porque el
  // endpoint exige el header Authorization.
  const handleImprimir = async () => {
    if (!id) return;
    setBussy(true);
    try {
      const blob = await obtenerPdfFactura(id);
      openBlobInNewTab(blob);
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo abrir el PDF para imprimir.'));
    } finally {
      setBussy(false);
    }
  };

  const handleConfirmarAnular = async () => {
    if (!id) return;
    setAnulando(true);
    try {
      await anularFactura(id);
      setConfirmAnular(false);
      toast.success('Factura anulada.');
      if (onAnnulled) onAnnulled(invoice.numero_factura);
      onClose?.();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo anular la factura.'));
    } finally {
      setAnulando(false);
    }
  };

  const title = invoice
    ? esFlujoPos
      ? 'Factura generada'
      : `Factura ${invoice.numero_factura}`
    : 'Factura';

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={title}
        size="xl"
        footer={
          <>
            {invoice && (
              <>
                <button
                  type="button"
                  onClick={handleDescargar}
                  disabled={bussy}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-crema-borde bg-white px-4 py-2 text-sm font-semibold text-carbon shadow-sm transition hover:bg-crema-suave-osc disabled:opacity-60"
                >
                  <DownloadIcon size={16} />
                  Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={handleImprimir}
                  disabled={bussy}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-carbon px-4 py-2 text-sm font-semibold text-crema-suave shadow-card transition hover:bg-carbon-claro disabled:opacity-60"
                >
                  <PrinterIcon size={16} />
                  Imprimir
                </button>
                {annulable && invoice.estado === 'PAGADA' && (
                  <button
                    type="button"
                    onClick={() => setConfirmAnular(true)}
                    disabled={bussy}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rojo-brasa/40 bg-white px-4 py-2 text-sm font-semibold text-rojo-brasa-oscuro shadow-sm transition hover:bg-brasa-suave disabled:opacity-60"
                  >
                    <BanIcon size={16} />
                    Anular factura
                  </button>
                )}
              </>
            )}
            {!esFlujoPos && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-crema-borde bg-white px-4 py-2 text-sm font-semibold text-carbon shadow-sm transition hover:bg-crema-suave-osc"
              >
                Cerrar
              </button>
            )}
            {esFlujoPos && (
              <button
                type="button"
                onClick={onNewSale}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rojo-brasa px-5 py-2.5 font-display text-sm font-bold text-white shadow-brasa transition hover:bg-rojo-brasa-oscuro"
              >
                Volver al punto de venta
              </button>
            )}
          </>
        }
      >
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : invoice ? (
          <div className="space-y-3">
            {esFlujoPos && (
              <div
                key={invoice.numero_factura}
                className="flex items-center gap-3 rounded-xl bg-mostaza-suave px-4 py-3 motion-safe:animate-pop-in"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dorado-frito text-carbon">
                  <CheckIcon size={18} />
                </span>
                <p className="text-sm font-medium text-carbon">
                  La factura {invoice.numero_factura} se generó correctamente.
                </p>
              </div>
            )}
            <FacturaView factura={invoice} />
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={confirmAnular}
        title={
          invoice?.numero_factura
            ? `¿Anular la factura ${invoice.numero_factura}?`
            : '¿Anular esta factura?'
        }
        message="Quedará con estado ANULADA y no contará en los reportes de ventas. Esta acción no se puede deshacer."
        confirmLabel="Anular factura"
        loading={anulando}
        onConfirm={handleConfirmarAnular}
        onCancel={() => setConfirmAnular(false)}
      />
    </>
  );
}