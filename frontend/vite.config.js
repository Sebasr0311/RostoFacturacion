// ============================================================
// vite.config.js — Configuración de Vite para el frontend Rosto.
//
// - `base`: usa VITE_BASE (para GitHub Pages apuntar al nombre
//   del repo, ej: /RostoFacturacion/). Default razonable.
// - Proxy de desarrollo: /api -> http://localhost:4000 para que
//   el frontend funcione SIN .env (base relativa /api) y sin CORS.
//   En producción el build debe definir VITE_API_URL con la URL
//   pública del backend (Render) — ver .env.example.
// ============================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE || '/RostoFacturacion/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});