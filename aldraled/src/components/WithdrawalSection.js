import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_URL } from '../lib/config';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white';

// Online herroepingsfunctie ("Koop ongedaan maken") + modelformulier voor herroeping. Onder het retourbeleid.
export default function WithdrawalSection() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', email: '', orderNumber: '', products: '', orderedOn: '', receivedOn: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setFields({});
    try {
      const r = await axios.post(`${API_URL}/api/withdrawals`, { ...f, language: lang });
      setDone(r.data);
    } catch (err) {
      setFields(err.response?.data?.fields || {});
      setError(err.response?.data?.error || 'Er is iets misgegaan. Probeer het opnieuw of mail naar info@alra-led.nl.');
    }
    setBusy(false);
  };

  return (
    <div className="mt-12 space-y-10">
      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8">
        <h2 className="text-xl font-black text-secondary mb-2">Koop ongedaan maken</h2>
        <p className="text-sm text-gray-600 mb-5">Wilt u van uw aankoop afzien? Meld dat hier. U ontvangt direct een bevestiging per e-mail met de inhoud, de datum en het tijdstip van uw melding.</p>

        {done ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-sm text-green-900 space-y-2">
            <p className="font-bold">Uw herroeping is ontvangen.</p>
            <p>Ontvangen op: {done.receivedAt}</p>
            <p>{done.emailSent ? 'Wij hebben een bevestiging naar uw e-mailadres gestuurd.' : 'Wij hebben uw melding vastgelegd. De bevestigingsmail kon nu niet worden verzonden; bewaar deze pagina als bewijs of mail naar info@alra-led.nl.'}</p>
          </div>
        ) : !open ? (
          <button type="button" onClick={() => setOpen(true)} className="px-6 py-3 rounded-full bg-primary text-white text-sm font-bold hover:brightness-110">Koop ongedaan maken</button>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm font-semibold text-gray-800">Ik herroep hierbij de overeenkomst voor de onderstaande producten.</p>
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Naam *</label><input className={inputCls} value={f.name} onChange={set('name')} required />{fields.name && <p className="text-xs text-red-600 mt-1">{fields.name}</p>}</div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">E-mailadres *</label><input type="email" className={inputCls} value={f.email} onChange={set('email')} required />{fields.email && <p className="text-xs text-red-600 mt-1">{fields.email}</p>}</div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Ordernummer</label><input className={inputCls} value={f.orderNumber} onChange={set('orderNumber')} placeholder="bijv. F31D5BB9" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Product(en) *</label><input className={inputCls} value={f.products} onChange={set('products')} required />{fields.products && <p className="text-xs text-red-600 mt-1">{fields.products}</p>}</div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Besteld op</label><input type="date" className={inputCls} value={f.orderedOn} onChange={set('orderedOn')} /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Ontvangen op</label><input type="date" className={inputCls} value={f.receivedOn} onChange={set('receivedOn')} /></div>
            </div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Toelichting (optioneel)</label><textarea rows={3} className={inputCls} value={f.message} onChange={set('message')} /></div>
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className="px-6 py-3 rounded-full bg-primary text-white text-sm font-bold hover:brightness-110 disabled:opacity-50">{busy ? 'Versturen…' : 'Herroeping bevestigen'}</button>
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-3 text-sm text-gray-500 underline">Annuleren</button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 p-6 md:p-8 bg-white" id="modelformulier">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h2 className="text-xl font-black text-secondary">Modelformulier voor herroeping</h2>
          <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 print:hidden">Afdrukken</button>
        </div>
        <p className="text-xs text-gray-500 mb-5">ALRA LED Solutions, Dijkgraafweg 4a, 7336 AT Apeldoorn, info@alra-led.nl, 085 0021 606</p>
        <p className="text-sm text-gray-700 mb-1">Vul dit formulier in als u uw aankoop wilt herroepen.</p>
        <p className="text-sm font-semibold text-gray-800 mb-5">Ik herroep hierbij de overeenkomst voor de onderstaande producten.</p>
        {[
          ['Uw aankoop', ['Product(en)', 'Ordernummer', 'Besteld op', 'Ontvangen op']],
          ['Uw gegevens', ['Naam', 'Straat en huisnummer', 'Postcode', 'Woonplaats']],
          ['Ondertekening', ['Datum van deze melding', 'Handtekening']],
        ].map(([head, rows]) => (
          <div key={head} className="mb-5">
            <h3 className="text-sm font-black text-secondary mb-2">{head}</h3>
            <div className="border border-gray-300 divide-y divide-gray-300">
              {rows.map((r) => (<div key={r} className="grid grid-cols-3"><div className="px-3 py-3 text-sm text-gray-600 bg-gray-50 border-r border-gray-300">{r}</div><div className="col-span-2 px-3 py-3" /></div>))}
            </div>
          </div>
        ))}
        <p className="text-xs text-gray-500 mb-4">Een handtekening is alleen nodig als u het formulier op papier verstuurt.</p>
        <h3 className="text-sm font-black text-secondary mb-1">Versturen</h3>
        <p className="text-sm text-gray-600">E-mail het formulier naar <a className="underline text-primary" href="mailto:info@alra-led.nl">info@alra-led.nl</a> of stuur het per post naar: ALRA LED Solutions, Dijkgraafweg 4a, 7336 AT Apeldoorn, Nederland.</p>
      </section>
    </div>
  );
}
