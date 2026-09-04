// ─────────────────────────────────────────────────────────
// Standaard-verkooppunten (groothandels / dealers).
//
// Deze lijst fungeert als betrouwbare basis-set op de "Waar te
// koop"-pagina. Zodra de API (/api/content/dealers) locaties
// teruggeeft worden die hieraan toegevoegd (gedupliceerd wordt
// vermeden op naam + adres). Zo blijft de pagina schaalbaar:
// nieuwe vestigingen toevoegen kan in deze lijst én via de CRM.
// ─────────────────────────────────────────────────────────

export const DEFAULT_DEALERS = [
  {
    id: 'aic-harderwijk',
    name: 'AIC Visser',
    brand: 'AIC',
    address: 'Industrieweg 19',
    city: 'Harderwijk',
    postalCode: '3846 BB',
    lat: 52.3585298,
    lon: 5.6412181,
    phone: '088 13 43 600',
    website: 'https://www.aic.nl',
  },
  {
    id: 'aic-assen',
    name: 'AIC Visser',
    brand: 'AIC',
    address: 'Burgemeester Grollemanweg 12a',
    city: 'Assen',
    postalCode: '9405 TN',
    lat: 52.9626205,
    lon: 6.5506589,
    phone: '088 13 43 600',
    website: 'https://www.aic.nl',
  },
  {
    id: 'aic-veghel',
    name: 'AIC Visser',
    brand: 'AIC',
    address: 'De Amert 140',
    city: 'Veghel',
    postalCode: '5462 GH',
    lat: 51.6239598,
    lon: 5.5171358,
    phone: '088 13 43 600',
    website: 'https://www.aic.nl',
  },
  {
    id: 'mastermate-apeldoorn',
    name: 'Mastermate',
    brand: 'Mastermate',
    address: 'Paramariboweg 99',
    city: 'Apeldoorn',
    postalCode: '7333 PA',
    lat: 52.1792489,
    lon: 5.9782758,
    phone: '085 - 00 13 300',
    website: 'https://www.mastermate.nl',
  },
];

export function buildDealerAddress(d) {
  const parts = [d.address, d.postalCode, d.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : d.address || d.city || '';
}
