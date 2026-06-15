'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';

const mockUser = {
  name: 'Ahmet Yılmaz',
  email: 'ahmet@siteyonetim.com',
  role: 'Site Yöneticisi',
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebarCollapsed } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80 px-4 backdrop-blur-xl lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebarCollapsed}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] lg:hidden"
          aria-label="Menüyü aç/kapat"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] lg:hidden"
            aria-label="Ara"
          >
            <Search className="h-5 w-5" />
          </button>

          <div
            className={cn(
              'hidden items-center lg:flex',
              searchOpen && '!flex absolute right-0 top-12 z-50'
            )}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Ara... (⌘K)"
                className="h-9 w-64 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          aria-label="Bildirimler"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          aria-label="Tema değiştir"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-[var(--border-color)]" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-xl p-1.5 transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white shadow-md">
              {getInitials(mockUser.name)}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {mockUser.name}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">{mockUser.role}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-[var(--text-tertiary)] lg:block" />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-fade-in rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1.5 shadow-xl">
                <div className="border-b border-[var(--border-color)] px-3 py-2.5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {mockUser.name}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {mockUser.email}
                  </p>
                </div>

                <div className="py-1.5">
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                    <User className="h-4 w-4" />
                    Profilim
                  </button>
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                    <Settings className="h-4 w-4" />
                    Ayarlar
                  </button>
                </div>

                <div className="border-t border-[var(--border-color)] pt-1.5">
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
