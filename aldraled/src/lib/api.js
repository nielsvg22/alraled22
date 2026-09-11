import axios from 'axios';

export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').trim();

// Transparante 1×1 fallback: kapotte afbeeldingen vallen weg in de achtergrond
// van hun container (geen zichtbare placeholder-flits meer).
const PLACEHOLDER_SVG = "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";
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
