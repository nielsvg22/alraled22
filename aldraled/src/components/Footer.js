import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DEFAULTS = {
  tagline: '',
  footerDescription: 'Specialist in professionele LED-verlichting voor bedrijfswagens, bouwplaatsen en werkplaatsen. Kwaliteit en betrouwbaarheid voorop.',
  footerPhone: '085-0021 606',
  footerEmail: 'info@alra-led.nl',
  footerAddress: 'Dijkgraafweg 4a, Apeldoorn',
  newsletterTitle: 'Blijf op de hoogte',
  newsletterText: 'Ontvang nieuws, productlanceringen en exclusieve aanbiedingen.',
  newsletterPlaceholder: 'uw@email.nl',
  newsletterButton: 'Aanmelden',
  navigationTitle: 'Navigatie',
  productsTitle: 'Producten',
  contactTitle: 'Contact',
  productLinks: ['Bedrijfswagenverlichting', 'LED Bouwlichtslangen', 'LED Hefbrugverlichting', 'Accessoires'],
  privacyLabel: 'Privacy Policy',
  termsLabel: 'Algemene Voorwaarden',
  bottomCopy: 'ALRA LED Solutions. Alle rechten voorbehouden.',
};

const Footer = () => {
  const { i18n } = useTranslation();
  const [general, setGeneral] = useState(DEFAULTS);

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
    axios.get(`${API_URL}/api/content/general`, { params: { lang } })
      .then(res => setGeneral({ ...DEFAULTS, ...res.data }))
      .catch(() => {});
  }, [i18n.resolvedLanguage, i18n.language]);

  return (
    <footer className="bg-secondary text-white">
      {/* Newsletter bar */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-black text-white">{general.newsletterTitle}</h3>
            <p className="text-white/50 text-xs mt-0.5">{general.newsletterText}</p>
          </div>
          <form className="flex w-full md:w-auto gap-2" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              placeholder={general.newsletterPlaceholder}
              className="flex-1 md:w-64 bg-white/10 border border-white/10 text-white placeholder-white/30 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:border-primary transition-colors"
            />
            <button type="submit" className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-full hover:brightness-110 transition-all shrink-0">
              {general.newsletterButton}
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="text-xl font-black tracking-tight">
              ALRA<span className="text-primary">LED</span>
            </Link>
            <p className="text-white/40 text-xs leading-relaxed">
              {general.footerDescription}
            </p>
            <div className="flex gap-3 pt-1">
              {['Li', 'Ig', 'Fb'].map(s => (
                <a key={s} href="#!" className="w-8 h-8 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center text-[10px] font-bold text-white/60 hover:text-white transition-all">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{general.navigationTitle}</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/over-ons', label: 'Over ons' },
                { to: '/producten', label: 'Webshop' },
                { to: '/contact', label: 'Contact' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/60 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{general.productsTitle}</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              {(Array.isArray(general.productLinks) ? general.productLinks : []).map((label, index) => (
                <li key={`${label}-${index}`} className="hover:text-white transition-colors cursor-pointer">{label}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{general.contactTitle}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <span className="mt-0.5 text-primary text-xs">📍</span>
                <span>{general.footerAddress}</span>
              </li>
              <li>
                <a href={`tel:${String(general.footerPhone || '').replace(/-/g, '')}`} className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors">
                  <span className="text-primary text-xs">📞</span> {general.footerPhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${general.footerEmail}`} className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors">
                  <span className="text-primary text-xs">✉️</span> {general.footerEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/30">
          <span>© {new Date().getFullYear()} {general.bottomCopy}</span>
          <div className="flex gap-5">
            <a href="#!" className="hover:text-white/60 transition-colors">{general.privacyLabel}</a>
            <a href="#!" className="hover:text-white/60 transition-colors">{general.termsLabel}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
