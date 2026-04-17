import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Save, RotateCcw } from 'lucide-react';

const DEFAULTS = {
  primary:   '#0c4684',
  secondary: '#0c4684',
  accent:    '#fcd34d',
  bg:        '#ffffff',
  surface:   '#f9fafb',
  textColor: '#0f172a',
  textMuted: '#6b7280',
};

const PRESETS = [
  { name: 'ALRA Origineel',   primary: '#0c4684', secondary: '#0c4684', accent: '#fcd34d', bg: '#ffffff', surface: '#f9fafb', textColor: '#0f172a', textMuted: '#6b7280' },
  { name: 'Oranje Glow',      primary: '#f97316', secondary: '#1e293b', accent: '#fbbf24', bg: '#ffffff', surface: '#f8fafc', textColor: '#0f172a', textMuted: '#64748b' },
  { name: 'Groen Industrieel', primary: '#16a34a', secondary: '#1e293b', accent: '#bbf7d0', bg: '#ffffff', surface: '#f0fdf4', textColor: '#0f172a', textMuted: '#6b7280' },
  { name: 'Rood Bold',         primary: '#dc2626', secondary: '#111827', accent: '#fca5a5', bg: '#ffffff', surface: '#fef2f2', textColor: '#0f172a', textMuted: '#6b7280' },
  { name: 'Paars Premium',     primary: '#7c3aed', secondary: '#1e1b4b', accent: '#c4b5fd', bg: '#ffffff', surface: '#f5f3ff', textColor: '#0f172a', textMuted: '#6b7280' },
  { name: 'Dark Mode',         primary: '#f59e0b', secondary: '#f8fafc', accent: '#fbbf24', bg: '#0f172a', surface: '#1e293b', textColor: '#f8fafc', textMuted: '#94a3b8' },
];

const FIELDS = [
  { key: 'primary',   label: 'Primaire kleur',       desc: 'Knoppen, badges, highlights, links' },
  { key: 'secondary', label: 'Secundaire kleur',      desc: 'Achtergronden, headers, donkere vlakken' },
  { key: 'accent',    label: 'Accentkleur',            desc: 'Decoratieve elementen, hover-states' },
  { key: 'bg',        label: 'Achtergrond pagina',    desc: 'Algemene pagina-achtergrond' },
  { key: 'surface',   label: 'Achtergrond kaarten',   desc: 'Kaarten, invoervelden, secties' },
  { key: 'textColor', label: 'Hoofdtekst kleur',      desc: 'Titels en primaire tekst' },
  { key: 'textMuted', label: 'Subtekst kleur',         desc: 'Omschrijvingen en secundaire tekst' },
];

function hexToRgbVars(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function applyThemeLive(theme) {
  const root = document.documentElement;
  if (theme.primary)   root.style.setProperty('--color-primary',    hexToRgbVars(theme.primary));
  if (theme.secondary) root.style.setProperty('--color-secondary',  hexToRgbVars(theme.secondary));
  if (theme.accent)    root.style.setProperty('--color-accent',     hexToRgbVars(theme.accent));
  if (theme.bg)        root.style.setProperty('--color-bg',         hexToRgbVars(theme.bg));
  if (theme.surface)   root.style.setProperty('--color-surface',    hexToRgbVars(theme.surface));
  if (theme.textColor) root.style.setProperty('--color-text',       hexToRgbVars(theme.textColor));
  if (theme.textMuted) root.style.setProperty('--color-text-muted', hexToRgbVars(theme.textMuted));
}

export default function Theme() {
  const [theme, setTheme]   = useState(DEFAULTS);
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/content/theme')
      .then(res => setTheme({ ...DEFAULTS, ...res.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback((key, value) => {
    const next = { ...theme, [key]: value };
    setTheme(next);
  }, [theme]);

  const applyPreset = (preset) => {
    const { name, ...colors } = preset;
    setTheme(colors);
  };

  const handleSave = async () => {
    await api.put('/content/theme', theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => setTheme(DEFAULTS);

  if (loading) return <div className="p-8 text-gray-400 text-sm">Laden...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Thema &amp; Kleuren</h1>
          <p className="text-sm text-gray-400 mt-0.5">Pas alle kleuren van de website aan. Wijzigingen zijn direct zichtbaar.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleSave} className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            <Save className="w-4 h-4" />
            {saved ? 'Opgeslagen!' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Live preview bar */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live voorbeeld</p>
        </div>
        <div className="p-6 flex flex-wrap gap-3 items-center" style={{ backgroundColor: `rgb(${hexToRgbVars(theme.bg)})` }}>
          <div className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: `rgb(${hexToRgbVars(theme.primary)})` }}>
            Primaire knop
          </div>
          <div className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: `rgb(${hexToRgbVars(theme.secondary)})` }}>
            Secondaire knop
          </div>
          <div className="px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: `rgb(${hexToRgbVars(theme.surface)})`, color: `rgb(${hexToRgbVars(theme.textColor)})`, border: `1px solid rgb(${hexToRgbVars(theme.textMuted)} / 0.2)` }}>
            Kaart element
          </div>
          <span className="text-sm font-bold" style={{ color: `rgb(${hexToRgbVars(theme.textColor)})` }}>Hoofdtekst</span>
          <span className="text-sm" style={{ color: `rgb(${hexToRgbVars(theme.textMuted)})` }}>Subtekst / omschrijving</span>
          <span className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: `rgb(${hexToRgbVars(theme.accent)})` }} title="Accent" />
        </div>
      </div>

      {/* Presets */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b bg-gray-50">
          <h3 className="font-bold text-gray-600 text-xs uppercase tracking-widest">Kleurpresets</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESETS.map(preset => (
            <button key={preset.name} onClick={() => applyPreset(preset)}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group">
              <div className="flex gap-1 shrink-0">
                {['primary', 'secondary', 'accent'].map(k => (
                  <span key={k} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset[k] }} />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color pickers */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b bg-gray-50">
          <h3 className="font-bold text-gray-600 text-xs uppercase tracking-widest">Kleuren aanpassen</h3>
        </div>
        <div className="p-6 space-y-1">
          {FIELDS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 -mx-2 px-2 rounded-xl transition-colors">
              {/* Color swatch + picker */}
              <label className="relative shrink-0 cursor-pointer">
                <div className="w-10 h-10 rounded-xl border-2 border-gray-200 group-hover:border-blue-300 transition-colors shadow-sm overflow-hidden"
                  style={{ backgroundColor: theme[key] }}>
                  <input
                    type="color"
                    value={theme[key]}
                    onChange={e => update(key, e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </label>
              {/* Labels */}
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              {/* Hex input */}
              <input
                type="text"
                value={theme[key]}
                onChange={e => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) update(key, v);
                }}
                className="w-24 text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Klik op een kleurblokje of voer een HEX-code in. Druk op <strong>Opslaan</strong> om de kleuren live te zetten op de website.
      </p>
    </div>
  );
}
