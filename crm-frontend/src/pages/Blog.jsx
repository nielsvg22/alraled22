import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../lib/api';
import { errorText } from '../lib/errorText';
import { Save, CheckCircle, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Pencil, ArrowLeft } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import RichTextEditor from '../components/RichTextEditor';

const iCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white';
const labelCls = 'block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5';

const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `post-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const plain = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// Blogberichten staan op de site onder "Nieuws". Ze worden opgeslagen als blokken van het type
// blog_post (zelfde opslag als Pagina Bouwer > Blog), zodat beide altijd gelijk lopen.
export default function Blog() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('nl');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setEditingId(null);
    api.get('/content/page_blocks_blog', { params: { lang } })
      .then(r => setBlocks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  }, [lang]);

  const isPost = (b) => b && ['blog_post', 'image_text', 'text_block'].includes(b.type);
  const posts = blocks.filter(isPost);

  const persist = async (next) => {
    setSaving(true);
    setError('');
    try {
      await api.put('/content/page_blocks_blog', next, { params: { lang } });
      setBlocks(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return true;
    } catch (e) {
      setError(`Opslaan mislukt: ${errorText(e, 'onbekende fout')}. Je wijzigingen zijn niet opgeslagen.`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePost = (id, patch) => setBlocks(bs => bs.map(b => b.id === id ? { ...b, data: { ...(b.data || {}), ...patch } } : b));

  const addPost = () => {
    const post = {
      id: newId(), type: 'blog_post', visible: true,
      data: { title: '', excerpt: '', content: '', imageUrl: '', author: 'ALRA LED Team', date: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) },
    };
    setBlocks(bs => [post, ...bs]);
    setEditingId(post.id);
  };

  const removePost = async (id) => {
    if (!window.confirm('Dit bericht verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
    const next = blocks.filter(b => b.id !== id);
    if (await persist(next)) setEditingId(null);
  };

  const toggleVisible = (id) => persist(blocks.map(b => b.id === id ? { ...b, visible: b.visible === false } : b));

  const move = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id);
    // alleen ten opzichte van andere berichten verschuiven
    let j = idx + dir;
    while (j >= 0 && j < blocks.length && !isPost(blocks[j])) j += dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[j]] = [next[j], next[idx]];
    persist(next);
  };

  if (loading) return <div className="p-8 text-gray-400 text-sm animate-pulse">Laden...</div>;

  const editing = blocks.find(b => b.id === editingId);

  // ── Bewerken ──
  if (editing) {
    const d = editing.data || {};
    const isNew = !d.title && !d.content;
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900">
            <ArrowLeft size={16} /> Alle berichten
          </button>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={editing.visible !== false} onChange={e => setBlocks(bs => bs.map(b => b.id === editing.id ? { ...b, visible: e.target.checked } : b))} />
              Zichtbaar op de website
            </label>
            <button onClick={() => persist(blocks)} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: saved ? 'linear-gradient(135deg,#065f46,#10b981)' : 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>
              {saved ? <><CheckCircle size={15} /> Opgeslagen!</> : saving ? 'Opslaan…' : <><Save size={15} /> Opslaan</>}
            </button>
          </div>
        </div>
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-xl font-black text-gray-900">{isNew ? 'Nieuw bericht' : 'Bericht bewerken'}</h2>
          <div>
            <label className={labelCls}>Titel</label>
            <input className={iCls} value={d.title || ''} onChange={e => updatePost(editing.id, { title: e.target.value })} placeholder="Titel van het bericht" />
          </div>
          <div>
            <label className={labelCls}>Omslagfoto</label>
            <ImageUploader value={d.imageUrl || ''} onChange={v => updatePost(editing.id, { imageUrl: v })} label={null} />
          </div>
          <div>
            <label className={labelCls}>Samenvatting (korte tekst op het overzicht)</label>
            <textarea className={`${iCls} resize-none`} rows={3} value={d.excerpt || ''} onChange={e => updatePost(editing.id, { excerpt: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Inhoud</label>
            <RichTextEditor tables minHeight="24rem" value={d.content || ''} onChange={html => updatePost(editing.id, { content: html })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Auteur</label>
              <input className={iCls} value={d.author || ''} onChange={e => updatePost(editing.id, { author: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Datum</label>
              <input className={iCls} value={d.date || ''} onChange={e => updatePost(editing.id, { date: e.target.value })} placeholder="bv. 10 maart 2026" />
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <button onClick={() => removePost(editing.id)} className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700">
            <Trash2 size={15} /> Bericht verwijderen
          </button>
        </div>
      </div>
    );
  }

  // ── Overzicht ──
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Blog</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Beheer de berichten op de pagina "Nieuws" van de website</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={lang} onChange={e => setLang(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700">
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
          <button onClick={addPost} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black text-white" style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>
            <Plus size={16} /> Nieuw bericht
          </button>
        </div>
      </div>
      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="font-bold text-gray-600 mb-1">Nog geen berichten</p>
          <p className="text-sm">Klik op "Nieuw bericht" om te beginnen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((b, i) => {
            const d = b.data || {};
            const visible = b.visible !== false;
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-20 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {d.imageUrl && <img src={getMediaUrl(d.imageUrl)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{d.title || d.heading || 'Zonder titel'}</p>
                  <p className="text-xs text-gray-400 truncate">{plain(d.excerpt || d.content || d.body).slice(0, 110) || '—'}</p>
                  <p className="text-[11px] mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${visible ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{visible ? 'Zichtbaar' : 'Verborgen'}</span>
                    {d.date && <span className="text-gray-400 ml-2">{d.date}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button title="Omhoog" disabled={i === 0} onClick={() => move(b.id, -1)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30"><ChevronUp size={16} /></button>
                  <button title="Omlaag" disabled={i === posts.length - 1} onClick={() => move(b.id, 1)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30"><ChevronDown size={16} /></button>
                  <button title={visible ? 'Verbergen' : 'Tonen'} onClick={() => toggleVisible(b.id)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50">{visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  <button onClick={() => setEditingId(b.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100"><Pencil size={13} /> Bewerken</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
