import { Request, Response } from 'express';
import axios from 'axios';
import * as productsRepo from '../db/productsRepo';
import { setContent } from '../db/contentRepo';

const WP_BASE = process.env.WP_BASE || 'https://alra-led.com';
const STOCK_DEFAULT = 999;

function parsePrice(text: string): number | null {
  const decoded = text
    .replace(/<[^>]+>/g, '')
    .replace(/&euro;/g, '€').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
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
  const re = /<(?:strong|b)>([^<:]+):\s*<\/(?:strong|b)>\s*([^<\n]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const label = (m[1] || '').trim();
    const value = (m[2] || '').trim();
    if (!label || !value) continue;
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

function extractHeadings(html: string): { level: number; text: string; content: string }[] {
  const sections: { level: number; text: string; content: string }[] = [];
  const headingRe = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = headingRe.exec(html)) !== null) {
    const level = parseInt(m[1] || '2', 10);
    const headingText = (m[2] || '').replace(/<[^>]+>/g, '').trim();
    if (!headingText) continue;

    // Content between previous heading and this one
    const between = html.slice(lastIndex, m.index);

    // Push previous section content before the heading text
    if (sections.length > 0) {
      const last = sections[sections.length - 1];
      if (last) {
        last.content = cleanHtml(between);
      }
    } else if (between.trim()) {
      // Content before the first heading (intro)
      sections.push({ level: 0, text: '', content: cleanHtml(between) });
    }

    sections.push({ level, text: headingText, content: '' });
    lastIndex = headingRe.lastIndex;
  }

  // Remaining content after last heading
  if (lastIndex < html.length) {
    const remaining = cleanHtml(html.slice(lastIndex));
    if (remaining) {
      const last = sections[sections.length - 1];
      if (last) {
        last.content = (last.content + '\n\n' + remaining).trim();
      } else {
        sections.push({ level: 0, text: '', content: remaining });
      }
    }
  }

  return sections;
}

function groupSectionsByH2(sections: { level: number; text: string; content: string }[]): { h2: string; subs: { h3: string; content: string }[] }[] {
  const groups: { h2: string; subs: { h3: string; content: string }[] }[] = [];
  let current: { h2: string; subs: { h3: string; content: string }[] } | null = null;

  for (const s of sections) {
    if (s.level === 0) continue;
    if (s.level === 2) {
      current = { h2: s.text, subs: [] };
      if (s.content.trim()) {
        current.subs.push({ h3: '', content: s.content });
      }
      groups.push(current);
    } else if (s.level === 3 && current) {
      current.subs.push({ h3: s.text, content: s.content });
    }
  }

  return groups;
}

function extractIntroContent(html: string): string {
  const bodyRe = /<body[^>]*>([\s\S]*)<\/body>/i;
  const bodyM = bodyRe.exec(html);
  const body = bodyM ? bodyM[1] || '' : html;

  // Find the first h1 or h2 — everything before it is intro
  const firstHeading = body.search(/<h[12][^>]*>/i);
  if (firstHeading > 0) {
    return cleanHtml(body.slice(0, firstHeading));
  }
  return '';
}

function extractPageTitle(html: string): string {
  const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
  const h1M = h1Re.exec(html);
  if (h1M && h1M[1]) return h1M[1].replace(/<[^>]+>/g, '').trim();
  const titleRe = /<title>([^<]+)<\/title>/i;
  const titleM = titleRe.exec(html);
  if (titleM && titleM[1]) return titleM[1].replace(/[-–].*$/, '').trim();
  return '';
}

function extractMetaDescription(html: string): string {
  const metaRe = /<meta[^>]+name="description"[^>]+content="([^"]*)"/i;
  const m = metaRe.exec(html);
  return m ? (m[1] || '').trim() : '';
}

function extractContactInfo(html: string): Record<string, string> {
  const info: Record<string, string> = {};

  // Try to find phone number
  const phoneRe = /(?:tel|telefoon|phone|bel\s*ons)[^:]*:\s*([0-9][0-9\s\-\(\)]{5,20})/i;
  const phoneM = phoneRe.exec(html);
  if (phoneM && phoneM[1]) info.phone = phoneM[1].trim();

  // Try to find email
  const emailRe = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailM = emailRe.exec(html);
  if (emailM && emailM[1]) info.email = emailM[1].trim();

  // Try to find address
  const addressRe = /(?:adres|address|straat|weg|laan|plein|gracht)[^:]*:\s*([^<\n]{10,100})/i;
  const addressM = addressRe.exec(html);
  if (addressM && addressM[1]) info.address = addressM[1].trim();

  return info;
}

function extractStatsFromHtml(html: string): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = [];
  // Look for number + label patterns commonly used in stat sections
  const statRe = /(?:<[^>]*>)?\s*([0-9]{2,4})(?:\s*[+%])?\s*(?:<[^>]*>)?\s*([A-Za-z][A-Za-z\s]{2,50})(?:\s*[+%])?/gi;
  let m: RegExpExecArray | null;
  while ((m = statRe.exec(html)) !== null) {
    if (m[1] && m[2]) {
      stats.push({ value: m[1], label: m[2].trim() });
    }
  }
  return stats;
}

// WordPress pages to import with their target content keys
const TEXT_PAGES: { url: string; targetKey: string; label: string }[] = [
  { url: `${WP_BASE}/`, targetKey: 'home', label: 'Homepage' },
  { url: `${WP_BASE}/over-ons/`, targetKey: 'about', label: 'Over Ons' },
  { url: `${WP_BASE}/contact/`, targetKey: 'contact', label: 'Contact' },
  { url: `${WP_BASE}/algemene-voorwaarden/`, targetKey: 'legal_terms', label: 'Algemene Voorwaarden' },
  { url: `${WP_BASE}/privacy-policy/`, targetKey: 'legal_privacy', label: 'Privacy Policy' },
  { url: `${WP_BASE}/retourbeleid/`, targetKey: 'legal_returns', label: 'Retourbeleid' },
  { url: `${WP_BASE}/klachten/`, targetKey: 'legal_complaints', label: 'Klachten' },
];

async function scrapeTextPage(url: string): Promise<{
  title: string;
  metaDescription: string;
  intro: string;
  sections: { h2: string; subs: { h3: string; content: string }[] }[];
  rawSections: { level: number; text: string; content: string }[];
  contactInfo: Record<string, string>;
  stats: { label: string; value: string }[];
}> {
  const html = await fetchHtml(url);
  return {
    title: extractPageTitle(html),
    metaDescription: extractMetaDescription(html),
    intro: extractIntroContent(html),
    sections: groupSectionsByH2(extractHeadings(html)),
    rawSections: extractHeadings(html),
    contactInfo: extractContactInfo(html),
    stats: extractStatsFromHtml(html),
  };
}

function buildHomeContent(scraped: Awaited<ReturnType<typeof scrapeTextPage>>): object {
  const sections = scraped.sections;
  const hero = {
    title: scraped.title || 'Welkom bij ALRA LED Solutions',
    subtitle: scraped.intro || scraped.metaDescription || 'Specialist in LED-verlichting voor bedrijfswagens, bouwplaatsen en werkplaatsen.',
  };
  const introSection: Record<string, string> = {};
  const specializations: { title: string; desc: string; image: string }[] = [];
  const stats: { value: number; label: string; suffix: string }[] = [];
  const process: { title: string; description: string; buttonText: string; steps: { title: string; description: string }[] } = { title: '', description: '', buttonText: '', steps: [] };
  const cta: Record<string, string> = {};
  let description = scraped.intro;

  for (const sec of sections) {
    const h2 = sec.h2.toLowerCase();
    if (h2.includes('over') || h2.includes('welkom')) {
      introSection.heading = sec.h2;
      introSection.description = sec.subs.map(s => s.content).join('\n\n');
      if (!description) description = introSection.description;
    } else if (h2.includes('specialisatie') || h2.includes('product') || h2.includes('categorie')) {
      for (const sub of sec.subs) {
        if (sub.h3) {
          specializations.push({ title: sub.h3, desc: sub.content, image: '' });
        }
      }
    } else if (h2.includes('statistiek') || h2.includes('cijfer') || h2.includes('resultaat')) {
      for (const stat of scraped.stats) {
        stats.push({ value: parseInt(stat.value) || 0, label: stat.label, suffix: '+' });
      }
    } else if (h2.includes('proces') || h2.includes('werkwijze') || h2.includes('methode')) {
      process.title = sec.h2;
      process.description = sec.subs.map(s => s.content).join('\n\n');
      process.steps = sec.subs.map(s => ({ title: s.h3 || 'Stap', description: s.content }));
    } else if (h2.includes('contact') || h2.includes('vraag') || h2.includes('cta')) {
      cta.title = sec.h2;
      cta.subtitle = sec.subs.map(s => s.content).join('\n\n');
    } else {
      // Fall through to description
      description += '\n\n' + sec.subs.map(s => s.content).join('\n\n');
    }
  }

  return {
    hero: { ...hero, titlePrefix: '', primaryButtonText: 'Bekijk producten', secondaryButtonText: 'Over ons', typewriterWords: ['bedrijfswagens.', 'bouwplaatsen.', 'werkplaatsen.'] },
    introduction: { badge: 'Duurzame Toekomst', marqueeText: 'LED SPECIALISTS' },
    introSection: Object.keys(introSection).length > 0 ? introSection : { heading: 'Over ALRA LED', description: description || scraped.title },
    specializations: specializations.length > 0 ? specializations : [{ title: 'Bedrijfswagenverlichting', desc: description.slice(0, 200), image: '' }],
    stats: stats.length > 0 ? stats : [{ value: 10, label: 'Jaar Actief', suffix: '+' }],
    process: process.title ? process : { title: 'Onze werkwijze', description: description.slice(0, 300), buttonText: 'Leer onze methode', steps: [{ title: 'Stap 1', description: description.slice(0, 150) }] },
    cta: Object.keys(cta).length > 0 ? cta : { title: 'Benieuwd wat wij voor u kunnen betekenen?', subtitle: 'Neem contact met ons op voor een vrijblijvend gesprek.' },
  };
}

function buildAboutContent(scraped: Awaited<ReturnType<typeof scrapeTextPage>>): object {
  const sections = scraped.sections;
  const values: { icon: string; title: string; text: string }[] = [];
  const timeline: { year: string; label: string }[] = [];
  let description = scraped.intro;

  for (const sec of sections) {
    const h2 = sec.h2.toLowerCase();
    if (h2.includes('waarde') || h2.includes('kernwaarde')) {
      for (const sub of sec.subs) {
        if (sub.h3) {
          values.push({ icon: '⭐', title: sub.h3, text: sub.content });
        }
      }
    } else if (h2.includes('geschiedenis') || h2.includes('tijdlijn') || h2.includes('tijdslijn')) {
      for (const sub of sec.subs) {
        const yearM = sub.h3.match(/(\d{4})/);
        if (yearM) {
          timeline.push({ year: yearM[1] || sub.h3, label: sub.content.slice(0, 100) || sub.h3 });
        }
      }
    } else {
      description += '\n\n' + sec.subs.map(s => s.content).join('\n\n');
    }
  }

  return {
    eyebrow: 'Over ons',
    title: scraped.title || 'Over ALRA LED Solutions',
    description: description.trim() || scraped.metaDescription,
    image: '',
    stats: scraped.stats.length > 0 ? scraped.stats.map(s => ({ label: s.label, value: s.value })) : [{ label: 'Opgericht', value: '2014' }, { label: 'Partners', value: '50+' }],
    values: values.length > 0 ? values : [{ icon: '⭐', title: 'Kwaliteit', text: description.slice(0, 300) || 'Wij staan voor kwaliteit.' }],
    timelineTitle: 'Onze geschiedenis',
    timeline: timeline.length > 0 ? timeline : [{ year: '2014', label: 'Oprichting' }],
  };
}

function buildContactContent(scraped: Awaited<ReturnType<typeof scrapeTextPage>>): object {
  const contactInfo = scraped.contactInfo;
  return {
    eyebrow: 'Neem contact op',
    title: scraped.title || 'Contact',
    description: scraped.intro || 'Neem contact met ons op voor vragen of een vrijblijvende offerte.',
    phone: contactInfo.phone || '085-0021 606',
    email: contactInfo.email || 'info@alra-led.nl',
    address: contactInfo.address || 'Dijkgraafweg 4a, 7336 AT Apeldoorn',
    detailsTitle: 'Gegevens',
    addressLabel: 'Adres',
    phoneLabel: 'Telefoon',
    emailLabel: 'Email',
    callTitle: 'Liever direct bellen?',
    callText: 'Onze experts helpen u graag telefonisch.',
    companyDetails: 'Bedrijfsgegevens',
    kvkLabel: 'KvK',
    vatLabel: 'BTW',
    kvkValue: '62609297',
    vatValue: 'NL854885821B01',
    successTitle: 'Bericht verstuurd!',
    successText: 'We nemen zo snel mogelijk contact met u op.',
    newMessage: 'Nieuw bericht',
    form: {
      nameLabel: 'Naam',
      emailLabel: 'Email',
      subjectLabel: 'Onderwerp',
      messageLabel: 'Bericht',
      namePlaceholder: 'Uw naam',
      emailPlaceholder: 'uw@email.nl',
      subjectPlaceholder: 'Waar gaat uw vraag over?',
      messagePlaceholder: 'Hoe kunnen we u helpen?',
      submit: 'Verstuur bericht',
    },
  };
}

function buildLegalContent(scraped: Awaited<ReturnType<typeof scrapeTextPage>>): object {
  const sections = scraped.sections;
  let content = scraped.intro;
  for (const sec of sections) {
    content += '\n\n## ' + sec.h2 + '\n\n';
    for (const sub of sec.subs) {
      if (sub.h3) content += '### ' + sub.h3 + '\n\n';
      content += sub.content + '\n\n';
    }
  }
  return {
    title: scraped.title || '',
    content: content.trim(),
  };
}

export const importText = async (_req: Request, res: Response) => {
  const results: { key: string; label: string; status: string; error?: string; sectionsFound?: number }[] = [];

  for (const page of TEXT_PAGES) {
    try {
      console.log(`[import-text] Scraping ${page.label} (${page.url})...`);
      const scraped = await scrapeTextPage(page.url);

      let content: object;
      switch (page.targetKey) {
        case 'home':
          content = buildHomeContent(scraped);
          break;
        case 'about':
          content = buildAboutContent(scraped);
          break;
        case 'contact':
          content = buildContactContent(scraped);
          break;
        default:
          // Legal pages and others
          content = buildLegalContent(scraped);
          break;
      }

      await setContent(page.targetKey, content);
      console.log(`[import-text] Saved ${page.label} -> ${page.targetKey}`);

      results.push({
        key: page.targetKey,
        label: page.label,
        status: 'completed',
        sectionsFound: scraped.sections.length,
      });
    } catch (err: any) {
      console.error(`[import-text] Failed for ${page.label}:`, err.message);
      results.push({
        key: page.targetKey,
        label: page.label,
        status: 'error',
        error: `${err.message}${err.response?.status ? ' (HTTP ' + err.response.status + ')' : ''}${err.code ? ' [' + err.code + ']' : ''}`,
      });
    }
  }

  const successCount = results.filter(r => r.status === 'completed').length;
  const errorResults = results.filter(r => r.status === 'error');

  return res.json({
    status: errorResults.length === 0 ? 'completed' : 'completed_with_errors',
    total: TEXT_PAGES.length,
    succeeded: successCount,
    failed: errorResults.length,
    results,
    errors: errorResults.length > 0
      ? errorResults.map(r => `${r.label} (${r.key}): ${r.error}`)
      : [],
  });
};

export const scrapeSpecs = async (_req: Request, res: Response) => {
  try {
    const urls = await scrapeAllProductUrls();
    const existing = await productsRepo.listProducts();
    let updated = 0;
    let matched = 0;
    const errors: string[] = [];

    for (const url of urls) {
      try {
        const result: any = await scrapeProduct(url);
        if (!result || result.error) continue;

        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const productName = norm(result.name);
        const match = existing.find(p => norm(p.name) === productName);

        if (!match) { matched++; continue; }

        const specsJson = result.specs || null;
        if (specsJson) {
          await productsRepo.updateProduct(match.id, { specs: specsJson });
          updated++;
        }
      } catch (err: any) {
        errors.push(`${url}: ${err.message}`);
      }
    }

    return res.json({
      status: 'completed',
      totalUrls: urls.length,
      matched,
      updated,
      errors: errors.slice(0, 10),
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
