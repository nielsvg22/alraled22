import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Settings, Truck, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const DEFAULT_FIELDS = [
  { key: 'apiKey', label: 'API Key', type: 'password', section: 'credentials' },
  { key: 'apiSecret', label: 'API Secret', type: 'password', section: 'credentials' },
  { key: 'senderName', label: 'Afzendernaam', type: 'text', section: 'sender' },
  { key: 'senderAddress', label: 'Straat', type: 'text', section: 'sender' },
  { key: 'senderHouseNumber', label: 'Huisnummer', type: 'text', section: 'sender' },
  { key: 'senderCity', label: 'Stad', type: 'text', section: 'sender' },
  { key: 'senderPostalCode', label: 'Postcode', type: 'text', section: 'sender' },
  { key: 'senderCountry', label: 'Land (ISO)', type: 'text', section: 'sender' },
  { key: 'senderTelephone', label: 'Telefoon', type: 'tel', section: 'sender' },
  { key: 'returnAddress', label: 'Retour straat', type: 'text', section: 'return' },
  { key: 'returnHouseNumber', label: 'Retour huisnummer', type: 'text', section: 'return' },
  { key: 'returnCity', label: 'Retour stad', type: 'text', section: 'return' },
  { key: 'returnPostalCode', label: 'Retour postcode', type: 'text', section: 'return' },
  { key: 'returnCountry', label: 'Retour land (ISO)', type: 'text', section: 'return' },
  { key: 'defaultShippingMethod', label: 'Standaard verzendmethode ID', type: 'text', section: 'shipping' },
  { key: 'freeShippingThreshold', label: 'Gratis verzending vanaf (EUR)', type: 'number', section: 'shipping' },
  { key: 'standardShippingCost', label: 'Standaard verzendkosten (EUR)', type: 'number', section: 'shipping' },
  { key: 'enableEveningDelivery', label: 'Avondlevering', type: 'toggle', section: 'options' },
  { key: 'enableSaturdayDelivery', label: 'Zaterdaglevering', type: 'toggle', section: 'options' },
  { key: 'enablePickupPoints', label: 'Ophaalpunten', type: 'toggle', section: 'options' },
  { key: 'enableSignature', label: 'Handtekening vereist', type: 'toggle', section: 'options' },
  { key: 'enableInsurance', label: 'Verzekering inschakelen', type: 'toggle', section: 'options' },
  { key: 'insuranceAmount', label: 'Verzekerd bedrag (EUR)', type: 'number', section: 'options' },
];

const SECTIONS = {
  credentials: { label: 'API Credentials', icon: '🔑' },
  sender: { label: 'Afzender gegevens', icon: '📦' },
  return: { label: 'Retour adres', icon: '↩️' },
  shipping: { label: 'Verzendopties', icon: '🚚' },
  options: { label: 'Extra opties', icon: '⚙️' },
};

export default function SendcloudSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [shippingMethods, setShippingMethods] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  useEffect(() => {
    api.get('/shipping/settings')
      .then(r => { setSettings(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/shipping/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTestResult(null);
    try {
      const r = await api.get('/shipping/methods');
      setShippingMethods(r.data);
      setTestResult({ ok: true, msg: `${r.data.length} verzendmethoden gevonden` });
    } catch (err) {
      setTestResult({ ok: false, msg: err.response?.data?.error || 'Verbinding mislukt' });
    }
  };

  const updateField = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const runMigration = async () => {
    setMigrating(true);
    setMigrationResult(null);
    try {
      const r = await api.get('/migration/run');
      setMigrationResult(r.data);
    } catch (err) {
      setMigrationResult({ ok: false, error: err.response?.data?.error || 'Migratie mislukt' });
    } finally {
      setMigrating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SendCloud Instellingen</h1>
          <p className="text-sm text-gray-500 mt-1">Configureer verzending via SendCloud</p>
        </div>
        <div className="flex gap-2">
          <button onClick={testConnection} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
            <RefreshCw className="w-4 h-4" /> Test verbinding
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: saved ? 'linear-gradient(135deg,#065f46,#10b981)' : 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Opgeslagen</> : saving ? '...' : <><Save className="w-4 h-4" /> Opslaan</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Migration card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-amber-900 text-sm">Database migratie</h3>
            <p className="text-xs text-amber-700 mt-0.5">Voer dit eenmalig uit na het deployen van de SendCloud integratie</p>
          </div>
          <button onClick={runMigration} disabled={migrating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-all disabled:opacity-50">
            {migrating ? '...' : 'Migratie uitvoeren'}
          </button>
        </div>
        {migrationResult && (
          <div className="mt-3 space-y-1">
            {migrationResult.ok ? (
              migrationResult.results?.map((r, i) => (
                <p key={i} className={`text-xs font-medium ${r.startsWith('OK') ? 'text-emerald-700' : r.startsWith('SKIP') ? 'text-gray-500' : 'text-red-600'}`}>{r}</p>
              ))
            ) : (
              <p className="text-xs text-red-600">{migrationResult.error}</p>
            )}
          </div>
        )}
      </div>

      {testResult && (
        <div className={`rounded-xl px-5 py-4 text-sm font-medium flex items-center gap-3 ${testResult.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
          {testResult.ok ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {testResult.msg}
        </div>
      )}

      {Object.entries(SECTIONS).map(([sectionKey, section]) => (
        <div key={sectionKey} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg">{section.icon}</span>
            <h2 className="font-bold text-gray-900">{section.label}</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEFAULT_FIELDS.filter(f => f.section === sectionKey).map(field => (
              <div key={field.key} className={`space-y-1.5 ${field.type === 'toggle' ? 'sm:col-span-2' : ''}`}>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{field.label}</label>
                {field.type === 'toggle' ? (
                  <button
                    type="button"
                    onClick={() => updateField(field.key, settings[field.key] === 'true' ? 'false' : 'true')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[field.key] === 'true' ? 'bg-primary' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[field.key] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                ) : (
                  <input
                    type={field.type}
                    value={settings[field.key] || ''}
                    onChange={e => updateField(field.key, e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {shippingMethods.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Beschikbare verzendmethoden</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {shippingMethods.map((m) => (
              <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.carrier?.name || m.carrier_name || 'Onbekend'}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">{m.price ? `€${m.price}` : 'Gratis'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
