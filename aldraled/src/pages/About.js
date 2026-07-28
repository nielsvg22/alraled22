import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Counter from '../components/Counter';
import CustomBlocks from '../components/CustomBlocks';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DEFAULTS = {
  eyebrow: 'Over ons',
  title: "Gedreven door Kwaliteit en Duurzaamheid",
  description: "ALRA LED Solutions is in 2014 opgericht met één doel: de allerbeste LED-verlichtingsoplossingen leveren voor professionals. Wij werken uitsluitend met producten van topkwaliteit, voorzien van alle vereiste certificeringen. Ons team van gedreven engineers staat klaar om samen met u tot de perfecte oplossing te komen — van idee tot eindproduct.",
  image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
  stats: [
    { label: "Opgericht", value: "2014" },
    { label: "Partners NL & BE", value: "225+" },
    { label: "Kwaliteitsrating", value: "A++" },
    { label: "Eigen productlijn", value: "2018" },
  ],
  values: [
    { icon: "⚡", title: "Vakmanschap", text: "Gedreven engineers betrokken bij ontwerp, techniek, duurzaamheid en functionaliteit. Van schets tot gecertificeerd eindproduct." },
    { icon: "🛡️", title: "Kwaliteit & Garantie", text: "Uitsluitend CE- en RoHS-gecertificeerde LED-producten. Volledige garantie op elk product dat wij leveren." },
    { icon: "💬", title: "Persoonlijk Advies", text: "Loopt u in het werkveld tegen een probleem aan? Wij komen graag langs om samen tot de beste oplossing te komen." },
  ],
  timelineTitle: "Onze geschiedenis",
  timeline: [
    { year: '2014', label: 'Oprichting ALRA LED Solutions' },
    { year: '2018', label: 'Eerste eigen LED-productlijn ontwikkeld' },
    { year: '2020', label: '50e aangesloten groothandel in Nederland' },
    { year: '2022', label: '150e technische dealer in NL en België' },
    { year: '2024', label: 'Nieuw productassortiment weg- en bouwplaatsveiligheid' },
  ],
};

const About = () => {
  const { i18n } = useTranslation();
  const [data, setData] = useState(DEFAULTS);
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/about`, { params: { lang } })
      .then(res => setData({ ...DEFAULTS, ...res.data }))
      .catch(() => {});
    axios.get(`${API_URL}/api/content/page_blocks_about`, { params: { lang } })
      .then(res => setBlocks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBlocks([]));
  }, [i18n.resolvedLanguage, i18n.language]);

  const languageCode = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
  const title = data.title;
  const description = data.description;
  const stats = Array.isArray(data.stats) ? data.stats : [];

  const highlightWordByLanguage = {
    nl: 'kwaliteit',
    en: 'quality',
    de: 'qualität',
  };
  const highlightWord = highlightWordByLanguage[languageCode] || highlightWordByLanguage.nl;
  const titleParts = String(title).toLowerCase().includes(highlightWord)
    ? [String(title).slice(0, String(title).toLowerCase().indexOf(highlightWord)), String(title).slice(String(title).toLowerCase().indexOf(highlightWord) + highlightWord.length)]
    : [title, ''];

  const values = Array.isArray(data.values) ? data.values : [];
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];

  const parseStatValue = (val) => {
    const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? null : num;
  };

  const getStatSuffix = (val) => {
    const str = String(val);
    const match = str.match(/[^0-9]+$/);
    return match ? match[0] : '';
  };

  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-6 relative z-10">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">{data.eyebrow}</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-secondary leading-[1.1] tracking-tight">
                {titleParts[0]}<span className="text-primary">{String(title).toLowerCase().includes(highlightWord) ? String(title).slice(String(title).toLowerCase().indexOf(highlightWord), String(title).toLowerCase().indexOf(highlightWord) + highlightWord.length) : ''}</span>{titleParts[1]}
              </h1>
              <div className="w-12 h-1 bg-primary rounded-full" />
              <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-lg">{description}</p>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={data.image}
                  alt="ALRA LED Team"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/10 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistieken */}
      {stats.length > 0 && (
        <section className="py-20 md:py-28 px-6 md:px-10 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-[0.3em]">
                <span className="w-8 h-px bg-primary" />
                In cijfers
                <span className="w-8 h-px bg-primary" />
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-4 leading-tight tracking-tight">Onze prestaties</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => {
                const numVal = parseStatValue(stat.value);
                const suffix = getStatSuffix(stat.value);
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-center">
                    <p className="text-4xl md:text-5xl font-black text-primary leading-none">
                      {numVal !== null ? <Counter end={numVal} suffix={suffix} /> : stat.value}
                    </p>
                    <p className="text-xs font-bold text-secondary uppercase tracking-wider mt-3">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'top')} />

      {/* Waarden */}
      {values.length > 0 && (
        <section className="py-20 md:py-28 px-6 md:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-[0.3em]">
                <span className="w-8 h-px bg-primary" />
                Kernwaarden
                <span className="w-8 h-px bg-primary" />
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-4 leading-tight tracking-tight">Waar wij voor staan</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {values.map(({ icon, title, text }, index) => (
                <div key={title} className="bg-gray-50 rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-primary/20 transition-colors">
                    {icon || (index === 1 ? "🛡️" : index === 2 ? "💬" : "⚡")}
                  </div>
                  <h3 className="font-black text-secondary text-base mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tijdlijn */}
      {timeline.length > 0 && (
        <section className="py-20 md:py-28 px-6 md:px-10 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-[0.3em]">
                <span className="w-8 h-px bg-primary" />
                Geschiedenis
                <span className="w-8 h-px bg-primary" />
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-4 leading-tight tracking-tight">{data.timelineTitle}</h2>
            </div>
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gray-200 hidden sm:block" />
              <div className="space-y-8">
                {timeline.map(({ year, label }, i) => (
                  <div key={i} className="flex items-start gap-5 group">
                    <div className="shrink-0 w-14 text-right">
                      <span className="text-sm font-black text-primary">{year}</span>
                    </div>
                    <div className="shrink-0 w-3 h-3 rounded-full bg-primary mt-1 relative z-10 hidden sm:block group-hover:scale-125 transition-transform" />
                    <div className="bg-white rounded-xl px-5 py-3 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow flex-1">
                      <p className="text-sm font-medium text-secondary leading-snug">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'bottom')} />

    </div>
  );
};

export default About;
