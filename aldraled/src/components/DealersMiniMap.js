import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildDealerAddress } from '../lib/dealers';

const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Kaartje met een pin per verkooppunt. De pinnen volgen het filter en de zoekopdracht van de lijst eronder.
export default function DealersMiniMap({ dealers = [], className = '' }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return undefined;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });
    const map = L.map(elRef.current, { scrollWheelZoom: false });
    map.setView([52.1326, 5.2913], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const bounds = [];
    dealers.forEach((d) => {
      const lat = Number(d.lat);
      const lon = Number(d.lon);
      // Zonder geldige coördinaten zou de pin op 0,0 (Afrika) belanden
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || (Math.abs(lat) < 1 && Math.abs(lon) < 1)) return;
      const address = buildDealerAddress(d);
      const html = `<strong>${esc(d.name)}</strong><br/>${esc(d.address)}<br/>${esc([d.postalCode, d.city].filter(Boolean).join(' '))}`
        + `<div style="margin-top:6px"><a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}" target="_blank" rel="noopener noreferrer">Route</a></div>`;
      L.marker([lat, lon]).bindPopup(html).addTo(layer);
      bounds.push([lat, lon]);
    });
    // Pas inzoomen als de kaart zijn definitieve grootte heeft
    const t = setTimeout(() => {
      map.invalidateSize();
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11, animate: false });
      else if (bounds.length === 1) map.setView(bounds[0], 11, { animate: false });
      else map.setView([52.1326, 5.2913], 7, { animate: false });
    }, 50);
    return () => clearTimeout(t);
  }, [dealers]);

  return <div ref={elRef} role="region" aria-label="Kaart met verkooppunten" className={`w-full h-[340px] md:h-[540px] rounded-2xl border border-[#E4EAF1] overflow-hidden z-0 ${className}`} />;
}
