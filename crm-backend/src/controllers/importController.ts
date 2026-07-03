import { Request, Response } from 'express';
import axios from 'axios';
import * as productsRepo from '../db/productsRepo';

const WP_BASE = process.env.WP_BASE || 'https://alra-led.com';
const STOCK_DEFAULT = 999;

function decodeEntities(text: string): string {
  return text.replace(/&euro;/g, '€').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

function parsePrice(text: string): number | null {
  const decoded = decodeEntities(text);
  const m = decoded.match(/€\s*([0-9]+[.,][0-9]+)/);
  if (!m) return null;
  const val = m[1];
  if (!val) return null;
  return parseFloat(val.replace(',', '.'));
}

function extractBetween(text: string, start: string, end: string): string {
  const s = text.indexOf(start);
  if (s === -1) return '';
  const from = s + start.length;
  const e = text.indexOf(end, from);
  return e === -1 ? text.slice(from) : text.slice(from, e);
}

function parseSpecsFromHtml(html: string): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = [];
  const re = /<(?:strong|b)>([^<]+)<\/(?:strong|b)>:\s*([^<\n]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const label = (m[1] || '').trim();
    const rawVal = (m[2] || '').trim();
    if (!label || !rawVal) continue;
    let value = rawVal;
    const rest = html.slice(m.index + m[0].length, html.indexOf('<', m.index + m[0].length));
    if (rest && !rest.includes('<')) {
      const extra = rest.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('<'))[0];
      if (extra) value += ' ' + extra;
    }
    specs.push({ label, value });
  }
  return specs;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&euro;/g, '€')
    .replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function parseDescription(html: string): string {
  const desc = extractBetween(html, 'id="tab-description"', '</div>') || html;
  return cleanHtml(desc);
}

function removeSizeFromUrl(url: string): string {
  return url.replace(/-\d+x\d+(?=\.\w+$)/, '');
}

function extractImages(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const mainRe = /<img[^>]+src="([^"]+)"[^>]*class="[^"]*wp-post-image[^"]*"/i;
  const mainM = mainRe.exec(html);
  if (mainM && mainM[1]) {
    const url = removeSizeFromUrl(mainM[1]);
    if (!seen.has(url)) { seen.add(url); urls.push(url); }
  }

  const galRe = /<a[^>]+href="([^"]+)"[^>]*>\s*<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = galRe.exec(html)) !== null) {
    if (!m[1]) continue;
    const url = removeSizeFromUrl(m[1]);
    if (!seen.has(url)) { seen.add(url); urls.push(url); }
  }

  const thumbRe = /<img[^>]+src="([^"]+)"[^>]*class="[^"]*attachment-woocommerce_thumbnail[^"]*"/gi;
  while ((m = thumbRe.exec(html)) !== null) {
    if (!m[1]) continue;
    const url = removeSizeFromUrl(m[1]);
    if (!seen.has(url)) { seen.add(url); urls.push(url); }
  }

  return urls;
}

function extractCategory(html: string): string {
  const re = /<span[^>]*class="[^"]*posted_in[^"]*"[^>]*>.*?<a[^>]+href="[^"]*product-categorie\/([^"/]+)/i;
  const m = re.exec(html);
  if (!m || !m[1]) return '';
  return m[1].replace(/-/g, ' ');
}

async function fetchHtml(url: string): Promise<string> {
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ALRA-Import-Script/1.0)' },
    timeout: 15000,
  });
  return res.data;
}

async function scrapeProduct(url: string) {
  const html = await fetchHtml(url);

  const nameM = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([^<]+)<\/h1>/i)
    || html.match(/<title>([^<]+)\s*[–-].*?<\/title>/i);
  const name = nameM ? (nameM[1] || '').trim() : '';
  if (!name) return { error: 'title_not_found' };

  const priceSection = /<p[^>]*class="[^"]*price[^"]*"[^>]*>(.*?)<\/p>/i.exec(html);
  if (!priceSection) return { error: 'price_section_not_found' };
  const priceRaw = priceSection[1] || '';
  if (!priceRaw) return { error: 'price_section_empty' };
  const price = parsePrice(priceRaw);
  if (!price) return { error: 'price_parse_failed', raw: priceRaw };

  const specList = parseSpecsFromHtml(html);
  const specs = specList.length > 0 ? JSON.stringify(specList) : '';
  const imageUrls = extractImages(html);
  const category = extractCategory(html);

  return {
    name,
    price,
    description: parseDescription(html),
    specs,
    imageUrls,
    category,
  };
}

async function scrapeAllProductUrls(): Promise<string[]> {
  const urls: string[] = [];
  const seen = new Set<string>();

  const pages = [
    `${WP_BASE}/webshop/`,
    ...['bedrijfswagen-verlichting', 'bouwlichtslangen-en-toebehoren', 'hefbrugverlichting',
      'led-draagbare-werkverlichting-en-overige', 'led-verkeersveiligheid-verlichting',
      'projectoren', 'veiligheidsverlichting'].map(s => `${WP_BASE}/product-categorie/${s}/`),
  ];

  for (const pageUrl of pages) {
    try {
      const html = await fetchHtml(pageUrl);
      const linkRe = /<a[^>]+href="([^"]+\/product\/[^"]+)"[^>]*>/gi;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(html)) !== null) {
        const href = m[1];
        if (!href) continue;
        const noQuery = href.split('?')[0];
        if (!noQuery) continue;
        const noHash = noQuery.split('#')[0];
        if (!noHash) continue;
        if (!seen.has(noHash)) { seen.add(noHash); urls.push(noHash); }
      }
    } catch { /* skip */ }
  }

  return urls;
}

export const importWordpress = async (_req: Request, res: Response) => {
  try {
    // Phase 1: find products
    const urls = await scrapeAllProductUrls();
    if (urls.length === 0) {
      return res.json({ status: 'error', message: 'Geen producten gevonden op de oude website.' });
    }

    // Phase 2: scrape each product
    const scraped: any[] = [];
    const scrapeErrors: string[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!url) continue;
      try {
        const product = await scrapeProduct(url);
        if (product && !product.error) {
          scraped.push(product);
        } else {
          scrapeErrors.push(`Kon niet uitlezen: ${url}${product?.error ? ` (${product.error}${product.raw ? ': ' + product.raw.substring(0, 100) : ''})` : ''}`);
        }
      } catch (err: any) {
        scrapeErrors.push(`Fout bij ${url}: ${err.message}`);
      }
    }

    // Phase 3: import into database
    let imported = 0;
    let failed = 0;
    const importErrors: string[] = [];

    for (const product of scraped) {
      try {
        await productsRepo.createProduct({
          name: product.name,
          description: product.description || null,
          specs: product.specs || null,
          price: product.price,
          stock: STOCK_DEFAULT,
          category: product.category || null,
          categoryId: null,
          imageUrl: product.imageUrls[0] || null,
          imageUrls: product.imageUrls,
          pdfUrl: null,
          videoUrl: null,
        });
        imported++;
      } catch (err: any) {
        failed++;
        importErrors.push(`${product.name}: ${err.message}`);
      }
    }

    return res.json({
      status: 'completed',
      totalUrlsFound: urls.length,
      scraped: scraped.length,
      imported,
      failed,
      scrapeErrors: scrapeErrors.slice(0, 10),
      importErrors: importErrors.slice(0, 10),
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
