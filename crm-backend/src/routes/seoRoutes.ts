import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { products } from '../db/schema';
import { getContent } from '../db/contentRepo';
import { frontendUrl } from '../lib/siteUrls';

const router = Router();

const STATIC_PATHS = [
  '/', '/over-ons', '/producten', '/contact', '/blog', '/verkooppunten', '/groothandels', '/retouren',
  '/lichtslangen', '/hefbrugverlichting', '/veiligheidsverlichting', '/bouwverlichting', '/bedrijfswagenverlichting',
  '/algemene-voorwaarden', '/privacy-policy', '/retourbeleid', '/klachten',
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Sitemap wordt altijd actueel opgebouwd uit de database; het adres volgt de omgeving (FRONTEND_URL / CORS_ORIGINS)
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const base = frontendUrl(req);
    const urls: { loc: string; lastmod?: string }[] = STATIC_PATHS.map((p) => ({ loc: `${base}${p}` }));

    const rows = await db.select({ id: products.id, updatedAt: products.updatedAt }).from(products);
    for (const r of rows) {
      urls.push({ loc: `${base}/product/${r.id}`, lastmod: r.updatedAt ? new Date(r.updatedAt as any).toISOString().slice(0, 10) : undefined });
    }

    const blocks = (await getContent('page_blocks_blog')) as any;
    if (Array.isArray(blocks)) {
      for (const b of blocks) {
        if (b && b.visible !== false && b.id) urls.push({ loc: `${base}/blog/${b.id}`, lastmod: b.data?.date ? String(b.data.date).slice(0, 10) : undefined });
      }
    }

    const body = urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod && /^\d{4}-\d{2}-\d{2}$/.test(u.lastmod) ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n');
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  } catch (err) {
    console.error('[sitemap]', err);
    res.status(500).type('text/plain').send('Sitemap tijdelijk niet beschikbaar');
  }
});

export default router;
