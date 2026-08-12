'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Building2,
  ListTodo,
  FileText,
  Users,
  Bell,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Hexagon,
  Receipt,
  MessageSquare,
  Landmark,
  BarChart3,
  ArrowRightLeft,
  ChevronDown,
  Gauge,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  subItems?: { href: string; label: string }[];
}

// Helper function to get role-specific navigation items and user details
function getRoleConfig(pathname: string | null) {
  if (!pathname) {
    return {
      roleLabel: 'Site Yöneticisi',
      userName: 'Hasan Korkmaz',
      userEmail: 'hasan.korkmaz@yildiz.com',
      navItems: [] as NavItem[]
    };
  }
  if (pathname.startsWith('/super-admin')) {
    return {
      roleLabel: 'SaaS Platform Sahibi',
      userName: 'Hakan Demir',
      userEmail: 'super@apartmanyonet.com',
      navItems: [
        { href: '/super-admin/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
        { href: '/super-admin/tenantlar', label: 'Apartmanlar (Tenants)', icon: Building2 },
        { href: '/super-admin/abonelikler', label: 'Abonelik Planları', icon: Wallet },
        { href: '/super-admin/finans', label: 'Finans Yönetimi', icon: Landmark },
        { href: '/super-admin/ayarlar', label: 'Sistem Ayarları', icon: Settings },
      ] as NavItem[]
    };
  }
  if (pathname.startsWith('/sakin')) {
    return {
      roleLabel: 'Daire Sakini',
      userName: 'Mehmet Kaya',
      userEmail: 'mehmet@yildiz.com',
      navItems: [
        { href: '/sakin/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
        { href: '/sakin/aidat', label: 'Borçlarım & Ödeme', icon: Wallet },
        { href: '/sakin/ariza', label: 'Arıza Bildirimi', icon: ListTodo },
        { href: '/sakin/duyurular', label: 'Duyurular', icon: FileText },
        { href: '/sakin/ziyaretci', label: 'Ziyaretçi QR Davet', icon: Users },
        { href: '/sakin/profil', label: 'Profilim', icon: Settings },
      ] as NavItem[]
    };
  }
  if (pathname.startsWith('/personel')) {
    return {
      roleLabel: 'Teknik Personel',
      userName: 'Murat Usta',
      userEmail: 'murat.usta@yildiz.com',
      navItems: [
        { href: '/personel/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
        { href: '/personel/gorevler', label: 'İş Emirlerim', icon: ListTodo },
        { href: '/personel/ziyaretci', label: 'Ziyaretçi Giriş/Çıkış', icon: Users },
      ] as NavItem[]
    };
  }
  // Default is SITE_MANAGER (yonetici)
  return {
    roleLabel: 'Site Yöneticisi',
    userName: 'Hasan Korkmaz',
    userEmail: 'hasan.korkmaz@yildiz.com',
    navItems: [
      { href: '/yonetici/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
      { href: '/yonetici/site-hesabim', label: 'SiteHesabım Görünümü', icon: Sparkles },
      { href: '/yonetici/daireler', label: 'Daireler', icon: Building2 },
      { href: '/yonetici/sakinler', label: 'Sakinler', icon: Users },
      { href: '/yonetici/sayaclar', label: 'Sayaç Okumaları', icon: Gauge },
      { 
        label: 'Finansal İşlemler', 
        icon: Landmark, 
        subItems: [
          { href: '/yonetici/aidat', label: 'Aidat & Borç' },
          { href: '/yonetici/gelir-gider', label: 'Gelir & Gider' },
          { href: '/yonetici/kasa-banka', label: 'Kasa & Banka' },
          { href: '/yonetici/banka-sync', label: 'Banka Entegrasyon' },
          { href: '/yonetici/raporlar', label: 'Raporlar' },
          { href: '/yonetici/cari', label: 'Cari Hesaplar' },
          { href: '/yonetici/cari/faturalar', label: 'Cari Faturaları' },
          { href: '/yonetici/satinalma/alis-faturalari', label: 'Alış Faturaları' },
        ]
      },
      { href: '/yonetici/duyurular', label: 'Duyurular', icon: FileText },
      { href: '/yonetici/anketler', label: 'Anket & Oylamalar', icon: ClipboardList },
      { href: '/yonetici/sms', label: 'SMS Yönetimi', icon: MessageSquare },
      { href: '/yonetici/arizalar', label: 'Arızalar & Görevler', icon: ListTodo },
      { href: '/yonetici/ayarlar', label: 'Ayarlar', icon: Settings },
    ] as NavItem[]
  };
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { navItems, userName, roleLabel } = getRoleConfig(pathname);

  // Submenu open/close state tracking
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Auto expand submenu if pathname matches any of its subitems
  useEffect(() => {
    if (!pathname) return;
    navItems.forEach(item => {
      if (item.subItems) {
        const hasActiveSub = item.subItems.some(sub => pathname.startsWith(sub.href));
        if (hasActiveSub) {
          setOpenMenus(prev => {
            if (prev[item.label]) return prev; // Avoid infinite re-renders by returning same state reference
            return { ...prev, [item.label]: true };
          });
        }
      }
    });
  }, [pathname]);

  const toggleSubMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all duration-300 ease-in-out',
        'dark:bg-surface-900/80 dark:backdrop-blur-xl dark:border-surface-700/50',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border-color)] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
          <Hexagon className="h-5 w-5 text-white" />
        </div>
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}
        >
          <h1 className="whitespace-nowrap bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-lg font-bold text-transparent">
            ApartmanYönet
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            // 1. SubMenu rendering
            if (item.subItems) {
              const isOpen = !!openMenus[item.label];
              const isAnySubActive = pathname ? item.subItems.some(sub => 
                pathname === sub.href || pathname.startsWith(sub.href)
              ) : false;

              return (
                <li key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleSubMenu(item.label)}
                    className={cn(
                      'group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none',
                      isAnySubActive
                        ? 'bg-primary-500/5 text-primary-600 dark:text-primary-400'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-colors duration-200',
                          isAnySubActive ? 'text-primary-500' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'
                        )}
                      />
                      <span
                        className={cn(
                          'overflow-hidden whitespace-nowrap transition-all duration-300',
                          sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                        )}
                      >
                        {item.label}
                      </span>
                    </div>

                    {!sidebarCollapsed && (
                      <ChevronDown 
                        className={cn(
                          'h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-200',
                          isOpen && 'rotate-180'
                        )}
                      />
                    )}
                  </button>

                  {/* Render submenu items */}
                  {isOpen && !sidebarCollapsed && (
                    <ul className="pl-9 space-y-1 border-l border-[var(--border-color)]/60 ml-5 animate-slide-down">
                      {item.subItems.map((sub) => {
                        const isSubActive = pathname ? (pathname === sub.href || pathname.startsWith(sub.href)) : false;
                        return (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className={cn(
                                'block rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                                isSubActive
                                  ? 'text-primary-600 dark:text-primary-400 font-bold bg-primary-500/5'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/20'
                              )}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            // 2. Normal Menu Item rendering
            const isActive = pathname ? (
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href!))
            ) : false;

            return (
              <li key={item.href}>
                <Link
                  href={item.href!}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-500 transition-all duration-300" />
                  )}

                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors duration-200',
                      isActive
                        ? 'text-primary-500'
                        : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'
                    )}
                  />

                  <span
                    className={cn(
                      'overflow-hidden whitespace-nowrap transition-all duration-300',
                      sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User area */}
      <div className="border-t border-[var(--border-color)] p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-[var(--bg-tertiary)]',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500 font-bold">
            {getInitials(userName)}
          </div>
          <div
            className={cn(
              'flex flex-col overflow-hidden transition-all duration-300',
              sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}
          >
            <span className="truncate text-xs font-bold text-[var(--text-primary)]">{userName}</span>
            <span className="truncate text-[10px] text-[var(--text-tertiary)]">{roleLabel}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
