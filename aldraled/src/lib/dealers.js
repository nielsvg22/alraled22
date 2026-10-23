// ─────────────────────────────────────────────────────────
// Standaard-verkooppunten (groothandels / dealers).
//
// Deze lijst fungeert als betrouwbare basis-set op de "Waar te
// koop"-pagina. Zodra de API (/api/content/dealers) locaties
// teruggeeft worden die hieraan toegevoegd (gedupliceerd wordt
// vermeden op naam + adres + postcode). Zo blijft de pagina schaalbaar:
// nieuwe vestigingen toevoegen kan in deze lijst én via de CRM.
// ─────────────────────────────────────────────────────────

import { MASTERMATE_DEALERS } from '../data/mastermateDealers.js';

// AIC Visser - 3 vestigingen (bestaande data geverifieerd en geactualiseerd)
const AIC_VISSER_DEALERS = [
  {
    id: 'aic-visser-harderwijk',
    name: 'AIC Visser Harderwijk',
    brand: 'AIC Visser',
    address: 'Industrieweg 19',
    city: 'Harderwijk',
    postalCode: '3846 BB',
    lat: 52.3585298,
    lon: 5.6412181,
    phone: '088 13 43 600',
    website: 'https://www.aic.nl',
  },
  {
    id: 'aic-visser-assen',
    name: 'AIC Visser Assen',
    brand: 'AIC Visser',
    address: 'Burgemeester Grollemanweg 12A',
    city: 'Assen',
    postalCode: '9405 TN',
    lat: 52.9626205,
    lon: 6.5506589,
    phone: '088 13 43 600',
    website: 'https://www.aic.nl',
  },
  {
    id: 'aic-visser-veghel',
    name: 'AIC Visser Veghel',
    brand: 'AIC Visser',
    address: 'De Amert 140',
    city: 'Veghel',
    postalCode: '5462 GH',
    lat: 51.6239598,
    lon: 5.5171358,
    phone: '088 13 43 600',
    website: 'https://www.aic.nl',
  },
];

// RECO Bouwplaatsbeveiliging - 3 vestigingen (bron: reco.eu/nl/contact)
const RECO_DEALERS = [
  {
    id: 'reco-koudekerk',
    name: 'RECO Koudekerk aan den Rijn (hoofdkantoor)',
    brand: 'RECO',
    address: 'Hoogewaard 187',
    city: 'Koudekerk aan den Rijn',
    postalCode: '2396 AP',
    lat: 52.132768,
    lon: 4.619438,
    phone: '',
    website: 'https://reco.eu',
  },
  {
    id: 'reco-diemen',
    name: 'RECO Diemen',
    brand: 'RECO',
    address: 'Stammerkamp 19',
    city: 'Diemen',
    postalCode: '1112 VE',
    lat: 52.330261,
    lon: 4.986486,
    phone: '',
    website: 'https://reco.eu',
  },
  {
    id: 'reco-andelst',
    name: 'RECO Andelst',
    brand: 'RECO',
    address: 'Geurdeland 8',
    city: 'Andelst',
    postalCode: '6673 DR',
    lat: 51.914915,
    lon: 5.709688,
    phone: '',
    website: 'https://reco.eu',
  },
];

// Hoegen Elektro & Diesel Parts - Apeldoorn
const HOEGEN_DEALERS = [
  {
    id: 'hoegen-apeldoorn',
    name: 'Hoegen Elektro & Diesel Parts',
    brand: 'Hoegen',
    address: 'Sleutelbloemstraat 5A',
    city: 'Apeldoorn',
    postalCode: '7322 AJ',
    lat: 52.223859,
    lon: 5.975015,
    phone: '',
    website: 'https://hoegenelektro.nl',
  },
];

// Combineer alle standaard dealers
export const DEFAULT_DEALERS = [
  ...AIC_VISSER_DEALERS,
  ...MASTERMATE_DEALERS,
  ...RECO_DEALERS,
  ...HOEGEN_DEALERS,
];

export function buildDealerAddress(d) {
  const parts = [d.address, d.postalCode, d.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : d.address || d.city || '';
}