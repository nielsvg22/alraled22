import { pool } from '../lib/db';
import { getContent, setContent } from './contentRepo';

// Eenmalig: URL-naam en SEO-titel per product (lijst aangeleverd door Fons). Alleen producten zonder eigen URL-naam;
// bestaande, in het CRM ingevulde waarden worden nooit overschreven. Koppeling op de huidige productnaam.
const FLAG = 'seed_product_seo_v1';
const L: [string, string, string][] = [
  ['led bouwlichtslang verlichting 10 meter', 'led-bouwlichtslang-10-meter', 'LED-bouwlichtslang 10 meter'],
  ['led bouwlichtslang verlichting 20 meter', 'led-bouwlichtslang-20-meter', 'LED-bouwlichtslang 20 meter'],
  ['led bouwlichtslang verlichting 25 meter (koppelbaar tot max 75 meter)', 'led-bouwlichtslang-25-meter-koppelbaar', 'LED-bouwlichtslang 25 meter – koppelbaar'],
  ['led bouwlichtslang verlichting 45 meter', 'led-bouwlichtslang-45-meter', 'LED-bouwlichtslang 45 meter'],
  ['led bouwlichtslang verlichting 75 meter', 'led-bouwlichtslang-75-meter', 'LED-bouwlichtslang 75 meter'],
  ['bouwlichtslang stekker set', 'stekkerset-bouwlichtslang', 'Stekkerset voor bouwlichtslang'],
  ['rvs clips set van 10 stuks', 'rvs-clips-bouwlichtslang-10-stuks', 'RVS-bevestigingsclips voor bouwlichtslang – 10 stuks'],
  ['led bedrijfswagenverlichting 50cm hoek', 'led-bedrijfswagenverlichting-50-cm-hoekprofiel', 'LED-bedrijfswagenverlichting 50 cm – hoekprofiel'],
  ['led bedrijfswagenverlichting 100cm hoek', 'led-bedrijfswagenverlichting-100-cm-hoekprofiel', 'LED-bedrijfswagenverlichting 100 cm – hoekprofiel'],
  ['led bedrijfswagenverlichting 200cm hoek', 'led-bedrijfswagenverlichting-200-cm-hoekprofiel', 'LED-bedrijfswagenverlichting 200 cm – hoekprofiel'],
  ['led bedrijfswagenverlichting 100cm plat', 'led-bedrijfswagenverlichting-100-cm-platprofiel', 'LED-bedrijfswagenverlichting 100 cm – platprofiel'],
  ['led bedrijfswagenverlichting 200cm plat', 'led-bedrijfswagenverlichting-200-cm-platprofiel', 'LED-bedrijfswagenverlichting 200 cm – platprofiel'],
  ['cob auto binnenverlichting', 'auto-interieurverlichting', 'Auto-interieurverlichting'],
  ['led hefbrugverlichting', 'led-hefbrugverlichting', 'LED-hefbrugverlichting'],
  ['verstelbare werklamp met rood kruis en diverse verlichtingsopties wit', 'verstelbare-led-werklamp', 'Verstelbare LED-werklamp'],
  ['alra 360° led-werklamp met klem', '360-graden-led-werklamp-met-klem', '360° LED-werklamp met klem'],
  ['led bouwlamp op statief 2x 50 watt', 'led-bouwlamp-op-statief-2x50-watt', 'LED-bouwlamp op statief – 2 × 50 watt'],
  ['flashguard cone single usb-c', 'flashguard-cone-single-usb-c', 'Flashguard Cone single USB-C'],
  ['flashguard cone 1.3 amber (4 stuks)', 'flashguard-cone-1-3-amber-4-stuks', 'Flashguard Cone 1.3 Amber – 4 stuks'],
  ['flashguard cone 1.3 amber (8 stuks)', 'flashguard-cone-1-3-amber-8-stuks', 'Flashguard Cone 1.3 Amber – 8 stuks'],
  ['flashguard cone 1.3 rgb (4 stuks)', 'flashguard-cone-1-3-rgb-4-stuks', 'Flashguard Cone 1.3 RGB – 4 stuks'],
  ['flashguard cone rgb-amber 1.3 (6 stuks)', 'flashguard-cone-1-3-rgb-amber-6-stuks', 'Flashguard Cone 1.3 RGB-Amber – 6 stuks'],
  ['360 graden verkeersveiligheid verlichting', '360-graden-verkeersveiligheidsverlichting-6-stuks', '360° verkeersveiligheidsverlichting – 6 stuks'],
  ['alra sterrenhemel projector', 'alra-sterrenhemelprojector', 'ALRA sterrenhemelprojector'],
];

export async function seedProductSeo(): Promise<void> {
  try {
    if (await getContent(FLAG)) return;
    const [rows] = (await pool.query('SELECT id, name, slug, seoTitle FROM `Product`')) as any;
    let done = 0; const missing: string[] = [];
    for (const [name, slug, title] of L) {
      const p = (rows as any[]).find((r) => String(r.name || '').trim().toLowerCase() === name);
      if (!p) { missing.push(name); continue; }
      if (p.slug) continue;
      try {
        await pool.execute('UPDATE `Product` SET `slug` = ?, `seoTitle` = COALESCE(`seoTitle`, ?) WHERE `id` = ? AND `slug` IS NULL', [slug, title, p.id]);
        done++;
      } catch (e: any) { console.error('[seed] product-seo overgeslagen:', slug, e?.message); }
    }
    await setContent(FLAG, { done: true, updated: done, notFound: missing, at: new Date().toISOString() });
    console.log(`[seed] product-SEO: ${done} producten bijgewerkt${missing.length ? `, niet gevonden: ${missing.join('; ')}` : ''}`);
  } catch (err) {
    console.error('[seed] product-SEO mislukt:', err);
  }
}
