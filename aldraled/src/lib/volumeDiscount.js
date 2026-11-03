import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from './api';

// Staffelkorting (instelbaar in het CRM onder Staffelkorting). Zelfde standaard en afronding als de server;
// de server rekent bij bestellen en offertes definitief na.
export const DEFAULT_VOLUME_DISCOUNT = { enabled: true, tiers: [{ minQty: 10, percent: 10 }] };

export function normalizeVolumeConfig(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_VOLUME_DISCOUNT;
  const tiers = (Array.isArray(raw.tiers) ? raw.tiers : [])
    .map(t => ({ minQty: Math.floor(Number(t && t.minQty)), percent: Number(t && t.percent) }))
    .filter(t => Number.isFinite(t.minQty) && t.minQty >= 2 && Number.isFinite(t.percent) && t.percent > 0 && t.percent <= 90)
    .sort((a, b) => a.minQty - b.minQty);
  return { enabled: raw.enabled !== false, tiers };
}

export function volumeFor(config, quantity) {
  if (!config || !config.enabled) return { percent: 0, minQty: 0 };
  let best = { percent: 0, minQty: 0 };
  (config.tiers || []).forEach(t => { if (quantity >= t.minQty && t.percent >= best.percent) best = { percent: t.percent, minQty: t.minQty }; });
  return best;
}

export function discountedUnitPrice(price, percent) {
  const v = Number(price || 0) * (1 - Math.max(0, Math.min(100, percent || 0)) / 100);
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

let cached = null;
let inflight = null;
function load() {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = axios.get(`${API_URL}/api/content/volume_discount`)
      .then(res => { cached = normalizeVolumeConfig(res.data); return cached; })
      .catch(() => { cached = DEFAULT_VOLUME_DISCOUNT; return cached; });
  }
  return inflight;
}

export function useVolumeDiscount() {
  const [config, setConfig] = useState(cached || DEFAULT_VOLUME_DISCOUNT);
  useEffect(() => { let alive = true; load().then(c => { if (alive) setConfig(c); }); return () => { alive = false; }; }, []);
  return config;
}
