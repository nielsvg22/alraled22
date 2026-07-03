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
  { icon: '🚚', title: 'Gratis verzending', sub: 'Boven €250,-' },
  { icon: '✅', title: 'CE & RoHS', sub: 'Gecertificeerd' },
  { icon: '↩️', title: '30 dagen retour', sub: 'Geen vragen' },
];

const TABS = ['Specificaties', 'Omschrijving', 'Downloads', 'Video'];

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
  const [showInclVat, setShowInclVat] = useState(true);
  const [activeTab, setActiveTab]       = useState('Specificaties');
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

  const specs = parseSpecs(product.specs);
  const images = getProductImages(product);

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-2 text-xs text-gray-400">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/producten" className="hover:text-secondary transition-colors">Webshop</Link>
          <span>/</span>
          <span className="text-secondary font-medium truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Main product section — two column */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">

          {/* Left column — Images */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-200">
              <img
                src={getMediaUrl(images[selectedImage] || product.imageUrl) || 'https://via.placeholder.com/800'}
                alt={product.name}
                className="w-full h-full object-contain p-8 md:p-12"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      index === selectedImage ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={getMediaUrl(url) || 'https://via.placeholder.com/150'} alt=""
                      className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column — Product info + price + CTA */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Category + Title */}
            <div>
              {product.category && (
                <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">{product.category}</span>
              )}
              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-secondary leading-tight mt-1">{product.name}</h1>
            </div>

            {/* Price block */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl lg:text-4xl font-black text-secondary">€{displayPrice.toFixed(2)}</span>
                <button
                  onClick={() => setShowInclVat(v => !v)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                    showInclVat ? 'bg-primary/10 text-primary border-primary/30' : 'text-gray-500 border-gray-300'
                  }`}
                >
                  {showInclVat ? 'incl. BTW' : 'excl. BTW'}
                </button>
              </div>

              {/* Quick specs — stacked */}
              {(() => {
                const s = parseSpecs(product.specs);
                return s.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                    {s.slice(0, 8).map((spec, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2">
                        <span className="text-[11px] text-gray-500 font-medium">{spec.label}</span>
                        <span className="text-xs font-bold text-secondary">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              <div className="text-xs text-gray-500 bg-white rounded-xl px-3 py-2 border border-gray-100 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Recyclingbijdrage: <strong className="text-secondary">€ 0,07</strong> (incl. BTW)</span>
              </div>

              {/* Qty + Add to cart */}
              <div ref={mainBtnRef} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aantal</span>
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-lg font-bold">−</button>
                    <span className="w-10 text-center text-sm font-bold text-secondary">{qty}</span>
                    <button onClick={() => setQty(q => q + 1)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-lg font-bold">+</button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleAdd()}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${added ? 'bg-green-500 text-white' : 'bg-secondary text-white hover:bg-primary'}`}>
                    {added ? '✓ Toegevoegd' : 'In winkelwagen'}
                  </button>
                  <button className="px-5 py-3.5 rounded-xl border-2 border-secondary text-secondary font-bold text-sm hover:bg-secondary hover:text-white transition-all">
                    Offerte
                  </button>
                </div>
                {qty > 1 && (
                  <p className="text-xs text-gray-500 text-center">
                    Subtotaal: <strong className="text-secondary">€{(displayPrice * qty).toFixed(2)}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3">
              {TRUST.map(({ icon, title, sub }) => (
                <div key={title} className="flex flex-col items-center gap-1 text-center bg-gray-50 rounded-xl py-3 px-2">
                  <span className="text-lg">{icon}</span>
                  <span className="text-[11px] font-bold text-secondary">{title}</span>
                  <span className="text-[10px] text-gray-400">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed bottom sections */}
      <div className="border-t border-gray-200 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Tab bar */}
          <div className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map(tab => {
              if ((tab === 'Downloads' && !product.pdfUrl) || (tab === 'Video' && !product.videoUrl)) return null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 md:px-6 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab
                      ? 'border-secondary text-secondary border-b-2'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="border-t border-gray-200 bg-white rounded-t-none rounded-b-2xl p-6 md:p-8 lg:p-10 min-h-[300px]">
            {activeTab === 'Specificaties' && (
              <div>
                <h2 className="text-lg font-black text-secondary mb-6">Specificaties</h2>
                {specs.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <tbody>
                        {specs.map((spec, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'}>
                            <td className="px-4 md:px-6 py-3 text-gray-500 font-medium w-1/2 md:w-2/5 border-b border-gray-100">{spec.label}</td>
                            <td className="px-4 md:px-6 py-3 text-secondary font-bold border-b border-gray-100">{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Geen specificaties beschikbaar.</p>
                )}
              </div>
            )}

            {activeTab === 'Omschrijving' && (
              <div>
                <h2 className="text-lg font-black text-secondary mb-4">Omschrijving</h2>
                {product.description ? (
                  <div className="text-sm text-gray-600 leading-relaxed max-w-3xl space-y-3">
                    {product.description.split('\n').filter(Boolean).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Geen omschrijving beschikbaar.</p>
                )}
              </div>
            )}

            {activeTab === 'Downloads' && product.pdfUrl && (
              <div>
                <h2 className="text-lg font-black text-secondary mb-4">Downloads</h2>
                <a
                  href={product.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">Productinformatieblad</p>
                    <p className="text-xs text-gray-400">PDF document</p>
                  </div>
                </a>
              </div>
            )}

            {activeTab === 'Video' && product.videoUrl && (
              <div>
                <h2 className="text-lg font-black text-secondary mb-4">Video</h2>
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 max-w-3xl">
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

      {/* Recommended accessories */}
      {explicit.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            <div className="mb-6">
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Aanbevolen accessoires</p>
              <h2 className="text-xl font-black text-secondary">Maak je set compleet</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {explicit.map(item => (
                <div key={item.id} className="group bg-white border border-gray-200 rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                    <img src={getImageSrc(item)} alt={item.name} className="w-full h-full object-contain p-3" />
                  </div>
                  <p className="text-sm font-bold text-secondary line-clamp-2 min-h-[2.5em]">{item.name}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-base font-black text-primary">€{Number(item.price || 0).toFixed(2)}</span>
                    <button
                      onClick={() => { addToCart(item); setAdded(true); setTimeout(() => setAdded(false), 2000); }}
                      className="p-2 rounded-lg bg-secondary text-white hover:bg-primary transition-colors"
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

      {/* Bundle */}
      {bundle && bundle.items && bundle.items.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-lg font-black text-secondary mb-4">{bundle.title || 'Voordeelpakket'}</h2>
              <div className="flex flex-wrap gap-3 mb-5">
                {bundle.items.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    {b.imageUrl && <img src={getImageSrc(b)} alt={b.name} className="w-8 h-8 rounded-lg object-cover" />}
                    <span className="text-xs font-bold text-secondary">{b.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 font-bold">Totaal set</span>
                <span className="text-2xl font-black text-secondary">€{Number(bundle.total || 0).toFixed(2)}</span>
              </div>
              <button
                onClick={() => {
                  bundle.items.forEach(it => addToCart({ id: it.id, name: it.name, price: it.price, imageUrl: it.imageUrl }));
                  setAdded(true); setTimeout(() => setAdded(false), 1500);
                }}
                className="w-full max-w-xs py-3 rounded-xl bg-secondary text-white font-bold text-sm hover:bg-primary transition-all"
              >
                Voeg set toe aan winkelwagen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Frequently bought together */}
      {fbt.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Vaak samen gekocht</p>
                <h2 className="text-xl font-black text-secondary">Combineer met</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {fbt.map(p => (
                <div key={p.id} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-white border border-gray-200 mb-3">
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

      {/* Related products */}
      {related.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Alternatieven</p>
                <h2 className="text-xl font-black text-secondary">Vergelijkbare producten</h2>
              </div>
              <Link to="/producten" className="text-xs font-bold text-secondary hover:text-primary transition-colors hidden md:flex items-center gap-1">
                Alle producten →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-white border border-gray-200 mb-3">
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

      {/* Sticky bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <img src={getImageSrc(product)} alt={product.name} className="w-10 h-10 object-contain rounded-lg bg-gray-50 border border-gray-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-secondary text-sm truncate">{product.name}</p>
            <p className="text-primary font-black text-sm">
              €{displayPrice.toFixed(2)}
              <span className="text-gray-400 font-normal text-xs ml-1">{showInclVat ? 'incl. btw' : 'excl. btw'}</span>
            </p>
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
