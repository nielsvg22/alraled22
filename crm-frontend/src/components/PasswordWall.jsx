import React, { useState, useEffect } from 'react';

const PasswordWall = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(false);

  // In Vite env vars must start with VITE_
  const STAGING_PASSWORD = import.meta.env.VITE_STAGING_PASSWORD || 'admin1234';

  useEffect(() => {
    const auth = localStorage.getItem('crm_staging_authorized');
    if (auth === 'true' || import.meta.env.DEV) {
      setIsAuthorized(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === STAGING_PASSWORD) {
      localStorage.setItem('crm_staging_authorized', 'true');
      setIsAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (isAuthorized) return children;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-2xl space-y-8 text-center border border-slate-100">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRM <span className="text-blue-600">Staging</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Voer het systeemwachtwoord in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-slate-50 border-2 ${error ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-center tracking-[0.5em] text-slate-900`}
              autoFocus
            />
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Toegang geweigerd</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 active:scale-95 transition-all"
          >
            Systeem Ontgrendelen
          </button>
        </form>

        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Beveiligde Toegang • ALRA LED CRM</p>
      </div>
    </div>
  );
};

export default PasswordWall;
