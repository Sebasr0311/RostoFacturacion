// ============================================================
// components/layout/Layout.jsx — Esqueleto de la app protegida:
// skip-link, sidebar (drawer en móvil) + barra superior + contenido.
// ============================================================

import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { MenuIcon } from '../ui/Icons';
import { useAuth } from '../../context/AuthContext';
import { formatFechaSola } from '../../utils/format';

const PAGE_TITLES = {
  '/': 'Punto de venta',
  '/pedidos': 'Pedidos activos',
  '/productos': 'Gestión de productos',
  '/historial': 'Historial y dashboard',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'Rosto';

  return (
    <div className="min-h-screen">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-dorado-frito focus:px-4 focus:py-2.5 focus:font-semibold focus:text-carbon focus:shadow-soft"
      >
        Saltar al contenido
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        {/* Barra superior móvil/tablet */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-crema-borde bg-crema-suave/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-crema-borde bg-white text-carbon shadow-sm transition hover:bg-crema-suave-osc active:scale-95"
            aria-label="Abrir menú"
          >
            <MenuIcon size={20} />
          </button>
          <div className="flex-1">
            <p className="font-display text-base font-semibold text-carbon">{title}</p>
            <p className="text-xs text-carbon/75">
              {usuario?.nombre_completo || ''} · {formatFechaSola(new Date())}
            </p>
          </div>
        </header>

        <main
          id="contenido-principal"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1400px] px-4 py-6 outline-none sm:px-6 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}