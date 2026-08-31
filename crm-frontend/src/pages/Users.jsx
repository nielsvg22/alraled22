import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { Shield, User, Search, Users, UserCheck, UserX, RefreshCw, Mail, Calendar, Crown, KeyRound, Copy, Check, AlertTriangle } from 'lucide-react';
import { errorText } from '../lib/errorText';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

function formatDateTime(value) {
  if (!value) return 'Nooit';
  return new Date(value).toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ResetPasswordModal({ user, onClose, onSuccess }) {
  const [mode, setMode] = useState('auto');
  const [manualPassword, setManualPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { temporaryPassword }
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (mode === 'manual' && manualPassword.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn');
      return;
    }
    setSubmitting(true);
    try {
      const body = mode === 'auto' ? { mode: 'auto' } : { mode: 'manual', password: manualPassword };
      const res = await api.post(`/auth/users/${user.id}/reset-password`, body);
      setResult(res.data);
      onSuccess?.(res.data.user);
    } catch (err) {
      setError(errorText(err, 'Wachtwoord resetten mislukt'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available; user can still select the text manually
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={result ? undefined : onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {!result ? (
          <>
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Wachtwoord resetten</p>
              <h3 className="text-lg font-black text-white">{user.name || user.email}</h3>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-600 text-xs font-medium">{error}</div>}
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer" style={{ borderColor: mode === 'auto' ? '#1e40af' : '#e5e7eb', background: mode === 'auto' ? '#eff6ff' : '#fff' }}>
                  <input type="radio" checked={mode === 'auto'} onChange={() => setMode('auto')} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Automatisch genereren</p>
                    <p className="text-xs text-gray-400">Sterk willekeurig wachtwoord (16 tekens)</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer" style={{ borderColor: mode === 'manual' ? '#1e40af' : '#e5e7eb', background: mode === 'manual' ? '#eff6ff' : '#fff' }}>
                  <input type="radio" checked={mode === 'manual'} onChange={() => setMode('manual')} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Zelf tijdelijk wachtwoord invoeren</p>
                    <p className="text-xs text-gray-400">Minimaal 8 tekens</p>
                  </div>
                </label>
                {mode === 'manual' && (
                  <input
                    type="text"
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tijdelijk wachtwoord"
                    value={manualPassword}
                    onChange={e => setManualPassword(e.target.value)}
                  />
                )}
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-amber-700 text-xs font-medium flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>De gebruiker moet na inloggen direct zelf een nieuw persoonlijk wachtwoord kiezen. Bestaande sessies van deze gebruiker worden meteen ongeldig.</span>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50">Annuleren</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
                  {submitting ? 'Bezig…' : 'Wachtwoord resetten'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#065f46,#10b981)' }}>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Nieuw wachtwoord</p>
              <h3 className="text-lg font-black text-white">{user.name || user.email}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                <code className="text-sm font-mono font-bold text-gray-900 break-all">{result.temporaryPassword}</code>
                <button onClick={handleCopy} className="shrink-0 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-gray-500" />}
                </button>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-red-700 text-xs font-semibold flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>Dit wachtwoord wordt slechts één keer weergegeven. Kopieer het voordat je dit venster sluit — het kan daarna niet opnieuw worden opgehaald.</span>
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800">Sluiten</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, gradient, icon: Icon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: gradient, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
      <div className="absolute -right-3 -top-3 opacity-10"><Icon size={72} className="text-white" /></div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">{label}</p>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
    </div>
  );
}

function Avatar({ name, role }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const isAdmin = role === 'ADMIN';
  return (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0"
      style={{
        background: isAdmin
          ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
          : 'linear-gradient(135deg,#1e40af,#3b82f6)',
        color: '#fff',
        boxShadow: isAdmin ? '0 4px 12px rgba(124,58,237,0.35)' : '0 4px 12px rgba(59,130,246,0.3)',
      }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === 'ADMIN';
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border"
      style={isAdmin
        ? { background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }
        : { background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}>
      {isAdmin ? <Crown size={10} /> : <User size={10} />}
      {isAdmin ? 'Admin' : 'Klant'}
    </span>
  );
}

function UserModal({ user, orders, onClose, onResetPassword, resetByName }) {
  const total = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-6 flex items-center gap-4" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0"
            style={{
              background: user.role === 'ADMIN' ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'linear-gradient(135deg,#1e40af,#3b82f6)',
              boxShadow: user.role === 'ADMIN' ? '0 8px 24px rgba(124,58,237,0.5)' : '0 8px 24px rgba(59,130,246,0.4)',
            }}>
            {user.name ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">Gebruiker</p>
            <h2 className="text-lg font-black text-white truncate">{user.name || 'Onbekend'}</h2>
            <p className="text-white/40 text-xs mt-0.5">{user.email}</p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Bestellingen', value: orders.length },
              { label: 'Uitgegeven', value: euro.format(total) },
              { label: 'Lid sinds', value: new Date(user.createdAt).toLocaleDateString('nl-NL', { month:'short', year:'numeric' }) },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background:'#f8fafc', border:'1px solid #f1f5f9' }}>
                <p className="text-lg font-black text-gray-900 leading-none">{s.value}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background:'#f8fafc', border:'1px solid #f1f5f9' }}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contactgegevens</p>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Mail size={12} className="text-blue-400" />
              </div>
              <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline font-medium">{user.email}</a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Calendar size={12} className="text-gray-400" />
              </div>
              <span className="text-gray-600 font-medium">
                Geregistreerd op {new Date(user.createdAt).toLocaleDateString('nl-NL', { day:'numeric', month:'long', year:'numeric' })}
              </span>
            </div>
          </div>

          {/* Beveiliging */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background:'#f8fafc', border:'1px solid #f1f5f9' }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Beveiliging</p>
              {user.mustChangePassword ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100">
                  <AlertTriangle size={10} /> Moet wachtwoord wijzigen
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Actief
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400 font-semibold mb-0.5">Laatste login</p>
                <p className="text-gray-800 font-medium">{formatDateTime(user.lastLoginAt)}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold mb-0.5">Laatste wachtwoordwijziging</p>
                <p className="text-gray-800 font-medium">{formatDateTime(user.passwordChangedAt)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400 font-semibold mb-0.5">Laatste wachtwoordreset door AIG</p>
                <p className="text-gray-800 font-medium">
                  {user.passwordResetAt ? `${formatDateTime(user.passwordResetAt)}${resetByName ? ` door ${resetByName}` : ''}` : 'Nooit'}
                </p>
              </div>
            </div>
            <button onClick={() => onResetPassword(user)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors">
              <KeyRound size={14} /> Wachtwoord resetten
            </button>
          </div>

          {/* Orders */}
          {orders.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Recente bestellingen</p>
              <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid #f1f5f9' }}>
                {orders.slice(0, 5).map((order, i) => (
                  <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
                    style={{ borderBottom: i < Math.min(orders.length, 5) - 1 ? '1px solid #f9fafb' : 'none' }}>
                    <div>
                      <p className="font-mono text-xs font-black text-gray-500">#{order.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('nl-NL', { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-gray-900">{euro.format(order.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {orders.length === 0 && (
            <div className="rounded-2xl py-8 flex flex-col items-center gap-2" style={{ background:'#f8fafc', border:'1px solid #f1f5f9' }}>
              <UserX size={24} className="text-gray-200" />
              <p className="text-xs text-gray-400 font-medium">Nog geen bestellingen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [resetUser, setResetUser] = useState(null);

  const resetByName = (u) => {
    if (!u?.passwordResetByUserId) return '';
    const resetter = users.find(x => x.id === u.passwordResetByUserId);
    return resetter?.name || resetter?.email || '';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, oRes] = await Promise.all([api.get('/auth/users'), api.get('/orders').catch(() => ({ data: [] }))]);
      setUsers(uRes.data);
      setOrders(oRes.data);
    } catch (e) {
      setError(errorText(e, 'Gebruikers ophalen mislukt'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const userOrders = (userId) => orders.filter(o => o.user?.id === userId || o.userId === userId);

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase();
    return (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      && (roleFilter === 'ALL' || u.role === roleFilter);
  }), [users, search, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    customers: users.filter(u => u.role !== 'ADMIN').length,
    withOrders: users.filter(u => userOrders(u.id).length > 0).length,
  }), [users, orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gebruikers</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">{users.length} geregistreerde gebruikers</p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-all active:scale-95">
          <RefreshCw size={14} /> Verversen
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 text-sm font-medium">{String(error)}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Totaal" value={stats.total} gradient="linear-gradient(135deg,#1e40af,#3b82f6)" icon={Users} />
        <StatCard label="Admins" value={stats.admins} gradient="linear-gradient(135deg,#5b21b6,#a855f7)" icon={Crown} />
        <StatCard label="Klanten" value={stats.customers} gradient="linear-gradient(135deg,#065f46,#10b981)" icon={UserCheck} />
        <StatCard label="Met orders" value={stats.withOrders} gradient="linear-gradient(135deg,#92400e,#f59e0b)" icon={Shield} />
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Zoek op naam of e-mail…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['ALL','ADMIN','USER'].map(r => (
          <button key={r} onClick={() => setRole(r)}
            className="px-4 py-2.5 rounded-xl text-xs font-black border transition-all"
            style={{
              background: roleFilter === r ? '#1e40af' : '#fff',
              color: roleFilter === r ? '#fff' : '#6b7280',
              borderColor: roleFilter === r ? '#1e40af' : '#e5e7eb',
              boxShadow: roleFilter === r ? '0 4px 12px rgba(30,64,175,0.3)' : 'none',
            }}>
            {r === 'ALL' ? 'Alle' : r === 'ADMIN' ? 'Admins' : 'Klanten'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #f1f5f9', boxShadow:'0 4px 24px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Laden…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              <Users size={24} className="text-gray-200" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Geen gebruikers gevonden</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom:'1px solid #f8fafc', background:'#fafafa' }}>
                    {['Gebruiker','E-mail','Rol','Bestellingen','Lid sinds',''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]"
                        style={{ textAlign: h === '' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, idx) => {
                    const uOrders = userOrders(user.id);
                    const spent   = uOrders.reduce((s, o) => s + o.total, 0);
                    return (
                      <tr key={user.id} className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                        style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f9fafb' : 'none' }}
                        onClick={() => setSelected({ user, orders: uOrders })}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} role={user.role} />
                            <p className="text-sm font-bold text-gray-900">{user.name || '—'}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <a href={`mailto:${user.email}`} onClick={e => e.stopPropagation()}
                            className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <Mail size={12} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                            {user.email}
                          </a>
                        </td>
                        <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                        <td className="px-5 py-4">
                          {uOrders.length > 0 ? (
                            <div>
                              <p className="text-sm font-black text-gray-900">{uOrders.length} <span className="font-normal text-gray-400 text-xs">bestellingen</span></p>
                              <p className="text-xs text-gray-400">{euro.format(spent)} uitgegeven</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 font-medium">Geen orders</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-600 font-medium">
                            {new Date(user.createdAt).toLocaleDateString('nl-NL', { day:'numeric', month:'short', year:'numeric' })}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-blue-500 font-bold">Details →</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/30 text-xs text-gray-400 font-semibold">
              {filtered.length} van {users.length} gebruikers
            </div>
          </>
        )}
      </div>

      {selected && (
        <UserModal
          user={selected.user}
          orders={selected.orders}
          onClose={() => setSelected(null)}
          onResetPassword={setResetUser}
          resetByName={resetByName(selected.user)}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => { setResetUser(null); fetchData(); }}
          onSuccess={(updated) => {
            if (selected?.user?.id === updated.id) {
              setSelected(sel => ({
                ...sel,
                user: {
                  ...sel.user,
                  mustChangePassword: updated.security.mustChangePassword ? 1 : 0,
                  lastLoginAt: updated.security.lastLoginAt,
                  passwordChangedAt: updated.security.passwordChangedAt,
                  passwordResetAt: updated.security.passwordResetAt,
                  passwordResetByUserId: updated.security.passwordResetBy?.id ?? null,
                },
              }));
            }
          }}
        />
      )}
    </div>
  );
}
