// BTW-nummercontrole voor EU-klanten via VIES (EU-dienst). Alleen de landcode + nummer worden verstuurd.
export const EU_COUNTRIES: Record<string, string> = {
  AT: 'Oostenrijk', BE: 'België', BG: 'Bulgarije', HR: 'Kroatië', CY: 'Cyprus', CZ: 'Tsjechië', DK: 'Denemarken', EE: 'Estland',
  FI: 'Finland', FR: 'Frankrijk', DE: 'Duitsland', GR: 'Griekenland', HU: 'Hongarije', IE: 'Ierland', IT: 'Italië', LV: 'Letland',
  LT: 'Litouwen', LU: 'Luxemburg', MT: 'Malta', NL: 'Nederland', PL: 'Polen', PT: 'Portugal', RO: 'Roemenië', SK: 'Slowakije',
  SI: 'Slovenië', ES: 'Spanje', SE: 'Zweden',
};

export type VatCheck = { valid: boolean; country: string; number: string; name?: string; unavailable?: boolean; error?: string };

// "de 811 128.135" / "DE811128135" → { country: 'DE', number: '811128135' }; Grieks "EL" = GR
export function parseVatNumber(input: string, fallbackCountry?: string): { country: string; number: string } | null {
  const raw = String(input || '').toUpperCase().replace(/[\s.\-_/]/g, '');
  if (!raw) return null;
  let country = '';
  let number = raw;
  const prefix = raw.slice(0, 2);
  if (/^[A-Z]{2}$/.test(prefix)) { country = prefix === 'EL' ? 'GR' : prefix; number = raw.slice(2); }
  else if (fallbackCountry) country = fallbackCountry.toUpperCase();
  if (!country || !EU_COUNTRIES[country] || !/^[0-9A-Z]{4,14}$/.test(number)) return null;
  return { country, number };
}

const cache = new Map<string, { at: number; value: VatCheck }>();

export async function checkVatNumber(input: string, fallbackCountry?: string): Promise<VatCheck> {
  const parsed = parseVatNumber(input, fallbackCountry);
  if (!parsed) return { valid: false, country: '', number: '', error: 'Ongeldig BTW-nummer (begin met de landcode, bv. DE123456789)' };
  const key = `${parsed.country}${parsed.number}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.value;
  try {
    const vies = parsed.country === 'GR' ? 'EL' : parsed.country;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${vies}/vat/${encodeURIComponent(parsed.number)}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timer);
    if (!res.ok) return { valid: false, country: parsed.country, number: parsed.number, unavailable: true, error: 'BTW-controle tijdelijk niet beschikbaar' };
    const data: any = await res.json();
    if (data?.userError && !['VALID', 'INVALID'].includes(String(data.userError))) {
      return { valid: false, country: parsed.country, number: parsed.number, unavailable: true, error: 'BTW-controle tijdelijk niet beschikbaar' };
    }
    const value: VatCheck = { valid: data?.isValid === true, country: parsed.country, number: parsed.number, name: data?.name && data.name !== '---' ? String(data.name) : undefined };
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return { valid: false, country: parsed.country, number: parsed.number, unavailable: true, error: 'BTW-controle tijdelijk niet beschikbaar' };
  }
}

// BTW verlegd: geldig BTW-nummer uit een ander EU-land dan Nederland én levering naar een ander EU-land
export function qualifiesForReverseCharge(vat: VatCheck, shippingCountry: string): boolean {
  const ship = String(shippingCountry || 'NL').toUpperCase();
  return vat.valid && vat.country !== 'NL' && !!EU_COUNTRIES[vat.country] && ship !== 'NL' && !!EU_COUNTRIES[ship];
}
