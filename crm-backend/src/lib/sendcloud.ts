import { db } from './db';
import { sendcloudConfig } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logEvent } from './logger';
import fetch from 'node-fetch';

const SENDCLOUD_API_V2 = 'https://panel.sendcloud.sc/api/v2';
const SENDCLOUD_API_V3 = 'https://panel.sendcloud.sc/api/v3';

export interface SendcloudSettings {
  apiKey: string;
  apiSecret: string;
  senderName: string;
  senderAddress: string;
  senderHouseNumber: string;
  senderCity: string;
  senderPostalCode: string;
  senderCountry: string;
  senderTelephone: string;
  returnAddress: string;
  returnHouseNumber: string;
  returnCity: string;
  returnPostalCode: string;
  returnCountry: string;
  defaultShippingMethod: string;
  freeShippingThreshold: number;
  standardShippingCost: number;
  enableEveningDelivery: boolean;
  enableSaturdayDelivery: boolean;
  enablePickupPoints: boolean;
  enableSignature: boolean;
  enableInsurance: boolean;
  insuranceAmount: number;
}

const DEFAULTS: Partial<SendcloudSettings> = {
  senderName: 'ALRA LED Solutions',
  senderCountry: 'NL',
  returnCountry: 'NL',
  defaultShippingMethod: '1',
  freeShippingThreshold: 250,
  standardShippingCost: 6.95,
};

export async function getSendcloudSettings(): Promise<Partial<SendcloudSettings>> {
  const rows = await db.select().from(sendcloudConfig);
  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return { ...DEFAULTS, ...config } as Partial<SendcloudSettings>;
}

export async function setSendcloudSettings(settings: Partial<SendcloudSettings>): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined && value !== null) {
      const existing = await db.select().from(sendcloudConfig).where(eq(sendcloudConfig.key, key));
      if (existing.length > 0) {
        await db.update(sendcloudConfig).set({ value: String(value) }).where(eq(sendcloudConfig.key, key));
      } else {
        await db.insert(sendcloudConfig).values({ key, value: String(value) });
      }
    }
  }
}

// ── OAuth2 Token ──
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getOAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const settings = await getSendcloudSettings();
  const apiKey = settings.apiKey;
  const apiSecret = settings.apiSecret;
  if (!apiKey || !apiSecret) throw new Error('SendCloud API niet geconfigureerd');

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const res = await fetch('https://account.sendcloud.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials&scope=api',
  } as any);

  if (!res.ok) {
    const body = await res.text();
    let msg = `OAuth2 token fout (${res.status}): ${body}`;
    if (res.status === 401) {
      msg = 'SendCloud API authenticatie mislukt. Controleer of je Public Key (gebruikersnaam) en Private Key (wachtwoord) correct zijn. Vind je keys in SendCloud > Settings > Integrations > API.';
    }
    throw new Error(msg);
  }

  const data = await res.json() as any;
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  console.log('[sendcloud] OAuth2 token verkregen, verloopt over', data.expires_in, 'seconden');
  return cachedToken!;
}

// ── V3 Fetch ──
async function scFetch(path: string, options: RequestInit = {}): Promise<any> {
  const settings = await getSendcloudSettings();
  if (!settings.apiKey || !settings.apiSecret) {
    await logEvent('sendcloud', 'ERROR', 'scFetch', 'SendCloud API niet geconfigureerd');
    throw new Error('SendCloud API niet geconfigureerd');
  }

  // Get OAuth2 token
  let authHeader: string;
  try {
    const token = await getOAuthToken();
    authHeader = `Bearer ${token}`;
  } catch (e: any) {
    // Fallback to Basic auth
    console.log('[sendcloud] OAuth2 mislukt, fallback naar Basic auth:', e.message);
    authHeader = `Basic ${Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64')}`;
  }

  const url = `${SENDCLOUD_API_V3}${path}`;

  await logEvent('sendcloud', 'INFO', 'scFetch', `Request: ${options.method || 'GET'} ${path}`, {
    method: options.method || 'GET',
    body: options.body ? JSON.parse(options.body as string) : undefined,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let res;
  try {
    res = await fetch(url, {
      method: options.method as string || 'GET',
      body: options.body as string | undefined,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      },
      signal: controller.signal,
    } as any);
  } catch (fetchErr: any) {
    clearTimeout(timeout);
    const detail = { url, path, error: fetchErr.message, code: fetchErr.code };
    console.error('[sendcloud] Fetch failed:', detail);
    await logEvent('sendcloud', 'ERROR', 'scFetch', `Fetch fout: ${fetchErr.message}`, detail);
    throw fetchErr;
  }
  clearTimeout(timeout);

  const responseText = await res.text();
  let responseData;
  try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }

  if (!res.ok) {
    let errorMsg = `SendCloud API fout (${res.status}): ${responseText}`;
    if (res.status === 401) {
      errorMsg = 'SendCloud API authenticatie mislukt. Controleer of je Public Key en Private Key correct zijn. Vind je keys in SendCloud > Settings > Integrations > API.';
    }
    await logEvent('sendcloud', 'ERROR', 'scFetch', `API fout ${res.status}: ${responseText.slice(0, 500)}`, {
      status: res.status, path, response: responseData,
    });
    throw new Error(errorMsg);
  }

  await logEvent('sendcloud', 'INFO', 'scFetch', `Response OK: ${path}`, {
    status: res.status, response: responseData,
  });

  return responseData;
}

// ── V2 Fetch ──
async function scFetchV2(path: string, options: RequestInit = {}): Promise<any> {
  const settings = await getSendcloudSettings();
  if (!settings.apiKey || !settings.apiSecret) throw new Error('SendCloud API niet geconfigureerd');

  const auth = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
  const url = `${SENDCLOUD_API_V2}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let res;
  try {
    res = await fetch(url, {
      method: options.method as string || 'GET',
      body: options.body as string | undefined,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      },
      signal: controller.signal,
    } as any);
  } catch (fetchErr: any) {
    clearTimeout(timeout);
    throw fetchErr;
  }
  clearTimeout(timeout);

  const responseText = await res.text();
  let responseData;
  try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }

  if (!res.ok) {
    throw new Error(`SendCloud V2 API fout (${res.status}): ${responseText}`);
  }

  return responseData;
}

// ── Shipping Methods (dynamisch via SendCloud API) ──
const SHIPPING_METHOD_MAP: Record<string, string> = {
  '1': 'postnl:standard',
  '2': 'postnl:express',
  '3': 'dhl Parcel NL:parcel',
  '4': 'dhl Parcel NL:extra_at_home',
  '5': 'dpd:dpd_nl_32480',
  '8': 'dhl Parcel NL:parcel',
  '11': 'dpd:dpd_nl_32480',
  '99': 'sendcloud:letter',
  'postnl:standard': 'postnl:standard',
  'dhl Parcel NL:parcel': 'dhl Parcel NL:parcel',
  'dpd:dpd_nl_32480': 'dpd:dpd_nl_32480',
  'sendcloud:letter': 'sendcloud:letter',
};

export function resolveShippingOptionCode(method: string | undefined | null): string {
  if (!method) return 'postnl:standard';
  return SHIPPING_METHOD_MAP[method] || method;
}

const CARRIER_LOGOS: Record<string, string> = {
  postnl: 'https://cdn.sendcloud.cloud/assets/carriers/postnl/logo.png',
  dhl: 'https://cdn.sendcloud.cloud/assets/carriers/dhl/logo.png',
  dhl_express: 'https://cdn.sendcloud.cloud/assets/carriers/dhl_express/logo.png',
  dpd: 'https://cdn.sendcloud.cloud/assets/carriers/dpd/logo.png',
  gls: 'https://cdn.sendcloud.cloud/assets/carriers/gls/logo.png',
  ups: 'https://cdn.sendcloud.cloud/assets/carriers/ups/logo.png',
  fedex: 'https://cdn.sendcloud.cloud/assets/carriers/fedex/logo.png',
  bpost: 'https://cdn.sendcloud.cloud/assets/carriers/bpost/logo.png',
  colissimo: 'https://cdn.sendcloud.cloud/assets/carriers/colissimo/logo.png',
  hermes: 'https://cdn.sendcloud.cloud/assets/carriers/hermes/logo.png',
  'dhl Parcel NL': 'https://cdn.sendcloud.cloud/assets/carriers/dhl/logo.png',
};

function getCarrierLogo(carrierCode: string, carrierName: string): string {
  if (CARRIER_LOGOS[carrierCode]) return CARRIER_LOGOS[carrierCode];
  const nameLower = (carrierName || '').toLowerCase().replace(/\s+/g, '');
  for (const [key, url] of Object.entries(CARRIER_LOGOS)) {
    if (nameLower.includes(key)) return url;
  }
  return '';
}

export async function getShippingMethods(country: string = 'NL'): Promise<any[]> {
  try {
    const settings = await getSendcloudSettings();
    if (!settings.apiKey || !settings.apiSecret) {
      return getFallbackMethods();
    }

    const data = await scFetch('/shipping-options', {
      method: 'POST',
      body: JSON.stringify({
        from_country_code: settings.senderCountry || 'NL',
        to_country_code: country,
        from_postal_code: settings.senderPostalCode || '',
        parcels: [{ weight: { value: '1', unit: 'kg' } }],
        calculate_quotes: false,
      }),
    });

    const options = data?.data;
    if (!Array.isArray(options) || options.length === 0) {
      return getFallbackMethods();
    }

    const PRIORITY: Record<string, string> = {
      postnl: 'postnl:standard',
      dhl: 'dhl Parcel NL:parcel',
      dpd: 'dpd:dpd_nl_32480',
      ups: 'ups:standard',
      gls: 'gls:standard',
      bpost: 'bpost:standard',
      fedex: 'fedex:standard',
    };

    const bestPerCarrier: Record<string, any> = {};
    for (const opt of options) {
      const carrierCode = opt.carrier?.code || '';
      if (!carrierCode) continue;
      if (opt.form_factor === 'letter' && opt.code !== 'sendcloud:letter') continue;

      if (!bestPerCarrier[carrierCode]) {
        bestPerCarrier[carrierCode] = opt;
      } else {
        const preferred = PRIORITY[carrierCode];
        if (preferred && opt.code === preferred) {
          bestPerCarrier[carrierCode] = opt;
        }
      }
    }

    const methods = Object.values(bestPerCarrier).map((opt: any, index: number) => ({
      id: index + 1,
      name: opt.name || opt.code,
      shipping_option_code: opt.code,
      carrier: {
        name: opt.carrier?.name || 'Onbekend',
        code: opt.carrier?.code || '',
        logo: getCarrierLogo(opt.carrier?.code, opt.carrier?.name),
      },
      price: opt.quotes?.[0]?.price?.total?.value ? parseFloat(opt.quotes[0].price.total.value) : 0,
      delivery_time: opt.lead_time ? `${opt.lead_time}u` : '',
      service_area: opt.service_area || 'domestic',
    }));

    methods.push({
      id: 99,
      name: 'Test verzending (gratis)',
      shipping_option_code: 'sendcloud:letter',
      carrier: { name: 'SendCloud', code: 'sendcloud', logo: '' },
      price: 0,
      delivery_time: 'Test',
      service_area: 'domestic',
    });

    return methods;
  } catch (err: any) {
    console.error('[sendcloud] Dynamisch ophalen verzendmethoden mislukt:', err.message);
    return getFallbackMethods();
  }
}

function getFallbackMethods() {
  return [
    { id: 1, name: 'PostNL Standaard', shipping_option_code: 'postnl:standard', carrier: { name: 'PostNL', code: 'postnl', logo: CARRIER_LOGOS.postnl }, price: 0, delivery_time: '2-3 werkdagen' },
    { id: 8, name: 'DHL Pakket', shipping_option_code: 'dhl Parcel NL:parcel', carrier: { name: 'DHL', code: 'dhl', logo: CARRIER_LOGOS.dhl }, price: 0, delivery_time: '1-2 werkdagen' },
    { id: 11, name: 'DPD Pakket', shipping_option_code: 'dpd:dpd_nl_32480', carrier: { name: 'DPD', code: 'dpd', logo: CARRIER_LOGOS.dpd }, price: 0, delivery_time: '1-2 werkdagen' },
    { id: 99, name: 'Test verzending (gratis)', shipping_option_code: 'sendcloud:letter', carrier: { name: 'SendCloud', code: 'sendcloud', logo: '' }, price: 0, delivery_time: 'Test' },
  ];
}

// ── Create Shipment ──
interface CreateShipmentParams {
  orderNumber: string;
  receiverName: string;
  receiverCompany?: string;
  receiverAddress: string;
  receiverHouseNumber: string;
  receiverCity: string;
  receiverPostalCode: string;
  receiverCountry: string;
  receiverPhone?: string;
  shippingMethodId?: number;
  shippingMethod?: string;
  weight?: number;
  reference?: string;
}

export async function createShipment(params: CreateShipmentParams): Promise<any> {
  const settings = await getSendcloudSettings();

  let street: string = params.receiverAddress || '';
  let houseNumber: string = params.receiverHouseNumber || '';
  if (!houseNumber) {
    const match = street.match(/^(.*?)\s+(\d+\w*[a-zA-Z]?)$/);
    if (match) {
      street = match[1] || street;
      houseNumber = match[2] || houseNumber;
    }
  }

  const shippingCode = resolveShippingOptionCode(
    params.shippingMethod || String(params.shippingMethodId || '')
  );

  const payload = {
    to_address: {
      name: params.receiverName,
      company_name: params.receiverCompany || '',
      address_line_1: street,
      house_number: houseNumber,
      postal_code: params.receiverPostalCode,
      city: params.receiverCity,
      country_code: normalizeCountryCode(params.receiverCountry || 'NL'),
      phone_number: params.receiverPhone || '',
    },
    from_address: {
      name: settings.senderName || 'ALRA LED Solutions',
      address_line_1: settings.senderAddress || '',
      house_number: settings.senderHouseNumber || '',
      postal_code: settings.senderPostalCode || '',
      city: settings.senderCity || '',
      country_code: normalizeCountryCode(settings.senderCountry || 'NL'),
      phone_number: settings.senderTelephone || '',
    },
    ship_with: {
      type: 'shipping_option_code',
      properties: {
        shipping_option_code: shippingCode,
      },
    },
    order_number: params.orderNumber,
    parcels: [{
      weight: {
        value: String((params.weight || 500) / 1000),
        unit: 'kg',
      },
    }],
  };

  await logEvent('sendcloud', 'INFO', 'createShipment', `Shipment aanmaken voor order ${params.orderNumber}`, payload, params.reference);
  const data = await scFetch('/shipments/announce', { method: 'POST', body: JSON.stringify(payload) });
  await logEvent('sendcloud', 'INFO', 'createShipment', `Shipment aangemaakt`, data, params.reference);
  return data?.data || data;
}

// ── Label ──
export async function getShipmentLabel(parcelId: number): Promise<Buffer | null> {
  try {
    const data = await scFetch(`/parcels/${parcelId}/documents/label`);
    if (data?.label_file) {
      return Buffer.from(data.label_file, 'base64');
    }
    return null;
  } catch {
    return null;
  }
}

// ── Tracking ──
export async function getTrackingUrl(parcelId: number): Promise<string | null> {
  try {
    const data = await scFetch(`/parcels/${parcelId}`);
    return data?.parcel?.tracking_url || data?.data?.tracking_url || null;
  } catch {
    return null;
  }
}

// ── Country code normalizer ──
const COUNTRY_MAP: Record<string, string> = {
  'nederland': 'NL', 'the netherlands': 'NL', 'holland': 'NL',
  'belgië': 'BE', 'belgium': 'BE', 'belgique': 'BE',
  'deutschland': 'DE', 'germany': 'DE', 'allemagne': 'DE',
  'france': 'FR', 'frankrijk': 'FR',
  'spain': 'ES', 'españa': 'ES', 'spanje': 'ES',
  'united kingdom': 'GB', 'england': 'GB', 'uk': 'GB', 'groot-brittannië': 'GB',
  'united states': 'US', 'usa': 'US', 'amerika': 'US', 'verenigde staten': 'US',
  'italy': 'IT', 'italië': 'IT', 'italia': 'IT',
  'portugal': 'PT',
  'poland': 'PL', 'polen': 'PL', 'polska': 'PL',
  'austria': 'AT', 'oostenrijk': 'AT', 'österreich': 'AT',
  'switzerland': 'CH', 'zwitserland': 'CH', 'schweiz': 'CH',
  'sweden': 'SE', 'zweden': 'SE', 'sverige': 'SE',
  'denmark': 'DK', 'denemarken': 'DK', 'danmark': 'DK',
  'finland': 'FI', 'finnland': 'FI',
  'norway': 'NO', 'noorwegen': 'NO', 'norge': 'NO',
  'ireland': 'IE', 'ierland': 'IE',
  'luxembourg': 'LU', 'luxemburg': 'LU',
};

function normalizeCountryCode(code: string): string {
  if (!code) return 'NL';
  const trimmed = code.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const upper = trimmed.toUpperCase();
  if (upper.length === 2) return upper;
  const lower = trimmed.toLowerCase();
  return COUNTRY_MAP[lower] || trimmed.toUpperCase().slice(0, 2);
}

// ── Test Shipment (Unstamped Letter - free test label) ──
interface TestShipmentParams {
  receiverName: string;
  receiverAddress: string;
  receiverHouseNumber: string;
  receiverCity: string;
  receiverPostalCode: string;
  receiverCountry?: string;
  receiverPhone?: string;
  receiverEmail?: string;
  orderNumber?: string;
}

export async function createTestShipment(params: TestShipmentParams): Promise<any> {
  const settings = await getSendcloudSettings();

  let street: string = params.receiverAddress || '';
  let houseNumber: string = params.receiverHouseNumber || '';
  if (!houseNumber) {
    const match = street.match(/^(.*?)\s+(\d+\w*)$/);
    if (match) {
      street = match[1] || street;
      houseNumber = match[2] || houseNumber;
    }
  }

  const payload = {
    to_address: {
      name: params.receiverName,
      company_name: '',
      address_line_1: street,
      house_number: houseNumber,
      postal_code: params.receiverPostalCode,
      city: params.receiverCity,
      country_code: normalizeCountryCode(params.receiverCountry || 'NL'),
      phone_number: params.receiverPhone || '',
      email: params.receiverEmail || '',
    },
    from_address: {
      name: settings.senderName || 'ALRA LED Solutions',
      company_name: '',
      address_line_1: settings.senderAddress || '',
      house_number: settings.senderHouseNumber || '',
      postal_code: settings.senderPostalCode || '',
      city: settings.senderCity || '',
      country_code: normalizeCountryCode(settings.senderCountry || 'NL'),
      phone_number: settings.senderTelephone || '',
    },
    ship_with: {
      type: 'shipping_option_code',
      properties: {
        shipping_option_code: 'sendcloud:letter',
      },
    },
    order_number: params.orderNumber || `TEST-${Date.now()}`,
    parcels: [{
      weight: {
        value: '0.1',
        unit: 'kg',
      },
    }],
  };

  await logEvent('sendcloud', 'INFO', 'createTestShipment', `Test shipment aanmaken`, payload);
  const data = await scFetch('/shipments/announce', { method: 'POST', body: JSON.stringify(payload) });
  await logEvent('sendcloud', 'INFO', 'createTestShipment', `Test shipment aangemaakt`, data);
  return data?.data || data;
}
