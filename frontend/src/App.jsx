// ============================================================
// App.jsx — Rutas de la aplicación (HashRouter).
//   - /login      : login de administrador.
//   - /           : Punto de venta (POS).
//   - /pedidos    : Pedidos activos (cola de despacho).
//   - /productos  : Gestión de productos.
//   - /historial  : Historial de ventas / dashboard.
// Las rutas de negocio van detrás de ProtectedRoute (JWT) y se
// cargan de forma perezosa (code splitting por ruta).
// ============================================================

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Spinner from './components/ui/Spinner';
import LoginPage from './pages/LoginPage';

const PosPage = lazy(() => import('./pages/PosPage'));
const PedidosActivosPage = lazy(() => import('./pages/PedidosActivosPage'));
const ProductosPage = lazy(() => import('./pages/ProductosPage'));
const HistorialPage = lazy(() => import('./pages/HistorialPage'));

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size={44} />
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<PosPage />} />
            <Route path="pedidos" element={<PedidosActivosPage />} />
            <Route path="productos" element={<ProductosPage />} />
            <Route path="historial" element={<HistorialPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
