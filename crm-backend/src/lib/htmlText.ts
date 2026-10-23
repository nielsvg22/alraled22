import sanitizeHtml from 'sanitize-html';

// Productomschrijvingen bevatten soms HTML (uit import of editor). We slaan platte
// tekst op: blokelementen worden regelafstanden, <li> een opsomming, overige tags vervallen.
const HTML_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', euro: '€', deg: '°',
  ndash: '–', mdash: '—', eacute: 'é', egrave: 'è', ouml: 'ö', uuml: 'ü', iuml: 'ï', euml: 'ë',
};

export function htmlToText(html: string): string {
  return html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(b|strong)\b[^>]*>([\s\S]*?)<\s*\/\s*\1\s*>/gi, '**$2**')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\s*\/\s*(p|div|h[1-6]|li|ul|ol|tr|table)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    // Restanten van half weggeknipte tags (bv. role="tabpanel" aria-labelledby="...">)
    .replace(/(?:\s*\b(?:role|aria-[\w-]+|class|id|style|data-[\w-]+|href|target|rel|tabindex)\s*=\s*(?:"[^"]*"|'[^']*'))+\s*\/?>/gi, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => HTML_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function hasHtml(value: string): boolean {
  return /<\/?[a-z][^>]*>|&(#\d+|#x[0-9a-f]+|[a-z]+);|\b(?:role|aria-[\w-]+)\s*=\s*["']/i.test(value);
}

// ── Opgemaakte omschrijving (editor in het CRM) ─────────────────────────────
// De omschrijving wordt als beperkte, veilige HTML bewaard: alinea's, vet, schuin,
// onderstreept, koppen, lijsten en links. Al het andere (scripts, stijlen, attributen) vervalt.
const LEFTOVER_ATTRS = /(?:\s*\b(?:role|aria-[\w-]+|class|id|style|data-[\w-]+|tabindex)\s*=\s*(?:"[^"]*"|'[^']*'))+\s*\/?>/gi;

export function sanitizeDescription(value: string): string {
  // Restanten van half weggeknipte tags (bv. role="tabpanel" aria-labelledby="...">) eerst weghalen
  const cleaned = value.replace(LEFTOVER_ATTRS, '');
  const hasTags = /<\/?[a-z][^>]*>/i.test(cleaned);
  // Platte tekst (geen HTML) blijft ongewijzigd, zodat bestaande omschrijvingen niet veranderen
  if (!hasTags) return cleaned.trim();
  return sanitizeHtml(cleaned, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      b: 'strong',
      i: 'em',
      h1: 'h2',
      h4: 'h3', h5: 'h3', h6: 'h3',
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' } }),
    },
  }).trim();
}
