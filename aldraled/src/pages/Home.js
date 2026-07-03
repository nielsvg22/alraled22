import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Counter from '../components/Counter';
import CustomBlocks from '../components/CustomBlocks';
import LogoCarousel from '../components/LogoCarousel';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getImageSrc } from '../lib/productHelpers';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').trim();

const DEFAULTS = {
  hero: {
    title: "Welkom bij ALRA LED Solutions.",
    titlePrefix: "Verlichting voor",
    subtitle: "ALRA Led Solutions helpt u kiezen voor een duurzame toekomst. Specialist in LED-verlichting voor bedrijfswagens, bouwplaatsen en werkplaatsen.",
    backgroundImage: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=2000",
    primaryButtonText: "Bekijk producten",
    secondaryButtonText: "Over ons",
    typewriterWords: ['bedrijfswagens.', 'bouwplaatsen.', 'werkplaatsen.', 'professionals.'],
  },
  dealersCta: {
    title: 'Waar te koop?',
    subtitle: 'Vind een verkooppunt bij jou in de buurt.',
    buttonText: 'Bekijk verkooppunten',
  },
  introduction: { badge: "Duurzame Toekomst", marqueeText: "LED SPECIALISTS" },
  specializations: [
    { title: "Bedrijfswagenverlichting", desc: "Optimale LED-werkverlichting voor uw bestelwagen, truck of bedrijfsvoertuig. Meer veiligheid, minder verbruik.", image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=1600" },
    { title: "LED Bouwlichtslangen", desc: "Robuuste en krachtige LED-verlichting speciaal ontworpen voor gebruik op de bouwplaats.", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=1600" },
    { title: "LED Hefbrugverlichting", desc: "Perfecte lichtopbrengst onder het voertuig voor een veilige en efficiënte werkplaatsomgeving.", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1600" },
  ],
  stats: [
    { value: 10, label: "Jaar Actief", suffix: "+" },
    { value: 225, label: "Aangesloten Partners", suffix: "+" },
  ],
  introSection: {
    badge: "Over ALRA LED",
    heading: "Professionele LED-oplossingen voor de moderne werkplek",
    description: "Wij zijn specialist in hoogwaardige LED-verlichting voor bedrijfswagens, bouwplaatsen en werkplaatsen. Onze producten worden geleverd met volledige certificering en een servicegerichte aanpak die u ontzorgt.",
    linkText: "Meer over ons",
    deliveryTitle: "Direct leverbaar uit voorraad",
    deliverySubtitle: "Snelle levering in heel Nederland en België",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600",
  },
  highlights: {
    title: "Voor de Groothandel",
    subtitle: "Professionele LED-verlichting voor wederverkopers — direct uit voorraad leverbaar.",
    items: [
      {
        title: "LED Werkverlichting",
        description: "Hoogwaardige LED-werkverlichting voor bedrijfswagens, trucks en bestelwagens. Optimale lichtopbrengst en laag stroomverbruik.",
        features: ["IP67 waterdicht", "3-jaar garantie", "ECE R10 gecertificeerd"],
        image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=1600",
        link: "/producten",
        linkText: "Bekijk assortiment",
      },
      {
        title: "LED Bouwlichtslangen",
        description: "Robuuste LED-verlichting speciaal ontwikkeld voor zware bouwplaatsomstandigheden. Stof- en waterbestendig met IP65-certificering.",
        features: ["IP65 stofdicht", "Schokbestendig", "50.000+ branduren"],
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=1600",
        link: "/producten",
        linkText: "Bekijk assortiment",
      },
      {
        title: "LED Hefbrugverlichting",
        description: "Perfecte lichtopbrengst onder het voertuig voor een veilige en efficiënte werkplaatsomgeving. Eenvoudig te monteren.",
        features: ["Montage in 15 min", "Universele pasvorm", "CAN-bus compatibel"],
        image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1600",
        link: "/producten",
        linkText: "Bekijk assortiment",
      },
    ],
  },
  process: {
    title: "De ontwikkeling van ALRA Led Solutions",
    description: "De kracht van ALRA Led Solutions is oplossingsgericht werken in nauw overleg met de opdrachtgever. Gedreven en vakkundige engineers zijn betrokken bij ontwerp, techniek, duurzaamheid en functionaliteit.",
    buttonText: "Leer onze methode",
    steps: [
      { title: "Idee", description: "We brengen ideeën tot leven. Uw idee wordt de basis van de perfecte verlichtingsoplossing." },
      { title: "Ontwerp", description: "Van eerste schets tot 2D/3D-modellen. Van sample tot eindproduct — stap voor stap uitgewerkt." },
      { title: "Kwaliteit", description: "Uitsluitend LED-producten met de vereiste certificeringen. Kwaliteit en garantie op elk product." },
      { title: "Tevredenheid", description: "Uw mening is gedurende het hele proces van belang. Van eerste contact tot levering." },
    ],
  },
  cta: {
    title: "Ben je benieuwd wat wij voor je kunnen betekenen?",
    subtitle: "Loopt u in het werkveld tegen een probleem aan? Wij komen graag bij u langs om samen tot een oplossing te komen.",
    primaryButton: "Naar de Webshop",
    secondaryButton: "Neem Contact Op",
  },
};

const TRUST_ITEMS = [
  { icon: "🚚", label: "Gratis verzending", sub: "boven €250,-" },
  { icon: "🛡️", label: "1 jaar garantie", sub: "op alle producten" },
  { icon: "✅", label: "CE & RoHS", sub: "gecertificeerd" },
  { icon: "⚡", label: "Snel geleverd", sub: "direct uit voorraad" },
  { icon: "💬", label: "Expert advies", sub: "085-0021 606" },
];

const DEFAULT_SECTION_ORDER = [
  'hero',
  'intro_banner',
  'over_ons',
  'cases',
  'stats',
  'logos',
  'featured',
  'testimonials',
  'process',
  'highlights',
  'cta',
  'dealers_cta',
];

function useTypewriter(words, speed = 80, pause = 2000) {
  const isTest = process.env.NODE_ENV === 'test';
  const [display, setDisplay] = useState(isTest ? (words?.[0] || '') : '');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isTest) return;
    const current = words[wordIdx];
    let delay = deleting ? speed / 2 : speed;
    if (!deleting && charIdx === current.length) delay = pause;
    if (deleting && charIdx === 0) { delay = 400; }

    const timer = setTimeout(() => {
      if (!deleting && charIdx === current.length) {
        setDeleting(true);
      } else if (deleting && charIdx === 0) {
        setDeleting(false);
        setWordIdx(i => (i + 1) % words.length);
      } else {
        setCharIdx(i => i + (deleting ? -1 : 1));
        setDisplay(current.slice(0, charIdx + (deleting ? -1 : 1)));
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, wordIdx, words, speed, pause, isTest]);

  return display;
}

// ── Home Page ─────────────────────────────────────────────
const Home = () => {
  const { i18n } = useTranslation();
  const [content, setContent] = useState(DEFAULTS);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [customBlocks, setCustomBlocks] = useState([]);
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTION_ORDER);

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/home`, { params: { lang } })
      .then(res => setContent({ ...DEFAULTS, ...res.data }))
      .catch(() => {});
    axios.get(`${API_URL}/api/products`)
      .then(res => setFeaturedProducts(res.data.slice(0, 4)))
      .catch(() => {});
    axios.get(`${API_URL}/api/content/page_blocks_home`, { params: { lang } })
      .then(res => setCustomBlocks(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
    axios.get(`${API_URL}/api/content/layout_home_sections`, { params: { lang } })
      .then(res => setSectionOrder(Array.isArray(res.data) ? res.data : DEFAULT_SECTION_ORDER))
      .catch(() => {});
  }, [i18n.resolvedLanguage, i18n.language]);

  const { hero, introduction: intro, specializations, stats, process, cta, dealersCta = DEFAULTS.dealersCta, introSection: is = DEFAULTS.introSection, highlights = DEFAULTS.highlights } = content;
  const typeword = useTypewriter(hero.typewriterWords || []);

  const fixed = DEFAULT_SECTION_ORDER;
  const fixedSet = new Set(fixed);
  const blockMap = new Map(customBlocks.map((b) => [b.id, b]));
  const raw = Array.isArray(sectionOrder) ? sectionOrder : fixed;
  const cleaned = raw
    .filter((id) => typeof id === 'string')
    .filter((id) => fixedSet.has(id) || (id.startsWith('block:') && blockMap.has(id.slice('block:'.length))));
  const withMissingFixed = [...cleaned, ...fixed.filter((id) => !cleaned.includes(id))];
  const normalizedOrder = [...withMissingFixed];
  customBlocks.forEach((b) => {
    const key = `block:${b.id}`;
    if (!normalizedOrder.includes(key)) normalizedOrder.push(key);
  });

  const renderSection = (id) => {
    if (id === 'hero') {
      return (
        <section className="relative min-h-[75vh] flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0">
            <img src={hero.backgroundImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/60 to-secondary/10" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pb-20 pt-32 w-full">
            <div className="max-w-3xl space-y-6">
              <span className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                {intro.badge}
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                <span className="block">{hero.titlePrefix || 'Verlichting voor'}</span>
                <span className="text-primary flex items-center gap-1" style={{ minHeight: '1.2em' }}>
                  <span style={{ display: 'inline-block', minWidth: '14ch' }}>{typeword}</span>
                  <span className="inline-block w-0.5 h-[0.8em] bg-primary align-middle animate-pulse flex-shrink-0" />
                </span>
              </h1>

              <p className="text-white/70 text-base md:text-lg max-w-xl leading-relaxed font-light">
                {hero.subtitle}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/producten" className="bg-primary text-white px-7 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30">
                  {hero.primaryButtonText}
                </Link>
                <Link to="/over-ons" className="bg-white/10 backdrop-blur border border-white/20 text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-white/20 transition-all">
                  {hero.secondaryButtonText}
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-10 flex flex-col items-center gap-1.5 text-white/30">
            <span className="text-[10px] font-bold uppercase tracking-widest rotate-90 origin-center translate-y-4">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        </section>
      );
    }

    if (id === 'intro_banner') {
      return (
        <>
          <div className="bg-secondary border-t border-white/5">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {TRUST_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-white/80">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-white leading-none">{item.label}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{item.sub}</p>
                    </div>
                    {i < TRUST_ITEMS.length - 1 && <div className="hidden lg:block w-px h-6 bg-white/10 ml-2.5" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-primary overflow-hidden py-3">
            <div className="flex whitespace-nowrap animate-marquee">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-center gap-6 px-6">
                  <span className="text-white/50 text-sm font-black italic uppercase tracking-widest">{intro.marqueeText}</span>
                  <span className="w-1 h-1 bg-white rounded-full opacity-60" />
                  <span className="text-white text-sm font-black italic uppercase tracking-widest">{intro.badge}</span>
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    if (id === 'over_ons') {
      return (
        <section className="py-20 md:py-28 px-6 md:px-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div className="space-y-6 relative z-10">
                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">{is.badge}</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-secondary leading-[1.1] tracking-tight">
                  {is.heading}
                </h2>
                <div className="w-12 h-1 bg-primary rounded-full" />
                <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-lg">
                  {is.description}
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-secondary">{is.deliveryTitle}</p>
                    <p className="text-xs text-gray-400">{is.deliverySubtitle}</p>
                  </div>
                </div>
                <Link to="/over-ons" className="inline-flex items-center gap-3 text-secondary font-bold text-sm group">
                  <span className="border-b-2 border-secondary pb-0.5 group-hover:text-primary group-hover:border-primary transition-colors">{is.linkText}</span>
                  <span className="w-8 h-8 rounded-full bg-secondary group-hover:bg-primary flex items-center justify-center text-white text-xs transition-colors">→</span>
                </Link>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl blur-2xl" />
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={is.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600"}
                    alt={is.heading}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-5 py-3 border border-gray-100 hidden md:block">
                  <p className="text-2xl font-black text-primary">10+</p>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Jaar ervaring</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (id === 'stats') {
      return (
        <section className="pb-20 px-6 md:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <p className="text-4xl font-black text-primary leading-none">
                    <Counter end={Number(stat.value)} suffix={stat.suffix || ''} />
                  </p>
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider mt-2">{stat.label}</p>
                </div>
              ))}
              <div className="col-span-2 bg-secondary rounded-2xl p-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-xl shrink-0">⚡</div>
                <div>
                  <p className="text-white font-bold text-sm">{is.deliveryTitle}</p>
                  <p className="text-white/50 text-xs mt-0.5">{is.deliverySubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (id === 'cases') {
      return (
        <section className="py-16 px-6 md:px-10 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Onze specialisaties</p>
                <h2 className="text-3xl font-black text-secondary">Producten &amp; Cases</h2>
              </div>
              <Link to="/producten" className="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest hidden md:flex items-center gap-1">
                Alle producten <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {specializations.map((cat, idx) => (
                <Link to="/producten" key={idx} className="group relative overflow-hidden rounded-2xl aspect-[4/3] block bg-gray-200">
                  <img src={cat.image} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-white font-black text-lg leading-tight">{cat.title}</h3>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">{cat.desc}</p>
                    <span className="inline-flex items-center gap-1.5 mt-3 text-primary text-xs font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
                      Bekijk <span>→</span>
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/10 backdrop-blur border border-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (id === 'logos') {
      return <LogoCarousel />;
    }

    if (id === 'featured') {
      if (featuredProducts.length === 0) return null;
      return (
        <section className="py-16 px-6 md:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Nieuw in de shop</p>
                <h2 className="text-3xl font-black text-secondary">Uitgelichte Producten</h2>
              </div>
              <Link to="/producten" className="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest hidden md:flex items-center gap-1">
                Alle producten <span>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map(product => (
                <Link key={product.id} to={`/product/${product.id}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-3">
                    <img
                      src={getImageSrc(product, 'https://via.placeholder.com/400')}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/50 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-primary px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity scale-95 group-hover:scale-100">
                        Bekijk product
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-secondary group-hover:text-primary transition-colors truncate">{product.name}</h3>
                  <p className="text-sm font-black text-secondary mt-0.5">€{product.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (id === 'dealers_cta') {
      return (
        <section className="py-10 px-6 md:px-10 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="bg-secondary rounded-3xl px-8 py-10 md:px-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{dealersCta.title}</h2>
                <p className="text-white/60 text-sm max-w-xl">{dealersCta.subtitle}</p>
              </div>
              <Link
                to="/verkooppunten"
                className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 rounded-full font-black text-sm hover:brightness-110 transition-all shrink-0"
              >
                {dealersCta.buttonText}
              </Link>
            </div>
          </div>
        </section>
      );
    }

    if (id === 'testimonials') {
      return (
        <section className="py-12 px-6 md:px-10 bg-white">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Wat onze klanten zeggen</p>
            <h2 className="text-2xl font-black text-secondary mb-8">Ervaringen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { quote: "Al jaren klant. Ze willen met je meedenken en hebben kwaliteitsproducten van het A-merk.", author: "Vaste klant", role: "Transportbedrijf" },
                { quote: "Bedrijfswagenverlichting besteld en het geeft ongelofelijk veel licht! Vrijdag besteld, dinsdag al op kantoor.", author: "Tevreden klant", role: "Logistiek bedrijf" },
              ].map(({ quote, author, role }, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-primary text-sm">★</span>)}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">"{quote}"</p>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-black">
                      {author[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-secondary">{author}</p>
                      <p className="text-[10px] text-gray-400">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (id === 'process') {
      return (
        <section className="py-16 px-6 md:px-10 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div className="md:sticky md:top-24 space-y-5">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Onze aanpak</p>
                <h2 className="text-3xl font-black text-secondary leading-tight">{process.title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{process.description}</p>
                <Link to="/over-ons" className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-primary transition-all">
                  {process.buttonText}
                </Link>
              </div>
              <div className="space-y-0">
                {(process.steps || []).map((step, idx) => (
                  <div key={idx} className="flex gap-5 pb-8 border-b border-gray-200 last:border-0 last:pb-0 pt-8 first:pt-0 group">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-secondary">{step.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{step.description || step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (id === 'highlights') {
      const hItems = highlights.items || [];
      if (hItems.length === 0) return null;
      return (
        <section className="py-24 md:py-32 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-5">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-[0.3em]">
                <span className="w-8 h-px bg-primary" />
                Groothandel
                <span className="w-8 h-px bg-primary" />
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.05] tracking-tight">{highlights.title}</h2>
              <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">{highlights.subtitle}</p>
            </div>
            <div className="space-y-0">
              {hItems.map((item, idx) => (
                <div key={idx} className={`grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch border-t border-gray-100 ${idx === hItems.length - 1 ? 'border-b' : ''}`}>
                  <div className={`relative overflow-hidden group ${idx % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="aspect-[4/3] lg:aspect-auto lg:h-full">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-secondary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className={`flex flex-col justify-center px-8 py-12 lg:px-16 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">Productgroep</span>
                    <h3 className="text-3xl md:text-4xl font-black text-secondary leading-tight mb-4">{item.title}</h3>
                    <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6 max-w-md">{item.description}</p>
                    {item.features && item.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-8">
                        {item.features.map((feat, fi) => (
                          <span key={fi} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-secondary text-[11px] font-bold px-3 py-1.5 rounded-full">
                            <span className="w-1 h-1 bg-primary rounded-full" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.link && (
                      <Link to={item.link} className="group inline-flex items-center gap-3 text-primary font-bold text-sm">
                        <span className="border-b-2 border-primary/30 pb-0.5 group-hover:border-primary transition-colors">{item.linkText || 'Bekijk producten'}</span>
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs group-hover:bg-primary group-hover:text-white transition-all duration-300">&rarr;</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (id === 'cta') {
      return (
        <section className="py-16 px-6 md:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="relative bg-secondary rounded-3xl overflow-hidden px-8 md:px-16 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
              </div>
              <div className="relative space-y-2 text-center md:text-left">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{cta.title}</h2>
                <p className="text-white/50 text-sm">{cta.subtitle}</p>
              </div>
              <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
                <Link to="/producten" className="bg-primary text-white px-7 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30 whitespace-nowrap">
                  {cta.primaryButton}
                </Link>
                <Link to="/contact" className="bg-white/10 border border-white/20 text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-white/20 transition-all whitespace-nowrap">
                  {cta.secondaryButton}
                </Link>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (id.startsWith('block:')) {
      const blockId = id.slice('block:'.length);
      const block = blockMap.get(blockId);
      if (!block || block.visible === false) return null;
      return <CustomBlocks blocks={[block]} />;
    }

    return null;
  };

  return (
    <div className="bg-white">
      {normalizedOrder.map((id) => (
        <React.Fragment key={id}>
          {renderSection(id)}
        </React.Fragment>
      ))}

    </div>
  );
};

export default Home;
