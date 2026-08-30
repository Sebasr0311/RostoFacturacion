// ============================================================
// pages/LoginPage.jsx — Login de administrador (JWT).
// Guarda token + usuario en localStorage (vía AuthContext).
// Si ya hay sesión activa, redirige al POS.
//
// Panel de marca "sobre brasa": gradiente carbón con destellos
// dorado/brasa (`.on-dark`), firma FlameIcon. El formulario usa
// los colores de la paleta con foco visible global (rojo-brasa).
// ============================================================

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginRequest } from '../services/authService';
import { errorMessage } from '../services/api';
import { toast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';
import { CheckIcon, FlameIcon } from '../components/ui/Icons';

const FEATURES = [
  'Punto de venta tipo catálogo con carrito en tiempo real',
  'Facturación con IVA y descuentos calculados en el servidor',
  'Historial, dashboard y exportación a Excel',
];

const inputCls =
  'mt-1.5 w-full rounded-xl border border-crema-borde bg-white px-4 py-2.5 text-sm text-carbon placeholder:text-carbon/60';

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
      setError(
        errorMessage(
          err,
          'No se pudo iniciar sesión. Verifica tus datos y la conexión con el servidor.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca (solo desktop) */}
      <div className="on-dark relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-carbon via-carbon to-rojo-brasa-oscuro p-10 lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-dorado-frito/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-rojo-brasa/25 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-dorado-frito text-rojo-brasa shadow-card">
            <FlameIcon size={26} />
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-none text-crema-suave">
              Rosto
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-dorado-frito/90">
              Pollo a la brasa · Sistema de facturación
            </p>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-3xl font-bold leading-tight text-crema-suave">
            Tu punto de venta,
            <br />
            <span className="text-dorado-frito">rápido y sin complicaciones.</span>
          </h1>
          <ul className="mt-6 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-crema-suave/85">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dorado-frito/20 text-dorado-frito">
                  <CheckIcon size={12} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-crema-suave/60">
          © {new Date().getFullYear()} Rosto · Precios en pesos colombianos (COP)
        </p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-crema-suave px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-dorado-frito text-rojo-brasa">
              <FlameIcon size={22} />
            </span>
            <div>
              <p className="font-display text-xl font-bold text-carbon">Rosto</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-carbon/75">
                Punto de venta
              </p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-carbon">Inicia sesión</h2>
          <p className="mt-1 text-sm text-carbon/70">
            Accede al panel de administración y facturación.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-carbon/80">
              Correo electrónico
              <input
                type="email"
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className={inputCls}
              />
            </label>
            <label className="block text-sm font-medium text-carbon/80">
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rojo-brasa/30 bg-brasa-suave px-4 py-2.5 text-sm font-medium text-rojo-brasa-oscuro"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rojo-brasa px-4 py-3 font-display text-base font-bold text-white shadow-brasa transition hover:bg-rojo-brasa-oscuro active:scale-[0.99] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Spinner size={18} light />}
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-6 rounded-xl border border-crema-borde bg-crema-suave-osc p-3 text-xs text-carbon/70">
              <p className="font-semibold text-carbon">Credenciales de prueba (seed):</p>
              <p>
                Correo: <code>admin@rosto.com</code> · Contraseña:{' '}
                <code>admin123</code>
              </p>
              <p className="mt-1 text-carbon/75">Visible solo en desarrollo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}