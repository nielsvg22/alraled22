import React, { useEffect, useMemo, useRef, useState } from 'react';
import api, { getMediaUrl } from '../lib/api';
import { Upload, X, Loader2, Wand2, Sparkles, ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from 'lucide-react';
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

function normalizeImages(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map((url) => String(url || '').trim())
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

export default function ImageUploader({ value, onChange, label = 'Afbeelding', height = 'h-44', multiple = false }) {
  const images = useMemo(() => normalizeImages(multiple ? value : value ? [value] : []), [multiple, value]);
  const activeValue = images[0] || '';
  const [imgPreview, setImgPreview] = useState(activeValue ? getMediaUrl(activeValue) : null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('AI');
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setImgPreview(activeValue ? getMediaUrl(activeValue) : null);
    api.get('/content/ai_settings').then(r => {
      if (r.data?.preferredImageProvider) {
        const p = r.data.preferredImageProvider;
        setProvider(p === 'openai' ? 'ChatGPT' : p === 'google' ? 'Nano Banana' : p === 'stabilityai' ? 'Stability AI' : p === 'replicate' ? 'Replicate' : 'AI');
      }
    }).catch(() => {});
  }, [activeValue]);

  const emit = (nextImages) => {
    const cleaned = normalizeImages(nextImages);
    onChange(multiple ? cleaned : cleaned[0] || '');
  };

  const handleFileChange = async (files) => {
    const selected = Array.from(files || []);
    if (selected.length === 0) return;

    const localUrl = URL.createObjectURL(selected[0]);
    setImgPreview(localUrl);
    setUploading(true);
    setError('');

    try {
      const uploaded = [];
      for (const file of selected) {
        const fd = new FormData();
        fd.append('image', file);
        const r = await api.post('/uploads', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploaded.push(r.data.url);
      }
      emit(multiple ? [...images, ...uploaded] : uploaded.slice(-1));
    } catch (err) {
      setError(errorText(err, 'Uploaden mislukt'));
      setImgPreview(activeValue ? getMediaUrl(activeValue) : null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const updateImageAt = (index, url) => {
    const next = [...images];
    next[index] = url;
    emit(next);
  };

  const handleAiImprove = async () => {
    if (!activeValue || !aiPrompt.trim()) return;

    setAiLoading(true);
    setError('');
    try {
      const r = await api.post('/products/improve-image', {
        imageUrl: activeValue,
        prompt: aiPrompt.trim()
      });
      updateImageAt(0, r.data.url);
      setAiPrompt('');
    } catch (err) {
      setError(errorText(err, 'AI verbetering mislukt'));
    } finally {
      setAiLoading(false);
    }
  };

  const removeImage = (index = 0) => {
    emit(images.filter((_, i) => i !== index));
    setAiPrompt('');
    setError('');
  };

  const moveImage = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    emit(next);
  };

  const setPrimary = (index) => {
    if (index === 0) return;
    const next = [...images];
    const [selected] = next.splice(index, 1);
    emit([selected, ...next]);
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
            {multiple && images.length > 1 && (
              <div className="absolute left-2 top-2 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-black text-white">
                Hoofdfoto
              </div>
            )}

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
                onClick={() => removeImage(0)}
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
            {multiple && <p className="text-[10px] font-bold text-gray-300">Meerdere foto's tegelijk mogelijk</p>}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files)}
      />

      {multiple && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || aiLoading}
            className="w-full py-2.5 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 text-xs font-black text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            + Foto's toevoegen
          </button>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, index) => (
                <div key={`${url}-${index}`} className={`relative aspect-square rounded-xl overflow-hidden border group/thumb ${index === 0 ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'}`}>
                  <img src={getMediaUrl(url)} alt={`Productfoto ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                    <div className="flex justify-between gap-1">
                      <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="w-6 h-6 rounded-lg bg-white/90 text-gray-700 disabled:opacity-40 flex items-center justify-center">
                        <ArrowLeft size={12} />
                      </button>
                      <button type="button" onClick={() => removeImage(index)} className="w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center">
                        <X size={12} />
                      </button>
                      <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="w-6 h-6 rounded-lg bg-white/90 text-gray-700 disabled:opacity-40 flex items-center justify-center">
                        <ArrowRight size={12} />
                      </button>
                    </div>
                    <button type="button" onClick={() => setPrimary(index)} className="rounded-lg bg-white/90 px-2 py-1 text-[9px] font-black text-gray-700 disabled:opacity-80" disabled={index === 0}>
                      {index === 0 ? 'Hoofdfoto' : 'Maak hoofdfoto'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeValue && !uploading && !aiLoading && (
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
