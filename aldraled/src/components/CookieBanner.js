import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent, CONSENT_EVENT } from '../lib/consent';

// Cookiebanner: teksten staan in het vertaalwoordenboek, dus ze volgen automatisch de gekozen taal.
export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    setOpen(!getConsent().decided);
    const onChange = (e) => { if (e.detail && e.detail.reopen) { setDetails(true); setOpen(true); } };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!open) return null;
  const decide = (analytics) => { setConsent(analytics); setOpen(false); setDetails(false); };

  return (
    <div role="dialog" aria-live="polite" aria-label="Cookies" className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 p-5 sm:p-6">
        <p className="text-base font-extrabold text-secondary mb-1">Wij gebruiken cookies</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Wij gebruiken noodzakelijke cookies om de website te laten werken. Met uw toestemming gebruiken wij ook analytische cookies om de website te verbeteren.{' '}
          <Link to="/privacy-policy" className="underline text-primary font-semibold">Meer informatie</Link>
        </p>
        {details && (
          <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
            <p><strong>Noodzakelijk</strong> — winkelwagen, inloggen en taalkeuze. Altijd aan.</p>
            <p><strong>Analytisch</strong> — anonieme statistieken over bezoek en gebruik van de website.</p>
          </div>
        )}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={() => setDetails((d) => !d)} className="px-4 py-2.5 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100">Instellingen</button>
          <button type="button" onClick={() => decide(false)} className="px-5 py-2.5 rounded-full text-sm font-bold bg-gray-100 text-secondary hover:bg-gray-200">Alleen noodzakelijk</button>
          <button type="button" onClick={() => decide(true)} className="px-5 py-2.5 rounded-full text-sm font-bold bg-primary text-white hover:brightness-110">Alles accepteren</button>
        </div>
      </div>
    </div>
  );
}
