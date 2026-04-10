import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

async function fetchWithRetry(url, opts, retries = 3, delay = 1200) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, opts);
      if (r.ok) return r.json();
      if (r.status === 401) return null;
      return null;
    } catch {
      if (i < retries) await new Promise(res => setTimeout(res, delay));
    }
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithRetry('/api/auth/me', { credentials: 'include' })
      .then(data => { if (data) setUser(data); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const register = async (username, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur d'inscription");
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
