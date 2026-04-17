import React, { useState, useEffect } from 'react';

const PasswordWall = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(false);

  const STAGING_PASSWORD = process.env.REACT_APP_STAGING_PASSWORD || 'test1234';

  useEffect(() => {
    const auth = localStorage.getItem('staging_authorized');
    if (auth === 'true' || process.env.NODE_ENV === 'development') {
      setIsAuthorized(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === STAGING_PASSWORD) {
      localStorage.setItem('staging_authorized', 'true');
      setIsAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (isAuthorized) return children;

  return (
    <div className="fixed inset-0 z-[9999] bg-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 shadow-2xl space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-secondary uppercase italic tracking-tighter">Test<span className="text-primary">Omgeving</span></h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Voer het wachtwoord in om de site te bekijken</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wachtwoord"
              className={`w-full bg-gray-50 border-2 ${error ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all font-bold text-center tracking-[0.5em]`}
              autoFocus
            />
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Onjuist wachtwoord</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-secondary text-white py-5 rounded-2xl font-black text-sm uppercase italic shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Toegang Krijgen
          </button>
        </form>

        <p className="text-[10px] text-gray-300 font-medium">© 2024 ALRA LED Solutions Staging</p>
      </div>
    </div>
  );
};

export default PasswordWall;
