import React, { useEffect, useState } from 'react';
import api, { getMediaUrl } from '../lib/api';
import { Plus, Edit, Trash2, Save, X, Loader2, Tag, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorText } from '../lib/errorText';
import ImageUploader from '../components/ImageUploader';

const emptyForm = { name: '', slug: '', description: '', imageUrl: '', sortOrder: 0 };

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const { isAdmin } = useAuth();

  const fetchCategories = async () => {
    try {
      const r = await api.get('/products/categories/all');
      setCategories(r.data);
    } catch {
      setError('Categorieën ophalen mislukt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openModal = (cat = null) => {
    setEditing(cat);
    setFormData(cat ? {
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      sortOrder: cat.sortOrder ?? 0,
    } : emptyForm);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setError(''); };

  const handleNameChange = (val) => {
    setFormData(f => ({
      ...f,
      name: val,
      slug: editing ? f.slug : slugify(val),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('Naam en slug zijn verplicht');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        imageUrl: formData.imageUrl || null,
        sortOrder: Number(formData.sortOrder) || 0,
      };
      if (editing) {
        await api.put(`/products/categories/${editing.id}`, data);
      } else {
        await api.post('/products/categories', data);
      }
      await fetchCategories();
      closeModal();
    } catch (e) {
      setError(errorText(e, 'Opslaan mislukt'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/categories/${id}`);
      await fetchCategories();
    } catch {
      setError('Verwijderen mislukt');
    } finally {
      setDeleteId(null);
    }
  };

  const handleMove = async (cat, direction) => {
    const idx = categories.findIndex(c => c.id === cat.id);
    if (idx < 0) return;
    const swap = categories[idx + direction];
    if (!swap) return;

    const newOrder = cat.sortOrder;
    const swapOrder = swap.sortOrder;

    try {
      await api.put(`/products/categories/${cat.id}`, { sortOrder: swapOrder });
      await api.put(`/products/categories/${swap.id}`, { sortOrder: newOrder });
      await fetchCategories();
    } catch {
      setError('Volgorde wijzigen mislukt');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Categorieën</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">{categories.length} categorieën in de webshop</p>
        </div>
        {isAdmin && (
          <button onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>
            <Plus size={16} /> Nieuwe categorie
          </button>
        )}
      </div>

      {error && !modalOpen && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Laden...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Tag size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-lg font-bold text-gray-400">Nog geen categorieën</p>
          <p className="text-sm text-gray-300 mt-1">Klik op "Nieuwe categorie" om er één toe te voegen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <p className="text-sm font-black text-gray-800">Categorieën ({categories.length})</p>
          </div>
          <div className="divide-y">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {cat.imageUrl ? (
                    <img src={getMediaUrl(cat.imageUrl)} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Tag size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{cat.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">/{cat.slug}</p>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{cat.description}</p>
                  )}
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  Volgorde: {cat.sortOrder}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleMove(cat, -1)} disabled={idx === 0}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                    <ArrowUp size={14} />
                  </button>
                  <button onClick={() => handleMove(cat, 1)} disabled={idx === categories.length - 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                    <ArrowDown size={14} />
                  </button>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openModal(cat)}
                      className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => setDeleteId(cat.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-2">Categorie verwijderen?</h3>
            <p className="text-sm text-gray-500 mb-6">Deze actie kan niet ongedaan worden gemaakt.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
                Annuleren
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">
                {editing ? 'Categorie bewerken' : 'Nieuwe categorie'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Naam *</label>
                <input type="text" value={formData.name} onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bijv. LED Bouwlampen" required />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Slug *</label>
                <input type="text" value={formData.slug} onChange={e => setFormData(f => ({ ...f, slug: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bijv. led-bouwlampen" required />
                <p className="text-[11px] text-gray-400 mt-1">URL-vriendelijke versie van de naam</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Beschrijving</label>
                <textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3} placeholder="Optionele beschrijving van de categorie" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Volgorde</label>
                <input type="number" value={formData.sortOrder} onChange={e => setFormData(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0} />
                <p className="text-[11px] text-gray-400 mt-1">Lagere getallen worden eerder getoond</p>
              </div>

              <ImageUploader
                value={formData.imageUrl}
                onChange={(val) => setFormData(f => ({ ...f, imageUrl: val || '' }))}
                label="Categorie afbeelding"
                height="h-40"
              />

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
                  Annuleren
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? 'Opslaan...' : editing ? 'Opslaan' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
