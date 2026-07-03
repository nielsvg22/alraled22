/**
 * Import products from old WordPress/WooCommerce site (alra-led.com)
 *
 * Usage: npx ts-node src/scripts/import-wordpress.ts
 *
 * Optionally pass the API base URL and auth token:
 *   WP_BASE=https://alra-led.com API_URL=http://localhost:3001/api AUTH_TOKEN=xxx npx ts-node src/scripts/import-wordpress.ts
 */

import axios from 'axios';

const WP_BASE = process.env.WP_BASE || 'https://alra-led.com';
const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const STOCK_DEFAULT = 999;

interface Spec { label: string; value: string }

interface ProductData {
  name: string;
  price: number;
  description: string;
  specs: Spec[];
  imageUrls: string[];
  category: string;
}

function parsePrice(text: string): number | null {
  const m = text.match(/€\s*([0-9]+[.,][0-9]+)/);
  if (!m) return null;
  return parseFloat(m[1].replace(',', '.'));
}

function extractBetween(text: string, start: string, end: string): string {
  const s = text.indexOf(start);
  if (s === -1) return '';
  const from = s + start.length;
  const e = text.indexOf(end, from);
  return e === -1 ? text.slice(from) : text.slice(from, e);
}

function parseSpecsFromHtml(html: string): Spec[] {
  const specs: Spec[] = [];
  // Match <strong>Label:</strong> Value or **Label:** Value patterns
  const strongRe = /<(?:strong|b)>([^<]+)<\/(?:strong|b)>:\s*([^<\n]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = strongRe.exec(html)) !== null) {
    const label = m[1].trim();
    let value = m[2].trim();
    // Check if value continues on next non-HTML line
    const rest = html.slice(m.index + m[0].length, html.indexOf('<', m.index + m[0].length));
    if (rest && !rest.includes('<')) {
      const extra = rest.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('<'))[0];
      if (extra) value += ' ' + extra;
    }
    if (label && value) specs.push({ label, value });
  }
  return specs;
}

function parseDescription(html: string): string {
  // Get Beschrijving tab content or main product description
  const descTab = extractBetween(html, 'id="tab-description"', '</div>');
  const text = descTab || html;
  // Remove HTML tags, keep line breaks
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&euro;/g, '€')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractImages(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  // WooCommerce gallery images (full-size from -300x300 or similar)
  const galleryRe = /<a[^>]+href="([^"]+)"[^>]*>\s*<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = galleryRe.exec(html)) !== null) {
    let url = m[1];
    // Convert thumbnail to full: remove -NNNxNNN part
    url = url.replace(/-\d+x\d+(?=\.\w+$)/, '');
    if (url && !seen.has(url)) { seen.add(url); urls.push(url); }
  }

  // Also find main product image
  const mainImgRe = /<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i;
  const mainM = mainImgRe.exec(html);
  if (mainM) {
    let url = mainM[1].replace(/-\d+x\d+(?=\.\w+$)/, '');
    if (url && !seen.has(url)) { seen.add(url); urls.unshift(url); }
  }

  // WooCommerce product-gallery thumbnails
  const thumbRe = /<img[^>]+src="([^"]+)"[^>]*class="[^"]*attachment-woocommerce_thumbnail[^"]*"/gi;
  while ((m = thumbRe.exec(html)) !== null) {
    let url = m[1].replace(/-\d+x\d+(?=\.\w+$)/, '');
    if (url && !seen.has(url)) { seen.add(url); urls.push(url); }
  }

  return urls;
}

function extractCategory(html: string): string {
  const catRe = /<span[^>]*class="[^"]*posted_in[^"]*"[^>]*>.*?<a[^>]+href="[^"]*product-categorie\/([^"/]+)/i;
  const m = catRe.exec(html);
  if (!m) return '';
  return m[1].replace(/-/g, ' ');
}

async function fetchHtml(url: string): Promise<string> {
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ALRA-Import-Script/1.0)' },
    timeout: 15000,
  });
  return res.data;
}

async function scrapeProduct(url: string): Promise<ProductData | null> {
  try {
    const html = await fetchHtml(url);

    // Name from <h1> or <title>
    const nameM = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([^<]+)<\/h1>/i)
      || html.match(/<title>([^<]+)\s*[–-].*?<\/title>/i);
    const name = nameM ? nameM[1].trim() : '';
    if (!name) return null;

    // Price
    const priceElRe = /<p[^>]*class="[^"]*price[^"]*"[^>]*>(.*?)<\/p>/i;
    const priceM = priceElRe.exec(html);
    const price = priceM ? parsePrice(priceM[1]) : null;
    if (!price) return null;

    // Description + Specs
    const description = parseDescription(html);
    const specs = parseSpecsFromHtml(html);

    // Images
    const imageUrls = extractImages(html);

    // Category
    const category = extractCategory(html);

    console.log(`  ✓ ${name} — €${price} [${imageUrls.length} afbeeldingen, ${specs.length} specs, cat: "${category}"]`);
    return { name, price, description, specs, imageUrls, category };
  } catch (err: any) {
    console.error(`  ✗ Fout bij ${url}: ${err.message}`);
    return null;
  }
}

async function scrapeAllProductUrls(): Promise<string[]> {
  const urls: string[] = [];
  const seen = new Set<string>();

  // Step 1: scrape webshop main page and all category pages
  const pages = [
    `${WP_BASE}/webshop/`,
    ...['bedrijfswagen-verlichting', 'bouwlichtslangen-en-toebehoren', 'hefbrugverlichting',
      'led-draagbare-werkverlichting-en-overige', 'led-verkeersveiligheid-verlichting',
      'projectoren', 'veiligheidsverlichting'].map(s => `${WP_BASE}/product-categorie/${s}/`),
  ];

  for (const pageUrl of pages) {
    try {
      console.log(`\n🔍 Scrapen: ${pageUrl}`);
      const html = await fetchHtml(pageUrl);
      // Find all product links
      const linkRe = /<a[^>]+href="([^"]+\/product\/[^"]+)"[^>]*>/gi;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(html)) !== null) {
        const url = m[1].split('?')[0].split('#')[0];
        if (!seen.has(url)) { seen.add(url); urls.push(url); }
      }
    } catch (err: any) {
      console.error(`  ✗ Kon ${pageUrl} niet laden: ${err.message}`);
    }
  }

  console.log(`\n📦 Totaal ${urls.length} unieke producten gevonden`);
  return urls;
}

async function importProduct(api: string, product: ProductData): Promise<boolean> {
  // Convert specs to JSON string
  const specsStr = product.specs.length > 0
    ? JSON.stringify(product.specs.map(s => ({ label: s.label, value: s.value })))
    : '';

  try {
    await axios.post(`${api}/products`, {
      name: product.name,
      description: product.description || null,
      specs: specsStr,
      price: product.price,
      stock: STOCK_DEFAULT,
      category: product.category || null,
      categoryId: null,
      imageUrl: product.imageUrls[0] || null,
      imageUrls: product.imageUrls,
      pdfUrl: null,
      videoUrl: null,
    }, {
      headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {},
      timeout: 30000,
    });
    return true;
  } catch (err: any) {
    console.error(`  ✗ Import fout: ${err.response?.data?.error || err.message}`);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  WordPress → API Product Import Script   ║');
  console.log(`║  Bron: ${WP_BASE}`);
  console.log(`║  Doel: ${API_URL}`);
  console.log('╚══════════════════════════════════════════╝');

  // Step 1: Get all product URLs
  const urls = await scrapeAllProductUrls();
  if (urls.length === 0) {
    console.log('\n❌ Geen producten gevonden.');
    return;
  }

  // Step 2: Scrape each product
  console.log('\n📋 Producten ophalen...');
  const products: ProductData[] = [];
  for (let i = 0; i < urls.length; i++) {
    console.log(`[${i + 1}/${urls.length}] ${urls[i]}`);
    const p = await scrapeProduct(urls[i]);
    if (p) products.push(p);
  }

  console.log(`\n✅ ${products.length}/${urls.length} producten succesvol uitgelezen`);

  // Step 3: Import into API
  if (products.length === 0) {
    console.log('\n⚠️  Geen producten om te importeren.');
    return;
  }

  // Ask for confirmation
  console.log('\n────────── Productoverzicht ──────────');
  products.forEach(p => console.log(`  • ${p.name} — €${p.price.toFixed(2)}`));
  console.log(`\n🚀 Bezig met importeren van ${products.length} producten naar ${API_URL}...`);

  let success = 0;
  let failed = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] ${p.name}... `);
    const ok = await importProduct(API_URL, p);
    if (ok) { success++; console.log('✅'); }
    else { failed++; console.log('❌'); }
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Import voltooid!                        ║');
  console.log(`║  ✅ Succes: ${success}`);
  console.log(`║  ❌ Mislukt: ${failed}`);
  console.log('╚══════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
