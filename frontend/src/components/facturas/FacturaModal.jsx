// ============================================================
// components/facturas/FacturaModal.jsx — Modal de factura con acciones.
//
// - Recibe `factura` completa (caso POS: respuesta de POST) O
//   `facturaId` (caso Historial: carga GET /api/facturas/:id).
// - Acciones: Descargar PDF (blob + auth -> download), Imprimir
//   (blob + auth -> pestaña nueva con el PDF del servidor) y, si
//   `annulable`, Anular con confirmación.
// ============================================================

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { Skeleton } from '../ui/Skeleton';
import ConfirmDialog from '../ui/ConfirmDialog';
import FacturaView from './FacturaView';
import { DownloadIcon, PrinterIcon, BanIcon } from '../ui/Icons';
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
          toast.error(errorMessage(err, 'No se pudo cargar la factura.'));
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
      toast.success('PDF descargado.');
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo descargar el PDF.'));
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
      toast.success('Factura anulada correctamente.');
      if (onAnnulled) onAnnulled(invoice.numero_factura);
      onClose?.();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo anular la factura.'));
    } finally {
      setAnulando(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={invoice ? `Factura ${invoice.numero_factura}` : 'Factura'}
        size="xl"
        footer={
          <>
            {onNewSale && invoice && (
              <button
                type="button"
                onClick={onNewSale}
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                Nueva venta
              </button>
            )}
            {invoice && (
              <>
                <button
                  type="button"
                  onClick={handleDescargar}
                  disabled={bussy}
                  className="inline-flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-cacao-800 shadow-sm transition hover:bg-cream-50 disabled:opacity-60"
                >
                  <DownloadIcon size={16} />
                  Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={handleImprimir}
                  disabled={bussy}
                  className="inline-flex items-center gap-2 rounded-xl bg-cacao-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cacao-950 disabled:opacity-60"
                >
                  <PrinterIcon size={16} />
                  Imprimir
                </button>
                {annulable && invoice.estado === 'PAGADA' && (
                  <button
                    type="button"
                    onClick={() => setConfirmAnular(true)}
                    disabled={bussy}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50 disabled:opacity-60"
                  >
                    <BanIcon size={16} />
                    Anular
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-cacao-800 shadow-sm transition hover:bg-cream-50"
            >
              Cerrar
            </button>
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
          <FacturaView factura={invoice} />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={confirmAnular}
        title="¿Anular esta factura?"
        message={`La factura ${invoice?.numero_factura || ''} quedará con estado ANULADA y no contará en los reportes de ventas. Esta acción no se puede deshacer.`}
        confirmLabel="Anular factura"
        loading={anulando}
        onConfirm={handleConfirmarAnular}
        onCancel={() => setConfirmAnular(false)}
      />
    </>
  );
}