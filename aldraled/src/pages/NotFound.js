import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-8xl font-black text-primary/10 mb-4">404</p>
      <h1 className="text-3xl md:text-4xl font-black text-secondary mb-3">Pagina niet gevonden</h1>
      <p className="text-gray-400 text-sm max-w-md mb-8">De pagina die u zoekt bestaat niet of is verplaatst.</p>
      <div className="flex gap-3">
        <Link to="/" className="bg-primary text-white px-7 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30">
          Naar de homepagina
        </Link>
        <Link to="/producten" className="bg-gray-100 text-secondary px-7 py-3 rounded-full font-bold text-sm hover:bg-gray-200 transition-all">
          Bekijk producten
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
