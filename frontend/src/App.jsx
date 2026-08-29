// ============================================================
// App.jsx — Rutas de la aplicación (HashRouter).
//   - /login      : login de administrador.
//   - /           : Punto de venta (POS).
//   - /pedidos    : Pedidos activos (cola de despacho).
//   - /productos  : Gestión de productos.
//   - /historial  : Historial de ventas / dashboard.
// Las rutas de negocio van detrás de ProtectedRoute (JWT).
// ============================================================

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import PosPage from './pages/PosPage';
import PedidosActivosPage from './pages/PedidosActivosPage';
import ProductosPage from './pages/ProductosPage';
import HistorialPage from './pages/HistorialPage';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
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
  );
}