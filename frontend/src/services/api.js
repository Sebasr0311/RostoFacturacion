// ============================================================
// services/api.js — Instancia axios + interceptores + helpers.
//
// - Request: agrega `Authorization: Bearer <token>` desde localStorage.
// - Response: en 401 limpia credenciales, avisa al AuthContext y
//   redirige a /login (HashRouter: window.location.hash).
// - Helpers para desenrollar el envelope { success, message, data }
//   y para descargas de binarios (PDF/Excel) con auth.
// ============================================================

import axios from 'axios';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';

// Default '/api': en desarrollo el proxy de Vite lo redirige a
// http://localhost:4000. En producción se define VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

// ---- Interceptor de request: adjunta el JWT ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Interceptor de response: maneja 401 globalmente ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isLoginRequest = url.includes('/auth/login');

    // Token inválido/expirado (fuera del login): limpiar y redirigir.
    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new CustomEvent('rosto:logout'));
      if (!window.location.hash.startsWith('#/login')) {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Desenrolla el envelope JSON { success, message, data }.
 * Para respuestas binarias (Blob) devuelve el blob tal cual.
 */
export function extractData(response) {
  if (response && response.data && typeof response.data === 'object' && 'success' in response.data) {
    return response.data.data;
  }
  return response?.data;
}

/**
 * Extrae un mensaje legible de un error axios (envelope del backend).
 */
export function errorMessage(error, fallback = 'Ocurrió un error inesperado.') {
  const data = error?.response?.data;
  if (data && typeof data === 'object' && data.message) {
    return data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return fallback;
}

/**
 * GET de un binario (PDF/Excel) con el header de auth del interceptor.
 * Si el error trae el envelope JSON como Blob, intenta leer el mensaje.
 */
export async function fetchBlob(url, { params } = {}) {
  try {
    const res = await api.get(url, { params, responseType: 'blob' });
    return res.data; // Blob
  } catch (err) {
    const body = err?.response?.data;
    if (body instanceof Blob) {
      try {
        const text = await body.text();
        const parsed = JSON.parse(text);
        if (parsed?.message) err.message = parsed.message;
      } catch {
        /* body no era JSON: se usa el mensaje original */
      }
    }
    throw err;
  }
}

/**
 * Descarga un blob disparando un <a download> (con auth previa).
 */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Liberar el object URL pasado un rato (el navegador ya inició el download).
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/**
 * Abre un blob (PDF) en una pestaña nueva para imprimir/ver.
 * Debe llamarse dentro de un gesto de usuario (click) para no
 * ser bloqueado por el popup blocker.
 */
export function openBlobInNewTab(blob) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // Popup bloqueado: fallback a navegación directa.
    window.location.href = url;
  }
  setTimeout(() => URL.revokeObjectURL(url), 120000);
  return win;
}