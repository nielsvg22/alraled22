import axios from 'axios';

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();
  const unquoted = raw.replace(/^['"]|['"]$/g, '');
  const trimmed = unquoted.replace(/\/+$/, '');

  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
    return `http://${trimmed}`;
  }
  if (trimmed.includes('.')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

const API_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL) || 'http://localhost:5000';
const API_BASE_FROM_ENV = normalizeBaseUrl(import.meta.env.VITE_API_BASE);

const API_BASE = API_BASE_FROM_ENV
  ? API_BASE_FROM_ENV
  : API_URL.endsWith('/api')
    ? API_URL
    : `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
});

export const getMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
    return url;
  }
  // Ensure we use the API_URL (not API_BASE) as the root for /uploads
  const root = API_URL.replace(/\/api$/, '');
  return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
