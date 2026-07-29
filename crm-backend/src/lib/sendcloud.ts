import { db } from './db';
import { sendcloudConfig } from '../db/schema';
import { eq } from 'drizzle-orm';

const SENDCLOUD_API_V2 = 'https://panel.sendcloud.sc/api/v2';
const SENDCLOUD_API_V3 = 'https://api.sendcloud.sc/v3';

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
      await db.insert(sendcloudConfig).values({ key, value: String(value) })
        .onDuplicateKeyUpdate({ value: String(value) });
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
  if (!apiKey || !apiSecret) throw new Error('SendCloud API niet geconfigureerd');

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const res = await fetch(`${SENDCLOUD_API_V3}${path}`, {
    ...options,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendCloud API fout (${res.status}): ${body}`);
  }
  return res.json();
}

export async function getShippingMethods(country: string = 'NL'): Promise<any[]> {
  try {
    const data = await scFetch('/shipping_methods');
    const methods = data?.shipping_methods || data || [];
    return methods.filter((m: any) => {
      if (!m.countries) return true;
      return m.countries.some((c: any) => c.iso_2 === country);
    });
  } catch (err) {
    console.error('Failed to fetch shipping methods:', err);
    return getFallbackMethods();
  }
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

function getFallbackMethods(): any[] {
  return [
    { id: 1, name: 'Standaard verzending', carrier: 'PostNL', price: 6.95, deliveryTime: '2-3 werkdagen', minWeight: 0, maxWeight: 30000 },
    { id: 8, name: 'DHL Pakket', carrier: 'DHL', price: 5.95, deliveryTime: '1-2 werkdagen', minWeight: 0, maxWeight: 30000 },
    { id: 11, name: 'DPD Pakket', carrier: 'DPD', price: 5.49, deliveryTime: '1-2 werkdagen', minWeight: 0, maxWeight: 30000 },
  ];
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
  const payload = {
    shipment: {
      carrier_id: params.shippingMethodId,
      sender_address: {
        contact_name: settings.senderName || 'ALRA LED Solutions',
        street: settings.senderAddress || '',
        house_number: settings.senderHouseNumber || '',
        city: settings.senderCity || '',
        postal_code: settings.senderPostalCode || '',
        country: settings.senderCountry || 'NL',
        telephone: settings.senderTelephone || '',
      },
      receiver_address: {
        contact_name: params.receiverName,
        company_name: params.receiverCompany || '',
        street: params.receiverAddress,
        house_number: params.receiverHouseNumber,
        city: params.receiverCity,
        postal_code: params.receiverPostalCode,
        country: params.receiverCountry,
        telephone: params.receiverPhone || '',
      },
      order_number: params.orderNumber,
      weight: params.weight || 500,
      reference: params.reference || '',
      custom_fields: [],
    },
  };

  const data = await scFetch('/shipments', { method: 'POST', body: JSON.stringify(payload) });
  return data?.shipment || data;
}

export async function getShipmentLabel(shipmentId: number): Promise<Buffer | null> {
  try {
    const settings = await getSendcloudSettings();
    const auth = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
    const res = await fetch(`${SENDCLOUD_API_V2}/shipments/${shipmentId}/label`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function getTrackingUrl(shipmentId: number): Promise<string | null> {
  try {
    const data = await scFetch(`/shipments/${shipmentId}`);
    return data?.shipment?.tracking_url || null;
  } catch {
    return null;
  }
}
