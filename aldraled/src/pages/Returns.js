import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';

const statusLabel = {
  REQUESTED: 'Aangevraagd',
  APPROVED: 'Goedgekeurd',
  REJECTED: 'Afgewezen',
  RECEIVED: 'Ontvangen',
  REFUNDED: 'Terugbetaald',
  CLOSED: 'Gesloten',
};

const statusColor = {
  REQUESTED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  RECEIVED: 'bg-purple-100 text-purple-700',
  REFUNDED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Returns() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const query = useQuery();
  const preselectOrderId = query.get('orderId') || '';

  const [orders, setOrders] = useState([]);
  const [rmas, setRmas] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [orderId, setOrderId] = useState(preselectOrderId);
  const [reason, setReason] = useState('Defect / werkt niet');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const currentOrder = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setPageLoading(true);
    Promise.all([
      api.get('/orders').then((r) => r.data || []).catch(() => []),
      api.get('/rmas').then((r) => r.data || []).catch(() => []),
    ]).then(([ordersData, rmasData]) => {
      setOrders(ordersData);
      setRmas(rmasData);
      setPageLoading(false);
    }).catch(() => setPageLoading(false));
  }, [user]);

  useEffect(() => {
    if (!currentOrder?.items) return;
    const next = {};
    currentOrder.items.forEach((it) => {
      next[it.id] = Math.min(1, it.quantity || 1);
    });
    setSelected(next);
  }, [currentOrder?.items]);

  const toggleItem = (id) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id] === undefined) next[id] = 1;
      else delete next[id];
      return next;
    });
  };

  const setQty = (id, qty) => {
    setSelected((prev) => ({ ...prev, [id]: qty }));
  };

  const submit = async () => {
    if (!orderId) return;
    const items = Object.entries(selected).map(([orderItemId, quantity]) => ({ orderItemId, quantity: Number(quantity) }));
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const res = await api.post('/rmas', { orderId, reason, message, items });
      setCreated(res.data);
      setRmas((prev) => [res.data, ...prev]);
      setMessage('');
    } catch {
      alert('Retour aanvragen mislukt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center font-black italic text-secondary text-2xl uppercase tracking-tighter animate-pulse">Loading...</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-secondary pt-32 pb-16 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full -ml-72 -mb-72 blur-[100px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-6xl md:text-[6vw] font-black text-white leading-none uppercase italic tracking-tighter">
              RET<span className="text-primary">OUR</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-xs mt-4">Retour aanvragen voor een bestelling</p>
          </div>
          <button
            onClick={() => navigate('/account')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3 rounded-full font-black uppercase italic transition-all"
          >
            Terug naar account
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-[3rem] p-10 space-y-6">
              <h4 className="text-2xl font-black text-secondary uppercase italic tracking-tighter">Nieuwe retour</h4>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">Bestelling</p>
                  <select
                    value={orderId}
                    onChange={(e) => { setOrderId(e.target.value); setCreated(null); }}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 font-bold text-secondary"
                  >
                    <option value="">Kies een bestelling</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.id.slice(0, 6)} · {new Date(o.createdAt).toLocaleDateString('nl-NL')} · €{Number(o.total || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">Reden</p>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 font-bold text-secondary"
                  >
                    {['Defect / werkt niet', 'Verkeerd artikel ontvangen', 'Past niet / voldoet niet', 'Transport schade', 'Anders'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">Toelichting (optioneel)</p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 font-medium text-secondary placeholder:text-gray-300"
                    placeholder="Beschrijf kort het probleem…"
                  />
                </div>

                <button
                  onClick={submit}
                  disabled={!orderId || submitting || Object.keys(selected).length === 0}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase italic hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {submitting ? 'Aanmaken…' : 'Retour aanvragen'}
                </button>

                {created && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Aangemaakt</p>
                    <p className="text-secondary font-black italic mt-1">RMA #{created.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className="flex justify-between items-center border-b border-gray-100 pb-6">
              <h3 className="text-4xl font-black text-secondary uppercase italic tracking-tighter">Artikelen</h3>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-gray-400 font-bold uppercase text-[10px]">
                Selecteer items
              </span>
            </div>

            {!currentOrder ? (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <p className="text-xl text-gray-300 font-black uppercase italic">Kies eerst een bestelling</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(currentOrder.items || []).map((it) => {
                  const checked = selected[it.id] !== undefined;
                  const max = it.quantity || 1;
                  return (
                    <div key={it.id} className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-6 md:p-8 hover:border-primary/20 transition-all shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => toggleItem(it.id)}
                            className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-black ${checked ? 'border-primary bg-primary text-white' : 'border-gray-100 bg-gray-50 text-gray-300'}`}
                          >
                            ✓
                          </button>
                          <div>
                            <p className="text-secondary font-black uppercase italic">{it.product?.name || 'Product'}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Gekocht: x{max}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Aantal</span>
                          <input
                            type="number"
                            min={1}
                            max={max}
                            value={checked ? selected[it.id] : 1}
                            onChange={(e) => setQty(it.id, Math.max(1, Math.min(max, Number(e.target.value))))}
                            disabled={!checked}
                            className="w-20 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 font-black text-secondary disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center border-b border-gray-100 pb-6 pt-10">
              <h3 className="text-4xl font-black text-secondary uppercase italic tracking-tighter">Retouren</h3>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-gray-400 font-bold uppercase text-[10px]">
                Totaal: {rmas.length}
              </span>
            </div>

            {rmas.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <p className="text-xl text-gray-300 font-black uppercase italic">Nog geen retouren</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rmas.map((rma) => (
                  <div key={rma.id} className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-6 md:p-8 hover:border-primary/20 transition-all shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">RMA</p>
                        <p className="text-secondary font-black uppercase italic">#{rma.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">
                          Order #{rma.orderId?.slice(0, 6)} · {new Date(rma.createdAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${statusColor[rma.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel[rma.status] || rma.status}
                        </span>
                      </div>
                    </div>
                    {rma.items && rma.items.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap gap-3">
                        {rma.items.map((ri) => (
                          <div key={ri.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            <span className="text-xs font-black text-secondary uppercase italic">{ri.orderItem?.product?.name || 'Product'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">x{ri.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
