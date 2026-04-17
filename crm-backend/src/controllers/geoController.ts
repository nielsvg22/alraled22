import { Request, Response } from 'express';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function normalizeQuery(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  return String(value ?? '').trim();
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export const searchLocations = async (req: Request, res: Response) => {
  const q = normalizeQuery(req.query.q);
  if (!q) return res.status(400).json({ error: 'Missing q' });

  const limitParam = toNumber(req.query.limit);
  const limit = limitParam ? Math.max(1, Math.min(10, Math.floor(limitParam))) : 6;

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', String(limit));

  const userAgent = process.env.NOMINATIM_USER_AGENT || 'aldraled-crm-backend';

  try {
    const resp = await fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
    });

    if (!resp.ok) {
      return res.status(502).json({ error: 'Geocoding failed' });
    }

    const raw = await resp.json();
    const results = Array.isArray(raw) ? raw : [];

    res.json(results.map((r: any) => ({
      place_id: r.place_id,
      display_name: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
      type: r.type,
      category: r.category,
      address: r.address,
    })));
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Geocoding failed' });
  }
};

