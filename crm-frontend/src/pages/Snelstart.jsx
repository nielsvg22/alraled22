import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  Settings, Link2, AlertCircle, CheckCircle, 
  RefreshCw, Save, History, ExternalLink, Plus, Trash2
} from 'lucide-react';

const iCls = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white border-gray-200';

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      {hint && <p className="text-[10px] text-gray-400 leading-tight">{hint}</p>}
      {children}
    </div>
  );
}

export default function Snelstart() {
  const [tab, setTab] = useState('settings'); // 'settings', 'ledgers' or 'logs'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [newLedger, setNewLedger] = useState({ code: '', name: '', type: 'SALES' });
  const [config, setConfig] = useState({
    apiKey: '',
    clientKey: '',
    ledgerNumberSales: '',
    ledgerNumberVat21: '',
    ledgerNumberVat9: '',
    ledgerNumberVat0: '',
    ledgerNumberShipping: '',
    snelstartVatCode21: '',
    snelstartVatCode9: '',
    snelstartVatCode0: '',
    enabled: 0
  });

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/snelstart/config');
      if (res.data.id) setConfig(res.data);
    } catch (err) {
      console.error('Failed to load Snelstart config', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/snelstart/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load sync logs', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLedgers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/snelstart/ledgers');
      setLedgers(res.data);
    } catch (err) {
      console.error('Failed to load ledgers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'settings') loadConfig();
    else if (tab === 'ledgers') loadLedgers();
    else loadLogs();
  }, [tab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/snelstart/config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = async (orderId) => {
    try {
      const res = await api.post('/snelstart/retry', { orderId });
      if (res.data.success) {
        alert('Synchronisatie geslaagd!');
      } else {
        alert('Synchronisatie opnieuw mislukt.');
      }
      loadLogs();
    } catch (err) {
      alert('Retry mislukt');
    }
  };

  const handleCreateLedger = async () => {
    if (!newLedger.code || !newLedger.name) return;
    try {
      await api.post('/snelstart/ledgers', newLedger);
      setNewLedger({ code: '', name: '', type: 'SALES' });
      loadLedgers();
    } catch (err) {
      alert('Aanmaken mislukt');
    }
  };

  const handleDeleteLedger = async (id) => {
    if (!window.confirm('Weet je zeker dat je dit grootboeknummer wilt verwijderen?')) return;
    try {
      await api.delete(`/snelstart/ledgers/${id}`);
      loadLedgers();
    } catch (err) {
      alert('Verwijderen mislukt');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Snelstart Koppeling</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Beheer de automatische facturatie en synchronisatie met Snelstart.</p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button 
            onClick={() => setTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${tab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Settings size={14} /> Instellingen
          </button>
          <button 
            onClick={() => setTab('ledgers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${tab === 'ledgers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <History size={14} /> Grootboek
          </button>
          <button 
            onClick={() => setTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${tab === 'logs' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <History size={14} /> Sync Status
          </button>
        </div>
      </div>

      {tab === 'settings' ? (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                  <Link2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">API Verbinding</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Snelstart API Gateway</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={config.enabled === 1}
                  onChange={e => setConfig({ ...config, enabled: e.target.checked ? 1 : 0 })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-black text-gray-900">{config.enabled ? 'Actief' : 'Uitgeschakeld'}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Snelstart API Key" hint="Je primaire API key van Snelstart">
                <input 
                  type="password"
                  className={iCls} 
                  value={config.apiKey || ''} 
                  onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk_..."
                />
              </Field>
              <Field label="Client Key" hint="Client key voor de specifieke administratie">
                <input 
                  type="password"
                  className={iCls} 
                  value={config.clientKey || ''} 
                  onChange={e => setConfig({ ...config, clientKey: e.target.value })}
                />
              </Field>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Grootboekrekeningen</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Verkoop">
                  <input className={iCls} value={config.ledgerNumberSales || ''} onChange={e => setConfig({ ...config, ledgerNumberSales: e.target.value })} placeholder="bv. 8000" />
                </Field>
                <Field label="Verzendkosten">
                  <input className={iCls} value={config.ledgerNumberShipping || ''} onChange={e => setConfig({ ...config, ledgerNumberShipping: e.target.value })} placeholder="bv. 8100" />
                </Field>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">BTW Instellingen (Mapping)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Hoog (21%)</p>
                  <Field label="Grootboek BTW">
                    <input className={iCls} value={config.ledgerNumberVat21 || ''} onChange={e => setConfig({ ...config, ledgerNumberVat21: e.target.value })} placeholder="bv. 1500" />
                  </Field>
                  <Field label="Snelstart BTW Code">
                    <input className={iCls} value={config.snelstartVatCode21 || ''} onChange={e => setConfig({ ...config, snelstartVatCode21: e.target.value })} placeholder="bv. 1" />
                  </Field>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Laag (9%)</p>
                  <Field label="Grootboek BTW">
                    <input className={iCls} value={config.ledgerNumberVat9 || ''} onChange={e => setConfig({ ...config, ledgerNumberVat9: e.target.value })} placeholder="bv. 1510" />
                  </Field>
                  <Field label="Snelstart BTW Code">
                    <input className={iCls} value={config.snelstartVatCode9 || ''} onChange={e => setConfig({ ...config, snelstartVatCode9: e.target.value })} placeholder="bv. 2" />
                  </Field>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Nul / Verlegd (0%)</p>
                  <Field label="Grootboek BTW">
                    <input className={iCls} value={config.ledgerNumberVat0 || ''} onChange={e => setConfig({ ...config, ledgerNumberVat0: e.target.value })} placeholder="bv. 1520" />
                  </Field>
                  <Field label="Snelstart BTW Code">
                    <input className={iCls} value={config.snelstartVatCode0 || ''} onChange={e => setConfig({ ...config, snelstartVatCode0: e.target.value })} placeholder="bv. 0" />
                  </Field>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${saved ? 'bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}
              >
                {saved ? <><CheckCircle size={16} /> Opgeslagen!</> : saving ? <>Opslaan...</> : <><Save size={16} /> Instellingen Opslaan</>}
              </button>
            </div>
          </div>
        </div>
      ) : tab === 'ledgers' ? (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Nieuw Grootboeknummer</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Toevoegen aan administratie</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <Field label="Nummer / Code">
                <input className={iCls} value={newLedger.code} onChange={e => setNewLedger({ ...newLedger, code: e.target.value })} placeholder="bv. 8000" />
              </Field>
              <Field label="Omschrijving">
                <input className={iCls} value={newLedger.name} onChange={e => setNewLedger({ ...newLedger, name: e.target.value })} placeholder="bv. Omzet LED" />
              </Field>
              <Field label="Type">
                <select className={iCls} value={newLedger.type} onChange={e => setNewLedger({ ...newLedger, type: e.target.value })}>
                  <option value="SALES">Verkoop</option>
                  <option value="VAT">BTW</option>
                  <option value="SHIPPING">Verzending</option>
                  <option value="OTHER">Overig</option>
                </select>
              </Field>
              <button 
                onClick={handleCreateLedger}
                className="h-[42px] bg-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
              >
                <Plus size={14} /> Toevoegen
              </button>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Beschikbare Grootboeknummers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ledgers.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-black text-blue-600 bg-white w-12 h-10 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                        {l.code}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900">{l.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{l.type}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteLedger(l.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order / Datum</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Klant</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400 font-medium">
                      Geen synchronisatie logs gevonden.
                    </td>
                  </tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-900">Order #{log.orderId.slice(0,8)}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{new Date(log.syncedAt).toLocaleString('nl-NL')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{log.order?.user?.name || 'Onbekend'}</span>
                        <span className="text-[10px] text-gray-400">{log.order?.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle size={10} /> Succes
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider w-fit">
                            <AlertCircle size={10} /> Mislukt
                          </span>
                          {log.errorMessage && (
                            <span className="text-[10px] text-red-400 font-medium max-w-[200px] truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRetry(log.orderId)}
                        className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Opnieuw proberen"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
