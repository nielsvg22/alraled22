import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../lib/CartContext';
import { API_URL } from '../lib/api';
import { getImageSrc, formatPrice, PLACEHOLDER_IMAGE } from '../lib/productHelpers';
import { VAT_RATE } from '../lib/config';
import { ROUTES } from '../lib/routes';

/* ── LINE ICONS (inline SVG, geen extra dependency) ───────── */
const Icon = ({ className = 'w-4 h-4', children }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IconGrid = (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></Icon>;
const IconTruck = (p) => <Icon {...p}><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></Icon>;
const IconShield = (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Icon>;
const IconAward = (p) => <Icon {...p}><circle cx="12" cy="8" r="6" /><path d="M8.5 13.5 8 21l4-2.5L16 21l-.5-7.5" /><path d="M10 8l1.5 1.5L14.5 6.5" /></Icon>;
const IconChat = (p) => <Icon {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>;
const IconSliders = (p) => <Icon {...p}><line x1="4" y1="21" x2="4" y2="13" /><line x1="4" y1="9" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="13" x2="7" y2="13" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></Icon>;
const IconChevronDown = (p) => <Icon {...p}><polyline points="6 9 12 15 18 9" /></Icon>;
const IconChevronUp = (p) => <Icon {...p}><polyline points="18 15 12 9 6 15" /></Icon>;
const IconCart = (p) => <Icon {...p}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></Icon>;
const IconEye = (p) => <Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Icon>;
const IconCompare = (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="3" x2="12" y2="21" /><line x1="3" y1="12" x2="21" y2="12" /></Icon>;
const IconCheck = (p) => <Icon {...p}><polyline points="20 6 9 17 4 12" /></Icon>;
const IconX = (p) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>;
const IconArrowRight = (p) => <Icon {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Icon>;
const IconPackage = (p) => <Icon {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></Icon>;
const IconZap = (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Icon>;
const IconBulb = (p) => <Icon {...p}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 3a6 6 0 0 0-4 10c.6.6 1 1.3 1 2.2V16h6v-.8c0-.9.4-1.6 1-2.2A6 6 0 0 0 12 3z" /></Icon>;
const IconWave = (p) => <Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Icon>;

/* Icoon per categorie (fallback: grid) */
const categoryIcon = (cat) => {
  const slug = String(cat?.slug || cat?.name || '').toLowerCase();
  if (slug.includes('bedrijfswagen')) return IconTruck;
  if (slug.includes('bouwlichtslang')) return IconWave;
  if (slug.includes('hefbrug')) return IconZap;
  if (slug.includes('werkverlichting')) return IconBulb;
  if (slug.includes('veiligheid') || slug.includes('verkeers')) return IconShield;
  return IconGrid;
};

/* ── QUICK-VIEW MODAL ─────────────────────────── */
function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [showInclVat, setShowInclVat] = useState(false);
  const displayPrice = showInclVat ? Number(product?.price || 0) * (1 + VAT_RATE) : Number(product?.price || 0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-[fadeSlideUp_0.25s_ease]">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors text-gray-500 text-sm shadow-sm" aria-label="Sluiten">
          <IconX className="w-4 h-4" />
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="bg-[#F7F9FC] aspect-square flex items-center justify-center p-8">
            <img src={getImageSrc(product)} alt={product.name} className="w-full h-full object-contain" loading="lazy" decoding="async" />
          </div>
          <div className="p-7 flex flex-col gap-4">
            {product.category && <span className="text-xs font-bold text-primary uppercase tracking-widest">{product.category}</span>}
            <h2 className="text-xl font-black text-secondary leading-tight">{product.name}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-secondary">{formatPrice(displayPrice)}</span>
              <button onClick={() => setShowInclVat(v => !v)}
                className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-all ${
                  showInclVat ? 'bg-primary/10 text-primary border-primary/30' : 'text-gray-400 border-gray-200'
                }`}>
                {showInclVat ? 'incl. BTW' : 'excl. BTW'}
              </button>
            </div>
            {product.description && <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{product.description}</p>}
            <div className="flex items-center gap-2 mt-auto">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base">−</button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base">+</button>
              </div>
              <button onClick={handleAdd} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${added ? 'bg-green-500 text-white' : 'bg-secondary text-white hover:bg-primary'}`}>
                {added ? '✓ Toegevoegd' : 'In winkelwagen'}
              </button>
            </div>
            <Link to={ROUTES.product(product.id)} onClick={onClose} className="text-center text-xs font-bold text-gray-400 hover:text-primary transition-colors">
              Volledige productpagina →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── COMPARE BAR ──────────────────────────────── */
function CompareBar({ list, onRemove, onClear, onCompare }) {
  if (list.length === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-secondary text-white shadow-2xl border-t-2 border-primary">
      <div className="max-w-full px-6 py-3 mx-auto" style={{ maxWidth: '1440px' }}>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-white/60 shrink-0">Vergelijken</span>
          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
            {list.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 shrink-0">
                <img src={getImageSrc(p)} alt={p.name} className="w-7 h-7 rounded-lg object-cover bg-white" loading="lazy" decoding="async" />
                <span className="text-xs font-semibold max-w-[120px] truncate">{p.name}</span>
                <button onClick={() => onRemove(p.id)} className="text-white/40 hover:text-white ml-1 text-xs" aria-label="Verwijder uit vergelijking">✕</button>
              </div>
            ))}
            {list.length < 3 && (
              <div className="w-24 h-9 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/30 text-xs shrink-0">
                + product
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onClear} className="text-xs text-white/40 hover:text-white transition-colors">Wissen</button>
            <button onClick={onCompare} disabled={list.length < 2}
              className="bg-primary text-white text-xs font-bold px-5 py-2 rounded-full hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              Vergelijk {list.length} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── COMPARE MODAL ────────────────────────────── */
function CompareModal({ list, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const ROWS = [
    { label: 'Prijs', key: (p) => formatPrice(p.price) },
    { label: 'Categorie', key: (p) => p.category || '—' },
    { label: 'Beschrijving', key: (p) => p.description ? p.description.slice(0, 80) + (p.description.length > 80 ? '…' : '') : '—' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-auto max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <h2 className="font-black text-secondary text-lg">Productvergelijking</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500 transition-colors" aria-label="Sluiten">✕</button>
        </div>
        <div className="p-8">
          <div className="grid gap-4" style={{ gridTemplateColumns: `160px repeat(${list.length}, 1fr)` }}>
            <div />
            {list.map(p => (
              <div key={p.id} className="text-center space-y-2">
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                  <img src={getImageSrc(p)} alt={p.name} className="w-full h-full object-contain p-4" loading="lazy" decoding="async" />
                </div>
                <h3 className="text-sm font-black text-secondary">{p.name}</h3>
              </div>
            ))}
            {ROWS.map(({ label, key }) => (
              <React.Fragment key={label}>
                <div className="flex items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                </div>
                {list.map(p => (
                  <div key={p.id} className="bg-gray-50 rounded-xl p-4 text-sm text-secondary font-medium text-center">
                    {key(p)}
                  </div>
                ))}
              </React.Fragment>
            ))}
            <div />
            {list.map(p => (
              <div key={p.id} className="text-center">
                <Link to={ROUTES.product(p.id)} onClick={onClose}
                  className="block bg-secondary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-primary transition-all">
                  Bekijk product →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PRODUCT CARD ─────────────────────────────── */
function ProductCard({ product, showInclVat, inCompare, onCompare, onQuickView }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const displayPrice = showInclVat ? Number(product.price || 0) * (1 + VAT_RATE) : Number(product.price || 0);
  const outOfStock = Number(product.stock) <= 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#E4EAF1] overflow-hidden flex flex-col relative transition-all duration-200 hover:shadow-[0_14px_34px_-8px_rgba(7,27,54,0.18)] hover:-translate-y-1">
      <Link to={ROUTES.product(product.id)} className="block">
        {/* Image area */}
        <div className="relative aspect-[4/3] bg-[#F7F9FC] overflow-hidden">
          <img
            src={getImageSrc(product)}
            alt={product.name}
            className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy" decoding="async"
          />
          {/* Category pill */}
          {product.category && (
            <span className="absolute top-3 left-3 max-w-[75%] truncate bg-white/95 backdrop-blur text-[11px] font-bold text-secondary px-2.5 py-1 rounded-full shadow-sm border border-[#E4EAF1]">
              {product.category}
            </span>
          )}
          {/* Compare toggle */}
          <button
            onClick={(e) => { e.preventDefault(); onCompare(product); }}
            title={inCompare ? 'Verwijder uit vergelijking' : 'Voeg toe aan vergelijking'}
            className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
              inCompare ? 'bg-primary border-primary text-white' : 'bg-white/95 border-[#E4EAF1] text-gray-400 hover:text-primary hover:border-primary opacity-0 group-hover:opacity-100'
            }`}
            aria-label={inCompare ? 'Verwijder uit vergelijking' : 'Voeg toe aan vergelijking'}
          >
            <IconCompare className="w-3.5 h-3.5" />
          </button>
          {/* Quickview overlay */}
          <button
            onClick={(e) => { e.preventDefault(); onQuickView(product); }}
            className="absolute left-3 bottom-3 z-10 inline-flex items-center gap-1.5 bg-secondary/90 backdrop-blur-sm text-white text-[11px] font-bold pl-2.5 pr-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:bg-primary"
          >
            <IconEye className="w-3.5 h-3.5" />
            Snel bekijken
          </button>
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 pt-3 flex flex-col gap-2 flex-1">
        <Link to={ROUTES.product(product.id)} className="block">
          <h3 className="text-sm font-bold text-secondary leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-black text-secondary leading-none">{formatPrice(displayPrice)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-1">
              {showInclVat ? 'incl. btw' : 'excl. btw'}
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            title={outOfStock ? 'Niet op voorraad' : 'In winkelwagen'}
            aria-label="In winkelwagen"
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 ${
              added
                ? 'bg-green-500 text-white'
                : outOfStock
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-primary text-white hover:brightness-110 shadow-sm'
            }`}
          >
            {added ? <IconCheck className="w-4 h-4" /> : <IconCart className="w-4 h-4" />}
          </button>
        </div>
      </div>

      </div>
  );
}

/* ── FILTER GROEP (inklapbaar) ─────────────────── */
function FilterGroup({ title, icon, open, onToggle, children }) {
  return (
    <div className="border-b border-[#E4EAF1] py-4 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-bold text-secondary flex items-center gap-2">
          {icon}
          {title}
        </span>
        {open ? <IconChevronUp className="w-4 h-4 text-gray-400" /> : <IconChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

/* ── FILTER SIDEBAR (desktop + hergebruikt in mobiele drawer) ── */
function FilterSidebar({
  categories, products, activeCategory, onCategory, priceMin, priceMax, onPriceMin, onPriceMax,
  onlyInStock, onOnlyInStock, priceBounds,
}) {
  const [openGroup, setOpenGroup] = useState('categorie');

  const minPct = priceBounds.max > priceBounds.min ? ((priceMin - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100 : 0;
  const maxPct = priceBounds.max > priceBounds.min ? ((priceMax - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100 : 100;

  const allItems = [{ id: 'Alle', name: 'Alle producten', slug: '', productCount: products.length }, ...categories];

  return (
    <div className="space-y-1">
      {/* Categorie */}
      <FilterGroup title="Categorie" icon={<IconGrid className="w-4 h-4 text-primary" />} open={openGroup === 'categorie'} onToggle={() => setOpenGroup(openGroup === 'categorie' ? '' : 'categorie')}>
        <div className="flex flex-col items-stretch gap-0.5 max-h-72 overflow-y-auto pr-1">
          {allItems.map((cat) => {
            const isActive = activeCategory === cat.id;
            const CatIcon = categoryIcon(cat);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategory(cat)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm transition-all duration-150 ${
                  isActive ? 'bg-primary/10 text-primary font-bold border border-primary/20' : 'text-gray-600 hover:bg-white hover:border-[#E4EAF1] border border-transparent'
                }`}
              >
                <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}`}>
                  {isActive && <IconCheck className="w-3 h-3" />}
                </span>
                <CatIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-gray-300'}`} />
                <span className="flex-1 truncate">{cat.name}</span>
                {typeof cat.productCount === 'number' && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    {cat.productCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* Prijs */}
      <FilterGroup title="Prijs" icon={<IconSliders className="w-4 h-4 text-primary" />} open={openGroup === 'prijs'} onToggle={() => setOpenGroup(openGroup === 'prijs' ? '' : 'prijs')}>
        <div className="space-y-4">
          {/* Visuele track met ingevuld bereik */}
          <div className="h-1.5 bg-gray-200 rounded-full relative">
            <div
              className="absolute top-0 h-1.5 bg-primary rounded-full"
              style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }}
            />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="price-min" className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Vanaf</label>
                <span className="text-xs font-bold text-secondary">€ {priceMin.toLocaleString('nl-NL')}</span>
              </div>
              <input
                id="price-min"
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={1}
                value={priceMin}
                onChange={(e) => onPriceMin(Math.min(Number(e.target.value), priceMax))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="price-max" className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tot</label>
                <span className="text-xs font-bold text-secondary">€ {priceMax.toLocaleString('nl-NL')}</span>
              </div>
              <input
                id="price-max"
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={1}
                value={priceMax}
                onChange={(e) => onPriceMax(Math.max(Number(e.target.value), priceMin))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      </FilterGroup>

      {/* Voorraad */}
      <FilterGroup title="Voorraad" icon={<IconPackage className="w-4 h-4 text-primary" />} open={openGroup === 'voorraad'} onToggle={() => setOpenGroup(openGroup === 'voorraad' ? '' : 'voorraad')}>
        <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
          <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${onlyInStock ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}`}>
            {onlyInStock && <IconCheck className="w-3 h-3" />}
          </span>
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => onOnlyInStock(e.target.checked)}
            className="sr-only"
          />
          <span className="text-sm text-gray-600">Alleen op voorraad</span>
        </label>
      </FilterGroup>
    </div>
  );
}

/* ── MAIN COMPONENT ───────────────────────────── */
const ProductList = () => {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [categories, setCategories]   = useState([]);
  const [quickView, setQuickView]     = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showInclVat, setShowInclVat] = useState(false);
  const [sortBy, setSortBy]           = useState('nieuwste');
  const [priceMin, setPriceMin]       = useState(0);
  const [priceMax, setPriceMax]       = useState(0);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const gridAnchorRef = useRef(null);
  const [compareLimitWarning, setCompareLimitWarning] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/products`)
      .then(res => { setProducts(res.data); setLoading(false); })
      .catch((err) => { console.error('Failed to load products:', err); setLoading(false); });
    axios.get(`${API_URL}/api/products/categories/all`)
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // Prijsgrenzen op basis van echte productdata
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map(p => Number(p.price) || 0);
    const max = Math.max(...prices);
    return { min: 0, max: Math.ceil(max || 1) };
  }, [products]);

  useEffect(() => {
    if (priceBounds.max > 0 && priceMax === 0) setPriceMax(priceBounds.max);
  }, [priceBounds, priceMax]);

  // Lees categorie uit URL
  useEffect(() => {
    const catParam = searchParams.get('categorie');
    if (catParam) {
      const matched = categories.find(c => c.slug === catParam || c.id === catParam);
      if (matched) setActiveCategory(matched.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categories]);

  const sortedProducts = useMemo(() => {
    let list = [...products];
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'name':
        list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'nl'));
        break;
      case 'nieuwste':
      default:
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }
    return list;
  }, [products, sortBy]);

  const filteredProducts = sortedProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'Alle' || p.categoryId === activeCategory || (p.category || '').toLowerCase() === String(activeCategory).toLowerCase();
    const price = Number(p.price) || 0;
    const matchesPrice = priceBounds.max > 0 ? (price >= priceMin && price <= priceMax) : true;
    const matchesStock = !onlyInStock || Number(p.stock) > 0;
    return matchesSearch && matchesCat && matchesPrice && matchesStock;
  });

  const activeCategoryObj = useMemo(() => {
    if (activeCategory === 'Alle') return { id: 'Alle', name: 'Alle producten', slug: '' };
    return categories.find(c => c.id === activeCategory) || null;
  }, [activeCategory, categories]);

  const scrollToProducts = () => {
    setTimeout(() => gridAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const selectCategory = (cat) => {
    if (cat.id === 'Alle') {
      setActiveCategory('Alle');
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
    setActiveCategory('Alle');
    setSearchParams({});
    setSearchQuery('');
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    setOnlyInStock(false);
  };

  const hasActiveFilters = activeCategory !== 'Alle' || searchQuery !== '' || onlyInStock || (priceBounds.max > 0 && (priceMin > priceBounds.min || priceMax < priceBounds.max));

  const handleCompareToggle = useCallback((product) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev.filter(p => p.id !== product.id);
      if (prev.length >= 3) {
        setCompareLimitWarning(true);
        setTimeout(() => setCompareLimitWarning(false), 2000);
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  // Hero-afbeelding: mooie bestaande productfoto
  const heroImage = useMemo(() => {
    if (products.length === 0) return null;
    const pref = products.find(p => (p.category || '').toLowerCase().includes('bedrijfswagen')) || products[0];
    const src = getImageSrc(pref);
    return src === PLACEHOLDER_IMAGE ? null : src;
  }, [products]);

  const SORT_OPTIONS = [
    { id: 'nieuwste', label: 'Nieuwste' },
    { id: 'price-asc', label: 'Prijs laag → hoog' },
    { id: 'price-desc', label: 'Prijs hoog → laag' },
    { id: 'name', label: 'Naam A-Z' },
  ];

  const heroUsps = [
    { Icon: IconTruck, title: 'Snel geleverd', text: 'Uit voorraad leverbaar' },
    { Icon: IconShield, title: 'Garantie', text: 'Kwaliteit verzekerd' },
    { Icon: IconAward, title: 'Voor professionals', text: 'Scherpe prijzen' },
    { Icon: IconChat, title: 'Persoonlijk advies', text: 'Wij denken met je mee' },
  ];

  return (
    <div className="bg-[#F7F9FC] min-h-screen pb-24">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary to-secondary/70" />
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-full md:w-[55%] h-full object-cover md:opacity-35 opacity-15"
            loading="eager" decoding="async"
          />
        )}
        {/* decoratieve cirkels */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-white/5" />

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 min-h-[300px] md:min-h-[340px] flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Onze collectie</p>
          <h1 className="text-3xl md:text-4xl lg:text-[42px] font-black text-white leading-tight max-w-2xl">
            LED verlichting<br />
            <span className="text-accent">voor elke toepassing</span>
          </h1>
          <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl">Krachtig. Betrouwbaar. Voor professionals.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7 max-w-3xl">
            {heroUsps.map(({ Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-3 border border-white/10">
                <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold leading-tight">{title}</p>
                  <p className="text-white/50 text-[11px] mt-0.5 leading-tight">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOOFD INHOUD ── */}
      <div ref={gridAnchorRef} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 scroll-mt-24">
        {/* ── CATEGORIE-NAVIGATIE (horizontaal scrollbaar) ── */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[{ id: 'Alle', name: 'Alle producten', slug: '', productCount: products.length }, ...categories].map((cat) => {
            const CatIcon = categoryIcon(cat);
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                aria-pressed={isActive}
                className={`group shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-white transition-all duration-150 ${
                  isActive
                    ? 'border-primary bg-primary/5 text-primary shadow-[0_6px_18px_-6px_rgba(20,115,230,0.35)]'
                    : 'border-[#E4EAF1] text-gray-600 hover:border-primary/40 hover:text-secondary hover:shadow-md'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                  <CatIcon className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold whitespace-nowrap">{cat.name}</span>
                {typeof cat.productCount === 'number' && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    {cat.productCount}
                  </span>
                )}
                {isActive && <IconCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* ── LAYOUT: SIDEBAR + PRODUCTEN ── */}
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block w-[250px] shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-[#E4EAF1] p-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-black text-secondary uppercase tracking-wider flex items-center gap-2">
                  <IconSliders className="w-4 h-4 text-primary" />
                  Filters
                </h2>
                {(hasActiveFilters || searchQuery) && (
                  <button onClick={clearFilters} className="text-[11px] font-bold text-primary hover:underline">Wissen</button>
                )}
              </div>
              <FilterSidebar
                categories={categories}
                products={products}
                activeCategory={activeCategory}
                onCategory={selectCategory}
                priceMin={priceMin}
                priceMax={priceMax}
                onPriceMin={setPriceMin}
                onPriceMax={setPriceMax}
                onlyInStock={onlyInStock}
                onOnlyInStock={setOnlyInStock}
                priceBounds={priceBounds}
              />
            </div>
          </aside>

          {/* Producten */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {/* Mobiele filterknop */}
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E4EAF1] text-sm font-bold text-secondary hover:border-primary/40 transition-all"
                aria-haspopup="dialog"
              >
                <IconSliders className="w-4 h-4 text-primary" />
                Filters
                {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>

              {/* Resultaten */}
              <p className="text-sm text-gray-500 font-medium">
                <span className="text-secondary font-black">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'product' : 'producten'}
                {activeCategoryObj && activeCategoryObj.id !== 'Alle' && (
                  <> in <span className="font-bold text-secondary">{activeCategoryObj.name}</span></>
                )}
              </p>

              <div className="flex items-center gap-2 ml-auto flex-wrap">
                {/* BTW toggle */}
                <button
                  onClick={() => setShowInclVat(v => !v)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all shrink-0 ${
                    showInclVat ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white text-gray-400 border-[#E4EAF1] hover:border-primary/40'
                  }`}
                >
                  {showInclVat ? 'incl. BTW' : 'excl. BTW'}
                </button>

                {/* Sorteer dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sorteer producten"
                    className="appearance-none bg-white border border-[#E4EAF1] rounded-xl pl-3.5 pr-8 py-2 text-sm font-semibold text-secondary cursor-pointer hover:border-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                  <IconChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Zoeken */}
                <div className="relative w-full sm:w-64">
                  <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Zoek product, categorie of merk..."
                    aria-label="Zoek producten"
                    className="w-full bg-white border border-[#E4EAF1] rounded-xl pl-9 pr-4 py-2 text-sm text-secondary placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {compareLimitWarning && (
              <p className="text-xs font-bold text-amber-600 mb-3">Maximaal 3 producten tegelijk vergelijken</p>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-2xl border border-[#E4EAF1] overflow-hidden">
                    <div className="aspect-[4/3] bg-gray-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-4 bg-gray-100 rounded w-1/3 mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E4EAF1]">
                <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <IconSearch className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 font-semibold text-sm">Geen producten gevonden</p>
                <p className="text-gray-400 text-xs mt-1">Pas je zoekopdracht of filters aan.</p>
                <button onClick={clearFilters} className="mt-4 inline-flex items-center gap-1.5 text-primary text-xs font-bold hover:underline">
                  Filters wissen <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Product grid */}
            {!loading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showInclVat={showInclVat}
                    inCompare={Boolean(compareList.find(p => p.id === product.id))}
                    onCompare={handleCompareToggle}
                    onQuickView={setQuickView}
                  />
                ))}
              </div>
            )}

            {/* Service/trust block */}
            <div className="mt-12 bg-secondary rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { Icon: IconTruck, title: 'Snelle levering', text: 'Gratis verzending boven €250,-' },
                { Icon: IconShield, title: 'Garantie', text: 'Op alle producten' },
                { Icon: IconChat, title: 'Expert advies', text: 'Bel 085-0021 606' },
              ].map(({ Icon: I, title, text }) => (
                <div key={title} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white shrink-0">
                    <I className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBIELE FILTER-DRAWER ── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl animate-[fadeSlideUp_0.25s_ease]">
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-[#E4EAF1] px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-secondary flex items-center gap-2">
                <IconSliders className="w-5 h-5 text-primary" />
                Filters
              </h2>
              <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500" aria-label="Sluiten">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-2 max-h-[60vh] overflow-y-auto">
              <FilterSidebar
                categories={categories}
                products={products}
                activeCategory={activeCategory}
                onCategory={(cat) => selectCategory(cat)}
                priceMin={priceMin}
                priceMax={priceMax}
                onPriceMin={setPriceMin}
                onPriceMax={setPriceMax}
                onlyInStock={onlyInStock}
                onOnlyInStock={setOnlyInStock}
                priceBounds={priceBounds}
              />
              {(hasActiveFilters || searchQuery) && (
                <button onClick={clearFilters} className="mt-2 text-xs font-bold text-primary hover:underline">Alle filters wissen</button>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#E4EAF1] px-5 py-4">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-primary text-white font-black py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                Toon {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'producten'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & bars */}
      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
      {showCompare && <CompareModal list={compareList} onClose={() => setShowCompare(false)} />}
      <CompareBar
        list={compareList}
        onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))}
        onClear={() => setCompareList([])}
        onCompare={() => setShowCompare(true)}
      />
    </div>
  );
};

export default ProductList;