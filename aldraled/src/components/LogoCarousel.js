import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getMediaUrl } from '../lib/api';

export default function LogoCarousel() {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    // API_URL should be imported from lib/api or kept local if needed, 
    // but getMediaUrl uses the centralized one.
    const url = (process.env.REACT_APP_API_URL || 'http://localhost:5000').trim();
    axios.get(`${url}/api/content/logos`)
      .then(r => setLogos(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLogos([]));
  }, []);

  if (!logos.length) return null;

  return (
    <section className="py-14 border-y border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-gray-800 mb-10">
          Groothandels waar onze producten te koop zijn:
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center justify-center h-16 px-6">
              {logo.imageUrl ? (
                <img
                  src={getMediaUrl(logo.imageUrl)}
                  alt={logo.name || 'Partner'}
                  className="max-h-14 max-w-[160px] object-contain"
                  style={{ filter: 'brightness(0) saturate(100%)' }}
                />
              ) : (
                <span className="text-base font-black text-gray-900 uppercase tracking-wider whitespace-nowrap">
                  {logo.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
