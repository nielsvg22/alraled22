import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import { errorText } from '../lib/errorText';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needCode, setNeedCode] = useState(false);
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await login(email, password, needCode ? { code, remember } : {});
      if (data?.twoFactorRequired && !data?.token) { setNeedCode(true); return; }
      const target = data?.user?.role === 'ADMIN' ? '/users' : '/';
      window.location.assign(target);
    } catch (err) {
      console.error('Login error:', err);
      setError(errorText(err, 'Login failed'));
      if (needCode) setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to CRM</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center">{String(error)}</div>}
          {needCode && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">Open je authenticator-app en vul de 6-cijferige code in (of een herstelcode).</p>
              <input
                autoFocus
                inputMode="text"
                autoComplete="one-time-code"
                className="block w-full px-3 py-3 border border-gray-300 rounded-md text-center text-xl tracking-[0.3em] text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Onthoud dit apparaat 1 dag
              </label>
              <button type="button" className="text-xs text-blue-600 hover:text-blue-500" onClick={() => { setNeedCode(false); setCode(''); setError(''); }}>← Terug naar inloggen</button>
            </div>
          )}
          <div className={`rounded-md shadow-sm -space-y-px ${needCode ? 'hidden' : ''}`}>
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="text-center text-sm">
            <Link to="/register" className="text-blue-600 hover:text-blue-500">
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
