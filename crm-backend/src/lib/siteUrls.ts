import type { Request } from 'express';

// Alle publieke adressen komen uit de omgeving of uit de aanvraag zelf; er staat geen domein hard in de code.
// Volgorde: expliciete omgevingsvariabele -> herkomst van de aanvraag -> eerste geschikte CORS-origin.

function origins(): string[] {
  return (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);
}

function host(o: string): string {
  try { return new URL(o).hostname; } catch { return o; }
}

const isTemp = (o: string) => /nip\.io|localhost|railway\.app/i.test(host(o));

function pick(list: string[], want: (h: string) => boolean): string | undefined {
  const m = list.filter((o) => want(host(o)));
  return m.find((o) => !isTemp(o) && !/^https?:\/\/www\./i.test(o)) || m.find((o) => !isTemp(o)) || m[0];
}

function clean(u?: string | null): string | undefined {
  if (!u) return undefined;
  try { const x = new URL(u); return x.origin; } catch { return undefined; }
}

// Adres van de webshop (voor links in mails, betaal-terugkeer en sitemap)
export function frontendUrl(req?: Request, preferred?: string | null): string {
  const env = clean(process.env.FRONTEND_URL);
  if (env) return env;
  const known = origins();
  const fromPref = clean(preferred);
  if (fromPref && (known.length === 0 || known.includes(fromPref))) return fromPref;
  const fromReq = clean(req?.get('origin') || req?.get('referer'));
  if (fromReq && !/^crm\./i.test(host(fromReq)) && (known.length === 0 || known.includes(fromReq))) return fromReq;
  return pick(known, (h) => !/^(crm|api)\./i.test(h)) || 'http://localhost:3000';
}

// Adres van het CRM (voor links in admin-mails)
export function crmUrl(req?: Request): string {
  const env = clean(process.env.CRM_URL);
  if (env) return env;
  const fromReq = clean(req?.get('origin') || req?.get('referer'));
  if (fromReq && /^crm\./i.test(host(fromReq))) return fromReq;
  return pick(origins(), (h) => /^crm\./i.test(h)) || 'http://localhost:5174';
}

// Adres van deze API (voor webhooks)
export function apiBaseUrl(req: Request): string {
  const env = clean(process.env.API_BASE_URL);
  if (env) return env;
  return `${req.protocol}://${req.get('host') || 'localhost:5000'}`;
}

// Alleen eigen, bekende origins mogen bij een bestelling worden bewaard
export function knownOrigin(req: Request): string | null {
  const o = clean(req.get('origin'));
  const known = origins();
  if (!o) return null;
  return known.length === 0 || known.includes(o) ? o : null;
}
