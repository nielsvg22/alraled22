import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Save, Sparkles, CheckCircle, AlertTriangle, Key } from 'lucide-react';

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

export default function AISettings() {
  const [settings, setSettings] = useState({
    openaiApiKey: '',
    groqApiKey: '',
    googleApiKey: '',
    googleProjectId: '',
    preferredProvider: 'groq', // Groq has a very generous free tier
    preferredImageProvider: 'pollinations', // Default to the free provider
    nanoBananaModel: 'fast' // Default to fast
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/content/ai_settings')
      .then(r => setSettings(prev => ({ ...prev, ...r.data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/content/ai_settings', settings);
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
        <h1 className="text-3xl font-black text-gray-900">AI Instellingen</h1>
        <p className="text-sm text-gray-400 mt-1">Configureer de API-koppelingen voor de AI-functies in het CRM.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-400" />
            <h3 className="font-black text-gray-600 text-xs uppercase tracking-widest">API Configuratie</h3>
          </div>
          
          <div className="p-6 space-y-6">
            <Field 
              label="OpenAI API Key (ChatGPT)" 
              hint="Wordt gebruikt voor de Image Improver en geavanceerde chat functies."
            >
              <input 
                type="password" 
                value={settings.openaiApiKey || ''} 
                onChange={e => setSettings(s => ({ ...s, openaiApiKey: e.target.value }))}
                placeholder="sk-..."
                className={inputCls}
              />
            </Field>

            <Field 
              label="Groq API Key" 
              hint="Wordt gebruikt voor razendsnelle tekstgeneratie (productomschrijvingen, etc)."
            >
              <input 
                type="password" 
                value={settings.groqApiKey || ''} 
                onChange={e => setSettings(s => ({ ...s, groqApiKey: e.target.value }))}
                placeholder="gsk_..."
                className={inputCls}
              />
            </Field>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-lg">🍌</span> Nano Banana (Google Gemini AI)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Google / Nano Banana API Key">
                  <input 
                    type="password" 
                    value={settings.googleApiKey || ''} 
                    onChange={e => setSettings(s => ({ ...s, googleApiKey: e.target.value }))}
                    placeholder="AIza..."
                    className={inputCls}
                  />
                </Field>
                <Field label="Google Project ID">
                  <input 
                    type="text" 
                    value={settings.googleProjectId || ''} 
                    onChange={e => setSettings(s => ({ ...s, googleProjectId: e.target.value }))}
                    placeholder="my-project-123"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Nano Banana Model Modus">
                  <div className="flex gap-2">
                    {[
                      { id: 'fast', label: 'Snel', desc: 'Direct resultaat' },
                      { id: 'thinking', label: 'Denken', desc: 'Betere kwaliteit' },
                      { id: 'pro', label: 'Pro', desc: 'Hoogste precisie' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSettings(s => ({ ...s, nanoBananaModel: m.id }))}
                        className={`
                          flex-1 p-3 rounded-xl border-2 text-left transition-all
                          ${settings.nanoBananaModel === m.id 
                            ? 'border-yellow-500 bg-yellow-50 shadow-sm' 
                            : 'border-gray-100 bg-white hover:border-gray-200'}
                        `}
                      >
                        <p className={`text-xs font-black uppercase tracking-wider ${settings.nanoBananaModel === m.id ? 'text-yellow-700' : 'text-gray-400'}`}>
                          {m.label}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <Field label="Voorkeurs Tekst Provider">
                <div className="flex gap-4">
                  {['openai', 'groq', 'google'].map(p => (
                    <label key={p} className="flex-1 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="provider" 
                        className="hidden" 
                        checked={settings.preferredProvider === p}
                        onChange={() => setSettings(s => ({ ...s, preferredProvider: p }))}
                      />
                      <div className={`
                        p-4 rounded-xl border-2 text-center transition-all
                        ${settings.preferredProvider === p 
                          ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' 
                          : 'border-gray-100 bg-gray-50 text-gray-400 group-hover:border-gray-200'}
                      `}>
                        <span className="text-sm font-black uppercase tracking-widest">{p}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Voorkeurs Image Provider">
                <div className="flex gap-4">
                  {[
                    { id: 'openai', label: 'OpenAI' },
                    { id: 'google', label: 'Nano Banana' },
                    { id: 'pollinations', label: 'Gratis AI' }
                  ].map(p => (
                    <label key={p.id} className="flex-1 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="imageProvider" 
                        className="hidden" 
                        checked={settings.preferredImageProvider === p.id}
                        onChange={() => setSettings(s => ({ ...s, preferredImageProvider: p.id }))}
                      />
                      <div className={`
                        p-4 rounded-xl border-2 text-center transition-all
                        ${settings.preferredImageProvider === p.id 
                          ? 'border-violet-500 bg-violet-50 text-violet-600 shadow-sm' 
                          : 'border-gray-100 bg-gray-50 text-gray-400 group-hover:border-gray-200'}
                      `}>
                        <span className="text-sm font-black uppercase tracking-widest">{p.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-900">Beveiliging</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              De API keys worden veilig opgeslagen in de database. Deel deze nooit met onbevoegden. 
              Bij het opslaan worden de keys direct geactiveerd voor alle AI-functies.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={saving}
            className={`
              flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black text-white transition-all active:scale-95
              ${saved ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-blue-600 shadow-lg shadow-blue-600/30 hover:bg-blue-700'}
            `}
          >
            {saved ? <><CheckCircle size={18} /> Opgeslagen!</> : saving ? <>Opslaan...</> : <><Save size={18} /> Instellingen Opslaan</>}
          </button>
        </div>
      </form>
    </div>
  );
}
