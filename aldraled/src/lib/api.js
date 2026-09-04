import axios from 'axios';

export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').trim();

// Lokale placeholder-afbeelding (data URI) zodat er nooit een lege/broken
// afbeelding verschijnt wanneer er geen aanwezige afbeelding bestaat of
// een afbeeldings-URL niet laadt (bijv. vanwege een nep placeholder-host).
const PLACEHOLDER_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>" +
  "<rect width='400' height='300' fill='#f1f5f9'/>" +
  "<g fill='none' stroke='#cbd5e1' stroke-width='10' stroke-linecap='round' stroke-linejoin='round' transform='translate(120,90) scale(2.4)'>" +
  "<rect x='4' y='4' width='14' height='14' rx='2'/>" +
  "<circle cx='9' cy='9' r='1.5'/>" +
  "<path d='M18 13l-4-4-8 8'/>" +
  "</g></svg>";
export const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export const getMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
    return url;
  }
  // Uploads/media worden door de backend serven; andere relative paden
  // worden ten opzichte van de eigen origin opgelost.
  const base = (API_URL || '').replace(/\/+$/, '');
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alra_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
