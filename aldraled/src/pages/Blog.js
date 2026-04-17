import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function readTime(text = '') {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));
}

function HeroPost({ block }) {
  const { id, data } = block;
  const title   = data.title || data.heading || 'Zonder titel';
  const excerpt = data.excerpt || data.body  || '';
  const image   = data.imageUrl;
  const author  = data.author || 'ALRA LED';
  const date    = data.date   || '';

  return (
    <Link to={`/blog/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-none md:rounded-2xl" style={{ background: '#0a0a0a' }}>
        {image && (
          <img src={image} alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-35 group-hover:scale-[1.03] transition-all duration-700 ease-out" />
        )}
        {/* Grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)' }} />

        <div className="relative px-8 md:px-14 py-16 md:py-24 flex flex-col justify-end min-h-[480px]">
          {/* Index number */}
          <span className="absolute top-8 right-10 text-white/10 font-black text-8xl select-none leading-none">01</span>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="h-px w-8" style={{ background: 'rgb(var(--color-primary))' }} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgb(var(--color-primary))' }}>
                Uitgelicht
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tight group-hover:text-white/90 transition-colors">
              {title}
            </h2>

            {excerpt && (
              <p className="text-white/50 text-base leading-relaxed line-clamp-2 font-light">{excerpt}</p>
            )}

            <div className="flex items-center gap-5 pt-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                  style={{ background: 'rgba(var(--color-primary)/0.7)' }}>
                  {author[0]?.toUpperCase()}
                </div>
                <span className="text-white/40 text-xs font-medium">{author}</span>
              </div>
              {date && <span className="text-white/25 text-xs">·</span>}
              {date && <span className="text-white/40 text-xs">{date}</span>}
              <span className="text-white/25 text-xs">·</span>
              <span className="text-white/40 text-xs">{readTime(excerpt)} min</span>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 text-sm font-bold border-b border-white/20 pb-0.5 group-hover:border-white/60 transition-colors text-white/70 group-hover:text-white">
                Lees artikel
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ListPost({ block, index }) {
  const { id, data } = block;
  const title   = data.title || data.heading || 'Zonder titel';
  const excerpt = data.excerpt || data.body  || '';
  const image   = data.imageUrl;
  const author  = data.author || 'ALRA LED';
  const date    = data.date   || '';
  const num     = String(index + 2).padStart(2, '0');

  return (
    <Link to={`/blog/${id}`}
      className="group flex gap-5 py-6 border-b border-gray-100 hover:border-gray-300 transition-colors last:border-0">
      {/* Number */}
      <span className="text-2xl font-black text-gray-100 group-hover:text-gray-200 transition-colors select-none shrink-0 leading-none mt-1"
        style={{ fontVariantNumeric: 'tabular-nums' }}>
        {num}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
          {date && <span>{date}</span>}
          {date && <span>·</span>}
          <span>{readTime(excerpt)} min lezen</span>
        </div>
        <h3 className="font-black text-gray-900 text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2"
          style={{ '--tw-text-opacity': 1 }}>
          <span className="group-hover:underline decoration-2 underline-offset-2"
            style={{ textDecorationColor: 'rgb(var(--color-primary))' }}>
            {title}
          </span>
        </h3>
        {excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed font-light">{excerpt}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center shrink-0"
            style={{ background: 'rgb(var(--color-primary))' }}>
            {author[0]?.toUpperCase()}
          </div>
          <span className="text-xs text-gray-400">{author}</span>
        </div>
      </div>

      {/* Thumb */}
      {image && (
        <div className="w-24 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
          <img src={image} alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
      )}
    </Link>
  );
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
  const featured = articles[0] || null;
  const rest     = articles.slice(1);

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
