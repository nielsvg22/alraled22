import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Settings, Truck, Save, CheckCircle, AlertCircle, RefreshCw, Send, Package, Upload, X } from 'lucide-react';

const DEFAULT_FIELDS = [
  { key: 'apiKey', label: 'Public Key', type: 'password', section: 'credentials', hint: 'Gebruikersnaam van je SendCloud API integratie' },
  { key: 'apiSecret', label: 'Private Key', type: 'password', section: 'credentials', hint: 'Wachtwoord van je SendCloud API integratie' },
  { key: 'senderName', label: 'Afzendernaam', type: 'text', section: 'sender' },
  { key: 'senderAddress', label: 'Straat', type: 'text', section: 'sender' },
  { key: 'senderHouseNumber', label: 'Huisnummer', type: 'text', section: 'sender' },
  { key: 'senderCity', label: 'Stad', type: 'text', section: 'sender' },
  { key: 'senderPostalCode', label: 'Postcode', type: 'text', section: 'sender' },
  { key: 'senderCountry', label: 'Land (ISO)', type: 'text', section: 'sender', hint: '2-letter landcode, bijv. NL, BE, DE' },
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
  credentials: { label: 'API Credentials', icon: '🔑', description: 'Vind je keys in SendCloud > Settings > Integrations > API' },
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
  const [testShipmentForm, setTestShipmentForm] = useState({
    receiverName: '',
    receiverAddress: '',
    receiverHouseNumber: '',
    receiverCity: '',
    receiverPostalCode: '',
    receiverCountry: 'NL',
    receiverPhone: '',
    receiverEmail: '',
    orderNumber: '',
  });
  const [testShipmentLoading, setTestShipmentLoading] = useState(false);
  const [testShipmentResult, setTestShipmentResult] = useState(null);
  const [carrierLogos, setCarrierLogos] = useState({});
  const [uploadingCarrier, setUploadingCarrier] = useState(null);

  useEffect(() => {
    api.get('/shipping/settings')
      .then(r => {
        setSettings(r.data);
        const logos = {};
        for (const [key, value] of Object.entries(r.data)) {
          if (key.startsWith('carrier_logo_') && value) {
            logos[key.replace('carrier_logo_', '')] = value;
          }
        }
        setCarrierLogos(logos);
        setLoading(false);
      })
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

  const updateTestField = (key, value) => {
    setTestShipmentForm(prev => ({ ...prev, [key]: value }));
  };

  const createTestShipment = async () => {
    setTestShipmentLoading(true);
    setTestShipmentResult(null);
    try {
      const r = await api.post('/shipping/test-shipment', testShipmentForm);
      setTestShipmentResult({ ok: true, msg: 'Test verzending aangemaakt!', data: r.data.shipment });
    } catch (err) {
      setTestShipmentResult({ ok: false, msg: err.response?.data?.error || 'Test verzending mislukt' });
    } finally {
      setTestShipmentLoading(false);
    }
  };

  const uploadCarrierLogo = async (carrierCode, file) => {
    if (!file) return;
    setUploadingCarrier(carrierCode);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const r = await api.post(`/shipping/carrier-logo/${carrierCode}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCarrierLogos(prev => ({ ...prev, [carrierCode]: r.data.url }));
    } catch (err) {
      console.error('Upload mislukt:', err);
    } finally {
      setUploadingCarrier(null);
    }
  };

  const deleteCarrierLogo = async (carrierCode) => {
    try {
      await api.delete(`/shipping/carrier-logo/${carrierCode}`);
      setCarrierLogos(prev => ({ ...prev, [carrierCode]: '' }));
    } catch (err) {
      console.error('Verwijderen mislukt:', err);
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
            <div>
              <h2 className="font-bold text-gray-900">{section.label}</h2>
              {section.description && <p className="text-xs text-gray-500">{section.description}</p>}
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEFAULT_FIELDS.filter(f => f.section === sectionKey).map(field => (
              <div key={field.key} className={`space-y-1.5 ${field.type === 'toggle' ? 'sm:col-span-2' : ''}`}>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{field.label}</label>
                {field.hint && <p className="text-xs text-gray-400 -mt-1">{field.hint}</p>}
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

      {/* Test Verzending */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-900">Test Verzending</h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Gratis (Unstamped Letter)</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Maak een gratis test verzending aan via SendCloud. Er worden geen kosten in rekening gebracht.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Naam *</label>
              <input type="text" value={testShipmentForm.receiverName} onChange={e => updateTestField('receiverName', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="Jan de Vries" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Straat *</label>
              <input type="text" value={testShipmentForm.receiverAddress} onChange={e => updateTestField('receiverAddress', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="Damstraat" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Huisnummer</label>
              <input type="text" value={testShipmentForm.receiverHouseNumber} onChange={e => updateTestField('receiverHouseNumber', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="1" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Stad *</label>
              <input type="text" value={testShipmentForm.receiverCity} onChange={e => updateTestField('receiverCity', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="Amsterdam" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Postcode *</label>
              <input type="text" value={testShipmentForm.receiverPostalCode} onChange={e => updateTestField('receiverPostalCode', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="1012AB" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Land</label>
              <input type="text" value={testShipmentForm.receiverCountry} onChange={e => updateTestField('receiverCountry', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="NL" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Telefoon</label>
              <input type="tel" value={testShipmentForm.receiverPhone} onChange={e => updateTestField('receiverPhone', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="+31612345678" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">E-mail</label>
              <input type="email" value={testShipmentForm.receiverEmail} onChange={e => updateTestField('receiverEmail', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="jan@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Order nummer</label>
              <input type="text" value={testShipmentForm.orderNumber} onChange={e => updateTestField('orderNumber', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="TEST-001 (optioneel)" />
            </div>
          </div>
          <button onClick={createTestShipment} disabled={testShipmentLoading || !testShipmentForm.receiverName || !testShipmentForm.receiverAddress || !testShipmentForm.receiverCity || !testShipmentForm.receiverPostalCode}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {testShipmentLoading ? '...' : <><Send className="w-4 h-4" /> Test verzending aanmaken</>}
          </button>
          {testShipmentResult && (
            <div className={`rounded-xl px-5 py-4 text-sm font-medium flex items-start gap-3 ${testShipmentResult.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {testShipmentResult.ok ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <div>
                <p>{testShipmentResult.msg}</p>
                {testShipmentResult.ok && testShipmentResult.data?.parcels?.[0] && (
                  <div className="mt-2 space-y-1 text-xs text-emerald-600">
                    <p>Parcel ID: {testShipmentResult.data.parcels[0].id}</p>
                    {testShipmentResult.data.parcels[0].tracking_number && (
                      <p>Tracking: {testShipmentResult.data.parcels[0].tracking_number}</p>
                    )}
                    {testShipmentResult.data.parcels[0].tracking_url && (
                      <a href={testShipmentResult.data.parcels[0].tracking_url} target="_blank" rel="noopener noreferrer" className="underline">Bekijk tracking</a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Carrier Logo's */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-600" />
          <h2 className="font-bold text-gray-900">Carrier Logo's</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">Upload logo's per vervoerder. Deze worden getoond in de checkout van de webshop.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { code: 'postnl', name: 'PostNL' },
              { code: 'dhl', name: 'DHL' },
              { code: 'dpd', name: 'DPD' },
              { code: 'ups', name: 'UPS' },
              { code: 'gls', name: 'GLS' },
              { code: 'fedex', name: 'FedEx' },
            ].map(carrier => (
              <div key={carrier.code} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{carrier.name}</span>
                  {carrierLogos[carrier.code] && (
                    <button onClick={() => deleteCarrierLogo(carrier.code)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {carrierLogos[carrier.code] ? (
                  <div className="h-12 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                    <img src={carrierLogos[carrier.code]} alt={carrier.name} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <label className="block h-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-300 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadCarrierLogo(carrier.code, e.target.files?.[0])} />
                    {uploadingCarrier === carrier.code ? (
                      <span className="text-xs text-gray-400">Uploaden...</span>
                    ) : (
                      <span className="text-xs text-gray-400">Klik om logo te uploaden</span>
                    )}
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
