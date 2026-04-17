import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function readTime(text = '') {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));
}

function GridPost({ block, index }) {
  const { id, data } = block;
  const title   = data.title || data.heading || 'Zonder titel';
  const excerpt = data.excerpt || data.body  || '';
  const image   = data.imageUrl;
  const author  = data.author || 'ALRA LED';
  const date    = data.date   || '';
  const num     = String(index + 1).padStart(2, '0');

  return (
    <Link to={`/blog/${id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Image */}
      {image ? (
        <div className="relative h-48 overflow-hidden shrink-0 bg-gray-100">
          <img src={image} alt={title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-600" />
          <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500"
            style={{ background: 'rgb(var(--color-primary))' }} />
        </div>
      ) : (
        <div className="h-48 shrink-0 flex items-center justify-center bg-gray-50 relative overflow-hidden">
          <span className="text-5xl opacity-10 font-black text-gray-400">{num}</span>
          <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500"
            style={{ background: 'rgb(var(--color-primary))' }} />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-2.5">
        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
          {date && <span>{date}</span>}
          {date && <span>·</span>}
          <span>{readTime(excerpt)} min</span>
        </div>

        <h3 className="font-black text-gray-900 text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1"
          style={{ '--primary': 'rgb(var(--color-primary))' }}>
          {title}
        </h3>

        {excerpt && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-light">{excerpt}</p>
        )}

        <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center"
              style={{ background: 'rgb(var(--color-primary))' }}>
              {author[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-400">{author}</span>
          </div>
          <span className="text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
            style={{ color: 'rgb(var(--color-primary))' }}>
            Lees meer
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Blog() {
  const [blocks, setBlocks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/content/page_blocks_blog`)
      .then(r => setBlocks(Array.isArray(r.data) ? r.data.filter(b => b.visible !== false) : []))
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  }, []);

  const articles = blocks.filter(b => ['blog_post','image_text','text_block'].includes(b.type));

  return (
    <div className="min-h-screen bg-white">

      {/* ── Masthead ─────────────────────────────── */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          {/* Top label */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
            <span>ALRA LED Solutions</span>
            {!loading && <span>{articles.length} artikel{articles.length !== 1 ? 'en' : ''}</span>}
          </div>

          {/* Title */}
          <div className="py-7 flex items-end justify-between gap-4">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-none tracking-tighter">
              Nieuws
            </h1>
            <p className="text-sm text-gray-400 font-light max-w-xs text-right hidden sm:block leading-relaxed">
              Professionele inzichten en updates over LED-verlichting.
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'rgb(var(--color-primary))', borderTopColor: 'transparent' }} />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
            <p className="text-6xl font-black text-gray-100">∅</p>
            <h2 className="text-xl font-black text-gray-700">Binnenkort beschikbaar</h2>
            <p className="text-sm text-gray-400">Voeg blogberichten toe via CRM → Pagina Bouwer</p>
            <Link to="/producten" className="mt-2 text-sm font-bold underline underline-offset-4"
              style={{ color: 'rgb(var(--color-primary))' }}>
              Bekijk producten →
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 3-column grid — all articles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {articles.map((b, i) => <GridPost key={b.id} block={b} index={i} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer strip ─────────────────────────── */}
      {articles.length > 0 && (
        <div className="border-t border-gray-100 mt-4">
          <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Interesse in onze producten?
            </p>
            <Link to="/producten"
              className="text-sm font-bold underline underline-offset-4 hover:opacity-70 transition-opacity"
              style={{ color: 'rgb(var(--color-primary))' }}>
              Bekijk het aanbod →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
