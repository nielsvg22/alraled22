import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { errorText } from '../lib/errorText';

export default function ChangePasswordRequired() {
  const { user, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    if (newPassword !== confirmPassword) {
      setError('De wachtwoorden komen niet overeen');
      return;
    }
    if (newPassword.length < 8) {
      setError('Nieuw wachtwoord moet minimaal 8 tekens zijn');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(errorText(err, 'Wachtwoord wijzigen mislukt'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Kies een nieuw wachtwoord</h2>
          <p className="mt-2 text-sm text-gray-500">
            Je wachtwoord is door een beheerder gereset. Kies hieronder je eigen, nieuwe wachtwoord
            om verder te gaan{user?.email ? ` als ${user.email}` : ''}.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center">{String(error)}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tijdelijk wachtwoord</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nieuw wachtwoord</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Bevestig nieuw wachtwoord</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? 'Bezig…' : 'Wachtwoord instellen'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            Uitloggen
          </button>
        </form>
      </div>
    </div>
  );
}
