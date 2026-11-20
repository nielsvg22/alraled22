import { randomUUID } from 'node:crypto';
import { pool } from '../lib/db';
import { getContent, setContent } from './contentRepo';

// Eenmalig: de reviews die tot nu toe op de homepage stonden (CMS-content of de standaardteksten) in de reviewtabel zetten.
const FLAG = 'seed_reviews_v1';
const DEFAULTS = [
  { quote: 'Al jaren klant. Ze willen met je meedenken en hebben kwaliteitsproducten van het A-merk.', author: 'Vaste klant', role: 'Transportbedrijf',
    en: { quote: 'A customer for years. They are happy to think along with you and offer quality A-brand products.', role: 'Transport company' },
    de: { quote: 'Seit Jahren Kunde. Sie denken gerne mit und bieten Qualitätsprodukte von Markenherstellern.', role: 'Transportunternehmen' } },
  { quote: 'Bedrijfswagenverlichting besteld en het geeft ongelofelijk veel licht! Vrijdag besteld, dinsdag al op kantoor.', author: 'Tevreden klant', role: 'Logistiek bedrijf',
    en: { quote: 'Ordered van lighting and it gives an incredible amount of light! Ordered on Friday, at the office by Tuesday.', role: 'Logistics company' },
    de: { quote: 'Nutzfahrzeugbeleuchtung bestellt und sie liefert unglaublich viel Licht! Freitag bestellt, Dienstag schon im Büro.', role: 'Logistikunternehmen' } },
];

export async function seedReviews(): Promise<void> {
  try {
    if (await getContent(FLAG)) return;
    const [rows] = (await pool.query('SELECT COUNT(*) n FROM `Review`')) as any;
    if (Number(rows?.[0]?.n || 0) === 0) {
      const home = (await getContent('home')) as any;
      const fromCms = Array.isArray(home?.testimonials?.items) ? home.testimonials.items.filter((t: any) => t && String(t.quote || '').trim()) : null;
      const list = fromCms && fromCms.length ? fromCms.map((t: any) => ({ quote: t.quote, author: t.author || 'Klant', role: t.role || '', rating: t.rating })) : DEFAULTS;
      let i = 0;
      for (const t of list as any[]) {
        await pool.execute(
          'INSERT INTO `Review` (`id`, `author`, `role`, `roleEn`, `roleDe`, `rating`, `body`, `bodyEn`, `bodyDe`, `published`, `showOnHome`, `sortOrder`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)',
          [randomUUID(), String(t.author).slice(0, 255), t.role || null, t.en?.role || null, t.de?.role || null, Math.max(0, Math.min(5, Number(t.rating ?? 5))), String(t.quote), t.en?.quote || null, t.de?.quote || null, i++],
        );
      }
      console.log(`[seed] ${list.length} reviews toegevoegd`);
    }
    await setContent(FLAG, { done: true, at: new Date().toISOString() });
  } catch (err) {
    console.error('[seed] reviews seeden mislukt:', err);
  }
}
