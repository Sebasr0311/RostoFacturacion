// ============================================================
// pages/PedidosActivosPage.jsx — Pedidos activos (cola de despacho).
//
// VISTA OPERATIVA: facturas PAGADA con estado_envio PENDIENTE, las más
// antiguas primero. Es DISTINTA del Historial (que muestra TODAS las
// facturas del día para control de ventas): aquí solo importa lo que
// falta despachar AHORA.
//
// - Tarjetas con hora, "hace X min", cliente, resumen de productos,
//   total y botón grande "Marcar como enviado" (PUT /facturas/:id/enviar).
// - Al enviar: la tarjeta sale con una transición breve y el badge del
//   nav se refresca vía CustomEvent (rosto:pedidos-actualizados).
// - Si el PUT falla, la tarjeta se queda y se muestra error inline
//   con Reintentar (mismo patrón del resto del sistema).
// - Botón "Actualizar" manual; no hay polling automático.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarPedidosActivos, marcarPedidoEnviado } from '../services/facturaService';
import { errorMessage } from '../services/api';
import { toast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { BikeIcon, CheckIcon, RefreshIcon } from '../components/ui/Icons';
import { formatCOP, formatHora, formatHace } from '../utils/format';

const EVENTO_PEDIDOS = 'rosto:pedidos-actualizados';

const MSG_SERVER =
  'No pudimos conectarnos con el servidor. Verifica que la API esté disponible y volvé a intentar.';

// Los productos salen de detalle_factura: nombre + cantidad.
function ResumenProductos({ productos }) {
  if (!productos || productos.length === 0) {
    return <p className="text-sm text-carbon/60">Sin detalle de productos.</p>;
  }
  return (
    <ul className="space-y-1">
      {productos.map((p, i) => (
        <li key={`${p.nombre}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-carbon/75">
            <span className="font-semibold tabular-nums text-carbon">{p.cantidad}×</span>{' '}
            {p.nombre}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PedidosActivosPage() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saliendo, setSaliendo] = useState(new Set()); // ids en transición de salida
  const [enviandoIds, setEnviandoIds] = useState(new Set());
  const [errores, setErrores] = useState({}); // id -> mensaje inline

  const cargarPedidos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listarPedidosActivos();
      // Orden defensivo: más antiguo primero (el backend ya ordena ASC).
      const ordenados = [...data].sort(
        (a, b) => new Date(a.fecha_factura) - new Date(b.fecha_factura)
      );
      setPedidos(ordenados);
    } catch (err) {
      setError(MSG_SERVER);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const marcarEnviado = async (id) => {
    setEnviandoIds((prev) => new Set(prev).add(id));
    setErrores((prev) => ({ ...prev, [id]: '' }));
    try {
      await marcarPedidoEnviado(id);
      // Transición breve de salida antes de quitar la tarjeta.
      setSaliendo((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setPedidos((prev) => prev.filter((p) => p.id_factura !== id));
        setSaliendo((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setEnviandoIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        // El nav escucha este evento para refrescar el badge.
        window.dispatchEvent(new CustomEvent(EVENTO_PEDIDOS));
      }, 220);
      toast.success('Pedido marcado como enviado.');
    } catch (err) {
      setErrores((prev) => ({ ...prev, [id]: errorMessage(err, MSG_SERVER) }));
      setEnviandoIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const count = pedidos.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-carbon">Pedidos activos</h1>
          <p className="mt-0.5 text-sm text-carbon/65">
            Lo que falta despachar ahora · el más antiguo primero.
          </p>
        </div>
        <button
          type="button"
          onClick={cargarPedidos}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-crema-borde bg-white px-4 py-2.5 text-sm font-semibold text-carbon shadow-sm transition hover:border-dorado-frito hover:text-dorado-oscuro disabled:opacity-60"
        >
          <RefreshIcon size={16} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-44 motion-reduce:animate-none animate-pulse rounded-2xl border border-crema-borde bg-white/70 shadow-card"
            />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<BikeIcon size={26} />}
          title="No se pudieron cargar los pedidos"
          message={error}
          action={
            <button
              type="button"
              onClick={cargarPedidos}
              className="rounded-xl bg-rojo-brasa px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-rojo-brasa-oscuro"
            >
              Reintentar
            </button>
          }
        />
      ) : count === 0 ? (
        <EmptyState
          icon={<CheckIcon size={26} />}
          title="Todo enviado — no hay pedidos pendientes"
          message="Cuando generes una factura desde el punto de venta, el pedido aparecerá aquí en la cola de despacho."
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pedidos.map((p) => (
            <article
              key={p.id_factura}
              className={`rounded-2xl border border-crema-borde bg-white p-4 shadow-card transition-all duration-200 sm:p-5 ${
                saliendo.has(p.id_factura) ? 'translate-y-1 opacity-0' : 'opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-carbon">{p.numero_factura}</p>
                  <p className="mt-0.5 text-xs text-carbon/60">
                    {formatHora(p.fecha_factura)} · {formatHace(p.fecha_factura)}
                  </p>
                </div>
                <p className="text-right font-display text-xl font-bold tabular-nums text-rojo-brasa-oscuro">
                  {formatCOP(p.total)}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-carbon/80">
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-mostaza-suave font-semibold text-carbon">
                  {p.cliente?.nombre
                    ? p.cliente.nombre
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                    : 'CF'}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-carbon">
                    {p.cliente?.nombre || 'CONSUMIDOR FINAL'}
                  </p>
                  {p.cliente?.telefono && (
                    <p className="truncate text-xs tabular-nums text-carbon/60">
                      {p.cliente.telefono}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-crema-suave/70 p-3">
                <ResumenProductos productos={p.productos} />
              </div>

              {errores[p.id_factura] && (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-rojo-brasa/40 bg-brasa-suave px-3.5 py-2.5 text-sm text-rojo-brasa-oscuro"
                >
                  <p>{errores[p.id_factura]}</p>
                  <button
                    type="button"
                    onClick={() => marcarEnviado(p.id_factura)}
                    className="mt-1.5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-rojo-brasa px-4 py-2 text-sm font-semibold text-white transition hover:bg-rojo-brasa-oscuro"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => marcarEnviado(p.id_factura)}
                disabled={enviandoIds.has(p.id_factura) || saliendo.has(p.id_factura)}
                className="mt-4 flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-rojo-brasa px-4 py-3.5 font-display text-base font-bold text-white shadow-brasa transition hover:bg-rojo-brasa-oscuro active:scale-[0.99] motion-reduce:active:scale-100 disabled:opacity-70"
              >
                {enviandoIds.has(p.id_factura) ? (
                  <>
                    <Spinner size={18} light />
                    Enviando…
                  </>
                ) : (
                  <>
                    <BikeIcon size={20} />
                    Marcar como enviado
                  </>
                )}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}