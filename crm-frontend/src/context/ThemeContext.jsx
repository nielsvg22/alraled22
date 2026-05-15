import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const ThemeContext = createContext({});

function isDark(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function applyToCRM(theme) {
  const root = document.documentElement;
  const darkBg = isDark(theme.bg ?? '#ffffff');

  root.style.setProperty('--crm-bg',           theme.bg        ?? '#f8fafc');
  root.style.setProperty('--crm-surface',       theme.surface   ?? '#ffffff');
  root.style.setProperty('--crm-primary',       theme.primary   ?? '#0c4684');
  root.style.setProperty('--crm-accent',        theme.accent    ?? '#fcd34d');
  root.style.setProperty('--crm-text',          theme.textColor ?? '#0f172a');
  root.style.setProperty('--crm-text-muted',    theme.textMuted ?? '#6b7280');

  // Sidebar: gebruik secondary als het donker genoeg is, anders maak donkerder variant van bg
  const sidebarColor = theme.secondary ?? '#1e293b';
  root.style.setProperty('--crm-sidebar',       sidebarColor);
  root.style.setProperty('--crm-sidebar-text',  isDark(sidebarColor) ? '#ffffff' : '#0f172a');
  root.style.setProperty('--crm-nav-active',    theme.primary   ?? '#0c4684');
  root.style.setProperty('--crm-nav-hover',     isDark(sidebarColor) ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)');
  root.style.setProperty('--crm-border',        isDark(sidebarColor) ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)');
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    api.get('/content/theme')
      .then(res => {
        const t = res.data;
        setTheme(t);
        applyToCRM(t);
      })
      .catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, applyToCRM, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
