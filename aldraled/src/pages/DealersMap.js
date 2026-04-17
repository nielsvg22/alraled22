import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const c = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  return 2 * R * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

function normalizeText(v) {
  return String(v || '').trim();
}

export default function DealersMap() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const searchMarkerRef = useRef(null);

  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [radiusKm, setRadiusKm] = useState(50);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/content/dealers`)
      .then((res) => setDealers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDealers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = normalizeText(query);
    if (!q || q.length < 3) {
      setSearchResults([]);
      return;
    }

    let alive = true;
    setSearchLoading(true);
    const t = setTimeout(() => {
      axios.get(`${API_URL}/api/geo/search`, { params: { q, limit: 6 } })
        .then((res) => {
          if (!alive) return;
          setSearchResults(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => { if (alive) setSearchResults([]); })
        .finally(() => { if (alive) setSearchLoading(false); });
    }, 250);

    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  const dealersWithDistance = useMemo(() => {
    const normalized = (Array.isArray(dealers) ? dealers : []).map((d) => ({
      ...d,
      lat: Number(d.lat),
      lon: Number(d.lon),
    })).filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lon));

    if (!origin) return normalized.map((d) => ({ ...d, distanceKm: null }));

    return normalized
      .map((d) => ({ ...d, distanceKm: haversineKm(origin, { lat: d.lat, lon: d.lon }) }))
      .filter((d) => d.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [dealers, origin, radiusKm]);

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });

    const map = L.map(mapElRef.current, { zoomControl: true, scrollWheelZoom: true });
    map.setView([52.1326, 5.2913], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const markers = L.layerGroup().addTo(map);
    markersRef.current = markers;
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    const bounds = [];

    dealersWithDistance.forEach((d) => {
      const marker = L.marker([d.lat, d.lon]);
      const distanceLine = typeof d.distanceKm === 'number' ? `<div style="margin-top:6px;"><strong>${d.distanceKm.toFixed(1)} km</strong></div>` : '';
      const websiteLine = d.website ? `<div style="margin-top:6px;"><a href="${d.website}" target="_blank" rel="noreferrer">Website</a></div>` : '';
      const phoneLine = d.phone ? `<div style="margin-top:6px;">${d.phone}</div>` : '';
      marker.bindPopup(
        `<div style="min-width:220px;">
          <div style="font-weight:800;">${d.name || 'Verkooppunt'}</div>
          <div style="opacity:0.8;margin-top:4px;">${d.address || ''}</div>
          ${distanceLine}
          ${phoneLine}
          ${websiteLine}
        </div>`
      );
      marker.addTo(markers);
      bounds.push([d.lat, d.lon]);
    });

    if (origin) {
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
      }
      searchMarkerRef.current = L.circleMarker([origin.lat, origin.lon], {
        radius: 8,
        color: '#2563eb',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 0.2,
      }).addTo(map);
      bounds.push([origin.lat, origin.lon]);
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [dealersWithDistance, origin]);

  const openInMapsUrl = (d) => {
    const q = encodeURIComponent(d.address || `${d.lat},${d.lon}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  };

  return (
    <div className="bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Verkooppunten</p>
          <h1 className="text-3xl md:text-4xl font-black text-secondary">Waar te koop</h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            Zoek een locatie en bekijk verkooppunten in de buurt. Afstanden worden weergegeven in kilometers.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="space-y-2">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Zoek locatie</p>
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Typ plaats of adres..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-primary focus:outline-none transition-colors pr-10"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden bg-white">
                    {searchResults.map((r) => (
                      <button
                        key={r.place_id}
                        type="button"
                        onClick={() => {
                          const next = { lat: Number(r.lat), lon: Number(r.lon) };
                          setOrigin(next);
                          setQuery(r.display_name);
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        {r.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Straal</p>
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none"
                    disabled={!origin}
                  >
                    {[10, 25, 50, 100, 200].map((km) => (
                      <option key={km} value={km}>{km} km</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => { setOrigin(null); setRadiusKm(50); }}
                  className="mt-6 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-black text-secondary">Resultaten</p>
                {origin && (
                  <p className="text-xs text-gray-400 font-semibold">{dealersWithDistance.length} binnen {radiusKm} km</p>
                )}
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-sm text-gray-400">Laden...</div>
                ) : dealersWithDistance.length === 0 ? (
                  <div className="p-6 text-sm text-gray-400">
                    {origin ? 'Geen verkooppunten gevonden binnen deze straal.' : 'Geen verkooppunten gevonden.'}
                  </div>
                ) : (
                  dealersWithDistance.map((d) => (
                    <div key={d.id} className="p-5 border-b border-gray-50 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-secondary truncate">{d.name || 'Verkooppunt'}</p>
                          <p className="text-xs text-gray-400 mt-1">{d.address}</p>
                        </div>
                        {typeof d.distanceKm === 'number' && (
                          <span className="shrink-0 text-xs font-black text-primary bg-primary/10 rounded-full px-2 py-1">
                            {d.distanceKm.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={openInMapsUrl(d)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Open in Maps
                        </a>
                        {d.website && (
                          <a
                            href={d.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-secondary hover:text-primary transition-colors"
                          >
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div ref={mapElRef} className="w-full h-[360px] sm:h-[420px] md:h-[500px] lg:h-[560px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
