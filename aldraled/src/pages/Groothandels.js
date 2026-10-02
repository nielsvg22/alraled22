import React from 'react';
import { Link } from 'react-router-dom';
import DealersMap from './DealersMap';
import { ROUTES } from '../lib/routes';

const Groothandels = () => {
  return (
    <div className="bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Groothandels</p>
          <h1 className="text-3xl md:text-4xl font-black text-secondary">Groothandels & Distributeurs</h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            ALRA LED werkt samen met een landelijk netwerk van groothandels en distributeurs.
            Zoek een locatie in uw buurt voor zakelijke afname en advies.
          </p>
        </div>
      </div>

      <DealersMap />

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        <div className="bg-secondary rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
            Wilt u groothandel worden?
          </h2>
          <p className="text-white/60 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Bent u een groothandel in elektrotechnische materialen, verlichting of installatiemateriaal
            en wilt u ALRA LED-producten in uw assortiment opnemen? Neem contact met ons op voor de mogelijkheden.
          </p>
          <Link
            to={ROUTES.contact}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-7 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30"
          >
            Contact opnemen
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Groothandels;