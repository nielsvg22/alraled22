import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useCart } from '../lib/CartContext';
import axios from 'axios';
import { useTranslation, Trans } from 'react-i18next';
import { getMediaUrl, API_URL } from '../lib/api';
import { formatPrice, getImageSrc } from '../lib/productHelpers';
import RichText from './RichText';
import { ROUTES, shopWithCategory, categoryLink, categoryLabel, sortMenuCategories, NAV_LINKS } from '../lib/routes';

const DEFAULT_GENERAL = {
  tagline: '',
  footerPhone: '085-0021 606',
  footerEmail: 'info@alra-led.nl',
  logoUrl: '',
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
    <div ref={wrapRef} className="relative w-full md:w-full sm:w-64">
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
              to={ROUTES.product(product.id)}
              onClick={() => { setQuery(''); setOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                {getImg(product.imageUrl)
                  ? <img src={getImg(product.imageUrl)} alt={product.name} className="w-full h-full object-contain p-1" loading="lazy" decoding="async" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📦</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-secondary truncate">{product.name}</p>
                {product.category && <p className="text-[10px] text-gray-400">{product.category}</p>}
              </div>
              <span className="text-sm font-black text-primary shrink-0">{formatPrice(product.price)}</span>
            </Link>
          ))}
          <Link
            to={ROUTES.shop}
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
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef(null);
  const [general, setGeneral] = useState(DEFAULT_GENERAL);
  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const menuCategories = React.useMemo(() => sortMenuCategories(categories), [categories]);
  const [showMega, setShowMega] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [menuProducts, setMenuProducts] = useState([]);
  const closeTimeoutRef = useRef(null);
  const megaTimeoutRef = useRef(null);
  const megaRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bij elke paginawissel menu- en hoverstates resetten
  useEffect(() => {
    setMobileOpen(false);
    setShowCategories(false);
    clearTimeout(closeTimeoutRef.current);
    setShowMega(false);
    setHoveredCategory(null);
    clearTimeout(megaTimeoutRef.current);
  }, [location]);

  const openMenu = () => { clearTimeout(closeTimeoutRef.current); setShowMega(false); setShowCategories(true); };
  const closeMenuSoon = () => {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => { setShowCategories(false); }, 200);
  };
  const closeMenuNow = () => { clearTimeout(closeTimeoutRef.current); setShowCategories(false); };

  // Webshop-megamenu: categorieën met producten (los van het eenvoudige keuzemenu bij Producten)
  const openMega = () => { clearTimeout(megaTimeoutRef.current); setShowCategories(false); setShowMega(true); };
  const closeMegaSoon = () => {
    clearTimeout(megaTimeoutRef.current);
    megaTimeoutRef.current = setTimeout(() => { setShowMega(false); setHoveredCategory(null); }, 200);
  };
  const closeMegaNow = () => { clearTimeout(megaTimeoutRef.current); setShowMega(false); setHoveredCategory(null); };

  useEffect(() => {
    if (!showMega) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeMegaNow(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showMega]);

  useEffect(() => {
    if (!showMega || menuProducts.length > 0) return;
    axios.get(`${API_URL}/api/products`)
      .then(res => setMenuProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [showMega, menuProducts.length]);

  // Escape sluit het menu
  useEffect(() => {
    if (!showCategories) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeMenuNow(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showCategories]);


  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/general`, { params: { lang } })
      .then(res => setGeneral({ ...DEFAULT_GENERAL, ...res.data }))
      .catch(() => {});
    axios.get(`${API_URL}/api/products/categories/all`)
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
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

  const navLinks = NAV_LINKS.map(({ to, labelKey }) => ({ to, label: t(labelKey) }));

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
            <Link to={ROUTES.account} className="font-semibold text-primary hover:text-white transition-colors">{user.username}</Link>
          ) : (
            <Link to={ROUTES.login} className="font-semibold text-white/60 hover:text-primary transition-colors">{t('nav.login')}</Link>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm border-b border-gray-100' : 'bg-white border-b border-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-4 md:px-10 h-12 flex items-center justify-between gap-3 min-w-0">

          {/* Logo */}
          <Link to={ROUTES.home} className="flex items-center gap-2 shrink-0">
            {general.logoUrl ? (
              <img src={getMediaUrl(general.logoUrl)} alt="ALRA LED" className="h-8 w-auto" />
            ) : (
              <>
                <span className="text-xl font-black text-secondary tracking-tight">ALRA<span className="text-primary">LED</span></span>
                <span className="hidden sm:block text-[10px] font-medium text-gray-400 uppercase tracking-wider border-l border-gray-200 pl-2 ml-0.5">Solutions</span>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ to, label }, idx) => (
              <React.Fragment key={to}>
                <li>
                  <Link to={to}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive(to) ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-secondary hover:bg-gray-50'}`}>
                    {label}
                  </Link>
                </li>
                {/* Producten: keuzemenu met de productgroepen (de webshop zelf staat apart, achteraan) */}
                {idx === 1 && (
                  <li className="relative"
                    onMouseEnter={openMenu}
                    onMouseLeave={closeMenuSoon}
                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget) && !(menuRef.current && menuRef.current.contains(e.relatedTarget))) closeMenuSoon(); }}>
                    <button type="button"
                      aria-haspopup="true"
                      aria-expanded={showCategories}
                      onClick={() => (showCategories ? closeMenuNow() : openMenu())}
                      onFocus={openMenu}
                      onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); openMenu(); setTimeout(() => menuRef.current && menuRef.current.querySelector('[role=menuitem]') && menuRef.current.querySelector('[role=menuitem]').focus(), 30); } }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${showCategories ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-secondary hover:bg-gray-50'}`}>
                      {t('nav.products')}
                      <svg className={`w-3 h-3 transition-transform ${showCategories ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCategories && menuCategories.length > 0 && (
                      <div
                        ref={menuRef}
                        role="menu"
                        aria-label={t('nav.products')}
                        className="absolute left-0 top-full pt-2 z-50"
                        onKeyDown={(e) => {
                          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
                          const items = Array.from(menuRef.current.querySelectorAll('[role=menuitem]'));
                          const i = items.indexOf(document.activeElement);
                          if (i === -1) return;
                          e.preventDefault();
                          items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
                        }}>
                        <div className="w-64 bg-white rounded-2xl border border-gray-100 py-2 animate-in fade-in duration-150" style={{ boxShadow: '0 16px 40px rgba(0,0,0,0.14)' }}>
                          {menuCategories.map(cat => (
                            <Link
                              key={cat.id}
                              to={categoryLink(cat)}
                              role="menuitem"
                              onClick={closeMenuNow}
                              className="flex items-center justify-between gap-3 px-5 py-3 text-[14px] font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:bg-primary/10 focus-visible:text-primary transition-colors">
                              <span className="truncate">{categoryLabel(cat)}</span>
                              <svg className="w-3.5 h-3.5 shrink-0 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                )}
              </React.Fragment>
            ))}
            <li className="relative"
              onMouseEnter={openMega}
              onMouseLeave={closeMegaSoon}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget) && !(megaRef.current && megaRef.current.contains(e.relatedTarget))) closeMegaSoon(); }}>
              <Link to={ROUTES.shop}
                aria-haspopup="true"
                aria-expanded={showMega}
                onFocus={openMega}
                onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); openMega(); setTimeout(() => megaRef.current && megaRef.current.querySelector('[role=menuitem]') && megaRef.current.querySelector('[role=menuitem]').focus(), 30); } }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1 whitespace-nowrap border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${isActive('/producten') || showMega ? 'bg-primary text-white border-primary' : 'text-primary border-primary/30 bg-primary/5 hover:bg-primary hover:text-white hover:border-primary'}`}>
                {t('nav.shop')}
                <svg className={`w-3 h-3 transition-transform ${showMega ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </li>
          </ul>

          {/* Live search */}
          <div className="hidden md:block flex-1 max-w-[16rem] min-w-[7.5rem]">
            <LiveSearch />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Winkelwagen openen"
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
            {/* Leeg winkelmandje: naar de shop. Met producten: direct afrekenen. */}
            <Link
              to={cartCount > 0 ? ROUTES.checkout : ROUTES.shop}
              className={`hidden md:flex items-center gap-1.5 text-white text-sm font-black px-4 py-2.5 rounded-full shadow-md shadow-primary/30 hover:shadow-lg hover:brightness-110 active:scale-95 transition-all ml-1 whitespace-nowrap ${cartCount > 0 ? 'bg-green-600' : 'bg-primary'}`}>
              {cartCount > 0 ? `${t('nav.buyNow')} (${cartCount})` : t('nav.shopNow')}
              <span aria-hidden="true">→</span>
            </Link>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center" aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'} aria-expanded={mobileOpen}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Full-width mega dropdown: categorieën links, bijbehorende toepassing en producten rechts */}
        {showMega && menuCategories.length > 0 && (() => {
          const active = hoveredCategory || menuCategories[0];
          const catProducts = menuProducts.filter(p => p.categoryId === active.id || String(p.category || '').toLowerCase() === String(active.name || '').toLowerCase());
          const shown = catProducts.slice(0, 4);
          const count = active.productCount || catProducts.length;
          return (
            <div
              ref={megaRef}
              role="menu"
              aria-label={t('nav.shop')}
              className="w-full bg-white border-t border-gray-100"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              onMouseEnter={openMega}
              onMouseLeave={closeMegaSoon}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) closeMegaSoon(); }}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
                const items = Array.from(megaRef.current.querySelectorAll('[role=menuitem]'));
                const i = items.indexOf(document.activeElement);
                if (i === -1) return;
                e.preventDefault();
                items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
              }}>
              <div className="max-w-6xl mx-auto flex">
                {/* Links: categorieën */}
                <div className="w-[270px] border-r border-gray-100 py-2 shrink-0">
                  {menuCategories.map(cat => {
                    const isOn = active.id === cat.id;
                    return (
                      <Link
                        key={cat.id}
                        to={shopWithCategory(cat)}
                        role="menuitem"
                        onClick={closeMegaNow}
                        onMouseEnter={() => setHoveredCategory(cat)}
                        onFocus={() => setHoveredCategory(cat)}
                        className={`flex items-center justify-between gap-3 px-6 py-3 text-[14px] font-semibold transition-colors duration-150 focus:outline-none focus-visible:bg-primary/10 ${isOn ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <span className="truncate">{categoryLabel(cat)}</span>
                        <svg className={`w-3.5 h-3.5 shrink-0 transition-opacity ${isOn ? 'opacity-70' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    );
                  })}
                  <Link to={ROUTES.shop} role="menuitem" onClick={closeMegaNow}
                    className="flex items-center justify-between px-6 py-3 mt-1 border-t border-gray-100 text-[13px] font-bold text-gray-900 hover:text-primary hover:bg-gray-50 transition-colors focus:outline-none focus-visible:bg-primary/10">
                    <span>Alle producten</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>

                {/* Rechts: toelichting + producten van de gekozen categorie */}
                <div key={active.id} className="flex-1 min-w-0 p-8 flex gap-8 animate-in fade-in duration-200">
                  <div className="w-[240px] shrink-0 flex flex-col">
                    <h3 className="text-lg font-black text-gray-900 leading-tight">{categoryLabel(active)}</h3>
                    {active.description && <RichText value={active.description} className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-5" />}
                    {count > 0 && <p className="text-xs text-gray-400 mt-3">{count} {count === 1 ? 'product' : 'producten'}</p>}
                    <div className="mt-auto pt-5 flex flex-col gap-2">
                      <Link to={shopWithCategory(active)} onClick={closeMegaNow}
                        className="inline-flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-full hover:brightness-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                        Alle producten bekijken <span aria-hidden="true">→</span>
                      </Link>
                      <Link to={categoryLink(active)} onClick={closeMegaNow}
                        className="inline-flex items-center justify-center text-xs font-bold text-gray-600 hover:text-primary px-4 py-2 rounded-full border border-gray-200 hover:border-primary/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                        Meer over deze toepassing
                      </Link>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {shown.length > 0 ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {shown.map(product => (
                          <Link key={product.id} to={ROUTES.product(product.id)} onClick={closeMegaNow}
                            className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                            <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden mb-2">
                              <img src={getImageSrc(product)} alt={product.name} className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async" />
                            </div>
                            <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-primary transition-colors">{product.name}</p>
                            <p className="text-xs font-black text-gray-900 mt-0.5">{formatPrice(product.price)}</p>
                          </Link>
                        ))}
                      </div>
                    ) : active.imageUrl ? (
                      <div className="h-full min-h-[200px] rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden">
                        <img src={getMediaUrl(active.imageUrl)} alt={categoryLabel(active)} className="max-h-[240px] max-w-full object-contain p-4" loading="lazy" decoding="async" />
                      </div>
                    ) : (
                      <div className="h-full min-h-[160px] rounded-2xl bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                        {menuProducts.length === 0 ? 'Producten laden…' : 'Binnenkort meer producten'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
            <Link to={ROUTES.shop}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/producten') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t('nav.shop')}
            </Link>
            {categories.length > 0 && (
              <div className="py-2">
                <div className="px-4 pb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('nav.products')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {menuCategories.map(cat => (
                    <Link
                      key={cat.id}
                      to={categoryLink(cat)}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/20 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 group-hover:border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {cat.imageUrl
                          ? <img src={getMediaUrl(cat.imageUrl)} alt={cat.name} className="w-full h-full object-contain p-1" loading="lazy" decoding="async" />
                          : <svg className="w-4 h-4 text-gray-300 group-hover:text-primary/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        }
                      </div>
                      <span className="text-xs font-semibold text-gray-700 group-hover:text-primary transition-colors leading-tight break-words">{categoryLabel(cat)}</span>
                    </Link>
                  ))}
                </div>
                <Link
                  to={ROUTES.shop}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 mx-2 mt-3 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold text-gray-500 hover:text-primary transition-all"
                >
                  Bekijk alle producten
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            )}
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
            <Link to={ROUTES.account} className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              {user ? `${t('nav.account')} (${user.username})` : t('nav.login')}
            </Link>
          </div>
        )}
      </nav>
    </>
  );
};

export default Header;
