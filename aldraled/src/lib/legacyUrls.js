// Oude WordPress-adressen (alra-led.com) -> huidige pagina's. Zo blijven oude Google-resultaten en links werken.
export const LEGACY_PAGES = {
  '/webshop': '/producten',
  '/winkelwagen': '/checkout',
  '/afrekenen': '/checkout',
  '/mijn-account': '/account',
  '/automotive': '/bedrijfswagenverlichting',
  '/led-hefbrugverlichting': '/hefbrugverlichting',
  '/led-bouwlichtslangen': '/lichtslangen',
  '/technische-groothandels': '/groothandels',
  '/alra-led': '/over-ons',
  '/terugbetaalde-retourneringen': '/retourbeleid',
  '/klachten-en-retouren': '/klachten',
  '/sample-page': '/',
  '/hello-world': '/blog',
};

const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Oude product-slugs die niet vanzelf uit de productnaam volgen: sleutelwoord uit de huidige productnaam
const ALIASES = {
  'verkeersveiligheidsverlichting': 'verkeersveiligheid',
  'auto-interieurverlichting': 'binnenverlichting',
  't-kabel': 'hefbrugverlichting',
  'stekkerset': 'stekker set',
  'clips': 'clips',
  'flashguard-cone-1-3-4-stuks': 'amber (4 stuks)',
  'werklamp': 'verstelbare werklamp',
  'projector': 'projector',
};

export function resolveLegacyProduct(slug, products) {
  const list = Array.isArray(products) ? products : [];
  const s = slugify(slug);
  const exact = list.find((p) => slugify(p.name) === s);
  if (exact) return exact;
  const alias = ALIASES[s];
  if (alias) {
    const a = list.find((p) => String(p.name).toLowerCase().includes(alias));
    if (a) return a;
  }
  // Beste overlap van woorden (cijfers zoals "45meter" tellen als "45" + "meter")
  const tokens = (x) => slugify(x).replace(/(\d)([a-z])/g, '$1-$2').split('-').filter(Boolean);
  const want = tokens(slug);
  let best = null;
  let bestScore = 0;
  list.forEach((p) => {
    const have = new Set(tokens(p.name));
    const score = want.filter((w) => have.has(w)).length / (want.length || 1);
    if (score > bestScore) { best = p; bestScore = score; }
  });
  return bestScore >= 0.75 ? best : null;
}
