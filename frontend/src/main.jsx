// ============================================================
// main.jsx — Punto de entrada del frontend Rosto.
// Renderiza la app con HashRouter (obligatorio para GitHub Pages).
// Tipografías auto-hospedadas (packages @fontsource) para que el
// sitio no dependa de Google Fonts en runtime.
// ============================================================

import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import App from './App';
import { ToastHost } from './components/ui/Toast';

const rootEl = document.getElementById('root');

createRoot(rootEl).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
        <ToastHost />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);