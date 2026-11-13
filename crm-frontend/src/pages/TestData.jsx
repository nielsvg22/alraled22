import React, { useState } from 'react';
import { Trash2, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { errorText } from '../lib/errorText';

const fmt = (d) => (d ? new Date(d).toLocaleString('nl-NL') : '–');
const euro = (n) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));

// Testdata opruimen vóór de échte livegang: eerst een voorbeeld, dan verwijderen na bevestiging.
export default function TestData() {
  const [preview, setPreview] = useState(null);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const load = async () => {
    setBusy(true); setError(''); setDone(null);
    try { const r = await api.get('/maintenance/test-data/preview'); setPreview(r.data); setWord(''); }
    catch (e) { setError(errorText(e, 'Voorbeeld ophalen mislukt')); }
    setBusy(false);
  };

  const purge = async () => {
    setBusy(true); setError('');
    try {
      const r = await api.post('/maintenance/test-data/purge', { cutoff: preview.cutoff, confirm: word.trim() });
      setDone(r.data); setPreview(null); setWord('');
    } catch (e) { setError(errorText(e, 'Verwijderen mislukt')); }
    setBusy(false);
  };

  const total = preview ? preview.orders.count + preview.quotes.count : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2"><Trash2 className="w-6 h-6 text-red-600" /> Testdata opruimen</h1>
        <p className="text-sm text-gray-500 mt-1">Verwijdert alle bestellingen (met betalingen en retouren) en offertes die tot nu toe zijn aangemaakt, plus de automatische gastaccounts. Producten, klanten met een account en instellingen blijven staan. De voorraad van niet-geannuleerde bestellingen wordt teruggezet. <strong>Dit kan niet ongedaan worden gemaakt.</strong></p>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      {done && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 space-y-1">
          <p className="font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Opgeruimd</p>
          <p>{done.deleted.orders} bestellingen, {done.deleted.quotes} offertes, {done.deleted.quoteNotifications} meldingen en {done.deleted.guestAccounts} gastaccounts verwijderd. Voorraad teruggezet: {done.stockRestoredUnits} stuks.</p>
        </div>
      )}

      {!preview && (
        <button onClick={load} disabled={busy} className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
          <Eye className="w-4 h-4" /> {busy ? 'Laden…' : 'Eerst bekijken wat er zou worden verwijderd'}
        </button>
      )}

      {preview && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{preview.orders.count}</p><p className="text-xs text-gray-500">bestellingen</p></div>
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{preview.quotes.count}</p><p className="text-xs text-gray-500">offertes</p></div>
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{preview.rmas}</p><p className="text-xs text-gray-500">retouren</p></div>
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{preview.guestAccounts}</p><p className="text-xs text-gray-500">gastaccounts</p></div>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>Bestellingen: {fmt(preview.orders.oldest)} t/m {fmt(preview.orders.newest)}, samen {euro(preview.orders.total)}</p>
            <p>Offertes: {fmt(preview.quotes.oldest)} t/m {fmt(preview.quotes.newest)}</p>
          </div>

          {(preview.orders.withMolliePayment > 0 || preview.orders.withShipment > 0) && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Let op: {preview.orders.withMolliePayment} bestelling(en) hebben een Mollie-betaling en {preview.orders.withShipment} een Sendcloud-zending. Dat kunnen echte bestellingen zijn. Controleer de lijst hieronder voordat je verdergaat.</span>
            </div>
          )}

          {preview.orders.sample.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Meest recente bestellingen (steekproef)</p>
              <div className="rounded-xl border border-gray-100 divide-y text-sm">
                {preview.orders.sample.map((o) => (
                  <div key={o.id} className="px-3 py-2 flex flex-wrap gap-x-4 justify-between">
                    <span className="font-mono">#{String(o.id).slice(0, 8).toUpperCase()}</span>
                    <span>{fmt(o.createdAt)}</span>
                    <span>{o.customerEmail || o.shippingName || '–'}</span>
                    <span>{o.status}</span>
                    <span className="font-semibold">{euro(o.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total === 0 ? (
            <p className="text-sm text-gray-500">Er is niets om op te ruimen.</p>
          ) : (
            <div className="pt-2 border-t space-y-3">
              <p className="text-sm text-gray-700">Typ <strong>VERWIJDER</strong> om dit definitief te verwijderen. Bestellingen die ná dit voorbeeld binnenkomen blijven staan.</p>
              <div className="flex gap-2">
                <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="VERWIJDER" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                <button onClick={purge} disabled={busy || word.trim() !== 'VERWIJDER'} className="px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40">{busy ? 'Bezig…' : 'Definitief verwijderen'}</button>
              </div>
              <button onClick={() => { setPreview(null); setWord(''); }} className="text-sm text-gray-500 underline">Annuleren</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
