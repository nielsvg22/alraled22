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
  enableEveningDelivery: false,
  enableSaturdayDelivery: false,
  enablePickupPoints: true,
  enableSignature: false,
  enableInsurance: false,
  insuranceAmount: 500,
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

export async function getSendcloudApiKey(): Promise<string> {
  const settings = await getSendcloudSettings();
  return settings.apiKey || '';
}

async function scFetch(path: string, options: RequestInit = {}): Promise<any> {
  const settings = await getSendcloudSettings();
  const apiKey = settings.apiKey;
  const apiSecret = settings.apiSecret;
  if (!apiKey || !apiSecret) {
    await logEvent('sendcloud', 'ERROR', 'scFetch', 'SendCloud API niet geconfigureerd');
    throw new Error('SendCloud API niet geconfigureerd');
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
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
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      },
      signal: controller.signal,
    } as any);
  } catch (fetchErr: any) {
    clearTimeout(timeout);
    const detail = {
      url,
      path,
      error: fetchErr.message,
      code: fetchErr.code,
      type: fetchErr.type,
      cause: fetchErr.cause?.message,
    };
    console.error('[sendcloud] Fetch failed:', detail);
    await logEvent('sendcloud', 'ERROR', 'scFetch', `Fetch fout naar ${url}: ${fetchErr.message}`, detail);
    throw fetchErr;
  }
  clearTimeout(timeout);

  const responseText = await res.text();
  let responseData;
  try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }

  if (!res.ok) {
    await logEvent('sendcloud', 'ERROR', 'scFetch', `API fout ${res.status}: ${responseText.slice(0, 500)}`, {
      status: res.status,
      path,
      response: responseData,
    });
    throw new Error(`SendCloud API fout (${res.status}): ${responseText}`);
  }

  await logEvent('sendcloud', 'INFO', 'scFetch', `Response OK: ${path}`, {
    status: res.status,
    response: typeof responseData === 'object' ? { ...responseData, shipping_methods: undefined } : 'OK',
  });

  return responseData;
}

async function scFetchV2(path: string, options: RequestInit = {}): Promise<any> {
  const settings = await getSendcloudSettings();
  const apiKey = settings.apiKey;
  const apiSecret = settings.apiSecret;
  if (!apiKey || !apiSecret) {
    await logEvent('sendcloud', 'ERROR', 'scFetchV2', 'SendCloud API niet geconfigureerd');
    throw new Error('SendCloud API niet geconfigureerd');
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const url = `${SENDCLOUD_API_V2}${path}`;

  await logEvent('sendcloud', 'INFO', 'scFetchV2', `Request: ${options.method || 'GET'} ${path}`, {
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
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      },
      signal: controller.signal,
    } as any);
  } catch (fetchErr: any) {
    clearTimeout(timeout);
    const detail = { url, path, error: fetchErr.message, code: fetchErr.code };
    console.error('[sendcloud] V2 Fetch failed:', detail);
    await logEvent('sendcloud', 'ERROR', 'scFetchV2', `Fetch fout naar ${url}: ${fetchErr.message}`, detail);
    throw fetchErr;
  }
  clearTimeout(timeout);

  const responseText = await res.text();
  let responseData;
  try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }

  if (!res.ok) {
    await logEvent('sendcloud', 'ERROR', 'scFetchV2', `API fout ${res.status}: ${responseText.slice(0, 500)}`, {
      status: res.status, path, response: responseData,
    });
    throw new Error(`SendCloud V2 API fout (${res.status}): ${responseText}`);
  }

  await logEvent('sendcloud', 'INFO', 'scFetchV2', `Response OK: ${path}`, {
    status: res.status, response: responseData,
  });

  return responseData;
}

export async function getShippingMethods(country: string = 'NL'): Promise<any[]> {
  try {
    // V3: get available shipping options
    const data = await scFetch('/shipping-options/return-a-list-of-available-shipping-options', {
      method: 'POST',
      body: JSON.stringify({
        from_country_code: 'NL',
        to_country_code: country,
        total_order_price: { value: '10.00', currency: 'EUR' },
        parcels: [{ weight: { value: '1.0', unit: 'kg' } }],
      }),
    });
    const methods = data?.shipping_options || data?.items || data || [];
    return Array.isArray(methods) ? methods : [];
  } catch (err) {
    console.error('Failed to fetch shipping methods via V3:', err);
    // Fallback to V2
    try {
      const data = await scFetchV2('/shipping-methods');
      const methods = data?.shipping_methods || data || [];
      return Array.isArray(methods) ? methods : [];
    } catch {
      return getFallbackMethods();
    }
  }
}

export async function getFallbackMethods(): Promise<any[]> {
  return [
    { id: 1, name: 'PostNL Standard', shipping_option_code: 'postnl:standard', price: 0, carrier: { name: 'PostNL' } },
    { id: 8, name: 'DHL Parcel', shipping_option_code: 'dhl Parcel NL:parcel', price: 0, carrier: { name: 'DHL' } },
    { id: 11, name: 'DPD', shipping_option_code: 'dpd:dpd_nl_32480', price: 0, carrier: { name: 'DPD' } },
  ];
}

export async function getShippingRates(fromPostalCode: string, toPostalCode: string, country: string, weight: number): Promise<any[]> {
  try {
    const methods = await getShippingMethods(country);
    return methods.map((m: any) => ({
      id: m.id,
      name: m.name,
      carrier: m.carrier?.name || 'Onbekend',
      price: m.price || 0,
      deliveryTime: m.delivery_time || '2-3 werkdagen',
      minWeight: m.min_weight || 0,
      maxWeight: m.max_weight || 30000,
    }));
  } catch {
    return getFallbackMethods();
  }
}

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
  shippingMethodId: number;
  weight?: number;
  reference?: string;
}

export async function createShipment(params: CreateShipmentParams): Promise<any> {
  const settings = await getSendcloudSettings();

  // Parse house number from address if empty
  let street: string = params.receiverAddress || '';
  let houseNumber: string = params.receiverHouseNumber || '';
  if (!houseNumber) {
    const match = street.match(/^(.*?)\s+(\d+\w*)$/);
    if (match) {
      street = match[1] || street;
      houseNumber = match[2] || houseNumber;
    }
  }

  // Resolve shipping option code from methods
  let shippingCode = 'postnl:standard'; // default
  try {
    const methods = await getShippingMethods('NL');
    const match = methods.find((m: any) => {
      const mId = m.id || m.shipping_method_id;
      return String(mId) === String(params.shippingMethodId);
    });
    if (match?.shipping_option_code) {
      shippingCode = match.shipping_option_code;
    }
    console.log('[sendcloud] Resolved shipping code:', shippingCode, 'from method ID:', params.shippingMethodId);
  } catch (e) {
    console.error('[sendcloud] Failed to resolve shipping code:', e);
  }

  const payload = {
    to_address: {
      name: params.receiverName,
      company_name: params.receiverCompany || '',
      address_line_1: street,
      house_number: houseNumber,
      postal_code: params.receiverPostalCode,
      city: params.receiverCity,
      country_code: params.receiverCountry || 'NL',
      phone_number: params.receiverPhone || '',
    },
    from_address: {
      sender_address_id: 1,
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

  console.log('[sendcloud] Creating shipment (V3):', JSON.stringify(payload, null, 2));
  await logEvent('sendcloud', 'INFO', 'createShipment', `Shipment aanmaken voor order ${params.orderNumber}`, payload, params.reference);
  const data = await scFetch('/shipments/announce', { method: 'POST', body: JSON.stringify(payload) });
  console.log('[sendcloud] Shipment created:', JSON.stringify(data, null, 2));
  await logEvent('sendcloud', 'INFO', 'createShipment', `Shipment aangemaakt`, data, params.reference);
  return data?.data || data;
}

export async function getShipmentLabel(parcelId: number): Promise<Buffer | null> {
  try {
    const settings = await getSendcloudSettings();
    const auth = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
    const res = await fetch(`${SENDCLOUD_API_V3}/parcels/${parcelId}/documents/label`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    if (!res.ok) return null;
    return Buffer.from(await res.buffer());
  } catch {
    return null;
  }
}

export async function getTrackingUrl(parcelId: number): Promise<string | null> {
  try {
    const data = await scFetch(`/parcels/${parcelId}`);
    return data?.parcel?.tracking_url || data?.data?.tracking_url || null;
  } catch {
    return null;
  }
}
