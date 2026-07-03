import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Save, CheckCircle, FileText, Shield, RotateCcw, AlertTriangle } from 'lucide-react';

const iCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white';
const taCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none bg-white';

const LEGAL_PAGES = [
  { key: 'legal_terms', label: 'Algemene Voorwaarden', icon: FileText },
  { key: 'legal_privacy', label: 'Privacy Policy', icon: Shield },
  { key: 'legal_returns', label: 'Terugbetaal- en Retourneringsbeleid', icon: RotateCcw },
  { key: 'legal_complaints', label: 'Klachten en retouren', icon: AlertTriangle },
];

export default function LegalPages() {
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all(
      LEGAL_PAGES.map(p =>
        api.get(`/content/${p.key}`).then(r => ({ key: p.key, data: r.data })).catch(() => ({ key: p.key, data: null }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => {
        map[r.key] = r.data || { title: '', content: '' };
      });
      setPages(map);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(pages).map(([key, data]) =>
          api.put(`/content/${key}`, data)
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400 text-sm animate-pulse">Laden...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Juridische Pagina's</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Beheer Algemene Voorwaarden, Privacy, Retourbeleid en Klachten</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: saved ? 'linear-gradient(135deg,#065f46,#10b981)' : 'linear-gradient(135deg,#1e40af,#3b82f6)', boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>
          {saved ? <><CheckCircle size={15} /> Opgeslagen!</> : saving ? 'Opslaan…' : <><Save size={15} /> Alles opslaan</>}
        </button>
      </div>

      {LEGAL_PAGES.map(({ key, label, icon: Icon }) => {
        const page = pages[key] || { title: '', content: '' };
        return (
          <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center gap-2 bg-gray-50 border-b border-gray-100">
              <Icon size={16} className="text-gray-400" />
              <h3 className="font-black text-gray-700 text-xs uppercase tracking-widest">{label}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Pagina titel</label>
                <input className={iCls} value={page.title || ''}
                  onChange={e => setPages(p => ({ ...p, [key]: { ...p[key], title: e.target.value } }))}
                  placeholder={`${label} titel`} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Inhoud (Markdown of HTML)</label>
                <textarea className={taCls} rows={15} value={page.content || ''}
                  onChange={e => setPages(p => ({ ...p, [key]: { ...p[key], content: e.target.value } }))}
                  placeholder="Voeg hier de inhoud toe..." />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
