import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { errorText } from '../lib/errorText';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needCode, setNeedCode] = useState(false);
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const { login, loginSetup, loginEnable, finishLogin } = useAuth();
  const [setup, setSetup] = useState(null); // { setupToken, secret, qr }
  const [done, setDone] = useState(null); // antwoord na instellen: token + herstelcodes
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await login(email, password, needCode ? { code, remember } : {});
      if (data?.twoFactorRequired && !data?.token) { setNeedCode(true); return; }
      if (data?.twoFactorSetupRequired && !data?.token) {
        const s = await loginSetup(data.setupToken);
        const qr = await QRCode.toDataURL(s.otpauthUrl, { width: 200, margin: 1 });
        setSetup({ setupToken: data.setupToken, secret: s.secret, qr });
        setCode('');
        return;
      }
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

  const confirmSetup = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await loginEnable(setup.setupToken, code, remember);
      setDone(data);
    } catch (err) {
      setError(errorText(err, 'Code klopt niet'));
      if (err?.response?.status === 401) { setSetup(null); }
    } finally {
      setSubmitting(false);
    }
  };

  const continueAfterSetup = () => {
    const data = finishLogin(done);
    window.location.assign(data?.user?.role === 'ADMIN' ? '/users' : '/');
  };

  // Na het instellen: herstelcodes tonen (eenmalig) en daarna pas de sessie starten
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-5 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Twee-staps verificatie staat aan</h2>
          </div>
          <p className="text-sm text-gray-600">Bewaar deze herstelcodes veilig (bijvoorbeeld in een wachtwoordmanager). Raak je telefoon kwijt, dan kom je er met één van deze codes nog in. Elke code werkt één keer en wordt maar nu getoond.</p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-gray-50 border border-gray-100 rounded-xl p-4">
            {(done.backupCodes || []).map((c) => <span key={c}>{c}</span>)}
          </div>
          <button type="button" onClick={() => { try { navigator.clipboard.writeText((done.backupCodes || []).join('\n')); } catch { /* handmatig kopiëren */ } }} className="text-sm text-blue-600 hover:text-blue-500">Kopieer codes</button>
          <button type="button" onClick={continueAfterSetup} className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Ik heb ze bewaard — doorgaan</button>
        </div>
      </div>
    );
  }

  // Verplicht instellen tijdens het inloggen (admin zonder 2FA)
  if (setup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form onSubmit={confirmSetup} className="max-w-md w-full space-y-5 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Beveilig je account</h2>
            <p className="mt-2 text-sm text-gray-600">Admin-accounts gebruiken twee-staps verificatie. Het instellen duurt 2 minuten.</p>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{String(error)}</div>}
          <ol className="text-sm text-gray-600 space-y-1 list-decimal pl-5">
            <li>Open een authenticator-app (Google/Microsoft Authenticator, 1Password, Authy) en kies "account toevoegen".</li>
            <li>Scan de QR-code of typ de sleutel in.</li>
            <li>Vul de 6-cijferige code uit de app in.</li>
          </ol>
          <div className="flex flex-col items-center gap-3">
            <img src={setup.qr} alt="QR-code voor je authenticator-app" className="w-[200px] h-[200px] rounded-lg border border-gray-100" />
            <code className="block break-all bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 text-center">{setup.secret}</code>
          </div>
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            className="block w-full px-3 py-3 border border-gray-300 rounded-md text-center text-xl tracking-[0.3em] text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Onthoud dit apparaat 1 dag
          </label>
          <button type="submit" disabled={submitting || code.length !== 6} className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Controleren...' : 'Bevestigen en inloggen'}
          </button>
          <button type="button" className="text-xs text-blue-600 hover:text-blue-500" onClick={() => { setSetup(null); setCode(''); setError(''); }}>← Terug naar inloggen</button>
        </form>
      </div>
    );
  }

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
