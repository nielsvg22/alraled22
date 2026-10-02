// aldraled/src/pages/ProductList.js
import React2, { useState as useState2, useEffect as useEffect2, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios2 from "axios";

// aldraled/src/lib/CartContext.js
import React, { createContext, useState, useContext, useEffect } from "react";

// aldraled/src/lib/api.js
import axios from "axios";
var API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").trim();
var PLACEHOLDER_SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#f1f5f9'/><g fill='none' stroke='#cbd5e1' stroke-width='10' stroke-linecap='round' stroke-linejoin='round' transform='translate(120,90) scale(2.4)'><rect x='4' y='4' width='14' height='14' rx='2'/><circle cx='9' cy='9' r='1.5'/><path d='M18 13l-4-4-8 8'/></g></svg>";
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

// aldraled/src/lib/analytics.js
var ANALYTICS_API = `${API_URL}/api/analytics`;
var Analytics = class {
  constructor() {
    this.sessionId = this.getSessionId();
    this.visitId = null;
    this.pageStartTime = Date.now();
    this.hasTrackedPage = false;
    this.trackingEnabled = true;
    this.deviceInfo = this.getDeviceInfo();
    this.init();
  }
  getSessionId() {
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
  }
  getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = "desktop";
    let browser = "unknown";
    let os = "unknown";
    if (/Mobile|Android|iPhone|iPad/.test(ua)) {
      device = /iPad/.test(ua) ? "tablet" : "mobile";
    }
    if (ua.includes("Chrome")) browser = "chrome";
    else if (ua.includes("Firefox")) browser = "firefox";
    else if (ua.includes("Safari")) browser = "safari";
    else if (ua.includes("Edge")) browser = "edge";
    if (ua.includes("Windows")) os = "windows";
    else if (ua.includes("Mac")) os = "macos";
    else if (ua.includes("Linux")) os = "linux";
    else if (ua.includes("Android")) os = "android";
    else if (ua.includes("iOS")) os = "ios";
    return { device, browser, os };
  }
  async init() {
    await this.trackVisit();
    this.trackPageView();
    this.setupEventListeners();
  }
  getUTMParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || null;
  }
  async trackVisit() {
    try {
      const isNewVisitor = !localStorage.getItem("analytics_visited_before");
      if (isNewVisitor) {
        localStorage.setItem("analytics_visited_before", "true");
      }
      const visitData = {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
        utmSource: this.getUTMParam("utm_source"),
        utmMedium: this.getUTMParam("utm_medium"),
        utmCampaign: this.getUTMParam("utm_campaign"),
        device: this.deviceInfo.device,
        browser: this.deviceInfo.browser,
        os: this.deviceInfo.os,
        isNewVisitor: isNewVisitor ? 1 : 0,
        landingPage: window.location.pathname + window.location.search
      };
      const response = await fetch(`${ANALYTICS_API}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitData)
      });
      if (response.ok) {
        const data = await response.json();
        this.visitId = data.visitId;
      }
    } catch (error) {
      console.warn("Analytics visit tracking failed:", error);
    }
  }
  trackPageView() {
    if (!this.trackingEnabled || !this.visitId) return;
    if (this.hasTrackedPage) {
      const timeOnPage = Math.floor((Date.now() - this.pageStartTime) / 1e3);
      this.sendToBackend(`${ANALYTICS_API}/pageview/update`, {
        visitId: this.visitId,
        timeOnPage,
        isExit: 1
      });
    }
    this.pageStartTime = Date.now();
    this.hasTrackedPage = true;
    this.sendToBackend(`${ANALYTICS_API}/pageview`, {
      visitId: this.visitId,
      url: window.location.pathname + window.location.search,
      title: document.title,
      referrer: document.referrer || null
    });
  }
  trackEvent(type, category = null, action = null, label = null, value = null, metadata = null) {
    if (!this.trackingEnabled || !this.visitId) return;
    this.sendToBackend(`${ANALYTICS_API}/event`, {
      visitId: this.visitId,
      type,
      category,
      action,
      label,
      value,
      metadata: metadata ? JSON.stringify(metadata) : null
    });
  }
  trackClick(element, category = "click", label = null) {
    this.trackEvent("click", category, "click", label || element.textContent?.trim(), null, {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      href: element.href
    });
  }
  trackProductView(productId, productName = null) {
    this.trackEvent("view", "ecommerce", "product_view", String(productId), null, { productName });
  }
  trackAddToCart(productId, price, quantity = 1) {
    this.trackEvent("add_to_cart", "ecommerce", "add_to_cart", String(productId), price * quantity, { quantity });
  }
  trackRemoveFromCart(productId, price, quantity = 1) {
    this.trackEvent("remove_from_cart", "ecommerce", "remove_from_cart", String(productId), price * quantity, { quantity });
  }
  trackCheckoutStart() {
    this.trackEvent("checkout_start", "ecommerce", "checkout_start", "checkout_process");
  }
  trackCheckoutComplete(orderId, amount) {
    this.trackEvent("checkout_complete", "ecommerce", "checkout_complete", String(orderId), amount);
  }
  setupEventListeners() {
    window.addEventListener("beforeunload", () => {
      if (this.visitId) {
        const timeOnPage = Date.now() - this.pageStartTime;
        this.sendToBackend(`${ANALYTICS_API}/pageview/update`, {
          visitId: this.visitId,
          timeOnPage: Math.floor(timeOnPage / 1e3),
          isExit: 1
        }, true);
      }
    });
    document.addEventListener("click", (e) => {
      const target = e.target.closest("button, a, [data-track]");
      if (target) {
        const trackData = target.dataset.track;
        if (trackData) {
          try {
            const data = JSON.parse(trackData);
            this.trackClick(target, data.category, data.label);
          } catch {
            this.trackClick(target, "click", trackData);
          }
        } else {
          this.trackClick(target);
        }
      }
    });
    document.addEventListener("submit", (e) => {
      const form = e.target;
      if (form.id) {
        this.trackEvent("form_submit", "form", "submit", form.id, null, {
          action: form.action,
          method: form.method
        });
      }
    });
    let maxScroll = 0;
    window.addEventListener("scroll", () => {
      const scrollPercent = Math.round(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100);
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }
    });
    window.addEventListener("beforeunload", () => {
      if (maxScroll > 0 && this.visitId) {
        this.sendToBackend(`${ANALYTICS_API}/pageview/update`, {
          visitId: this.visitId,
          scrollDepth: maxScroll
        }, true);
      }
    });
  }
  async sendToBackend(endpoint, data, isBeacon = false) {
    if (!this.trackingEnabled) return;
    const payload = JSON.stringify(data);
    if (isBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
      return;
    }
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      });
    } catch (error) {
      console.warn("Analytics send failed:", error);
    }
  }
  disable() {
    this.trackingEnabled = false;
  }
  enable() {
    this.trackingEnabled = true;
  }
};
var analytics = new Analytics();
window.analytics = analytics;

// aldraled/src/lib/CartContext.js
var CartContext = createContext();
var useCart = () => useContext(CartContext);

// aldraled/src/lib/productHelpers.js
var priceFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
function formatPrice(amount) {
  return priceFormatter.format(Number(amount || 0));
}
function getProductImages(product) {
  const urls = Array.isArray(product?.images) ? product.images.map((image) => image.url || image).filter(Boolean) : [];
  if (urls.length > 0) return urls;
  return product?.imageUrl ? [product.imageUrl] : [];
}
function getPrimaryImage(product) {
  return getProductImages(product)[0] || null;
}
function getImageSrc(product, placeholder = PLACEHOLDER_IMAGE) {
  const url = getPrimaryImage(product);
  return getMediaUrl(url) || placeholder;
}

// aldraled/src/lib/config.js
var VAT_RATE = 0.21;
var API_URL2 = (process.env.REACT_APP_API_URL || "http://localhost:5000").trim();

// aldraled/src/lib/routes.js
var ROUTES = {
  home: "/",
  about: "/over-ons",
  shop: "/producten",
  product: (id) => `/product/${id}`,
  contact: "/contact",
  dealers: "/verkooppunten",
  blog: "/blog",
  blogPost: (id) => `/blog/${id}`,
  login: "/login",
  register: "/registreren",
  account: "/account",
  checkout: "/checkout",
  orderSuccess: (orderId) => `/bestelling-geplaatst${orderId ? `/${orderId}` : ""}`,
  returns: "/retouren",
  terms: "/algemene-voorwaarden",
  privacy: "/privacy-policy",
  returnsPolicy: "/retourbeleid",
  complaints: "/klachten"
};
var NAV_LINKS = [
  { to: ROUTES.home, labelKey: "nav.home" },
  { to: ROUTES.about, labelKey: "nav.about" },
  { to: ROUTES.blog, labelKey: "nav.blog" },
  { to: ROUTES.contact, labelKey: "nav.contact" }
];
var FOOTER_NAV_LINKS = [
  { to: ROUTES.home, label: "Home" },
  { to: ROUTES.about, label: "Over ons" },
  { to: ROUTES.shop, label: "Webshop" },
  { to: ROUTES.contact, label: "Contact" }
];

// aldraled/src/pages/ProductList.js
var Icon = ({ className = "w-4 h-4", children }) => /* @__PURE__ */ React2.createElement("svg", { className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, children);
var IconGrid = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }), /* @__PURE__ */ React2.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.5" }), /* @__PURE__ */ React2.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.5" }), /* @__PURE__ */ React2.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.5" }));
var IconTruck = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("rect", { x: "1", y: "3", width: "15", height: "13", rx: "1" }), /* @__PURE__ */ React2.createElement("polygon", { points: "16 8 20 8 23 11 23 16 16 16 16 8" }), /* @__PURE__ */ React2.createElement("circle", { cx: "5.5", cy: "18.5", r: "2.5" }), /* @__PURE__ */ React2.createElement("circle", { cx: "18.5", cy: "18.5", r: "2.5" }));
var IconShield = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }), /* @__PURE__ */ React2.createElement("path", { d: "m9 12 2 2 4-4" }));
var IconAward = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("circle", { cx: "12", cy: "8", r: "6" }), /* @__PURE__ */ React2.createElement("path", { d: "M8.5 13.5 8 21l4-2.5L16 21l-.5-7.5" }), /* @__PURE__ */ React2.createElement("path", { d: "M10 8l1.5 1.5L14.5 6.5" }));
var IconChat = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" }));
var IconSearch = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("circle", { cx: "11", cy: "11", r: "7" }), /* @__PURE__ */ React2.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }));
var IconSliders = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("line", { x1: "4", y1: "21", x2: "4", y2: "13" }), /* @__PURE__ */ React2.createElement("line", { x1: "4", y1: "9", x2: "4", y2: "3" }), /* @__PURE__ */ React2.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "12" }), /* @__PURE__ */ React2.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "3" }), /* @__PURE__ */ React2.createElement("line", { x1: "20", y1: "21", x2: "20", y2: "16" }), /* @__PURE__ */ React2.createElement("line", { x1: "20", y1: "12", x2: "20", y2: "3" }), /* @__PURE__ */ React2.createElement("line", { x1: "1", y1: "13", x2: "7", y2: "13" }), /* @__PURE__ */ React2.createElement("line", { x1: "9", y1: "8", x2: "15", y2: "8" }), /* @__PURE__ */ React2.createElement("line", { x1: "17", y1: "16", x2: "23", y2: "16" }));
var IconChevronDown = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("polyline", { points: "6 9 12 15 18 9" }));
var IconChevronUp = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("polyline", { points: "18 15 12 9 6 15" }));
var IconCart = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("circle", { cx: "9", cy: "21", r: "1" }), /* @__PURE__ */ React2.createElement("circle", { cx: "20", cy: "21", r: "1" }), /* @__PURE__ */ React2.createElement("path", { d: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" }));
var IconEye = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), /* @__PURE__ */ React2.createElement("circle", { cx: "12", cy: "12", r: "3" }));
var IconCompare = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), /* @__PURE__ */ React2.createElement("line", { x1: "12", y1: "3", x2: "12", y2: "21" }), /* @__PURE__ */ React2.createElement("line", { x1: "3", y1: "12", x2: "21", y2: "12" }));
var IconCheck = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("polyline", { points: "20 6 9 17 4 12" }));
var IconX = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React2.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }));
var IconArrowRight = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }), /* @__PURE__ */ React2.createElement("polyline", { points: "12 5 19 12 12 19" }));
var IconPackage = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("line", { x1: "16.5", y1: "9.4", x2: "7.5", y2: "4.21" }), /* @__PURE__ */ React2.createElement("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }), /* @__PURE__ */ React2.createElement("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }), /* @__PURE__ */ React2.createElement("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" }));
var IconZap = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }));
var IconBulb = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("path", { d: "M9 18h6" }), /* @__PURE__ */ React2.createElement("path", { d: "M10 22h4" }), /* @__PURE__ */ React2.createElement("path", { d: "M12 3a6 6 0 0 0-4 10c.6.6 1 1.3 1 2.2V16h6v-.8c0-.9.4-1.6 1-2.2A6 6 0 0 0 12 3z" }));
var IconWave = (p) => /* @__PURE__ */ React2.createElement(Icon, { ...p }, /* @__PURE__ */ React2.createElement("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }));
var categoryIcon = (cat) => {
  const slug = String(cat?.slug || cat?.name || "").toLowerCase();
  if (slug.includes("bedrijfswagen")) return IconTruck;
  if (slug.includes("bouwlichtslang")) return IconWave;
  if (slug.includes("hefbrug")) return IconZap;
  if (slug.includes("werkverlichting")) return IconBulb;
  if (slug.includes("veiligheid") || slug.includes("verkeers")) return IconShield;
  return IconGrid;
};
function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState2(false);
  const [qty, setQty] = useState2(1);
  const [showInclVat, setShowInclVat] = useState2(false);
  const displayPrice = showInclVat ? Number(product?.price || 0) * (1 + VAT_RATE) : Number(product?.price || 0);
  useEffect2(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2e3);
  };
  return /* @__PURE__ */ React2.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4" }, /* @__PURE__ */ React2.createElement("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm", onClick: onClose }), /* @__PURE__ */ React2.createElement("div", { className: "relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-[fadeSlideUp_0.25s_ease]" }, /* @__PURE__ */ React2.createElement("button", { onClick: onClose, className: "absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors text-gray-500 text-sm shadow-sm", "aria-label": "Sluiten" }, /* @__PURE__ */ React2.createElement(IconX, { className: "w-4 h-4" })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-[#F7F9FC] aspect-square flex items-center justify-center p-8" }, /* @__PURE__ */ React2.createElement("img", { src: getImageSrc(product), alt: product.name, className: "w-full h-full object-contain", loading: "lazy", decoding: "async" })), /* @__PURE__ */ React2.createElement("div", { className: "p-7 flex flex-col gap-4" }, product.category && /* @__PURE__ */ React2.createElement("span", { className: "text-xs font-bold text-primary uppercase tracking-widest" }, product.category), /* @__PURE__ */ React2.createElement("h2", { className: "text-xl font-black text-secondary leading-tight" }, product.name), /* @__PURE__ */ React2.createElement("div", { className: "flex items-baseline gap-2" }, /* @__PURE__ */ React2.createElement("span", { className: "text-3xl font-black text-secondary" }, formatPrice(displayPrice)), /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: () => setShowInclVat((v) => !v),
      className: `text-xs font-bold px-2 py-0.5 rounded-full border transition-all ${showInclVat ? "bg-primary/10 text-primary border-primary/30" : "text-gray-400 border-gray-200"}`
    },
    showInclVat ? "incl. BTW" : "excl. BTW"
  )), product.description && /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-gray-500 leading-relaxed line-clamp-3" }, product.description), /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-2 mt-auto" }, /* @__PURE__ */ React2.createElement("div", { className: "flex items-center border border-gray-200 rounded-xl overflow-hidden" }, /* @__PURE__ */ React2.createElement("button", { onClick: () => setQty((q) => Math.max(1, q - 1)), className: "w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base" }, "\u2212"), /* @__PURE__ */ React2.createElement("span", { className: "w-8 text-center text-sm font-bold" }, qty), /* @__PURE__ */ React2.createElement("button", { onClick: () => setQty((q) => q + 1), className: "w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base" }, "+")), /* @__PURE__ */ React2.createElement("button", { onClick: handleAdd, className: `flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${added ? "bg-green-500 text-white" : "bg-secondary text-white hover:bg-primary"}` }, added ? "\u2713 Toegevoegd" : "In winkelwagen")), /* @__PURE__ */ React2.createElement(Link, { to: ROUTES.product(product.id), onClick: onClose, className: "text-center text-xs font-bold text-gray-400 hover:text-primary transition-colors" }, "Volledige productpagina \u2192")))));
}
function CompareBar({ list, onRemove, onClear, onCompare }) {
  if (list.length === 0) return null;
  return /* @__PURE__ */ React2.createElement("div", { className: "fixed bottom-0 left-0 right-0 z-40 bg-secondary text-white shadow-2xl border-t-2 border-primary" }, /* @__PURE__ */ React2.createElement("div", { className: "max-w-full px-6 py-3 mx-auto", style: { maxWidth: "1440px" } }, /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React2.createElement("span", { className: "text-xs font-bold uppercase tracking-widest text-white/60 shrink-0" }, "Vergelijken"), /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-3 flex-1 overflow-x-auto" }, list.map((p) => /* @__PURE__ */ React2.createElement("div", { key: p.id, className: "flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 shrink-0" }, /* @__PURE__ */ React2.createElement("img", { src: getImageSrc(p), alt: p.name, className: "w-7 h-7 rounded-lg object-cover bg-white", loading: "lazy", decoding: "async" }), /* @__PURE__ */ React2.createElement("span", { className: "text-xs font-semibold max-w-[120px] truncate" }, p.name), /* @__PURE__ */ React2.createElement("button", { onClick: () => onRemove(p.id), className: "text-white/40 hover:text-white ml-1 text-xs", "aria-label": "Verwijder uit vergelijking" }, "\u2715"))), list.length < 3 && /* @__PURE__ */ React2.createElement("div", { className: "w-24 h-9 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/30 text-xs shrink-0" }, "+ product")), /* @__PURE__ */ React2.createElement("div", { className: "flex gap-2 shrink-0" }, /* @__PURE__ */ React2.createElement("button", { onClick: onClear, className: "text-xs text-white/40 hover:text-white transition-colors" }, "Wissen"), /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: onCompare,
      disabled: list.length < 2,
      className: "bg-primary text-white text-xs font-bold px-5 py-2 rounded-full hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    },
    "Vergelijk ",
    list.length,
    " \u2192"
  )))));
}
function CompareModal({ list, onClose }) {
  useEffect2(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  const ROWS = [
    { label: "Prijs", key: (p) => formatPrice(p.price) },
    { label: "Categorie", key: (p) => p.category || "\u2014" },
    { label: "Beschrijving", key: (p) => p.description ? p.description.slice(0, 80) + (p.description.length > 80 ? "\u2026" : "") : "\u2014" }
  ];
  return /* @__PURE__ */ React2.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4" }, /* @__PURE__ */ React2.createElement("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: onClose }), /* @__PURE__ */ React2.createElement("div", { className: "relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-auto max-h-[90vh]" }, /* @__PURE__ */ React2.createElement("div", { className: "sticky top-0 bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between" }, /* @__PURE__ */ React2.createElement("h2", { className: "font-black text-secondary text-lg" }, "Productvergelijking"), /* @__PURE__ */ React2.createElement("button", { onClick: onClose, className: "w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500 transition-colors", "aria-label": "Sluiten" }, "\u2715")), /* @__PURE__ */ React2.createElement("div", { className: "p-8" }, /* @__PURE__ */ React2.createElement("div", { className: "grid gap-4", style: { gridTemplateColumns: `160px repeat(${list.length}, 1fr)` } }, /* @__PURE__ */ React2.createElement("div", null), list.map((p) => /* @__PURE__ */ React2.createElement("div", { key: p.id, className: "text-center space-y-2" }, /* @__PURE__ */ React2.createElement("div", { className: "aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100" }, /* @__PURE__ */ React2.createElement("img", { src: getImageSrc(p), alt: p.name, className: "w-full h-full object-contain p-4", loading: "lazy", decoding: "async" })), /* @__PURE__ */ React2.createElement("h3", { className: "text-sm font-black text-secondary" }, p.name))), ROWS.map(({ label, key }) => /* @__PURE__ */ React2.createElement(React2.Fragment, { key: label }, /* @__PURE__ */ React2.createElement("div", { className: "flex items-center" }, /* @__PURE__ */ React2.createElement("span", { className: "text-xs font-bold text-gray-400 uppercase tracking-wider" }, label)), list.map((p) => /* @__PURE__ */ React2.createElement("div", { key: p.id, className: "bg-gray-50 rounded-xl p-4 text-sm text-secondary font-medium text-center" }, key(p))))), /* @__PURE__ */ React2.createElement("div", null), list.map((p) => /* @__PURE__ */ React2.createElement("div", { key: p.id, className: "text-center" }, /* @__PURE__ */ React2.createElement(
    Link,
    {
      to: ROUTES.product(p.id),
      onClick: onClose,
      className: "block bg-secondary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-primary transition-all"
    },
    "Bekijk product \u2192"
  )))))));
}
function ProductCard({ product, showInclVat, inCompare, onCompare, onQuickView }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState2(false);
  const displayPrice = showInclVat ? Number(product.price || 0) * (1 + VAT_RATE) : Number(product.price || 0);
  const outOfStock = Number(product.stock) <= 0;
  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };
  return /* @__PURE__ */ React2.createElement("div", { className: "group bg-white rounded-2xl border border-[#E4EAF1] overflow-hidden flex flex-col relative transition-all duration-200 hover:shadow-[0_14px_34px_-8px_rgba(7,27,54,0.18)] hover:-translate-y-1" }, /* @__PURE__ */ React2.createElement(Link, { to: ROUTES.product(product.id), className: "block" }, /* @__PURE__ */ React2.createElement("div", { className: "relative aspect-[4/3] bg-[#F7F9FC] overflow-hidden" }, /* @__PURE__ */ React2.createElement(
    "img",
    {
      src: getImageSrc(product),
      alt: product.name,
      className: "w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]",
      loading: "lazy",
      decoding: "async"
    }
  ), product.category && /* @__PURE__ */ React2.createElement("span", { className: "absolute top-3 left-3 max-w-[75%] truncate bg-white/95 backdrop-blur text-[11px] font-bold text-secondary px-2.5 py-1 rounded-full shadow-sm border border-[#E4EAF1]" }, product.category), /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: (e) => {
        e.preventDefault();
        onCompare(product);
      },
      title: inCompare ? "Verwijder uit vergelijking" : "Voeg toe aan vergelijking",
      className: `absolute top-3 right-3 z-10 w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${inCompare ? "bg-primary border-primary text-white" : "bg-white/95 border-[#E4EAF1] text-gray-400 hover:text-primary hover:border-primary opacity-0 group-hover:opacity-100"}`,
      "aria-label": inCompare ? "Verwijder uit vergelijking" : "Voeg toe aan vergelijking"
    },
    /* @__PURE__ */ React2.createElement(IconCompare, { className: "w-3.5 h-3.5" })
  ), /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: (e) => {
        e.preventDefault();
        onQuickView(product);
      },
      className: "absolute left-3 bottom-3 z-10 inline-flex items-center gap-1.5 bg-secondary/90 backdrop-blur-sm text-white text-[11px] font-bold pl-2.5 pr-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:bg-primary"
    },
    /* @__PURE__ */ React2.createElement(IconEye, { className: "w-3.5 h-3.5" }),
    "Snel bekijken"
  ))), /* @__PURE__ */ React2.createElement("div", { className: "p-4 pt-3 flex flex-col gap-2 flex-1" }, /* @__PURE__ */ React2.createElement(Link, { to: ROUTES.product(product.id), className: "block" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-sm font-bold text-secondary leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors" }, product.name)), /* @__PURE__ */ React2.createElement("div", { className: "mt-auto flex items-end justify-between gap-2" }, /* @__PURE__ */ React2.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React2.createElement("p", { className: "text-lg font-black text-secondary leading-none" }, formatPrice(displayPrice)), /* @__PURE__ */ React2.createElement("p", { className: "text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-1" }, showInclVat ? "incl. btw" : "excl. btw")), /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: handleAdd,
      disabled: outOfStock,
      title: outOfStock ? "Niet op voorraad" : "In winkelwagen",
      "aria-label": "In winkelwagen",
      className: `w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 ${added ? "bg-green-500 text-white" : outOfStock ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-primary text-white hover:brightness-110 shadow-sm"}`
    },
    added ? /* @__PURE__ */ React2.createElement(IconCheck, { className: "w-4 h-4" }) : /* @__PURE__ */ React2.createElement(IconCart, { className: "w-4 h-4" })
  ))));
}
function FilterGroup({ title, icon, open, onToggle, children }) {
  return /* @__PURE__ */ React2.createElement("div", { className: "border-b border-[#E4EAF1] py-4 last:border-0" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: onToggle,
      "aria-expanded": open,
      className: "w-full flex items-center justify-between gap-2 text-left"
    },
    /* @__PURE__ */ React2.createElement("span", { className: "text-sm font-bold text-secondary flex items-center gap-2" }, icon, title),
    open ? /* @__PURE__ */ React2.createElement(IconChevronUp, { className: "w-4 h-4 text-gray-400" }) : /* @__PURE__ */ React2.createElement(IconChevronDown, { className: "w-4 h-4 text-gray-400" })
  ), open && /* @__PURE__ */ React2.createElement("div", { className: "mt-3" }, children));
}
function FilterSidebar({
  categories,
  products,
  activeCategory,
  onCategory,
  priceMin,
  priceMax,
  onPriceMin,
  onPriceMax,
  onlyInStock,
  onOnlyInStock,
  priceBounds
}) {
  const [openGroup, setOpenGroup] = useState2("categorie");
  const minPct = priceBounds.max > priceBounds.min ? (priceMin - priceBounds.min) / (priceBounds.max - priceBounds.min) * 100 : 0;
  const maxPct = priceBounds.max > priceBounds.min ? (priceMax - priceBounds.min) / (priceBounds.max - priceBounds.min) * 100 : 100;
  const allItems = [{ id: "Alle", name: "Alle producten", slug: "", productCount: products.length }, ...categories];
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React2.createElement(FilterGroup, { title: "Categorie", icon: /* @__PURE__ */ React2.createElement(IconGrid, { className: "w-4 h-4 text-primary" }), open: openGroup === "categorie", onToggle: () => setOpenGroup(openGroup === "categorie" ? "" : "categorie") }, /* @__PURE__ */ React2.createElement("div", { className: "flex flex-col items-stretch gap-0.5 max-h-72 overflow-y-auto pr-1" }, allItems.map((cat) => {
    const isActive = activeCategory === cat.id;
    const CatIcon = categoryIcon(cat);
    return /* @__PURE__ */ React2.createElement(
      "button",
      {
        key: cat.id,
        type: "button",
        onClick: () => onCategory(cat),
        className: `flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm transition-all duration-150 ${isActive ? "bg-primary/10 text-primary font-bold border border-primary/20" : "text-gray-600 hover:bg-white hover:border-[#E4EAF1] border border-transparent"}`
      },
      /* @__PURE__ */ React2.createElement("span", { className: `w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-primary border-primary text-white" : "border-gray-300 bg-white"}` }, isActive && /* @__PURE__ */ React2.createElement(IconCheck, { className: "w-3 h-3" })),
      /* @__PURE__ */ React2.createElement(CatIcon, { className: `w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-gray-300"}` }),
      /* @__PURE__ */ React2.createElement("span", { className: "flex-1 truncate" }, cat.name),
      typeof cat.productCount === "number" && /* @__PURE__ */ React2.createElement("span", { className: `text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-400"}` }, cat.productCount)
    );
  }))), /* @__PURE__ */ React2.createElement(FilterGroup, { title: "Prijs", icon: /* @__PURE__ */ React2.createElement(IconSliders, { className: "w-4 h-4 text-primary" }), open: openGroup === "prijs", onToggle: () => setOpenGroup(openGroup === "prijs" ? "" : "prijs") }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React2.createElement("div", { className: "h-1.5 bg-gray-200 rounded-full relative" }, /* @__PURE__ */ React2.createElement(
    "div",
    {
      className: "absolute top-0 h-1.5 bg-primary rounded-full",
      style: { left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }
    }
  )), /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React2.createElement("label", { htmlFor: "price-min", className: "text-[11px] font-bold text-gray-500 uppercase tracking-wide" }, "Vanaf"), /* @__PURE__ */ React2.createElement("span", { className: "text-xs font-bold text-secondary" }, "\u20AC ", priceMin.toLocaleString("nl-NL"))), /* @__PURE__ */ React2.createElement(
    "input",
    {
      id: "price-min",
      type: "range",
      min: priceBounds.min,
      max: priceBounds.max,
      step: 1,
      value: priceMin,
      onChange: (e) => onPriceMin(Math.min(Number(e.target.value), priceMax)),
      className: "w-full accent-primary cursor-pointer"
    }
  )), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React2.createElement("label", { htmlFor: "price-max", className: "text-[11px] font-bold text-gray-500 uppercase tracking-wide" }, "Tot"), /* @__PURE__ */ React2.createElement("span", { className: "text-xs font-bold text-secondary" }, "\u20AC ", priceMax.toLocaleString("nl-NL"))), /* @__PURE__ */ React2.createElement(
    "input",
    {
      id: "price-max",
      type: "range",
      min: priceBounds.min,
      max: priceBounds.max,
      step: 1,
      value: priceMax,
      onChange: (e) => onPriceMax(Math.max(Number(e.target.value), priceMin)),
      className: "w-full accent-primary cursor-pointer"
    }
  ))))), /* @__PURE__ */ React2.createElement(FilterGroup, { title: "Voorraad", icon: /* @__PURE__ */ React2.createElement(IconPackage, { className: "w-4 h-4 text-primary" }), open: openGroup === "voorraad", onToggle: () => setOpenGroup(openGroup === "voorraad" ? "" : "voorraad") }, /* @__PURE__ */ React2.createElement("label", { className: "flex items-center gap-2.5 px-1 cursor-pointer select-none" }, /* @__PURE__ */ React2.createElement("span", { className: `w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${onlyInStock ? "bg-primary border-primary text-white" : "border-gray-300 bg-white"}` }, onlyInStock && /* @__PURE__ */ React2.createElement(IconCheck, { className: "w-3 h-3" })), /* @__PURE__ */ React2.createElement(
    "input",
    {
      type: "checkbox",
      checked: onlyInStock,
      onChange: (e) => onOnlyInStock(e.target.checked),
      className: "sr-only"
    }
  ), /* @__PURE__ */ React2.createElement("span", { className: "text-sm text-gray-600" }, "Alleen op voorraad"))));
}
var ProductList = () => {
  const [products, setProducts] = useState2([]);
  const [loading, setLoading] = useState2(true);
  const [searchQuery, setSearchQuery] = useState2("");
  const [activeCategory, setActiveCategory] = useState2("Alle");
  const [categories, setCategories] = useState2([]);
  const [quickView, setQuickView] = useState2(null);
  const [compareList, setCompareList] = useState2([]);
  const [showCompare, setShowCompare] = useState2(false);
  const [showInclVat, setShowInclVat] = useState2(false);
  const [sortBy, setSortBy] = useState2("nieuwste");
  const [priceMin, setPriceMin] = useState2(0);
  const [priceMax, setPriceMax] = useState2(0);
  const [onlyInStock, setOnlyInStock] = useState2(false);
  const [showFilters, setShowFilters] = useState2(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const gridAnchorRef = useRef(null);
  const [compareLimitWarning, setCompareLimitWarning] = useState2(false);
  const [shopContent, setShopContent] = useState2(null);
  useEffect2(() => {
    axios2.get(`${API_URL}/api/content/shop`).then((res) => setShopContent(res.data || null)).catch(() => {
    });
  }, []);
  useEffect2(() => {
    axios2.get(`${API_URL}/api/products`).then((res) => {
      setProducts(res.data);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load products:", err);
      setLoading(false);
    });
    axios2.get(`${API_URL}/api/products/categories/all`).then((res) => setCategories(Array.isArray(res.data) ? res.data : [])).catch(() => {
    });
  }, []);
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((p) => Number(p.price) || 0);
    const max = Math.max(...prices);
    return { min: 0, max: Math.ceil(max || 1) };
  }, [products]);
  useEffect2(() => {
    if (priceBounds.max > 0 && priceMax === 0) setPriceMax(priceBounds.max);
  }, [priceBounds, priceMax]);
  useEffect2(() => {
    const catParam = searchParams.get("categorie");
    if (catParam) {
      const matched = categories.find((c) => c.slug === catParam || c.id === catParam);
      if (matched) setActiveCategory(matched.id);
    }
  }, [searchParams, categories]);
  const sortedProducts = useMemo(() => {
    let list = [...products];
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case "price-desc":
        list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case "name":
        list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "nl"));
        break;
      case "nieuwste":
      default:
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || String(a.id).localeCompare(String(b.id)));
        break;
    }
    return list;
  }, [products, sortBy]);
  const filteredProducts = sortedProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === "Alle" || p.categoryId === activeCategory || (p.category || "").toLowerCase() === String(activeCategory).toLowerCase();
    const price = Number(p.price) || 0;
    const matchesPrice = priceBounds.max > 0 ? price >= priceMin && price <= priceMax : true;
    const matchesStock = !onlyInStock || Number(p.stock) > 0;
    return matchesSearch && matchesCat && matchesPrice && matchesStock;
  });
  const activeCategoryObj = useMemo(() => {
    if (activeCategory === "Alle") return { id: "Alle", name: "Alle producten", slug: "" };
    return categories.find((c) => c.id === activeCategory) || null;
  }, [activeCategory, categories]);
  const scrollToProducts = () => {
    setTimeout(() => gridAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };
  const selectCategory = (cat) => {
    if (cat.id === "Alle") {
      setActiveCategory("Alle");
      setSearchParams({});
    } else {
      setActiveCategory(cat.id);
      setSearchParams({ categorie: cat.slug || cat.id });
    }
  };
  const handleCategorySelect = (cat) => {
    selectCategory(cat);
    scrollToProducts();
  };
  const clearFilters = () => {
    setActiveCategory("Alle");
    setSearchParams({});
    setSearchQuery("");
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    setOnlyInStock(false);
  };
  const hasActiveFilters = activeCategory !== "Alle" || searchQuery !== "" || onlyInStock || priceBounds.max > 0 && (priceMin > priceBounds.min || priceMax < priceBounds.max);
  const handleCompareToggle = useCallback((product) => {
    setCompareList((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev.filter((p) => p.id !== product.id);
      if (prev.length >= 3) {
        setCompareLimitWarning(true);
        setTimeout(() => setCompareLimitWarning(false), 2e3);
        return prev;
      }
      return [...prev, product];
    });
  }, []);
  const HERO_USP_ICONS = [IconTruck, IconShield, IconAward, IconChat];
  const shopHero = useMemo(() => {
    const hero = shopContent && shopContent.hero || {};
    const fallbackUsps = [
      { title: "Snel geleverd", text: "Uit voorraad leverbaar" },
      { title: "Garantie", text: "Kwaliteit verzekerd" },
      { title: "Voor professionals", text: "Scherpe prijzen" },
      { title: "Persoonlijk advies", text: "Wij denken met je mee" }
    ];
    return {
      eyebrow: hero.eyebrow || "Onze collectie",
      title: hero.title || "LED verlichting",
      titleAccent: hero.titleAccent || "voor elke toepassing",
      subtitle: hero.subtitle || "Krachtig. Betrouwbaar. Voor professionals.",
      usps: Array.isArray(hero.usps) && hero.usps.length > 0 ? hero.usps : fallbackUsps
    };
  }, [shopContent]);
  const heroImage = useMemo(() => {
    const stored = shopContent && shopContent.hero && shopContent.hero.imageUrl || "";
    if (stored) {
      const url = getMediaUrl(stored);
      return url && url !== PLACEHOLDER_IMAGE ? url : null;
    }
    if (products.length === 0) return null;
    const pref = products.find((p) => (p.category || "").toLowerCase().includes("bedrijfswagen")) || products[0];
    const src = getImageSrc(pref);
    return src === PLACEHOLDER_IMAGE ? null : src;
  }, [products, shopContent]);
  const SORT_OPTIONS = [
    { id: "nieuwste", label: "Nieuwste" },
    { id: "price-asc", label: "Prijs laag \u2192 hoog" },
    { id: "price-desc", label: "Prijs hoog \u2192 laag" },
    { id: "name", label: "Naam A-Z" }
  ];
  return /* @__PURE__ */ React2.createElement("div", { className: "bg-[#F7F9FC] min-h-screen pb-24" }, /* @__PURE__ */ React2.createElement("section", { className: "relative overflow-hidden bg-secondary" }, /* @__PURE__ */ React2.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-secondary via-secondary to-secondary/70" }), heroImage && /* @__PURE__ */ React2.createElement(
    "img",
    {
      src: heroImage,
      alt: "",
      "aria-hidden": "true",
      className: "absolute inset-y-0 right-0 w-full md:w-[55%] h-full object-cover md:opacity-35 opacity-15",
      loading: "eager",
      decoding: "async"
    }
  ), /* @__PURE__ */ React2.createElement("div", { className: "absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" }), /* @__PURE__ */ React2.createElement("div", { className: "absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-white/5" }), /* @__PURE__ */ React2.createElement("div", { className: "relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 min-h-[300px] md:min-h-[340px] flex flex-col justify-center" }, /* @__PURE__ */ React2.createElement("p", { className: "text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-2" }, shopHero.eyebrow), /* @__PURE__ */ React2.createElement("h1", { className: "text-3xl md:text-4xl lg:text-[42px] font-black text-white leading-tight max-w-2xl" }, shopHero.title, /* @__PURE__ */ React2.createElement("br", null), /* @__PURE__ */ React2.createElement("span", { className: "text-accent" }, shopHero.titleAccent)), /* @__PURE__ */ React2.createElement("p", { className: "text-white/70 text-sm md:text-base mt-2 max-w-xl" }, shopHero.subtitle), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7 max-w-3xl" }, shopHero.usps.map((usp, i) => {
    const Icon2 = HERO_USP_ICONS[i % HERO_USP_ICONS.length];
    return /* @__PURE__ */ React2.createElement("div", { key: i, className: "flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-3 border border-white/10" }, /* @__PURE__ */ React2.createElement("span", { className: "w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0" }, /* @__PURE__ */ React2.createElement(Icon2, { className: "w-5 h-5" })), /* @__PURE__ */ React2.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React2.createElement("p", { className: "text-white text-sm font-bold leading-tight" }, usp.title), /* @__PURE__ */ React2.createElement("p", { className: "text-white/50 text-[11px] mt-0.5 leading-tight" }, usp.text)));
  })))), /* @__PURE__ */ React2.createElement("div", { ref: gridAnchorRef, className: "max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 scroll-mt-24" }, /* @__PURE__ */ React2.createElement("div", { className: "flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" }, [{ id: "Alle", name: "Alle producten", slug: "", productCount: products.length }, ...categories].map((cat) => {
    const CatIcon = categoryIcon(cat);
    const isActive = activeCategory === cat.id;
    return /* @__PURE__ */ React2.createElement(
      "button",
      {
        key: cat.id,
        type: "button",
        onClick: () => handleCategorySelect(cat),
        "aria-pressed": isActive,
        className: `group shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-white transition-all duration-150 ${isActive ? "border-primary bg-primary/5 text-primary shadow-[0_6px_18px_-6px_rgba(20,115,230,0.35)]" : "border-[#E4EAF1] text-gray-600 hover:border-primary/40 hover:text-secondary hover:shadow-md"}`
      },
      /* @__PURE__ */ React2.createElement("span", { className: `w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary"}` }, /* @__PURE__ */ React2.createElement(CatIcon, { className: "w-4 h-4" })),
      /* @__PURE__ */ React2.createElement("span", { className: "text-sm font-bold whitespace-nowrap" }, cat.name),
      typeof cat.productCount === "number" && /* @__PURE__ */ React2.createElement("span", { className: `text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-400"}` }, cat.productCount),
      isActive && /* @__PURE__ */ React2.createElement(IconCheck, { className: "w-3.5 h-3.5 text-primary shrink-0" })
    );
  })), /* @__PURE__ */ React2.createElement("div", { className: "flex flex-col lg:flex-row gap-8 mt-6" }, /* @__PURE__ */ React2.createElement("aside", { className: "hidden lg:block w-[250px] shrink-0" }, /* @__PURE__ */ React2.createElement("div", { className: "sticky top-24 bg-white rounded-2xl border border-[#E4EAF1] p-4" }, /* @__PURE__ */ React2.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React2.createElement("h2", { className: "text-sm font-black text-secondary uppercase tracking-wider flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(IconSliders, { className: "w-4 h-4 text-primary" }), "Filters"), (hasActiveFilters || searchQuery) && /* @__PURE__ */ React2.createElement("button", { onClick: clearFilters, className: "text-[11px] font-bold text-primary hover:underline" }, "Wissen")), /* @__PURE__ */ React2.createElement(
    FilterSidebar,
    {
      categories,
      products,
      activeCategory,
      onCategory: selectCategory,
      priceMin,
      priceMax,
      onPriceMin: setPriceMin,
      onPriceMax: setPriceMax,
      onlyInStock,
      onOnlyInStock: setOnlyInStock,
      priceBounds
    }
  ))), /* @__PURE__ */ React2.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React2.createElement("div", { className: "flex flex-wrap items-center gap-3 mb-5" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowFilters(true),
      className: "lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E4EAF1] text-sm font-bold text-secondary hover:border-primary/40 transition-all",
      "aria-haspopup": "dialog"
    },
    /* @__PURE__ */ React2.createElement(IconSliders, { className: "w-4 h-4 text-primary" }),
    "Filters",
    hasActiveFilters && /* @__PURE__ */ React2.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-primary" })
  ), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-gray-500 font-medium" }, /* @__PURE__ */ React2.createElement("span", { className: "text-secondary font-black" }, filteredProducts.length), " ", filteredProducts.length === 1 ? "product" : "producten", activeCategoryObj && activeCategoryObj.id !== "Alle" && /* @__PURE__ */ React2.createElement(React2.Fragment, null, " in ", /* @__PURE__ */ React2.createElement("span", { className: "font-bold text-secondary" }, activeCategoryObj.name))), /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-2 ml-auto flex-wrap" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: () => setShowInclVat((v) => !v),
      className: `text-xs font-bold px-3 py-2 rounded-xl border transition-all shrink-0 ${showInclVat ? "bg-primary/10 text-primary border-primary/30" : "bg-white text-gray-400 border-[#E4EAF1] hover:border-primary/40"}`
    },
    showInclVat ? "incl. BTW" : "excl. BTW"
  ), /* @__PURE__ */ React2.createElement("div", { className: "relative" }, /* @__PURE__ */ React2.createElement(
    "select",
    {
      value: sortBy,
      onChange: (e) => setSortBy(e.target.value),
      "aria-label": "Sorteer producten",
      className: "appearance-none bg-white border border-[#E4EAF1] rounded-xl pl-3.5 pr-8 py-2 text-sm font-semibold text-secondary cursor-pointer hover:border-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
    },
    SORT_OPTIONS.map((o) => /* @__PURE__ */ React2.createElement("option", { key: o.id, value: o.id }, o.label))
  ), /* @__PURE__ */ React2.createElement(IconChevronDown, { className: "w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" })), /* @__PURE__ */ React2.createElement("div", { className: "relative w-full sm:w-64" }, /* @__PURE__ */ React2.createElement(IconSearch, { className: "w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" }), /* @__PURE__ */ React2.createElement(
    "input",
    {
      type: "search",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      placeholder: "Zoek product, categorie of merk...",
      "aria-label": "Zoek producten",
      className: "w-full bg-white border border-[#E4EAF1] rounded-xl pl-9 pr-4 py-2 text-sm text-secondary placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
    }
  )))), compareLimitWarning && /* @__PURE__ */ React2.createElement("p", { className: "text-xs font-bold text-amber-600 mb-3" }, "Maximaal 3 producten tegelijk vergelijken"), loading && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5" }, [...Array(8)].map((_, i) => /* @__PURE__ */ React2.createElement("div", { key: i, className: "animate-pulse bg-white rounded-2xl border border-[#E4EAF1] overflow-hidden" }, /* @__PURE__ */ React2.createElement("div", { className: "aspect-[4/3] bg-gray-100" }), /* @__PURE__ */ React2.createElement("div", { className: "p-4 space-y-2" }, /* @__PURE__ */ React2.createElement("div", { className: "h-3 bg-gray-100 rounded w-2/3" }), /* @__PURE__ */ React2.createElement("div", { className: "h-3 bg-gray-100 rounded w-1/2" }), /* @__PURE__ */ React2.createElement("div", { className: "h-4 bg-gray-100 rounded w-1/3 mt-3" }))))), !loading && filteredProducts.length === 0 && /* @__PURE__ */ React2.createElement("div", { className: "text-center py-20 bg-white rounded-2xl border border-dashed border-[#E4EAF1]" }, /* @__PURE__ */ React2.createElement("div", { className: "w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4" }, /* @__PURE__ */ React2.createElement(IconSearch, { className: "w-6 h-6 text-gray-300" })), /* @__PURE__ */ React2.createElement("p", { className: "text-gray-500 font-semibold text-sm" }, "Geen producten gevonden"), /* @__PURE__ */ React2.createElement("p", { className: "text-gray-400 text-xs mt-1" }, "Pas je zoekopdracht of filters aan."), /* @__PURE__ */ React2.createElement("button", { onClick: clearFilters, className: "mt-4 inline-flex items-center gap-1.5 text-primary text-xs font-bold hover:underline" }, "Filters wissen ", /* @__PURE__ */ React2.createElement(IconArrowRight, { className: "w-3.5 h-3.5" }))), !loading && filteredProducts.length > 0 && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5" }, filteredProducts.map((product) => /* @__PURE__ */ React2.createElement(
    ProductCard,
    {
      key: product.id,
      product,
      showInclVat,
      inCompare: Boolean(compareList.find((p) => p.id === product.id)),
      onCompare: handleCompareToggle,
      onQuickView: setQuickView
    }
  ))), /* @__PURE__ */ React2.createElement("div", { className: "mt-12 bg-secondary rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6" }, [
    { Icon: IconTruck, title: "Snelle levering", text: "Gratis verzending boven \u20AC250,-" },
    { Icon: IconShield, title: "Garantie", text: "Op alle producten" },
    { Icon: IconChat, title: "Expert advies", text: "Bel 085-0021 606" }
  ].map(({ Icon: I, title, text }) => /* @__PURE__ */ React2.createElement("div", { key: title, className: "flex items-center gap-4" }, /* @__PURE__ */ React2.createElement("div", { className: "w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white shrink-0" }, /* @__PURE__ */ React2.createElement(I, { className: "w-5 h-5" })), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("p", { className: "text-white font-bold text-sm" }, title), /* @__PURE__ */ React2.createElement("p", { className: "text-white/40 text-xs mt-0.5" }, text)))))))), showFilters && /* @__PURE__ */ React2.createElement("div", { className: "fixed inset-0 z-50 lg:hidden" }, /* @__PURE__ */ React2.createElement("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm", onClick: () => setShowFilters(false) }), /* @__PURE__ */ React2.createElement("div", { className: "absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl animate-[fadeSlideUp_0.25s_ease]" }, /* @__PURE__ */ React2.createElement("div", { className: "sticky top-0 bg-white rounded-t-3xl border-b border-[#E4EAF1] px-5 py-4 flex items-center justify-between" }, /* @__PURE__ */ React2.createElement("h2", { className: "text-lg font-black text-secondary flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(IconSliders, { className: "w-5 h-5 text-primary" }), "Filters"), /* @__PURE__ */ React2.createElement("button", { onClick: () => setShowFilters(false), className: "w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500", "aria-label": "Sluiten" }, /* @__PURE__ */ React2.createElement(IconX, { className: "w-4 h-4" }))), /* @__PURE__ */ React2.createElement("div", { className: "px-5 py-2 max-h-[60vh] overflow-y-auto" }, /* @__PURE__ */ React2.createElement(
    FilterSidebar,
    {
      categories,
      products,
      activeCategory,
      onCategory: (cat) => selectCategory(cat),
      priceMin,
      priceMax,
      onPriceMin: setPriceMin,
      onPriceMax: setPriceMax,
      onlyInStock,
      onOnlyInStock: setOnlyInStock,
      priceBounds
    }
  ), (hasActiveFilters || searchQuery) && /* @__PURE__ */ React2.createElement("button", { onClick: clearFilters, className: "mt-2 text-xs font-bold text-primary hover:underline" }, "Alle filters wissen")), /* @__PURE__ */ React2.createElement("div", { className: "sticky bottom-0 bg-white border-t border-[#E4EAF1] px-5 py-4" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: () => setShowFilters(false),
      className: "w-full bg-primary text-white font-black py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
    },
    "Toon ",
    filteredProducts.length,
    " ",
    filteredProducts.length === 1 ? "product" : "producten"
  )))), quickView && /* @__PURE__ */ React2.createElement(QuickViewModal, { product: quickView, onClose: () => setQuickView(null) }), showCompare && /* @__PURE__ */ React2.createElement(CompareModal, { list: compareList, onClose: () => setShowCompare(false) }), /* @__PURE__ */ React2.createElement(
    CompareBar,
    {
      list: compareList,
      onRemove: (id) => setCompareList((prev) => prev.filter((p) => p.id !== id)),
      onClear: () => setCompareList([]),
      onCompare: () => setShowCompare(true)
    }
  ));
};
var ProductList_default = ProductList;
export {
  ProductList_default as default
};
