// aldraled/src/lib/api.js
import axios from "axios";
var API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").trim();
var PLACEHOLDER_SVG = "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";
var PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;
var api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" }
});
var getMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("//") || url.startsWith("data:")) {
    return url;
  }
  const base = (API_URL || "").replace(/\/+$/, "");
  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url;
};
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("alra_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
var api_default = api;
export {
  API_URL,
  PLACEHOLDER_IMAGE,
  api_default as default,
  getMediaUrl
};
