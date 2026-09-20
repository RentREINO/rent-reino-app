import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!localStorage.getItem('rentreino_token')) { setLoading(false); return; }
    try {
      const data = await api('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('rentreino_token');
      setUser(null);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    refresh();
    const handler = () => { localStorage.removeItem('rentreino_token'); setUser(null); };
    window.addEventListener('rentreino:unauthorized', handler);
    return () => window.removeEventListener('rentreino:unauthorized', handler);
  }, []);

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('rentreino_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    localStorage.setItem('rentreino_token', data.token);
    setUser(data.user);
  };

  const logout = () => { localStorage.removeItem('rentreino_token'); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}
