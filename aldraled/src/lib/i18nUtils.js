const LANGUAGE_TO_LOCALE = {
  nl: 'nl-NL',
  en: 'en-GB',
  de: 'de-DE',
};

const CATEGORY_TRANSLATION_KEYS = {
  Alle: 'products.categories.all',
  All: 'products.categories.all',
  Allemaal: 'products.categories.all',
  Bedrijfswagens: 'products.categories.vans',
  Bedrijfswagenverlichting: 'products.categories.vans',
  'Commercial vehicles': 'products.categories.vans',
  Nutzfahrzeuge: 'products.categories.vans',
  Bouwverlichting: 'products.categories.construction',
  'LED Bouwlichtslangen': 'products.categories.construction',
  Construction: 'products.categories.construction',
  Baustellenbeleuchtung: 'products.categories.construction',
  Werkplaats: 'products.categories.workshop',
  'LED Hefbrugverlichting': 'products.categories.workshop',
  Workshop: 'products.categories.workshop',
  Werkstatt: 'products.categories.workshop',
  Accessoires: 'products.categories.accessories',
  Accessories: 'products.categories.accessories',
  Zubehor: 'products.categories.accessories',
  'Zubehor': 'products.categories.accessories',
};

export function getLanguageCode(i18n) {
  return (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
}

export function getLocaleForLanguage(i18n) {
  return LANGUAGE_TO_LOCALE[getLanguageCode(i18n)] || LANGUAGE_TO_LOCALE.nl;
}

export function formatCurrency(i18n, amount) {
  const numericAmount = Number(amount || 0);

  return new Intl.NumberFormat(getLocaleForLanguage(i18n), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

export function translateCategory(category, t) {
  if (!category) return '';

  const translationKey = CATEGORY_TRANSLATION_KEYS[category];
  return translationKey ? t(translationKey) : category;
}
