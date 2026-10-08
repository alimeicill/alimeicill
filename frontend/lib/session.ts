'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'RESIDENT';
  email: string | null;
  phone: string | null;
  tenantName: string;
}

interface SessionState {
  token: string | null;
  user: SessionUser | null;
  dark: boolean;
  sidebarCollapsed: boolean;
  favorites: string[];
  setSession: (token: string, user: SessionUser) => void;
  logout: () => void;
  toggleDark: () => void;
  toggleSidebar: () => void;
  toggleFavorite: (href: string) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      dark: false,
      sidebarCollapsed: false,
      favorites: [],
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      toggleDark: () => set((s) => ({ dark: !s.dark })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleFavorite: (href) =>
        set((s) => ({
          favorites: s.favorites.includes(href) ? s.favorites.filter((f) => f !== href) : [...s.favorites, href],
        })),
    }),
    { name: 'siteyonet-session' },
  ),
);
