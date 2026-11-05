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
import { PLACEHOLDER_IMAGE } from './lib/api';
import './App.css';
import { API_URL } from './lib/config';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const ProductList = lazy(() => import('./pages/ProductList'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const DealersMap = lazy(() => import('./pages/DealersMap'));
const Groothandels = lazy(() => import('./pages/Groothandels'));
const Returns = lazy(() => import('./pages/Returns'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const SeoLandingPage = lazy(() => import('./pages/SeoLandingPage'));

// Adressen van de SEO-pagina's (beheerd in het CRM onder SEO Pagina's). React Router v6 kent geen
// reguliere expressies in routes, dus elk adres krijgt een eigen route.
const SEO_SLUGS = ['led-bouwlichtslang', 'professionele-bouwplaatsverlichting', 'led-lichtslang', 'bouwverlichting-huren'];
// Productgroep-pagina's (zelfde pagina-component; standaardtekst uit lib/groupPages.json, aanpasbaar in het CRM)
const GROUP_SLUGS = ['lichtslangen', 'hefbrugverlichting', 'veiligheidsverlichting', 'bouwverlichting', 'bedrijfswagenverlichting'];
const NotFound = lazy(() => import('./pages/NotFound'));

// Converts #rrggbb to "r g b" for CSS variable format Tailwind needs
function hexToRgbVars(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

// Bij elke nieuwe pagina bovenaan beginnen (anders blijft de scrollstand van de vorige pagina staan,
// bv. een productpagina die direct onderaan opent). Met een #anker scrollen we daar naartoe.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
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

// Vangt overal afbeeldingen op die niet laden (404/offline) en toont een
// nette lokale placeholder in plaats van een kapot afbeelding-icoon.
function GlobalImageFallback() {
  React.useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      if (t && t.tagName === 'IMG' && t.src && !t.src.startsWith('data:')) {
        t.src = PLACEHOLDER_IMAGE;
      }
    };
    document.addEventListener('error', handler, true);
    return () => document.removeEventListener('error', handler, true);
  }, []);
  return null;
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <ThemeLoader />
              <ScrollToTop />
              <RouteTracker />
              <GlobalImageFallback />
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
                      <Route path="/account/bestelling/:id" element={<OrderDetail />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/bestelling-geplaatst/:orderId?" element={<OrderSuccess />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:id" element={<BlogDetail />} />
                      <Route path="/verkooppunten" element={<DealersMap />} />
                      <Route path="/groothandels" element={<Groothandels />} />
                      <Route path="/retouren" element={<Returns />} />
                      <Route path="/algemene-voorwaarden" element={<LegalPage />} />
                      <Route path="/privacy-policy" element={<LegalPage />} />
                      <Route path="/retourbeleid" element={<LegalPage />} />
                      <Route path="/klachten" element={<LegalPage />} />
                      {[...SEO_SLUGS, ...GROUP_SLUGS].map((seoSlug) => (
                        <Route key={seoSlug} path={`/${seoSlug}`} element={<SeoLandingPage slug={seoSlug} />} />
                      ))}
                      <Route path="*" element={<NotFound />} />
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
