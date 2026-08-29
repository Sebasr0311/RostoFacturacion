// ============================================================
// components/layout/Layout.jsx — Esqueleto de la app protegida:
// sidebar (drawer en móvil) + barra superior + contenido (Outlet).
// ============================================================

import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { MenuIcon } from '../ui/Icons';
import { useAuth } from '../../context/AuthContext';
import { formatFechaSola } from '../../utils/format';

const PAGE_TITLES = {
  '/': 'Punto de venta',
  '/productos': 'Gestión de productos',
  '/historial': 'Historial y dashboard',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'Rosto';

  return (
    <div className="min-h-screen bg-cream-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        {/* Barra superior móvil/tablet */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-cream-200 bg-cream-50/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-cream-200 bg-white p-2 text-cacao-800 shadow-sm transition hover:bg-cream-100"
            aria-label="Abrir menú"
          >
            <MenuIcon size={20} />
          </button>
          <div className="flex-1">
            <p className="font-display text-sm font-semibold text-cacao-900">{title}</p>
            <p className="text-[11px] text-cacao-600">
              {usuario?.nombre_completo || ''} · {formatFechaSola(new Date())}
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}