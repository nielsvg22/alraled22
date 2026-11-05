// BTW-nummercontrole voor EU-klanten via VIES (EU-dienst). Alleen de landcode + nummer worden verstuurd.
export const EU_COUNTRIES: Record<string, string> = {
  AT: 'Oostenrijk', BE: 'België', BG: 'Bulgarije', HR: 'Kroatië', CY: 'Cyprus', CZ: 'Tsjechië', DK: 'Denemarken', EE: 'Estland',
  FI: 'Finland', FR: 'Frankrijk', DE: 'Duitsland', GR: 'Griekenland', HU: 'Hongarije', IE: 'Ierland', IT: 'Italië', LV: 'Letland',
  LT: 'Litouwen', LU: 'Luxemburg', MT: 'Malta', NL: 'Nederland', PL: 'Polen', PT: 'Portugal', RO: 'Roemenië', SK: 'Slowakije',
  SI: 'Slovenië', ES: 'Spanje', SE: 'Zweden',
};


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

export type TraderInfo = { name?: string; street?: string; postcode?: string; city?: string };
export type AddressCheck = 'match' | 'mismatch' | 'unavailable';
export type VatCheck = {
  valid: boolean; country: string; number: string; name?: string; unavailable?: boolean; error?: string;
  addressCheck?: AddressCheck;          // komt naam/adres overeen met wat bij het BTW-nummer geregistreerd staat?
  consultationNumber?: string;          // VIES-raadpleegnummer (bewijs van de controle)
};

// Ons eigen BTW-nummer: met "aanvrager" geeft VIES een raadpleegnummer terug en doet het (waar mogelijk) een gekwalificeerde controle
const REQUESTER = { country: 'NL', number: process.env.COMPANY_VAT_NUMBER || '854885821B01' };

// "De Jong B.V." / "de jong bv" → vergelijkbare woorden
const words = (v: string) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(b\.?v\.?|n\.?v\.?|gmbh|ag|sarl|sprl|bvba|nv|ltd|llc|sa|srl|spa|sl|ab|as|oy|kg|ug|e\.?k\.?|vof|mbh|co)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(w => w.length > 1);
const norm = (v: string) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');

// Vergelijk de ingevulde gegevens met wat VIES teruggeeft (alleen als VIES die prijsgeeft; sommige landen, zoals Duitsland, doen dat niet)
export function compareTrader(entered: TraderInfo, registered: { name?: string; address?: string }): AddressCheck {
  const regName = registered.name && registered.name !== '---' ? registered.name : '';
  const regAddr = registered.address && registered.address !== '---' ? registered.address : '';
  if (!regName && !regAddr) return 'unavailable';
  // Postcode of plaats moet kloppen (plaatsnamen hebben soms twee schrijfwijzen, zoals Brussel/Bruxelles) en de naam moet overlappen
  let checks = 0; let fails = 0;
  if (regAddr && (entered.postcode || entered.city)) {
    checks++;
    const hay = norm(regAddr);
    const pcOk = !!entered.postcode && hay.includes(norm(entered.postcode));
    const cityOk = !!entered.city && hay.includes(norm(entered.city));
    if (!pcOk && !cityOk) fails++;
  }
  if (regName && entered.name) {
    checks++;
    const a = words(entered.name); const b = words(regName);
    const common = a.filter(w => b.includes(w)).length;
    if (!a.length || !b.length || common / Math.min(a.length, b.length) < 0.5) fails++;
  }
  if (checks === 0) return 'unavailable';
  return fails === 0 ? 'match' : 'mismatch';
}

const cache = new Map<string, { at: number; value: VatCheck }>();

export async function checkVatNumber(input: string, fallbackCountry?: string, trader: TraderInfo = {}): Promise<VatCheck> {
  const parsed = parseVatNumber(input, fallbackCountry);
  if (!parsed) return { valid: false, country: '', number: '', error: 'Ongeldig BTW-nummer (begin met de landcode, bv. DE123456789)' };
  const key = `${parsed.country}${parsed.number}|${norm(trader.name || '')}|${norm(trader.postcode || '')}|${norm(trader.city || '')}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.value;
  const unavailable = (): VatCheck => ({ valid: false, country: parsed.country, number: parsed.number, unavailable: true, error: 'BTW-controle tijdelijk niet beschikbaar' });
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch('https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        countryCode: parsed.country === 'GR' ? 'EL' : parsed.country,
        vatNumber: parsed.number,
        requesterMemberStateCode: REQUESTER.country,
        requesterNumber: REQUESTER.number,
        ...(trader.name ? { traderName: trader.name } : {}),
        ...(trader.street ? { traderStreet: trader.street } : {}),
        ...(trader.postcode ? { traderPostalCode: trader.postcode } : {}),
        ...(trader.city ? { traderCity: trader.city } : {}),
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return unavailable();
    const data: any = await res.json();
    if (data?.errorWrappers || (data?.userError && !['VALID', 'INVALID'].includes(String(data.userError)) && data.valid === undefined)) return unavailable();
    let valid = data?.valid === true || data?.isValid === true;
    let plain: any = data;
    // Bij een mismatch op naam/adres meldt VIES soms "ongeldig". Dan vragen we het nummer nog eens zonder naam/adres,
    // zodat we onderscheid kunnen maken tussen een ongeldig nummer en gegevens die er niet bij horen.
    if (!valid && (trader.name || trader.postcode || trader.city)) {
      const r2 = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${parsed.country === 'GR' ? 'EL' : parsed.country}/vat/${encodeURIComponent(parsed.number)}`, { headers: { Accept: 'application/json' } });
      if (r2.ok) {
        const d2: any = await r2.json();
        if (d2?.isValid === true) { valid = true; plain = { ...d2, traderNameMatch: 'INVALID' }; }
      }
    }
    // 1) Heeft VIES zelf de ingevulde gegevens vergeleken? 2) anders vergelijken we met de teruggegeven naam/adres. 3) anders: niet te controleren.
    let addressCheck: AddressCheck = 'unavailable';
    // Straat laten we buiten beschouwing: schrijfwijzen (str./straat, huisnummerplaats) verschillen te vaak
    const flags = [plain?.traderNameMatch, plain?.traderPostalCodeMatch, plain?.traderCityMatch].filter(f => f && f !== 'NOT_PROCESSED');
    if (flags.length) addressCheck = flags.includes('INVALID') ? 'mismatch' : 'match';
    else addressCheck = compareTrader(trader, { name: plain?.name, address: plain?.address });
    const value: VatCheck = {
      valid, country: parsed.country, number: parsed.number,
      name: plain?.name && plain.name !== '---' ? String(plain.name) : undefined,
      addressCheck: valid ? addressCheck : undefined,
      consultationNumber: plain?.requestIdentifier || data?.requestIdentifier || undefined,
    };
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return unavailable();
  }
}

// BTW verlegd: geldig BTW-nummer uit een ander EU-land dan Nederland, levering naar een ander EU-land en een naam/adres dat niet botst met het BTW-nummer
export function qualifiesForReverseCharge(vat: VatCheck, shippingCountry: string): boolean {
  const ship = String(shippingCountry || 'NL').toUpperCase();
  return vat.valid && vat.addressCheck !== 'mismatch' && vat.country !== 'NL' && !!EU_COUNTRIES[vat.country] && ship !== 'NL' && !!EU_COUNTRIES[ship];
}
