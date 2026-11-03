import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!token) {
          setUser(null);
          return;
        }

        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            return;
          }
        }

        const res = await api.get('/auth/me', { timeout: 15000 });
        localStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  // Twee-staps verificatie: zonder code geeft de server { twoFactorRequired: true } terug (nog geen token)
  const login = async (email, password, opts = {}) => {
    const deviceToken = localStorage.getItem('crm_device_token') || undefined;
    const res = await api.post('/auth/login', {
      email, password, deviceToken,
      ...(opts.code ? { code: opts.code, rememberDevice: !!opts.remember } : {}),
    });
    if ((res.data.twoFactorRequired || res.data.twoFactorSetupRequired) && !res.data.token) return res.data;
    if (res.data.deviceToken) localStorage.setItem('crm_device_token', res.data.deviceToken);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  // 2FA instellen tijdens het inloggen (admin zonder 2FA): secret ophalen en bevestigen; de sessie start pas bij finishLogin
  const loginSetup = async (setupToken) => (await api.post('/auth/2fa/login-setup', { setupToken })).data;
  const loginEnable = async (setupToken, code, remember) => (await api.post('/auth/2fa/login-enable', { setupToken, code, rememberDevice: !!remember })).data;
  const finishLogin = (data) => {
    if (data.deviceToken) localStorage.setItem('crm_device_token', data.deviceToken);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const refreshUser = async () => {
    const res = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const register = async (email, password, name) => {
    const res = await api.post('/auth/register', { email, password, name });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginSetup, loginEnable, finishLogin, register, logout, refreshUser, loading, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
