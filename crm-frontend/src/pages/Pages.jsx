import React, { useState, useEffect, useRef } from 'react';
import api, { getMediaUrl } from '../lib/api';
import ImageUploader from '../components/ImageUploader';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Upload, X, Plus, Trash2, Save, Copy, ChevronDown,
  Home, Info, Phone, Settings, Image, CheckCircle,
  GripVertical, LayoutGrid,
} from 'lucide-react';

// ── Primitives ───────────────────────────────────────────────────
const iCls  = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white';
const taCls = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white';
const iBdr  = 'border-gray-200';

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true, accent, dragHandleProps }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div
        className="w-full px-5 py-3.5 flex items-center justify-between transition-colors hover:opacity-90"
        style={{ background: accent || 'linear-gradient(135deg,#1e293b,#334155)' }}
      >
        <div className="flex items-center gap-2.5">
          {dragHandleProps && (
            <span
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
              className="text-white/60 cursor-grab active:cursor-grabbing"
              title="Slepen"
            >
              <GripVertical size={14} />
            </span>
          )}
          {Icon && <Icon size={14} className="text-white/60" />}
          <h3 className="text-xs font-black text-white uppercase tracking-[0.15em]">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title={open ? 'Inklappen' : 'Uitklappen'}
        >
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && <div className="p-5 space-y-4 bg-white">{children}</div>}
    </div>
  );
}

function ImageField({ value, onChange, height = 36 }) {
  return <ImageUploader value={value} onChange={onChange} label={null} height={`h-[${height * 4}px]`} />;
}

function SaveButton({ onSave, saving, saved }) {
  return (
    <div className="flex justify-end pt-2">
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50"
        style={{ background: saved ? 'linear-gradient(135deg,#065f46,#10b981)' : 'linear-gradient(135deg,#1e40af,#3b82f6)', boxShadow: saved ? '0 4px 16px rgba(16,185,129,0.4)' : '0 4px 16px rgba(59,130,246,0.4)' }}>
        {saved ? <><CheckCircle size={15} /> Opgeslagen!</> : saving ? <>Opslaan…</> : <><Save size={15} /> Opslaan</>}
      </button>
    </div>
  );
}

function ItemCard({ number, onDuplicate, onDelete, children }) {
  return (
    <div className="relative rounded-2xl p-4 space-y-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
      <div className="flex items-center justify-between mb-1">
        {number !== undefined && (
          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
            style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>{number + 1}</span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {onDuplicate && (
            <button type="button" onClick={onDuplicate}
              className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Dupliceren">
              <Copy size={13} />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Verwijderen">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all">
      <Plus size={15} /> {label}
    </button>
  );
}

function SortableSection({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-80' : ''}>
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
}

function SortableBuilderElement({ element, active, onSelect, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: element.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-80' : ''}>
      <div className="rounded-2xl overflow-hidden" style={{ border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div className="w-full px-5 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span {...attributes} {...listeners} className="text-white/60 cursor-grab active:cursor-grabbing" title="Slepen">
              <GripVertical size={14} />
            </span>
            <button type="button" onClick={() => onSelect(element.id)} className="text-left min-w-0">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.15em] truncate">{element.type}</h3>
            </button>
          </div>
          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-2 rounded-xl text-white/40 hover:text-red-300 hover:bg-white/10 transition-colors"
            title="Verwijderen"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BuilderEditor({ blockId, data, onChangeData }) {
  const [activeElementId, setActiveElementId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const elements = Array.isArray(data?.elements) ? data.elements : [];

  const applyStylePreset = (preset) => {
    if (preset === 'card_light') {
      onChangeData({ ...(data || {}), background: 'white', variant: 'card', container: 'normal', padding: 'lg', gap: 'md', elements });
      return;
    }
    if (preset === 'dark_cta') {
      onChangeData({ ...(data || {}), background: 'dark', variant: 'plain', container: 'normal', padding: 'lg', gap: 'md', elements });
      return;
    }
    onChangeData({ ...(data || {}), background: 'white', variant: 'plain', container: 'wide', padding: 'lg', gap: 'md', elements });
  };

  const setBackground = (background) => {
    onChangeData({ ...(data || {}), background, elements });
  };

  const setLayout = (patch) => {
    onChangeData({ ...(data || {}), ...patch, background: data?.background || 'white', elements });
  };

  const updateElement = (id, patch) => {
    onChangeData({
      ...(data || {}),
      background: data?.background,
      elements: elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const addElement = (type) => {
    const id = crypto.randomUUID();
    const defaults = type === 'heading'
      ? { text: 'Titel', level: 2, align: 'left' }
      : type === 'text'
        ? { text: 'Tekst', align: 'left' }
        : type === 'image'
          ? { url: '', alt: '', rounded: true, size: 'lg', align: 'center', aspect: '16:9', fit: 'cover', style: 'shadow', height: 320 }
          : type === 'button'
            ? { text: 'Knop', href: '/contact', variant: 'primary', align: 'left' }
            : { size: 24 };
    const next = [...elements, { id, type, ...defaults }];
    onChangeData({ ...(data || {}), background: data?.background, elements: next });
    setActiveElementId(id);
  };

  const deleteElement = (id) => {
    const next = elements.filter((e) => e.id !== id);
    onChangeData({ ...(data || {}), background: data?.background, elements: next });
    if (activeElementId === id) setActiveElementId(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Achtergrond">
          <select className={`${iCls} ${iBdr}`} value={data?.background || 'white'} onChange={(e) => setBackground(e.target.value)}>
            <option value="white">Wit</option>
            <option value="gray">Grijs</option>
            <option value="dark">Donker</option>
          </select>
        </Field>
        <Field label="Stijl">
          <select className={`${iCls} ${iBdr}`} value={data?.variant || 'plain'} onChange={(e) => setLayout({ variant: e.target.value })}>
            <option value="plain">Normaal</option>
            <option value="card">Card</option>
          </select>
        </Field>
        <Field label="Container">
          <select className={`${iCls} ${iBdr}`} value={data?.container || 'wide'} onChange={(e) => setLayout({ container: e.target.value })}>
            <option value="narrow">Smal</option>
            <option value="normal">Normaal</option>
            <option value="wide">Breed</option>
          </select>
        </Field>
        <Field label="Spacing">
          <select className={`${iCls} ${iBdr}`} value={data?.gap || 'md'} onChange={(e) => setLayout({ gap: e.target.value })}>
            <option value="sm">Compact</option>
            <option value="md">Normaal</option>
            <option value="lg">Ruim</option>
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => applyStylePreset('default')} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50">Default</button>
        <button type="button" onClick={() => applyStylePreset('card_light')} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50">Card</button>
        <button type="button" onClick={() => applyStylePreset('dark_cta')} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50">Donker</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => addElement('heading')} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50">Titel</button>
        <button type="button" onClick={() => addElement('text')} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50">Tekst</button>
        <button type="button" onClick={() => addElement('image')} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50">Afbeelding</button>
        <button type="button" onClick={() => addElement('button')} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50">Knop</button>
        <button type="button" onClick={() => addElement('divider')} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50">Divider</button>
        <button type="button" onClick={() => addElement('spacer')} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50">Spacer</button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;
          const oldIndex = elements.findIndex((e) => e.id === active.id);
          const newIndex = elements.findIndex((e) => e.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return;
          onChangeData({ ...(data || {}), background: data?.background, elements: arrayMove(elements, oldIndex, newIndex) });
        }}
      >
        <SortableContext items={elements.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {elements.map((e) => (
              <div key={e.id} className="space-y-2">
                <SortableBuilderElement
                  element={e}
                  active={activeElementId === e.id}
                  onSelect={(id) => setActiveElementId((p) => (p === id ? null : id))}
                  onDelete={deleteElement}
                />
                {activeElementId === e.id && (
                  <div className="px-5 py-4 rounded-2xl bg-white" style={{ border: '1px solid #f1f5f9' }}>
                    {e.type === 'heading' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label="Tekst">
                          <input className={`${iCls} ${iBdr}`} value={e.text || ''} onChange={(ev) => updateElement(e.id, { text: ev.target.value })} />
                        </Field>
                        <Field label="Grootte">
                          <select className={`${iCls} ${iBdr}`} value={String(e.level || 2)} onChange={(ev) => updateElement(e.id, { level: Number(ev.target.value) })}>
                            <option value="2">H2</option>
                            <option value="3">H3</option>
                            <option value="4">H4</option>
                          </select>
                        </Field>
                        <Field label="Uitlijning">
                          <select className={`${iCls} ${iBdr}`} value={e.align || 'left'} onChange={(ev) => updateElement(e.id, { align: ev.target.value })}>
                            <option value="left">Links</option>
                            <option value="center">Midden</option>
                          </select>
                        </Field>
                      </div>
                    )}

                    {e.type === 'text' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <Field label="Tekst">
                            <textarea className={`${taCls} ${iBdr}`} rows={5} value={e.text || ''} onChange={(ev) => updateElement(e.id, { text: ev.target.value })} />
                          </Field>
                        </div>
                        <Field label="Uitlijning">
                          <select className={`${iCls} ${iBdr}`} value={e.align || 'left'} onChange={(ev) => updateElement(e.id, { align: ev.target.value })}>
                            <option value="left">Links</option>
                            <option value="center">Midden</option>
                          </select>
                        </Field>
                      </div>
                    )}

                    {e.type === 'image' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Afbeelding">
                          <ImageField value={e.url || ''} onChange={(v) => updateElement(e.id, { url: v })} height={20} />
                        </Field>
                        <div className="space-y-3">
                          <Field label="Alt tekst">
                            <input className={`${iCls} ${iBdr}`} value={e.alt || ''} onChange={(ev) => updateElement(e.id, { alt: ev.target.value })} />
                          </Field>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Breedte (px)">
                              <input
                                className={`${iCls} ${iBdr}`}
                                value={e.widthPx ?? ''}
                                onChange={(ev) => {
                                  const v = ev.target.value;
                                  const n = v === '' ? undefined : Number(v);
                                  updateElement(e.id, { widthPx: Number.isFinite(n) ? n : undefined });
                                }}
                                placeholder="bv. 720"
                                inputMode="numeric"
                              />
                            </Field>
                            <Field label="Hoogte (px)">
                              <input
                                className={`${iCls} ${iBdr}`}
                                value={e.heightPx ?? ''}
                                onChange={(ev) => {
                                  const v = ev.target.value;
                                  const n = v === '' ? undefined : Number(v);
                                  updateElement(e.id, { heightPx: Number.isFinite(n) ? n : undefined });
                                }}
                                placeholder="bv. 360"
                                inputMode="numeric"
                              />
                            </Field>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Breedte">
                              <select className={`${iCls} ${iBdr}`} value={e.size || 'lg'} onChange={(ev) => updateElement(e.id, { size: ev.target.value })}>
                                <option value="sm">S</option>
                                <option value="md">M</option>
                                <option value="lg">L</option>
                                <option value="xl">XL</option>
                                <option value="full">Vol</option>
                              </select>
                            </Field>
                            <Field label="Uitlijning">
                              <select className={`${iCls} ${iBdr}`} value={e.align || 'center'} onChange={(ev) => updateElement(e.id, { align: ev.target.value })}>
                                <option value="left">Links</option>
                                <option value="center">Midden</option>
                                <option value="right">Rechts</option>
                              </select>
                            </Field>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Aspect ratio">
                              <select className={`${iCls} ${iBdr}`} value={e.aspect || '16:9'} onChange={(ev) => updateElement(e.id, { aspect: ev.target.value })}>
                                <option value="auto">Auto</option>
                                <option value="16:9">16:9</option>
                                <option value="4:3">4:3</option>
                                <option value="1:1">1:1</option>
                              </select>
                            </Field>
                            <Field label="Fit">
                              <select className={`${iCls} ${iBdr}`} value={e.fit || 'cover'} onChange={(ev) => updateElement(e.id, { fit: ev.target.value })}>
                                <option value="cover">Cover</option>
                                <option value="contain">Contain</option>
                              </select>
                            </Field>
                          </div>
                          {String(e.aspect || '16:9') === 'auto' && (
                            <Field label="Hoogte">
                              <select className={`${iCls} ${iBdr}`} value={String(e.height || 320)} onChange={(ev) => updateElement(e.id, { height: Number(ev.target.value) })}>
                                <option value="180">S</option>
                                <option value="240">M</option>
                                <option value="320">L</option>
                                <option value="420">XL</option>
                              </select>
                            </Field>
                          )}
                          <Field label="Hoeken">
                            <select className={`${iCls} ${iBdr}`} value={e.rounded === false ? 'square' : 'rounded'} onChange={(ev) => updateElement(e.id, { rounded: ev.target.value !== 'square' })}>
                              <option value="rounded">Rond</option>
                              <option value="square">Vierkant</option>
                            </select>
                          </Field>
                          <Field label="Stijl">
                            <select className={`${iCls} ${iBdr}`} value={e.style || 'shadow'} onChange={(ev) => updateElement(e.id, { style: ev.target.value })}>
                              <option value="plain">Zonder</option>
                              <option value="frame">Frame</option>
                              <option value="shadow">Shadow</option>
                            </select>
                          </Field>
                        </div>
                      </div>
                    )}

                    {e.type === 'button' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label="Tekst">
                          <input className={`${iCls} ${iBdr}`} value={e.text || ''} onChange={(ev) => updateElement(e.id, { text: ev.target.value })} />
                        </Field>
                        <Field label="Link">
                          <input className={`${iCls} ${iBdr}`} value={e.href || ''} onChange={(ev) => updateElement(e.id, { href: ev.target.value })} />
                        </Field>
                        <Field label="Stijl">
                          <select className={`${iCls} ${iBdr}`} value={e.variant || 'primary'} onChange={(ev) => updateElement(e.id, { variant: ev.target.value })}>
                            <option value="primary">Primair</option>
                            <option value="secondary">Secundair</option>
                          </select>
                        </Field>
                        <Field label="Uitlijning">
                          <select className={`${iCls} ${iBdr}`} value={e.align || 'left'} onChange={(ev) => updateElement(e.id, { align: ev.target.value })}>
                            <option value="left">Links</option>
                            <option value="center">Midden</option>
                          </select>
                        </Field>
                      </div>
                    )}

                    {e.type === 'spacer' && (
                      <Field label="Hoogte">
                        <select className={`${iCls} ${iBdr}`} value={String(e.size || 24)} onChange={(ev) => updateElement(e.id, { size: Number(ev.target.value) })}>
                          <option value="12">12px</option>
                          <option value="24">24px</option>
                          <option value="36">36px</option>
                          <option value="48">48px</option>
                          <option value="64">64px</option>
                        </select>
                      </Field>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9' }}>
        <div className="px-5 py-3" style={{ background: '#f8fafc' }}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Preview</p>
        </div>
        <div className="p-5 bg-white">
          <div className={`${data?.background === 'dark' ? 'bg-secondary text-white' : data?.background === 'gray' ? 'bg-gray-50 text-secondary' : 'bg-white text-secondary'} ${data?.variant === 'card' ? 'rounded-3xl p-10' : 'rounded-3xl p-8'}`} style={{ border: '1px solid #f1f5f9' }}>
            <div className={`${data?.gap === 'sm' ? 'space-y-3' : data?.gap === 'lg' ? 'space-y-8' : 'space-y-4'}`}>
              {elements.map((e) => {
                if (!e || !e.type) return null;
                if (e.type === 'spacer') return <div key={e.id} style={{ height: Number(e.size) || 24 }} />;
                if (e.type === 'heading') {
                  const level = Number(e.level) || 2;
                  const cls = level === 3 ? 'text-2xl font-black' : level === 4 ? 'text-xl font-black' : 'text-3xl font-black';
                  const align = e.align === 'center' ? 'text-center' : 'text-left';
                  const Tag = level === 4 ? 'h4' : level === 3 ? 'h3' : 'h2';
                  return <Tag key={e.id} className={`${cls} ${align}`}>{e.text}</Tag>;
                }
                if (e.type === 'text') {
                  const align = e.align === 'center' ? 'text-center' : 'text-left';
                  return <p key={e.id} className={`${data?.background === 'dark' ? 'text-white/70' : 'text-gray-500'} ${align}`}>{e.text}</p>;
                }
                if (e.type === 'image') {
                  if (!e.url) return null;
                  const maxWidth = e.size === 'sm' ? 420 : e.size === 'md' ? 640 : e.size === 'xl' ? 1024 : e.size === 'full' ? '100%' : 800;
                  const explicitW = Number(e.widthPx);
                  const explicitH = Number(e.heightPx);
                  const computedMaxWidth = Number.isFinite(explicitW) && explicitW > 0 ? explicitW : maxWidth;
                  const align = e.align === 'left' ? 'justify-start' : e.align === 'right' ? 'justify-end' : 'justify-center';
                  const ratio = e.aspect === '4:3' ? '4 / 3' : e.aspect === '1:1' ? '1 / 1' : e.aspect === 'auto' ? null : '16 / 9';
                  const frame = e.style === 'frame';
                  const shadow = e.style === 'shadow';
                  return (
                    <div key={e.id} className={`flex ${align}`}>
                      <div style={{ width: '100%', maxWidth: computedMaxWidth }}>
                        <div
                          className={`overflow-hidden ${e.rounded === false ? 'rounded-xl' : 'rounded-3xl'} ${shadow ? 'shadow-2xl' : ''}`}
                          style={{
                            border: frame ? (data?.background === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0') : 'none',
                            aspectRatio: (Number.isFinite(explicitH) && explicitH > 0) ? undefined : (ratio || undefined),
                            height: Number.isFinite(explicitH) && explicitH > 0 ? explicitH : (ratio ? undefined : (Number(e.height) || 320)),
                            background: data?.background === 'dark' ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                          }}
                        >
                          <img
                            src={e.url}
                            alt={e.alt || ''}
                            className="w-full h-full"
                            style={{ objectFit: e.fit === 'contain' ? 'contain' : 'cover' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
                if (e.type === 'button') {
                  const variant = e.variant || 'primary';
                  const className = variant === 'secondary'
                    ? (data?.background === 'dark'
                      ? 'px-6 py-3 bg-white/10 border border-white/20 text-white rounded-full font-black text-sm inline-flex'
                      : 'px-6 py-3 bg-secondary text-white rounded-full font-black text-sm inline-flex')
                    : 'px-6 py-3 bg-primary text-white rounded-full font-black text-sm inline-flex';
                  const align = e.align === 'center' ? 'justify-center' : 'justify-start';
                  return (
                    <div key={e.id} className={`flex ${align}`}>
                      <span className={className}>{e.text}</span>
                    </div>
                  );
                }
                if (e.type === 'divider') {
                  return <div key={e.id} className={`h-px w-full ${data?.background === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`} />;
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return (
    <div className="space-y-3">
      <Field label="Titel">
        <input className={`${iCls} ${iBdr}`} value={d.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      </Field>
      <Field label="Tekst">
        <textarea className={`${taCls} ${iBdr}`} rows={3} value={d.subtext || ''} onChange={(e) => set({ subtext: e.target.value })} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Knop">
          <input className={`${iCls} ${iBdr}`} value={d.buttonText || ''} onChange={(e) => set({ buttonText: e.target.value })} />
        </Field>
        <Field label="Achtergrond kleur">
          <input className={`${iCls} ${iBdr}`} value={d.bgColor || ''} onChange={(e) => set({ bgColor: e.target.value })} placeholder="#0c4684" />
        </Field>
        <Field label="Tekst kleur">
          <input className={`${iCls} ${iBdr}`} value={d.textColor || ''} onChange={(e) => set({ textColor: e.target.value })} placeholder="#ffffff" />
        </Field>
      </div>
    </div>
  );
}

function TextBlockEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return (
    <div className="space-y-3">
      <Field label="Titel">
        <input className={`${iCls} ${iBdr}`} value={d.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      </Field>
      <Field label="Tekst">
        <textarea className={`${taCls} ${iBdr}`} rows={6} value={d.body || ''} onChange={(e) => set({ body: e.target.value })} />
      </Field>
    </div>
  );
}

function FeatureGridEditor({ data, onChange }) {
  const d = data || {};
  const items = Array.isArray(d.items) ? d.items : [];
  const set = (patch) => onChange({ ...d, ...patch });
  const setItems = (next) => set({ items: next });
  return (
    <div className="space-y-3">
      <Field label="Titel">
        <input className={`${iCls} ${iBdr}`} value={d.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      </Field>
      <div className="space-y-2">
        {items.map((it, i) => (
          <ItemCard
            key={i}
            number={i}
            onDuplicate={() => setItems([...items.slice(0, i + 1), { ...(items[i] || {}) }, ...items.slice(i + 1)])}
            onDelete={() => setItems(items.filter((_, j) => j !== i))}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Icoon">
                <input className={`${iCls} ${iBdr}`} value={it.icon || ''} onChange={(e) => { const a=[...items]; a[i]={...a[i],icon:e.target.value}; setItems(a); }} placeholder="⚡" />
              </Field>
              <Field label="Titel">
                <input className={`${iCls} ${iBdr}`} value={it.title || ''} onChange={(e) => { const a=[...items]; a[i]={...a[i],title:e.target.value}; setItems(a); }} />
              </Field>
              <Field label="Tekst">
                <input className={`${iCls} ${iBdr}`} value={it.description || ''} onChange={(e) => { const a=[...items]; a[i]={...a[i],description:e.target.value}; setItems(a); }} />
              </Field>
            </div>
          </ItemCard>
        ))}
        <AddButton onClick={() => setItems([...items, { icon: '✨', title: '', description: '' }])} label="Item toevoegen" />
      </div>
    </div>
  );
}

function ImageTextEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Titel">
          <input className={`${iCls} ${iBdr}`} value={d.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
        </Field>
        <Field label="Afbeelding positie">
          <select className={`${iCls} ${iBdr}`} value={d.imagePosition || 'left'} onChange={(e) => set({ imagePosition: e.target.value })}>
            <option value="left">Links</option>
            <option value="right">Rechts</option>
          </select>
        </Field>
      </div>
      <Field label="Tekst">
        <textarea className={`${taCls} ${iBdr}`} rows={5} value={d.body || ''} onChange={(e) => set({ body: e.target.value })} />
      </Field>
      <Field label="Afbeelding">
        <ImageField value={d.imageUrl || ''} onChange={(v) => set({ imageUrl: v })} height={22} />
      </Field>
    </div>
  );
}

function StatsRowEditor({ data, onChange }) {
  const d = data || {};
  const items = Array.isArray(d.items) ? d.items : [];
  const setItems = (next) => onChange({ ...d, items: next });
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <ItemCard
          key={i}
          number={i}
          onDuplicate={() => setItems([...items.slice(0, i + 1), { ...(items[i] || {}) }, ...items.slice(i + 1)])}
          onDelete={() => setItems(items.filter((_, j) => j !== i))}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nummer">
              <input className={`${iCls} ${iBdr}`} value={it.number || ''} onChange={(e) => { const a=[...items]; a[i]={...a[i],number:e.target.value}; setItems(a); }} />
            </Field>
            <Field label="Label">
              <input className={`${iCls} ${iBdr}`} value={it.label || ''} onChange={(e) => { const a=[...items]; a[i]={...a[i],label:e.target.value}; setItems(a); }} />
            </Field>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => setItems([...items, { number: '', label: '' }])} label="Stat toevoegen" />
    </div>
  );
}

function CtaBlockEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return (
    <div className="space-y-3">
      <Field label="Titel">
        <input className={`${iCls} ${iBdr}`} value={d.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      </Field>
      <Field label="Tekst">
        <textarea className={`${taCls} ${iBdr}`} rows={3} value={d.subtext || ''} onChange={(e) => set({ subtext: e.target.value })} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Primaire knop">
          <input className={`${iCls} ${iBdr}`} value={d.primaryButton || ''} onChange={(e) => set({ primaryButton: e.target.value })} />
        </Field>
        <Field label="Secundaire knop">
          <input className={`${iCls} ${iBdr}`} value={d.secondaryButton || ''} onChange={(e) => set({ secondaryButton: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

function StepsEditor({ data, onChange }) {
  const d = data || {};
  const items = Array.isArray(d.items) ? d.items : [];
  const set = (patch) => onChange({ ...d, ...patch });
  const setItems = (next) => set({ items: next });
  return (
    <div className="space-y-3">
      <Field label="Titel">
        <input className={`${iCls} ${iBdr}`} value={d.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      </Field>
      <div className="space-y-2">
        {items.map((it, i) => (
          <ItemCard
            key={i}
            number={i}
            onDuplicate={() => setItems([...items.slice(0, i + 1), { ...(items[i] || {}) }, ...items.slice(i + 1)])}
            onDelete={() => setItems(items.filter((_, j) => j !== i))}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Nummer">
                <input className={`${iCls} ${iBdr}`} value={it.number || String(i + 1)} onChange={(e) => { const a=[...items]; a[i]={...a[i],number:e.target.value}; setItems(a); }} />
              </Field>
              <Field label="Titel">
                <input className={`${iCls} ${iBdr}`} value={it.title || ''} onChange={(e) => { const a=[...items]; a[i]={...a[i],title:e.target.value}; setItems(a); }} />
              </Field>
              <Field label="Tekst">
                <input className={`${iCls} ${iBdr}`} value={it.description || ''} onChange={(e) => { const a=[...items]; a[i]={...a[i],description:e.target.value}; setItems(a); }} />
              </Field>
            </div>
          </ItemCard>
        ))}
        <AddButton onClick={() => setItems([...items, { number: String(items.length + 1), title: '', description: '' }])} label="Stap toevoegen" />
      </div>
    </div>
  );
}

function BlogPostEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return (
    <div className="space-y-3">
      <Field label="Titel">
        <input className={`${iCls} ${iBdr}`} value={d.title || ''} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <Field label="Excerpt">
        <textarea className={`${taCls} ${iBdr}`} rows={3} value={d.excerpt || ''} onChange={(e) => set({ excerpt: e.target.value })} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Datum">
          <input className={`${iCls} ${iBdr}`} value={d.date || ''} onChange={(e) => set({ date: e.target.value })} placeholder="2026-01-01" />
        </Field>
        <Field label="Auteur">
          <input className={`${iCls} ${iBdr}`} value={d.author || ''} onChange={(e) => set({ author: e.target.value })} />
        </Field>
      </div>
      <Field label="Afbeelding">
        <ImageField value={d.imageUrl || ''} onChange={(v) => set({ imageUrl: v })} height={22} />
      </Field>
    </div>
  );
}

function BlockFormEditor({ type, data, onChange }) {
  if (type === 'banner') return <BannerEditor data={data} onChange={onChange} />;
  if (type === 'text_block') return <TextBlockEditor data={data} onChange={onChange} />;
  if (type === 'feature_grid') return <FeatureGridEditor data={data} onChange={onChange} />;
  if (type === 'image_text') return <ImageTextEditor data={data} onChange={onChange} />;
  if (type === 'stats_row') return <StatsRowEditor data={data} onChange={onChange} />;
  if (type === 'cta_block') return <CtaBlockEditor data={data} onChange={onChange} />;
  if (type === 'steps') return <StepsEditor data={data} onChange={onChange} />;
  if (type === 'blog_post') return <BlogPostEditor data={data} onChange={onChange} />;
  return null;
}

function hasFormEditor(type) {
  return ['banner', 'text_block', 'feature_grid', 'image_text', 'stats_row', 'cta_block', 'steps', 'blog_post'].includes(type);
}

function SortableBlockCard({ block, active, draft, error, mountOptions, onSelect, onDuplicate, onDelete, onChangeType, onToggleVisible, onChangeMount, onChangeDraft }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl overflow-hidden transition-all ${isDragging ? 'opacity-80' : ''}`}
      style={{ ...style, border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid #f1f5f9', boxShadow: active ? '0 6px 24px rgba(59,130,246,0.12)' : '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <button
        type="button"
        onClick={() => onSelect(block.id)}
        className="w-full px-5 py-3.5 flex items-center justify-between transition-colors hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            {...attributes}
            {...listeners}
            className="text-white/60 shrink-0"
            title="Slepen"
          >
            <GripVertical size={14} />
          </span>
          <h3 className="text-xs font-black text-white uppercase tracking-[0.15em] truncate">
            {block.type}{block.visible === false ? ' (verborgen)' : ''}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Dupliceren"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
            className="p-1.5 rounded-lg text-white/40 hover:text-red-300 hover:bg-white/10 transition-colors"
            title="Verwijderen"
          >
            <Trash2 size={14} />
          </button>
          <ChevronDown size={14} className={`text-white/40 transition-transform duration-200 ${active ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {active && (
        <div className="p-4 border-t border-gray-100 bg-white space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Type">
              <select className={`${iCls} ${iBdr}`} value={block.type} onChange={(e) => onChangeType(block.id, e.target.value)}>
                {['banner', 'text_block', 'feature_grid', 'image_text', 'stats_row', 'cta_block', 'steps', 'blog_post', 'layout_builder'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Plaatsing">
              <select
                className={`${iCls} ${iBdr}`}
                value={block.mount || mountOptions?.[0]?.value || 'end'}
                onChange={(e) => onChangeMount(block.id, e.target.value)}
              >
                {(mountOptions || [{ value: 'end', label: 'Onder aan pagina' }]).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Zichtbaar">
              <button
                type="button"
                onClick={() => onToggleVisible(block.id)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-black transition-colors ${block.visible === false ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                {block.visible === false ? 'Verborgen' : 'Zichtbaar'}
              </button>
            </Field>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
              {String(error)}
            </div>
          )}
          <Field label="Data (JSON)">
            <textarea
              className={`${taCls} ${iBdr}`}
              rows={10}
              value={draft}
              onChange={(e) => onChangeDraft(block.id, e.target.value)}
              placeholder={'{\n  "heading": "..." \n}'}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// ── Defaults ─────────────────────────────────────────────────────
const HOME_DEFAULTS = {
  hero: { title: 'Kwaliteit die straalt.', titlePrefix: 'Verlichting voor', subtitle: '', backgroundImage: '', primaryButtonText: 'START PROJECT', secondaryButtonText: 'BEKIJK CASES', typewriterWords: ['bedrijfswagens.', 'bouwplaatsen.', 'werkplaatsen.', 'professionals.'] },
  introduction: { badge: 'Duurzame Toekomst', marqueeText: 'LED SPECIALISTS' },
  introSection: { badge: 'Over ALRA LED', heading: 'Professionele LED-oplossingen voor de moderne werkplek', description: 'Wij zijn specialist in hoogwaardige LED-verlichting voor bedrijfswagens, bouwplaatsen en werkplaatsen.', linkText: 'Meer over ons', deliveryTitle: 'Direct leverbaar uit voorraad', deliverySubtitle: 'Snelle levering in heel Nederland en België' },
  dealersCta: { title: 'Waar te koop?', subtitle: 'Vind een verkooppunt bij jou in de buurt.', buttonText: 'Bekijk verkooppunten' },
  specializations: [],
  stats: [],
  process: { title: '', description: '', buttonText: '', steps: [] },
  cta: { title: '', subtitle: '', primaryButton: '', secondaryButton: '' },
};

const BLOCK_PRESETS = {
  banner_primary: {
    label: 'Banner – Primair',
    type: 'banner',
    data: {
      heading: 'Klaar voor een upgrade?',
      subtext: 'Neem contact op voor advies of een oplossing op maat.',
      buttonText: 'Neem contact op',
      bgColor: '#0c4684',
      textColor: '#ffffff',
    },
  },
  banner_dark: {
    label: 'Banner – Donker',
    type: 'banner',
    data: {
      heading: 'Professionele LED-oplossingen',
      subtext: 'Kwaliteit, duurzaamheid en betrouwbare prestaties.',
      buttonText: 'Offerte aanvragen',
      bgColor: '#0f172a',
      textColor: '#ffffff',
    },
  },
  text_block_intro: {
    label: 'Tekstblok – Intro',
    type: 'text_block',
    data: {
      heading: 'Waarom kiezen voor ALRA LED?',
      body: 'Wij leveren professionele LED-verlichting voor de moderne werkplek.\n\nVoeg hier je eigen tekst toe.',
    },
  },
  feature_grid_3: {
    label: 'Voordelen grid – 3 items',
    type: 'feature_grid',
    data: {
      heading: 'Voordelen',
      items: [
        { icon: '⚡', title: 'Hoge lichtopbrengst', description: 'Helder, efficiënt en betrouwbaar.' },
        { icon: '🛡️', title: 'Duurzaam', description: 'Gemaakt voor intensief professioneel gebruik.' },
        { icon: '🔧', title: 'Maatwerk', description: 'Wij denken mee van idee tot oplossing.' },
      ],
    },
  },
  image_text_left: {
    label: 'Afbeelding + tekst – Links',
    type: 'image_text',
    data: {
      heading: 'Project in beeld',
      body: 'Beschrijf hier een toepassing, product of resultaat.\n\nJe kan meerdere regels gebruiken.',
      imageUrl: '',
      imagePosition: 'left',
    },
  },
  stats_row_4: {
    label: 'Statistieken – 4 items',
    type: 'stats_row',
    data: {
      items: [
        { number: '2014', label: 'Opgericht' },
        { number: '225+', label: 'Partners' },
        { number: 'A++', label: 'Kwaliteit' },
        { number: '2018', label: 'Eigen lijn' },
      ],
    },
  },
  cta_contact: {
    label: 'CTA – Contact',
    type: 'cta_block',
    data: {
      heading: 'Hulp nodig bij jouw project?',
      subtext: 'Laat je adviseren door onze specialisten.',
      primaryButton: 'Contact',
      secondaryButton: 'Webshop',
    },
  },
  blog_post: {
    label: 'Blogbericht',
    type: 'blog_post',
    data: {
      title: 'Titel van het artikel',
      excerpt: 'Korte samenvatting van het artikel.',
      date: '2026-01-01',
      author: 'ALRA LED',
      imageUrl: '',
    },
  },
  layout_builder: {
    label: 'Layout builder',
    type: 'layout_builder',
    data: {
      background: 'white',
      elements: [
        { id: 'e1', type: 'heading', text: 'Titel', level: 2, align: 'left' },
        { id: 'e2', type: 'text', text: 'Tekst', align: 'left' },
      ],
    },
  },
};

const TABS = [
  { id: 'home',    label: 'Homepagina',       icon: Home     },
  { id: 'about',   label: 'Over Ons',          icon: Info     },
  { id: 'contact', label: 'Contact',           icon: Phone    },
  { id: 'general', label: 'Instellingen',      icon: Settings },
  { id: 'logos',   label: "Partner Logo's",    icon: Image    },
];

const DEFAULT_HOME_LAYOUT = [
  'hero',
  'intro_banner',
  'over_ons',
  'cases',
  'stats',
  'logos',
  'featured',
  'testimonials',
  'process',
  'cta',
  'dealers_cta',
];

// ── Main component ────────────────────────────────────────────────
export default function Pages() {
  const [tab, setTab]       = useState('home');
  const [lang, setLang]     = useState('nl');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [homeAllSaving, setHomeAllSaving] = useState(false);
  const [homeAllSaved, setHomeAllSaved] = useState(false);
  const [homeLayoutRaw, setHomeLayoutRaw] = useState(null);
  const [homeSectionOrder, setHomeSectionOrder] = useState(DEFAULT_HOME_LAYOUT);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [home, setHome]       = useState(HOME_DEFAULTS);
  const [pageBlocks, setPageBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [blocksSaving, setBlocksSaving] = useState(false);
  const [blocksSaved, setBlocksSaved] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showNewBlock, setShowNewBlock] = useState(false);
  const [newBlockPreset, setNewBlockPreset] = useState('banner_primary');
  const [newBlockSearch, setNewBlockSearch] = useState('');
  const [blockDrafts, setBlockDrafts] = useState({});
  const [blockErrors, setBlockErrors] = useState({});
  const [about, setAbout]     = useState({ eyebrow: '', title: '', description: '', image: '', stats: [], values: [], timelineTitle: '', timeline: [] });
  const [contact, setContact] = useState({
    eyebrow: '',
    title: '',
    description: '',
    detailsTitle: '',
    addressLabel: '',
    phoneLabel: '',
    emailLabel: '',
    callTitle: '',
    callText: '',
    companyDetails: '',
    kvkLabel: '',
    vatLabel: '',
    kvkValue: '',
    vatValue: '',
    phone: '',
    email: '',
    address: '',
    successTitle: '',
    successText: '',
    newMessage: '',
    form: {
      nameLabel: '',
      emailLabel: '',
      subjectLabel: '',
      messageLabel: '',
      namePlaceholder: '',
      emailPlaceholder: '',
      subjectPlaceholder: '',
      messagePlaceholder: '',
      submit: '',
    },
  });
  const [general, setGeneral] = useState({
    tagline: '',
    footerDescription: '',
    footerPhone: '',
    footerEmail: '',
    footerAddress: '',
    newsletterTitle: '',
    newsletterText: '',
    newsletterPlaceholder: '',
    newsletterButton: '',
    navigationTitle: '',
    productsTitle: '',
    contactTitle: '',
    productLinks: [],
    privacyLabel: '',
    termsLabel: '',
    bottomCopy: '',
  });
  const [logos, setLogos]     = useState([]);
  const [logoUploading, setLogoUploading] = useState(false);

  const loadTab = async (key) => {
    setLoading(true);
    try {
      const res = await api.get(`/content/${key}`, { params: { lang } });
      if (key === 'home')    setHome({ ...HOME_DEFAULTS, ...res.data });
      if (key === 'about')   setAbout(res.data);
      if (key === 'contact') setContact(res.data);
      if (key === 'general') setGeneral(res.data);
      if (key === 'logos')   setLogos(Array.isArray(res.data) ? res.data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadTab(tab); }, [tab, lang]);

  const save = async (key, value) => {
    setSaving(true);
    try {
      await api.put(`/content/${key}`, value, { params: { lang } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    finally { setSaving(false); }
  };

  const saveHomeAll = async () => {
    if (Object.keys(blockErrors).length > 0) return;
    setHomeAllSaving(true);
    try {
      await api.put('/content/home', home, { params: { lang } });
      await api.put('/content/page_blocks_home', pageBlocks, { params: { lang } });
      await api.put('/content/layout_home_sections', homeSectionOrder, { params: { lang } });
      setHomeAllSaved(true);
      setTimeout(() => setHomeAllSaved(false), 2500);
    } catch {}
    finally { setHomeAllSaving(false); }
  };

  useEffect(() => {
    if (showNewBlock) setNewBlockSearch('');
  }, [showNewBlock]);

  useEffect(() => {
    const pageKey = tab === 'home'
      ? 'page_blocks_home'
      : tab === 'about'
        ? 'page_blocks_about'
        : tab === 'contact'
          ? 'page_blocks_contact'
          : null;
    if (!pageKey) return;
    setBlocksLoading(true);
    api.get(`/content/${pageKey}`, { params: { lang } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setPageBlocks(list);
        const nextDrafts = {};
        list.forEach((b) => { nextDrafts[b.id] = JSON.stringify(b.data || {}, null, 2); });
        setBlockDrafts(nextDrafts);
        setBlockErrors({});
        setActiveBlockId(null);
      })
      .catch(() => {
        setPageBlocks([]);
        setBlockDrafts({});
        setBlockErrors({});
        setActiveBlockId(null);
      })
      .finally(() => setBlocksLoading(false));
  }, [tab, lang]);

  const saveHomeBlocks = async () => {
    const pageKey = tab === 'home'
      ? 'page_blocks_home'
      : tab === 'about'
        ? 'page_blocks_about'
        : tab === 'contact'
          ? 'page_blocks_contact'
          : null;
    if (!pageKey) return;
    setBlocksSaving(true);
    try {
      await api.put(`/content/${pageKey}`, pageBlocks, { params: { lang } });
      setBlocksSaved(true);
      setTimeout(() => setBlocksSaved(false), 2500);
    } catch {}
    finally { setBlocksSaving(false); }
  };

  const onSelectBlock = (id) => setActiveBlockId((p) => (p === id ? null : id));

  const onDeleteBlock = (id) => {
    setPageBlocks((prev) => prev.filter((b) => b.id !== id));
    setBlockDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setBlockErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveBlockId((p) => (p === id ? null : p));
  };

  const onDuplicateBlock = (id) => {
    const original = pageBlocks.find((b) => b.id === id);
    if (!original) return;
    const newId = crypto.randomUUID();
    const copy = { ...original, id: newId, data: original.data ? JSON.parse(JSON.stringify(original.data)) : {} };
    setPageBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return [copy, ...prev];
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
    setBlockDrafts((prev) => ({ ...prev, [newId]: JSON.stringify(copy.data || {}, null, 2) }));
    return newId;
  };

  const onToggleVisible = (id) => {
    setPageBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, visible: b.visible === false ? true : false } : b)));
  };

  const onChangeMount = (id, mount) => {
    setPageBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, mount } : b)));
  };

  const onChangeType = (id, type) => {
    setPageBlocks((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      if (type === 'layout_builder') {
        const data = b.data && typeof b.data === 'object' ? b.data : {};
        const elements = Array.isArray(data.elements) ? data.elements : [];
        const nextData = { background: data.background || 'white', elements };
        return { ...b, type, data: nextData };
      }
      return { ...b, type };
    }));
  };

  const onChangeDraft = (id, text) => {
    setBlockDrafts((prev) => ({ ...prev, [id]: text }));
    try {
      const parsed = text.trim() ? JSON.parse(text) : {};
      setPageBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data: parsed } : b)));
      setBlockErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      setBlockErrors((prev) => ({ ...prev, [id]: 'Ongeldige JSON.' }));
    }
  };

  const onChangeData = (id, data) => {
    setPageBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data } : b)));
    setBlockDrafts((prev) => ({ ...prev, [id]: JSON.stringify(data || {}, null, 2) }));
    setBlockErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const mountOptions = tab === 'home'
    ? [
        { value: 'after_marquee', label: 'Na marquee' },
        { value: 'after_intro', label: 'Na intro + stats' },
        { value: 'after_specializations', label: 'Na specialisaties' },
        { value: 'before_dealers_cta', label: 'Voor verkooppunten CTA' },
        { value: 'before_testimonials', label: 'Voor ervaringen' },
        { value: 'after_testimonials', label: 'Na ervaringen' },
        { value: 'before_cta_banner', label: 'Voor CTA banner' },
        { value: 'after_cta_banner', label: 'Na CTA banner' },
        { value: 'end', label: 'Onder aan pagina' },
      ]
    : [
        { value: 'top', label: 'Boven aan pagina' },
        { value: 'bottom', label: 'Onder aan pagina' },
      ];

  useEffect(() => {
    if (tab !== 'home') return;
    api.get('/content/layout_home_sections', { params: { lang } })
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        const allowedFixed = new Set(DEFAULT_HOME_LAYOUT);
        const next = raw
          .filter((x) => typeof x === 'string')
          .filter((x) => allowedFixed.has(x) || x.startsWith('block:'));
        setHomeLayoutRaw(next);
      })
      .catch(() => {});
  }, [tab, lang]);

  useEffect(() => {
    if (tab !== 'home') return;

    const fixed = DEFAULT_HOME_LAYOUT;
    const fixedSet = new Set(fixed);
    const blockIds = pageBlocks.map((b) => b.id);
    const blockSet = new Set(blockIds);
    const raw = Array.isArray(homeLayoutRaw) ? homeLayoutRaw : fixed;

    const cleaned = raw.filter((x) => {
      if (fixedSet.has(x)) return true;
      if (x.startsWith('block:')) return blockSet.has(x.slice('block:'.length));
      return false;
    });

    const withMissingFixed = [...cleaned, ...fixed.filter((x) => !cleaned.includes(x))];
    const withMissingBlocks = [...withMissingFixed];
    blockIds.forEach((id) => {
      const key = `block:${id}`;
      if (!withMissingBlocks.includes(key)) withMissingBlocks.push(key);
    });

    setHomeSectionOrder(withMissingBlocks);
  }, [tab, homeLayoutRaw, pageBlocks]);

  const saveHomeLayout = async (order) => {
    try {
      await api.put('/content/layout_home_sections', order, { params: { lang } });
    } catch {}
  };

  // shortcuts
  const h = home.hero;              const setH     = v => setHome(p => ({ ...p, hero:           { ...p.hero,           ...v } }));
  const intro = home.introduction;  const setIntro  = v => setHome(p => ({ ...p, introduction:  { ...p.introduction,  ...v } }));
  const is = home.introSection || HOME_DEFAULTS.introSection;
                                    const setIs     = v => setHome(p => ({ ...p, introSection:  { ...(p.introSection || HOME_DEFAULTS.introSection), ...v } }));
  const dealersCta = home.dealersCta || HOME_DEFAULTS.dealersCta;
                                    const setDealersCta = v => setHome(p => ({ ...p, dealersCta: { ...(p.dealersCta || HOME_DEFAULTS.dealersCta), ...v } }));
  const specs = home.specializations || [];
                                    const setSpecs  = v => setHome(p => ({ ...p, specializations: v }));
  const stats = home.stats || [];   const setStats  = v => setHome(p => ({ ...p, stats: v }));
  const cta = home.cta;             const setCta    = v => setHome(p => ({ ...p, cta:            { ...p.cta,           ...v } }));
  const proc = home.process || { title:'', description:'', buttonText:'', steps:[] };
                                    const setProc   = v => setHome(p => ({ ...p, process:        { ...(p.process || {}), ...v } }));
  const steps = proc.steps || [];   const setSteps  = v => setHome(p => ({ ...p, process: { ...(p.process||{}), steps: v } }));

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pagina Inhoud</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Beheer teksten, afbeeldingen en secties op de storefront.</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewBlock(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-black hover:bg-gray-700 transition-colors"
          >
            <Plus size={16} /> Blok aanmaken
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          >
            <option value="nl">🇳🇱 Nederlands</option>
            <option value="en">🇬🇧 English</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: '#f1f5f9' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all"
              style={{
                background: active ? '#fff' : 'transparent',
                color: active ? '#1e40af' : '#94a3b8',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}>
              <Icon size={12} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Laden…</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ══ HOME ══ */}
          {tab === 'home' && (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  const oldIndex = homeSectionOrder.indexOf(active.id);
                  const newIndex = homeSectionOrder.indexOf(over.id);
                  if (oldIndex === -1 || newIndex === -1) return;
                  const next = arrayMove(homeSectionOrder, oldIndex, newIndex);
                  setHomeSectionOrder(next);
                  setHomeLayoutRaw(next);
                  saveHomeLayout(next);
                }}
              >
                <SortableContext items={homeSectionOrder} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {homeSectionOrder.map((id) => {
                      if (id === 'hero') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title="Hero Sectie" icon={Home} dragHandleProps={dragHandleProps}>
                                <Field label="Hoofdtitel">
                                  <input className={`${iCls} ${iBdr}`} value={h.title} onChange={e => setH({ title: e.target.value })} />
                                </Field>
                                <Field label="Titel prefix (vóór roterende tekst)">
                                  <input className={`${iCls} ${iBdr}`} value={h.titlePrefix || ''} onChange={e => setH({ titlePrefix: e.target.value })} placeholder="Verlichting voor" />
                                </Field>
                                <Field label="Ondertitel">
                                  <textarea className={`${taCls} ${iBdr}`} rows={3} value={h.subtitle} onChange={e => setH({ subtitle: e.target.value })} />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="Primaire knop">
                                    <input className={`${iCls} ${iBdr}`} value={h.primaryButtonText} onChange={e => setH({ primaryButtonText: e.target.value })} />
                                  </Field>
                                  <Field label="Secundaire knop">
                                    <input className={`${iCls} ${iBdr}`} value={h.secondaryButtonText} onChange={e => setH({ secondaryButtonText: e.target.value })} />
                                  </Field>
                                </div>
                                <Field label="Roterende tekst (komma-gescheiden)">
                                  <input 
                                    className={`${iCls} ${iBdr}`} 
                                    value={(h.typewriterWords || []).join(', ')} 
                                    onChange={e => setH({ typewriterWords: e.target.value.split(',').map(w => w.trim()).filter(Boolean) })} 
                                    placeholder="bedrijfswagens., bouwplaatsen., werkplaatsen."
                                  />
                                </Field>
                                <Field label="Achtergrondafbeelding">
                                  <ImageField value={h.backgroundImage} onChange={v => setH({ backgroundImage: v })} height={28} />
                                </Field>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'intro_banner') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title="Introductie banner" icon={LayoutGrid} defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="Badge tekst">
                                    <input className={`${iCls} ${iBdr}`} value={intro.badge} onChange={e => setIntro({ badge: e.target.value })} />
                                  </Field>
                                  <Field label="Marquee tekst">
                                    <input className={`${iCls} ${iBdr}`} value={intro.marqueeText} onChange={e => setIntro({ marqueeText: e.target.value })} />
                                  </Field>
                                </div>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'over_ons') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title="Over ons blok" defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="Badge label">
                                    <input className={`${iCls} ${iBdr}`} value={is.badge||''} onChange={e => setIs({ badge: e.target.value })} />
                                  </Field>
                                  <Field label="Link tekst">
                                    <input className={`${iCls} ${iBdr}`} value={is.linkText||''} onChange={e => setIs({ linkText: e.target.value })} />
                                  </Field>
                                </div>
                                <Field label="Koptekst">
                                  <input className={`${iCls} ${iBdr}`} value={is.heading||''} onChange={e => setIs({ heading: e.target.value })} />
                                </Field>
                                <Field label="Beschrijving">
                                  <textarea className={`${taCls} ${iBdr}`} rows={3} value={is.description||''} onChange={e => setIs({ description: e.target.value })} />
                                </Field>
                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                  <Field label="Levering kaart — titel">
                                    <input className={`${iCls} ${iBdr}`} value={is.deliveryTitle||''} onChange={e => setIs({ deliveryTitle: e.target.value })} />
                                  </Field>
                                  <Field label="Levering kaart — subtitel">
                                    <input className={`${iCls} ${iBdr}`} value={is.deliverySubtitle||''} onChange={e => setIs({ deliverySubtitle: e.target.value })} />
                                  </Field>
                                </div>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'cases') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title={`Cases / Specialisaties (${specs.length})`} defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <div className="space-y-3">
                                  {specs.map((s, i) => (
                                    <ItemCard key={i} number={i}
                                      onDuplicate={() => setSpecs([...specs.slice(0,i+1), { ...specs[i] }, ...specs.slice(i+1)])}
                                      onDelete={() => setSpecs(specs.filter((_,j) => j !== i))}>
                                      <Field label="Titel">
                                        <input className={`${iCls} ${iBdr}`} value={s.title||''} onChange={e => { const a=[...specs]; a[i]={...a[i],title:e.target.value}; setSpecs(a); }} />
                                      </Field>
                                      <Field label="Beschrijving">
                                        <textarea className={`${taCls} ${iBdr}`} rows={2} value={s.desc||''} onChange={e => { const a=[...specs]; a[i]={...a[i],desc:e.target.value}; setSpecs(a); }} />
                                      </Field>
                                      <Field label="Afbeelding">
                                        <ImageField value={s.image||''} onChange={v => { const a=[...specs]; a[i]={...a[i],image:v}; setSpecs(a); }} height={24} />
                                      </Field>
                                    </ItemCard>
                                  ))}
                                  <AddButton onClick={() => setSpecs([...specs, { title:'', desc:'', image:'' }])} label="Case toevoegen" />
                                </div>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'stats') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title={`Statistieken (${stats.length})`} defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <div className="space-y-2">
                                  {stats.map((s, i) => (
                                    <ItemCard key={i} number={i}
                                      onDuplicate={() => setStats([...stats.slice(0,i+1), { ...stats[i] }, ...stats.slice(i+1)])}
                                      onDelete={() => setStats(stats.filter((_,j) => j !== i))}>
                                      <div className="grid grid-cols-3 gap-2">
                                        <Field label="Waarde">
                                          <input className={`${iCls} ${iBdr}`} placeholder="bv. 10" value={s.value||''} onChange={e => { const a=[...stats]; a[i]={...a[i],value:e.target.value}; setStats(a); }} />
                                        </Field>
                                        <Field label="Suffix">
                                          <input className={`${iCls} ${iBdr}`} placeholder="bv. +" value={s.suffix||''} onChange={e => { const a=[...stats]; a[i]={...a[i],suffix:e.target.value}; setStats(a); }} />
                                        </Field>
                                        <Field label="Label">
                                          <input className={`${iCls} ${iBdr}`} placeholder="bv. Jaar ervaring" value={s.label||''} onChange={e => { const a=[...stats]; a[i]={...a[i],label:e.target.value}; setStats(a); }} />
                                        </Field>
                                      </div>
                                    </ItemCard>
                                  ))}
                                  <AddButton onClick={() => setStats([...stats, { value:'', suffix:'', label:'' }])} label="Statistiek toevoegen" />
                                </div>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'logos') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title="Partner logo's" icon={Image} defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <p className="text-sm text-gray-400">
                                  Deze sectie heeft geen velden. Verplaats om de positie op de homepage te bepalen.
                                </p>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'featured') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title="Uitgelichte producten" icon={LayoutGrid} defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <p className="text-sm text-gray-400">
                                  Deze sectie toont automatisch producten. Verplaats om de positie op de homepage te bepalen.
                                </p>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'testimonials') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title="Ervaringen" icon={LayoutGrid} defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <p className="text-sm text-gray-400">
                                  Deze sectie heeft nu vaste content. Verplaats om de positie op de homepage te bepalen.
                                </p>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'process') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title="Ontwikkeling / Process" defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="Titel">
                                    <input className={`${iCls} ${iBdr}`} value={proc.title||''} onChange={e => setProc({ title:e.target.value })} />
                                  </Field>
                                  <Field label="Knop tekst">
                                    <input className={`${iCls} ${iBdr}`} value={proc.buttonText||''} onChange={e => setProc({ buttonText:e.target.value })} />
                                  </Field>
                                </div>
                                <Field label="Beschrijving">
                                  <textarea className={`${taCls} ${iBdr}`} rows={3} value={proc.description||''} onChange={e => setProc({ description:e.target.value })} />
                                </Field>
                                <div className="space-y-2 pt-2">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Stappen</p>
                                  {steps.map((s, i) => (
                                    <ItemCard key={i} number={i}
                                      onDuplicate={() => setSteps([...steps.slice(0,i+1), { ...steps[i] }, ...steps.slice(i+1)])}
                                      onDelete={() => setSteps(steps.filter((_,j) => j !== i))}>
                                      <div className="grid grid-cols-2 gap-3">
                                        <Field label="Titel">
                                          <input className={`${iCls} ${iBdr}`} placeholder="bv. Idee" value={s.title||''} onChange={e => { const a=[...steps]; a[i]={...a[i],title:e.target.value}; setSteps(a); }} />
                                        </Field>
                                        <Field label="Beschrijving">
                                          <input className={`${iCls} ${iBdr}`} placeholder="Korte omschrijving" value={s.description||s.desc||''} onChange={e => { const a=[...steps]; a[i]={...a[i],description:e.target.value}; setSteps(a); }} />
                                        </Field>
                                      </div>
                                    </ItemCard>
                                  ))}
                                  <AddButton onClick={() => setSteps([...steps, { title:'', description:'' }])} label="Stap toevoegen" />
                                </div>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'cta') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title="CTA Sectie" defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="Primaire knop">
                                    <input className={`${iCls} ${iBdr}`} value={cta.primaryButton||''} onChange={e => setCta({ primaryButton:e.target.value })} />
                                  </Field>
                                  <Field label="Secundaire knop">
                                    <input className={`${iCls} ${iBdr}`} value={cta.secondaryButton||''} onChange={e => setCta({ secondaryButton:e.target.value })} />
                                  </Field>
                                </div>
                                <Field label="Titel">
                                  <input className={`${iCls} ${iBdr}`} value={cta.title||''} onChange={e => setCta({ title:e.target.value })} />
                                </Field>
                                <Field label="Ondertitel">
                                  <textarea className={`${taCls} ${iBdr}`} rows={2} value={cta.subtitle||''} onChange={e => setCta({ subtitle:e.target.value })} />
                                </Field>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id === 'dealers_cta') {
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title="Verkooppunten CTA" defaultOpen={false} dragHandleProps={dragHandleProps}>
                                <Field label="Titel">
                                  <input className={`${iCls} ${iBdr}`} value={dealersCta.title||''} onChange={e => setDealersCta({ title: e.target.value })} />
                                </Field>
                                <Field label="Ondertitel">
                                  <textarea className={`${taCls} ${iBdr}`} rows={2} value={dealersCta.subtitle||''} onChange={e => setDealersCta({ subtitle: e.target.value })} />
                                </Field>
                                <Field label="Knoptekst">
                                  <input className={`${iCls} ${iBdr}`} value={dealersCta.buttonText||''} onChange={e => setDealersCta({ buttonText: e.target.value })} />
                                </Field>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      if (id.startsWith('block:')) {
                        const blockId = id.slice('block:'.length);
                        const b = pageBlocks.find((x) => x.id === blockId);
                        if (!b) return null;
                        return (
                          <SortableSection key={id} id={id}>
                            {({ dragHandleProps }) => (
                              <Section title={`${b.type}${b.visible === false ? ' (verborgen)' : ''}`} icon={LayoutGrid} defaultOpen={b.type === 'layout_builder'} dragHandleProps={dragHandleProps}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Field label="Type">
                                    <select className={`${iCls} ${iBdr}`} value={b.type} onChange={(e) => onChangeType(blockId, e.target.value)}>
                                      {['banner', 'text_block', 'feature_grid', 'image_text', 'stats_row', 'cta_block', 'steps', 'blog_post', 'layout_builder'].map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                      ))}
                                    </select>
                                  </Field>
                                  <Field label="Zichtbaar">
                                    <button
                                      type="button"
                                      onClick={() => onToggleVisible(blockId)}
                                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-black transition-colors ${b.visible === false ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                    >
                                      {b.visible === false ? 'Verborgen' : 'Zichtbaar'}
                                    </button>
                                  </Field>
                                </div>

                                {blockErrors[blockId] && (
                                  <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
                                    {blockErrors[blockId]}
                                  </div>
                                )}

                                {b.type === 'layout_builder' ? (
                                  <BuilderEditor
                                    blockId={blockId}
                                    data={b.data || {}}
                                    onChangeData={(next) => onChangeData(blockId, next)}
                                  />
                                ) : (
                                  (() => {
                                    if (hasFormEditor(b.type)) {
                                      return <BlockFormEditor type={b.type} data={b.data || {}} onChange={(next) => onChangeData(blockId, next)} />;
                                    }
                                    return (
                                      <Field label="Data (JSON)">
                                        <textarea
                                          className={`${taCls} ${iBdr}`}
                                          rows={10}
                                          value={blockDrafts[blockId] ?? JSON.stringify(b.data || {}, null, 2)}
                                          onChange={(e) => onChangeDraft(blockId, e.target.value)}
                                          placeholder={'{\n  "heading": "..." \n}'}
                                        />
                                      </Field>
                                    );
                                  })()
                                )}

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newId = onDuplicateBlock(blockId);
                                      if (!newId) return;
                                      const next = [...homeSectionOrder];
                                      const idx = next.indexOf(id);
                                      if (idx !== -1) next.splice(idx + 1, 0, `block:${newId}`);
                                      else next.push(`block:${newId}`);
                                      setHomeLayoutRaw(next);
                                      saveHomeLayout(next);
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-600 hover:bg-gray-50"
                                  >
                                    Dupliceren
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteBlock(blockId);
                                      const next = homeSectionOrder.filter((x) => x !== id);
                                      setHomeLayoutRaw(next);
                                      saveHomeLayout(next);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700"
                                  >
                                    Verwijderen
                                  </button>
                                </div>
                              </Section>
                            )}
                          </SortableSection>
                        );
                      }

                      return null;
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              <SaveButton onSave={saveHomeAll} saving={homeAllSaving} saved={homeAllSaved} />
            </>
          )}

          {/* ══ ABOUT ══ */}
          {tab === 'about' && (<>
            <Section title="Over Ons Pagina" icon={Info}>
              <Field label="Eyebrow">
                <input className={`${iCls} ${iBdr}`} value={about.eyebrow||''} onChange={e => setAbout({ ...about, eyebrow:e.target.value })} />
              </Field>
              <Field label="Paginatitel">
                <input className={`${iCls} ${iBdr}`} value={about.title||''} onChange={e => setAbout({ ...about, title:e.target.value })} />
              </Field>
              <Field label="Beschrijving">
                <textarea className={`${taCls} ${iBdr}`} rows={5} value={about.description||''} onChange={e => setAbout({ ...about, description:e.target.value })} />
              </Field>
              <Field label="Afbeelding">
                <ImageField value={about.image||''} onChange={v => setAbout({ ...about, image:v })} height={28} />
              </Field>
            </Section>

            <Section title={`Statistieken (${(about.stats||[]).length})`} defaultOpen={false}>
              <div className="space-y-2">
                {(about.stats||[]).map((s, i) => (
                  <ItemCard key={i} number={i}
                    onDuplicate={() => { const a=about.stats||[]; setAbout({ ...about, stats:[...a.slice(0,i+1),{...a[i]},...a.slice(i+1)] }); }}
                    onDelete={() => setAbout({ ...about, stats:(about.stats||[]).filter((_,j)=>j!==i) })}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Label">
                        <input className={`${iCls} ${iBdr}`} placeholder="bv. Opgericht" value={s.label||''} onChange={e => { const a=[...(about.stats||[])]; a[i]={...a[i],label:e.target.value}; setAbout({...about,stats:a}); }} />
                      </Field>
                      <Field label="Waarde">
                        <input className={`${iCls} ${iBdr}`} placeholder="bv. 2014" value={s.value||''} onChange={e => { const a=[...(about.stats||[])]; a[i]={...a[i],value:e.target.value}; setAbout({...about,stats:a}); }} />
                      </Field>
                    </div>
                  </ItemCard>
                ))}
                <AddButton onClick={() => setAbout({ ...about, stats:[...(about.stats||[]),{label:'',value:''}] })} label="Statistiek toevoegen" />
              </div>
            </Section>

            <Section title={`Kernwaarden (${(about.values||[]).length})`} defaultOpen={false}>
              <div className="space-y-2">
                {(about.values||[]).map((v, i) => (
                  <ItemCard key={i} number={i}
                    onDuplicate={() => { const a=about.values||[]; setAbout({ ...about, values:[...a.slice(0,i+1),{...a[i]},...a.slice(i+1)] }); }}
                    onDelete={() => setAbout({ ...about, values:(about.values||[]).filter((_,j)=>j!==i) })}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Icoon (emoji)">
                        <input className={`${iCls} ${iBdr}`} placeholder="bv. ⚡" value={v.icon||''} onChange={e => { const a=[...(about.values||[])]; a[i]={...a[i],icon:e.target.value}; setAbout({...about,values:a}); }} />
                      </Field>
                      <Field label="Titel">
                        <input className={`${iCls} ${iBdr}`} value={v.title||''} onChange={e => { const a=[...(about.values||[])]; a[i]={...a[i],title:e.target.value}; setAbout({...about,values:a}); }} />
                      </Field>
                    </div>
                    <Field label="Tekst">
                      <textarea className={`${taCls} ${iBdr}`} rows={3} value={v.text||''} onChange={e => { const a=[...(about.values||[])]; a[i]={...a[i],text:e.target.value}; setAbout({...about,values:a}); }} />
                    </Field>
                  </ItemCard>
                ))}
                <AddButton onClick={() => setAbout({ ...about, values:[...(about.values||[]),{icon:'',title:'',text:''}] })} label="Waarde toevoegen" />
              </div>
            </Section>

            <Section title="Tijdlijn" defaultOpen={false}>
              <Field label="Titel">
                <input className={`${iCls} ${iBdr}`} value={about.timelineTitle||''} onChange={e => setAbout({ ...about, timelineTitle:e.target.value })} />
              </Field>
              <div className="space-y-2">
                {(about.timeline||[]).map((t, i) => (
                  <ItemCard key={i} number={i}
                    onDuplicate={() => { const a=about.timeline||[]; setAbout({ ...about, timeline:[...a.slice(0,i+1),{...a[i]},...a.slice(i+1)] }); }}
                    onDelete={() => setAbout({ ...about, timeline:(about.timeline||[]).filter((_,j)=>j!==i) })}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Jaar">
                        <input className={`${iCls} ${iBdr}`} placeholder="bv. 2014" value={t.year||''} onChange={e => { const a=[...(about.timeline||[])]; a[i]={...a[i],year:e.target.value}; setAbout({...about,timeline:a}); }} />
                      </Field>
                      <Field label="Label">
                        <input className={`${iCls} ${iBdr}`} value={t.label||''} onChange={e => { const a=[...(about.timeline||[])]; a[i]={...a[i],label:e.target.value}; setAbout({...about,timeline:a}); }} />
                      </Field>
                    </div>
                  </ItemCard>
                ))}
                <AddButton onClick={() => setAbout({ ...about, timeline:[...(about.timeline||[]),{year:'',label:''}] })} label="Tijdlijn item toevoegen" />
              </div>
            </Section>

            <Section title={`Pagina opbouw (${pageBlocks.length})`} icon={LayoutGrid} defaultOpen={false}>
              {blocksLoading ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Laden…</p>
                </div>
              ) : (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => {
                      const { active, over } = event;
                      if (!over || active.id === over.id) return;
                      const oldIndex = pageBlocks.findIndex((b) => b.id === active.id);
                      const newIndex = pageBlocks.findIndex((b) => b.id === over.id);
                      if (oldIndex === -1 || newIndex === -1) return;
                      setPageBlocks((items) => arrayMove(items, oldIndex, newIndex));
                    }}
                  >
                    <SortableContext items={pageBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {pageBlocks.map((b) => (
                          <SortableBlockCard
                            key={b.id}
                            block={b}
                            active={activeBlockId === b.id}
                            draft={blockDrafts[b.id] ?? JSON.stringify(b.data || {}, null, 2)}
                            error={blockErrors[b.id] || ''}
                            mountOptions={mountOptions}
                            onSelect={onSelectBlock}
                            onDuplicate={onDuplicateBlock}
                            onDelete={onDeleteBlock}
                            onChangeType={onChangeType}
                            onToggleVisible={onToggleVisible}
                            onChangeMount={onChangeMount}
                            onChangeDraft={onChangeDraft}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewBlock(true)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                      Nieuw blok
                    </button>
                    <button
                      type="button"
                      onClick={saveHomeBlocks}
                      disabled={blocksSaving || Object.keys(blockErrors).length > 0}
                      className={`px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-60 ${blocksSaved ? 'bg-emerald-600' : 'bg-gray-900 hover:bg-gray-700'}`}
                    >
                      {blocksSaving ? 'Opslaan…' : blocksSaved ? 'Opgeslagen!' : 'Blokken opslaan'}
                    </button>
                  </div>
                </>
              )}
            </Section>

            <SaveButton onSave={() => save('about', about)} saving={saving} saved={saved} />
          </>)}

          {/* ══ CONTACT ══ */}
          {tab === 'contact' && (<>
            <Section title="Contact Pagina" icon={Phone}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Eyebrow">
                  <input className={`${iCls} ${iBdr}`} value={contact.eyebrow||''} onChange={e => setContact({ ...contact, eyebrow:e.target.value })} />
                </Field>
                <Field label="Titel">
                  <input className={`${iCls} ${iBdr}`} value={contact.title||''} onChange={e => setContact({ ...contact, title:e.target.value })} />
                </Field>
              </div>
              <Field label="Beschrijving">
                <textarea className={`${taCls} ${iBdr}`} rows={3} value={contact.description||''} onChange={e => setContact({ ...contact, description:e.target.value })} />
              </Field>
            </Section>

            <Section title="Contactgegevens" defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Telefoonnummer">
                  <input className={`${iCls} ${iBdr}`} placeholder="+31 6 12345678" value={contact.phone||''} onChange={e => setContact({ ...contact, phone:e.target.value })} />
                </Field>
                <Field label="E-mailadres">
                  <input className={`${iCls} ${iBdr}`} placeholder="info@alraled.nl" value={contact.email||''} onChange={e => setContact({ ...contact, email:e.target.value })} />
                </Field>
              </div>
              <Field label="Adres">
                <input className={`${iCls} ${iBdr}`} placeholder="Straat 1, 1234 AB Stad" value={contact.address||''} onChange={e => setContact({ ...contact, address:e.target.value })} />
              </Field>
            </Section>

            <Section title="Labels & meldingen" defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Titel: Gegevens">
                  <input className={`${iCls} ${iBdr}`} value={contact.detailsTitle||''} onChange={e => setContact({ ...contact, detailsTitle:e.target.value })} />
                </Field>
                <Field label="Bedrijfsgegevens titel">
                  <input className={`${iCls} ${iBdr}`} value={contact.companyDetails||''} onChange={e => setContact({ ...contact, companyDetails:e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Label: Adres">
                  <input className={`${iCls} ${iBdr}`} value={contact.addressLabel||''} onChange={e => setContact({ ...contact, addressLabel:e.target.value })} />
                </Field>
                <Field label="Label: Telefoon">
                  <input className={`${iCls} ${iBdr}`} value={contact.phoneLabel||''} onChange={e => setContact({ ...contact, phoneLabel:e.target.value })} />
                </Field>
                <Field label="Label: Email">
                  <input className={`${iCls} ${iBdr}`} value={contact.emailLabel||''} onChange={e => setContact({ ...contact, emailLabel:e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Callout titel">
                  <input className={`${iCls} ${iBdr}`} value={contact.callTitle||''} onChange={e => setContact({ ...contact, callTitle:e.target.value })} />
                </Field>
                <Field label="Callout tekst">
                  <input className={`${iCls} ${iBdr}`} value={contact.callText||''} onChange={e => setContact({ ...contact, callText:e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Label: KvK">
                  <input className={`${iCls} ${iBdr}`} value={contact.kvkLabel||''} onChange={e => setContact({ ...contact, kvkLabel:e.target.value })} />
                </Field>
                <Field label="KvK nummer">
                  <input className={`${iCls} ${iBdr}`} value={contact.kvkValue||''} onChange={e => setContact({ ...contact, kvkValue:e.target.value })} />
                </Field>
                <Field label="Label: BTW">
                  <input className={`${iCls} ${iBdr}`} value={contact.vatLabel||''} onChange={e => setContact({ ...contact, vatLabel:e.target.value })} />
                </Field>
                <Field label="BTW nummer">
                  <input className={`${iCls} ${iBdr}`} value={contact.vatValue||''} onChange={e => setContact({ ...contact, vatValue:e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Succes titel">
                  <input className={`${iCls} ${iBdr}`} value={contact.successTitle||''} onChange={e => setContact({ ...contact, successTitle:e.target.value })} />
                </Field>
                <Field label="Succes tekst">
                  <input className={`${iCls} ${iBdr}`} value={contact.successText||''} onChange={e => setContact({ ...contact, successText:e.target.value })} />
                </Field>
                <Field label="Nieuw bericht knop">
                  <input className={`${iCls} ${iBdr}`} value={contact.newMessage||''} onChange={e => setContact({ ...contact, newMessage:e.target.value })} />
                </Field>
              </div>
            </Section>

            <Section title="Contactformulier" defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Label: Naam">
                  <input className={`${iCls} ${iBdr}`} value={contact.form?.nameLabel||''} onChange={e => setContact({ ...contact, form:{ ...(contact.form||{}), nameLabel:e.target.value } })} />
                </Field>
                <Field label="Placeholder: Naam">
                  <input className={`${iCls} ${iBdr}`} value={contact.form?.namePlaceholder||''} onChange={e => setContact({ ...contact, form:{ ...(contact.form||{}), namePlaceholder:e.target.value } })} />
                </Field>
                <Field label="Label: Email">
                  <input className={`${iCls} ${iBdr}`} value={contact.form?.emailLabel||''} onChange={e => setContact({ ...contact, form:{ ...(contact.form||{}), emailLabel:e.target.value } })} />
                </Field>
                <Field label="Placeholder: Email">
                  <input className={`${iCls} ${iBdr}`} value={contact.form?.emailPlaceholder||''} onChange={e => setContact({ ...contact, form:{ ...(contact.form||{}), emailPlaceholder:e.target.value } })} />
                </Field>
                <Field label="Label: Onderwerp">
                  <input className={`${iCls} ${iBdr}`} value={contact.form?.subjectLabel||''} onChange={e => setContact({ ...contact, form:{ ...(contact.form||{}), subjectLabel:e.target.value } })} />
                </Field>
                <Field label="Placeholder: Onderwerp">
                  <input className={`${iCls} ${iBdr}`} value={contact.form?.subjectPlaceholder||''} onChange={e => setContact({ ...contact, form:{ ...(contact.form||{}), subjectPlaceholder:e.target.value } })} />
                </Field>
                <Field label="Label: Bericht">
                  <input className={`${iCls} ${iBdr}`} value={contact.form?.messageLabel||''} onChange={e => setContact({ ...contact, form:{ ...(contact.form||{}), messageLabel:e.target.value } })} />
                </Field>
                <Field label="Placeholder: Bericht">
                  <input className={`${iCls} ${iBdr}`} value={contact.form?.messagePlaceholder||''} onChange={e => setContact({ ...contact, form:{ ...(contact.form||{}), messagePlaceholder:e.target.value } })} />
                </Field>
                <Field label="Knoptekst">
                  <input className={`${iCls} ${iBdr}`} value={contact.form?.submit||''} onChange={e => setContact({ ...contact, form:{ ...(contact.form||{}), submit:e.target.value } })} />
                </Field>
              </div>
            </Section>

            <Section title={`Pagina opbouw (${pageBlocks.length})`} icon={LayoutGrid} defaultOpen={false}>
              {blocksLoading ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Laden…</p>
                </div>
              ) : (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => {
                      const { active, over } = event;
                      if (!over || active.id === over.id) return;
                      const oldIndex = pageBlocks.findIndex((b) => b.id === active.id);
                      const newIndex = pageBlocks.findIndex((b) => b.id === over.id);
                      if (oldIndex === -1 || newIndex === -1) return;
                      setPageBlocks((items) => arrayMove(items, oldIndex, newIndex));
                    }}
                  >
                    <SortableContext items={pageBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {pageBlocks.map((b) => (
                          <SortableBlockCard
                            key={b.id}
                            block={b}
                            active={activeBlockId === b.id}
                            draft={blockDrafts[b.id] ?? JSON.stringify(b.data || {}, null, 2)}
                            error={blockErrors[b.id] || ''}
                            mountOptions={mountOptions}
                            onSelect={onSelectBlock}
                            onDuplicate={onDuplicateBlock}
                            onDelete={onDeleteBlock}
                            onChangeType={onChangeType}
                            onToggleVisible={onToggleVisible}
                            onChangeMount={onChangeMount}
                            onChangeDraft={onChangeDraft}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewBlock(true)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                      Nieuw blok
                    </button>
                    <button
                      type="button"
                      onClick={saveHomeBlocks}
                      disabled={blocksSaving || Object.keys(blockErrors).length > 0}
                      className={`px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-60 ${blocksSaved ? 'bg-emerald-600' : 'bg-gray-900 hover:bg-gray-700'}`}
                    >
                      {blocksSaving ? 'Opslaan…' : blocksSaved ? 'Opgeslagen!' : 'Blokken opslaan'}
                    </button>
                  </div>
                </>
              )}
            </Section>
            <SaveButton onSave={() => save('contact', contact)} saving={saving} saved={saved} />
          </>)}

          {/* ══ GENERAL ══ */}
          {tab === 'general' && (<>
            <Section title="Header" icon={Settings}>
              <Field label="Tagline (top bar)">
                <input className={`${iCls} ${iBdr}`} value={general.tagline||''} onChange={e => setGeneral({ ...general, tagline:e.target.value })} />
              </Field>
            </Section>
            <Section title="Newsletter" defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Titel">
                  <input className={`${iCls} ${iBdr}`} value={general.newsletterTitle||''} onChange={e => setGeneral({ ...general, newsletterTitle:e.target.value })} />
                </Field>
                <Field label="Knoptekst">
                  <input className={`${iCls} ${iBdr}`} value={general.newsletterButton||''} onChange={e => setGeneral({ ...general, newsletterButton:e.target.value })} />
                </Field>
              </div>
              <Field label="Tekst">
                <textarea className={`${taCls} ${iBdr}`} rows={2} value={general.newsletterText||''} onChange={e => setGeneral({ ...general, newsletterText:e.target.value })} />
              </Field>
              <Field label="Placeholder email">
                <input className={`${iCls} ${iBdr}`} value={general.newsletterPlaceholder||''} onChange={e => setGeneral({ ...general, newsletterPlaceholder:e.target.value })} />
              </Field>
            </Section>

            <Section title="Footer" defaultOpen={false}>
              <Field label="Bedrijfsbeschrijving">
                <textarea className={`${taCls} ${iBdr}`} rows={3} value={general.footerDescription||''} onChange={e => setGeneral({ ...general, footerDescription:e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefoon">
                  <input className={`${iCls} ${iBdr}`} value={general.footerPhone||''} onChange={e => setGeneral({ ...general, footerPhone:e.target.value })} />
                </Field>
                <Field label="Email">
                  <input className={`${iCls} ${iBdr}`} value={general.footerEmail||''} onChange={e => setGeneral({ ...general, footerEmail:e.target.value })} />
                </Field>
              </div>
              <Field label="Adres">
                <input className={`${iCls} ${iBdr}`} value={general.footerAddress||''} onChange={e => setGeneral({ ...general, footerAddress:e.target.value })} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Titel: Navigatie">
                  <input className={`${iCls} ${iBdr}`} value={general.navigationTitle||''} onChange={e => setGeneral({ ...general, navigationTitle:e.target.value })} />
                </Field>
                <Field label="Titel: Producten">
                  <input className={`${iCls} ${iBdr}`} value={general.productsTitle||''} onChange={e => setGeneral({ ...general, productsTitle:e.target.value })} />
                </Field>
                <Field label="Titel: Contact">
                  <input className={`${iCls} ${iBdr}`} value={general.contactTitle||''} onChange={e => setGeneral({ ...general, contactTitle:e.target.value })} />
                </Field>
              </div>
              <Field label="Product links">
                <div className="space-y-2">
                  {(general.productLinks||[]).map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input className={`${iCls} ${iBdr} flex-1`} value={p||''} onChange={e => { const a=[...(general.productLinks||[])]; a[i]=e.target.value; setGeneral({ ...general, productLinks:a }); }} />
                      <button type="button" onClick={() => setGeneral({ ...general, productLinks:(general.productLinks||[]).filter((_,j)=>j!==i) })}
                        className="px-3 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
                        ×
                      </button>
                    </div>
                  ))}
                  <AddButton onClick={() => setGeneral({ ...general, productLinks:[...(general.productLinks||[]), ''] })} label="Product link toevoegen" />
                </div>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Label: Privacy">
                  <input className={`${iCls} ${iBdr}`} value={general.privacyLabel||''} onChange={e => setGeneral({ ...general, privacyLabel:e.target.value })} />
                </Field>
                <Field label="Label: Voorwaarden">
                  <input className={`${iCls} ${iBdr}`} value={general.termsLabel||''} onChange={e => setGeneral({ ...general, termsLabel:e.target.value })} />
                </Field>
              </div>
              <Field label="Bottom copy">
                <input className={`${iCls} ${iBdr}`} value={general.bottomCopy||''} onChange={e => setGeneral({ ...general, bottomCopy:e.target.value })} />
              </Field>
            </Section>
            <SaveButton onSave={() => save('general', general)} saving={saving} saved={saved} />
          </>)}

          {/* ══ LOGOS ══ */}
          {tab === 'logos' && (<>
            <Section title={`Partner Logo's (${logos.length})`} icon={Image}>
              <p className="text-xs text-gray-400 leading-relaxed">
                Logo's die in de carrousel op de homepage verschijnen. Voeg een afbeelding toe of gebruik alleen een naam.
              </p>
              <div className="space-y-2 mt-1">
                {logos.map((logo, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background:'#f8fafc', border:'1px solid #f1f5f9' }}>
                    {logo.imageUrl ? (
                      <div className="relative w-16 h-10 shrink-0">
                        <img src={logo.imageUrl} alt={logo.name} className="w-full h-full object-contain rounded-lg" />
                        <button type="button" onClick={() => setLogos(logos.map((l,j) => j===i ? {...l,imageUrl:''} : l))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow">×</button>
                      </div>
                    ) : (
                      <label className="w-16 h-10 shrink-0 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-400 transition-colors" style={{ background:'#fff' }}>
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files[0]; if (!file) return;
                          setLogoUploading(true);
                          const fd = new FormData(); fd.append('image', file);
                          try { const r = await api.post('/uploads', fd, { headers:{'Content-Type':'multipart/form-data'} }); setLogos(logos.map((l,j) => j===i ? {...l,imageUrl:r.data.url} : l)); }
                          catch {} finally { setLogoUploading(false); }
                        }} />
                        <Upload size={14} className="text-gray-300" />
                      </label>
                    )}
                    <input className={`${iCls} ${iBdr} flex-1`} placeholder="Bedrijfsnaam" value={logo.name||''}
                      onChange={e => setLogos(logos.map((l,j) => j===i ? {...l,name:e.target.value} : l))} />
                    <button type="button" onClick={() => setLogos(logos.filter((_,j) => j!==i))}
                      className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <AddButton onClick={() => setLogos([...logos,{name:'',imageUrl:''}])} label="Logo toevoegen" />
                {logoUploading && <p className="text-xs text-blue-500 font-medium text-center">Uploaden…</p>}
              </div>
            </Section>
            <SaveButton onSave={() => save('logos', logos)} saving={saving} saved={saved} />
          </>)}

          {showNewBlock && ['home', 'about', 'contact'].includes(tab) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewBlock(false)} />
              <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                  <p className="font-black text-gray-900">Nieuw blok</p>
                  <button onClick={() => setShowNewBlock(false)} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <Field label="Preset">
                    <select className={`${iCls} ${iBdr}`} value={newBlockPreset} onChange={(e) => setNewBlockPreset(e.target.value)}>
                      {Object.entries(BLOCK_PRESETS).map(([key, preset]) => (
                        <option key={key} value={key}>{preset.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Zoeken">
                    <input
                      className={`${iCls} ${iBdr}`}
                      value={newBlockSearch}
                      onChange={(e) => setNewBlockSearch(e.target.value)}
                      placeholder="Zoek blokken…"
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(BLOCK_PRESETS)
                      .filter(([key, preset]) => {
                        const q = String(newBlockSearch || '').trim().toLowerCase();
                        if (!q) return true;
                        return `${key} ${preset.label} ${preset.type}`.toLowerCase().includes(q);
                      })
                      .map(([key, preset]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewBlockPreset(key)}
                        className={`px-4 py-3 rounded-2xl border text-left transition-colors ${newBlockPreset === key ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                      >
                        <p className="text-sm font-black text-gray-900">{preset.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{preset.type}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewBlock(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const id = crypto.randomUUID();
                      const preset = BLOCK_PRESETS[newBlockPreset] || BLOCK_PRESETS.banner_primary;
                      const mount = tab === 'home' ? undefined : 'bottom';
                      const data = preset.type === 'layout_builder'
                        ? {
                            ...(preset.data || {}),
                            elements: (preset.data?.elements || []).map((el) => ({ ...el, id: crypto.randomUUID() })),
                          }
                        : preset.data;
                      const block = { id, type: preset.type, visible: true, ...(mount ? { mount } : {}), data };
                      setPageBlocks((prev) => [block, ...prev]);
                      setBlockDrafts((prev) => ({ ...prev, [id]: JSON.stringify(block.data || {}, null, 2) }));
                      setActiveBlockId(id);
                      if (tab === 'home') {
                        const next = [...(Array.isArray(homeLayoutRaw) ? homeLayoutRaw : homeSectionOrder), `block:${id}`];
                        setHomeLayoutRaw(next);
                        saveHomeLayout(next);
                      }
                      setShowNewBlock(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                  >
                    Toevoegen
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
