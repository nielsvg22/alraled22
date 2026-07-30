import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Save, CheckCircle, AlertCircle, Eye, Palette, Type, Building2, FileText } from 'lucide-react';

const SECTIONS = {
  colors: { label: 'Kleuren', icon: Palette },
  company: { label: 'Bedrijfsgegevens', icon: Building2 },
  texts: { label: 'Teksten', icon: Type },
  notes: { label: 'Opmerkingen', icon: FileText },
};

const COLOR_FIELDS = [
  { key: 'ink', label: 'Tekstkleur' },
  { key: 'paper', label: 'Achtergrond' },
  { key: 'surface', label: 'Oppervlak accent' },
  { key: 'blue', label: 'Primaire kleur' },
  { key: 'blueDark', label: 'Donkere accent' },
  { key: 'glow', label: 'LED gloed kleur' },
  { key: 'line', label: 'Lijn kleur' },
  { key: 'muted', label: 'Subtiele tekst' },
];

const COMPANY_FIELDS = [
  { key: 'name', label: 'Bedrijfsnaam' },
  { key: 'address', label: 'Adres' },
  { key: 'postcode', label: 'Postcode & Stad' },
  { key: 'phone', label: 'Telefoon' },
  { key: 'email', label: 'E-mail' },
  { key: 'website', label: 'Website' },
  { key: 'logo', label: 'Logo URL' },
];

const TEXT_FIELDS = [
  { key: 'docLabel', label: 'Document type' },
  { key: 'fromLabel', label: '"Van" label' },
  { key: 'toLabel', label: '"Aan" label' },
  { key: 'itemsLabel', label: 'Kolom: Omschrijving' },
  { key: 'qtyLabel', label: 'Kolom: Aantal' },
  { key: 'unitPriceLabel', label: 'Kolom: Prijs p/st' },
  { key: 'totalLabel', label: 'Kolom: Totaal' },
  { key: 'subtotalLabel', label: 'Subtotaal label' },
  { key: 'vatLabel', label: 'BTW label' },
  { key: 'grandTotalLabel', label: 'Totaal label' },
  { key: 'notesLabel', label: 'Opmerkingen label' },
  { key: 'validUntil', label: 'Geldigheid' },
  { key: 'signatureLeftLabel', label: 'Handtekening links' },
  { key: 'signatureRightLabel', label: 'Handtekening rechts' },
  { key: 'signatureLine', label: 'Handtekening lijn tekst' },
  { key: 'footerDisclaimer', label: 'Footer disclaimer' },
];

export default function QuoteDesign() {
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');
  const iframeRef = useRef(null);

  useEffect(() => {
    api.get('/quotes/design')
      .then(r => { setDesign(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/quotes/design', design);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const loadPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await api.post('/quotes/design/preview', design, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Preview mislukt:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const updateColor = (key, value) => {
    setDesign(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const updateCompany = (key, value) => {
    setDesign(prev => ({ ...prev, company: { ...prev.company, [key]: value } }));
  };

  const updateText = (key, value) => {
    setDesign(prev => ({ ...prev, texts: { ...prev.texts, [key]: value } }));
  };

  const updateNotes = (value) => {
    setDesign(prev => ({ ...prev, notes: value }));
  };

  if (loading || !design) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offerte Design</h1>
          <p className="text-sm text-gray-500 mt-1">Pas het uiterlijk van je offertes aan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadPreview} disabled={previewLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50">
            <Eye className="w-4 h-4" /> {previewLoading ? 'Laden...' : 'Voorbeeld'}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {Object.entries(SECTIONS).map(([key, section]) => {
              const Icon = section.icon;
              return (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all flex-1 justify-center ${activeTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{section.label}</span>
                </button>
              );
            })}
          </div>

          {/* Colors */}
          {activeTab === 'colors' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Kleurenpalet</h3>
              <div className="grid grid-cols-2 gap-4">
                {COLOR_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <input type="color" value={design.colors[field.key]}
                      onChange={e => updateColor(field.key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{field.label}</p>
                      <p className="text-xs text-gray-400 font-mono">{design.colors[field.key]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company */}
          {activeTab === 'company' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Bedrijfsgegevens</h3>
              {COMPANY_FIELDS.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{field.label}</label>
                  <input type="text" value={design.company[field.key] || ''}
                    onChange={e => updateCompany(field.key, e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all" />
                </div>
              ))}
            </div>
          )}

          {/* Texts */}
          {activeTab === 'texts' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Teksten & Labels</h3>
              {TEXT_FIELDS.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{field.label}</label>
                  <input type="text" value={design.texts[field.key] || ''}
                    onChange={e => updateText(field.key, e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all" />
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {activeTab === 'notes' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Standaard opmerkingen</h3>
              <textarea value={design.notes || ''} onChange={e => updateNotes(e.target.value)} rows={5}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all resize-none" />
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Voorbeeld</h3>
            <button onClick={loadPreview} disabled={previewLoading}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50">
              {previewLoading ? 'Laden...' : 'Vernieuwen'}
            </button>
          </div>
          <div className="p-4 bg-gray-100 min-h-[600px] flex items-center justify-center">
            {previewUrl ? (
              <iframe ref={iframeRef} src={previewUrl} className="w-full h-[700px] bg-white rounded-lg shadow-lg" title="Offerte voorbeeld" />
            ) : (
              <div className="text-center text-gray-400 space-y-2">
                <Eye className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm">Klik op "Voorbeeld" om een preview te laden</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
