import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../lib/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SPECS = [
  { label: "Lichtopbrengst", value: "12.000 Lumen" },
  { label: "IP-Rating", value: "IP67 Waterdicht" },
  { label: "Levensduur", value: "50.000 uur" },
  { label: "Garantie", value: "5 Jaar Full-Service" },
];

const TRUST = [
  { icon: "🚚", title: "Gratis verzending", sub: "Boven €250,-" },
  { icon: "✅", title: "CE & RoHS", sub: "Gecertificeerd" },
  { icon: "↩️", title: "30 dagen retour", sub: "Geen vragen" },
];

const getImageSrc = (url) => {
  if (!url) return 'https://via.placeholder.com/800';
  return url.startsWith('/uploads') ? `${API_URL}${url}` : url;
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct]           = useState(null);
  const [related, setRelated]           = useState([]);
  const [fbt, setFbt]                   = useState([]);
  const [explicit, setExplicit]         = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [bundle, setBundle]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [qty, setQty]                   = useState(1);
  const [added, setAdded]               = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const mainBtnRef = useRef(null);
  const { addToCart } = useCart();

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
        axios.get(`${API_URL}/api/products/${res.data.id}/relations`)
          .then(r => {
            setFbt(r.data?.fbt || []);
            setExplicit(r.data?.explicit?.map(e => e.relatedProduct) || []);
            setAlternatives(r.data?.alternatives || []);
            setBundle(r.data?.bundle || null);
            setRelated((r.data?.alternatives || []).slice(0, 4));
          })
          .catch(() => {});
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Sticky bar visibility — show when main button scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (mainBtnRef.current) observer.observe(mainBtnRef.current);
    return () => observer.disconnect();
  }, [product]);

  const handleAdd = (q = qty) => {
    for (let i = 0; i < q; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-300 font-bold">Laden...</div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400 font-medium">Product niet gevonden</p>
      <Link to="/producten" className="text-primary font-bold text-sm hover:underline">← Terug naar de shop</Link>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-3 flex items-center gap-2 text-xs text-gray-400">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/producten" className="hover:text-secondary transition-colors">Webshop</Link>
          <span>/</span>
          <span className="text-secondary font-medium truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Main product section */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Image */}
          <div className="relative">
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <img src={getImageSrc(product.imageUrl)} alt={product.name}
                className="w-full h-full object-contain p-8" />
            </div>
            <div className="absolute top-4 left-4 bg-secondary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Professional Grade
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              {product.category && <span className="text-xs font-bold text-primary uppercase tracking-widest">{product.category}</span>}
              <h1 className="text-2xl md:text-3xl font-black text-secondary leading-tight">{product.name}</h1>
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-3xl font-black text-secondary">€{product.price}</span>
                <span className="text-xs text-gray-400 font-medium">excl. btw</span>
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-5">{product.description}</p>
            )}

            {/* Specs */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <p className="text-xs font-bold text-secondary uppercase tracking-widest">Specificaties</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {SPECS.map(spec => (
                  <div key={spec.label} className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{spec.label}</span>
                    <span className="text-sm font-bold text-secondary mt-0.5">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Qty + Add to cart */}
            <div className="space-y-3 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aantal</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg">−</button>
                  <span className="w-10 text-center text-sm font-bold text-secondary">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg">+</button>
                </div>
              </div>
              <div className="flex gap-3" ref={mainBtnRef}>
                <button onClick={() => handleAdd()}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${added ? 'bg-green-500 text-white' : 'bg-secondary text-white hover:bg-primary'}`}>
                  {added ? '✓ Toegevoegd' : 'In winkelwagen'}
                </button>
                <button className="px-5 py-3 rounded-xl border-2 border-secondary text-secondary font-bold text-sm hover:bg-secondary hover:text-white transition-all">
                  Offerte
                </button>
              </div>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
              {TRUST.map(({ icon, title, sub }) => (
                <div key={title} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-xl">{icon}</span>
                  <span className="text-[11px] font-bold text-secondary">{title}</span>
                  <span className="text-[10px] text-gray-400">{sub}</span>
                </div>
              ))}
            </div>

            {explicit.length > 0 && (
              <div className="bg-primary/5 rounded-xl p-5 space-y-4 border border-primary/10">
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Aanbevolen accessoires</p>
                  <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Maak je set compleet</h3>
                </div>
                <div className="space-y-3">
                  {explicit.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-gray-100 group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                          <img src={getImageSrc(item.imageUrl)} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-secondary line-clamp-1">{item.name}</p>
                          <p className="text-[10px] font-black text-primary">€{item.price}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { addToCart(item); setAdded(true); setTimeout(() => setAdded(false), 2000); }}
                        className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bundle && bundle.items && bundle.items.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5 space-y-3 border border-gray-100">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">{bundle.title}</p>
                <div className="flex flex-wrap gap-3">
                  {bundle.items.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2">
                      {b.imageUrl && <img src={getImageSrc(b.imageUrl)} alt={b.name} className="w-8 h-8 rounded-lg object-cover" />}
                      <span className="text-xs font-bold text-secondary">{b.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-bold">Totaal set</span>
                  <span className="text-xl font-black text-secondary">€{Number(bundle.total || 0).toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    bundle.items.forEach(it => addToCart({ id: it.id, name: it.name, price: it.price, imageUrl: it.imageUrl }));
                    setAdded(true); setTimeout(() => setAdded(false), 1500);
                  }}
                  className="w-full py-3 rounded-xl bg-secondary text-white font-bold text-sm hover:bg-primary transition-all"
                >
                  Voeg set toe aan winkelwagen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {fbt.length > 0 && (
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Vaak samen gekocht</p>
                <h2 className="text-2xl font-black text-secondary">Combineer met</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {fbt.map(p => (
                <div key={p.id} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-white border border-gray-100 mb-3">
                    <img src={getImageSrc(p.imageUrl)} alt={p.name}
                      className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-secondary font-black truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 font-bold mt-0.5">€{p.price}</p>
                    </div>
                    <button
                      onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl })}
                      className="px-3 py-2 rounded-full bg-secondary text-white text-xs font-bold hover:bg-primary"
                    >
                      + Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Anderen bekeken ook */}
      {related.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Alternatieven</p>
                <h2 className="text-2xl font-black text-secondary">Vergelijkbare producten</h2>
              </div>
              <Link to="/producten" className="text-xs font-bold text-secondary hover:text-primary transition-colors hidden md:flex items-center gap-1">
                Alle producten →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-white border border-gray-100 mb-3">
                    <img src={getImageSrc(p.imageUrl)} alt={p.name}
                      className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/40 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-primary px-3 py-1.5 rounded-full">
                        Bekijk →
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-secondary group-hover:text-primary transition-colors truncate">{p.name}</h3>
                  <p className="text-sm font-black text-secondary mt-0.5">€{p.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky "Bestel nu" balk */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-3 flex items-center gap-4">
          <img src={getImageSrc(product.imageUrl)} alt={product.name} className="w-10 h-10 object-contain rounded-lg bg-gray-50 border border-gray-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-secondary text-sm truncate">{product.name}</p>
            <p className="text-primary font-black text-sm">€{product.price} <span className="text-gray-400 font-normal text-xs">excl. btw</span></p>
          </div>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base">−</button>
            <span className="w-7 text-center text-sm font-bold">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base">+</button>
          </div>
          <button onClick={() => handleAdd()}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shrink-0 ${added ? 'bg-green-500 text-white' : 'bg-secondary text-white hover:bg-primary'}`}>
            {added ? '✓ Toegevoegd' : 'In winkelwagen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
