import { getContent, setContent } from './contentRepo';
import { pool } from '../lib/db';
import { BLOGS_EXTRA } from '../seed/blogsExtra';

// Voegt de extra blogs eenmalig toe aan het CMS (page_blocks_blog). Bestaande artikelen blijven ongemoeid, dubbele id's worden overgeslagen
// en na de eerste keer wordt niets meer aangeraakt (artikelen die je daarna verwijdert of aanpast blijven zoals jij ze zet).
const FLAG = 'seed_blogs_extra_v1';

// CMS-teksten kunnen groter worden dan 64 KB (TEXT): zorg dat de kolom LONGTEXT is voordat we schrijven (veilig herhaalbaar)
async function ensureLongText(): Promise<void> {
  const [rows] = (await pool.query("SELECT DATA_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SiteContent' AND COLUMN_NAME = 'value'")) as any;
  const type = String(rows?.[0]?.t || '').toLowerCase();
  if (type && type !== 'longtext') await pool.query('ALTER TABLE `SiteContent` MODIFY `value` LONGTEXT NOT NULL');
}

export async function seedExtraBlogs(): Promise<void> {
  try {
    if (await getContent(FLAG)) return;
    await ensureLongText();
    const current = (await getContent('page_blocks_blog')) as any;
    const list: any[] = Array.isArray(current) ? current : [];
    const have = new Set(list.map((b) => b && b.id));
    const add = BLOGS_EXTRA.filter((b) => !have.has(b.id));
    if (add.length) await setContent('page_blocks_blog', [...list, ...add] as any);
    await setContent(FLAG, { done: true, added: add.length, at: new Date().toISOString() });
    console.log(`[seed] ${add.length} extra blogs toegevoegd`);
  } catch (err) {
    console.error('[seed] blogs seeden mislukt:', err);
  }
}
