import axios from 'axios';

export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').trim();

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export const getMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
    return url;
  }
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alra_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
