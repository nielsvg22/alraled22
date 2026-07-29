import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../lib/CartContext';
import { getMediaUrl, API_URL } from '../lib/api';
import analytics from '../lib/analytics';
import { getProductImages, getImageSrc, formatPrice } from '../lib/productHelpers';
import { VAT_RATE } from '../lib/config';
import QuoteModal from '../components/QuoteModal';

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

const TABS = ['Productinformatie', 'Specificaties', 'Beoordelingen', 'Alternatieven', 'Vaak samen gekocht'];

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
  const [activeTab, setActiveTab]       = useState('Productinformatie');
  const [quoteOpen, setQuoteOpen]       = useState(false);
  const mainBtnRef = useRef(null);
  const { addToCart } = useCart();

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

  const scrollToSpecs = () => {
    setActiveTab('Specificaties');
    setTimeout(() => {
      const el = document.getElementById('specificaties');
      if (el) {
        const headerOffset = 60;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-[3px] border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Product laden...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <p className="text-gray-400 font-medium">Product niet gevonden</p>
      <Link to="/producten" className="text-sm font-bold text-gray-600 underline hover:text-gray-900">Terug naar shop</Link>
    </div>
  );

  const specs = parseSpecs(product.specs);
  const images = getProductImages(product);
  const stock = product.stock ?? 0;

  const getStockAvailability = () => {
    if (stock > 0) return 'https://schema.org/InStock';
    return 'https://schema.org/OutOfStock';
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: getMediaUrl(images[0] || product.imageUrl) || '',
    brand: {
      '@type': 'Brand',
      name: 'ALRA LED',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'EUR',
      availability: getStockAvailability(),
      url: window.location.href,
    },
  };

  return (
    <div className="bg-white min-h-screen pb-20">

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      {/* ─── BREADCRUMB ─── */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex items-center gap-1.5 text-[11px] text-gray-400">
          <Link to="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <Link to="/producten" className="hover:text-gray-700 transition-colors">Webshop</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* ─── MAIN PRODUCT ─── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* LEFT: Image */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group">
              <img
                src={getMediaUrl(images[selectedImage] || product.imageUrl) || 'https://via.placeholder.com/800'}
                alt={product.name}
                className="w-full h-full object-contain p-8 md:p-12 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              {images.length > 1 && (
                <div className="absolute top-3 right-3 bg-white/90 rounded-lg px-2.5 py-1 text-[11px] font-bold text-gray-500 shadow-sm border border-gray-100">
                  {selectedImage + 1}/{images.length}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url, index) => (
                  <button key={`${url}-${index}`} onClick={() => setSelectedImage(index)}
                    className={`w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      index === selectedImage ? 'border-gray-800' : 'border-gray-200 hover:border-gray-400'
                    }`}>
                    <img src={getMediaUrl(url) || ''} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info */}
          <div className="lg:col-span-6 flex flex-col gap-5">

            {/* Title + Rating */}
            <div>
              {product.category && (
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{product.category}</span>
              )}
              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-secondary leading-tight mt-0.5">{product.name}</h1>
            </div>

            {/* Price Block */}
            <div className="bg-gray-50 rounded-2xl p-5 md:p-6 space-y-4">
              {/* Price row */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-black text-secondary">{formatPrice(product?.price)}</span>
                  <span className="text-sm font-semibold text-gray-500">excl. BTW</span>
                </div>
                <p className="text-sm text-gray-500">{formatPrice((Number(product?.price || 0) * (1 + VAT_RATE)))} incl. BTW</p>
              </div>

              {/* Stock */}
              {stock > 10 && (
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Op voorraad
                </div>
              )}
              {stock > 0 && stock <= 10 && (
                <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Bijna op &ndash; {stock} op voorraad
                </div>
              )}
              {stock === 0 && (
                <div className="flex items-center gap-1.5 text-red-600 font-semibold text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Uitverkocht
                </div>
              )}

              {/* Specs preview */}
              {specs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-visible relative z-10">
                  {specs.slice(0, 4).map((spec, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i < Math.min(specs.length, 4) - 1 ? 'border-b border-gray-100' : ''}`}>
                      <span className="text-xs text-gray-500 font-medium">{spec.label}</span>
                      <span className="text-xs font-semibold text-gray-900 text-right ml-4">{spec.value}</span>
                    </div>
                  ))}
                  {specs.length > 4 && (
                    <button onClick={scrollToSpecs}
                      className="w-full px-4 py-2.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-colors text-center border-t border-gray-100 cursor-pointer relative z-10">
                      Alle {specs.length} specificaties bekijken →
                    </button>
                  )}
                </div>
              )}

              {/* Qty + CTA */}
              <div ref={mainBtnRef} className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aantal</span>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Aantal verlagen" className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-semibold">−</button>
                    <span className="w-10 text-center text-sm font-bold text-gray-900 border-x border-gray-100 h-10 flex items-center justify-center">{qty}</span>
                    <button onClick={() => setQty(q => q + 1)} aria-label="Aantal verhogen" className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-semibold">+</button>
                  </div>
                  <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-auto cursor-pointer" title="Toevoegen aan favorieten" aria-label="Toevoegen aan favorieten">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                  </button>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={() => handleAdd()} disabled={stock === 0}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${stock === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : added
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary text-white hover:brightness-110 active:scale-[0.98]'
                    }`}>
                    {added ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                        Toegevoegd
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                        In winkelwagen
                      </span>
                    )}
                  </button>
                </div>
                {qty > 1 && (
                  <p className="text-center text-sm text-gray-500">
                    Subtotaal: <strong className="text-gray-900">{formatPrice((Number(product?.price || 0) * qty))}</strong> excl. BTW
                  </p>
                )}
              </div>

              {/* Offerte */}
              <div className="border-t border-gray-200 pt-4">
                <button onClick={() => setQuoteOpen(true)} className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  Vraag offerte aan bij grotere aantallen
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-none border-b border-gray-100">
            {TABS.map(tab => {
              const hasContent =
                tab === 'Specificaties' ||
                tab === 'Productinformatie' ||
                tab === 'Beoordelingen' ||
                (tab === 'Alternatieven' && related.length > 0) ||
                (tab === 'Vaak samen gekocht' && fbt.length > 0);
              if (!hasContent) return null;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`px-4 md:px-5 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                    activeTab === tab ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="py-6 md:py-8">
            {/* Specificaties tab */}
            {activeTab === 'Specificaties' && (
              <div id="specificaties" className="max-w-3xl scroll-mt-20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Specificaties</h2>
                  <span className="text-sm text-gray-400">{specs.length} kenmerken</span>
                </div>

                {specs.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                      <tbody>
                        {specs.map((spec, i) => (
                          <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                            <td className="px-5 py-3.5 text-sm font-medium text-gray-500 w-2/5 align-middle">{spec.label}</td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 align-middle">{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 border border-gray-100">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Geen specificaties beschikbaar</p>
                  </div>
                )}
              </div>
            )}

            {/* Productinformatie tab */}
            {activeTab === 'Productinformatie' && (
              <div className="max-w-3xl">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Productinformatie</h2>
                {product.description ? (
                  <div className="text-[15px] md:text-sm text-gray-600 leading-[1.8] space-y-4">
                    {product.description.split('\n').filter(Boolean).map((p, i) => {
                      if (p.startsWith('#')) {
                        return <h3 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2">{p.replace(/^#+\s*/, '')}</h3>;
                      }
                      return <p key={i}>{p}</p>;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Geen omschrijving beschikbaar.</p>
                )}
                {product.pdfUrl && (
                  <a href={product.pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Handleiding en documenten
                  </a>
                )}
              </div>
            )}

            {/* Beoordelingen tab */}
            {activeTab === 'Beoordelingen' && (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 border border-gray-100">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                </div>
                <p className="text-sm text-gray-400 font-medium">Beoordelingen komen binnenkort</p>
              </div>
            )}

            {/* Alternatieven tab */}
            {activeTab === 'Alternatieven' && related.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-5">Alternatieven</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {related.map(p => (
                    <Link key={p.id} to={`/product/${p.id}`} className="group block">
                      <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-3">
                        <img src={getImageSrc(p)} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2 leading-snug">{p.name}</p>
                      <p className="text-base font-bold text-gray-900 mt-1">{formatPrice(p.price)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Vaak samen gekocht tab */}
            {activeTab === 'Vaak samen gekocht' && fbt.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-5">Vaak samen gekocht</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fbt.map(p => (
                    <div key={p.id} className="group bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                        <img src={getImageSrc(p)} alt={p.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5em] leading-snug">{p.name}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <span className="text-base font-bold text-gray-900">{formatPrice(p.price)}</span>
                        <button onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl })}
                          className="px-3.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-all">
                          + Toevoegen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── ACCESSORIES ─── */}
      {explicit.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Maak je set compleet</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {explicit.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition-all">
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                    <img src={getImageSrc(item)} alt={item.name} className="w-full h-full object-contain p-3" loading="lazy" decoding="async" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5em] leading-snug">{item.name}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-base font-bold text-gray-900">{formatPrice(item.price)}</span>
                    <button onClick={() => { addToCart(item); setAdded(true); setTimeout(() => setAdded(false), 2000); }}
                      className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
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
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            <div className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{bundle.title || 'Voordeelpakket'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {bundle.items.map((b) => (
                  <div key={b.id} className="text-center">
                    <div className="aspect-square bg-white rounded-2xl overflow-hidden mb-2 border border-gray-100">
                      {b.imageUrl ? <img src={getImageSrc(b)} alt={b.name} className="w-full h-full object-contain p-3" loading="lazy" decoding="async" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg font-bold">+</div>}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-tight">{b.name}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-5 px-1">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Totaalset</p>
                  <p className="text-xs text-gray-400">{bundle.items.length} producten</p>
                </div>
                <span className="text-2xl font-bold text-gray-900">{formatPrice(bundle.total)}</span>
              </div>
              <button onClick={() => { bundle.items.forEach(it => addToCart({ id: it.id, name: it.name, price: it.price, imageUrl: it.imageUrl })); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
                className="w-full max-w-xs py-3.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-all">
                Complete set bestellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BOTTOM TRUST ─── */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Grote aantallen nodig?</p>
              <p className="text-xs text-gray-500 mt-1">Vraag een offerte aan</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Betaal achteraf</p>
              <p className="text-xs text-gray-500 mt-1">Met Klarna of Riverty</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Retourneren binnen 30 dagen</p>
              <p className="text-xs text-gray-500 mt-1">Niet goed? Geld terug</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Tot 7 jaar garantie</p>
              <p className="text-xs text-gray-500 mt-1">Fabrieksgarantie</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── STICKY BAR ─── */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <img src={getImageSrc(product)} alt={product.name} className="w-9 h-9 object-contain rounded-lg bg-gray-50 border border-gray-100 shrink-0" loading="lazy" decoding="async" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
            <p className="text-sm font-bold text-gray-900">{formatPrice(product?.price)} <span className="text-xs text-gray-400 font-normal">excl. btw</span></p>
          </div>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0 bg-white">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base">−</button>
            <span className="w-7 text-center text-sm font-bold text-gray-900 border-x border-gray-100 h-8 flex items-center justify-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base">+</button>
          </div>
          <button onClick={() => handleAdd()}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0 ${added ? 'bg-emerald-600 text-white' : 'bg-primary text-white hover:brightness-110'}`}>
            {added ? '✓ Toegevoegd' : 'In winkelwagen'}
          </button>
        </div>
      </div>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>

      <QuoteModal product={product} isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </div>
  );
};

export default ProductDetail;
