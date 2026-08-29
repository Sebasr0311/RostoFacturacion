// ============================================================
// components/layout/Sidebar.jsx — Navegación lateral en carbón
// (el carbón de la parrilla). Desktop: fija y visible.
// Móvil/tablet: drawer deslizante (controlado desde Layout).
// El ítem activo se enciende en dorado-frito sobre carbón.
// ============================================================

import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listarPedidosActivos } from '../../services/facturaService';
import {
  ShoppingCartIcon,
  PackageIcon,
  ChartIcon,
  BikeIcon,
  XIcon,
  LogOutIcon,
  FlameIcon,
} from '../ui/Icons';
import { initials } from '../../utils/format';

const NAV_ITEMS = [
  { to: '/', label: 'Punto de venta', Icon: ShoppingCartIcon },
  { to: '/productos', label: 'Productos', Icon: PackageIcon },
  { to: '/historial', label: 'Historial / Dashboard', Icon: ChartIcon },
];

// Evento global: lo disparan el POS (factura nueva) y PedidosActivosPage
// (pedido marcado como enviado) para refrescar el badge sin polling.
const EVENTO_PEDIDOS = 'rosto:pedidos-actualizados';

/**
 * Ítem de navegación "Pedidos Activos" con badge del número de pedidos
 * pendientes. Se refresca al montar, al volver a la pestaña (focus) y
 * cuando se dispara el evento de pedidos.
 */
function PedidosNavItem({ onNavigate }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cargar = async () => {
      try {
        const lista = await listarPedidosActivos();
        if (!cancelled) setCount(Array.isArray(lista) ? lista.length : 0);
      } catch {
        // Fallo puntual (p. ej. red o piscina de BD ocupada): NO reseteamos
        // a 0 para evitar un falso negativo en el badge. El próximo
        // focus/evento reintenta y corrige el conteo.
        /* no-op */
      }
    };
    cargar();
    const onPedidos = () => cargar();
    window.addEventListener(EVENTO_PEDIDOS, onPedidos);
    window.addEventListener('focus', onPedidos);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENTO_PEDIDOS, onPedidos);
      window.removeEventListener('focus', onPedidos);
    };
  }, []);

  return (
    <NavLink
      to="/pedidos"
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
          isActive
            ? 'bg-dorado-frito text-carbon shadow-lg shadow-black/30'
            : 'text-crema-suave/75 hover:bg-carbon-claro hover:text-crema-suave'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <BikeIcon
            size={20}
            className={isActive ? 'text-carbon' : 'text-crema-suave/50 group-hover:text-dorado-frito'}
          />
          <span className="flex-1">Pedidos Activos</span>
          {count > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rojo-brasa px-1.5 text-xs font-bold tabular-nums text-white">
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-dorado-frito text-carbon shadow-lg shadow-black/40">
        <FlameIcon size={26} />
      </span>
      <div>
        <p className="font-display text-xl font-bold leading-none text-crema-suave">Rosto</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-crema-suave/60">
          Pollo a la brasa
        </p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }) {
  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-dorado-frito text-carbon shadow-lg shadow-black/30'
                : 'text-crema-suave/75 hover:bg-carbon-claro hover:text-crema-suave'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={20}
                className={isActive ? 'text-carbon' : 'text-crema-suave/50 group-hover:text-dorado-frito'}
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
      <PedidosNavItem onNavigate={onNavigate} />
    </nav>
  );
}

function UserFooter({ onLogout }) {
  const { usuario } = useAuth();
  const nombre = usuario?.nombre_completo || 'Usuario';
  const rol = usuario?.rol === 'ADMIN' ? 'Administrador' : 'Cajero';

  return (
    <div className="border-t border-crema-suave/10 p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-dorado-oscuro to-rojo-brasa font-display text-sm font-bold text-crema-suave">
          {initials(nombre)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-crema-suave">{nombre}</p>
          <p className="text-[11px] text-crema-suave/60">{rol}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-crema-suave/60 transition hover:bg-carbon-claro hover:text-dorado-frito"
        >
          <LogOutIcon size={18} />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ open = false, onClose }) {
  const { logout } = useAuth();

  return (
    <>
      {/* Overlay móvil/tablet */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-carbon/60 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[linear-gradient(180deg,#2a2320_0%,#2b211b_55%,#36190f_100%)] transition-transform duration-300 motion-reduce:transition-none lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-soft' : '-translate-x-full'
        }`}
        aria-label="Barra lateral"
      >
        <div className="flex items-center justify-between pr-3">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="mr-1 flex h-11 w-11 items-center justify-center rounded-lg text-crema-suave/60 transition hover:bg-carbon-claro hover:text-crema-suave lg:hidden"
          >
            <XIcon size={20} />
          </button>
        </div>
        <NavList onNavigate={onClose} />
        <UserFooter onLogout={logout} />
      </aside>
    </>
  );
}