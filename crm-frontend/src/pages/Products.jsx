import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../lib/api';
import { Plus, Edit, Trash2, Search, Upload, X, Copy, Sparkles, Loader2, Package, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorText } from '../lib/errorText';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const emptyForm = { name: '', description: '', price: '', stock: '', category: '', imageUrl: '' };

function StockBadge({ stock }) {
  if (stock <= 0)  return <span style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'2px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>Uitverkocht</span>;
  if (stock <= 5)  return <span style={{ background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a', padding:'2px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>Bijna op — {stock}st</span>;
  if (stock <= 20) return <span style={{ background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', padding:'2px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>{stock} op voorraad</span>;
  return               <span style={{ background:'#ecfdf5', color:'#059669', border:'1px solid #a7f3d0', padding:'2px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>{stock} op voorraad</span>;
}

function StatCard({ label, value, gradient, icon: Icon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: gradient, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
      <div className="absolute -right-3 -top-3 opacity-10"><Icon size={72} className="text-white" /></div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">{label}</p>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
    </div>
  );
}

export default function Products() {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('ALL');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [formData, setFormData]     = useState(emptyForm);
  const [imgPreview, setImgPreview] = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [deleteId, setDeleteId]     = useState(null);
  const [relations, setRelations]   = useState([]);
  const [relLoading, setRelLoading] = useState(false);
  const [relSearch, setRelSearch]   = useState('');
  const fileRef = useRef(null);
  const importRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const { isAdmin } = useAuth();

  const fetchProducts = async () => {
    try { const r = await api.get('/products'); setProducts(r.data); }
    catch { setError('Producten ophalen mislukt'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    return ([p.name, p.category, p.description].filter(Boolean).some(v => v.toLowerCase().includes(q)))
      && (catFilter === 'ALL' || p.category === catFilter);
  }), [products, search, catFilter]);

  const stats = useMemo(() => ({
    total: products.length,
    totalValue: products.reduce((s, p) => s + p.price * p.stock, 0),
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 5).length,
    outOfStock: products.filter(p => p.stock <= 0).length,
  }), [products]);

  const openModal = async (product = null) => {
    setEditing(product);
    setFormData(product ? { name: product.name, description: product.description||'', price: String(product.price), stock: String(product.stock), category: product.category||'', imageUrl: product.imageUrl||'' } : emptyForm);
    setImgPreview(product?.imageUrl || null);
    setError('');
    setModalOpen(true);
    
    if (product) {
      setRelLoading(true);
      try {
        const res = await api.get(`/products/${product.id}/relations`);
        setRelations(res.data.explicit || []);
      } catch (err) {
        console.error('Failed to fetch relations', err);
      } finally {
        setRelLoading(false);
      }
    } else {
      setRelations([]);
    }
  };

  const closeModal = () => { setModalOpen(false); setError(''); setImgPreview(null); };

  const handleImage = async (file) => {
    if (!file) return;
    setImgPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const r = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(f => ({ ...f, imageUrl: r.data.url }));
    } catch { setError('Afbeelding uploaden mislukt'); setImgPreview(null); }
    finally { setUploading(false); }
  };

  const handleAI = async () => {
    if (!formData.name) return;
    setAiLoading(true);
    try {
      const r = await api.post('/ai/product-description', { name: formData.name, category: formData.category });
      setFormData(f => ({ ...f, description: r.data.result }));
    } catch (e) { alert(e.response?.data?.error || 'AI generatie mislukt'); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock, 10) };
    try {
      editing ? await api.put(`/products/${editing.id}`, data) : await api.post('/products', data);
      await fetchProducts();
      closeModal();
    } catch (e) { setError(errorText(e, 'Opslaan mislukt')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/products/${id}`); await fetchProducts(); }
    catch { setError('Verwijderen mislukt'); }
    finally { setDeleteId(null); }
  };

  const handleDuplicate = async (p) => {
    try {
      await api.post('/products', { name: p.name+' (kopie)', description: p.description||'', price: p.price, stock: p.stock, category: p.category||'', imageUrl: p.imageUrl||'' });
      await fetchProducts();
    } catch { setError('Dupliceren mislukt'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post('/products/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(r.data);
      await fetchProducts();
    } catch (err) {
      setError(errorText(err, 'Importeren mislukt'));
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  };

  const handleAddRelation = async (relatedId) => {
    try {
      await api.post(`/products/${editing.id}/relations`, { relatedProductId: relatedId });
      const res = await api.get(`/products/${editing.id}/relations`);
      setRelations(res.data.explicit || []);
    } catch (err) {
      alert('Relatie toevoegen mislukt');
    }
  };

  const handleDeleteRelation = async (relId) => {
     try {
       await api.delete(`/products/${editing.id}/relations/${relId}`);
       const res = await api.get(`/products/${editing.id}/relations`);
       setRelations(res.data.explicit || []);
     } catch (err) {
       alert('Relatie verwijderen mislukt');
     }
   };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Producten</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">{products.length} producten in de catalogus</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <input ref={importRef} type="file" accept=".docx" className="hidden" onChange={handleImport} />
            <button onClick={() => importRef.current?.click()} disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {importing ? 'Importeren…' : 'Importeer .docx'}
            </button>
            <button onClick={() => openModal()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>
              <Plus size={16} /> Nieuw product
            </button>
          </div>
        )}
      </div>

      {error && !modalOpen && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 text-sm font-medium">{String(error)}</div>}

      {importResult && (
        <div className="rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-600" />
            <span className="font-bold text-green-800">{importResult.imported} van {importResult.total} producten ge\u00EFmporteerd</span>
            <button onClick={() => setImportResult(null)} className="ml-auto text-green-400 hover:text-green-600"><X size={14} /></button>
          </div>
          {importResult.errors?.length > 0 && (
            <div className="mt-2 text-xs text-orange-700">
              {importResult.errors.map((e, i) => <div key={i}>Rij {e.row}: {e.error}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Producten" value={products.length} gradient="linear-gradient(135deg,#1e40af,#3b82f6)" icon={Package} />
        <StatCard label="Voorraadwaarde" value={euro.format(stats.totalValue)} gradient="linear-gradient(135deg,#065f46,#10b981)" icon={TrendingUp} />
        <StatCard label="Bijna op" value={stats.lowStock} gradient="linear-gradient(135deg,#92400e,#f59e0b)" icon={AlertTriangle} />
        <StatCard label="Uitverkocht" value={stats.outOfStock} gradient="linear-gradient(135deg,#7f1d1d,#ef4444)" icon={X} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Zoek product, categorie…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className="px-3 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{
                background: catFilter === c ? '#1e40af' : '#fff',
                color: catFilter === c ? '#fff' : '#6b7280',
                borderColor: catFilter === c ? '#1e40af' : '#e5e7eb',
                boxShadow: catFilter === c ? '0 4px 12px rgba(30,64,175,0.3)' : 'none',
              }}>
              {c === 'ALL' ? 'Alle' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Laden…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
            <Package size={24} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Geen producten gevonden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <div key={product.id} className="group bg-white rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              {/* Image */}
              <div className="relative h-44 bg-gray-50 overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Package size={32} className="text-gray-200" />
                    <p className="text-xs text-gray-300 font-medium">Geen afbeelding</p>
                  </div>
                )}
                {/* Category badge */}
                {product.category && (
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                    style={{ background: 'rgba(15,23,42,0.7)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                    {product.category}
                  </span>
                )}
                {/* Actions overlay */}
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                    style={{ backdropFilter: 'blur(2px)' }}>
                    <button onClick={() => handleDuplicate(product)} title="Dupliceren"
                      className="p-2.5 bg-white/90 rounded-xl text-gray-700 hover:bg-white transition-colors shadow-lg" style={{ backdropFilter: 'blur(4px)' }}>
                      <Copy size={14} />
                    </button>
                    <button onClick={() => openModal(product)} title="Bewerken"
                      className="p-2.5 bg-blue-500 rounded-xl text-white hover:bg-blue-600 transition-colors shadow-lg">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setDeleteId(product.id)} title="Verwijderen"
                      className="p-2.5 bg-red-500 rounded-xl text-white hover:bg-red-600 transition-colors shadow-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <p className="font-black text-gray-900 text-sm leading-tight line-clamp-2 mb-1">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3 flex-1">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid #f8fafc' }}>
                  <p className="text-lg font-black text-gray-900">{euro.format(product.price)}</p>
                  <StockBadge stock={product.stock} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Product verwijderen?</h3>
            <p className="text-sm text-gray-500 mb-6">Dit kan niet ongedaan worden gemaakt.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Annuleren
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-black hover:bg-red-600 transition-all active:scale-95">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
          onClick={closeModal}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
            style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">
                  {editing ? 'Bewerken' : 'Nieuw product'}
                </p>
                <h2 className="text-lg font-black text-white">{editing?.name || 'Product toevoegen'}</h2>
              </div>
              <button onClick={closeModal} className="text-white/40 hover:text-white/80 transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-5">
                {error && <div className="rounded-xl bg-red-50 border border-red-100 text-red-600 px-4 py-3 text-sm font-medium">{String(error)}</div>}

                {/* Image upload */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Afbeelding</label>
                  {imgPreview ? (
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9' }}>
                      <img src={imgPreview} alt="preview" className="w-full h-full object-cover" />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}>
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            Uploaden…
                          </div>
                        </div>
                      )}
                      {!uploading && (
                        <button type="button" onClick={() => { setImgPreview(null); setFormData(f => ({ ...f, imageUrl: '' })); }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleImage(e.dataTransfer.files[0]); }}
                      className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                      style={{ background: '#fafafa' }}>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Upload size={18} className="text-blue-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">Klik of sleep een afbeelding</p>
                      <p className="text-xs text-gray-300">PNG, JPG, WEBP — max 5 MB</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleImage(e.target.files?.[0])} />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Naam *</label>
                  <input required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Productnaam…" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                {/* Description + AI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Omschrijving</label>
                    <button type="button" onClick={handleAI} disabled={!formData.name || aiLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white transition-all disabled:opacity-40 active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
                      {aiLoading ? <><Loader2 size={11} className="animate-spin" /> Genereren…</> : <><Sparkles size={11} /> AI schrijft</>}
                    </button>
                  </div>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3} placeholder="Productomschrijving of gebruik AI…"
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                {/* Price + Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Prijs (€) *</label>
                    <input type="number" step="0.01" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Voorraad *</label>
                    <input type="number" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Categorie</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Bijv. Bedrijfswagens, Bouwplaats…"
                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                </div>

                {/* Relations (Upsells) */}
                {editing && (
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Maak je set compleet (Upsells)</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Koppel bijbehorende producten</p>
                    </div>

                    {/* Relation list */}
                    <div className="space-y-2">
                      {relations.map(rel => (
                        <div key={rel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                          <div className="flex items-center gap-3">
                            {rel.relatedProduct.imageUrl && (
                              <img src={rel.relatedProduct.imageUrl} className="w-8 h-8 rounded-lg object-cover" />
                            )}
                            <div>
                              <p className="text-xs font-black text-gray-900 line-clamp-1">{rel.relatedProduct.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{euro.format(rel.relatedProduct.price)}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => handleDeleteRelation(rel.id)} 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add relation */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Zoek product om te koppelen…"
                        value={relSearch}
                        onChange={e => setRelSearch(e.target.value)}
                      />
                      {relSearch.length >= 2 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-10 max-h-48 overflow-y-auto">
                          {products
                            .filter(p => p.id !== editing.id && p.name.toLowerCase().includes(relSearch.toLowerCase()))
                            .map(p => (
                              <button 
                                key={p.id}
                                type="button"
                                onClick={() => { handleAddRelation(p.id); setRelSearch(''); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                              >
                                {p.imageUrl && <img src={p.imageUrl} className="w-6 h-6 rounded-lg object-cover" />}
                                <div className="flex-1">
                                  <p className="text-xs font-black text-gray-900">{p.name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold">{euro.format(p.price)}</p>
                                </div>
                                <Plus size={14} className="text-blue-500" />
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                  Annuleren
                </button>
                <button type="submit" disabled={saving || uploading}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>
                  {saving ? 'Opslaan…' : editing ? 'Wijzigingen opslaan' : 'Product aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
