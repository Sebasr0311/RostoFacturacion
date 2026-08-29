// ============================================================
// components/layout/Sidebar.jsx — Navegación lateral oscura.
// Desktop: fija y visible. Móvil/tablet: drawer deslizante con
// overlay (controlado desde Layout).
// ============================================================

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCartIcon, PackageIcon, ChartIcon, XIcon, LogOutIcon } from '../ui/Icons';
import { initials } from '../../utils/format';

const NAV_ITEMS = [
  { to: '/', label: 'Punto de venta', Icon: ShoppingCartIcon },
  { to: '/productos', label: 'Productos', Icon: PackageIcon },
  { to: '/historial', label: 'Historial / Dashboard', Icon: ChartIcon },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-xl shadow-lg shadow-brand-950/40">
        🍗
      </span>
      <div>
        <p className="font-display text-xl font-bold leading-none text-white">Rosto</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-cream-300/70">
          Pollo a la brasa
        </p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-950/40'
                : 'text-cream-200/80 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} className={isActive ? 'text-white' : 'text-cream-300/80 group-hover:text-white'} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function UserFooter({ onLogout }) {
  const { usuario } = useAuth();
  const nombre = usuario?.nombre_completo || 'Usuario';
  const rol = usuario?.rol === 'ADMIN' ? 'Administrador' : 'Cajero';

  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-brand-600 font-display text-sm font-bold text-white">
          {initials(nombre)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{nombre}</p>
          <p className="text-[11px] text-cream-300/70">{rol}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Cerrar sesión"
          className="rounded-lg p-2 text-cream-300/80 transition hover:bg-white/10 hover:text-white"
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
          className="fixed inset-0 z-40 bg-cacao-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gradient-to-b from-cacao-950 via-cacao-950 to-brand-950 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-soft' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pr-3">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-cream-300/80 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
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