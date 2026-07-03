import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PAGE_KEYS = {
  'algemene-voorwaarden': 'legal_terms',
  'privacy-policy': 'legal_privacy',
  'retourbeleid': 'legal_returns',
  'klachten': 'legal_complaints',
};

const DEFAULT_TITLES = {
  'legal_terms': 'Algemene Voorwaarden',
  'legal_privacy': 'Privacy Policy',
  'legal_returns': 'Terugbetaal- en Retourneringsbeleid',
  'legal_complaints': 'Klachten en retouren',
};

const LegalPage = () => {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  const contentKey = PAGE_KEYS[slug];

  useEffect(() => {
    if (!contentKey) { setLoading(false); return; }
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/${contentKey}`, { params: { lang } })
      .then(res => setPage(res.data))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [contentKey, i18n.resolvedLanguage, i18n.language]);

  if (!contentKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 font-medium">Pagina niet gevonden</p>
        <Link to="/" className="text-primary font-bold text-sm hover:underline">← Terug naar home</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-300 font-bold">Laden...</div>
      </div>
    );
  }

  const title = page?.title || DEFAULT_TITLES[contentKey] || '';
  const content = page?.content || '';

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-3 flex items-center gap-2 text-xs text-gray-400">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-secondary font-medium">{title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-12">
        <h1 className="text-3xl md:text-4xl font-black text-secondary leading-tight mb-8">{title}</h1>
        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
          {content.split('\n').map((paragraph, i) => (
            paragraph.trim() ? <p key={i} className="mb-4">{paragraph}</p> : null
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
