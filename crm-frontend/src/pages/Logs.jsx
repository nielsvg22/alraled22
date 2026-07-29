import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { RefreshCw, AlertCircle, Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const LEVEL_ICONS = {
  INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  WARN: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  ERROR: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

const TYPE_FILTERS = [
  { value: '', label: 'Alle' },
  { value: 'sendcloud', label: 'SendCloud' },
  { value: 'order', label: 'Orders' },
  { value: 'payment', label: 'Betalingen' },
  { value: 'system', label: 'Systeem' },
];

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    params.set('limit', '100');
    api.get(`/logs?${params}`)
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [typeFilter]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
          <p className="text-sm text-gray-500 mt-1">{total} regels gevonden</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
          <RefreshCw className="w-4 h-4" /> Verversen
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${typeFilter === f.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs list */}
      <div className="space-y-2">
        {logs.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">Geen logs gevonden</p>
          </div>
        )}
        {logs.map((log) => {
          const levelStyle = LEVEL_ICONS[log.level] || LEVEL_ICONS.INFO;
          const Icon = levelStyle.icon;
          const isExpanded = expanded === log.id;
          let details = null;
          try { details = log.details ? JSON.parse(log.details) : null; } catch {}

          return (
            <div key={log.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(isExpanded ? null : log.id)}>
                <div className={`w-7 h-7 rounded-lg ${levelStyle.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${levelStyle.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{log.source}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${levelStyle.bg} ${levelStyle.color}`}>{log.level}</span>
                  </div>
                  <p className="text-sm text-gray-900 truncate mt-0.5">{log.message}</p>
                </div>
                <p className="text-[10px] text-gray-400 shrink-0 hidden sm:block">
                  {new Date(log.createdAt).toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                {details && (
                  isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </div>

              {isExpanded && details && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto">
                    {JSON.stringify(details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
