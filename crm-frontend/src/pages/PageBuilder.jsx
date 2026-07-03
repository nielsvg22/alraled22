import React, { useState, useEffect, useRef } from 'react';
import api, { getMediaUrl } from '../lib/api';
import ImageUploader from '../components/ImageUploader';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Trash2, Plus, Sparkles, Loader2, Save, CheckCircle,
  ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Upload, X, Image,
  LayoutList, Blocks,
} from 'lucide-react';
import { errorText } from '../lib/errorText';

const PAGES = [
  { key: 'home',    label: 'Homepagina',  icon: '🏠' },
  { key: 'about',   label: 'Over Ons',    icon: '👥' },
  { key: 'contact', label: 'Contact',     icon: '📬' },
  { key: 'blog',    label: 'Blog',        icon: '📝' },
];

const FIXED_SECTIONS = [
  { id: 'hero',           label: 'Hero',                icon: '🎯' },
  { id: 'intro_banner',   label: 'Vertrouwen banner',   icon: '✅' },
  { id: 'over_ons',       label: 'Over ALRA LED',       icon: '🏭' },
  { id: 'cases',          label: 'Producten & Cases',    icon: '📦' },
  { id: 'stats',          label: 'Statistieken',         icon: '📊' },
  { id: 'logos',          label: 'Logo\'s',              icon: '🏷️' },
  { id: 'featured',       label: 'Uitgelichte producten', icon: '⭐' },
  { id: 'testimonials',   label: 'Ervaringen',           icon: '💬' },
  { id: 'process',        label: 'Proces',               icon: '🔄' },
  { id: 'highlights',     label: 'Groothandel',          icon: '🏪' },
  { id: 'cta',            label: 'Call-to-action',       icon: '📣' },
  { id: 'dealers_cta',    label: 'Dealer CTA',           icon: '📍' },
];

const BLOCK_TYPES = [
  { key: 'banner',           label: 'Banner',             icon: '📣', desc: 'Brede balk met knop' },
  { key: 'text_block',       label: 'Tekstblok',          icon: '📝', desc: 'Koptekst + alinea' },
  { key: 'feature_grid',     label: 'Voordelen grid',     icon: '⊞',  desc: 'Kaartjes met icoon' },
  { key: 'image_text',       label: 'Afbeelding + tekst', icon: '🖼️', desc: "Foto + tekst naast elkaar" },
  { key: 'product_highlight', label: 'Product highlight', icon: '🏷️', desc: 'Product met afbeelding & features' },
  { key: 'about_alra',       label: 'Over ALRA LED',     icon: '🏭', desc: 'Tekst + afbeelding info sectie' },
  { key: 'stats_row',        label: 'Statistieken',       icon: '📊', desc: 'Rij met cijfers' },
  { key: 'cta_block',        label: 'Call-to-action',     icon: '🎯', desc: 'Knop sectie' },
  { key: 'steps',            label: 'Stappen',            icon: '🔢', desc: 'Genummerde stappen' },
  { key: 'blog_post',        label: 'Blogbericht',        icon: '📰', desc: 'Artikel met afbeelding' },
];

// ── Editable fixed sections (stored in /api/content/home) ──
const FIXED_SECTION_SCHEMAS = {
  hero: {
    contentKey: 'hero',
    label: 'Hero',
    fields: [
      { key: 'titlePrefix', type: 'text', label: 'Titel prefix (bv. Verlichting voor)' },
      { key: 'title', type: 'text', label: 'Hoofdtitel' },
      { key: 'subtitle', type: 'textarea', label: 'Ondertekst', rows: 3 },
      { key: 'backgroundImage', type: 'image', label: 'Achtergrondafbeelding' },
      { key: 'primaryButtonText', type: 'text', label: 'Primaire knop' },
      { key: 'secondaryButtonText', type: 'text', label: 'Secundaire knop' },
      { key: 'typewriterWords', type: 'array', label: 'Typewriter woorden', subfields: [
        { key: 'word', type: 'text', label: 'Woord' },
      ]},
    ],
    mapData: (data) => ({
      titlePrefix: data?.hero?.titlePrefix || '',
      title: data?.hero?.title || '',
      subtitle: data?.hero?.subtitle || '',
      backgroundImage: data?.hero?.backgroundImage || '',
      primaryButtonText: data?.hero?.primaryButtonText || '',
      secondaryButtonText: data?.hero?.secondaryButtonText || '',
      typewriterWords: (data?.hero?.typewriterWords || []).map(w => ({ word: w })),
    }),
    toContent: (form, existing) => ({
      ...existing,
      hero: {
        ...existing.hero,
        titlePrefix: form.titlePrefix,
        title: form.title,
        subtitle: form.subtitle,
        backgroundImage: form.backgroundImage,
        primaryButtonText: form.primaryButtonText,
        secondaryButtonText: form.secondaryButtonText,
        typewriterWords: (form.typewriterWords || []).map(i => i.word || i).filter(Boolean),
      },
    }),
  },
  over_ons: {
    contentKey: 'introSection',
    label: 'Over ALRA LED',
    fields: [
      { key: 'badge', type: 'text', label: 'Badge (bv. Over ALRA LED)' },
      { key: 'heading', type: 'text', label: 'Koptekst' },
      { key: 'description', type: 'textarea', label: 'Beschrijving', rows: 5 },
      { key: 'image', type: 'image', label: 'Afbeelding' },
      { key: 'linkText', type: 'text', label: 'Link tekst' },
      { key: 'deliveryTitle', type: 'text', label: 'Titel levering' },
      { key: 'deliverySubtitle', type: 'text', label: 'Ondertekst levering' },
    ],
    mapData: (data) => ({
      badge: data?.introSection?.badge || '',
      heading: data?.introSection?.heading || '',
      description: data?.introSection?.description || '',
      image: data?.introSection?.image || '',
      linkText: data?.introSection?.linkText || '',
      deliveryTitle: data?.introSection?.deliveryTitle || '',
      deliverySubtitle: data?.introSection?.deliverySubtitle || '',
    }),
    toContent: (form, existing) => ({
      ...existing,
      introSection: {
        ...existing.introSection,
        badge: form.badge,
        heading: form.heading,
        description: form.description,
        image: form.image,
        linkText: form.linkText,
        deliveryTitle: form.deliveryTitle,
        deliverySubtitle: form.deliverySubtitle,
      },
    }),
  },
  highlights: {
    contentKey: 'highlights',
    label: 'Groothandel',
    fields: [
      { key: 'title', type: 'text', label: 'Sectietitel' },
      { key: 'subtitle', type: 'textarea', label: 'Ondertekst', rows: 2 },
      { key: 'items', type: 'array', label: 'Product items', subfields: [
        { key: 'title', type: 'text', label: 'Titel' },
        { key: 'description', type: 'textarea', label: 'Beschrijving', rows: 2 },
        { key: 'image', type: 'image', label: 'Afbeelding' },
        { key: 'link', type: 'text', label: 'Link (bv. /producten)' },
        { key: 'linkText', type: 'text', label: 'Link tekst' },
        { key: 'features', type: 'array', label: 'Features', subfields: [
          { key: 'feat', type: 'text', label: 'Feature' },
        ]},
      ]},
    ],
    mapData: (data) => ({
      title: data?.highlights?.title || '',
      subtitle: data?.highlights?.subtitle || '',
      items: (data?.highlights?.items || []).map(item => ({
        title: item.title || '',
        description: item.description || '',
        image: item.image || '',
        link: item.link || '',
        linkText: item.linkText || '',
        features: (item.features || []).map(f => ({ feat: typeof f === 'string' ? f : f.feat || '' })),
      })),
    }),
    toContent: (form, existing) => ({
      ...existing,
      highlights: {
        ...existing.highlights,
        title: form.title,
        subtitle: form.subtitle,
        items: (form.items || []).map(item => ({
          title: item.title,
          description: item.description,
          image: item.image,
          link: item.link,
          linkText: item.linkText,
          features: (item.features || []).map(f => f.feat || f).filter(Boolean),
        })),
      },
    }),
  },
  process: {
    contentKey: 'process',
    label: 'Proces',
    fields: [
      { key: 'title', type: 'text', label: 'Sectietitel' },
      { key: 'description', type: 'textarea', label: 'Beschrijving', rows: 4 },
      { key: 'buttonText', type: 'text', label: 'Knoptekst' },
      { key: 'steps', type: 'array', label: 'Stappen', subfields: [
        { key: 'title', type: 'text', label: 'Titel' },
        { key: 'description', type: 'textarea', label: 'Beschrijving', rows: 2 },
      ]},
    ],
    mapData: (data) => ({
      title: data?.process?.title || '',
      description: data?.process?.description || '',
      buttonText: data?.process?.buttonText || '',
      steps: (data?.process?.steps || []).map(s => ({ title: s.title || '', description: s.description || s.desc || '' })),
    }),
    toContent: (form, existing) => ({
      ...existing,
      process: {
        ...existing.process,
        title: form.title,
        description: form.description,
        buttonText: form.buttonText,
        steps: (form.steps || []).map(s => ({ title: s.title, description: s.description })),
      },
    }),
  },
  cta: {
    contentKey: 'cta',
    label: 'Call-to-action',
    fields: [
      { key: 'title', type: 'text', label: 'Koptekst' },
      { key: 'subtitle', type: 'textarea', label: 'Ondertekst', rows: 2 },
      { key: 'primaryButton', type: 'text', label: 'Primaire knop' },
      { key: 'secondaryButton', type: 'text', label: 'Secundaire knop' },
    ],
    mapData: (data) => ({
      title: data?.cta?.title || '',
      subtitle: data?.cta?.subtitle || '',
      primaryButton: data?.cta?.primaryButton || '',
      secondaryButton: data?.cta?.secondaryButton || '',
    }),
    toContent: (form, existing) => ({
      ...existing,
      cta: {
        ...existing.cta,
        title: form.title,
        subtitle: form.subtitle,
        primaryButton: form.primaryButton,
        secondaryButton: form.secondaryButton,
      },
    }),
  },
  dealers_cta: {
    contentKey: 'dealersCta',
    label: 'Dealer CTA',
    fields: [
      { key: 'title', type: 'text', label: 'Koptekst' },
      { key: 'subtitle', type: 'textarea', label: 'Ondertekst', rows: 2 },
      { key: 'buttonText', type: 'text', label: 'Knoptekst' },
    ],
    mapData: (data) => ({
      title: data?.dealersCta?.title || '',
      subtitle: data?.dealersCta?.subtitle || '',
      buttonText: data?.dealersCta?.buttonText || '',
    }),
    toContent: (form, existing) => ({
      ...existing,
      dealersCta: {
        ...existing.dealersCta,
        title: form.title,
        subtitle: form.subtitle,
        buttonText: form.buttonText,
      },
    }),
  },
  stats: {
    contentKey: 'stats',
    label: 'Statistieken',
    fields: [
      { key: 'items', type: 'array', label: 'Statistieken', subfields: [
        { key: 'value', type: 'text', label: 'Getal' },
        { key: 'label', type: 'text', label: 'Label' },
        { key: 'suffix', type: 'text', label: 'Achtervoegsel (bv. +)' },
      ]},
    ],
    mapData: (data) => ({
      items: (data?.stats || []).map(s => ({ value: String(s.value || ''), label: s.label || '', suffix: s.suffix || '' })),
    }),
    toContent: (form, existing) => ({
      ...existing,
      stats: (form.items || []).map(s => ({ value: s.value, label: s.label, suffix: s.suffix })),
    }),
  },
};

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
  product_highlight: [
    { key: 'label',         type: 'text',     label: 'Label (bv. Productgroep)' },
    { key: 'heading',       type: 'text',     label: 'Producttitel' },
    { key: 'body',          type: 'textarea', label: 'Beschrijving', rows: 4 },
    { key: 'imageUrl',      type: 'image',    label: 'Productafbeelding' },
    { key: 'imagePosition', type: 'select',   label: 'Afbeeldingspositie', options: ['left', 'right'] },
    { key: 'badge',         type: 'text',     label: 'Badge tekst (bv. NIEUW)' },
    { key: 'features',      type: 'array',    label: 'Kenmerken / features', subfields: [
      { key: 'text', type: 'text', label: 'Feature tekst' },
    ]},
    { key: 'buttonText',    type: 'text',     label: 'Knoptekst' },
    { key: 'buttonLink',    type: 'text',     label: 'Knop link (bv. /producten)' },
  ],
  about_alra: [
    { key: 'badge',         type: 'text',     label: 'Badge (bv. Over ALRA LED)' },
    { key: 'heading',       type: 'text',     label: 'Koptekst' },
    { key: 'body',          type: 'textarea', label: 'Beschrijving', rows: 5 },
    { key: 'imageUrl',      type: 'image',    label: 'Afbeelding' },
    { key: 'imagePosition', type: 'select',   label: 'Afbeeldingspositie', options: ['left', 'right'] },
    { key: 'features',      type: 'array',    label: 'Voordelen / kenmerken', subfields: [
      { key: 'text', type: 'text', label: 'Tekst' },
    ]},
    { key: 'buttonText',    type: 'text',     label: 'Knoptekst' },
    { key: 'buttonLink',    type: 'text',     label: 'Knop link (bv. /over-ons)' },
    { key: 'statValue',     type: 'text',     label: 'Statistiek getal (bv. 10+)' },
    { key: 'statLabel',     type: 'text',     label: 'Statistiek label (bv. Jaar ervaring)' },
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

// ── Generic field renderer ────────────────────────────────
function FieldInput({ field, value, onChange }) {
  const cls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors bg-white';

  if (field.type === 'image') return <ImageUploader value={value || ''} onChange={onChange} label={null} height="h-36" />;
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

// ── Sortable section item ────────────────────────────────
function SectionItem({ item, onToggle, onInsertAfter, onEditFixed, isHidden, homeContent }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const isFixed = item._fixed;
  const canEdit = isFixed && FIXED_SECTION_SCHEMAS[item.id];

  // Show a preview of current content for fixed sections
  const getPreview = () => {
    if (!isFixed || !homeContent) return null;
    const schema = FIXED_SECTION_SCHEMAS[item.id];
    if (!schema) return null;
    const mapped = schema.mapData(homeContent);
    const firstVal = Object.values(mapped).find(v => v && typeof v === 'string' && v.length > 0);
    if (firstVal) return firstVal.length > 50 ? firstVal.slice(0, 50) + '...' : firstVal;
    return null;
  };
  const preview = getPreview();

  return (
    <>
      <div ref={setNodeRef} style={style}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isDragging ? 'shadow-xl ring-2 ring-violet-300' : isHidden ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-white border-gray-100 hover:border-violet-100'}`}>
        <button {...attributes} {...listeners}
          className="text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none shrink-0">
          <GripVertical className="w-5 h-5" />
        </button>
        <span className="text-lg shrink-0">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isHidden ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.label}</p>
          {isFixed && !canEdit && <p className="text-[10px] text-gray-400">Vaste sectie</p>}
          {isFixed && canEdit && preview && <p className="text-[10px] text-green-500 truncate">{preview}</p>}
          {isFixed && canEdit && !preview && <p className="text-[10px] text-green-500">Klik op bewerken om inhoud aan te passen</p>}
          {!isFixed && <p className="text-[10px] text-violet-400">CMS blok</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <button onClick={() => onEditFixed(item.id)} title="Inhoud bewerken"
              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onToggle(item.id)} title={isHidden ? 'Tonen' : 'Verbergen'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="flex justify-center py-1">
        <button onClick={() => onInsertAfter(item.id)}
          className="text-[10px] font-bold text-violet-400 hover:text-violet-600 uppercase tracking-widest opacity-0 hover:opacity-100 transition-all flex items-center gap-1">
          <Plus className="w-3 h-3" /> blok hier
        </button>
      </div>
    </>
  );
}

// ── Fixed Section Edit Modal ─────────────────────────────
function FixedSectionEditModal({ sectionId, homeContent, onSave, onClose }) {
  const schema = FIXED_SECTION_SCHEMAS[sectionId];
  const [data, setData] = useState(() => schema.mapData(homeContent));
  const [saving, setSaving] = useState(false);

  const setField = (key, val) => setData(d => ({ ...d, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = schema.toContent(data, homeContent);
      await api.put('/content/home', updated, { params: { lang: 'nl' } });
      onSave(updated);
    } catch (err) {
      alert('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Pencil className="w-4 h-4 text-green-600" />
            </span>
            <div>
              <h2 className="font-bold text-gray-800">{schema.label} bewerken</h2>
              <p className="text-xs text-gray-400">Pas de inhoud van deze sectie aan</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {schema.fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{field.label}</label>
              <FieldInput field={field} value={data[field.key]} onChange={v => setField(field.key, v)} />
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t flex gap-3 shrink-0">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Opslaan...' : 'Inhoud opslaan'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600">Annuleren</button>
        </div>
      </div>
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

          {blockType && mode === 'manual' && !preview && (
            <button onClick={createEmpty}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-all">
              <Pencil className="w-4 h-4" /> Leeg blok aanmaken
            </button>
          )}

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

// ── Insert block modal (pick type for a position) ────────
function InsertBlockModal({ onAdd, onClose }) {
  const [blockType, setBlockType] = useState('');

  const add = () => {
    if (!blockType) return;
    const schema = SCHEMAS[blockType] || [];
    const empty = {};
    schema.forEach(f => {
      if (f.type === 'array') empty[f.key] = [];
      else empty[f.key] = '';
    });
    onAdd({ type: blockType, data: empty });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Blok toevoegen op deze positie</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_TYPES.map(t => (
              <button key={t.key} onClick={() => { setBlockType(t.key); }}
                className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${blockType === t.key ? 'border-violet-500 bg-violet-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <span className="text-base mr-1.5">{t.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={add} disabled={!blockType}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-all">
            <Plus className="w-4 h-4" /> Toevoegen
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600">Annuleren</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function PageBuilder() {
  const [activePage, setActivePage] = useState('home');
  const [lang, setLang] = useState('nl');
  const [activeTab, setActiveTab] = useState('sections');
  const [blocks, setBlocks] = useState([]);
  const [sectionOrder, setSectionOrder] = useState([]);
  const [hiddenSections, setHiddenSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [editBlock, setEditBlock] = useState(null);
  const [editFixedSection, setEditFixedSection] = useState(null);
  const [homeContent, setHomeContent] = useState(null);
  const [insertAfter, setInsertAfter] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadPage = (page) => {
    setLoading(true);
    api.get(`/content/page_blocks_${page}`, { params: { lang } })
      .then(r => setBlocks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBlocks([]));

    if (page === 'home') {
      api.get('/content/layout_home_sections', { params: { lang } })
        .then(r => {
          const data = r.data;
          if (data && data.order) {
            setSectionOrder(data.order);
            setHiddenSections(data.hidden || []);
          } else if (Array.isArray(data)) {
            setSectionOrder(data);
          } else {
            setSectionOrder(FIXED_SECTIONS.map(s => s.id));
          }
        })
        .catch(() => setSectionOrder(FIXED_SECTIONS.map(s => s.id)));

      api.get('/content/home', { params: { lang } })
        .then(r => setHomeContent(r.data || {}))
        .catch(() => setHomeContent({}))
        .finally(() => setLoading(false));
    } else {
      setHomeContent(null);
      setLoading(false);
    }
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

  const handleSectionDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setSectionOrder(items => {
        const oldIdx = items.indexOf(active.id);
        const newIdx = items.indexOf(over.id);
        if (oldIdx === -1 || newIdx === -1) return items;
        const next = [...items];
        next.splice(oldIdx, 1);
        next.splice(newIdx, 0, active.id);
        return next;
      });
    }
  };

  const addBlock = ({ type, data }) => {
    const newBlock = { id: crypto.randomUUID(), type, data, visible: true };
    if (insertAfter) {
      const idx = sectionOrder.indexOf(insertAfter);
      if (idx !== -1) {
        const blockRef = `block:${newBlock.id}`;
        const newOrder = [...sectionOrder];
        newOrder.splice(idx + 1, 0, blockRef);
        setSectionOrder(newOrder);
        setBlocks(b => [...b, newBlock]);
        setInsertAfter(null);
        return;
      }
    }
    setBlocks(b => [...b, newBlock]);
  };

  const addBlockAtEnd = ({ type, data }) => {
    setBlocks(b => [...b, { id: crypto.randomUUID(), type, data, visible: true }]);
  };

  const deleteBlock = (id) => setBlocks(b => b.filter(x => x.id !== id));
  const toggleVisible = (id) => setBlocks(b => b.map(x => x.id === id ? { ...x, visible: !x.visible } : x));

  const toggleSection = (id) => {
    setHiddenSections(h => h.includes(id) ? h.filter(x => x !== id) : [...h, id]);
  };

  const removeBlockFromOrder = (blockId) => {
    setSectionOrder(o => o.filter(x => x !== `block:${blockId}`));
    setBlocks(b => b.filter(x => x.id !== blockId));
  };

  const saveEdit = (blockId, newData) => {
    setBlocks(b => b.map(x => x.id === blockId ? { ...x, data: newData } : x));
    setEditBlock(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/content/page_blocks_${activePage}`, blocks, { params: { lang } });
      if (activePage === 'home') {
        await api.put('/content/layout_home_sections', { order: sectionOrder, hidden: hiddenSections }, { params: { lang } });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { alert('Opslaan mislukt'); }
    finally { setSaving(false); }
  };

  // Build the combined section list for the section manager
  const buildSectionList = () => {
    const list = [];
    const order = sectionOrder.length > 0 ? sectionOrder : FIXED_SECTIONS.map(s => s.id);
    const fixedMap = new Map(FIXED_SECTIONS.map(s => [s.id, s]));
    const blockMap = new Map(blocks.map(b => [b.id, b]));

    for (const id of order) {
      if (id.startsWith('block:')) {
        const blockId = id.slice('block:'.length);
        const block = blockMap.get(blockId);
        if (block) {
          const typeInfo = BLOCK_TYPES.find(t => t.key === block.type);
          list.push({
            id: id,
            _fixed: false,
            _blockId: blockId,
            icon: typeInfo?.icon || '📦',
            label: block.data?.heading || block.data?.title || typeInfo?.label || 'Blok',
          });
        }
      } else {
        const fixed = fixedMap.get(id);
        if (fixed) {
          list.push({ ...fixed, _fixed: true });
        }
      }
    }
    // Add any fixed sections not yet in order
    for (const fixed of FIXED_SECTIONS) {
      if (!order.includes(fixed.id)) {
        list.push({ ...fixed, _fixed: true });
      }
    }
    // Add any blocks not yet in order
    for (const block of blocks) {
      const ref = `block:${block.id}`;
      if (!order.includes(ref)) {
        const typeInfo = BLOCK_TYPES.find(t => t.key === block.type);
        list.push({
          id: ref,
          _fixed: false,
          _blockId: block.id,
          icon: typeInfo?.icon || '📦',
          label: block.data?.heading || block.data?.title || typeInfo?.label || 'Blok',
        });
      }
    }
    return list;
  };

  const sectionList = buildSectionList();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pagina Bouwer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Beheer secties, voeg blokken toe, sleep op volgorde.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          >
            <option value="nl">NL</option>
            <option value="en">EN</option>
            <option value="de">DE</option>
          </select>
          {activeTab === 'blocks' && (
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-all shadow-sm shadow-violet-200">
              <Plus className="w-4 h-4" /> Nieuw blok
            </button>
          )}
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

      {/* Content tabs - only for home */}
      {activePage === 'home' && (
        <div className="flex gap-1 p-1 bg-gray-50 rounded-xl">
          <button onClick={() => setActiveTab('sections')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sections' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            <LayoutList className="w-4 h-4" /> Sectie-beheer
          </button>
          <button onClick={() => setActiveTab('blocks')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'blocks' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            <Blocks className="w-4 h-4" /> CMS Blokken
          </button>
        </div>
      )}

      {/* Section manager tab */}
      {activePage === 'home' && activeTab === 'sections' && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm text-blue-700 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">i</span>
            <span>Sleep secties om de volgorde te wijzigen. Klik op het oog om een sectie te verbergen. Klik op <strong>"+ blok hier"</strong> om een CMS-blok toe te voegen op die positie.</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
              <SortableContext items={sectionList.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0">
                  {sectionList.map(item => (
                    <SectionItem
                      key={item.id}
                      item={item}
                      isHidden={hiddenSections.includes(item.id)}
                      onToggle={toggleSection}
                      onInsertAfter={setInsertAfter}
                      onEditFixed={setEditFixedSection}
                      homeContent={homeContent}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}

      {/* Blocks tab */}
      {(activePage !== 'home' || activeTab === 'blocks') && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm text-blue-700 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">i</span>
            <span>CMS blokken voor <strong>{PAGES.find(p => p.key === activePage)?.label}</strong>. {activePage === 'home' ? 'Blokken worden gerenderd volgens de volgorde in Sectie-beheer.' : 'Sleep om de volgorde te wijzigen.'}</span>
          </div>

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
        </>
      )}

      {showNew && <NewBlockModal onAdd={activeTab === 'sections' ? addBlockAtEnd : addBlockAtEnd} onClose={() => setShowNew(false)} />}
      {editBlock && <EditModal block={editBlock} onSave={(data) => saveEdit(editBlock.id, data)} onClose={() => setEditBlock(null)} />}
      {insertAfter && <InsertBlockModal onAdd={addBlock} onClose={() => setInsertAfter(null)} />}
      {editFixedSection && homeContent && (
        <FixedSectionEditModal
          sectionId={editFixedSection}
          homeContent={homeContent}
          onSave={(updated) => { setHomeContent(updated); setEditFixedSection(null); }}
          onClose={() => setEditFixedSection(null)}
        />
      )}
    </div>
  );
}
