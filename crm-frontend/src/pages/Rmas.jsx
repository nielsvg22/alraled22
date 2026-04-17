import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { X, RefreshCw, FileText, User, PackageCheck } from 'lucide-react';

const statusLabel = {
  REQUESTED: 'Aangevraagd',
  APPROVED: 'Goedgekeurd',
  REJECTED: 'Afgewezen',
  RECEIVED: 'Ontvangen',
  REFUNDED: 'Terugbetaald',
  CLOSED: 'Gesloten',
};

const statusColor = {
  REQUESTED: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
  RECEIVED: 'bg-purple-50 text-purple-700 border-purple-100',
  REFUNDED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CLOSED: 'bg-gray-50 text-gray-600 border-gray-100',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${statusColor[status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {statusLabel[status] || status}
    </span>
  );
}

function Modal({ rma, onClose, onUpdate, saving }) {
  const [status, setStatus] = useState(rma.status);
  const [adminNote, setAdminNote] = useState(rma.adminNote || '');

  useEffect(() => {
    setStatus(rma.status);
    setAdminNote(rma.adminNote || '');
  }, [rma.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Retour aanvraag</p>
            <p className="text-white text-xl font-black tracking-tight mt-1">RMA #{rma.id.slice(0, 10).toUpperCase()}</p>
            <p className="text-white/40 text-xs font-bold mt-1">Order #{rma.orderId.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl p-4 border border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest">
                <User size={14} /> Klant
              </div>
              <p className="text-gray-900 font-black mt-2">{rma.user?.name || 'Onbekend'}</p>
              <p className="text-gray-400 text-sm font-bold">{rma.user?.email}</p>
            </div>
            <div className="rounded-2xl p-4 border border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest">
                <FileText size={14} /> Reden
              </div>
              <p className="text-gray-900 font-black mt-2">{rma.reason}</p>
              {rma.message && <p className="text-gray-500 text-sm mt-2 whitespace-pre-wrap">{rma.message}</p>}
            </div>
            <div className="rounded-2xl p-4 border border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest">
                <RefreshCw size={14} /> Status
              </div>
              <div className="mt-2"><Badge status={rma.status} /></div>
              <p className="text-gray-400 text-sm font-bold mt-2">{new Date(rma.createdAt).toLocaleString('nl-NL')}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest">
              <PackageCheck size={14} /> Artikelen
            </div>
            <div className="p-5 space-y-2">
              {(rma.items || []).map((it) => (
                <div key={it.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-gray-900 font-black truncate">{it.orderItem?.product?.name || 'Product'}</p>
                    <p className="text-gray-400 text-xs font-bold">OrderItem: {it.orderItemId.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-gray-900 font-black">x{it.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Nieuwe status</p>
              <select className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white font-black text-gray-900"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {['REQUESTED','APPROVED','REJECTED','RECEIVED','REFUNDED','CLOSED'].map((s) => (
                  <option key={s} value={s}>{statusLabel[s]}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Admin notitie</p>
              <textarea
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white font-medium text-gray-900"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-600 hover:bg-gray-50"
            >
              Sluiten
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ status, adminNote })}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Rmas() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rmas, setRmas] = useState([]);
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/rmas')
      .then((r) => setRmas(r.data || []))
      .catch(() => setRmas([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = String(q || '').trim().toLowerCase();
    if (!query) return rmas;
    return rmas.filter((r) => {
      return (
        r.id.toLowerCase().includes(query) ||
        r.orderId.toLowerCase().includes(query) ||
        String(r.user?.email || '').toLowerCase().includes(query) ||
        String(r.user?.name || '').toLowerCase().includes(query) ||
        String(r.reason || '').toLowerCase().includes(query)
      );
    });
  }, [rmas, q]);

  const update = async (patch) => {
    if (!active) return;
    setSaving(true);
    try {
      const res = await api.patch(`/rmas/${active.id}`, patch);
      setRmas((prev) => prev.map((r) => (r.id === active.id ? res.data : r)));
      setActive(res.data);
    } catch {
      alert('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-10 border border-gray-100">
        <p className="text-gray-900 font-black text-lg">Geen toegang</p>
        <p className="text-gray-400 mt-2">Alleen admins kunnen retouren beheren.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Retouren (RMA)</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Beheer retour-aanvragen van klanten.</p>
        </div>
        <div className="shrink-0">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoeken…"
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Laden…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActive(r)}
              className="text-left rounded-2xl p-5 bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-gray-900 font-black truncate">RMA #{r.id.slice(0, 10).toUpperCase()}</p>
                  <p className="text-gray-400 text-xs font-bold mt-1 truncate">
                    {r.user?.email} · Order #{r.orderId.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <Badge status={r.status} />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-gray-500 text-sm font-bold truncate">{r.reason}</p>
                <p className="text-gray-300 text-xs font-black">{new Date(r.createdAt).toLocaleDateString('nl-NL')}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full bg-white border border-gray-100 rounded-2xl p-10 text-center">
              <p className="text-gray-400 font-black">Geen retouren gevonden</p>
            </div>
          )}
        </div>
      )}

      {active && <Modal rma={active} onClose={() => setActive(null)} onUpdate={update} saving={saving} />}
    </div>
  );
}

