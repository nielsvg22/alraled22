import React, { useEffect, useState, useCallback } from 'react';
import { Handshake, Trash2, X, Mail, Phone, Globe } from 'lucide-react';
import api from '../lib/api';
import { errorText } from '../lib/errorText';

const fmt = (d) => (d ? new Date(d).toLocaleString('nl-NL') : '–');
const STATUS = {
  NEW: { label: 'Nieuw', cls: 'bg-blue-100 text-blue-700' },
  CONTACTED: { label: 'In gesprek', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Goedgekeurd', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Afgewezen', cls: 'bg-gray-200 text-gray-600' },
};

function Row({ label, children }) {
  if (!children) return null;
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-gray-100 text-sm">
      <div className="text-gray-500 text-xs uppercase tracking-wider pt-0.5">{label}</div>
      <div className="col-span-2 text-gray-900 break-words whitespace-pre-line">{children}</div>
    </div>
  );
}

// Aanvragen "Word groothandelspartner" vanaf de website.
export default function PartnerApplications() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(null);
  const [status, setStatus] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try { const r = await api.get('/partner-applications/admin'); setItems(r.data); setError(''); }
    catch (e) { setError(errorText(e, 'Aanvragen ophalen mislukt')); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const show = (a) => { setOpen(a); setStatus(a.status); setNotes(a.notes || ''); setMsg(''); };
  const save = async () => {
    try { await api.put(`/partner-applications/admin/${open.id}`, { status, notes }); setOpen(null); setMsg('Opgeslagen.'); load(); }
    catch (e) { setError(errorText(e, 'Opslaan mislukt')); }
  };
  const remove = async () => {
    if (!window.confirm(`Aanvraag van ${open.company} verwijderen?`)) return;
    try { await api.delete(`/partner-applications/admin/${open.id}`); setOpen(null); load(); }
    catch (e) { setError(errorText(e, 'Verwijderen mislukt')); }
  };

  const list = filter ? items.filter((i) => i.status === filter) : items;
  const newCount = items.filter((i) => i.status === 'NEW').length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2"><Handshake className="w-6 h-6 text-blue-600" /> Partneraanvragen {newCount > 0 && <span className="text-xs bg-red-600 text-white rounded-full px-2 py-0.5">{newCount} nieuw</span>}</h1>
        <p className="text-sm text-gray-500 mt-1">Aanvragen via het formulier "Word groothandelspartner" op de Groothandels-pagina. Zet de status om bij te houden waar u mee bent.</p>
      </div>
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      {msg && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{msg}</div>}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === '' ? 'bg-gray-900 text-white' : 'bg-white'}`}>Alle ({items.length})</button>
        {Object.entries(STATUS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === k ? 'bg-gray-900 text-white' : 'bg-white'}`}>{v.label} ({items.filter((i) => i.status === k).length})</button>
        ))}
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {list.length === 0 && <p className="p-8 text-center text-sm text-gray-400">Geen aanvragen.</p>}
        {list.map((a) => (
          <button key={a.id} onClick={() => show(a)} className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-gray-50 flex items-center gap-3 ${a.status === 'NEW' ? 'bg-blue-50/40' : ''}`}>
            <div className="min-w-0 flex-1">
              <p className={`text-sm truncate ${a.status === 'NEW' ? 'font-bold' : ''}`}>{a.company}</p>
              <p className="text-xs text-gray-500 truncate">{a.contactName} · {a.email} · {fmt(a.createdAt)}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${(STATUS[a.status] || {}).cls || 'bg-gray-100'}`}>{(STATUS[a.status] || {}).label || a.status}</span>
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div><h2 className="text-lg font-black">{open.company}</h2><p className="text-xs text-gray-500">Ontvangen {fmt(open.createdAt)} · taal {String(open.language || 'nl').toUpperCase()}</p></div>
              <button onClick={() => setOpen(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <Row label="Contactpersoon">{open.contactName}</Row>
              <Row label="E-mail"><a className="text-blue-600 underline inline-flex items-center gap-1" href={`mailto:${open.email}`}><Mail className="w-3 h-3" />{open.email}</a></Row>
              <Row label="Telefoon">{open.phone && <a className="text-blue-600 underline inline-flex items-center gap-1" href={`tel:${open.phone}`}><Phone className="w-3 h-3" />{open.phone}</a>}</Row>
              <Row label="Website">{open.website && <a className="text-blue-600 underline inline-flex items-center gap-1" href={/^https?:/.test(open.website) ? open.website : `https://${open.website}`} target="_blank" rel="noreferrer"><Globe className="w-3 h-3" />{open.website}</a>}</Row>
              <Row label="KvK">{open.kvk}</Row>
              <Row label="BTW-nummer">{open.vatNumber}</Row>
              <Row label="Vestigingen / regio">{open.region}</Row>
              <Row label="Bericht">{open.message}</Row>
            </div>
            <div className="grid grid-cols-3 gap-3 items-start">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">Status</label>
              <select className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">Notities</label>
              <textarea rows={3} className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Interne aantekeningen (niet zichtbaar voor de aanvrager)" />
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={remove} className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm flex items-center gap-1"><Trash2 className="w-4 h-4" /> Verwijderen</button>
              <div className="flex gap-2">
                <button onClick={() => setOpen(null)} className="px-4 py-2 rounded-lg border text-sm">Sluiten</button>
                <button onClick={save} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">Opslaan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
