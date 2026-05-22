import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Save, CreditCard, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';

const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white';

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

export default function PaymentSettings() {
  const [settings, setSettings] = useState({
    mollieApiKey: '',
    preferredMethods: ['ideal', 'bancontact', 'creditcard'],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/content/ai_settings')
      .then(r => setSettings(prev => ({ ...prev, mollieApiKey: r.data?.mollieApiKey || '' })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/content/ai_settings', { mollieApiKey: settings.mollieApiKey });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400 text-sm animate-pulse">Laden...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Betalingen</h1>
        <p className="text-sm text-gray-400 mt-1">Configureer online betalingen via Mollie.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <h3 className="font-black text-gray-600 text-xs uppercase tracking-widest">Mollie Configuratie</h3>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-blue-700 font-bold mb-1 flex items-center gap-2">
                <CreditCard size={14} />
                Online Betalingen via Mollie
              </p>
              <p className="text-[10px] text-blue-600 leading-relaxed">
                Accepteer iDEAL, Bancontact, Creditcard, PayPal en meer. 
                Maak een gratis account aan op{' '}
                <a href="https://www.mollie.com" target="_blank" rel="noopener noreferrer" 
                  className="underline font-bold inline-flex items-center gap-0.5">
                  mollie.com <ExternalLink size={10} />
                </a>
              </p>
            </div>

            <Field 
              label="Mollie API Key" 
              hint="Je live API key uit het Mollie dashboard (begint met live_... of test_...)"
            >
              <input 
                type="password" 
                value={settings.mollieApiKey || ''} 
                onChange={e => setSettings(s => ({ ...s, mollieApiKey: e.target.value }))}
                placeholder="live_... of test_..."
                className={inputCls}
              />
            </Field>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Ondersteunde betaalmethoden
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'ideal', name: 'iDEAL', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                  { id: 'bancontact', name: 'Bancontact', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { id: 'creditcard', name: 'Creditcard', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                  { id: 'paypal', name: 'PayPal', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
                  { id: 'sofort', name: 'SOFORT', color: 'bg-green-100 text-green-700 border-green-200' },
                  { id: 'kbc', name: 'KBC/CBC', color: 'bg-red-100 text-red-700 border-red-200' },
                  { id: 'belfius', name: 'Belfius', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
                ].map(method => (
                  <span 
                    key={method.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${method.color}`}
                  >
                    {method.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Opslaan...
              </>
            ) : saved ? (
              <>
                <CheckCircle size={16} />
                Opgeslagen!
              </>
            ) : (
              <>
                <Save size={16} />
                Instellingen Opslaan
              </>
            )}
          </button>

          {settings.mollieApiKey && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle size={16} />
              <span>Mollie is geconfigureerd</span>
            </div>
          )}

          {!settings.mollieApiKey && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle size={16} />
              <span>API key ontbreekt - betalingen werken niet</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
