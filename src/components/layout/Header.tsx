'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
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
  Layout,
  Building2,
  Home,
  ClipboardList,
  Mail,
  Landmark,
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import { mockUnits, mockUsers, mockTasks } from '@/lib/mock-data';

// Helper function to resolve dynamic user details based on active dashboard path
function getHeaderUser(pathname: string) {
  if (pathname.startsWith('/super-admin')) {
    return {
      name: 'Hakan Demir',
      email: 'super@apartmanyonet.com',
      role: 'SaaS Platform Sahibi',
    };
  }
  if (pathname.startsWith('/sakin')) {
    return {
      name: 'Mehmet Kaya',
      email: 'mehmet@yildiz.com',
      role: 'Daire Sakini',
    };
  }
  if (pathname.startsWith('/personel')) {
    return {
      name: 'Murat Usta',
      email: 'murat.usta@yildiz.com',
      role: 'Teknik Personel',
    };
  }
  return {
    name: 'Hasan Korkmaz',
    email: 'hasan.korkmaz@yildiz.com',
    role: 'Site Yöneticisi',
  };
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebarCollapsed } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  
  // States
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const mockUser = getHeaderUser(pathname);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    router.push('/giris');
  };

  // Keyboard shortcut listener for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Reset search index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Command Palette Items Mapping
  const searchResults = useMemo(() => {
    const navItems = [
      { title: 'Yönetici Kontrol Paneli (Dashboard)', path: '/yonetici/dashboard', icon: Layout, category: 'Menü Linkleri' },
      { title: 'Daire Yönetimi & Sakin Listesi', path: '/yonetici/daireler', icon: Building2, category: 'Menü Linkleri' },
      { title: 'Sakin Kayıtları & Kiracılar', path: '/yonetici/sakinler', icon: User, category: 'Menü Linkleri' },
      { title: 'Aidat ve Fatura Yönetimi', path: '/yonetici/aidat', icon: Landmark, category: 'Menü Linkleri' },
      { title: 'Arıza Bildirimleri ve Görevler', path: '/yonetici/arizalar', icon: ClipboardList, category: 'Menü Linkleri' },
      { title: 'SMS Gönderimi ve İletişim', path: '/yonetici/sms', icon: Mail, category: 'Menü Linkleri' },
      { title: 'Banka Senkronizasyonu & İşlemler', path: '/yonetici/banka-sync', icon: Landmark, category: 'Menü Linkleri' },
      { title: 'Sistem Ayarları', path: '/yonetici/ayarlar', icon: Settings, category: 'Menü Linkleri' },
    ];

    const query = searchQuery.trim().toLowerCase();

    // 1. Matches from Navigation menu items
    const matchedNav = navItems.filter(item => 
      item.title.toLowerCase().includes(query)
    );

    // 2. Matches from Daireler (mockUnits)
    const matchedUnits = query ? mockUnits.filter(u => 
      u.number.toLowerCase().includes(query) ||
      u.blockName.toLowerCase().includes(query) ||
      (u.ownerName && u.ownerName.toLowerCase().includes(query)) ||
      (u.tenantName && u.tenantName.toLowerCase().includes(query))
    ).slice(0, 5).map(u => ({
      title: `${u.blockName} - No: ${u.number} (${u.status === 'occupied' ? 'Dolu - ' + (u.tenantName || u.ownerName) : 'Boş'})`,
      path: '/yonetici/daireler',
      icon: Home,
      category: 'Daireler'
    })) : [];

    // 3. Matches from Sakinler / Kullanıcılar (mockUsers)
    const matchedUsers = query ? mockUsers.filter(usr => 
      usr.name.toLowerCase().includes(query) ||
      usr.email.toLowerCase().includes(query) ||
      (usr.phone && usr.phone.toLowerCase().includes(query))
    ).slice(0, 5).map(usr => ({
      title: `${usr.name} (${usr.role === 'owner' ? 'Kat Maliki' : usr.role === 'tenant' ? 'Kiracı' : 'Yönetici'})${usr.phone ? ' - ' + usr.phone : ''}`,
      path: usr.role === 'site_manager' ? '/yonetici/ayarlar' : '/yonetici/sakinler',
      icon: User,
      category: 'Sakinler & Sakin Listesi'
    })) : [];

    // 4. Matches from Görevler & Arızalar (mockTasks)
    const matchedTasks = query ? mockTasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    ).slice(0, 5).map(t => ({
      title: t.title,
      path: '/yonetici/arizalar',
      icon: ClipboardList,
      category: 'Destek Görevleri & Arızalar'
    })) : [];

    return [...matchedNav, ...matchedUnits, ...matchedUsers, ...matchedTasks];
  }, [searchQuery]);

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex].path);
      }
    } else if (e.key === 'Escape') {
      setIsPaletteOpen(false);
    }
  };

  const handleSelect = (path: string) => {
    router.push(path);
    setIsPaletteOpen(false);
    setSearchQuery('');
    setSelectedIndex(0);
  };

  return (
    <>
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
          {/* Search Trigger */}
          <div className="relative">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] lg:hidden"
              aria-label="Ara"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Desktop Search Placeholder-style trigger */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="hidden items-center lg:flex relative text-left group"
            >
              <div className="flex h-9 w-64 items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 pl-9 pr-3 text-xs text-[var(--text-secondary)] transition-all duration-205 hover:border-[var(--border-color)]/80 hover:bg-[var(--bg-tertiary)]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors" />
                <span>Hızlı arama...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] px-1.5 font-mono text-[9px] font-medium text-[var(--text-tertiary)] opacity-100">
                  <span className="text-[8px]">Ctrl</span>K
                </kbd>
              </div>
            </button>
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
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
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

      {/* Global Command Palette Search Modal */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
            onClick={() => setIsPaletteOpen(false)}
          />

          {/* Palette Box */}
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in">
            {/* Top gradient visual */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Input Header */}
            <div className="flex items-center px-4 border-b border-[var(--border-color)]">
              <Command className="h-4 w-4 text-[var(--text-tertiary)] mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Nereye gitmek veya neyi bulmak istersiniz? (Örn: A-101, Ahmet, Aidat)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handlePaletteKeyDown}
                className="w-full h-14 bg-transparent border-none text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:ring-0"
              />
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[9px] font-bold text-[var(--text-tertiary)]">
                ESC
              </span>
            </div>

            {/* Results Body */}
            <div className="max-h-[350px] overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Eşleşen sonuç bulunamadı.</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">Lütfen aramanızı başka anahtar kelimelerle deneyin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* We render search results grouped by category */}
                  {(() => {
                    // Group results by category
                    const groups: Record<string, typeof searchResults> = {};
                    searchResults.forEach(item => {
                      if (!groups[item.category]) groups[item.category] = [];
                      groups[item.category].push(item);
                    });

                    let globalIndexCounter = -1;

                    return Object.entries(groups).map(([category, items]) => (
                      <div key={category} className="space-y-1">
                        <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] block mb-1.5">
                          {category}
                        </span>
                        
                        {items.map((item) => {
                          globalIndexCounter++;
                          const isSelected = selectedIndex === globalIndexCounter;
                          const IconComponent = item.icon;

                          return (
                            <button
                              key={`${category}-${item.title}`}
                              onClick={() => handleSelect(item.path)}
                              onMouseEnter={() => setSelectedIndex(globalIndexCounter)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150 border-l-4 border-transparent",
                                isSelected 
                                  ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500 font-bold" 
                                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50"
                              )}
                            >
                              <div className="flex items-center space-x-3 truncate">
                                <IconComponent className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary-500" : "text-[var(--text-tertiary)]")} />
                                <span className="truncate">{item.title}</span>
                              </div>
                              {isSelected && (
                                <div className="flex items-center text-[10px] text-primary-500 font-bold gap-1 shrink-0">
                                  <span>Git</span>
                                  <ArrowRight className="h-3 w-3" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Footer Guides */}
            <div className="flex items-center justify-between bg-[var(--bg-tertiary)]/30 px-4 py-3 border-t border-[var(--border-color)] text-[10px] text-[var(--text-tertiary)]">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Akıllı Navigasyon ve Veri Bulucu</span>
              </div>
              <div className="flex gap-4 font-semibold">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)]">↑↓</kbd> Gezin
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)]">↵</kbd> Seç
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-[var(--bg-secondary)] border border(--border-color)">ESC</kbd> Kapat
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
