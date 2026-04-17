import axios from 'axios';

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();
  const unquoted = raw.replace(/^['"]|['"]$/g, '');
  return unquoted.replace(/\/+$/, '');
}

const API_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL) || 'http://localhost:5000';
const API_BASE = normalizeBaseUrl(import.meta.env.VITE_API_BASE) || `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
