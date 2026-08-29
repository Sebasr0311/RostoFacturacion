// ============================================================
// pages/LoginPage.jsx — Login de administrador (JWT).
// Guarda token + usuario en localStorage (vía AuthContext).
// Si ya hay sesión activa, redirige al POS.
// ============================================================

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginRequest } from '../services/authService';
import { errorMessage } from '../services/api';
import { toast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';
import { CheckIcon } from '../components/ui/Icons';

const FEATURES = [
  'Punto de venta tipo catálogo con carrito en tiempo real',
  'Facturación con IVA y descuentos calculados en el servidor',
  'Historial, dashboard y exportación a Excel',
];

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!correo.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const data = await loginRequest(correo.trim(), password);
      login(data.token, data.usuario);
      toast.success(`Bienvenido, ${data.usuario.nombre_completo || 'usuario'}.`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'No se pudo iniciar sesión.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-cacao-950 via-cacao-950 to-brand-950 p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-2xl shadow-lg shadow-brand-950/50">
            🍗
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-none">Rosto</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-cream-300/70">
              Pollo a la brasa · Sistema de facturación
            </p>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-3xl font-bold leading-tight">
            Tu punto de venta,
            <br />
            <span className="text-orange-400">rápido y sin complicaciones.</span>
          </h1>
          <ul className="mt-6 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-cream-200/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckIcon size={12} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-cream-300/60">
          © {new Date().getFullYear()} Rosto · Precios en pesos colombianos (COP)
        </p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-cream-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-xl">
              🍗
            </span>
            <div>
              <p className="font-display text-xl font-bold text-cacao-900">Rosto</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-cacao-500">
                Punto de venta
              </p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-cacao-900">Inicia sesión</h2>
          <p className="mt-1 text-sm text-cacao-600">
            Accede al panel de administración y facturación.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-cacao-800">
              Correo electrónico
              <input
                type="email"
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="mt-1.5 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm text-cacao-900 outline-none transition placeholder:text-cacao-500/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block text-sm font-medium text-cacao-800">
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm text-cacao-900 outline-none transition placeholder:text-cacao-500/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-display text-base font-bold text-white shadow-card transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Spinner size={18} light />}
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-6 rounded-xl border border-cream-200 bg-cream-100/70 p-3 text-xs text-cacao-700">
              <p className="font-semibold">Credenciales de prueba (seed):</p>
              <p>
                Correo: <code>admin@rosto.com</code> · Contraseña:{' '}
                <code>admin123</code>
              </p>
              <p className="mt-1 text-cacao-600">Visible solo en desarrollo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}