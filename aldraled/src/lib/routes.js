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

export const NAV_LINKS = [
  { to: ROUTES.home, labelKey: 'nav.home' },
  { to: ROUTES.about, labelKey: 'nav.about' },
  { to: ROUTES.blog, labelKey: 'nav.blog' },
  { to: ROUTES.contact, labelKey: 'nav.contact' },
];

export const FOOTER_NAV_LINKS = [
  { to: ROUTES.home, label: 'Home' },
  { to: ROUTES.about, label: 'Over ons' },
  { to: ROUTES.shop, label: 'Webshop' },
  { to: ROUTES.contact, label: 'Contact' },
];
