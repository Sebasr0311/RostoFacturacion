// ============================================================
// context/AuthContext.jsx — Sesión JWT (token + usuario).
//
// - Persistencia: localStorage (claves rosto_token / rosto_usuario).
// - El interceptor de axios dispara el evento 'rosto:logout' en un 401;
//   aquí se escucha para limpiar el estado en vivo.
// - logout() limpia y redirige a #/login (compatible HashRouter).
// ============================================================

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';

const AuthContext = createContext(null);

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState(readUser);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUsuario(null);
    if (!window.location.hash.startsWith('#/login')) {
      window.location.hash = '#/login';
    }
  }, []);

  // React al 401 global del interceptor.
  useEffect(() => {
    const onLogout = () => logout();
    window.addEventListener('rosto:logout', onLogout);
    return () => window.removeEventListener('rosto:logout', onLogout);
  }, [logout]);

  const login = useCallback((newToken, newUsuario) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUsuario));
    setToken(newToken);
    setUsuario(newUsuario);
  }, []);

  const value = {
    token,
    usuario,
    isAuthenticated: Boolean(token),
    isAdmin: usuario?.rol === 'ADMIN',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}