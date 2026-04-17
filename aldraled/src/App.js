import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { CartProvider } from './lib/CartContext';
import { ThemeProvider } from './lib/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import DealersMap from './pages/DealersMap';
import Returns from './pages/Returns';
import ChatBubble from './components/ChatBubble';
import PasswordWall from './components/PasswordWall';
import './App.css';

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
      })
      .catch(() => {});
  }, []);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ThemeLoader />
            <PasswordWall>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/over-ons" element={<About />} />
                  <Route path="/producten" element={<ProductList />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/registreren" element={<Register />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/bestelling-geplaatst" element={<OrderSuccess />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogDetail />} />
                  <Route path="/verkooppunten" element={<DealersMap />} />
                  <Route path="/retouren" element={<Returns />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </Layout>
            </PasswordWall>
            {process.env.NODE_ENV !== 'test' && <ChatBubble />}
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
