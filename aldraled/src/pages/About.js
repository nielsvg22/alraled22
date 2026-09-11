import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import CustomBlocks from '../components/CustomBlocks';
import { getMediaUrl } from '../lib/api';
import { ROUTES, shopWithCategory } from '../lib/routes';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Merk-accentblauw per visueel concept; primaire knoppen/iconen op deze pagina.
const B = '#0B67D8';

const DEFAULTS = {
  eyebrow: 'Over ons',
  title: 'Kwaliteit, innovatie en ontwikkeling. ALRA werkt graag met u samen.',
  description: 'Bij ALRA LED Solutions geloven we in verlichting die verder gaat. Voor professionals die elke dag het verschil maken.',
  image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=1600',
  values: [
    { icon: '⚡', title: 'Vakmanschap', text: 'Gedreven engineers betrokken bij ontwerp, techniek, duurzaamheid en functionaliteit. Van schets tot gecertificeerd eindproduct.' },
    { icon: '🛡️', title: 'Kwaliteit & garantie', text: 'Uitsluitend CE- en RoHS-gecertificeerde LED-producten. Volledige garantie op elk product dat wij leveren.' },
    { icon: '💬', title: 'Persoonlijk advies', text: 'Loopt u in het werkveld tegen een probleem aan? Wij komen graag langs om samen tot de beste oplossing te komen.' },
  ],
};

// Bestaande site-afbeeldingen als fallback wanneer een media-URL ontbreekt.
const IMG = {
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600',
  van: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=1600',
  hefbrug: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1600',
  werkplaats: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1200',
  constructie: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=1600',
};

const CAT_FALLBACK = {
  'bedrijfswagenverlichting': IMG.van,
  'bouwlichtslangen-en-toebehoren': IMG.constructie,
  'led-hefbrugverlichting': IMG.hefbrug,
  'led-draagbare-werkverlichting': IMG.werkplaats,
  'veiligheidsverlichting': IMG.constructie,
};

const ALL_FALLBACK = 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=1600';

const HeroUsps = [
  { icon: 'truck', title: 'Snel geleverd', text: 'Direct leverbaar' },
  { icon: 'shield', title: 'Professionele kwaliteit', text: 'Geselecteerd voor de praktijk' },
  { icon: 'chat', title: 'Persoonlijk advies', text: 'Direct contact, korte lijnen' },
];

const TrustBar = [
  { icon: 'package', title: 'Professionele LED-oplossingen', text: 'Voor zakelijke klanten' },
  { icon: 'grid', title: 'Breed assortiment', text: 'Voor verschillende toepassingen' },
  { icon: 'truck', title: 'Snelle levering', text: 'Uit eigen voorraad' },
  { icon: 'chat', title: 'Persoonlijk advies', text: 'Direct contact' },
];

const WhyCards = [
  { num: '01', icon: 'gem', title: 'Kwaliteit', text: 'Betrouwbare verlichting die ontwikkeld is voor intensief professioneel gebruik.' },
  { num: '02', icon: 'bolt', title: 'Snelheid', text: 'Veel producten direct uit voorraad leverbaar, zodat je snel verder kunt.' },
  { num: '03', icon: 'book', title: 'Kennis', text: 'Geen algemene verkooppraatjes, maar praktisch advies passend bij de toepassing.' },
  { num: '04', icon: 'headphones', title: 'Service', text: 'Korte lijnen, duidelijke communicatie en persoonlijk contact.' },
];

const ApproachSteps = [
  { num: '01', title: 'Vertel ons wat je nodig hebt', text: 'U geeft uw wensen of toepassing door.' },
  { num: '02', title: 'Wij adviseren de juiste oplossing', text: 'Op basis van onze kennis en ervaring.' },
  { num: '03', title: 'Snel geleverd en klaar voor gebruik', text: 'Zodat u direct verder kunt.' },
];

const GroothandelTrust = [
  { icon: 'stock', title: 'Ruime voorraad', text: 'Direct leverbaar' },
  { icon: 'percent', title: 'Zakelijke condities', text: 'Scherpe afspraken' },
  { icon: 'chat', title: 'Persoonlijk contact', text: 'Wij denken met je mee' },
];

/* ── Inline SVG-iconen (zelfde stijl als rest van de site) ─────────── */
const Ic = ({ className = 'w-5 h-5', children }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconTruck = (p) => <Ic {...p}><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></Ic>;
const IconShield = (p) => <Ic {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Ic>;
const IconChat = (p) => <Ic {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Ic>;
const IconPackage = (p) => <Ic {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></Ic>;
const IconGrid = (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></Ic>;
const IconBolt = (p) => <Ic {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Ic>;
const IconBook = (p) => <Ic {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Ic>;
const IconHeadphones = (p) => <Ic {...p}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></Ic>;
const IconGem = (p) => <Ic {...p}><polygon points="6 3 18 3 22 9 12 22 2 9" /><path d="M2 9h20M12 3l-2.5 6L12 22l2.5-13L12 3z" /></Ic>;
const IconArrow = (p) => <Ic {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Ic>;
const IconStock = (p) => <Ic {...p}><path d="M3 3v18h18" /><path d="M7 14l3-4 3 3 4-6" /></Ic>;
const IconPercent = (p) => <Ic {...p}><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></Ic>;
const IconQuote = (p) => <Ic {...p}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></Ic>;

const ICONMAP = {
  truck: IconTruck, shield: IconShield, chat: IconChat, package: IconPackage,
  grid: IconGrid, bolt: IconBolt, book: IconBook, headphones: IconHeadphones,
  gem: IconGem, arrow: IconArrow, stock: IconStock, percent: IconPercent, quote: IconQuote,
};

const Eyebrow = ({ children, light }) => (
  <span className={`inline-flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] ${light ? 'text-white/80' : 'text-primary'}`}>
    <span className={`h-px w-8 ${light ? 'bg-white/40' : `bg-[#0B67D8]`}`} />
    {children}
  </span>
);

const SectionTitle = ({ children, light }) => (
  <h2 className={`mt-4 text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.05] tracking-tight ${light ? 'text-white' : 'text-secondary'}`}>
    {children}
  </h2>
);

// "ALRA" blauw highlighten in willekeurige titels
const renderHighlight = (text) => {
  const parts = String(text || '').split(/(ALRA)/g);
  return parts.map((part, i) =>
    part.toLowerCase() === 'alra'
      ? <span key={i} style={{ color: B }}>{part}</span>
      : <span key={i}>{part}</span>
  );
};

/* ── HOOFDCOMPONENT ───────────────────────────────────────────────── */
const About = () => {
  const { i18n } = useTranslation();
  const [data, setData] = useState(DEFAULTS);
  const [blocks, setBlocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/about`, { params: { lang } })
      .then(res => setData({ ...DEFAULTS, ...res.data }))
      .catch(() => {});
    axios.get(`${API_URL}/api/content/page_blocks_about`, { params: { lang } })
      .then(res => setBlocks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBlocks([]));
    axios.get(`${API_URL}/api/products/categories/all`)
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
    axios.get(`${API_URL}/api/products`)
      .then(res => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [i18n.resolvedLanguage, i18n.language]);

  const values = Array.isArray(data.values) && data.values.length > 0 ? data.values : DEFAULTS.values;

  const firstProductImage = (p) => {
    const img = (p && p.images && p.images[0] && p.images[0].url) || (p && p.imageUrl) || '';
    return img || '';
  };

  // Realistische afbeeldingen per categorie o.b.v. echte productfoto's
  const catImages = useMemo(() => {
    const map = {};
    categories.forEach(cat => {
      const match = products.find(p => p.categoryId === cat.id && firstProductImage(p));
      map[cat.id] = match ? firstProductImage(match) : null;
    });
    return map;
  }, [categories, products]);

  const pickProduct = (frag) => products.find(p => String(p.category || '').toLowerCase().includes(frag) && firstProductImage(p));
  const filmImg = firstProductImage(pickProduct('bedrijfswagen')) || IMG.van;
  const lampImg = firstProductImage(pickProduct('draagbare')) || IMG.werkplaats;
  const bouwImg = firstProductImage(pickProduct('bouw')) || IMG.constructie;
  const vanImg = firstProductImage(pickProduct('bedrijfswagen')) || IMG.van;

  const heroImg = getMediaUrl(data.image) || IMG.office;
  const introImg = heroImg;
  const warehouseImg = bouwImg || IMG.constructie;
  const storyBig = heroImg;
  const storyA = lampImg;
  const storyB = vanImg || IMG.van;
  const quoteBg = filmImg;
  const ctaImg = firstProductImage(pickProduct('bedrijfswagen')) || IMG.van;

  const heroIntro = String(data.description || '').toLowerCase().includes(String(data.title || '').slice(0, 30).toLowerCase())
    ? 'Bij ALRA LED Solutions geloven we in verlichting die verder gaat. Voor professionals die elke dag het verschil maken.'
    : data.description;

  return (
    <div className="bg-white">

      {/* ══ HERO — foto rechts naar viewport ↦ 43/57 ══ */}
      <section className="relative overflow-hidden bg-white">
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[57%]">
          <img src={heroImg} alt="ALRA LED Solutions" className="w-full h-full object-cover" loading="eager" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:min-h-[640px] items-center">
          <div className="max-w-xl space-y-6">
            <Eyebrow>Over Alra</Eyebrow>
            <h1 className="text-[clamp(2.1rem,4.8vw,4.4rem)] font-extrabold leading-[1.04] tracking-tight text-secondary">
              {renderHighlight(data.title)}
            </h1>
            <p className="text-[17px] leading-relaxed text-slate-500 max-w-lg">{heroIntro}</p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                to={ROUTES.shop}
                className="inline-flex items-center justify-center gap-2 bg-[#0B67D8] text-white font-bold text-sm px-7 py-3.5 rounded-[10px] hover:brightness-110 transition-all shadow-lg shadow-[#0B67D8]/25"
              >
                Bekijk ons assortiment <IconArrow className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.contact}
                className="inline-flex items-center justify-center gap-2 border border-slate-200 text-secondary font-bold text-sm px-7 py-3.5 rounded-[10px] bg-white hover:border-[#0B67D8]/40 hover:text-[#0B67D8] transition-all"
              >
                Neem contact op
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4 lg:pt-6">
              {HeroUsps.map(u => {
                const Icon = ICONMAP[u.icon];
                return (
                  <div key={u.title} className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: B }}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-secondary leading-tight">{u.title}</p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{u.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobiele hero-foto */}
          <div className="lg:hidden">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <img src={heroImg} alt="ALRA LED Solutions" className="w-full h-full object-cover" loading="eager" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ══ */}
      <section className="bg-[#F5F8FC] border-y border-[#E4EAF1]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[#E4EAF1]">
            {TrustBar.map((t, i) => {
              const Icon = ICONMAP[t.icon];
              return (
                <div key={t.title} className={`flex items-center gap-3 py-6 px-3 sm:px-6 ${i >= 2 ? 'border-t lg:border-t-0 border-[#E4EAF1]' : ''}`}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-[#E4EAF1] text-slate-500 shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-secondary leading-tight">{t.title}</p>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{t.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ WIE WIJ ZIJN ══ */}
      <section className="py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-white">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/3] rounded-[18px] overflow-hidden shadow-[0_20px_50px_-20px_rgba(7,27,54,0.25)] border border-[#E4EAF1]">
              <img src={introImg} alt="Medewerkers van ALRA LED Solutions aan het werk" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
            <div className="absolute -bottom-5 right-5 bg-[#07192D] rounded-2xl px-6 py-4 shadow-xl hidden md:flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: B }}>
                <IconShield className="w-5 h-5" />
              </span>
              <div>
                <p className="text-white font-extrabold text-sm leading-none">Professionele kwaliteit</p>
                <p className="text-white/50 text-[11px] mt-1">Geselecteerd voor de praktijk</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Eyebrow>Wie wij zijn</Eyebrow>
            <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,2.9rem)] font-extrabold leading-[1.06] tracking-tight text-secondary">
              Meer dan alleen<br />LED-verlichting
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-500">
              <p>
                Bij ALRA draait het niet alleen om een lamp. Het gaat om verlichting die in de praktijk moet presteren.
                Of het nu gaat om een bedrijfswagen, werkplaats, bouwplaats of industriële omgeving: onze oplossingen
                zijn geselecteerd voor professioneel en intensief gebruik.
              </p>
              <p>
                Wij combineren een breed assortiment met korte lijnen, persoonlijk advies en snelle levering.
                Zo helpen we professionals aan verlichting waarop ze iedere werkdag kunnen vertrouwen.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {values.map((v, i) => (
                <div key={v.title || i} className="rounded-2xl border border-[#E4EAF1] bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base shrink-0" style={{ background: B }}>
                    <span>{v.icon || ['⚡', '🛡️', '💬'][i]}</span>
                  </span>
                  <p className="text-[13px] font-bold text-secondary mt-3 leading-tight">{v.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ WAAROM PROFESSIONALS ══ */}
      <section className="py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-[#F5F8FC]">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center"><Eyebrow>Onze kracht</Eyebrow></div>
            <SectionTitle>Waarom professionals voor ALRA kiezen</SectionTitle>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {WhyCards.map(c => {
              const Icon = ICONMAP[c.icon];
              return (
                <div key={c.num} className="group relative bg-white rounded-2xl border border-[#E4EAF1] p-7 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_-18px_rgba(7,27,54,0.25)]">
                  <span className="absolute top-6 right-6 text-[13px] font-black text-[#0B67D8]/30 group-hover:text-[#0B67D8]/60 transition-colors">{c.num}</span>
                  <span className="w-12 h-12 rounded-xl flex items-center justify-center text-[#0B67D8] bg-[#0B67D8]/10 group-hover:bg-[#0B67D8] group-hover:text-white transition-colors duration-200">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-extrabold text-secondary mt-5">{c.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mt-2">{c.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ TOEPASSINGEN — donker ══ */}
      <section className="py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-[#07192D] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <img src={quoteBg} alt="" aria-hidden="true" className="w-full h-full object-cover" loading="lazy" decoding="async" />
        </div>
        <div className="relative max-w-[1280px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <Eyebrow light>Toepassingen</Eyebrow>
              <SectionTitle light>Verlichting voor elke professionele toepassing</SectionTitle>
              <p className="text-white/55 text-[15px] leading-relaxed mt-4 max-w-xl">
                Ontdek ons assortiment voor uw branche. Betrouwbare LED-oplossingen, geselecteerd voor de praktijk.
              </p>
            </div>
            <Link to={ROUTES.shop} className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-bold shrink-0 group">
              Bekijk alle producten <IconArrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-12">
            {categories.length === 0 && (
              ['Bedrijfswagenverlichting', 'Bouwlichtslangen en toebehoren', 'LED Hefbrugverlichting', 'LED draagbare werkverlichting', 'Veiligheidsverlichting'].map(name => (
                <div key={name} className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
              ))
            )}
            {categories.map(cat => {
              const img = getMediaUrl(catImages[cat.id]) || CAT_FALLBACK[cat.slug] || ALL_FALLBACK;
              return (
                <Link
                  key={cat.id}
                  to={shopWithCategory(cat)}
                  className="group bg-white rounded-2xl overflow-hidden border border-white/10 hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="aspect-[16/11] overflow-hidden bg-slate-100">
                    <img src={img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-300" loading="lazy" decoding="async" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-[14px] font-extrabold text-secondary leading-snug">{cat.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                      {cat.description || 'Functioneel, veilig en duurzaam'}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0B67D8] mt-3">
                      Bekijk <IconArrow className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'top')} />

      {/* ══ GROOTHANDEL — 50/50 ══ */}
      <section className="py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-white">
        <div className="max-w-[1240px] mx-auto">
          <div className="rounded-[24px] overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-[0_30px_70px_-30px_rgba(7,27,54,0.35)]">
            <div className="relative bg-[#07192D] px-8 md:px-12 py-12 md:py-16 flex flex-col justify-center overflow-hidden">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#0B67D8]/20 blur-3xl" />
              <div className="relative space-y-6">
                <Eyebrow light>Groothandel LED-verlichting</Eyebrow>
                <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold leading-[1.06] tracking-tight text-white">
                  Zakelijke LED-verlichting<br />zonder gedoe
                </h2>
                <div className="space-y-3 text-white/60 text-[14px] leading-relaxed">
                  <p>
                    ALRA levert LED-verlichting aan bedrijven en professionals die kwaliteit, betrouwbaarheid
                    en scherpe zakelijke condities zoeken.
                  </p>
                  <p>
                    Van enkele armaturen tot grotere aantallen: wij denken mee over de juiste oplossing voor jouw toepassing.
                    Heb je grotere aantallen nodig of een specifieke vraag? Neem contact met ons op voor persoonlijk advies
                    of een passende zakelijke offerte.
                  </p>
                </div>
                <Link
                  to={ROUTES.contact}
                  className="inline-flex items-center justify-center gap-2 bg-[#0B67D8] text-white font-bold text-sm px-7 py-3.5 rounded-[10px] hover:brightness-110 transition-all shadow-lg shadow-[#0B67D8]/30"
                >
                  Neem contact op <IconArrow className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="relative min-h-[300px] lg:min-h-[480px]">
              <img src={warehouseImg} alt="Magazijn en voorraad van ALRA LED" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:bg-gradient-to-r lg:from-black/30 lg:to-transparent" />
            </div>
          </div>

          {/* Floating trust card */}
          <div className="relative z-10 -mt-8 lg:-mt-10 mx-auto lg:max-w-3xl px-2">
            <div className="bg-white rounded-2xl border border-[#E4EAF1] shadow-[0_20px_50px_-20px_rgba(7,27,54,0.3)] p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E4EAF1]">
              {GroothandelTrust.map(t => {
                const Icon = ICONMAP[t.icon];
                return (
                  <div key={t.title} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[#0B67D8] bg-[#0B67D8]/10 shrink-0">
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-secondary leading-tight">{t.title}</p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{t.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOTOCOLLAGE — merkbeleving ══ */}
      <section className="py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-[#F5F8FC] border-y border-[#E4EAF1]">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4">
          <div className="relative rounded-[18px] overflow-hidden min-h-[320px] lg:min-h-[520px]">
            <img src={storyBig} alt="ALRA LED in de praktijk voor vakmensen" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <p className="text-white font-extrabold text-xl leading-tight">Praktische oplossingen<br />voor echte vakmensen</p>
            </div>
          </div>
          <div className="grid grid-rows-2 gap-4">
            <div className="relative rounded-[18px] overflow-hidden min-h-[200px]">
              <img src={storyA} alt="ALRA LED werklamp" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" style={{ objectPosition: 'center' }} />
            </div>
            <div className="relative rounded-[18px] overflow-hidden min-h-[200px]">
              <img src={storyB} alt="ALRA LED bedrijfswagenverlichting" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ ONZE AANPAK ══ */}
      <section className="py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-white">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center"><Eyebrow>Onze aanpak</Eyebrow></div>
            <SectionTitle>Van vraag naar de juiste verlichting</SectionTitle>
          </div>

          <div className="relative mt-16">
            <div className="hidden lg:block absolute top-[26px] left-[18%] right-[18%] h-px bg-[#E4EAF1]" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {ApproachSteps.map(s => (
                <div key={s.num} className="relative text-center lg:px-2">
                  <span className="relative z-10 inline-flex items-center justify-center w-[52px] h-[52px] rounded-2xl text-white font-extrabold text-base" style={{ background: B, boxShadow: '0 10px 24px rgba(11,103,216,0.35)' }}>
                    {s.num}
                  </span>
                  <h3 className="text-lg font-extrabold text-secondary mt-5 leading-snug">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mt-2 max-w-xs mx-auto">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ BRAND STATEMENT ══ */}
      <section className="relative py-24 lg:py-32 px-5 sm:px-8 lg:px-10 overflow-hidden bg-[#07192D]">
        <img src={quoteBg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-25" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07192D]/80 via-[#07192D]/50 to-[#07192D]/90" />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B67D8]/20 text-[#0B67D8] mb-8">
            <IconQuote className="w-6 h-6" />
          </span>
          <blockquote className="text-[clamp(1.5rem,3vw,2.4rem)] font-extrabold leading-[1.15] text-white tracking-tight">
            “Goede verlichting merk je pas echt wanneer je zonder nadenken door kunt werken.”
          </blockquote>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50 mt-8">Alra Led Solutions</p>
        </div>
      </section>

      {/* ══ AFsluitende CTA ══ */}
      <section className="py-16 lg:py-20 px-5 sm:px-8 lg:px-10 bg-white">
        <div className="max-w-[1240px] mx-auto">
          <div className="rounded-[18px] overflow-hidden border border-[#E4EAF1] bg-[#F5F8FC] grid grid-cols-1 lg:grid-cols-[1fr_auto]">
            <div className="px-8 md:px-12 py-10 md:py-12">
              <h2 className="text-[clamp(1.7rem,3vw,2.5rem)] font-extrabold leading-[1.06] tracking-tight text-secondary">
                De juiste verlichting<br />voor jouw toepassing?
              </h2>
              <p className="text-slate-500 text-[15px] leading-relaxed mt-3 max-w-lg">
                Vertel ons waar je verlichting voor nodig hebt. We denken graag mee over de beste oplossing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-7">
                <Link to={ROUTES.shop} className="inline-flex items-center justify-center gap-2 bg-[#0B67D8] text-white font-bold text-sm px-7 py-3.5 rounded-[10px] hover:brightness-110 transition-all shadow-lg shadow-[#0B67D8]/25">
                  Bekijk producten <IconArrow className="w-4 h-4" />
                </Link>
                <Link to={ROUTES.contact} className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white text-secondary font-bold text-sm px-7 py-3.5 rounded-[10px] hover:border-[#0B67D8]/40 hover:text-[#0B67D8] transition-all">
                  Contact opnemen
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center lg:w-[320px]">
              <div className="w-56 h-56 rounded-xl overflow-hidden rotate-2">
                <img src={ctaImg} alt="LED bedrijfswagenverlichting van ALRA" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <CustomBlocks blocks={blocks.filter(b => (b.mount || 'bottom') === 'bottom')} />

    </div>
  );
};

export default About;