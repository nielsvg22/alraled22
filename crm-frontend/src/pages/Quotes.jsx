import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { ChevronDown, ChevronUp, MapPin, Phone, Mail, Building2, FileText, Euro } from 'lucide-react';

const STATUS_COLORS = {
  NEW: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-gray-100 text-gray-600',
  CONTACTED: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-gray-100 text-gray-400',
};

const STATUS_LABELS = {
  NEW: 'Nieuw',
  VIEWED: 'Bekeken',
  CONTACTED: 'Benaderd',
  CONVERTED: 'Omgezet',
  ARCHIVED: 'Gearchiveerd',
};

const fmt = (v) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(v || 0);

export default function Quotes() {
  const [quotesList, setQuotesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const fetchQuotes = () => {
    api.get('/quotes').then(r => { setQuotesList(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchQuotes(); }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/quotes/${id}/status`, { status });
    setQuotesList(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  };

  const filtered = filter === 'ALL' ? quotesList : quotesList.filter(q => q.status === filter);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offertes</h1>
          <p className="text-sm text-gray-500 mt-1">{quotesList.length} offerte{quotesList.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Totaal waarde</p>
          <p className="text-lg font-bold text-gray-900">{fmt(quotesList.reduce((s, q) => s + (q.total || 0), 0))}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: 'ALL', label: 'Alle' }, ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ key: k, label: v }))].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label} {f.key === 'ALL' ? `(${quotesList.length})` : `(${quotesList.filter(q => q.status === f.key).length})`}
          </button>
        ))}
      </div>

      {/* Quotes list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">Geen offertes gevonden</p>
          </div>
        )}
        {filtered.map(q => {
          let items = [];
          try { items = JSON.parse(q.items || '[]'); } catch {}
          const isExpanded = expanded === q.id;
          const subtotal = q.subtotal || items.reduce((s, i) => s + (i.total || 0), 0);
          const vat = q.vat || subtotal * 0.21;

          return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header row */}
              <div className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(isExpanded ? null : q.id)}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">{q.name?.[0]?.toUpperCase() || '?'}</span>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">{q.name}</p>
                      {q.company && <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                    </div>
                    {q.company && <p className="text-xs text-gray-500 truncate">{q.company}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{q.quoteNumber || `#${q.id.slice(0, 8).toUpperCase()}`}</p>
                    <p className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {q.email || '-'}</p>
                    {q.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {q.phone}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{items.length} product{items.length !== 1 ? 'en' : ''}</p>
                    <p className="text-sm font-bold text-gray-900">{fmt(q.total)}</p>
                  </div>
                </div>

                {/* Status + expand */}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[q.status] || STATUS_COLORS.NEW}`}>
                  {STATUS_LABELS[q.status] || q.status}
                </span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  {/* Customer address */}
                  {(q.address || q.postcode || q.city) && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span>{q.address}{q.postcode ? `, ${q.postcode}` : ''}{q.city ? ` ${q.city}` : ''}</span>
                    </div>
                  )}

                  {/* Products table */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Producten</p>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                            <th className="px-3 py-2">Product</th>
                            <th className="px-3 py-2 text-right">Aantal</th>
                            <th className="px-3 py-2 text-right">Prijs p/st</th>
                            <th className="px-3 py-2 text-right">BTW</th>
                            <th className="px-3 py-2 text-right">Totaal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0">
                              <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{item.qty}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{fmt(item.unitPrice || item.unit)}</td>
                              <td className="px-3 py-2 text-right text-gray-500">{item.vatRate || 21}%</td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-1">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotaal excl. BTW</span>
                        <span>{fmt(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>BTW (21%)</span>
                        <span>{fmt(vat)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Totaal incl. BTW</span>
                        <span>{fmt(q.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {q.message && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Opmerkingen</p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">{q.message}</p>
                    </div>
                  )}

                  {/* Status actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {Object.entries(STATUS_LABELS).filter(([k]) => k !== q.status).map(([key, label]) => (
                      <button key={key} onClick={() => updateStatus(q.id, key)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
