import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Save, CheckCircle, Search, Plus, X, Globe } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';

const iCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white';
const taCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none bg-white';

const SEO_SLUGS = [
  'led-bouwlichtslang',
  'professionele-bouwplaatsverlichting',
  'led-lichtslang',
  'bouwverlichting-huren',
  'bedrijfswagenverlichting',
];

export default function SeoPages() {
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSlug, setActiveSlug] = useState(SEO_SLUGS[0]);
  const [lang, setLang] = useState('nl');

  useEffect(() => {
    setLoading(true);
    Promise.all(
      SEO_SLUGS.map(slug =>
        api.get(`/content/seo_page_${slug}`, { params: { lang } })
          .then(r => ({ slug, data: r.data }))
          .catch(() => ({ slug, data: null }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => {
        map[r.slug] = r.data || {
          title: '', subtitle: '', seoTitle: '', metaDescription: '',
          heroImage: '', content: '', faq: [],
          ctaTitle: '', ctaText: '', ctaButtonText: '', ctaButtonLink: '', blocks: [],
        };
      });
      setPages(map);
      setLoading(false);
    });
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(pages).map(([slug, data]) =>
          api.put(`/content/seo_page_${slug}`, data, { params: { lang } })
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

  const updatePage = (patch) => {
    setPages(p => ({ ...p, [activeSlug]: { ...p[activeSlug], ...patch } }));
  };

  const addFaq = () => {
    const faq = [...(pages[activeSlug]?.faq || []), { question: '', answer: '' }];
    updatePage({ faq });
  };

  if (loading) return <div className="p-8 text-gray-400 text-sm animate-pulse">Laden...</div>;

  const page = pages[activeSlug] || {};

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">SEO Pagina's</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Beheer SEO-geoptimaliseerde landingspagina's</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={lang} onChange={e => setLang(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700">
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: saved ? 'linear-gradient(135deg,#065f46,#10b981)' : 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>
            {saved ? <><CheckCircle size={15} /> Opgeslagen!</> : saving ? 'Opslaan…' : <><Save size={15} /> Alles opslaan</>}
          </button>
        </div>
      </div>

      {/* Slug tabs */}
      <div className="flex gap-2 flex-wrap">
        {SEO_SLUGS.map(slug => (
          <button key={slug} onClick={() => setActiveSlug(slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              activeSlug === slug ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            <Globe size={12} className="inline mr-1" />/{slug}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-black text-gray-700 text-xs uppercase tracking-widest">/{activeSlug}</h3>
        </div>
        <div className="p-6 space-y-5">
          {/* SEO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">SEO Titel</label>
              <input className={iCls} value={page.seoTitle || ''} onChange={e => updatePage({ seoTitle: e.target.value })} placeholder="SEO titel voor zoekmachines" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Meta Description</label>
              <input className={iCls} value={page.metaDescription || ''} onChange={e => updatePage({ metaDescription: e.target.value })} placeholder="Korte beschrijving voor Google" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Pagina titel (H1)</label>
              <input className={iCls} value={page.title || ''} onChange={e => updatePage({ title: e.target.value })} placeholder="LED bouwlichtslang kopen" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Ondertitel</label>
              <input className={iCls} value={page.subtitle || ''} onChange={e => updatePage({ subtitle: e.target.value })} placeholder="Professionele LED bouwlichtslangen" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Hero afbeelding</label>
            <ImageUploader value={page.heroImage || ''} onChange={v => updatePage({ heroImage: v })} label={null} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Inhoud (Markdown-stijl: ## voor H2, ### voor H3, - voor lijsten, dubbele newline voor paragrafen)</label>
            <textarea className={taCls} rows={15} value={page.content || ''} onChange={e => updatePage({ content: e.target.value })} placeholder="Voeg de inhoud toe..." />
          </div>

          {/* FAQ */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Veelgestelde vragen</label>
              <button type="button" onClick={addFaq} className="text-xs font-bold text-blue-600 hover:text-blue-800">+ Toevoegen</button>
            </div>
            <div className="space-y-3">
              {(page.faq || []).map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400">Vraag {i + 1}</span>
                    <button type="button" onClick={() => {
                      const faq = [...(page.faq || [])];
                      faq.splice(i, 1);
                      updatePage({ faq });
                    }} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                  </div>
                  <input className={iCls} placeholder="Vraag" value={item.question} onChange={e => {
                    const faq = [...(page.faq || [])];
                    faq[i] = { ...faq[i], question: e.target.value };
                    updatePage({ faq });
                  }} />
                  <textarea className={taCls} rows={3} placeholder="Antwoord" value={item.answer} onChange={e => {
                    const faq = [...(page.faq || [])];
                    faq[i] = { ...faq[i], answer: e.target.value };
                    updatePage({ faq });
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Call-to-Action</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input className={iCls} placeholder="CTA titel" value={page.ctaTitle || ''} onChange={e => updatePage({ ctaTitle: e.target.value })} />
              <input className={iCls} placeholder="CTA tekst" value={page.ctaText || ''} onChange={e => updatePage({ ctaText: e.target.value })} />
              <input className={iCls} placeholder="Knop tekst" value={page.ctaButtonText || ''} onChange={e => updatePage({ ctaButtonText: e.target.value })} />
              <input className={iCls} placeholder="Knop link (bv. /producten)" value={page.ctaButtonLink || ''} onChange={e => updatePage({ ctaButtonLink: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
