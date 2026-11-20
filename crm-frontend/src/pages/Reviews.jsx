import React, { useEffect, useState, useCallback } from 'react';
import { Star, Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X, Home as HomeIcon } from 'lucide-react';
import api from '../lib/api';
import { errorText } from '../lib/errorText';

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const EMPTY = { author: '', role: '', rating: 5, title: '', body: '', source: '', reviewedAt: '', productId: '', published: true, showOnHome: true, roleEn: '', bodyEn: '', roleDe: '', bodyDe: '' };
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const fmt = (d) => (d ? new Date(d).toLocaleDateString('nl-NL') : '');

function Stars({ n }) {
  return <span className="inline-flex gap-0.5" aria-label={`${n} van 5`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-4 h-4 ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />)}</span>;
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// Reviews beheren: toevoegen, bewerken, verbergen, verwijderen en de volgorde bepalen.
export default function Reviews() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [edit, setEdit] = useState(null); // { id?, ...velden }
  const [showTrans, setShowTrans] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const r = await api.get('/reviews/admin'); setItems(r.data); setError(''); }
    catch (e) { setError(errorText(e, 'Reviews ophalen mislukt')); }
  }, []);
  useEffect(() => { load(); api.get('/products').then((r) => setProducts(Array.isArray(r.data) ? r.data : (r.data?.items || []))).catch(() => {}); }, [load]);

  const open = (r) => { setError(''); setMsg(''); setShowTrans(!!(r && (r.bodyEn || r.bodyDe || r.roleEn || r.roleDe))); setEdit(r ? { ...EMPTY, ...r, reviewedAt: toDateInput(r.reviewedAt), published: !!r.published, showOnHome: !!r.showOnHome, productId: r.productId || '' } : { ...EMPTY }); };
  const set = (k) => (e) => setEdit((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const body = { ...edit, rating: Number(edit.rating), productId: edit.productId || null, reviewedAt: edit.reviewedAt || null };
      if (edit.id) await api.put(`/reviews/admin/${edit.id}`, body); else await api.post('/reviews/admin', body);
      setEdit(null); setMsg('Review opgeslagen.'); load();
    } catch (err) { setError(errorText(err, 'Opslaan mislukt')); }
    setBusy(false);
  };
  const toggle = async (r, key) => {
    try { await api.put(`/reviews/admin/${r.id}`, { ...r, reviewedAt: toDateInput(r.reviewedAt) || null, [key]: !r[key] }); load(); }
    catch (err) { setError(errorText(err, 'Wijzigen mislukt')); }
  };
  const remove = async (r) => {
    if (!window.confirm(`Review van ${r.author} verwijderen?`)) return;
    try { await api.delete(`/reviews/admin/${r.id}`); load(); } catch (err) { setError(errorText(err, 'Verwijderen mislukt')); }
  };
  const move = async (i, dir) => {
    const j = i + dir; if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]]; setItems(next);
    try { await api.post('/reviews/admin/reorder', { ids: next.map((x) => x.id) }); } catch (err) { setError(errorText(err, 'Volgorde opslaan mislukt')); load(); }
  };

  const avg = items.filter((r) => r.published && r.rating > 0);
  const average = avg.length ? (avg.reduce((a, r) => a + r.rating, 0) / avg.length).toFixed(1) : '–';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Star className="w-6 h-6 text-amber-500" /> Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">Klantervaringen op de website. Gepubliceerde reviews met "Toon op homepage" staan in het blok Ervaringen. {items.length} reviews, gemiddeld {average} ★.</p>
        </div>
        <button onClick={() => open(null)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Review toevoegen</button>
      </div>

      {error && !edit && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      {msg && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{msg}</div>}

      <div className="space-y-3">
        {items.length === 0 && <p className="p-8 text-center text-sm text-gray-400 bg-white rounded-xl border">Nog geen reviews. Voeg de eerste toe.</p>}
        {items.map((r, i) => (
          <div key={r.id} className={`bg-white rounded-xl border p-4 flex gap-4 ${r.published ? '' : 'opacity-60'}`}>
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" title="Omhoog"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" title="Omlaag"><ArrowDown className="w-4 h-4" /></button>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Stars n={r.rating} />
                {r.title && <span className="font-bold text-sm">{r.title}</span>}
                {!r.published && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Verborgen</span>}
                {r.published && r.showOnHome && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center gap-1"><HomeIcon className="w-3 h-3" />Homepage</span>}
                {r.productName && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{r.productName}</span>}
                {(r.bodyEn || r.bodyDe) && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">EN/DE</span>}
              </div>
              <p className="text-sm text-gray-700 italic line-clamp-3">"{r.body}"</p>
              <p className="text-xs text-gray-500">{r.author}{r.role ? ` · ${r.role}` : ''}{r.source ? ` · ${r.source}` : ''}{r.reviewedAt ? ` · ${fmt(r.reviewedAt)}` : ''}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-1">
              <button onClick={() => toggle(r, 'published')} className="p-2 rounded-lg hover:bg-gray-100" title={r.published ? 'Verbergen' : 'Publiceren'}>{r.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
              <button onClick={() => open(r)} className="p-2 rounded-lg hover:bg-gray-100" title="Bewerken"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(r)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Verwijderen"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !busy && setEdit(null)}>
          <form onSubmit={save} className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{edit.id ? 'Review bewerken' : 'Review toevoegen'}</h2>
              <button type="button" onClick={() => setEdit(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Review (Nederlands) *"><textarea rows={4} required className={inputCls} value={edit.body} onChange={set('body')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Naam *"><input required className={inputCls} value={edit.author} onChange={set('author')} placeholder="bv. Jan de Vries" /></Field>
              <Field label="Functie / bedrijf"><input className={inputCls} value={edit.role || ''} onChange={set('role')} placeholder="bv. Transportbedrijf" /></Field>
              <Field label="Sterren">
                <select className={inputCls} value={edit.rating} onChange={set('rating')}>
                  {[5, 4, 3, 2, 1, 0].map((n) => <option key={n} value={n}>{n === 0 ? 'Geen sterren' : `${n} ${n === 1 ? 'ster' : 'sterren'}`}</option>)}
                </select>
              </Field>
              <Field label="Titel (optioneel)"><input className={inputCls} value={edit.title || ''} onChange={set('title')} /></Field>
              <Field label="Bron (optioneel)"><input className={inputCls} value={edit.source || ''} onChange={set('source')} placeholder="bv. Google, e-mail" /></Field>
              <Field label="Datum (optioneel)"><input type="date" className={inputCls} value={edit.reviewedAt || ''} onChange={set('reviewedAt')} /></Field>
            </div>
            <Field label="Gekoppeld product (optioneel)" hint="Leeg laten voor een algemene review.">
              <select className={inputCls} value={edit.productId} onChange={set('productId')}>
                <option value="">Geen (algemeen)</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.published} onChange={set('published')} /> Gepubliceerd</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.showOnHome} onChange={set('showOnHome')} /> Toon op homepage</label>
            </div>
            <button type="button" onClick={() => setShowTrans((v) => !v)} className="text-sm text-blue-600 underline">{showTrans ? 'Vertalingen verbergen' : 'Vertalingen (Engels en Duits) invullen'}</button>
            {showTrans && (
              <div className="space-y-3 p-4 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500">Leeg laten betekent: de Nederlandse tekst wordt getoond.</p>
                <Field label="Review (Engels)"><textarea rows={3} className={inputCls} value={edit.bodyEn || ''} onChange={set('bodyEn')} /></Field>
                <Field label="Functie (Engels)"><input className={inputCls} value={edit.roleEn || ''} onChange={set('roleEn')} /></Field>
                <Field label="Review (Duits)"><textarea rows={3} className={inputCls} value={edit.bodyDe || ''} onChange={set('bodyDe')} /></Field>
                <Field label="Functie (Duits)"><input className={inputCls} value={edit.roleDe || ''} onChange={set('roleDe')} /></Field>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEdit(null)} className="px-4 py-2 rounded-lg border text-sm">Annuleren</button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">{busy ? 'Opslaan…' : 'Opslaan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
