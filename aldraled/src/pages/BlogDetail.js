import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function readTime(text = '') {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));
}

export default function BlogDetail() {
  const { id } = useParams();
  const [block, setBlock]     = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/content/page_blocks_blog`)
      .then(r => {
        const all = Array.isArray(r.data) ? r.data.filter(b => b.visible !== false) : [];
        setBlock(all.find(b => b.id === id) || null);
        setRelated(all.filter(b => b.id !== id).slice(0, 3));
      })
      .catch(() => setBlock(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgb(var(--color-primary))', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!block) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6 gap-4">
      <span className="text-5xl">📭</span>
      <h1 className="text-2xl font-black text-gray-800">Artikel niet gevonden</h1>
      <Link to="/blog" className="text-sm font-bold hover:underline" style={{ color: 'rgb(var(--color-primary))' }}>
        ← Terug naar nieuws
      </Link>
    </div>
  );

  const { data } = block;
  const title   = data.title   || data.heading    || 'Zonder titel';
  const body    = data.content || data.body        || data.excerpt || '';
  const image   = data.imageUrl;
  const author  = data.author  || 'ALRA LED Team';
  const date    = data.date    || '';
  const mins    = readTime(body);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ──────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/blog"
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Nieuws
          </Link>
          <span className="text-xs text-gray-400">{mins} min lezen</span>
        </div>
      </div>

      {/* ── Article ──────────────────────────────── */}
      <article className="max-w-3xl mx-auto px-6 py-12">

        {/* Meta */}
        <header className="mb-10 space-y-5">
          {date && (
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgb(var(--color-primary))' }}>
              {date}
            </p>
          )}
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            {title}
          </h1>

          {/* Author row */}
          <div className="flex items-center gap-3 py-4 border-y border-gray-100">
            <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-black text-sm shrink-0"
              style={{ background: 'rgb(var(--color-primary))' }}>
              {author[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{author}</p>
              <p className="text-xs text-gray-400">ALRA LED Solutions · {mins} min lezen</p>
            </div>
          </div>
        </header>

        {/* Hero image */}
        {image && (
          <div className="rounded-2xl overflow-hidden shadow-lg mb-10">
            <img src={image} alt={title} className="w-full max-h-[500px] object-cover" />
          </div>
        )}

        {/* Body */}
        {body ? (
          <div className="space-y-5">
            {body.split('\n').filter(p => p.trim()).map((para, i) => (
              <p key={i} className="text-gray-700 leading-[1.9] text-lg">{para}</p>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic text-lg">Geen inhoud beschikbaar.</p>
        )}

        {/* Extra items (feature_grid style) */}
        {Array.isArray(data.items) && data.items.length > 0 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.items.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                {item.icon && <span className="text-2xl">{item.icon}</span>}
                {item.title && <h3 className="font-bold text-gray-800 mt-2 mb-1">{item.title}</h3>}
                {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                {item.number && <p className="text-3xl font-black mt-1" style={{ color: 'rgb(var(--color-primary))' }}>{item.number}</p>}
                {item.label && <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">{item.label}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-14 pt-8 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-black text-sm"
              style={{ background: 'rgb(var(--color-primary))' }}>
              {author[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{author}</p>
              <p className="text-xs text-gray-400">ALRA LED Solutions</p>
            </div>
          </div>
          <Link to="/blog"
            className="flex items-center gap-1.5 text-sm font-bold hover:underline"
            style={{ color: 'rgb(var(--color-primary))' }}>
            ← Meer artikelen
          </Link>
        </div>
      </article>

      {/* ── Related ──────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-white border-t border-gray-100 py-14 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Meer lezen</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map(rel => {
                const d = rel.data;
                const t = d.title || d.heading || 'Artikel';
                const e = d.excerpt || d.body   || '';
                const mins2 = readTime(e);
                return (
                  <Link key={rel.id} to={`/blog/${rel.id}`}
                    className="group flex flex-col gap-3 rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 bg-white">
                    {d.imageUrl && (
                      <div className="h-36 overflow-hidden">
                        <img src={d.imageUrl} alt={t}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-4 space-y-1.5">
                      <p className="text-[11px] text-gray-400 font-medium">{d.date || ''} · {mins2} min</p>
                      <h4 className="font-black text-sm text-gray-800 leading-snug group-hover:text-primary transition-colors line-clamp-2">{t}</h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
