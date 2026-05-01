import React, { useState, useRef, useEffect } from 'react';
import api, { getMediaUrl } from '../lib/api';
import { Upload, X, Loader2, Wand2, Sparkles } from 'lucide-react';
import { errorText } from '../lib/errorText';

export default function ImageUploader({ value, onChange, label = 'Afbeelding', height = 'h-44' }) {
  const [imgPreview, setImgPreview] = useState(value ? getMediaUrl(value) : null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    setImgPreview(value ? getMediaUrl(value) : null);
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
          <div className="relative">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Schrijf een prompt om de afbeelding te verbeteren..."
              className="w-full pl-4 pr-12 py-2.5 bg-violet-50 border border-violet-100 rounded-xl text-sm focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-violet-300"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAiImprove())}
            />
            <button
              type="button"
              onClick={handleAiImprove}
              disabled={!aiPrompt.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 disabled:bg-violet-200 transition-colors"
              title="Verbeter met AI"
            >
              <Wand2 size={14} />
            </button>
          </div>
          <p className="text-[10px] text-violet-400 font-bold flex items-center gap-1">
            <Sparkles size={10} />
            Tip: "Maak de achtergrond professioneler" of "Verbeter de belichting"
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-bold">{error}</p>
      )}
    </div>
  );
}
