import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../lib/api';
import { Plus, Edit, Trash2, Search, Upload, X, Copy, Sparkles, Loader2, Package, TrendingUp, AlertTriangle, CheckCircle, Wand2, FileText, Video, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorText } from '../lib/errorText';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

// Omschrijving is opgemaakte HTML (editor): voor lijst en zoeken als platte tekst
const plainText = (html) => String(html || '').replace(/<\/(p|li|h[1-6])>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

const getProductImages = (product) => {
  const urls = Array.isArray(product?.images) ? product.images.map((image) => image.url || image).filter(Boolean) : [];
  if (urls.length > 0) return urls;
  return product?.imageUrl ? [product.imageUrl] : [];
};

const getPrimaryImage = (product) => getProductImages(product)[0] || '';

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
  const [error, setError]           = useState('');
  const [deleteId, setDeleteId]     = useState(null);
  const importRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products/categories/all').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const fetchProducts = async () => {
    try { const r = await api.get('/products'); setProducts(r.data); }
    catch { setError('Producten ophalen mislukt'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);

  const categoryOptions = useMemo(() => ['ALL', ...categories], [categories]);

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    return ([p.name, p.category, plainText(p.description)].filter(Boolean).some(v => v.toLowerCase().includes(q)))
      && (catFilter === 'ALL' || p.categoryId === catFilter || p.category === catFilter);
  }), [products, search, catFilter]);

  const stats = useMemo(() => ({
    total: products.length,
    totalValue: products.reduce((s, p) => s + p.price * p.stock, 0),
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 5).length,
    outOfStock: products.filter(p => p.stock <= 0).length,
  }), [products]);

  const parseSpecs = (specsStr) => {
    if (!specsStr) return [];
    try {
      const parsed = JSON.parse(specsStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return specsStr.split('\n').filter(Boolean).map(line => {
        const [key, ...vals] = line.split(':');
        return { label: key.trim(), value: vals.join(':').trim() };
      });
    }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/products/${id}`); await fetchProducts(); }
    catch { setError('Verwijderen mislukt'); }
    finally { setDeleteId(null); }
  };

  const handleDuplicate = async (p) => {
    try {
      const imageUrls = getProductImages(p);
      await api.post('/products', {
        name: p.name+' (kopie)', description: p.description||'', specs: p.specs||'',
        price: p.price, stock: p.stock, category: p.category||'', categoryId: p.categoryId||'',
        pdfUrl: p.pdfUrl||'', videoUrl: p.videoUrl||'',
        imageUrl: imageUrls[0] || '', imageUrls,
      });
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
            <button onClick={() => navigate('/products/nieuw')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>
              <Plus size={16} /> Nieuw product
            </button>
          </div>
        )}
      </div>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 text-sm font-medium">{String(error)}</div>}

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
          {['ALL', ...categories].map(c => {
            const label = c === 'ALL' ? 'Alle' : (typeof c === 'string' ? c : c.name);
            const value = typeof c === 'string' ? c : c.id;
            return (
              <button key={value} onClick={() => setCatFilter(value)}
                className="px-3 py-2 rounded-xl text-xs font-bold border transition-all"
                style={{
                  background: catFilter === value ? '#1e40af' : '#fff',
                  color: catFilter === value ? '#fff' : '#6b7280',
                  borderColor: catFilter === value ? '#1e40af' : '#e5e7eb',
                  boxShadow: catFilter === value ? '0 4px 12px rgba(30,64,175,0.3)' : 'none',
                }}>
                {label}
              </button>
            );
          })}
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
                {getPrimaryImage(product) ? (
                  <img src={getMediaUrl(getPrimaryImage(product))} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Package size={32} className="text-gray-200" />
                    <p className="text-xs text-gray-300 font-medium">Geen afbeelding</p>
                  </div>
                )}
                {/* Category badge */}
                {(product.category || product.categoryId) && (
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                    style={{ background: 'rgba(15,23,42,0.7)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                    {product.category || categories.find(c => c.id === product.categoryId)?.name || ''}
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
                    <button onClick={() => navigate(`/products/${product.id}`)} title="Bewerken"
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
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-1 flex-1">{plainText(product.description)}</p>
                )}
                {product.specs && (() => {
                  const s = parseSpecs(product.specs);
                  return s.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {s.slice(0, 4).map((spec, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium truncate max-w-[140px]">
                          {spec.label}: <strong className="text-gray-700">{spec.value}</strong>
                        </span>
                      ))}
                      {s.length > 4 && <span className="text-[10px] text-gray-400 font-medium">+{s.length - 4}</span>}
                    </div>
                  ) : null;
                })()}
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
    </div>
  );
}
