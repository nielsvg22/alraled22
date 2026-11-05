// ─────────────────────────────────────────────────────────
// Centrale interne route-configuratie.
// Gebruik deze constants in plaats van hardcoded paths zodat
// links op de hele site naar dezelfde pagina's verwijzen.
// ─────────────────────────────────────────────────────────

export const ROUTES = {
  home: '/',
  about: '/over-ons',
  shop: '/producten',
  product: (id) => `/product/${id}`,
  contact: '/contact',
  dealers: '/verkooppunten',
  groothandels: '/groothandels',
  blog: '/blog',
  blogPost: (id) => `/blog/${id}`,
  login: '/login',
  register: '/registreren',
  account: '/account',
  checkout: '/checkout',
  orderSuccess: (orderId) => `/bestelling-geplaatst${orderId ? `/${orderId}` : ''}`,
  returns: '/retouren',
  terms: '/algemene-voorwaarden',
  privacy: '/privacy-policy',
  returnsPolicy: '/retourbeleid',
  complaints: '/klachten',
};

// Webshop route met actieve productcategorie (gebruikt door categoriekaarten en menu)
export function shopWithCategory(cat) {
  const slug = cat?.slug || cat?.id || cat;
  return slug ? `${ROUTES.shop}?categorie=${encodeURIComponent(slug)}` : ROUTES.shop;
}

// Categorie → productgroep-pagina (op naam). Geen match: gewoon de shop met die categorie.
const GROUP_PAGE_RULES = [
  [/lichtslang/i, '/lichtslangen'],
  [/hefbrug/i, '/hefbrugverlichting'],
  [/draagbare|werkverlichting/i, '/bouwverlichting'],
  [/bedrijfswagen|automotive/i, '/bedrijfswagenverlichting'],
  [/veilig|verkeer/i, '/veiligheidsverlichting'],
  [/bouw/i, '/bouwverlichting'],
];

export function categoryLink(cat) {
  const name = String(cat?.name || cat?.title || cat?.slug || '');
  const rule = GROUP_PAGE_RULES.find(([re]) => re.test(name));
  if (rule) return rule[1];
  return cat?.slug || cat?.id ? shopWithCategory(cat) : ROUTES.shop;
}

// Weergavenaam in het menu (korter/gebruiksvriendelijker dan de categorienaam in het CRM)
const MENU_LABEL_RULES = [
  [/lichtslang/i, 'Bouwlichtslangen'],
  [/draagbare|werkverlichting/i, 'Bouwlampen'],
  [/hefbrug/i, 'Hefbrugverlichting'],
];
export function categoryLabel(cat) {
  const name = String(cat?.name || cat?.title || '');
  const rule = MENU_LABEL_RULES.find(([re]) => re.test(name));
  return rule ? rule[1] : name;
}

// Volgorde in het menu: bouwlichtslangen, bouwlampen, veiligheid, bedrijfswagen, hefbrug; de rest daarna
const MENU_ORDER = [/lichtslang/i, /draagbare|werkverlichting/i, /veilig|verkeer/i, /bedrijfswagen|automotive/i, /hefbrug/i];
export function sortMenuCategories(list) {
  const rank = (c) => { const i = MENU_ORDER.findIndex(re => re.test(String(c?.name || ''))); return i === -1 ? MENU_ORDER.length : i; };
  return [...(list || [])].sort((a, b) => rank(a) - rank(b));
}

// De vijf productpagina's (menu "Producten" en voettekst): naam + adres
export const PRODUCT_GROUP_LINKS = [
  { label: 'Bouwlichtslangen', to: '/lichtslangen' },
  { label: 'Bouwlampen', to: '/bouwverlichting' },
  { label: 'Veiligheidsverlichting', to: '/veiligheidsverlichting' },
  { label: 'Bedrijfswagenverlichting', to: '/bedrijfswagenverlichting' },
  { label: 'Hefbrugverlichting', to: '/hefbrugverlichting' },
];

export const NAV_LINKS = [
  { to: ROUTES.home, labelKey: 'nav.home' },
  { to: ROUTES.about, labelKey: 'nav.about' },
  { to: ROUTES.groothandels, labelKey: 'nav.groothandels' },
  { to: ROUTES.blog, labelKey: 'nav.blog' },
  { to: ROUTES.contact, labelKey: 'nav.contact' },
];

export const FOOTER_NAV_LINKS = [
  { to: ROUTES.home, label: 'Home' },
  { to: ROUTES.about, label: 'Over ons' },
  { to: ROUTES.groothandels, label: 'Groothandels' },
  { to: ROUTES.shop, label: 'Webshop' },
  { to: ROUTES.contact, label: 'Contact' },
];
