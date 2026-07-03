import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../lib/CartContext';
import { getMediaUrl, API_URL } from '../lib/api';
import analytics from '../lib/analytics';
import { getProductImages, getImageSrc } from '../lib/productHelpers';

const VAT_RATE = 0.21;

const parseSpecs = (specsStr) => {
  if (!specsStr) return [];
  try {
    const parsed = JSON.parse(specsStr);
    return Array.isArray(parsed) ? parsed.filter(s => s.label && s.value) : [];
  } catch {
    return specsStr.split('\n').filter(Boolean).map(line => {
      const [key, ...vals] = line.split(':');
      return { label: key.trim(), value: vals.join(':').trim() };
    }).filter(s => s.label && s.value);
  }
};

const TABS = ['Specificaties', 'Omschrijving', 'Downloads', 'Video'];

const REVIEWS = [
  { name: 'Mark de Vries', rating: 5, text: 'Uitstekende kwaliteit! Snel geleverd en goed verpakt.', date: '2 weken geleden' },
  { name: 'Anita Jansen', rating: 5, text: 'Perfect voor onze verbouwing. Professioneel product.', date: '1 maand geleden' },
  { name: 'Peter van den Berg', rating: 4, text: 'Goede prijs-kwaliteitverhouding. Doet wat het moet doen.', date: '3 weken geleden' },
];

const TRUST_BADGES = [
  { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Voor 20:00 besteld', sub: 'Morgen in huis' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: '30 dagen garantie', sub: 'Niet goed? Geld terug' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'CE & RoHS', sub: 'Gecertificeerd' },
  { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Gratis verzending', sub: 'Boven €250,-' },
];

const PAYMENT_METHODS = ['ideal', 'visa', 'mastercard', 'bancontact', 'paypal'];

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct]           = useState(null);
  const [related, setRelated]           = useState([]);
  const [fbt, setFbt]                   = useState([]);
  const [explicit, setExplicit]         = useState([]);
  const [bundle, setBundle]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [qty, setQty]                   = useState(1);
  const [added, setAdded]               = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showInclVat, setShowInclVat]   = useState(true);
  const [activeTab, setActiveTab]       = useState('Specificaties');
  const [zoomed, setZoomed]             = useState(false);
  const [visible, setVisible]           = useState(false);
  const mainBtnRef = useRef(null);
  const { addToCart } = useCart();

  const displayPrice = showInclVat
    ? Number(product?.price || 0) * (1 + VAT_RATE)
    : Number(product?.price || 0);

  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        analytics.trackProductView(res.data.id, res.data.name);
        setLoading(false);
        axios.get(`${API_URL}/api/products/${res.data.id}/relations`)
          .then(r => {
            setFbt(r.data?.fbt || []);
            setExplicit(r.data?.explicit?.map(e => e.relatedProduct) || []);
            setBundle(r.data?.bundle || null);
            setRelated((r.data?.alternatives || []).slice(0, 4));
          })
          .catch(() => {});
      })
      .catch(() => setLoading(false));
  }, [id]);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 font-medium tracking-wide">Product laden...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-gray-50 to-white">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-gray-400 font-medium">Dit product bestaat niet meer</p>
      <Link to="/producten" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-white text-sm font-bold hover:bg-primary transition-all shadow-lg shadow-secondary/20">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        Terug naar shop
      </Link>
    </div>
  );

  const specs = parseSpecs(product.specs);
  const images = getProductImages(product);
  const avgRating = 4.8;

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-2 text-[11px] text-gray-400">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          <Link to="/producten" className="hover:text-secondary transition-colors">Webshop</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          <span className="text-secondary font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* ─── HERO SECTION ─── */}
      <div className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">

            {/* LEFT: Image Gallery */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main image */}
              <div
                className={`relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl overflow-hidden border border-gray-200/60 group cursor-crosshair ${zoomed ? 'scale-105' : ''} transition-transform duration-500`}
                onMouseEnter={() => setZoomed(true)}
                onMouseLeave={() => setZoomed(false)}
              >
                <img
                  src={getMediaUrl(images[selectedImage] || product.imageUrl) || 'https://via.placeholder.com/800'}
                  alt={product.name}
                  className={`w-full h-full object-contain p-10 md:p-16 transition-all duration-700 ${zoomed ? 'scale-125' : ''}`}
                />
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] font-bold text-gray-500 shadow-sm border border-gray-100">
                    {selectedImage + 1} / {images.length}
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {images.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                        index === selectedImage
                          ? 'border-secondary shadow-lg shadow-secondary/15'
                          : 'border-gray-200 hover:border-gray-400 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={getMediaUrl(url) || 'https://via.placeholder.com/150'} alt=""
                        className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Info */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Category + Title + Rating */}
              <div className="space-y-3">
                {product.category && (
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.15em]">
                      {product.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-[11px] font-bold text-gray-400 ml-1">{avgRating}</span>
                    </div>
                  </div>
                )}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-secondary leading-[1.1] tracking-tight">{product.name}</h1>
              </div>

              {/* Price Block */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 md:p-7 border border-gray-200/80 shadow-sm space-y-5">
                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl md:text-5xl font-black text-secondary tracking-tighter">€{displayPrice.toFixed(2)}</span>
                    <button
                      onClick={() => setShowInclVat(v => !v)}
                      className="group relative text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-200"
                      style={{
                        backgroundColor: showInclVat ? '#f0fdf4' : '#fafafa',
                        borderColor: showInclVat ? '#86efac' : '#e5e7eb',
                        color: showInclVat ? '#16a34a' : '#9ca3af',
                      }}
                    >
                      {showInclVat ? 'incl. BTW' : 'excl. BTW'}
                    </button>
                  </div>
                </div>

                {/* Specs Stacked */}
                {specs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                    {specs.slice(0, 6).map((spec, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[12px] text-gray-500">{spec.label}</span>
                        <span className="text-[13px] font-bold text-secondary">{spec.value}</span>
                      </div>
                    ))}
                    {specs.length > 6 && (
                      <button onClick={() => setActiveTab('Specificaties')} className="w-full px-4 py-2.5 text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors">
                        + {specs.length - 6} specificaties bekijken
                      </button>
                    )}
                  </div>
                )}

                {/* Recycling */}
                <div className="flex items-center gap-2.5 text-xs text-gray-500 bg-gray-50/80 rounded-xl px-4 py-2.5 border border-gray-100">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Recyclingbijdrage: <strong className="text-secondary">€ 0,07</strong> (incl. BTW)</span>
                </div>

                {/* Qty + Add to cart */}
                <div ref={mainBtnRef} className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aantal</span>
                    <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-secondary transition-all text-lg font-bold">−</button>
                      <span className="w-11 text-center text-sm font-bold text-secondary border-x border-gray-100 h-11 flex items-center justify-center">{qty}</span>
                      <button onClick={() => setQty(q => q + 1)} className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-secondary transition-all text-lg font-bold">+</button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleAdd()}
                      className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg ${added
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30 scale-[0.98]'
                        : 'bg-gradient-to-r from-secondary to-primary text-white shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 hover:-translate-y-0.5 active:scale-[0.98]'
                      }`}>
                      {added ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                          Toegevoegd!
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                          In winkelwagen
                        </span>
                      )}
                    </button>
                    <button className="px-5 py-4 rounded-2xl border-2 border-secondary/20 text-secondary font-bold text-sm hover:bg-secondary hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </button>
                  </div>
                  {qty > 1 && (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">
                        Subtotaal: <strong className="text-lg font-black text-secondary">€{(displayPrice * qty).toFixed(2)}</strong>
                        <span className="text-gray-400 text-xs ml-1">({qty} stuks)</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {TRUST_BADGES.map((badge, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-gray-50/80 rounded-2xl px-3.5 py-3 border border-gray-100/80">
                    <div className="w-7 h-7 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={badge.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-secondary leading-tight">{badge.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{badge.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment methods */}
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Betaal met</span>
                <div className="flex items-center gap-2">
                  {['ideal', 'visa', 'mc', 'bancontact', 'pp'].map(m => (
                    <div key={m} className="w-9 h-6 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-tight">{m}</span>
                    </div>
                  ))}
                  <span className="text-[10px] text-gray-300 ml-1">+ meer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TABS SECTION ─── */}
      <div className="border-t border-gray-200/80 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-none">
            {TABS.map(tab => {
              if ((tab === 'Downloads' && !product.pdfUrl) || (tab === 'Video' && !product.videoUrl)) return null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-5 md:px-8 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab
                      ? 'text-secondary'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-secondary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-200 bg-white rounded-t-none rounded-b-3xl p-6 md:p-8 lg:p-10 min-h-[300px] shadow-sm">
            {/* Specificaties tab */}
            {activeTab === 'Specificaties' && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-secondary">Specificaties</h2>
                    <p className="text-xs text-gray-400 font-medium">{specs.length} eigenschappen</p>
                  </div>
                </div>
                {specs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {specs.map((spec, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3.5 bg-gray-50/80 rounded-2xl border border-gray-100/80 hover:border-gray-200 transition-colors">
                        <span className="text-sm text-gray-500">{spec.label}</span>
                        <span className="text-sm font-bold text-secondary text-right ml-4">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    </div>
                    <p className="text-sm text-gray-400">Geen specificaties beschikbaar</p>
                  </div>
                )}
              </div>
            )}

            {/* Omschrijving tab */}
            {activeTab === 'Omschrijving' && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                  </div>
                  <h2 className="text-lg font-black text-secondary">Omschrijving</h2>
                </div>
                {product.description ? (
                  <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-4">
                    {product.description.split('\n').filter(Boolean).map((p, i) => (
                      <p key={i} className="text-[15px] leading-[1.8]">{p}</p>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-400">Geen omschrijving beschikbaar</p>
                  </div>
                )}
              </div>
            )}

            {/* Downloads tab */}
            {activeTab === 'Downloads' && product.pdfUrl && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <h2 className="text-lg font-black text-secondary">Downloads</h2>
                </div>
                <a
                  href={product.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-4 px-6 py-4 rounded-2xl border border-gray-200 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">Productinformatieblad</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF — {product.pdfUrl.endsWith('.pdf') ? 'Direct openen' : 'Downloaden'}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              </div>
            )}

            {/* Video tab */}
            {activeTab === 'Video' && product.videoUrl && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <h2 className="text-lg font-black text-secondary">Video</h2>
                </div>
                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 max-w-3xl shadow-lg">
                  <iframe
                    src={product.videoUrl.includes('youtube.com/watch?v=')
                      ? product.videoUrl.replace('watch?v=', 'embed/')
                      : product.videoUrl.includes('youtu.be/')
                        ? product.videoUrl.replace('youtu.be/', 'youtube.com/embed/')
                        : product.videoUrl
                    }
                    title="Product video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── REVIEWS ─── */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Klantbeoordelingen</p>
              <h2 className="text-2xl font-black text-secondary">Wat anderen zeggen</h2>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 rounded-2xl px-4 py-2.5 border border-amber-100">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-black text-amber-700">{avgRating}</span>
              <span className="text-xs text-amber-500 font-medium">({REVIEWS.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-gray-50/80 rounded-3xl p-5 border border-gray-100 hover:border-gray-200 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-black text-secondary">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-secondary">{r.name}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, j) => (
                        <svg key={j} className={`w-3 h-3 ${j < r.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">"{r.text}"</p>
                <p className="text-[10px] text-gray-400 mt-3 font-medium">{r.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ACCESSORIES ─── */}
      {explicit.length > 0 && (
        <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
            <div className="text-center mb-10">
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Aanbevolen</p>
              <h2 className="text-2xl md:text-3xl font-black text-secondary">Maak je set compleet</h2>
              <p className="text-sm text-gray-400 mt-2">Deze producten worden vaak samen gekocht</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {explicit.map(item => (
                <div key={item.id} className="group bg-white rounded-3xl border border-gray-200 p-5 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden mb-4">
                    <img src={getImageSrc(item)} alt={item.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="text-sm font-bold text-secondary line-clamp-2 min-h-[2.5em] leading-snug">{item.name}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-lg font-black text-primary">€{Number(item.price || 0).toFixed(2)}</span>
                    <button
                      onClick={() => { addToCart(item); setAdded(true); setTimeout(() => setAdded(false), 2000); }}
                      className="p-2.5 rounded-xl bg-secondary text-white hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-md shadow-secondary/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── BUNDLE ─── */}
      {bundle && bundle.items && bundle.items.length > 0 && (
        <div className="border-t border-gray-100 bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
            <div className="text-center mb-8">
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Voordeelpakket</p>
              <h2 className="text-2xl md:text-3xl font-black text-secondary">{bundle.title || 'Complete set'}</h2>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 max-w-2xl mx-auto shadow-lg shadow-gray-200/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {bundle.items.map((b, i) => (
                  <div key={b.id} className="text-center">
                    <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-2 border border-gray-100">
                      {b.imageUrl ? (
                        <img src={getImageSrc(b)} alt={b.name} className="w-full h-full object-contain p-3" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg font-black">{i + 1}</div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-secondary line-clamp-2 leading-tight">{b.name}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-6 px-2">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Totaal set</p>
                  <p className="text-xs text-gray-400">{bundle.items.length} producten</p>
                </div>
                <span className="text-3xl font-black text-secondary">€{Number(bundle.total || 0).toFixed(2)}</span>
              </div>
              <button
                onClick={() => {
                  bundle.items.forEach(it => addToCart({ id: it.id, name: it.name, price: it.price, imageUrl: it.imageUrl }));
                  setAdded(true); setTimeout(() => setAdded(false), 1500);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-secondary to-primary text-white font-bold text-sm hover:shadow-xl hover:shadow-secondary/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                Complete set bestellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FBT ─── */}
      {fbt.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
            <div className="text-center mb-10">
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Vaak samen gekocht</p>
              <h2 className="text-2xl md:text-3xl font-black text-secondary">Combineer met</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {fbt.map(p => (
                <div key={p.id} className="group bg-white rounded-3xl border border-gray-200 p-5 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden mb-4">
                    <img src={getImageSrc(p)} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="text-sm font-bold text-secondary line-clamp-2 min-h-[2.5em] leading-snug">{p.name}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-base font-black text-secondary">€{Number(p.price || 0).toFixed(2)}</span>
                    <button
                      onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl })}
                      className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-md shadow-secondary/20"
                    >
                      + Toevoegen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── RELATED ─── */}
      {related.length > 0 && (
        <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
            <div className="text-center mb-10">
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Alternatieven</p>
              <h2 className="text-2xl md:text-3xl font-black text-secondary">Vergelijkbare producten</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 mb-4">
                    <img src={getImageSrc(p)} alt={p.name}
                      className="w-full h-full object-contain p-6 transition-all duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                      <span className="text-white text-sm font-bold bg-primary px-5 py-2.5 rounded-full shadow-lg shadow-primary/30">
                        Bekijk →
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-secondary group-hover:text-primary transition-colors line-clamp-2 leading-snug">{p.name}</h3>
                  <p className="text-lg font-black text-secondary mt-1">€{Number(p.price || 0).toFixed(2)}</p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/producten" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-sm font-bold text-secondary hover:bg-secondary hover:text-white hover:border-secondary transition-all duration-200">
                Alle producten bekijken
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── STICKY BAR ─── */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl transition-all duration-300 ${stickyVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <img src={getImageSrc(product)} alt={product.name} className="w-10 h-10 object-contain rounded-xl bg-gray-50 border border-gray-100 shrink-0 shadow-sm" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-secondary text-sm truncate">{product.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-primary font-black text-sm">€{displayPrice.toFixed(2)}</span>
              <span className="text-[10px] text-gray-400 font-medium">{showInclVat ? 'incl. btw' : 'excl. btw'}</span>
            </div>
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden shrink-0 shadow-sm">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base font-bold transition-colors">−</button>
            <span className="w-8 text-center text-sm font-bold text-secondary border-x border-gray-100 h-9 flex items-center justify-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base font-bold transition-colors">+</button>
          </div>
          <button onClick={() => handleAdd()}
            className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 shrink-0 shadow-lg ${added ? 'bg-emerald-500 text-white' : 'bg-secondary text-white hover:bg-primary hover:shadow-xl hover:-translate-y-0.5 active:scale-95'}`}>
            {added ? '✓ Toegevoegd' : 'In winkelwagen'}
          </button>
        </div>
      </div>

      {/* Page-level animation keyframes */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out both; }
        .scrollbar-thin::-webkit-scrollbar { height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 999px; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ProductDetail;
