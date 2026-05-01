import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Save, Sparkles, CheckCircle, AlertTriangle, Key, Loader2 } from 'lucide-react';

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
    replicateApiKey: '',
    stabilityAiKey: '',
    chatgptAccessToken: '',
    preferredProvider: 'groq',
    preferredImageProvider: 'pollinations',
    nanoBananaModel: 'fast'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

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

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Sla eerst op zodat we de nieuwste keys testen
      await api.put('/content/ai_settings', settings);
      const r = await api.post('/ai/test-connection');
      setTestResult({ ok: true, msg: r.data.result });
    } catch (err) {
      setTestResult({ ok: false, msg: err.response?.data?.error || 'Verbinding mislukt' });
    } finally {
      setTesting(false);
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
              <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                🔮 Replicate ($5 gratis credits)
              </h4>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
                <p className="text-xs text-purple-700 font-bold mb-1">🎨 Echte beeldbewerking!</p>
                <p className="text-[10px] text-purple-600 leading-relaxed">
                  Replicate biedt $5 gratis credits voor Stable Diffusion img2img. 
                  Hiermee kun je je productfoto's écht bewerken met AI (niet alleen genereren). 
                  ~100-200 afbeeldingen gratis! Maak een account aan op <a href="https://replicate.com/account/api-tokens" target="_blank" className="underline font-bold">replicate.com/account/api-tokens</a>
                </p>
              </div>
              <Field 
                label="Replicate API Key" 
                hint="Voor Stable Diffusion img2img beeldbewerking ($5 gratis credits)"
              >
                <input 
                  type="password" 
                  value={settings.replicateApiKey || ''} 
                  onChange={e => setSettings(s => ({ ...s, replicateApiKey: e.target.value }))}
                  placeholder="r8_..."
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                🎨 Stability AI (25 gratis credits)
              </h4>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
                <p className="text-xs text-emerald-700 font-bold mb-1">✨ Beste img2img kwaliteit!</p>
                <p className="text-[10px] text-emerald-600 leading-relaxed">
                  Stability AI is de maker van Stable Diffusion. 25 gratis credits voor nieuwe gebruikers.
                  Échte image-to-image bewerking met professionele resultaten! 
                  Maak een account aan op <a href="https://platform.stability.ai/" target="_blank" className="underline font-bold">platform.stability.ai</a>
                </p>
              </div>
              <Field 
                label="Stability AI API Key" 
                hint="Voor professionele img2img beeldbewerking (25 gratis credits)"
              >
                <input 
                  type="password" 
                  value={settings.stabilityAiKey || ''} 
                  onChange={e => setSettings(s => ({ ...s, stabilityAiKey: e.target.value }))}
                  placeholder="sk-..."
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-lg">🍌</span> Nano Banana (Google Gemini AI)
              </h4>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-xs text-blue-700 font-bold mb-1">💡 Tip: Gemini is GRATIS!</p>
                <p className="text-[10px] text-blue-600 leading-relaxed">
                  Je kunt gratis een API-key aanmaken via <a href="https://aistudio.google.com/" target="_blank" className="underline font-black">Google AI Studio</a>. 
                  Kies voor de "Free of charge" tier. Hiermee kan de AI je afbeeldingen analyseren om ze beter aan te passen!
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Gemini / Nano Banana API Key">
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

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                🟢 ChatGPT Plus Bridge (Persoonlijk Abonnement)
              </h4>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
                <p className="text-xs text-emerald-700 font-bold mb-1">🎨 DALL-E 3 Image Generation</p>
                <p className="text-[10px] text-emerald-600 leading-relaxed">
                  Met je ChatGPT Plus abonnement kun je nu ook afbeeldingen verbeteren via DALL-E 3! 
                  Zorg dat je een actief Plus abonnement hebt. De bridge gebruikt je eigen account voor AI tekst én beelden.
                </p>
              </div>
              <Field 
                label="ChatGPT Access Token" 
                hint={<>Haal je Access Token uit je browser op chatgpt.com (DevTools → Application → Cookies → __Secure-next-auth.session-token of uit de Authorization header in netwerkverzoeken). <a href="https://github.com/acheong08/ChatGPT-to-API/blob/main/README.md" target="_blank" className="underline font-bold text-blue-500">Hulp nodig?</a></>}
              >
                <textarea 
                  value={settings.chatgptAccessToken || ''} 
                  onChange={e => setSettings(s => ({ ...s, chatgptAccessToken: e.target.value }))}
                  placeholder="eyJhbGci..."
                  className={`${inputCls} h-24 font-mono text-[10px]`}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <Field label="Voorkeurs Tekst Provider">
                <div className="flex gap-4">
                  {[
                    { id: 'openai', label: 'OpenAI' },
                    { id: 'groq', label: 'Groq' },
                    { id: 'google', label: 'Google' },
                    { id: 'bridge', label: 'GPT Plus' }
                  ].map(p => (
                    <label key={p.id} className="flex-1 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="provider" 
                        className="hidden" 
                        checked={settings.preferredProvider === p.id}
                        onChange={() => setSettings(s => ({ ...s, preferredProvider: p.id }))}
                      />
                      <div className={`
                        p-4 rounded-xl border-2 text-center transition-all
                        ${settings.preferredProvider === p.id 
                          ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' 
                          : 'border-gray-100 bg-gray-50 text-gray-400 group-hover:border-gray-200'}
                      `}>
                        <span className="text-sm font-black uppercase tracking-widest">{p.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Voorkeurs Image Provider">
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'openai', label: 'OpenAI' },
                    { id: 'google', label: 'Nano Banana' },
                    { id: 'stabilityai', label: '🎨 Stability' },
                    { id: 'replicate', label: '🔮 Replicate' },
                    { id: 'bridge', label: 'GPT Plus' },
                    { id: 'pollinations', label: 'Pollinations' }
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
              
              <div className="mt-6 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-5">
                <h5 className="text-xs font-black text-violet-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> 💡 Tips voor betere resultaten
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-violet-700">
                  <div className="space-y-2">
                    <p className="font-bold">✅ Goede prompts:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>"Witte achtergrond, studio belichting"</li>
                      <li>"Verwijder achtergrond, transparant"</li>
                      <li>"Maak professionele productfoto, 4K"</li>
                      <li>"Voeg schaduw toe, luxe uitstraling"</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold">🎯 Beste providers voor editing:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li><strong>🎨 Stability AI</strong> - Echte img2img</li>
                      <li><strong>🍌 Nano Banana</strong> - Gratis img2img</li>
                      <li><strong>🔮 Replicate</strong> - Professioneel</li>
                      <li><strong>Pollinations</strong> - Alleen generatie</li>
                    </ul>
                  </div>
                </div>
              </div>
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

        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || saving}
              className={`
                px-6 py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center gap-2
                ${testing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}
              `}
            >
              {testing ? <><Loader2 className="w-4 h-4 animate-spin" /> Testen...</> : <><Sparkles size={18} /> Test AI Verbinding</>}
            </button>
            
            {testResult && (
              <div className={`text-xs font-bold px-4 py-2 rounded-lg animate-in fade-in slide-in-from-left-2 ${testResult.ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {testResult.ok ? `✅ Succes: ${testResult.msg}` : `❌ Fout: ${testResult.msg}`}
              </div>
            )}
          </div>

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
