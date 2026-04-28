import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Trash2, Plus, Sparkles, Loader2, Save, CheckCircle,
  ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Upload, X, Image,
} from 'lucide-react';
import { errorText } from '../lib/errorText';

const PAGES = [
  { key: 'home',    label: 'Homepagina',  icon: '🏠' },
  { key: 'about',   label: 'Over Ons',    icon: '👥' },
  { key: 'contact', label: 'Contact',     icon: '📬' },
  { key: 'blog',    label: 'Blog',        icon: '📝' },
];

const BLOCK_TYPES = [
  { key: 'banner',       label: 'Banner',             icon: '📣', desc: 'Brede balk met knop' },
  { key: 'text_block',   label: 'Tekstblok',          icon: '📝', desc: 'Koptekst + alinea' },
  { key: 'feature_grid', label: 'Voordelen grid',     icon: '⊞',  desc: 'Kaartjes met icoon' },
  { key: 'image_text',   label: 'Afbeelding + tekst', icon: '🖼️', desc: "Foto + tekst naast elkaar" },
  { key: 'stats_row',    label: 'Statistieken',       icon: '📊', desc: 'Rij met cijfers' },
  { key: 'cta_block',    label: 'Call-to-action',     icon: '🎯', desc: 'Knop sectie' },
  { key: 'steps',        label: 'Stappen',            icon: '🔢', desc: 'Genummerde stappen' },
  { key: 'blog_post',    label: 'Blogbericht',        icon: '📰', desc: 'Artikel met afbeelding' },
];

// ── Schema per block type (for edit form) ────────────────
const SCHEMAS = {
  banner:       [
    { key: 'heading',   type: 'text',     label: 'Koptekst' },
    { key: 'subtext',   type: 'textarea', label: 'Ondertekst' },
    { key: 'buttonText',type: 'text',     label: 'Knoptekst' },
    { key: 'bgColor',   type: 'color',    label: 'Achtergrondkleur' },
    { key: 'textColor', type: 'color',    label: 'Tekstkleur' },
  ],
  text_block:   [
    { key: 'heading', type: 'text',     label: 'Koptekst' },
    { key: 'body',    type: 'textarea', label: 'Tekst', rows: 6 },
  ],
  feature_grid: [
    { key: 'heading', type: 'text', label: 'Sectietitel' },
    { key: 'items', type: 'array', label: 'Items', subfields: [
      { key: 'icon',        type: 'text',     label: 'Icoon (emoji)' },
      { key: 'title',       type: 'text',     label: 'Titel' },
      { key: 'description', type: 'textarea', label: 'Beschrijving', rows: 2 },
    ]},
  ],
  image_text:   [
    { key: 'heading',       type: 'text',     label: 'Koptekst' },
    { key: 'body',          type: 'textarea', label: 'Tekst', rows: 4 },
    { key: 'imageUrl',      type: 'image',    label: 'Afbeelding' },
    { key: 'imagePosition', type: 'select',   label: 'Afbeeldingspositie', options: ['left', 'right'] },
  ],
  stats_row:    [
    { key: 'items', type: 'array', label: 'Statistieken', subfields: [
      { key: 'number', type: 'text', label: 'Getal / tekst' },
      { key: 'label',  type: 'text', label: 'Label' },
    ]},
  ],
  cta_block:    [
    { key: 'heading',         type: 'text',     label: 'Koptekst' },
    { key: 'subtext',         type: 'textarea', label: 'Ondertekst', rows: 2 },
    { key: 'primaryButton',   type: 'text',     label: 'Primaire knop' },
    { key: 'secondaryButton', type: 'text',     label: 'Secundaire knop' },
  ],
  steps:        [
    { key: 'heading', type: 'text', label: 'Sectietitel' },
    { key: 'items', type: 'array', label: 'Stappen', subfields: [
      { key: 'number',      type: 'text',     label: 'Nummer (bv. 01)' },
      { key: 'title',       type: 'text',     label: 'Titel' },
      { key: 'description', type: 'textarea', label: 'Beschrijving', rows: 2 },
    ]},
  ],
  blog_post:    [
    { key: 'title',    type: 'text',     label: 'Titel' },
    { key: 'excerpt',  type: 'textarea', label: 'Samenvatting', rows: 3 },
    { key: 'content',  type: 'textarea', label: 'Volledige inhoud', rows: 8 },
    { key: 'imageUrl', type: 'image',    label: 'Omslagfoto' },
    { key: 'author',   type: 'text',     label: 'Auteur' },
    { key: 'date',     type: 'text',     label: 'Datum (bv. 10 maart 2026)' },
  ],
};

// ── Image upload field ────────────────────────────────────
function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data.url);
    } catch { alert('Upload mislukt'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 group">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <button type="button" onClick={() => ref.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors w-full justify-center">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Uploaden...' : value ? 'Andere afbeelding kiezen' : 'Afbeelding uploaden'}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );
}

// ── Generic field renderer ────────────────────────────────
function FieldInput({ field, value, onChange }) {
  const cls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors bg-white';

  if (field.type === 'image') return <ImageUpload value={value || ''} onChange={onChange} />;
  if (field.type === 'color') return (
    <div className="flex items-center gap-3">
      <input type="color" value={value || '#0c4684'} onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className={cls} placeholder="#0c4684" />
    </div>
  );
  if (field.type === 'select') return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} className={cls}>
      {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (field.type === 'textarea') return (
    <textarea value={value || ''} onChange={e => onChange(e.target.value)}
      rows={field.rows || 3} className={`${cls} resize-none`} />
  );
  if (field.type === 'array') {
    const items = Array.isArray(value) ? value : [];
    const updateItem = (i, k, v) => {
      const next = items.map((it, idx) => idx === i ? { ...it, [k]: v } : it);
      onChange(next);
    };
    const addItem = () => {
      const empty = {};
      (field.subfields || []).forEach(sf => { empty[sf.key] = ''; });
      onChange([...items, empty]);
    };
    const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));

    return (
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3 relative">
            <button onClick={() => removeItem(i)}
              className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item {i + 1}</p>
            {(field.subfields || []).map(sf => (
              <div key={sf.key}>
                <label className="block text-xs font-semibold text-gray-400 mb-1">{sf.label}</label>
                <FieldInput field={sf} value={item[sf.key]} onChange={v => updateItem(i, sf.key, v)} />
              </div>
            ))}
          </div>
        ))}
        <button onClick={addItem}
          className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-semibold">
          <Plus className="w-4 h-4" /> Item toevoegen
        </button>
      </div>
    );
  }
  return <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className={cls} />;
}

// ── Edit Modal ────────────────────────────────────────────
function EditModal({ block, onSave, onClose }) {
  const [data, setData] = useState({ ...block.data });
  const schema = SCHEMAS[block.type] || [];
  const typeInfo = BLOCK_TYPES.find(t => t.key === block.type);

  const setField = (key, val) => setData(d => ({ ...d, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeInfo?.icon}</span>
            <div>
              <h2 className="font-bold text-gray-800">{typeInfo?.label} bewerken</h2>
              <p className="text-xs text-gray-400">{typeInfo?.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {schema.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{field.label}</label>
              <FieldInput field={field} value={data[field.key]} onChange={v => setField(field.key, v)} />
            </div>
          ))}
          {schema.length === 0 && (
            <p className="text-sm text-gray-400 italic">Geen bewerkbare velden voor dit bloktype.</p>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3 shrink-0">
          <button onClick={() => onSave(data)}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-all">
            <Save className="w-4 h-4" /> Wijzigingen opslaan
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600">Annuleren</button>
        </div>
      </div>
    </div>
  );
}

// ── Block preview ─────────────────────────────────────────
function BlockPreview({ type, data }) {
  if (!data) return <p className="text-xs text-gray-400 italic">Leeg</p>;
  const title = data.heading || data.title || data.name || '';
  const sub = data.subtext || data.body || data.excerpt || data.description || '';
  return (
    <div className="text-sm min-w-0">
      {title && <p className="font-semibold text-gray-800 truncate">{title}</p>}
      {sub && <p className="text-xs text-gray-400 truncate mt-0.5">{sub}</p>}
      {!title && !sub && <p className="text-xs text-gray-400 italic">Geen preview beschikbaar</p>}
    </div>
  );
}

// ── Sortable card ─────────────────────────────────────────
function BlockCard({ block, onDelete, onToggleVisible, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [expanded, setExpanded] = useState(false);
  const typeInfo = BLOCK_TYPES.find(t => t.key === block.type);
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-shadow ${isDragging ? 'shadow-xl ring-2 ring-violet-300' : 'border-gray-100 hover:border-violet-100'}`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button {...attributes} {...listeners}
          className="text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none shrink-0">
          <GripVertical className="w-5 h-5" />
        </button>
        <span className="text-xl shrink-0">{typeInfo?.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">{typeInfo?.label}</span>
            {!block.visible && <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-semibold">verborgen</span>}
          </div>
          <BlockPreview type={block.type} data={block.data} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(block)} title="Bewerken"
            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onToggleVisible(block.id)} title={block.visible ? 'Verbergen' : 'Tonen'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(block.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t bg-gray-50">
          <pre className="text-xs text-gray-600 mt-3 bg-white border border-gray-100 rounded-xl p-3 overflow-auto max-h-48 whitespace-pre-wrap">
            {JSON.stringify(block.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── New block modal (AI + manual) ─────────────────────────
function NewBlockModal({ onAdd, onClose }) {
  const [blockType, setBlockType] = useState('');
  const [mode, setMode] = useState('ai');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!blockType || !description.trim()) return;
    setLoading(true); setPreview(null); setError('');
    try {
      const res = await api.post('/ai/new-block', { blockType, description });
      setPreview(res.data.result);
    } catch (err) {
      setError(errorText(err, 'Mislukt. Controleer GROQ_API_KEY.'));
    } finally { setLoading(false); }
  };

  const createEmpty = () => {
    if (!blockType) return;
    const schema = SCHEMAS[blockType] || [];
    const empty = {};
    schema.forEach(f => {
      if (f.type === 'array') empty[f.key] = [];
      else empty[f.key] = '';
    });
    setPreview(empty);
  };

  const add = () => {
    if (!preview) return;
    onAdd({ type: blockType, data: preview });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </span>
            Nieuw blok aanmaken
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Block type */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bloktype *</label>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_TYPES.map(t => (
                <button key={t.key} onClick={() => { setBlockType(t.key); setPreview(null); }}
                  className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${blockType === t.key ? 'border-violet-500 bg-violet-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <span className="text-base mr-1.5">{t.icon}</span>
                  <span className="text-sm font-semibold text-gray-700">{t.label}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          {blockType && (
            <div className="flex gap-2 border-b pb-4">
              <button onClick={() => setMode('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'ai' ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:text-gray-600'}`}>
                <Sparkles className="w-4 h-4" /> AI genereren
              </button>
              <button onClick={() => setMode('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>
                <Pencil className="w-4 h-4" /> Zelf invullen
              </button>
            </div>
          )}

          {/* AI mode */}
          {blockType && mode === 'ai' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Opdracht *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                placeholder="Beschrijf wat er in het blok moet staan..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 resize-none" />
              <button onClick={generate} disabled={!description.trim() || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Genereren...' : preview ? 'Opnieuw genereren' : 'Genereer met AI'}
              </button>
              {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
            </div>
          )}

          {/* Manual mode */}
          {blockType && mode === 'manual' && !preview && (
            <button onClick={createEmpty}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-all">
              <Pencil className="w-4 h-4" /> Leeg blok aanmaken
            </button>
          )}

          {/* Preview */}
          {preview && !loading && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Voorbeeld inhoud
              </p>
              <BlockPreview type={blockType} data={preview} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3 shrink-0">
          {preview && (
            <button onClick={add}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-all">
              <Plus className="w-4 h-4" /> Toevoegen aan pagina
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600">Annuleren</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function PageBuilder() {
  const [activePage, setActivePage] = useState('home');
  const [lang, setLang] = useState('nl');
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [editBlock, setEditBlock] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadPage = (page) => {
    setLoading(true);
    api.get(`/content/page_blocks_${page}`, { params: { lang } })
      .then(r => setBlocks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPage(activePage); }, [activePage, lang]);

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setBlocks(items => {
        const oldIdx = items.findIndex(i => i.id === active.id);
        const newIdx = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIdx, newIdx);
      });
    }
  };

  const addBlock = ({ type, data }) => {
    setBlocks(b => [...b, { id: crypto.randomUUID(), type, data, visible: true }]);
  };

  const deleteBlock = (id) => setBlocks(b => b.filter(x => x.id !== id));
  const toggleVisible = (id) => setBlocks(b => b.map(x => x.id === id ? { ...x, visible: !x.visible } : x));

  const saveEdit = (blockId, newData) => {
    setBlocks(b => b.map(x => x.id === blockId ? { ...x, data: newData } : x));
    setEditBlock(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/content/page_blocks_${activePage}`, blocks, { params: { lang } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { alert('Opslaan mislukt'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pagina Bouwer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Maak blokken met AI, sleep op volgorde, en sla op.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          >
            <option value="nl">🇳🇱 NL</option>
            <option value="en">🇬🇧 EN</option>
            <option value="de">🇩🇪 DE</option>
          </select>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-all shadow-sm shadow-violet-200">
            <Plus className="w-4 h-4" /> Nieuw blok
          </button>
          <button onClick={save} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${saved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'} disabled:opacity-60`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Opslaan...' : saved ? 'Opgeslagen!' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
        {PAGES.map(p => (
          <button key={p.key} onClick={() => setActivePage(p.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activePage === p.key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm text-blue-700 flex items-start gap-2">
        <span className="mt-0.5 shrink-0">ℹ️</span>
        <span>Blokken voor <strong>{PAGES.find(p => p.key === activePage)?.label}</strong> verschijnen <strong>onder de vaste secties</strong>. Sleep om de volgorde te wijzigen.</span>
      </div>

      {/* Block list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : blocks.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center text-gray-400 space-y-2">
          <p className="text-4xl">🧱</p>
          <p className="font-semibold text-gray-500">Nog geen blokken op deze pagina</p>
          <p className="text-sm">Klik op <strong>Nieuw blok</strong> om te beginnen</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {blocks.map(block => (
                <BlockCard key={block.id} block={block}
                  onDelete={deleteBlock}
                  onToggleVisible={toggleVisible}
                  onEdit={setEditBlock}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showNew && <NewBlockModal onAdd={addBlock} onClose={() => setShowNew(false)} />}
      {editBlock && <EditModal block={editBlock} onSave={(data) => saveEdit(editBlock.id, data)} onClose={() => setEditBlock(null)} />}
    </div>
  );
}
