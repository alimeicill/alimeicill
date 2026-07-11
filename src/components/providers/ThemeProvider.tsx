'use client';

import React, { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const ACCENT_COLORS = {
  indigo: {
    '--primary-50': '#eff6ff',
    '--primary-100': '#dbeafe',
    '--primary-200': '#bfdbfe',
    '--primary-300': '#93c5fd',
    '--primary-400': '#60a5fa',
    '--primary-500': '#1e40af',
    '--primary-600': '#1d4ed8',
    '--primary-700': '#1e40af',
    '--primary-800': '#1e3a8a',
    '--primary-900': '#172554',
    '--primary-950': '#0b1329',
  },
  emerald: {
    '--primary-50': '#ecfdf5',
    '--primary-100': '#d1fae5',
    '--primary-200': '#a7f3d0',
    '--primary-300': '#6ee7b7',
    '--primary-400': '#34d399',
    '--primary-500': '#10b981',
    '--primary-600': '#059669',
    '--primary-700': '#047857',
    '--primary-800': '#065f46',
    '--primary-900': '#064e3b',
    '--primary-950': '#022c22',
  },
  rose: {
    '--primary-50': '#fff1f2',
    '--primary-100': '#ffe4e6',
    '--primary-200': '#fecdd3',
    '--primary-300': '#fda4af',
    '--primary-400': '#fb7185',
    '--primary-500': '#f43f5e',
    '--primary-600': '#e11d48',
    '--primary-700': '#be123c',
    '--primary-800': '#9f1239',
    '--primary-900': '#881337',
    '--primary-950': '#4c0519',
  },
  amber: {
    '--primary-50': '#fffbeb',
    '--primary-100': '#fef3c7',
    '--primary-200': '#fde68a',
    '--primary-300': '#fcd34d',
    '--primary-400': '#fbbf24',
    '--primary-500': '#f59e0b',
    '--primary-600': '#d97706',
    '--primary-700': '#b45309',
    '--primary-800': '#92400e',
    '--primary-900': '#78350f',
    '--primary-950': '#451a03',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply initial accent color from localstorage
    const applyAccent = () => {
      const savedAccent = localStorage.getItem('site_accent_color') || 'indigo';
      const colors = ACCENT_COLORS[savedAccent as keyof typeof ACCENT_COLORS] || ACCENT_COLORS.indigo;
      
      Object.entries(colors).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
    };

    applyAccent();

    // Listen for custom events or storage updates to react immediately
    const handleStorageChange = () => {
      applyAccent();
    };

    window.addEventListener('storage', handleStorageChange);
    // Support custom event for same-window updates
    window.addEventListener('accent-color-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('accent-color-change', handleStorageChange);
    };
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
