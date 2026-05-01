import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useCart } from '../lib/CartContext';
import { useTheme } from '../lib/ThemeContext';
import axios from 'axios';
import { useTranslation, Trans } from 'react-i18next';
import { getMediaUrl, API_URL } from '../lib/api';

const DEFAULT_GENERAL = {
  tagline: '',
  footerPhone: '085-0021 606',
  footerEmail: 'info@alra-led.nl',
};

/* ── Live Search ─────────────────────────────── */
function LiveSearch() {
  const { t } = useTranslation();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      axios.get(`${API_URL}/api/products`)
        .then(res => {
          const filtered = res.data.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            (p.category || '').toLowerCase().includes(query.toLowerCase())
          ).slice(0, 6);
          setResults(filtered);
          setOpen(true);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getImg = (url) => {
    return getMediaUrl(url);
  };

  return (
    <div ref={wrapRef} className="relative w-full sm:w-64">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={t('header.searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full bg-gray-100 border border-transparent focus:border-primary focus:bg-white rounded-full pl-9 pr-4 py-2 text-sm outline-none transition-all"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {results.map(product => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              onClick={() => { setQuery(''); setOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                {getImg(product.imageUrl)
                  ? <img src={getImg(product.imageUrl)} alt={product.name} className="w-full h-full object-contain p-1" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📦</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-secondary truncate">{product.name}</p>
                {product.category && <p className="text-[10px] text-gray-400">{product.category}</p>}
              </div>
              <span className="text-sm font-black text-primary shrink-0">€{product.price}</span>
            </Link>
          ))}
          <Link
            to={`/producten`}
            onClick={() => { setQuery(''); setOpen(false); }}
            className="block px-4 py-2.5 text-center text-xs font-bold text-primary hover:bg-primary/5 transition-colors border-t border-gray-100"
          >
            {t('header.searchViewAll')}
          </Link>
        </div>
      )}

      {open && query.trim() && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-4 text-center z-50">
          <p className="text-sm text-gray-400">
            <Trans i18nKey="header.searchNoResults" values={{ query }} components={[<strong />]} />
          </p>
        </div>
      )}
    </div>
  );
}

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { setIsCartOpen, cartCount } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef(null);
  const [general, setGeneral] = useState(DEFAULT_GENERAL);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/general`, { params: { lang } })
      .then(res => setGeneral({ ...DEFAULT_GENERAL, ...res.data }))
      .catch(() => {});
  }, [i18n.resolvedLanguage, i18n.language]);

  useEffect(() => {
    const handler = (e) => {
      if (languageRef.current && !languageRef.current.contains(e.target)) setLanguageOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const languageCode = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    document.documentElement.lang = languageCode;
  }, [i18n.resolvedLanguage, i18n.language]);

  const isActive = (path) => location.pathname === path;

  const languageCode = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
  const languages = [
    { code: 'nl', flag: '🇳🇱', label: t('languages.nl') },
    { code: 'en', flag: '🇬🇧', label: t('languages.en') },
    { code: 'de', flag: '🇩🇪', label: t('languages.de') },
  ];
  const activeLanguage = languages.find(l => l.code === languageCode) || languages[0];

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/over-ons', label: t('nav.about') },
    { to: '/producten', label: t('nav.products') },
    { to: '/blog', label: t('nav.blog') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-secondary text-white py-1 px-4 md:px-10 flex justify-between items-center text-xs">
        <div className="flex gap-5">
          <a href={`mailto:${general.footerEmail}`} className="text-white/60 hover:text-primary transition-colors">{general.footerEmail}</a>
          <a href={`tel:${String(general.footerPhone || '').replace(/-/g, '')}`} className="text-white/60 hover:text-primary transition-colors">{general.footerPhone}</a>
        </div>
        <div className="flex gap-3 items-center">
          {!!general.tagline && <span className="hidden md:block text-white/40 text-[11px]">{general.tagline}</span>}
          <div ref={languageRef} className="relative">
            <button
              type="button"
              onClick={() => setLanguageOpen(v => !v)}
              className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-2.5 py-1 transition-colors"
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              title={t('header.language')}
            >
              <span className="text-sm leading-none">{activeLanguage.flag}</span>
              <svg className={`w-3 h-3 text-white/70 transition-transform ${languageOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {languageOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden z-[60]">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setLanguageOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                      lang.code === activeLanguage.code ? 'bg-primary/5 text-secondary' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="font-semibold">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {user ? (
            <Link to="/account" className="font-semibold text-primary hover:text-white transition-colors">{user.username}</Link>
          ) : (
            <Link to="/login" className="font-semibold text-white/60 hover:text-primary transition-colors">{t('nav.login')}</Link>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm border-b border-gray-100' : 'bg-white border-b border-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-4 md:px-10 h-12 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-black text-secondary tracking-tight">ALRA<span className="text-primary">LED</span></span>
            <span className="hidden sm:block text-[10px] font-medium text-gray-400 uppercase tracking-wider border-l border-gray-200 pl-2 ml-0.5">Solutions</span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(to) ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-secondary hover:bg-gray-50'}`}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Live search */}
          <div className="hidden md:block">
            <LiveSearch />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDarkMode ? t('header.themeOn') : t('header.themeOff')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                isDarkMode ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {isDarkMode ? '💡' : '🌑'}
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-secondary transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* CTA */}
            <Link to="/producten" className="hidden md:flex bg-secondary text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-primary transition-all ml-1">
              {t('nav.shopNow')}
            </Link>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(to) ? 'text-primary bg-primary/5' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link to="/account" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              {user ? `${t('nav.account')} (${user.username})` : t('nav.login')}
            </Link>
          </div>
        )}
      </nav>
    </>
  );
};

export default Header;
