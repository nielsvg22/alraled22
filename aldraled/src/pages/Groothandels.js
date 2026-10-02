import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getMediaUrl, API_URL } from '../lib/api';
import { ROUTES } from '../lib/routes';

const WHOLESALE_BRANDS = [
  {
    id: 'mastermate',
    name: 'Mastermate',
    description: 'Nederlands groothandelsnetwerk voor elektrotechnische materialen, verlichting en installatietechniek. Ruim 48 vestigingen landelijk.',
    website: 'https://www.mastermate.nl',
    categoryFilter: ['bedrijfswagen', 'bouw', 'hefbrug', 'werkverlichting', 'veiligheid'],
  },
  {
    id: 'aic-visser',
    name: 'AIC Visser',
    description: 'Specialist in verlichting, elektromateriaal en installatietechniek. Drie vestigingen in Harderwijk, Assen en Veghel.',
    website: 'https://www.aic.nl',
    categoryFilter: ['bedrijfswagen', 'bouw', 'werkverlichting'],
  },
  {
    id: 'reco',
    name: 'RECO Bouwplaatsbeveiliging',
    description: 'Expert in bouwplaatsbeveiliging en perimeterebeveiliging. Vestiging in Diemen.',
    website: '',
    categoryFilter: ['veiligheid', 'bouw'],
  },
  {
    id: 'hoegen',
    name: 'Hoegen Elektro & Diesel Parts',
    description: 'Leverancier van elektrotechnische onderdelen en diesel componenten. Vestiging in Apeldoorn.',
    website: '',
    categoryFilter: ['bedrijfswagen', 'werkverlichting'],
  },
];

const Groothandels = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/products`)
      .then(res => setProducts(res.data))
      .catch(() => {});
  }, []);

  // Find representative product image for each brand
  const brandImages = useMemo(() => {
    const images = {};
    WHOLESALE_BRANDS.forEach(brand => {
      const matchingProducts = products.filter(p => {
        const cat = (p.category || '').toLowerCase();
        return brand.categoryFilter.some(filter => cat.includes(filter));
      });
      // Use the first product with an image
      const withImage = matchingProducts.find(p => p.imageUrl);
      images[brand.id] = withImage ? getMediaUrl(withImage.imageUrl) : null;
    });
    return images;
  }, [products]);

  // Filter products that are relevant for wholesalers (professional/bulk)
  const wholesaleProducts = useMemo(() => {
    return products.filter(p => {
      const cat = (p.category || '').toLowerCase();
      return cat.includes('bedrijfswagen') || cat.includes('bouw') || cat.includes('hefbrug') || cat.includes('werkverlichting') || cat.includes('veiligheid');
    }).slice(0, 8);
  }, [products]);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/80 to-secondary/60" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-20 lg:py-28">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Voor Groothandels
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              Partners in<br />
              <span className="text-primary">professionele verlichting</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl leading-relaxed font-light">
              ALRA LED levert gecertificeerde LED-verlichting aan groothandels en distributeurs in Nederland en België.
              Scherpe condities, directe leverbaarheid uit eigen voorraad en persoonlijk advies.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to={ROUTES.contact} className="bg-primary text-white px-8 py-4 rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30">
                Word partner
              </Link>
              <Link to={ROUTES.shop} className="bg-white/10 backdrop-blur border border-white/20 text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-white/20 transition-all">
                Bekijk assortiment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Wholesale Brands */}
      <section className="py-16 lg:py-24 px-6 md:px-10 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Onze Groothandelspartners</p>
            <h2 className="text-3xl md:text-4xl font-black text-secondary">Landelijke dekking via sterke partners</h2>
            <p className="text-gray-500 text-base mt-4 max-w-2xl mx-auto">
              Onze producten zijn verkrijgbaar via een geselecteerd netwerk van professionele groothandels.
              Elke partner heeft een eigen specialisatie en regio waar ze marktleider zijn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHOLESALE_BRANDS.map((brand) => {
              const brandImage = brandImages[brand.id];
              return (
                <article key={brand.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
                    {brandImage ? (
                      <img src={brandImage} alt={brand.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async" />
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <span className="text-3xl font-black text-primary">{brand.name.charAt(0)}</span>
                        </div>
                        <p className="text-sm text-gray-400">Geen afbeelding beschikbaar</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-black text-secondary group-hover:text-primary transition-colors">{brand.name}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{brand.description}</p>
                    {brand.website && (
                      <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary text-sm font-bold hover:underline">
                        Website <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product Highlights for Wholesale */}
      <section className="py-16 lg:py-24 px-6 md:px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Topproducten voor Groothandel</p>
            <h2 className="text-3xl md:text-4xl font-black text-secondary">Meestgevraagd assortiment</h2>
            <p className="text-gray-500 text-base mt-4 max-w-2xl mx-auto">
              Deze producten lopen het beste bij onze groothandelspartners. Direct leverbaar uit voorraad.
            </p>
          </div>

          {wholesaleProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {wholesaleProducts.map(product => (
                <Link key={product.id} to={ROUTES.product(product.id)} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-square bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
                    <img src={getMediaUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-5 space-y-2">
                    {product.category && (
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{product.category}</span>
                    )}
                    <h3 className="font-bold text-secondary text-base group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                    <p className="text-lg font-black text-secondary">{product.price > 0 ? `€ ${product.price.toFixed(2).replace('.', ',')}` : 'Op aanvraag'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits for Wholesalers */}
      <section className="py-16 lg:py-24 px-6 md:px-10 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Waarom ALRA?</p>
            <h2 className="text-3xl md:text-4xl font-black text-secondary">Uw voordelen als groothandelspartner</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📦', title: 'Ruime voorraad', items: ['Direct leverbaar uit eigen magazijn', 'Geen lange levertijden', 'Ook grotere aantallen mogelijk'] },
              { icon: '📋', title: 'Professioneel gemerkt', items: ['Alle producten CE & RoHS gecertificeerd', 'Technische fiches beschikbaar', 'Meertalige documentatie'] },
              { icon: '🤝', title: 'Samenwerken op maat', items: ['Scherpe inkoopcondities', 'Marketingondersteuning', 'Technische training mogelijk'] },
            ].map((benefit, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-black text-secondary mb-4">{benefit.title}</h3>
                <ul className="space-y-2">
                  {benefit.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-600 text-sm">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 px-6 md:px-10 bg-secondary">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Klaar om samen te gaan?
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Neem contact op voor een vrijblijvend gesprek over de mogelijkheden, condities en ons assortiment.
          </p>
          <Link to={ROUTES.contact} className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30">
            Contact opnemen <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Groothandels;