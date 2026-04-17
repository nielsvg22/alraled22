import React, { useState } from 'react';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [emailValue, setEmailValue] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');

  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);

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

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (cartItems.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/orders', {
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
        discountCodeId: appliedDiscount?.discountId,
      });
      clearCart();
      navigate('/bestelling-geplaatst', { state: { order: res.data } });
    } catch (err) {
      setError(err.response?.data?.error || 'Er is een fout opgetreden bij het plaatsen van uw bestelling.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-8">
        <h2 className="text-6xl font-black text-secondary uppercase italic tracking-tighter">Wagen is <span className="text-primary">Leeg</span></h2>
        <p className="text-gray-400 font-medium max-w-md">Voeg producten toe aan uw winkelwagen voordat u kunt afrekenen.</p>
        <a href="/producten" className="bg-secondary text-white px-12 py-5 rounded-full font-black text-xl uppercase italic hover:scale-105 transition-all shadow-2xl">
          Bekijk Producten
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* Left: Contact & Shipping */}
          <div className="space-y-12">
            <div className="space-y-4">
              <h1 className="text-6xl font-black text-secondary uppercase italic tracking-tighter">Check<span className="text-primary">out</span></h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Vul uw gegevens in om de bestelling te plaatsen</p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-100 rounded-2xl px-6 py-4 text-red-600 font-medium">{error}</div>
            )}
            {!user && (
              <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl px-6 py-4 text-secondary font-medium">
                U moet <a href="/login" className="text-primary font-black underline">ingelogd</a> zijn om te kunnen afrekenen.
              </div>
            )}

            <form className="space-y-8" onSubmit={handleCheckout}>
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-secondary uppercase italic">1. Contactgegevens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">E-mailadres</label>
                    <input type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Telefoonnummer</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all font-medium" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-gray-100">
                <h3 className="text-2xl font-black text-secondary uppercase italic">2. Verzendadres</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Straat + Huisnummer</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Postcode</label>
                      <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Stad</label>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all font-medium" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !user}
                className="w-full group relative overflow-hidden bg-secondary text-white py-8 rounded-[2rem] font-black text-2xl uppercase italic shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">{loading ? 'VERWERKEN...' : 'BESTELLING PLAATSEN'}</span>
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const payload = {
                      customer: { name: user?.name || 'Relatie', email: emailValue || undefined, phone: phone || undefined },
                      items: cartItems.map(it => ({ productId: it.id, quantity: it.quantity })),
                    };
                    const r = await api.post('/quotes/pdf', payload, { responseType: 'blob' });
                    const blob = new Blob([r.data], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'offerte.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                  } catch {
                    alert('Offerte genereren mislukt');
                  }
                }}
                className="w-full mt-4 bg-gray-100 text-secondary border-2 border-gray-100 hover:border-primary/30 hover:bg-primary/5 px-6 py-6 rounded-[2rem] font-black uppercase italic transition-all"
              >
                Offerte (PDF) downloaden
              </button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:sticky lg:top-32 h-fit bg-gray-50 rounded-[3rem] p-10 md:p-12 space-y-10">
            <h3 className="text-3xl font-black text-secondary uppercase italic tracking-tighter border-b border-gray-200 pb-6">Besteloverzicht</h3>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                      <img src={item.imageUrl || 'https://via.placeholder.com/100'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-black text-secondary uppercase italic text-sm leading-tight">{item.name}</h4>
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Aantal: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-black text-secondary italic text-lg">€{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Discount Code Input */}
            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <input 
                  className="flex-1 bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all font-bold uppercase italic text-xs tracking-widest"
                  placeholder="KORTINGSCODE"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                />
                <button 
                  type="button"
                  onClick={applyDiscount}
                  disabled={validatingDiscount || !discountCode}
                  className="bg-secondary text-white px-8 rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-primary transition-all disabled:opacity-50"
                >
                  {validatingDiscount ? '...' : 'PAS TOE'}
                </button>
              </div>
              {discountError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest px-4">{discountError}</p>}
              {appliedDiscount && (
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-4 group">
                  <div>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Code toegepast!</p>
                    <p className="text-secondary font-black uppercase italic text-xs">Korting: {appliedDiscount.type === 'PERCENTAGE' ? `${appliedDiscount.value}%` : `€${appliedDiscount.value}`}</p>
                  </div>
                  <button type="button" onClick={() => setAppliedDiscount(null)} className="text-emerald-400 hover:text-emerald-600 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-8 border-t-2 border-dashed border-gray-200">
              <div className="flex justify-between text-gray-400 font-bold uppercase tracking-widest text-xs">
                <span>Subtotaal</span><span>€{cartTotal.toFixed(2)}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-emerald-600 font-bold uppercase tracking-widest text-xs italic">
                  <span>Korting</span><span>-€{appliedDiscount.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400 font-bold uppercase tracking-widest text-xs">
                <span>Verzending</span><span className="text-primary font-black italic">GRATIS</span>
              </div>
              <div className="flex justify-between items-end pt-4">
                <span className="text-secondary font-black uppercase italic text-xl">Totaal</span>
                <div className="text-right">
                  <p className="text-5xl font-black text-secondary italic tracking-tighter">€{finalTotal.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Inclusief BTW</p>
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
