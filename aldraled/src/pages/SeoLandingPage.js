import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ROUTES } from "../lib/routes";
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import RichContent from '../components/RichContent';
import CustomBlocks from '../components/CustomBlocks';
import { getMediaUrl, API_URL, plainText } from '../lib/api';
import RichText from '../components/RichText';
import GROUP_DEFAULTS from '../lib/groupPages.json';
import { getImageSrc, formatPrice } from '../lib/productHelpers';

// Productgroep-pagina's hebben standaardteksten (overgenomen van de oude site); wat in het CRM is
// ingevuld wint, lege velden vallen terug op de standaard.
const mergeWithDefaults = (slug, data) => {
  const defaults = GROUP_DEFAULTS[slug];
  if (!defaults) return data;
  const merged = { ...defaults };
  Object.entries(data || {}).forEach(([k, v]) => {
    const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
    if (!empty) merged[k] = v;
  });
  return merged;
};

// Video: YouTube/Vimeo-link wordt ingebed, een bestand (.mp4/.webm/upload) speelt direct af.
export function videoEmbed(url) {
  const u = String(url || '').trim();
  if (!u) return null;
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i);
  if (yt) return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) return { type: 'iframe', src: `https://player.vimeo.com/video/${vm[1]}` };
  return { type: 'file', src: getMediaUrl(u) };
}

function SeoLandingPage(props) {
  const params = useParams();
  const slug = props.slug || params.slug;
  const { i18n } = useTranslation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const isGroup = Boolean(GROUP_DEFAULTS[slug]);

  useEffect(() => {
    if (!isGroup) return;
    const words = (GROUP_DEFAULTS[slug].categoryMatch || []).map(w => w.toLowerCase());
    axios.get(`${API_URL}/api/products`)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setProducts(list.filter(p => {
          const hay = `${p.category || ''} ${p.name || ''}`.toLowerCase();
          return words.some(w => hay.includes(w));
        }));
      })
      .catch(() => setProducts([]));
  }, [slug, isGroup]);

  const applyPage = (data) => {
    setPage(data);
    if (data) {
      document.title = data.seoTitle || `${slug.replace(/-/g, ' ')} | ALRA LED`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && data.metaDescription) metaDesc.content = data.metaDescription;
    }
  };

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/seo_page_${slug}`, { params: { lang } })
      .then(res => applyPage(mergeWithDefaults(slug, res.data)))
      .catch(() => applyPage(GROUP_DEFAULTS[slug] ? mergeWithDefaults(slug, null) : null))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, i18n.resolvedLanguage, i18n.language]);

  // Structured data JSON-LD
  const jsonLd = useMemo(() => {
    if (!page) return null;

    const schemas = [];

    // BreadcrumbList
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://alra-led.com/' },
        { '@type': 'ListItem', position: 2, name: page.title || slug, item: `https://alra-led.com/${slug}/` },
      ],
    });

    // FAQPage
    if (Array.isArray(page.faq) && page.faq.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: plainText(item.answer) },
        })),
      });
    }

    // LocalBusiness
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'ALRA LED Solutions',
      address: { '@type': 'PostalAddress', streetAddress: 'Dijkgraafweg 4a', addressLocality: 'Apeldoorn', postalCode: '7323WC', addressCountry: 'NL' },
      telephone: '+31850021606',
      email: 'info@alra-led.nl',
      url: 'https://alra-led.com',
      areaServed: 'NL',
    });

    return schemas;
  }, [page, slug]);

  // Inject JSON-LD into document head
  useEffect(() => {
    if (!jsonLd) return;
    const scripts = jsonLd.map(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      return script;
    });
    return () => { scripts.forEach(s => s.remove()); };
  }, [jsonLd]);

  // Content rendering function
  function renderContentBlock(block, i) {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Table: lines starting with |
    if (trimmed.startsWith('|') && trimmed.includes('\n')) {
      const lines = trimmed.split('\n').filter(l => l.trim());
      const headers = lines[0].split('|').filter(c => c.trim()).map(c => c.trim());
      const separatorLine = lines[1] && lines[1].includes('---');
      const bodyLines = separatorLine ? lines.slice(2) : lines.slice(1);

      return (
        <div key={i} className="overflow-x-auto my-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {headers.map((h, j) => <th key={j} className="px-4 py-3 text-left font-black text-secondary text-xs uppercase tracking-widest">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {bodyLines.filter(l => l.trim()).map((line, j) => (
                <tr key={j} className={`${j % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                  {line.split('|').filter(c => c.trim()).map((cell, k) => (
                    <td key={k} className="px-4 py-3 text-gray-600">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (trimmed.startsWith('## ')) {
      return <h2 key={i} className="text-2xl font-black text-secondary mt-10 mb-4">{trimmed.replace('## ', '')}</h2>;
    }
    if (trimmed.startsWith('### ')) {
      return <h3 key={i} className="text-xl font-black text-secondary mt-8 mb-3">{trimmed.replace('### ', '')}</h3>;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <ul key={i} className="list-disc pl-6 space-y-2 my-4">
          {trimmed.split('\n').filter(l => l.trim()).map((line, j) => (
            <li key={j} className="text-gray-600">{line.replace(/^[-*] /, '')}</li>
          ))}
        </ul>
      );
    }
    return <p key={i} className="text-gray-600 leading-relaxed my-4">{trimmed}</p>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-300 font-bold">Laden...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 font-medium">Pagina niet gevonden</p>
        <Link to={ROUTES.home} className="text-primary font-bold text-sm hover:underline">← Terug naar home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-3 flex items-center gap-2 text-xs text-gray-400">
          <Link to={ROUTES.home} className="hover:text-secondary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-secondary font-medium truncate max-w-xs">{page.title || slug}</span>
        </div>
      </div>

      {/* Hero with image */}
      {page.heroImage && (
        <div className="relative h-64 md:h-96 overflow-hidden bg-gray-100">
          <img src={getMediaUrl(page.heroImage)} alt={page.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/30 to-transparent flex items-end">
            <div className="max-w-6xl mx-auto px-6 md:px-10 pb-10 w-full">
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-3xl">{page.title}</h1>
              {page.subtitle && <p className="text-white/60 text-lg mt-2 max-w-2xl">{page.subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Hero without image */}
      {!page.heroImage && (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
          <h1 className="text-3xl md:text-5xl font-black text-secondary leading-tight">{page.title}</h1>
          {page.subtitle && <p className="text-gray-500 text-lg mt-3 max-w-3xl">{page.subtitle}</p>}
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        {page.content && (
          <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
            <RichContent
              value={page.content}
              legacy={(text) => text.split('\n\n').map((block, i) => renderContentBlock(block, i))}
            />
          </div>
        )}

        {/* Specificaties */}
        {page.specs && (
          <div className="mt-12 bg-gray-50 rounded-3xl p-8 md:p-10">
            {page.specsTitle && <h2 className="text-2xl font-black text-secondary mb-5">{page.specsTitle}</h2>}
            <RichText as="div" value={page.specs} className="rich-description grid md:grid-cols-2 gap-x-10 text-gray-600" />
          </div>
        )}

        {/* Afbeeldingen */}
        {Array.isArray(page.images) && page.images.filter(Boolean).length > 0 && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {page.images.filter(Boolean).map((img, i) => (
              <img key={i} src={getMediaUrl(img)} alt={page.title} className="w-full max-h-[32rem] object-contain rounded-2xl bg-gray-50" loading="lazy" decoding="async" />
            ))}
          </div>
        )}

        {/* Video's */}
        {Array.isArray(page.videos) && page.videos.filter(Boolean).length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {page.videos.filter(Boolean).map((url, i) => {
              const v = videoEmbed(url);
              if (!v) return null;
              return v.type === 'iframe'
                ? <div key={i} className="aspect-video rounded-2xl overflow-hidden bg-black"><iframe src={v.src} title={`${page.title} video ${i + 1}`} className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" /></div>
                : <video key={i} src={v.src} controls preload="metadata" className="w-full rounded-2xl bg-black" />;
            })}
          </div>
        )}

        {/* Producten uit deze groep */}
        {isGroup && products.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-secondary mb-6">Producten</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.slice(0, 12).map(product => (
                <Link key={product.id} to={ROUTES.product(product.id)} className="group block">
                  <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 mb-3">
                    <img src={getImageSrc(product)} alt={product.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                  </div>
                  <p className="text-sm font-bold text-secondary leading-snug group-hover:text-primary transition-colors">{product.name}</p>
                  <p className="text-sm font-black text-secondary mt-0.5">{formatPrice(product.price)} <span className="text-[10px] font-medium text-gray-400">excl. btw</span></p>
                </Link>
              ))}
            </div>
            <Link to={ROUTES.shop} className="inline-block mt-6 text-xs font-bold text-secondary hover:text-primary uppercase tracking-widest">Alle producten →</Link>
          </div>
        )}

        {/* Custom blocks */}
        {Array.isArray(page.blocks) && page.blocks.length > 0 && (
          <div className="mt-12">
            <CustomBlocks blocks={page.blocks} />
          </div>
        )}

        {/* FAQ */}
        {Array.isArray(page.faq) && page.faq.length > 0 && (
          <div className="mt-16 border-t border-gray-100 pt-12">
            <h2 className="text-2xl font-black text-secondary mb-8">Veelgestelde vragen</h2>
            <div className="space-y-4">
              {page.faq.map((item, i) => (
                <details key={i} className="group bg-gray-50 rounded-2xl overflow-hidden">
                  <summary className="px-6 py-4 font-bold text-secondary cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between">
                    {item.question}
                    <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <RichText as="div" value={item.answer} className="px-6 pb-4 text-sm text-gray-500 leading-relaxed" />
                </details>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {page.ctaTitle && (
          <div className="mt-16 bg-secondary rounded-3xl p-10 md:p-14 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">{page.ctaTitle}</h2>
            {page.ctaText && <p className="text-white/60 text-sm mb-6 max-w-xl mx-auto">{page.ctaText}</p>}
            {page.ctaButtonText && (
              <Link to={page.ctaButtonLink || '/producten'} className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all">
                {page.ctaButtonText}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SeoLandingPage;
