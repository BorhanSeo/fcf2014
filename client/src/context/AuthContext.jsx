import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // OPTIMIZATION: Immediately hydrate from localStorage — no blank screen flash
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sanchoy_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => !!localStorage.getItem('sanchoy_token'));
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('sanchoy_settings');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    const token = localStorage.getItem('sanchoy_token');

    if (token && user) {
      // OPTIMIZATION: Fetch /auth/me + /settings in PARALLEL (was sequential)
      Promise.all([
        api.get('/auth/me'),
        api.get('/settings'),
      ])
        .then(([authRes, settingsRes]) => {
          setUser(authRes.data.user);
          localStorage.setItem('sanchoy_user', JSON.stringify(authRes.data.user));
          if (settingsRes?.data) {
            setSettings(settingsRes.data.settings);
            localStorage.setItem('sanchoy_settings', JSON.stringify(settingsRes.data.settings));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('sanchoy_token', token);
    localStorage.setItem('sanchoy_user', JSON.stringify(userData));
    setUser(userData);

    // Fetch settings on login (non-blocking)
    api.get('/settings')
      .then(settingsRes => {
        setSettings(settingsRes.data.settings);
        localStorage.setItem('sanchoy_settings', JSON.stringify(settingsRes.data.settings));
      })
      .catch(e => console.error('Error fetching settings on login:', e));

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('sanchoy_token');
    localStorage.removeItem('sanchoy_user');
    localStorage.removeItem('sanchoy_settings');
    setUser(null);
    setSettings({});
  };

  const updateUser = (updatedData) => {
    const newData = { ...user, ...updatedData };
    setUser(newData);
    localStorage.setItem('sanchoy_user', JSON.stringify(newData));
  };

  const isAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin, settings, setSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
