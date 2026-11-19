import React, { useEffect, useState, useCallback } from 'react';
import { Mail, RefreshCw, Send, CheckCircle, AlertTriangle, Inbox } from 'lucide-react';
import api from '../lib/api';
import { errorText } from '../lib/errorText';

const fmt = (d) => (d ? new Date(d).toLocaleString('nl-NL') : '–');
const STATUS = {
  SENT: { label: 'Verstuurd', cls: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Mislukt', cls: 'bg-red-100 text-red-700' },
  NOT_SENT: { label: 'Alleen bewaard (geen SMTP)', cls: 'bg-amber-100 text-amber-700' },
};

// Alle uitgaande e-mails (orders, meldingen, herroepingen, contactformulier), ook zonder gekoppelde SMTP.
export default function EmailLog() {
  const [items, setItems] = useState([]);
  const [unseen, setUnseen] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState(null);
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const r = await api.get('/email-log', { params: { status: status || undefined, search: search || undefined, limit: 100 } });
      setItems(r.data.items); setUnseen(r.data.unseen);
    } catch (e) { setError(errorText(e, 'E-mails ophalen mislukt')); }
    setBusy(false);
  }, [status, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/email-log/provider').then((r) => setProvider(r.data)).catch(() => {}); }, []);

  const sendTest = async () => {
    setMsg(''); setError(''); setTesting(true);
    try { const r = await api.post('/email-log/test', { to: testTo.trim() }); setMsg(r.data.ok ? 'Testmail verstuurd.' : r.data.error); }
    catch (e) { setError(e?.response?.data?.error || errorText(e, 'Testmail mislukt')); }
    setTesting(false); load();
  };

  const show = async (id) => {
    setMsg(''); 
    try { const r = await api.get(`/email-log/${id}`); setOpen(r.data); setItems((p) => p.map((i) => (i.id === id ? { ...i, seen: 1 } : i))); setUnseen((u) => Math.max(0, u - (items.find((i) => i.id === id)?.seen ? 0 : 1))); }
    catch (e) { setError(errorText(e, 'Openen mislukt')); }
  };
  const resend = async (id) => {
    setMsg(''); setError('');
    try { const r = await api.post(`/email-log/${id}/resend`); setMsg(r.data.ok ? 'E-mail opnieuw verstuurd.' : (r.data.error || 'Versturen mislukt')); load(); }
    catch (e) { setError(errorText(e, 'Opnieuw versturen mislukt')); }
  };
  const markAll = async () => { try { await api.post('/email-log/mark-all-seen'); load(); } catch (e) { setError(errorText(e, 'Mislukt')); } };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Inbox className="w-6 h-6 text-blue-600" /> Uitgaande e-mails {unseen > 0 && <span className="text-xs bg-red-600 text-white rounded-full px-2 py-0.5">{unseen} nieuw</span>}</h1>
          <p className="text-sm text-gray-500 mt-1">Elke e-mail die de website verstuurt (orderbevestigingen, nieuwe bestellingen, herroepingen, contactberichten) wordt hier bewaard, ook als er nog geen SMTP is gekoppeld. Zo mist u geen bestelling.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Vernieuwen</button>
          <button onClick={markAll} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Alles gelezen</button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 flex flex-wrap items-center gap-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${provider?.provider && provider.provider !== 'none' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {provider?.provider === 'graph' ? `Microsoft Graph gekoppeld (${provider.sender})` : provider?.provider === 'smtp' ? `SMTP gekoppeld (${provider.sender})` : 'Nog geen mailkoppeling: mails worden alleen bewaard'}
        </span>
        <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="E-mailadres voor testmail" className="px-3 py-2 rounded-lg border text-sm flex-1 min-w-[200px]" />
        <button onClick={sendTest} disabled={testing || !testTo.trim()} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50 flex items-center gap-1"><Send className="w-4 h-4" /> {testing ? 'Versturen…' : 'Testmail sturen'}</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek op ontvanger of onderwerp" className="px-3 py-2 rounded-lg border text-sm flex-1 min-w-[220px]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
          <option value="">Alle statussen</option>
          <option value="NOT_SENT">Alleen bewaard</option>
          <option value="FAILED">Mislukt</option>
          <option value="SENT">Verstuurd</option>
        </select>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex gap-2"><AlertTriangle className="w-4 h-4 mt-0.5" />{error}</div>}
      {msg && <div className="p-3 rounded-lg bg-blue-50 text-blue-800 text-sm">{msg}</div>}

      <div className="rounded-xl border overflow-hidden bg-white">
        {items.length === 0 ? <p className="p-6 text-sm text-gray-400 text-center">Nog geen e-mails.</p> : items.map((m) => (
          <button key={m.id} onClick={() => show(m.id)} className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-gray-50 flex items-center gap-3 ${m.seen ? '' : 'bg-blue-50/40'}`}>
            <Mail className={`w-4 h-4 shrink-0 ${m.seen ? 'text-gray-300' : 'text-blue-600'}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm truncate ${m.seen ? 'text-gray-700' : 'font-bold text-gray-900'}`}>{m.subject}</p>
              <p className="text-xs text-gray-500 truncate">Aan: {m.toEmail} · {fmt(m.createdAt)}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${(STATUS[m.status] || {}).cls || 'bg-gray-100'}`}>{(STATUS[m.status] || {}).label || m.status}</span>
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-black">{open.subject}</h2>
              <p className="text-xs text-gray-500">Aan: {open.toEmail}{open.replyTo ? ` · Antwoord aan: ${open.replyTo}` : ''} · {fmt(open.createdAt)}</p>
              {open.error && <p className="text-xs text-amber-700 mt-1">{open.error}</p>}
            </div>
            {open.bodyHtml
              ? <iframe title="mail" sandbox="" srcDoc={open.bodyHtml} className="w-full h-[50vh] border rounded-lg" />
              : <pre className="whitespace-pre-wrap text-sm bg-gray-50 rounded-lg p-4">{open.bodyText}</pre>}
            <div className="flex justify-end gap-2">
              {open.status !== 'SENT' && <button onClick={() => resend(open.id)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-1"><Send className="w-4 h-4" /> Opnieuw versturen</button>}
              <button onClick={() => setOpen(null)} className="px-4 py-2 rounded-lg border text-sm">Sluiten</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
