import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
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

  return (
    <div className="bg-white">

      {/* Hero block */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">{data.eyebrow}</p>
              <h1 className="text-3xl md:text-4xl font-black text-secondary leading-tight">
                {titleParts[0]}<span className="text-primary">{String(title).toLowerCase().includes(highlightWord) ? String(title).slice(String(title).toLowerCase().indexOf(highlightWord), String(title).toLowerCase().indexOf(highlightWord) + highlightWord.length) : ''}</span>{titleParts[1]}
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {stats.map((stat, i) => (
                  <div key={i} className="border-l-2 border-primary pl-4">
                    <p className="text-2xl font-black text-secondary">{stat.value}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-first md:order-last">
              <img src={data.image} alt="ALRA LED Team" className="rounded-2xl w-full aspect-video object-cover shadow-md" />
            </div>
          </div>
        </div>
      </div>

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'top')} />

      {/* Values */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map(({ icon, title, text }, index) => (
            <div key={title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-xl mb-4">{icon || (index === 1 ? "🛡️" : index === 2 ? "💬" : "⚡")}</div>
              <h3 className="font-black text-secondary text-base mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-6">{data.timelineTitle}</p>
          <div className="relative">
            <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gray-200 hidden sm:block" />
            <div className="space-y-6">
              {timeline.map(({ year, label }, i) => (
                <div key={i} className="flex items-start gap-5">
                  <div className="shrink-0 w-14 text-right">
                    <span className="text-xs font-black text-primary">{year}</span>
                  </div>
                  <div className="shrink-0 w-3 h-3 rounded-full bg-primary mt-0.5 relative z-10 hidden sm:block" />
                  <p className="text-sm font-medium text-secondary leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'bottom')} />

    </div>
  );
};

export default About;
