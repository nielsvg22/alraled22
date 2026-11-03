import { getContent } from '../db/contentRepo';

// Staffelkorting: automatisch percentage korting per product vanaf een aantal stuks (instelbaar in het CRM, tab Staffelkorting).
export type VolumeTier = { minQty: number; percent: number };
export type VolumeDiscountConfig = { enabled: boolean; tiers: VolumeTier[] };

export const DEFAULT_VOLUME_DISCOUNT: VolumeDiscountConfig = { enabled: true, tiers: [{ minQty: 10, percent: 10 }] };

let cache: { at: number; value: VolumeDiscountConfig } | null = null;

export function normalizeVolumeConfig(raw: any): VolumeDiscountConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_VOLUME_DISCOUNT;
  const tiers: VolumeTier[] = (Array.isArray(raw.tiers) ? raw.tiers : [])
    .map((t: any) => ({ minQty: Math.floor(Number(t?.minQty)), percent: Number(t?.percent) }))
    .filter((t: VolumeTier) => Number.isFinite(t.minQty) && t.minQty >= 2 && Number.isFinite(t.percent) && t.percent > 0 && t.percent <= 90)
    .sort((a: VolumeTier, b: VolumeTier) => a.minQty - b.minQty);
  return { enabled: raw.enabled !== false, tiers };
}

export async function getVolumeDiscountConfig(): Promise<VolumeDiscountConfig> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  let value = DEFAULT_VOLUME_DISCOUNT;
  try { value = normalizeVolumeConfig(await getContent('volume_discount')); } catch { /* standaard */ }
  cache = { at: Date.now(), value };
  return value;
}

export function clearVolumeDiscountCache() { cache = null; }

// Hoogste staffel waarvan het minimum bereikt is (0 = geen korting)
export function volumePercentFor(config: VolumeDiscountConfig, quantity: number): { percent: number; minQty: number } {
  if (!config.enabled) return { percent: 0, minQty: 0 };
  let best = { percent: 0, minQty: 0 };
  for (const t of config.tiers) if (quantity >= t.minQty && t.percent >= best.percent) best = { percent: t.percent, minQty: t.minQty };
  return best;
}
