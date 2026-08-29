// ============================================================
// pages/HistorialPage.jsx — Historial de ventas / dashboard.
//
// - Filtro por fecha (default hoy) + buscador (número/cliente).
// - Resumen desde GET /api/reportes/ventas-rango?desde&hasta (mismo
//   shape que ventas-dia); si el reporte falla, se deriva del listado.
// - Exportar Excel: ventas del día (ventas-dia/excel) y por rango
//   (ventas-rango/excel?desde&hasta) — descarga blob con auth.
// - Ver factura (FacturaModal) y anular con confirmación.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { listarFacturas } from '../services/facturaService';
import { obtenerResumenVentas, obtenerExcelVentasDia, obtenerExcelVentasRango } from '../services/reporteService';
import { errorMessage, saveBlob } from '../services/api';
import { toast } from '../components/ui/Toast';
import ResumenCards from '../components/historial/ResumenCards';
import FacturaModal from '../components/facturas/FacturaModal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { TableSkeleton } from '../components/ui/Skeleton';
import {
  SearchIcon,
  CalendarIcon,
  FileSpreadsheetIcon,
  EyeIcon,
  ReceiptIcon,
} from '../components/ui/Icons';
import { formatCOP, formatFecha, todayISO } from '../utils/format';
import { METODO_PAGO_LABEL, ESTADO_FACTURA } from '../utils/constants';

function EstadoBadge({ estado }) {
  const info = ESTADO_FACTURA[estado] || { label: estado };
  const anulada = estado === 'ANULADA';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        anulada ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {info.label}
    </span>
  );
}

export default function HistorialPage() {
  const [fecha, setFecha] = useState(todayISO());
  const [busqueda, setBusqueda] = useState('');
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [resumen, setResumen] = useState(null);
  const [resumenLoading, setResumenLoading] = useState(true);
  const [resumenDerived, setResumenDerived] = useState(false);

  const [verFactura, setVerFactura] = useState(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [rango, setRango] = useState({ desde: todayISO(), hasta: todayISO() });

  // ---- Carga del listado por fecha ----
  const cargarLista = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listarFacturas({ fecha });
      setFacturas(data);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo cargar el historial.'));
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  // ---- Resumen: reporte oficial con fallback derivado del listado ----
  useEffect(() => {
    let cancelled = false;
    setResumenLoading(true);
    setResumenDerived(false);

    obtenerResumenVentas({ desde: fecha, hasta: fecha })
      .then((data) => {
        if (!cancelled) setResumen(data.resumen);
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback: derivar de las facturas PAGADAS del listado.
          const pagadas = facturas.filter((f) => f.estado === 'PAGADA');
          const total = pagadas.reduce((acc, f) => acc + f.total, 0);
          setResumen({
            total_vendido: total,
            numero_facturas: pagadas.length,
            ticket_promedio: pagadas.length ? total / pagadas.length : 0,
            producto_mas_vendido: null,
            producto_mas_vendido_cantidad: 0,
            forma_pago_top: null,
            forma_pago_top_transacciones: 0,
          });
          setResumenDerived(true);
        }
      })
      .finally(() => {
        if (!cancelled) setResumenLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fecha, facturas]);

  // ---- Buscador local (número/cliente) ----
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return facturas;
    return facturas.filter(
      (f) =>
        (f.numero_factura || '').toLowerCase().includes(q) ||
        (f.cliente || '').toLowerCase().includes(q)
    );
  }, [facturas, busqueda]);

  // ---- Exportaciones ----
  const exportarHoy = async () => {
    setExportBusy(true);
    try {
      const blob = await obtenerExcelVentasDia();
      saveBlob(blob, `reporte-ventas-${todayISO()}.xlsx`);
      toast.success('Excel de hoy descargado.');
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo exportar el Excel.'));
    } finally {
      setExportBusy(false);
    }
  };

  const exportarRango = async () => {
    if (!rango.desde || !rango.hasta) {
      toast.error('Selecciona la fecha inicial y final.');
      return;
    }
    if (rango.desde > rango.hasta) {
      toast.error('La fecha inicial no puede ser mayor que la final.');
      return;
    }
    setExportBusy(true);
    try {
      const blob = await obtenerExcelVentasRango(rango.desde, rango.hasta);
      saveBlob(blob, `reporte-ventas-${rango.desde}_${rango.hasta}.xlsx`);
      toast.success('Excel del rango descargado.');
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo exportar el Excel.'));
    } finally {
      setExportBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-cream-200 bg-white px-3.5 py-2.5 text-sm text-cacao-900 outline-none transition placeholder:text-cacao-500/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cacao-900">Historial y dashboard</h1>
          <p className="text-sm text-cacao-600">Ventas del día, reportes y exportación.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportarHoy}
            disabled={exportBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {exportBusy ? <Spinner size={16} light /> : <FileSpreadsheetIcon size={16} />}
            Excel hoy
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex items-center gap-2 text-sm font-medium text-cacao-700">
          <CalendarIcon size={18} className="shrink-0 text-cacao-500" />
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
        </label>
        <div className="relative sm:col-span-2">
          <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cacao-500" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por número de factura o cliente…"
            className={`${inputCls} pl-10`}
          />
        </div>
        {/* Exportar rango */}
        <div className="flex items-center gap-2">
          <input type="date" value={rango.desde} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))} className={inputCls} />
          <span className="text-cacao-500">→</span>
          <input type="date" value={rango.hasta} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))} className={inputCls} />
          <button
            type="button"
            onClick={exportarRango}
            disabled={exportBusy}
            title="Exportar Excel del rango seleccionado"
            className="shrink-0 rounded-xl border border-cream-200 bg-white p-2.5 text-cacao-700 shadow-sm transition hover:bg-cream-50 hover:text-emerald-700 disabled:opacity-60"
          >
            <FileSpreadsheetIcon size={18} />
          </button>
        </div>
      </div>

      {/* Resumen */}
      <ResumenCards resumen={resumen} loading={resumenLoading} derived={resumenDerived} />

      {/* Tabla */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : error ? (
        <EmptyState
          icon={<ReceiptIcon size={26} />}
          title="No se pudo cargar el historial"
          message={error}
          action={
            <button
              type="button"
              onClick={cargarLista}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Reintentar
            </button>
          }
        />
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon size={26} />}
          title={facturas.length === 0 ? 'No hay facturas en esta fecha' : 'Sin resultados para la búsqueda'}
          message={
            facturas.length === 0
              ? 'Genera una venta desde el punto de venta para verla aquí.'
              : 'Prueba con otro número de factura o nombre de cliente.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50 text-left text-[11px] font-semibold uppercase tracking-wide text-cacao-500">
                  <th className="px-4 py-3">Factura</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((f) => (
                  <tr key={f.id_factura} className="border-b border-cream-100 transition hover:bg-cream-50/60">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-cacao-900">
                      {f.numero_factura}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-cacao-700">{formatFecha(f.fecha_factura)}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-cacao-700">
                      {f.cliente || 'CONSUMIDOR FINAL'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-cacao-700">
                      {METODO_PAGO_LABEL[f.metodo_pago] || f.metodo_pago}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-cacao-900">
                      {formatCOP(f.total)}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={f.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setVerFactura(f.id_factura)}
                          className="rounded-lg p-2 text-cacao-600 transition hover:bg-cream-100 hover:text-brand-600"
                          title="Ver factura"
                        >
                          <EyeIcon size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalle + anular */}
      <FacturaModal
        open={Boolean(verFactura)}
        facturaId={verFactura}
        annulable
        onClose={() => setVerFactura(null)}
        onAnnulled={() => {
          setVerFactura(null);
          cargarLista();
        }}
      />
    </div>
  );
}