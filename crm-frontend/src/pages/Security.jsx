import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, ShieldAlert, Copy, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { errorText } from '../lib/errorText';

const iCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

// Twee-staps verificatie (authenticator-app) voor admins
export default function Security() {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [setup, setSetup] = useState(null); // { secret, otpauthUrl, qr }
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [disablePw, setDisablePw] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => api.get('/auth/2fa/status').then(r => setStatus(r.data)).catch(e => setError(errorText(e, 'Status laden mislukt')));
  useEffect(() => { load(); }, []);

  const startSetup = async () => {
    setError(''); setBusy(true);
    try {
      const r = await api.post('/auth/2fa/setup', {});
      const qr = await QRCode.toDataURL(r.data.otpauthUrl, { width: 220, margin: 1 });
      setSetup({ ...r.data, qr }); setCode('');
    } catch (e) { setError(errorText(e, 'Instellen mislukt')); } finally { setBusy(false); }
  };

  const confirm = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const r = await api.post('/auth/2fa/enable', { code });
      setBackupCodes(r.data.backupCodes); setSetup(null); setCode('');
      await load(); if (refreshUser) await refreshUser();
    } catch (err) { setError(errorText(err, 'Code klopt niet')); } finally { setBusy(false); }
  };

  const disable = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      await api.post('/auth/2fa/disable', { password: disablePw, code: disableCode });
      setShowDisable(false); setDisablePw(''); setDisableCode(''); setBackupCodes(null);
      await load(); if (refreshUser) await refreshUser();
    } catch (err) { setError(errorText(err, 'Uitzetten mislukt')); } finally { setBusy(false); }
  };

  const copyCodes = async () => {
    try { await navigator.clipboard.writeText((backupCodes || []).join('\n')); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* handmatig kopiëren */ }
  };

  if (!status) return <div className="p-8 text-gray-400 text-sm animate-pulse">Laden...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Beveiliging</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Twee-staps verificatie met een authenticator-app (Google Authenticator, Microsoft Authenticator, 1Password, Authy)</p>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          {status.enabled ? <ShieldCheck className="w-8 h-8 text-emerald-600" /> : <ShieldAlert className="w-8 h-8 text-amber-500" />}
          <div>
            <p className="font-black text-gray-900">{status.enabled ? 'Twee-staps verificatie staat aan' : 'Twee-staps verificatie staat uit'}</p>
            <p className="text-sm text-gray-500">
              {status.enabled
                ? `Bij het inloggen vraagt het CRM naast je wachtwoord om een 6-cijferige code. Op een apparaat dat je onthoudt, hoeft dat 1 dag (24 uur) niet opnieuw.${status.backupCodesLeft ? ` Herstelcodes over: ${status.backupCodesLeft}.` : ''}`
                : 'Beveilig je admin-account met een code uit een app op je telefoon, zodat een gelekt wachtwoord alleen niet genoeg is.'}
            </p>
          </div>
        </div>

        {!status.enabled && !setup && (
          <button onClick={startSetup} disabled={busy} className="px-6 py-3 rounded-xl text-sm font-black text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>
            Instellen
          </button>
        )}

        {setup && (
          <form onSubmit={confirm} className="space-y-4 border-t border-gray-100 pt-5">
            <ol className="text-sm text-gray-600 space-y-1 list-decimal pl-5">
              <li>Open de authenticator-app op je telefoon en kies "account toevoegen".</li>
              <li>Scan deze QR-code (of typ de sleutel hieronder in).</li>
              <li>Vul de 6-cijferige code uit de app in en klik op "Bevestigen".</li>
            </ol>
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <img src={setup.qr} alt="QR-code voor je authenticator-app" className="w-[220px] h-[220px] rounded-xl border border-gray-100" />
              <div className="space-y-3 flex-1 w-full">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Sleutel (handmatig)</p>
                  <code className="block break-all bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-mono text-gray-700">{setup.secret}</code>
                </div>
                <input className={iCls} inputMode="numeric" autoComplete="one-time-code" placeholder="6-cijferige code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                <div className="flex gap-2">
                  <button type="submit" disabled={busy || code.length !== 6} className="px-6 py-3 rounded-xl text-sm font-black text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>Bevestigen</button>
                  <button type="button" onClick={() => { setSetup(null); setError(''); }} className="px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">Annuleren</button>
                </div>
              </div>
            </div>
          </form>
        )}

        {backupCodes && (
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <p className="font-black text-gray-900">Bewaar je herstelcodes</p>
            <p className="text-sm text-gray-500">Raak je telefoon kwijt? Met één van deze codes kom je nog binnen. Elke code werkt één keer. Ze worden maar nu getoond: sla ze veilig op (bijvoorbeeld in een wachtwoordmanager).</p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-gray-50 border border-gray-100 rounded-xl p-4">
              {backupCodes.map(c => <span key={c}>{c}</span>)}
            </div>
            <button onClick={copyCodes} className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800">
              {copied ? <><CheckCircle size={15} /> Gekopieerd</> : <><Copy size={15} /> Kopieer codes</>}
            </button>
          </div>
        )}

        {status.enabled && !showDisable && (
          <button onClick={() => setShowDisable(true)} className="text-sm font-bold text-red-500 hover:text-red-700">Twee-staps verificatie uitzetten</button>
        )}
        {showDisable && (
          <form onSubmit={disable} className="space-y-3 border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-500">Bevestig met je wachtwoord en een code uit de app (of een herstelcode).</p>
            <input className={iCls} type="password" placeholder="Wachtwoord" value={disablePw} onChange={e => setDisablePw(e.target.value)} />
            <input className={iCls} placeholder="Code" value={disableCode} onChange={e => setDisableCode(e.target.value)} />
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !disablePw || !disableCode} className="px-6 py-3 rounded-xl text-sm font-black text-white bg-red-600 disabled:opacity-50">Uitzetten</button>
              <button type="button" onClick={() => setShowDisable(false)} className="px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">Annuleren</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
