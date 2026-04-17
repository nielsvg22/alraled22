import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order || null;
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // First burst
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#1e293b', '#ffffff', '#fcd34d'],
    });

    // Side cannons
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors: ['#f59e0b', '#ffffff'] });
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors: ['#f59e0b', '#1e293b'] });
    }, 400);

    setTimeout(() => {
      confetti({ particleCount: 40, spread: 100, origin: { y: 0.5 }, scalar: 0.8 });
    }, 900);
  }, []);

  const orderId = order?.id || ('ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase());
  const total   = order?.total ?? null;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Animated checkmark */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto animate-[scaleIn_0.5s_ease]">
          <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-[drawCheck_0.6s_ease_0.3s_both]" />
          </svg>
        </div>
        <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-green-300 animate-ping opacity-20 mx-auto" />
      </div>

      <div className="space-y-3 max-w-md">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Bestelling ontvangen</p>
        <h1 className="text-3xl md:text-4xl font-black text-secondary">Bedankt voor uw bestelling!</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Wij hebben uw bestelling in goede orde ontvangen en gaan er direct mee aan de slag. U ontvangt zo snel mogelijk een bevestiging per e-mail.
        </p>
      </div>

      {/* Order card */}
      <div className="mt-8 bg-gray-50 border border-gray-100 rounded-2xl p-6 w-full max-w-sm space-y-3 text-left">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Orderdetails</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Ordernummer</span>
          <span className="font-black text-secondary">{orderId}</span>
        </div>
        {total !== null && (
          <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
            <span className="text-gray-500">Totaalbedrag</span>
            <span className="font-black text-secondary">€{Number(total).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-bold text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Ontvangen
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Levering</span>
          <span className="font-bold text-secondary">2–3 werkdagen</span>
        </div>
      </div>

      {/* Trust row */}
      <div className="mt-6 flex flex-wrap justify-center gap-6 text-center">
        {[
          { icon: '🚚', text: 'Snel geleverd' },
          { icon: '📦', text: 'Veilig verpakt' },
          { icon: '📞', text: '085-0021 606' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-bold text-gray-400">{text}</span>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link to="/producten" className="bg-secondary text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-primary transition-all">
          Verder winkelen
        </Link>
        <Link to="/" className="bg-gray-100 text-secondary px-8 py-3 rounded-full font-bold text-sm hover:bg-gray-200 transition-all">
          Terug naar home
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
