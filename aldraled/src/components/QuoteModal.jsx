import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../lib/CartContext';
import { API_URL } from '../lib/api';
import { getImageSrc, formatPrice } from '../lib/productHelpers';

export default function QuoteModal({ product, isOpen, onClose }) {
  const { cartItems } = useCart();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState(
    product ? [{ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, qty: 1 }] : []
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [includeCart, setIncludeCart] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const EMAIL_RE = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+\-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

  const validateStep2 = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Naam is verplicht';
    if (!email.trim()) errs.email = 'E-mail is verplicht';
    else if (!EMAIL_RE.test(email.trim())) errs.email = 'Ongeldig e-mailadres';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Product search
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSearching(true);
    fetch(`${API_URL}/api/products`)
      .then(r => r.json())
      .then(data => { setAllProducts(Array.isArray(data) ? data : []); setSearching(false); })
      .catch(() => setSearching(false));
  }, [isOpen]);

  const filteredProducts = searchQuery.trim()
    ? allProducts
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(p => !items.find(i => i.id === p.id))
        .slice(0, 8)
    : [];

  const addItem = useCallback((p) => {
    if (items.find(i => i.id === p.id)) return;
    setItems(prev => [...prev, { id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, qty: 1 }]);
    setSearchQuery('');
  }, [items]);

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const allItems = includeCart
    ? [...items, ...cartItems.filter(ci => !items.find(i => i.id === ci.id)).map(ci => ({ id: ci.id, name: ci.name, price: ci.price, imageUrl: ci.imageUrl, qty: ci.quantity }))]
    : items;

  const subtotal = allItems.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        customer: { name, email, phone, company },
        items: allItems.map(i => ({ productId: i.id, quantity: i.qty })),
        message,
      };
      const r = await fetch(`${API_URL}/api/quotes/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const errBody = await r.text();
        throw new Error(`HTTP ${r.status}: ${errBody}`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offerte-${name || 'aanvraag'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSubmitted(true);
    } catch (e) {
      setError(e.message || 'Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-secondary">Offerte aanvragen</h2>
            <p className="text-sm text-gray-400 mt-1">Vrijblijvende offerte op maat</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-black text-secondary">Offerte gedownload!</h3>
            <p className="text-gray-400 text-sm max-w-sm">Uw offerte is gedownload. Neem contact met ons op als u vragen heeft of de offerte wilt aanvragen.</p>
            <button onClick={onClose} className="mt-4 px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all">
              Sluiten
            </button>
          </div>
        ) : (
          <>
            {/* Steps indicator */}
            <div className="px-8 pt-6">
              <div className="flex items-center gap-3">
                {[1, 2, 3].map(s => (
                  <React.Fragment key={s}>
                    <div className={`flex items-center gap-2 ${step >= s ? 'text-primary' : 'text-gray-300'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {step > s ? '✓' : s}
                      </div>
                      <span className="text-xs font-bold hidden sm:inline">{s === 1 ? 'Producten' : s === 2 ? 'Gegevens' : 'Bevestigen'}</span>
                    </div>
                    {s < 3 && <div className={`flex-1 h-0.5 rounded ${step > s ? 'bg-primary' : 'bg-gray-100'}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {allItems.map(item => (
                      <div key={item.id} className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="w-14 h-14 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100">
                          <img src={getImageSrc(item, 'https://via.placeholder.com/100')} alt="" className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-secondary truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">{formatPrice(item.price)} per stuk</p>
                        </div>
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shrink-0">
                          <button type="button" onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">−</button>
                          <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                          <button type="button" onClick={() => updateQty(item.id, item.qty + 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">+</button>
                        </div>
                        <p className="text-sm font-bold text-secondary w-20 text-right">{formatPrice(item.price * item.qty)}</p>
                        <button type="button" onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {cartItems.length > 0 && !items.find(i => cartItems.some(ci => ci.id === i.id)) && (
                    <label className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 cursor-pointer">
                      <input type="checkbox" checked={includeCart} onChange={e => setIncludeCart(e.target.checked)} className="w-4 h-4 rounded text-primary" />
                      <span className="text-sm font-medium text-secondary">Ook {cartItems.length} producten uit winkelwagen toevoegen</span>
                    </label>
                  )}

                  {/* Product search */}
                  <div className="relative">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Zoek product om toe te voegen..."
                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                      />
                      {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                    {filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addItem(p)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                          >
                            <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                              <img src={getImageSrc(p, 'https://via.placeholder.com/80')} alt="" className="w-full h-full object-contain p-1" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">{formatPrice(p.price)}</p>
                            </div>
                            <span className="text-primary text-xs font-bold shrink-0">+ Toevoegen</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery && filteredProducts.length === 0 && !searching && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center">
                        <p className="text-sm text-gray-400">Geen producten gevonden</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center border border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">Subtotaal (excl. BTW)</span>
                    <span className="text-lg font-black text-secondary">{formatPrice(subtotal)}</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">Naam *</label>
                      <input type="text" required value={name} onChange={e => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: undefined })); }} placeholder="Uw naam"
                        className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${fieldErrors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary'}`} />
                      {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">Bedrijf</label>
                      <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Bedrijfsnaam (optioneel)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">E-mail *</label>
                      <input type="email" required value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })); }} placeholder="naam@bedrijf.nl"
                        className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${fieldErrors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary'}`} />
                      {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">Telefoon</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06-12345678"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Opmerkingen</label>
                    <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Specifieke wensen, levertijd, etc."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors resize-none" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <h3 className="text-sm font-bold text-secondary mb-3">Producten</h3>
                    {allItems.map(item => (
                      <div key={item.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{item.name} × {item.qty}</span>
                        <span className="text-sm font-bold text-secondary">{formatPrice(item.price * item.qty)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 mt-1 border-t border-gray-200">
                      <span className="text-sm font-bold text-secondary">Totaal (excl. BTW)</span>
                      <span className="text-lg font-black text-primary">{formatPrice(subtotal)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <h3 className="text-sm font-bold text-secondary mb-3">Uw gegevens</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-400">Naam:</span> <span className="font-medium text-gray-700">{name}</span></div>
                      <div><span className="text-gray-400">Bedrijf:</span> <span className="font-medium text-gray-700">{company || '—'}</span></div>
                      <div><span className="text-gray-400">E-mail:</span> <span className="font-medium text-gray-700">{email}</span></div>
                      <div><span className="text-gray-400">Telefoon:</span> <span className="font-medium text-gray-700">{phone || '—'}</span></div>
                    </div>
                    {message && <p className="mt-3 text-sm text-gray-500 italic">{message}</p>}
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between gap-4">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  Terug
                </button>
              ) : <div />}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && allItems.length === 0) return;
                    if (step === 2 && !validateStep2()) return;
                    setStep(s => s + 1);
                  }}
                  disabled={step === 1 && allItems.length === 0}
                  className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Volgende
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Offerte downloaden
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
