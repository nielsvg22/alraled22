import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../lib/config';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-[#E4EAF1] bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30';

const EMPTY = { company: '', contactName: '', email: '', phone: '', website: '', kvk: '', vatNumber: '', region: '', message: '', website_url: '' };

// Aanmeldformulier "Word groothandelspartner" (Groothandels-pagina). Aanvragen komen in het CRM onder Partneraanvragen.
export default function PartnerForm() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setFields({});
    try {
      await axios.post(`${API_URL}/api/partner-applications`, { ...f, language: lang });
      setDone(true); setF(EMPTY);
    } catch (err) {
      setFields(err.response?.data?.fields || {});
      setError(err.response?.data?.error || 'Er is iets misgegaan. Probeer het opnieuw of mail naar info@alra-led.nl.');
    }
    setBusy(false);
  };

  return (
    <section id="partner" className="py-16 lg:py-24 px-6 md:px-10 bg-[#F7F9FC] border-t border-[#E4EAF1] scroll-mt-24">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Partner worden</p>
          <h2 className="text-3xl md:text-4xl font-black text-secondary">Word groothandelspartner</h2>
          <p className="text-gray-500 text-base mt-4 max-w-xl mx-auto">Laat uw gegevens achter. Wij nemen binnen enkele werkdagen contact met u op over de mogelijkheden en condities.</p>
        </div>

        {done ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center text-green-900 space-y-2">
            <p className="text-lg font-bold">Bedankt voor uw aanvraag!</p>
            <p className="text-sm">Wij hebben uw gegevens ontvangen en nemen binnen enkele werkdagen contact met u op.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="bg-white border border-[#E4EAF1] rounded-2xl p-6 sm:p-10 space-y-5">
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
            {/* Verborgen veld tegen spam */}
            <div className="hidden" aria-hidden="true"><input tabIndex={-1} autoComplete="off" value={f.website_url} onChange={set('website_url')} /></div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bedrijfsnaam *</label><input className={inputCls} value={f.company} onChange={set('company')} autoComplete="organization" />{fields.company && <p className="text-xs text-red-600 mt-1">{fields.company}</p>}</div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contactpersoon *</label><input className={inputCls} value={f.contactName} onChange={set('contactName')} autoComplete="name" />{fields.contactName && <p className="text-xs text-red-600 mt-1">{fields.contactName}</p>}</div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mailadres *</label><input type="email" className={inputCls} value={f.email} onChange={set('email')} autoComplete="email" />{fields.email && <p className="text-xs text-red-600 mt-1">{fields.email}</p>}</div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telefoon</label><input type="tel" className={inputCls} value={f.phone} onChange={set('phone')} autoComplete="tel" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Website</label><input className={inputCls} value={f.website} onChange={set('website')} placeholder="https://" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">KvK-nummer</label><input className={inputCls} value={f.kvk} onChange={set('kvk')} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">BTW-nummer</label><input className={inputCls} value={f.vatNumber} onChange={set('vatNumber')} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vestigingen of regio</label><input className={inputCls} value={f.region} onChange={set('region')} placeholder="bv. 3 vestigingen in Gelderland" /></div>
            </div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bericht</label><textarea rows={4} className={inputCls} value={f.message} onChange={set('message')} placeholder="Vertel kort wat u zoekt, bijvoorbeeld welke producten u wilt voeren." /></div>
            <button type="submit" disabled={busy} className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30 disabled:opacity-50">{busy ? 'Versturen…' : 'Aanvraag versturen'}</button>
            <p className="text-xs text-gray-400">Velden met * zijn verplicht. Wij gebruiken uw gegevens alleen om contact met u op te nemen over deze aanvraag.</p>
          </form>
        )}
      </div>
    </section>
  );
}
