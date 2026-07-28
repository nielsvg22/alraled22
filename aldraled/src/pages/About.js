import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const STAT_ICONS = ['📅', '🤝', '🏆', '💡'];

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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-7 relative z-10">
              <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                {data.eyebrow}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-secondary leading-[1.08] tracking-tight">
                {titleParts[0]}<span className="text-primary">{String(title).toLowerCase().includes(highlightWord) ? String(title).slice(String(title).toLowerCase().indexOf(highlightWord), String(title).toLowerCase().indexOf(highlightWord) + highlightWord.length) : ''}</span>{titleParts[1]}
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
              <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-lg font-light">{description}</p>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 rounded-3xl blur-2xl" />
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl group">
                <img
                  src={data.image}
                  alt="ALRA LED Team"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-5 py-4 border border-gray-100 hidden md:flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🏭</span>
                </div>
                <div>
                  <p className="text-lg font-black text-primary leading-none">10+</p>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-0.5">Jaar ervaring</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-secondary text-white rounded-2xl shadow-xl px-4 py-3 hidden md:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Kwaliteit</p>
                <p className="text-xl font-black leading-none mt-0.5">A++</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-300">
          <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-transparent" />
        </div>
      </section>

      {/* Statistieken */}
      {stats.length > 0 && (
        <section className="py-20 md:py-28 px-6 md:px-10 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-[0.3em]">
                <span className="w-8 h-px bg-primary" />
                In cijfers
                <span className="w-8 h-px bg-primary" />
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-4 leading-tight tracking-tight">Onze prestaties</h2>
              <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto font-light">Cijfers die onze groei en kwaliteit ondersteunen</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
              {stats.map((stat, i) => {
                const numVal = parseStatValue(stat.value);
                const suffix = getStatSuffix(stat.value);
                return (
                  <div key={i} className="relative bg-white rounded-2xl p-6 md:p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-center overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <span className="text-xl">{STAT_ICONS[i % STAT_ICONS.length]}</span>
                    </div>
                    <p className="text-3xl md:text-4xl font-black text-primary leading-none">
                      {numVal !== null ? <Counter end={numVal} suffix={suffix} /> : stat.value}
                    </p>
                    <p className="text-[11px] font-bold text-secondary uppercase tracking-wider mt-3">{stat.label}</p>
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
        <section className="py-20 md:py-28 px-6 md:px-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-[0.3em]">
                <span className="w-8 h-px bg-primary" />
                Kernwaarden
                <span className="w-8 h-px bg-primary" />
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-4 leading-tight tracking-tight">Waar wij voor staan</h2>
              <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto font-light">De principes die ons dagelijks drijven</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {values.map(({ icon, title, text }, index) => (
                <div key={title} className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary text-white rounded-lg flex items-center justify-center text-xs font-black hidden md:flex">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    {icon || (index === 1 ? "🛡️" : index === 2 ? "💬" : "⚡")}
                  </div>
                  <h3 className="font-black text-secondary text-lg mb-3">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-primary group-hover:gap-3 transition-all">
                      Meer info <span>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tijdlijn */}
      {timeline.length > 0 && (
        <section className="py-20 md:py-28 px-6 md:px-10 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-[0.3em]">
                <span className="w-8 h-px bg-primary" />
                Geschiedenis
                <span className="w-8 h-px bg-primary" />
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-4 leading-tight tracking-tight">{data.timelineTitle}</h2>
              <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto font-light">Een overzicht van onze mijlpalen</p>
            </div>
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 hidden md:block" />
              <div className="space-y-0">
                {timeline.map(({ year, label }, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                    <div key={i} className={`relative flex items-center md:justify-center gap-5 md:gap-0 py-6 ${i < timeline.length - 1 ? '' : ''}`}>
                      <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-[3px] border-primary z-10 shadow-sm transition-all duration-300 group-hover:scale-125`} />
                      <div className={`md:w-1/2 ${isLeft ? 'md:pr-16 md:text-right' : 'md:pl-16 md:ml-auto md:text-left'} flex ${isLeft ? 'md:justify-end' : 'md:justify-start'}`}>
                        <div className={`bg-white rounded-2xl px-6 py-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 max-w-sm ${isLeft ? 'md:mr-0' : 'md:ml-0'}`}>
                          <span className="text-xs font-black text-primary uppercase tracking-widest">{year}</span>
                          <p className="text-sm font-medium text-secondary leading-snug mt-1">{label}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'bottom')} />

      {/* CTA */}
      <section className="py-16 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-secondary rounded-3xl overflow-hidden px-8 md:px-16 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-accent/5 rounded-full blur-2xl" />
            </div>
            <div className="relative space-y-3 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">Ben je benieuwd wat wij voor je kunnen betekenen?</h2>
              <p className="text-white/50 text-sm max-w-lg">Neem contact op voor een vrijblijvend gesprek over uw verlichtingsbehoefte.</p>
            </div>
            <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
              <Link to="/contact" className="bg-primary text-white px-7 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30 whitespace-nowrap">
                Neem Contact Op
              </Link>
              <Link to="/producten" className="bg-white/10 border border-white/20 text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-white/20 transition-all whitespace-nowrap">
                Bekijk Producten
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
