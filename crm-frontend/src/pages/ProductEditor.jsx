import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getMediaUrl } from '../lib/api';
import { ArrowLeft, Check, FileText, Loader2, Plus, Search, Sparkles, Trash2, Video, X, ArrowUp, ArrowDown } from 'lucide-react';
import { errorText } from '../lib/errorText';
import ImageUploader from '../components/ImageUploader';
import RichTextEditor from '../components/RichTextEditor';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const emptyForm = { name: '', description: '', price: '', stock: '', category: '', categoryId: '', imageUrl: '', imageUrls: [], pdfUrl: '', videoUrl: '' };

const getProductImages = (product) => {
  const urls = Array.isArray(product?.images) ? product.images.map((image) => image.url || image).filter(Boolean) : [];
  if (urls.length > 0) return urls;
  return product?.imageUrl ? [product.imageUrl] : [];
};
const getPrimaryImage = (product) => getProductImages(product)[0] || '';

const parseSpecs = (specsStr) => {
  if (!specsStr) return [];
  try {
    const parsed = JSON.parse(specsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return specsStr.split('\n').filter(Boolean).map((line) => {
      const [key, ...vals] = line.split(':');
      return { label: key.trim(), value: vals.join(':').trim() };
    });
  }
};

const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const labelCls = 'block text-xs font-black text-gray-500 uppercase tracking-wider mb-2';

function Card({ title, hint, action, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">{title}</h2>
          {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </section>
  );
}

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'nieuw';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [specsList, setSpecsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [relations, setRelations] = useState([]);
  const [relSearch, setRelSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const update = useCallback((patch) => { setFormData((f) => ({ ...f, ...patch })); setDirty(true); setSaved(false); }, []);

  useEffect(() => {
    api.get('/products/categories/all').then((r) => setCategories(r.data)).catch(() => {});
    api.get('/products').then((r) => setAllProducts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) { setProduct(null); setFormData(emptyForm); setSpecsList([]); setRelations([]); setLoading(false); setDirty(false); return; }
    let alive = true;
    setLoading(true);
    api.get(`/products/${id}`).then((r) => {
      if (!alive) return;
      const p = r.data;
      const imageUrls = getProductImages(p);
      setProduct(p);
      setSpecsList(parseSpecs(p.specs));
      setFormData({
        name: p.name || '', description: p.description || '', price: String(p.price ?? ''), stock: String(p.stock ?? ''),
        category: p.category || '', categoryId: p.categoryId || '', imageUrl: imageUrls[0] || '', imageUrls,
        pdfUrl: p.pdfUrl || '', videoUrl: p.videoUrl || '',
      });
      setDirty(false);
    }).catch((e) => { if (alive) setError(errorText(e, 'Product ophalen mislukt')); })
      .finally(() => { if (alive) setLoading(false); });
    api.get(`/products/${id}/relations`).then((r) => { if (alive) setRelations(r.data.explicit || []); }).catch(() => {});
    return () => { alive = false; };
  }, [id, isNew]);

  // Waarschuwing bij het sluiten van de pagina met niet-opgeslagen wijzigingen
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const goBack = () => {
    if (dirty && !window.confirm('Er zijn niet-opgeslagen wijzigingen. Toch terug naar de productlijst?')) return;
    navigate('/products');
  };

  const handleAI = async () => {
    if (!formData.name) return;
    setAiLoading(true);
    try {
      const r = await api.post('/ai/product-description', { name: formData.name, category: formData.category });
      update({ description: r.data.result });
    } catch (e) { alert(e.response?.data?.error || 'AI generatie mislukt'); }
    finally { setAiLoading(false); }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');
    if (!formData.name.trim()) { setError('Vul een productnaam in.'); return; }
    if (formData.price === '' || Number.isNaN(parseFloat(formData.price))) { setError('Vul een geldige prijs in.'); return; }
    setSaving(true);
    const imageUrls = Array.isArray(formData.imageUrls) ? formData.imageUrls : [];
    const cleanSpecs = specsList.filter((s) => s.label || s.value);
    const data = {
      ...formData,
      specs: cleanSpecs.length > 0 ? JSON.stringify(cleanSpecs) : '',
      imageUrl: imageUrls[0] || '', imageUrls,
      price: parseFloat(formData.price), stock: parseInt(formData.stock || '0', 10),
      categoryId: formData.categoryId || null,
      pdfUrl: formData.pdfUrl || null, videoUrl: formData.videoUrl || null,
    };
    try {
      if (isNew) {
        const r = await api.post('/products', data);
        setDirty(false);
        navigate(`/products/${r.data.id}`, { replace: true });
      } else {
        await api.put(`/products/${id}`, data);
        setDirty(false);
        setSaved(true);
      }
    } catch (err) { setError(errorText(err, 'Opslaan mislukt')); }
    finally { setSaving(false); }
  };

  const handleAddRelation = async (relatedId) => {
    try {
      await api.post(`/products/${id}/relations`, { relatedProductId: relatedId });
      const res = await api.get(`/products/${id}/relations`);
      setRelations(res.data.explicit || []);
    } catch { alert('Relatie toevoegen mislukt'); }
  };
  const handleDeleteRelation = async (relId) => {
    try {
      await api.delete(`/products/${id}/relations/${relId}`);
      const res = await api.get(`/products/${id}/relations`);
      setRelations(res.data.explicit || []);
    } catch { alert('Relatie verwijderen mislukt'); }
  };

  const setSpec = (i, patch) => { setSpecsList((list) => list.map((s, j) => (j === i ? { ...s, ...patch } : s))); setDirty(true); setSaved(false); };
  const moveSpec = (i, dir) => {
    setSpecsList((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setDirty(true); setSaved(false);
  };

  const relMatches = useMemo(() => {
    if (relSearch.length < 2) return [];
    const q = relSearch.toLowerCase();
    return allProducts.filter((p) => p.id !== id && p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [relSearch, allProducts, id]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-gray-400" size={28} /></div>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-[1400px] mx-auto pb-24">
      {/* Bovenbalk */}
      <div className="sticky -top-6 md:-top-12 z-30 -mx-6 md:-mx-12 -mt-6 md:-mt-12 px-6 md:px-12 py-3 mb-8 bg-white/90 backdrop-blur border-b border-gray-200 flex items-center gap-4">
        <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} /> Producten
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{isNew ? 'Nieuw product' : 'Product bewerken'}</p>
          <h1 className="text-lg font-black text-gray-900 truncate">{formData.name || 'Naamloos product'}</h1>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold">
          {dirty ? <span className="text-amber-600">Niet opgeslagen wijzigingen</span> : saved ? <span className="text-emerald-600 flex items-center gap-1"><Check size={14} /> Opgeslagen</span> : null}
        </span>
        <button type="button" onClick={goBack} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
          {dirty ? 'Annuleren' : 'Sluiten'}
        </button>
        <button type="submit" disabled={saving || (!dirty && !isNew)}
          className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
          {saving ? 'Opslaan…' : isNew ? 'Product aanmaken' : 'Opslaan'}
        </button>
      </div>

      {error && <div className="mb-5 rounded-xl bg-red-50 border border-red-100 text-red-600 px-4 py-3 text-sm font-medium">{String(error)}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        {/* Hoofdkolom */}
        <div className="space-y-6">
          <Card title="Algemeen">
            <label className={labelCls}>Naam *</label>
            <input required className={`${inputCls} text-base font-semibold`} placeholder="Productnaam…" value={formData.name} onChange={(e) => update({ name: e.target.value })} />

            <div className="flex items-center justify-between mt-6 mb-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Omschrijving</label>
              <button type="button" onClick={handleAI} disabled={!formData.name || aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white transition-all disabled:opacity-40 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
                {aiLoading ? <><Loader2 size={11} className="animate-spin" /> Genereren…</> : <><Sparkles size={11} /> AI schrijft</>}
              </button>
            </div>
            <RichTextEditor minHeight="22rem" value={formData.description} onChange={(html) => update({ description: html })} />
          </Card>

          <Card title="Productfoto's" hint="De eerste foto is de hoofdfoto in de webshop.">
            <ImageUploader value={formData.imageUrls} onChange={(val) => update({ imageUrls: val, imageUrl: val[0] || '' })} label="" multiple />
          </Card>

          <Card title="Specificaties" hint="Verschijnen als tabel op de productpagina. Met de pijltjes wijzig je de volgorde."
            action={<button type="button" onClick={() => { setSpecsList([...specsList, { label: '', value: '' }]); setDirty(true); setSaved(false); }} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1"><Plus size={14} /> Rij toevoegen</button>}>
            {specsList.length === 0 && <p className="text-sm text-gray-400 py-2">Nog geen specificaties. Voeg een rij toe.</p>}
            <div className="space-y-2">
              {specsList.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex flex-col">
                    <button type="button" onClick={() => moveSpec(i, -1)} disabled={i === 0} className="p-0.5 text-gray-300 hover:text-gray-700 disabled:opacity-20"><ArrowUp size={13} /></button>
                    <button type="button" onClick={() => moveSpec(i, 1)} disabled={i === specsList.length - 1} className="p-0.5 text-gray-300 hover:text-gray-700 disabled:opacity-20"><ArrowDown size={13} /></button>
                  </div>
                  <input className={`${inputCls} flex-1 !py-2`} placeholder="Label (bv. Lichtopbrengst)" value={spec.label} onChange={(e) => setSpec(i, { label: e.target.value })} />
                  <input className={`${inputCls} flex-1 !py-2`} placeholder="Waarde (bv. 12.000 Lumen)" value={spec.value} onChange={(e) => setSpec(i, { value: e.target.value })} />
                  <button type="button" onClick={() => { setSpecsList(specsList.filter((_, j) => j !== i)); setDirty(true); setSaved(false); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><X size={14} /></button>
                </div>
              ))}
            </div>
          </Card>

          {!isNew && (
            <Card title="Maak je set compleet (upsells)" hint="Koppel bijbehorende producten; ze verschijnen op de productpagina. Wijzigingen worden direct opgeslagen.">
              <div className="space-y-2">
                {relations.map((rel) => (
                  <div key={rel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      {getPrimaryImage(rel.relatedProduct) && <img src={getMediaUrl(getPrimaryImage(rel.relatedProduct))} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div>
                        <p className="text-sm font-black text-gray-900 line-clamp-1">{rel.relatedProduct.name}</p>
                        <p className="text-xs text-gray-400 font-bold">{euro.format(rel.relatedProduct.price)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDeleteRelation(rel.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <div className="relative mt-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Zoek product om te koppelen…" value={relSearch} onChange={(e) => setRelSearch(e.target.value)} />
                {relMatches.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-10 max-h-64 overflow-y-auto">
                    {relMatches.map((p) => (
                      <button key={p.id} type="button" onClick={() => { handleAddRelation(p.id); setRelSearch(''); }} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50 last:border-0">
                        {getPrimaryImage(p) && <img src={getMediaUrl(getPrimaryImage(p))} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                        <div className="flex-1"><p className="text-sm font-black text-gray-900">{p.name}</p><p className="text-xs text-gray-400 font-bold">{euro.format(p.price)}</p></div>
                        <Plus size={14} className="text-blue-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Zijkolom */}
        <div className="space-y-6 xl:sticky xl:top-24">
          <Card title="Prijs & voorraad">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Prijs (€) *</label>
                <input type="number" step="0.01" required className={inputCls} placeholder="0.00" value={formData.price} onChange={(e) => update({ price: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Voorraad *</label>
                <input type="number" required className={inputCls} placeholder="0" value={formData.stock} onChange={(e) => update({ stock: e.target.value })} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">Prijs is exclusief BTW.</p>
          </Card>

          <Card title="Categorie">
            <select className={inputCls} value={formData.categoryId || ''} onChange={(e) => {
              const cat = categories.find((c) => c.id === e.target.value);
              update({ categoryId: e.target.value, category: cat?.name || '' });
            }}>
              <option value="">Geen categorie</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Card>

          <Card title="Documenten & video">
            <label className={labelCls}><FileText size={12} className="inline mr-1" /> PDF-link</label>
            <input className={inputCls} placeholder="/uploads/product.pdf" value={formData.pdfUrl || ''} onChange={(e) => update({ pdfUrl: e.target.value })} />
            <label className={`${labelCls} mt-4`}><Video size={12} className="inline mr-1" /> YouTube-link</label>
            <input className={inputCls} placeholder="https://youtube.com/watch?v=..." value={formData.videoUrl || ''} onChange={(e) => update({ videoUrl: e.target.value })} />
          </Card>
        </div>
      </div>
    </form>
  );
}
