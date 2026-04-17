import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/account');
    } catch (err) {
      setError(t('login.invalidCredentials'));
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full -ml-72 -mt-72 blur-[100px]"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <h2 className="text-6xl font-black text-secondary uppercase italic tracking-tighter leading-none mb-4">
          {t('login.titlePrefix')}<span className="text-primary">{t('login.titleHighlight')}</span>
        </h2>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('login.subtitle')}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-12 px-10 shadow-2xl rounded-[3rem] border border-gray-100">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 font-black uppercase italic text-sm">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary uppercase tracking-widest px-2">{t('login.email')}</label>
              <input
                type="email"
                required
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-secondary uppercase tracking-widest px-2">{t('login.password')}</label>
              <input
                type="password"
                required
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full group relative overflow-hidden bg-secondary text-white px-8 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl"
            >
              <span className="relative z-10">{t('login.submit')}</span>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 font-medium">{t('login.noAccount')}</p>
            <Link to="/registreren" className="text-secondary font-black uppercase italic hover:text-primary transition-colors">
              {t('login.createAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
