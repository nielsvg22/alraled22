import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import analytics from '../lib/analytics';
import { getImageSrc, formatPrice } from '../lib/productHelpers';
import { VAT_RATE } from '../lib/config';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  useEffect(() => {
    analytics.trackCheckoutStart();
  }, []);

  const [emailValue, setEmailValue] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');

  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [showInclVat, setShowInclVat] = useState(true);

  const vatMultiplier = showInclVat ? (1 + VAT_RATE) : 1;

  const applyDiscount = async () => {
    if (!discountCode) return;
    setValidatingDiscount(true);
    setDiscountError('');
    try {
      const res = await api.post('/discounts/validate', { code: discountCode, amount: cartTotal });
      setAppliedDiscount(res.data);
      setDiscountCode('');
    } catch (err) {
      setDiscountError(err.response?.data?.error || 'Ongeldige kortingscode');
      setAppliedDiscount(null);
    } finally {
      setValidatingDiscount(false);
    }
  };

  const finalTotal = appliedDiscount
    ? Math.max(0, cartTotal - appliedDiscount.discountAmount)
    : cartTotal;

  const [validationError, setValidationError] = useState('');
  const formRef = useRef(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const form = formRef.current;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      setValidationError('Vul alle verplichte velden in.');
      return;
    }
    setValidationError('');
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/orders', {
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
        discountCodeId: appliedDiscount?.discountId,
      });
      analytics.trackCheckoutComplete(res.data.id, cartTotal);
      clearCart();
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        navigate('/bestelling-geplaatst', { state: { order: res.data } });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Er is een fout opgetreden bij het plaatsen van uw bestelling.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Uw winkelwagen is leeg</h2>
        <p className="text-gray-500 max-w-sm">Voeg producten toe aan uw winkelwagen om verder te gaan met afrekenen.</p>
        <Link to="/producten" className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
          Bekijk producten
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/producten" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Verder winkelen
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Afrekenen</h1>
            <div className="w-20" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-center gap-8">
            {[
              { num: 1, label: 'Winkelwagen' },
              { num: 2, label: 'Gegevens' },
              { num: 3, label: 'Bevestigen' },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > s.num ? 'bg-emerald-500 text-white' :
                    step === s.num ? 'bg-primary text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`text-sm font-medium ${step === s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`w-12 h-0.5 rounded ${step > s.num ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Form */}
          <div className="lg:col-span-2">
            <form ref={formRef} onSubmit={handleCheckout}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 text-sm font-medium mb-6 flex items-center gap-3">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 text-sm font-medium mb-6 flex items-center gap-3">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {validationError}
                </div>
              )}

              {/* Step 1: Cart */}
              {step === 1 && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Uw winkelwagen ({cartItems.length} {cartItems.length === 1 ? 'product' : 'producten'})</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {cartItems.map((item) => (
                      <div key={item.id} className="p-6 flex gap-5">
                        <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                          <img src={getImageSrc(item, 'https://via.placeholder.com/150')} alt={item.name} className="w-full h-full object-contain p-2" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">{formatPrice(item.price)} per stuk</p>
                            </div>
                            <p className="font-bold text-gray-900 text-sm shrink-0">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                              <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-sm">−</button>
                              <span className="w-10 text-center text-sm font-semibold text-gray-900 border-x border-gray-200">{item.quantity}</span>
                              <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-sm">+</button>
                            </div>
                            <button type="button" onClick={() => removeFromCart(item.id)} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                              Verwijderen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button type="button" onClick={() => setStep(2)} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
                      Doorgaan naar gegevens
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="font-bold text-gray-900">Contactgegevens</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Naam *</label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)} required
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all" placeholder="Uw naam" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bedrijf</label>
                          <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all" placeholder="Optioneel" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">E-mail *</label>
                          <input type="email" value={emailValue} onChange={e => setEmailValue(e.target.value)} required
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all" placeholder="naam@bedrijf.nl" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Telefoon *</label>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all" placeholder="06-12345678" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="font-bold text-gray-900">Verzendadres</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Straat + Huisnummer *</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all" placeholder="Straatnaam 123" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Postcode *</label>
                          <input type="text" value={postcode} onChange={e => setPostcode(e.target.value)} required
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all" placeholder="1234 AB" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Stad *</label>
                          <input type="text" value={city} onChange={e => setCity(e.target.value)} required
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all" placeholder="Amsterdam" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="px-6 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                      Terug
                    </button>
                    <button type="button" onClick={() => setStep(3)} className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
                      Doorgaan naar bevestiging
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="font-bold text-gray-900">Bestelling controleren</h2>
                    </div>
                    <div className="p-6 space-y-5">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</p>
                        <p className="text-sm text-gray-900">{name} {company && <span className="text-gray-500">({company})</span>}</p>
                        <p className="text-sm text-gray-600">{emailValue} {phone && <span>• {phone}</span>}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Verzendadres</p>
                        <p className="text-sm text-gray-900">{address}</p>
                        <p className="text-sm text-gray-600">{postcode} {city}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Producten</p>
                        <div className="space-y-2">
                          {cartItems.map(item => (
                            <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                              <span className="text-gray-600">{item.name} × {item.quantity}</span>
                              <span className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)} className="px-6 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                      Terug
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verwerken...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          Bestelling plaatsen
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden lg:sticky lg:top-8">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Besteloverzicht</h3>
              </div>

              <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100 relative">
                      <img src={getImageSrc(item, 'https://via.placeholder.com/100')} alt={item.name} className="w-full h-full object-contain p-1" />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate leading-tight">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatPrice(item.price)}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Discount */}
              <div className="px-6 pb-4">
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                    placeholder="Kortingscode"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    onClick={applyDiscount}
                    disabled={validatingDiscount || !discountCode}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    {validatingDiscount ? '...' : 'Toepassen'}
                  </button>
                </div>
                {discountError && <p className="text-red-500 text-xs mt-1.5">{discountError}</p>}
                {appliedDiscount && (
                  <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <span className="text-emerald-700 text-xs font-medium">
                      {appliedDiscount.type === 'PERCENTAGE' ? `${appliedDiscount.value}% korting` : `${formatPrice(appliedDiscount.discountAmount)} korting`}
                    </span>
                    <button type="button" onClick={() => setAppliedDiscount(null)} className="text-emerald-500 hover:text-emerald-700">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotaal</span>
                  <span className="text-gray-900 font-medium">{formatPrice(cartTotal * vatMultiplier)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Korting</span>
                    <span className="text-emerald-600 font-medium">-{formatPrice(appliedDiscount.discountAmount * vatMultiplier)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Verzending</span>
                  <span className="text-emerald-600 font-semibold">Gratis</span>
                </div>
                <div className="flex justify-between items-end pt-2.5 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Totaal</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(finalTotal * vatMultiplier)}</p>
                    <button
                      type="button"
                      onClick={() => setShowInclVat(v => !v)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
                    >
                      {showInclVat ? 'Inclusief BTW' : 'Exclusief BTW'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Download quote */}
              <div className="px-6 py-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const payload = {
                        customer: { name: name || user?.name || 'Relatie', email: emailValue || undefined, phone: phone || undefined, company: company || undefined },
                        items: cartItems.map(it => ({ productId: it.id, quantity: it.quantity })),
                      };
                      const r = await api.post('/quotes/pdf', payload, { responseType: 'blob' });
                      const blob = new Blob([r.data], { type: 'application/pdf' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'offerte.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                    } catch {
                      setError('Offerte genereren mislukt. Probeer het opnieuw.');
                    }
                  }}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Offerte downloaden (PDF)
                </button>
              </div>

              {/* Trust badges */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { icon: '🔒', label: 'SSL Beveiligd' },
                    { icon: '🚚', label: 'Gratis verzending' },
                    { icon: '↩️', label: '30 dagen retour' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <span className="text-lg">{icon}</span>
                      <span className="text-[10px] text-gray-500 font-medium leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
