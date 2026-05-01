import React, { useState, useRef, useEffect } from 'react';
import api, { getMediaUrl } from '../lib/api';
import { Upload, X, Loader2, Wand2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { errorText } from '../lib/errorText';

const QUICK_PROMPTS = [
  { label: '⬜ Witte achtergrond', prompt: 'Witte achtergrond, professionele studio-opname' },
  { label: '💡 Betere belichting', prompt: 'Verbeter de belichting, zachte studio verlichting, geen harde schaduwen' },
  { label: '🎯 Scherper beeld', prompt: 'Maak het beeld scherper, hoge resolutie, meer detail' },
  { label: '🛍️ E-commerce stijl', prompt: 'Professionele e-commerce productfoto, clean en minimalistisch' },
  { label: '🌑 Schaduw toevoegen', prompt: 'Voeg een subtiele zachte schaduw toe onder het product' },
  { label: '✨ Premium uitstraling', prompt: 'Luxe premium uitstraling, high-end productfotografie' },
  { label: '🔲 Transparante achtergrond', prompt: 'Verwijder de achtergrond, transparant PNG' },
  { label: '📐 Product centreren', prompt: 'Centreer het product, meer witruimte rondom, schone compositie' },
];

export default function ImageUploader({ value, onChange, label = 'Afbeelding', height = 'h-44' }) {
  const [imgPreview, setImgPreview] = useState(value ? getMediaUrl(value) : null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('AI');
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setImgPreview(value ? getMediaUrl(value) : null);
    api.get('/content/ai_settings').then(r => {
      if (r.data?.preferredImageProvider) {
        const p = r.data.preferredImageProvider;
        setProvider(p === 'openai' ? 'ChatGPT' : p === 'google' ? 'Nano Banana' : p === 'stabilityai' ? 'Stability AI' : p === 'replicate' ? 'Replicate' : 'AI');
      }
    }).catch(() => {});
  }, [value]);

  const handleFileChange = async (file) => {
    if (!file) return;
    
    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setImgPreview(localUrl);
    setUploading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post('/uploads', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      onChange(r.data.url);
    } catch (err) {
      setError(errorText(err, 'Uploaden mislukt'));
      setImgPreview(value ? getMediaUrl(value) : null);
    } finally {
      setUploading(false);
    }
  };

  const handleAiImprove = async () => {
    if (!value || !aiPrompt.trim()) return;
    
    setAiLoading(true);
    setError('');
    try {
      // Using the existing product-based endpoint for now as it's already there
      const r = await api.post('/products/improve-image', { 
        imageUrl: value, 
        prompt: aiPrompt.trim() 
      });
      onChange(r.data.url);
      setAiPrompt('');
    } catch (err) {
      setError(errorText(err, 'AI verbetering mislukt'));
    } finally {
      setAiLoading(false);
    }
  };

  const removeImage = () => {
    onChange('');
    setImgPreview(null);
    setAiPrompt('');
    setError('');
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
          {label}
        </label>
      )}
      
      <div className={`relative w-full ${height} rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group`}>
        {imgPreview ? (
          <>
            <img src={imgPreview} alt="Preview" className="w-full h-full object-cover" />
            
            {(uploading || aiLoading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-xs font-bold text-gray-600">
                    {uploading ? 'Uploaden...' : 'AI verbetert...'}
                  </span>
                </div>
              </div>
            )}

            {!uploading && !aiLoading && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Upload size={20} />
            </div>
            <p className="text-xs font-bold text-gray-400">Klik om te uploaden</p>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />

      {value && !uploading && !aiLoading && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} /> AI Verbetering via {provider}
            </p>
            <button
              type="button"
              onClick={() => setShowQuickPrompts(v => !v)}
              className="text-[10px] text-violet-400 hover:text-violet-600 font-bold flex items-center gap-0.5 transition-colors"
            >
              Snelknoppen {showQuickPrompts ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {showQuickPrompts && (
            <div className="grid grid-cols-2 gap-1.5 pb-1">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => { setAiPrompt(q.prompt); setShowQuickPrompts(false); }}
                  className="text-left px-3 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-xl text-[11px] font-bold text-violet-700 transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={`Beschrijf de aanpassing...`}
              className="w-full pl-4 pr-12 py-2.5 bg-violet-50 border border-violet-100 rounded-xl text-sm focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-violet-300"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAiImprove())}
            />
            <button
              type="button"
              onClick={handleAiImprove}
              disabled={!aiPrompt.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 disabled:bg-violet-200 transition-colors"
              title={`Verbeter met ${provider}`}
            >
              <Wand2 size={14} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-bold">{error}</p>
      )}
    </div>
  );
}
