import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../lib/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CATEGORIES = ['Alle', 'Bedrijfswagens', 'Bouwverlichting', 'Werkplaats', 'Accessoires'];

const getImageSrc = (url) => {
  if (!url) return 'https://via.placeholder.com/400';
  return url.startsWith('/uploads') ? `${API_URL}${url}` : url;
};

/* ── QUICK-VIEW MODAL ─────────────────────────── */
function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

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
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors text-gray-500 text-sm">✕</button>
        <div className="grid grid-cols-2">
          {/* Image */}
          <div className="bg-gray-50 aspect-square flex items-center justify-center p-8">
            <img src={getImageSrc(product.imageUrl)} alt={product.name} className="w-full h-full object-contain" />
          </div>
          {/* Info */}
          <div className="p-7 flex flex-col gap-4">
            {product.category && <span className="text-xs font-bold text-primary uppercase tracking-widest">{product.category}</span>}
            <h2 className="text-xl font-black text-secondary leading-tight">{product.name}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-secondary">€{product.price}</span>
              <span className="text-xs text-gray-400">excl. btw</span>
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
            <Link to={`/product/${product.id}`} onClick={onClose} className="text-center text-xs font-bold text-gray-400 hover:text-primary transition-colors">
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
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <span className="text-xs font-bold uppercase tracking-widest text-white/60 shrink-0">Vergelijken</span>
        <div className="flex items-center gap-3 flex-1 overflow-x-auto">
          {list.map(p => (
            <div key={p.id} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 shrink-0">
              <img src={getImageSrc(p.imageUrl)} alt={p.name} className="w-7 h-7 rounded-lg object-cover bg-white" />
              <span className="text-xs font-semibold max-w-[120px] truncate">{p.name}</span>
              <button onClick={() => onRemove(p.id)} className="text-white/40 hover:text-white ml-1 text-xs">✕</button>
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
  );
}

/* ── COMPARE MODAL ────────────────────────────── */
function CompareModal({ list, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const ROWS = [
    { label: 'Prijs', key: (p) => `€${p.price}` },
    { label: 'Categorie', key: (p) => p.category || '—' },
    { label: 'Beschrijving', key: (p) => p.description ? p.description.slice(0, 80) + (p.description.length > 80 ? '…' : '') : '—' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-auto max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <h2 className="font-black text-secondary text-lg">Productvergelijking</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500 transition-colors">✕</button>
        </div>
        <div className="p-8">
          {/* Product images + names */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${list.length}, 1fr)` }}>
            <div />
            {list.map(p => (
              <div key={p.id} className="text-center space-y-2">
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                  <img src={getImageSrc(p.imageUrl)} alt={p.name} className="w-full h-full object-contain p-4" />
                </div>
                <h3 className="text-sm font-black text-secondary">{p.name}</h3>
              </div>
            ))}
            {/* Rows */}
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
            {/* CTA row */}
            <div />
            {list.map(p => (
              <div key={p.id} className="text-center">
                <Link to={`/product/${p.id}`} onClick={onClose}
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

/* ── MAIN COMPONENT ───────────────────────────── */
const ProductList = () => {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [quickView, setQuickView]     = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/products`)
      .then(res => { setProducts(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'Alle' || (p.category || '').toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const toggleCompare = useCallback((product) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev.filter(p => p.id !== product.id);
      if (prev.length >= 3) return prev;
      return [...prev, product];
    });
  }, []);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Page header */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Onze collectie</p>
          <h1 className="text-3xl md:text-4xl font-black text-secondary">Webshop</h1>
          <p className="text-gray-400 text-sm mt-1.5">Premium LED-verlichting voor professionals</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-gray-100 mb-8">
          <div className="flex flex-wrap gap-2 flex-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Zoek product..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-gray-400">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'producten'}</p>
          {compareList.length > 0 && (
            <span className="text-xs font-bold text-primary">{compareList.length}/3 geselecteerd voor vergelijking</span>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-xl mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium text-sm">Geen producten gevonden</p>
            <button onClick={() => { setSearchQuery(''); setActiveCategory('Alle'); }} className="mt-3 text-primary text-xs font-bold hover:underline">Filters wissen</button>
          </div>
        )}

        {/* Product grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map(product => {
              const inCompare = compareList.find(p => p.id === product.id);
              return (
                <div key={product.id} className="group relative">
                  {/* Compare checkbox */}
                  <button
                    onClick={() => toggleCompare(product)}
                    title={inCompare ? 'Verwijder uit vergelijking' : 'Voeg toe aan vergelijking'}
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all text-xs font-black ${
                      inCompare ? 'bg-primary border-primary text-white' : 'bg-white/90 border-gray-300 text-transparent hover:border-primary'
                    }`}>
                    ✓
                  </button>

                  {/* Quick-view eye button */}
                  <button
                    onClick={() => setQuickView(product)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white text-gray-500 text-sm"
                    title="Snel bekijken">
                    👁
                  </button>

                  <Link to={`/product/${product.id}`} className="block">
                    <div className={`relative overflow-hidden rounded-xl bg-gray-50 aspect-square mb-3 border-2 transition-all duration-200 ${inCompare ? 'border-primary' : 'border-gray-100'}`}>
                      <img src={getImageSrc(product.imageUrl)} alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/60 transition-all duration-300 flex items-end p-4">
                        <span className="text-white text-xs font-bold bg-primary px-3 py-1.5 rounded-full translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          Bekijk details →
                        </span>
                      </div>
                      {product.category && (
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {product.category}
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-secondary group-hover:text-primary transition-colors leading-snug truncate">{product.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-black text-secondary">€{product.price}</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">excl. btw</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Service block */}
        <div className="mt-16 bg-secondary rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🚚', title: 'Snelle levering', text: 'Gratis verzending boven €250,-' },
            { icon: '🛡️', title: '5 jaar garantie', text: 'Op alle producten' },
            { icon: '💬', title: 'Expert advies', text: 'Bel 085-0021 606' },
          ].map(({ icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shrink-0">{icon}</div>
              <div>
                <p className="text-white font-bold text-sm">{title}</p>
                <p className="text-white/40 text-xs mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

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
