import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

// TODO: TEMP – bypass auth for testing. Remove this and restore the original bootstrapAuth block.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ id: 'dev', name: 'Dev Admin', email: 'dev@test.local', role: 'ADMIN' });
  const [loading, setLoading] = useState(false);

  /* Original bootstrapAuth – uncomment to restore login:
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
  */

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
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
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
