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
import { useNavigate } from 'react-router-dom';
import { listarFacturas } from '../services/facturaService';
import { obtenerResumenVentas, obtenerExcelVentasDia, obtenerExcelVentasRango } from '../services/reporteService';
import { errorMessage, saveBlob } from '../services/api';
import { toast } from '../components/ui/Toast';
import ResumenCards from '../components/historial/ResumenCards';
import FacturaModal from '../components/facturas/FacturaModal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import EstadoBadge from '../components/ui/EstadoBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import {
  SearchIcon,
  CalendarIcon,
  FileSpreadsheetIcon,
  EyeIcon,
  ReceiptIcon,
} from '../components/ui/Icons';
import { formatCOP, formatFecha, todayISO } from '../utils/format';
import { METODO_PAGO_LABEL } from '../utils/constants';

const MSG_SERVER =
  'No pudimos conectarnos con el servidor. Verifica que la API esté disponible y volvé a intentar.';

export default function HistorialPage() {
  const navigate = useNavigate();
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
      setError(MSG_SERVER);
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
      toast.success('Ventas del día exportadas.');
    } catch (err) {
      toast.error(errorMessage(err, MSG_SERVER));
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
      toast.success('Ventas del rango exportadas.');
    } catch (err) {
      toast.error(errorMessage(err, MSG_SERVER));
    } finally {
      setExportBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-crema-borde bg-white px-3.5 py-2.5 text-sm text-carbon placeholder:text-carbon/60';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-carbon">
            Historial y dashboard
          </h1>
          <p className="mt-0.5 text-sm text-carbon/65">
            Ventas del día, reportes y exportación.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportarHoy}
            disabled={exportBusy}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-carbon px-4 py-2.5 text-sm font-semibold text-crema-suave shadow-card transition hover:bg-carbon-claro disabled:opacity-60"
          >
            {exportBusy ? <Spinner size={16} light /> : <FileSpreadsheetIcon size={16} />}
            Exportar ventas del día
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-crema-borde bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex items-center gap-2 text-sm font-medium text-carbon/75">
          <CalendarIcon size={18} className="shrink-0 text-carbon/50" />
          <span className="sr-only">Fecha</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
        </label>
        <div className="relative sm:col-span-2">
          <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-carbon/50" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por número de factura o cliente…"
            aria-label="Buscar facturas por número o cliente"
            className={`${inputCls} pl-10`}
          />
        </div>
        {/* Exportar rango */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={rango.desde}
            onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))}
            aria-label="Fecha inicial del rango"
            className={inputCls}
          />
          <span className="text-carbon/50" aria-hidden="true">→</span>
          <input
            type="date"
            value={rango.hasta}
            onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))}
            aria-label="Fecha final del rango"
            className={inputCls}
          />
          <button
            type="button"
            onClick={exportarRango}
            disabled={exportBusy}
            title="Exportar ventas del rango seleccionado"
            aria-label="Exportar ventas del rango seleccionado"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-crema-borde bg-white text-carbon shadow-sm transition hover:border-dorado-frito hover:text-dorado-oscuro disabled:opacity-60"
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
              className="rounded-xl bg-rojo-brasa px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-rojo-brasa-oscuro"
            >
              Reintentar
            </button>
          }
        />
      ) : filtradas.length === 0 ? (
        facturas.length === 0 ? (
          <EmptyState
            icon={<ReceiptIcon size={26} />}
            title="Aún no hay ventas hoy"
            message="Genera tu primera factura desde el punto de venta y la verás aquí."
            action={
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-xl bg-carbon px-5 py-2.5 text-sm font-semibold text-crema-suave shadow-card transition hover:bg-carbon-claro"
              >
                Ir al punto de venta
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={<SearchIcon size={26} />}
            title="No hay resultados para la búsqueda"
            message="Probá con otro número de factura o nombre de cliente."
          />
        )
      ) : (
        <div className="overflow-hidden rounded-2xl border border-crema-borde bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">
                Listado de facturas de la fecha seleccionada
              </caption>
              <thead>
                <tr className="border-b border-crema-borde bg-crema-suave text-left text-[11px] font-semibold uppercase tracking-wide text-carbon/75">
                  <th scope="col" className="px-4 py-3">Factura</th>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Cliente</th>
                  <th scope="col" className="px-4 py-3">Método</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((f) => (
                  <tr key={f.id_factura} className="border-b border-crema-borde transition hover:bg-crema-suave/60">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-carbon">
                      {f.numero_factura}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-carbon/75">{formatFecha(f.fecha_factura)}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-carbon/75">
                      {f.cliente || 'CONSUMIDOR FINAL'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-carbon/75">
                      {METODO_PAGO_LABEL[f.metodo_pago] || f.metodo_pago}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-carbon">
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
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-carbon/60 transition hover:bg-crema-suave-osc hover:text-dorado-oscuro"
                          title="Ver factura"
                          aria-label={`Ver factura ${f.numero_factura}`}
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