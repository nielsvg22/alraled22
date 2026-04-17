import React, { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import { Sparkles, Send, RotateCcw, Copy, Check, Loader2, Wand2, FileText, MessageSquare, Globe, Save, CheckCircle } from 'lucide-react';

const TOOLS = [
  {
    id: 'website',
    icon: <Globe className="w-4 h-4" />,
    label: 'Website Blok',
    desc: 'Kies een sectie op de website — AI schrijft de content en je slaat hem direct op.',
  },
  {
    id: 'product',
    icon: <Wand2 className="w-4 h-4" />,
    label: 'Productomschrijving',
    desc: 'Geef een productnaam en categorie — AI schrijft een professionele omschrijving.',
  },
  {
    id: 'pagetext',
    icon: <FileText className="w-4 h-4" />,
    label: 'Paginatekst',
    desc: 'Laat AI een stuk webtekst schrijven voor hero\'s, intro\'s, CTA\'s en meer.',
  },
  {
    id: 'chat',
    icon: <MessageSquare className="w-4 h-4" />,
    label: 'AI Assistent',
    desc: 'Vrij gesprek: stel vragen, vraag om e-mails, offerteteksten, SEO-teksten...',
  },
];

const SECTIONS = [
  { key: 'hero',            label: 'Hero — bovenste sectie',         contentKey: 'home',   mergeKey: 'hero' },
  { key: 'introSection',    label: 'Intro sectie — Over ALRA LED',   contentKey: 'home',   mergeKey: 'introSection' },
  { key: 'specializations', label: 'Specialisaties — kaartjes',      contentKey: 'home',   mergeKey: 'specializations' },
  { key: 'stats',           label: 'Statistieken / cijfers',         contentKey: 'home',   mergeKey: 'stats' },
  { key: 'process',         label: 'Ontwikkeling / Process',         contentKey: 'home',   mergeKey: 'process' },
  { key: 'cta',             label: 'Call-to-action sectie',          contentKey: 'home',   mergeKey: 'cta' },
  { key: 'about',           label: 'Over Ons pagina',                contentKey: 'about',  mergeKey: null },
];

const TONE_OPTIONS = ['Professioneel', 'Vriendelijk', 'Overtuigend', 'Zakelijk', 'Enthousiast'];
const LENGTH_OPTIONS = ['kort', 'normaal', 'lang'];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} title="Kopiëren"
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
      {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Gekopieerd</> : <><Copy className="w-3.5 h-3.5" /> Kopiëren</>}
    </button>
  );
}

function ResultBox({ text, loading }) {
  if (loading) return (
    <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-5 flex items-center gap-3 text-gray-400">
      <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
      <span className="text-sm">AI is aan het schrijven...</span>
    </div>
  );
  if (!text) return null;
  return (
    <div className="mt-4 bg-violet-50 border border-violet-100 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> AI resultaat
        </span>
        <CopyButton text={text} />
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

// ── WEBSITE BLOCK TOOL ────────────────────────────────────
function WebsiteBlockTool() {
  const [sectionKey, setSectionKey] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const section = SECTIONS.find(s => s.key === sectionKey);

  const generate = async () => {
    if (!sectionKey || !description.trim()) return;
    setLoading(true); setResult(null); setError(''); setSaved(false);
    try {
      const res = await api.post('/ai/website-block', { sectionKey, description });
      setResult(res.data.result);
    } catch (err) {
      setError(err.response?.data?.error || 'Mislukt. Controleer je GROQ_API_KEY in .env');
    } finally { setLoading(false); }
  };

  const saveToWebsite = async () => {
    if (!result || !section) return;
    setSaving(true);
    try {
      // Load current content first, then merge the generated block
      const current = await api.get(`/content/${section.contentKey}`).then(r => r.data).catch(() => ({}));
      const updated = section.mergeKey
        ? { ...current, [section.mergeKey]: result }
        : { ...current, ...result };
      await api.put(`/content/${section.contentKey}`, updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Opslaan mislukt: ' + (err.response?.data?.error || err.message));
    } finally { setSaving(false); }
  };

  const renderPreview = (data) => {
    if (Array.isArray(data)) {
      return (
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={i} className="bg-white border border-violet-100 rounded-lg px-4 py-2.5 text-sm text-gray-700">
              {Object.entries(item).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-xs font-bold text-violet-400 w-24 shrink-0">{k}:</span>
                  <span className="text-gray-700">{String(v)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="space-y-2">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex gap-2 bg-white border border-violet-100 rounded-lg px-4 py-2.5">
              <span className="text-xs font-bold text-violet-400 w-32 shrink-0">{k}:</span>
              <span className="text-sm text-gray-700 break-words">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-sm text-gray-700">{String(data)}</p>;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sectie op de website *</label>
        <select value={sectionKey} onChange={e => { setSectionKey(e.target.value); setResult(null); setSaved(false); }}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors bg-white">
          <option value="">— Kies een sectie —</option>
          {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Wat wil je dat er staat? *</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          placeholder="bv. 'Schrijf een krachtige hero met focus op bouwplaatsverlichting, pakkende slogan, CTA knop naar offerte pagina'"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors resize-none" />
      </div>

      <div className="flex gap-2">
        <button onClick={generate} disabled={!sectionKey || !description.trim() || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Genereren...' : 'Genereer content'}
        </button>
        {result && <button onClick={() => { setResult(null); setSaved(false); }} className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <RotateCcw className="w-3.5 h-3.5" /> Wis
        </button>}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      {loading && (
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-5 flex items-center gap-3 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
          <span className="text-sm">AI genereert content voor <strong>{section?.label}</strong>...</span>
        </div>
      )}

      {result && !loading && (
        <div className="mt-2 bg-violet-50 border border-violet-100 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Gegenereerde content — {section?.label}
            </span>
            <CopyButton text={result} />
          </div>

          {renderPreview(result)}

          <div className="pt-2 border-t border-violet-100 flex items-center gap-3">
            <button onClick={saveToWebsite} disabled={saving || saved}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${saved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'} disabled:opacity-60`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Opslaan...' : saved ? 'Opgeslagen op website!' : 'Opslaan op website'}
            </button>
            {saved && <span className="text-xs text-green-600 font-semibold">Ga naar de website om het resultaat te bekijken.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PRODUCT TOOL ─────────────────────────────────────────
function ProductTool() {
  const [name, setName]         = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [result, setResult]     = useState('');
  const [loading, setLoading]   = useState(false);

  const generate = async () => {
    if (!name.trim()) return;
    setLoading(true); setResult('');
    try {
      const res = await api.post('/ai/product-description', { name, category, keywords });
      setResult(res.data.result);
    } catch (err) {
      setResult('❌ ' + (err.response?.data?.error || 'Mislukt. Controleer GROQ_API_KEY in .env'));
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Productnaam *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="bv. LED Werkbalk Pro 48W"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Categorie</label>
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="bv. Bedrijfswagens"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Extra trefwoorden <span className="font-normal normal-case text-gray-400">(optioneel)</span></label>
        <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="bv. waterdicht, IP67, 5 jaar garantie"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors" />
      </div>
      <div className="flex gap-2">
        <button onClick={generate} disabled={!name.trim() || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Genereren...' : 'Genereer omschrijving'}
        </button>
        {result && <button onClick={() => setResult('')} className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <RotateCcw className="w-3.5 h-3.5" /> Wis
        </button>}
      </div>
      <ResultBox text={result} loading={loading} />
    </div>
  );
}

// ── PAGETEXT TOOL ─────────────────────────────────────────
function PageTextTool() {
  const [section, setSection]   = useState('');
  const [context, setContext]   = useState('');
  const [tone, setTone]         = useState('Professioneel');
  const [length, setLength]     = useState('normaal');
  const [result, setResult]     = useState('');
  const [loading, setLoading]   = useState(false);

  const generate = async () => {
    if (!section.trim()) return;
    setLoading(true); setResult('');
    try {
      const res = await api.post('/ai/page-text', { section, context, tone, length });
      setResult(res.data.result);
    } catch (err) {
      setResult('❌ ' + (err.response?.data?.error || 'Mislukt. Controleer GROQ_API_KEY in .env'));
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sectie *</label>
        <input value={section} onChange={e => setSection(e.target.value)} placeholder="bv. Hero introductie, Over ons, CTA knoptekst"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Context <span className="font-normal normal-case text-gray-400">(optioneel)</span></label>
        <textarea value={context} onChange={e => setContext(e.target.value)} rows={2}
          placeholder="bv. Wij zijn 10 jaar actief, CE gecertificeerd, specialist in bedrijfswagenverlichting"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors resize-none" />
      </div>
      <div className="flex flex-wrap gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Toon</label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${tone === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lengte</label>
          <div className="flex gap-2">
            {LENGTH_OPTIONS.map(l => (
              <button key={l} onClick={() => setLength(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${length === l ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={generate} disabled={!section.trim() || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Schrijven...' : 'Schrijf tekst'}
        </button>
        {result && <button onClick={() => setResult('')} className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <RotateCcw className="w-3.5 h-3.5" /> Wis
        </button>}
      </div>
      <ResultBox text={result} loading={loading} />
    </div>
  );
}

// ── CHAT TOOL ─────────────────────────────────────────────
function ChatTool() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hoi! Ik ben je AI-assistent voor ALRA LED Solutions. Vraag me om productteksten, e-mails, offerteteksten, SEO-copy of wat je maar nodig hebt. 🚀' }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = [...messages, userMsg].filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0);
      const res = await api.post('/ai/chat', { messages: history });
      setMessages(m => [...m, { role: 'assistant', content: res.data.result }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: '❌ ' + (err.response?.data?.error || 'Mislukt. Controleer GROQ_API_KEY in .env') }]);
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const SUGGESTIONS = ['Schrijf een welkomst-e-mail voor nieuwe klanten', 'Geef 5 ideeën voor productnamen voor LED-bouwverlichting', 'Schrijf een SEO-tekst over LED-hefbrugverlichting'];

  return (
    <div className="flex flex-col h-[520px]">
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs shrink-0 mr-2 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-gray-900 text-white rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'assistant' && i > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <CopyButton text={msg.content} />
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs shrink-0 mr-2">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 py-3">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setInput(s)}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-violet-100 hover:text-violet-700 text-gray-600 rounded-full transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={2}
          placeholder="Stel een vraag of geef een opdracht... (Enter = verstuur)"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors resize-none"
        />
        <button onClick={send} disabled={!input.trim() || loading}
          className="px-4 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function AIAssistant() {
  const [activeTool, setActiveTool] = useState('website');
  const active = TOOLS.find(t => t.id === activeTool);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">AI Assistent</h1>
          <p className="text-sm text-gray-400">Laat AI teksten schrijven en direct opslaan op de website.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TOOLS.map(tool => (
          <button key={tool.id} onClick={() => setActiveTool(tool.id)}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${activeTool === tool.id
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-100 bg-white hover:border-gray-200'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${activeTool === tool.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {tool.icon}
            </div>
            <p className="text-sm font-bold text-gray-700">{tool.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{tool.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center">{active?.icon}</div>
          <h3 className="font-bold text-gray-700 text-sm">{active?.label}</h3>
        </div>
        <div className="p-6">
          {activeTool === 'website'  && <WebsiteBlockTool />}
          {activeTool === 'product'  && <ProductTool />}
          {activeTool === 'pagetext' && <PageTextTool />}
          {activeTool === 'chat'     && <ChatTool />}
        </div>
      </div>
    </div>
  );
}
