import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './lib/AuthContext';
import { CartProvider } from './lib/CartContext';
import { ThemeProvider } from './lib/ThemeContext';
import Layout from './components/Layout';
import ChatBubble from './components/ChatBubble';
import PasswordWall from './components/PasswordWall';
import analytics from './lib/analytics';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const ProductList = lazy(() => import('./pages/ProductList'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const DealersMap = lazy(() => import('./pages/DealersMap'));
const Returns = lazy(() => import('./pages/Returns'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const SeoLandingPage = lazy(() => import('./pages/SeoLandingPage'));

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Converts #rrggbb to "r g b" for CSS variable format Tailwind needs
function hexToRgbVars(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function ThemeLoader() {
  useEffect(() => {
    if (typeof fetch !== 'function') return;
    fetch(`${API_URL}/api/content/theme`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const root = document.documentElement;
        if (data.primary)   root.style.setProperty('--color-primary',    hexToRgbVars(data.primary));
        if (data.secondary) root.style.setProperty('--color-secondary',  hexToRgbVars(data.secondary));
        if (data.accent)    root.style.setProperty('--color-accent',     hexToRgbVars(data.accent));
        if (data.bg)        root.style.setProperty('--color-bg',         hexToRgbVars(data.bg));
        if (data.surface)   root.style.setProperty('--color-surface',    hexToRgbVars(data.surface));
        if (data.textColor) root.style.setProperty('--color-text',       hexToRgbVars(data.textColor));
        if (data.textMuted) root.style.setProperty('--color-text-muted', hexToRgbVars(data.textMuted));
        // Zet data-theme op <html> zodat CSS [data-theme] selectors actief zijn
        root.setAttribute('data-theme', 'loaded');
        // Zet ook body direct zodat geen flash van witte achtergrond
        if (data.bg)        document.body.style.backgroundColor = data.bg;
        if (data.textColor) document.body.style.color = data.textColor;
      })
      .catch(() => {});
  }, []);
  return null;
}

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    setTimeout(() => analytics.trackPageView(), 100);
  }, [location]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Laden...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <ThemeLoader />
              <RouteTracker />
              <PasswordWall>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/over-ons" element={<About />} />
                      <Route path="/producten" element={<ProductList />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/registreren" element={<Register />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/bestelling-geplaatst/:orderId?" element={<OrderSuccess />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:id" element={<BlogDetail />} />
                      <Route path="/verkooppunten" element={<DealersMap />} />
                      <Route path="/retouren" element={<Returns />} />
                      <Route path="/algemene-voorwaarden" element={<LegalPage />} />
                      <Route path="/privacy-policy" element={<LegalPage />} />
                      <Route path="/retourbeleid" element={<LegalPage />} />
                      <Route path="/klachten" element={<LegalPage />} />
                      <Route path="/:slug(led-bouwlichtslang|professionele-bouwplaatsverlichting|led-lichtslang|bouwverlichting-huren|bedrijfswagenverlichting)" element={<SeoLandingPage />} />
                      <Route path="*" element={<Home />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </PasswordWall>
              {process.env.NODE_ENV !== 'test' && <ChatBubble />}
            </Router>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
