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

const TRUST = [
  { icon: "🚚", title: "Gratis verzending", sub: "Boven €250,-" },
  { icon: "✅", title: "CE & RoHS", sub: "Gecertificeerd" },
  { icon: "↩️", title: "30 dagen retour", sub: "Geen vragen" },
];

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
  const [showInclVat, setShowInclVat] = useState(false);
  const mainBtnRef = useRef(null);
  const { addToCart } = useCart();

  const displayPrice = showInclVat
    ? Number(product?.price || 0) * (1 + VAT_RATE)
    : Number(product?.price || 0);

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

          {/* Image gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              {(() => {
                const images = getProductImages(product);
                const src = images[selectedImage] || product.imageUrl;
                return (
                  <img src={getMediaUrl(src) || 'https://via.placeholder.com/800'} alt={product.name}
                    className="w-full h-full object-contain p-8" />
                );
              })()}
            </div>
            {(() => {
              const images = getProductImages(product);
              return images.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        index === selectedImage ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <img src={getMediaUrl(url) || 'https://via.placeholder.com/150'} alt=""
                        className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              {product.category && <span className="text-xs font-bold text-primary uppercase tracking-widest">{product.category}</span>}
              <h1 className="text-2xl md:text-3xl font-black text-secondary leading-tight">{product.name}</h1>
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-3xl font-black text-secondary">€{displayPrice.toFixed(2)}</span>
                <button
                  onClick={() => setShowInclVat(v => !v)}
                  className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-all ${
                    showInclVat ? 'bg-primary/10 text-primary border-primary/30' : 'text-gray-400 border-gray-200'
                  }`}
                >
                  {showInclVat ? 'incl. BTW' : 'excl. BTW'}
                </button>
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-5">{product.description}</p>
            )}

            {/* Specs */}
            {(() => {
              const specs = parseSpecs(product.specs);
              return specs.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">Specificaties</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {specs.map((spec, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{spec.label}</span>
                        <span className="text-sm font-bold text-secondary mt-0.5">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* PDF download */}
            {product.pdfUrl && (
              <a href={product.pdfUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors border-t border-gray-100 pt-5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Productinformatie (PDF)
              </a>
            )}

            {/* Video embed */}
            {product.videoUrl && (
              <div className="border-t border-gray-100 pt-5">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
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
                          <img src={getImageSrc(item)} alt={item.name} className="w-full h-full object-contain" />
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
                      {b.imageUrl && <img src={getImageSrc(b)} alt={b.name} className="w-8 h-8 rounded-lg object-cover" />}
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
                    <img src={getImageSrc(p)} alt={p.name}
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
                    <img src={getImageSrc(p)} alt={p.name}
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
          <img src={getImageSrc(product)} alt={product.name} className="w-10 h-10 object-contain rounded-lg bg-gray-50 border border-gray-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-secondary text-sm truncate">{product.name}</p>
            <p className="text-primary font-black text-sm">€{displayPrice.toFixed(2)} <span className="text-gray-400 font-normal text-xs">{showInclVat ? 'incl. btw' : 'excl. btw'}</span></p>
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
