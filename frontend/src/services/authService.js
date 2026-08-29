// ============================================================
// services/authService.js — Autenticación.
// POST /api/auth/login -> { token, usuario } (envelope ya mapeado
// por el backend: claves en minúsculas).
// ============================================================

import { api, extractData } from './api';

/**
 * Inicia sesión y devuelve { token, usuario }.
 * @param {string} correo
 * @param {string} password
 */
export async function login(correo, password) {
  const res = await api.post('/auth/login', { correo, password });
  return extractData(res);
}