import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import CustomBlocks from '../components/CustomBlocks';
import { getMediaUrl, API_URL } from '../lib/api';

const SeoLandingPage = () => {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/seo_page_${slug}`, { params: { lang } })
      .then(res => {
        setPage(res.data);
        document.title = res.data?.seoTitle || `${slug.replace(/-/g, ' ')} | ALRA LED`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && res.data?.metaDescription) metaDesc.content = res.data.metaDescription;
      })
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug, i18n.resolvedLanguage, i18n.language]);

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
        <Link to="/" className="text-primary font-bold text-sm hover:underline">← Terug naar home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-3 flex items-center gap-2 text-xs text-gray-400">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-secondary font-medium truncate max-w-xs">{page.title || slug}</span>
        </div>
      </div>

      {/* Hero */}
      {page.heroImage && (
        <div className="relative h-64 md:h-96 overflow-hidden bg-gray-100">
          <img src={getMediaUrl(page.heroImage)} alt={page.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/30 to-transparent flex items-end">
            <div className="max-w-6xl mx-auto px-6 md:px-10 pb-10 w-full">
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-3xl">{page.title}</h1>
              {page.subtitle && <p className="text-white/60 text-lg mt-2 max-w-2xl">{page.subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {!page.heroImage && (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
          <h1 className="text-3xl md:text-5xl font-black text-secondary leading-tight">{page.title}</h1>
          {page.subtitle && <p className="text-gray-500 text-lg mt-3 max-w-3xl">{page.subtitle}</p>}
        </div>
      )}

      {/* Content blocks */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        {page.content && (
          <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-6">
            {page.content.split('\n\n').map((block, i) => {
              if (block.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-black text-secondary mt-10 mb-4">{block.replace('## ', '')}</h2>;
              }
              if (block.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-black text-secondary mt-8 mb-3">{block.replace('### ', '')}</h3>;
              }
              if (block.startsWith('- ')) {
                return (
                  <ul key={i} className="list-disc pl-6 space-y-2">
                    {block.split('\n').filter(l => l.trim()).map((line, j) => (
                      <li key={j} className="text-gray-600">{line.replace('- ', '')}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={i} className="text-gray-600 leading-relaxed">{block}</p>;
            })}
          </div>
        )}

        {/* Custom blocks */}
        {Array.isArray(page.blocks) && page.blocks.length > 0 && (
          <div className="mt-12">
            <CustomBlocks blocks={page.blocks} />
          </div>
        )}

        {/* FAQ Section */}
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
                  <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">{item.answer}</div>
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
};

export default SeoLandingPage;
