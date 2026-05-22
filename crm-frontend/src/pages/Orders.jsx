import React, { useEffect, useRef, useState, useMemo } from 'react';
import api from '../lib/api';
import {
  Eye, Clock, CheckCircle, Truck, XCircle, MoreVertical,
  Search, TrendingUp, ShoppingBag, AlertCircle,
  PackageCheck, Copy, X, ChevronDown, Mail, RefreshCw, Filter,
  FileDown, CreditCard, ExternalLink, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorText } from '../lib/errorText';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

const STATUS = {
  PENDING:    { label: 'In afwachting',  short: 'Pending',    color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', icon: Clock       },
  PROCESSING: { label: 'In behandeling', short: 'Processing', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6', icon: RefreshCw   },
  SHIPPED:    { label: 'Verzonden',      short: 'Shipped',    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', dot: '#8b5cf6', icon: Truck       },
  DELIVERED:  { label: 'Afgeleverd',     short: 'Delivered',  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981', icon: PackageCheck},
  CANCELLED:  { label: 'Geannuleerd',    short: 'Cancelled',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', icon: XCircle     },
};

const PAYMENT_STATUS = {
  PENDING:   { label: 'In afwachting', color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  OPEN:      { label: 'Open',          color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6' },
  CANCELLED: { label: 'Geannuleerd',   color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
  EXPIRED:   { label: 'Verlopen',      color: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' },
  FAILED:    { label: 'Mislukt',       color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
  PAID:      { label: 'Betaald',       color: '#059669', bg: '#ecfdf5', dot: '#10b981' },
};

function StatusBadge({ status, size = 'sm' }) {
  const s = STATUS[status] || STATUS.PENDING;
  const Icon = s.icon;
  const pad = size === 'lg' ? '6px 14px' : '3px 10px';
  const fs  = size === 'lg' ? '13px' : '11px';
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, padding: pad, fontSize: fs, borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <Icon size={size === 'lg' ? 14 : 11} />
      {s.label}
    </span>
  );
}

function StatusDropdown({ orderId, currentStatus, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 w-52 overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
          <p className="px-4 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-50">Status wijzigen</p>
          {Object.entries(STATUS).map(([val, s]) => {
            const Icon = s.icon;
            return (
              <button key={val} onClick={() => { onUpdate(orderId, val); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
                <span className="font-semibold" style={{ color: s.color }}>{s.label}</span>
                {val === currentStatus && <CheckCircle size={13} className="ml-auto text-gray-300" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, gradient, icon: Icon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: gradient, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div className="absolute -right-3 -top-3 opacity-10">
        <Icon size={72} className="text-white" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">{label}</p>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-white/50 mt-1.5">{sub}</p>}
    </div>
  );
}

function PaymentSection({ orderId, total }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('ideal');
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    fetchPayments();
    fetchMethods();
  }, [orderId]);

  const fetchPayments = async () => {
    try {
      const r = await api.get(`/payments/order/${orderId}`);
      setPayments(r.data);
    } catch (e) {
      console.error('Failed to fetch payments', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMethods = async () => {
    try {
      const r = await api.get('/payments/methods');
      setMethods(r.data);
    } catch (e) {
      console.error('Failed to fetch payment methods', e);
    }
  };

  const createPayment = async () => {
    setCreating(true);
    try {
      const redirectUrl = `${window.location.origin}/orders?payment=success`;
      const r = await api.post('/payments', {
        orderId,
        method: selectedMethod,
        redirectUrl,
      });
      window.location.href = r.data.paymentUrl;
    } catch (e) {
      alert('Betaling starten mislukt: ' + errorText(e));
    } finally {
      setCreating(false);
    }
  };

  const paidPayment = payments.find(p => p.status === 'PAID');
  const pendingPayment = payments.find(p => ['PENDING', 'OPEN'].includes(p.status));

  if (loading) {
    return (
      <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Betaling</p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          Laden...
        </div>
      </div>
    );
  }

  if (paidPayment) {
    const ps = PAYMENT_STATUS.PAID;
    return (
      <div className="rounded-2xl p-4" style={{ background: ps.bg, border: `1px solid ${ps.dot}30` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: ps.color }}>Betaling</p>
            <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: ps.dot }} />
              {ps.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {paidPayment.paidAt ? new Date(paidPayment.paidAt).toLocaleDateString('nl-NL') : '-'}
              {paidPayment.method && ` · ${paidPayment.method}`}
            </p>
          </div>
          <CheckCircle size={24} style={{ color: ps.dot }} />
        </div>
      </div>
    );
  }

  if (pendingPayment) {
    const ps = PAYMENT_STATUS[pendingPayment.status] || PAYMENT_STATUS.PENDING;
    return (
      <div className="rounded-2xl p-4" style={{ background: ps.bg, border: `1px solid ${ps.dot}30` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: ps.color }}>Betaling</p>
            <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: ps.dot }} />
              {ps.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {pendingPayment.molliePaymentUrl && (
                <a href={pendingPayment.molliePaymentUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-1">
                  Betaal link <ExternalLink size={10} />
                </a>
              )}
            </p>
          </div>
          <Clock size={24} style={{ color: ps.dot }} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Betaling</p>
      <p className="text-xs text-gray-500 mb-3">Nog geen betaling ontvangen</p>

      <div className="mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Betaalmethode</p>
        <div className="flex flex-wrap gap-1.5">
          {methods.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedMethod === m.id
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={createPayment}
        disabled={creating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
      >
        {creating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Bezig...
          </>
        ) : (
          <>
            <CreditCard size={16} />
            Betaal {euro.format(total)}
          </>
        )}
      </button>
    </div>
  );
}

function OrderModal({ order, onClose, onStatusUpdate, isAdmin }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const copy = () => { navigator.clipboard.writeText(order.id); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const TIMELINE = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const stepIdx = TIMELINE.indexOf(order.status);
  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const r = await api.get(`/orders/${order.id}/invoice`, { responseType: 'blob' });
      const blob = new Blob([r.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factuur-${order.id.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Factuur downloaden mislukt');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Bestelling</p>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white font-mono tracking-tight">#{order.id.slice(0,8).toUpperCase()}</h2>
              <button onClick={copy} className="text-white/40 hover:text-white/80 transition-colors">
                {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-white/40 text-xs mt-1">
              {new Date(order.createdAt).toLocaleDateString('nl-NL', { day:'numeric', month:'long', year:'numeric' })}
              {' · '}{new Date(order.createdAt).toLocaleTimeString('nl-NL', { hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} size="lg" />
            <button
              onClick={downloadInvoice}
              disabled={downloading}
              className="text-white/40 hover:text-white/80 transition-colors p-1.5 rounded-xl hover:bg-white/10 disabled:opacity-50"
              title="Factuur downloaden"
            >
              <FileDown size={18} />
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Timeline */}
          {order.status !== 'CANCELLED' && (
            <div className="px-6 py-5 border-b border-gray-50">
              <div className="flex items-center">
                {TIMELINE.map((step, i) => {
                  const s = STATUS[step];
                  const done = i <= stepIdx;
                  const active = i === stepIdx;
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center" style={{ minWidth: 60 }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-black"
                          style={{
                            borderColor: active ? s.dot : done ? '#10b981' : '#e5e7eb',
                            background: active ? s.dot : done ? '#10b981' : '#fff',
                            color: (active || done) ? '#fff' : '#d1d5db',
                            boxShadow: active ? `0 0 0 4px ${s.bg}` : 'none',
                          }}>
                          {done && !active ? <CheckCircle size={14} /> : i + 1}
                        </div>
                        <p className="text-[9px] font-bold mt-1.5 text-center leading-tight" style={{ color: done ? '#374151' : '#d1d5db', maxWidth: 52 }}>
                          {s.short}
                        </p>
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div className="flex-1 h-0.5 mb-4 rounded-full" style={{ background: i < stepIdx ? '#10b981' : '#f3f4f6' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-6 space-y-5">
            {/* Klant + meta + Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Klant</p>
                <p className="font-bold text-gray-900 text-sm">{order.user?.name || 'Onbekend'}</p>
                <a href={`mailto:${order.user?.email}`} className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                  <Mail size={10} />{order.user?.email || '-'}
                </a>
              </div>
              <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bedrag</p>
                <p className="text-2xl font-black text-gray-900">{euro.format(order.total)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{order.items.reduce((s, i) => s + i.quantity, 0)} producten</p>
              </div>
              <PaymentSection orderId={order.id} total={order.total} />
            </div>

            {/* Items */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Bestelde producten</p>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9' }}>
                {order.items.map((item, i) => (
                  <div key={item.id || i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
                    style={{ borderBottom: i < order.items.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl.startsWith('/') ? `http://localhost:5000${item.product.imageUrl}` : item.product.imageUrl}
                        className="w-10 h-10 rounded-xl object-cover shrink-0" style={{ border: '1px solid #f1f5f9' }} alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <ShoppingBag size={16} className="text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.product?.name || 'Product'}</p>
                      <p className="text-xs text-gray-400">{item.quantity}× {euro.format(item.price)}</p>
                    </div>
                    <p className="font-black text-gray-900 text-sm shrink-0">{euro.format(item.price * item.quantity)}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3" style={{ background: '#f8fafc', borderTop: '2px solid #f1f5f9' }}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Totaal</p>
                  <p className="text-lg font-black text-gray-900">{euro.format(order.total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: status actions */}
        {isAdmin && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status wijzigen</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUS).map(([val, s]) => (
                <button key={val} onClick={() => { onStatusUpdate(order.id, val); onClose(); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:shadow-md active:scale-95"
                  style={{
                    background: val === order.status ? s.dot : s.bg,
                    borderColor: s.border,
                    color: val === order.status ? '#fff' : s.color,
                    boxShadow: val === order.status ? `0 4px 12px ${s.dot}40` : 'none',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [statusFilter, setFilter] = useState('ALL');
  const { isAdmin } = useAuth();

  const fetchOrders = async () => {
    setLoading(true);
    try { setError(''); const r = await api.get('/orders'); setOrders(r.data); }
    catch (e) { setError(errorText(e, 'Bestellingen ophalen mislukt')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdate = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
      if (selected?.id === id) setSelected(p => ({ ...p, status }));
    } catch { alert('Status wijzigen mislukt'); }
  };

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    return (!q || o.user?.name?.toLowerCase().includes(q) || o.user?.email?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
      && (statusFilter === 'ALL' || o.status === statusFilter);
  }), [orders, search, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    revenue: orders.reduce((s, o) => s + o.total, 0),
    pending: orders.filter(o => ['PENDING','PROCESSING'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  }), [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bestellingen</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">{orders.length} bestellingen totaal</p>
        </div>
        <button onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-all active:scale-95">
          <RefreshCw size={14} /> Verversen
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 text-sm font-medium">{String(error)}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Totaal" value={stats.total} sub="bestellingen" gradient="linear-gradient(135deg,#1e40af,#3b82f6)" icon={ShoppingBag} />
        <StatCard label="Omzet" value={euro.format(stats.revenue)} sub="alle bestellingen" gradient="linear-gradient(135deg,#065f46,#10b981)" icon={TrendingUp} />
        <StatCard label="Openstaand" value={stats.pending} sub="te verwerken" gradient="linear-gradient(135deg,#92400e,#f59e0b)" icon={AlertCircle} />
        <StatCard label="Afgeleverd" value={stats.delivered} sub="succesvol" gradient="linear-gradient(135deg,#1e3a5f,#0ea5e9)" icon={PackageCheck} />
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Zoek klant, e-mail of order ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-white shadow-sm appearance-none cursor-pointer font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter} onChange={e => setFilter(e.target.value)}>
            <option value="ALL">Alle statussen</option>
            {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Laden…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              <ShoppingBag size={24} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Geen bestellingen gevonden</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
                    {['Order','Klant','Producten','Datum','Totaal','Status',''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]"
                        style={{ textAlign: h === '' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, idx) => (
                    <tr key={order.id} className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                      style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f9fafb' : 'none' }}
                      onClick={() => setSelected(order)}>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-black px-2 py-1 rounded-lg" style={{ background: '#f1f5f9', color: '#475569' }}>
                          #{order.id.slice(0,8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-gray-800">{order.user?.name || 'Klant'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.user?.email || '-'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {order.items.slice(0,3).map((item, i) => (
                            item.product?.imageUrl ? (
                              <img key={i} src={item.product.imageUrl.startsWith('/') ? `http://localhost:5000${item.product.imageUrl}` : item.product.imageUrl}
                                className="w-8 h-8 rounded-lg object-cover" style={{ border: '1px solid #f1f5f9' }} alt="" title={item.product.name} />
                            ) : (
                              <div key={i} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <ShoppingBag size={12} className="text-gray-300" />
                              </div>
                            )
                          ))}
                          {order.items.length > 3 && <span className="text-xs text-gray-400 font-bold">+{order.items.length - 3}</span>}
                          <span className="text-xs text-gray-300 ml-0.5">({order.items.reduce((s,i)=>s+i.quantity,0)}st)</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700 font-medium">{new Date(order.createdAt).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-gray-900">{euro.format(order.total)}</p>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setSelected(order)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                            <Eye size={14} />
                          </button>
                          {isAdmin && <StatusDropdown orderId={order.id} currentStatus={order.status} onUpdate={handleUpdate} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/30 text-xs text-gray-400 font-semibold">
              {filtered.length} van {orders.length} bestellingen
            </div>
          </>
        )}
      </div>

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} onStatusUpdate={handleUpdate} isAdmin={isAdmin} />}
    </div>
  );
}
