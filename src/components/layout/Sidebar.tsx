'use client';

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
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';

const navItems = [
  { href: '/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
  { href: '/finance', label: 'Finanslar', icon: Wallet },
  { href: '/units', label: 'Daireler', icon: Building2 },
  { href: '/tasks', label: 'Görevler', icon: ListTodo },
  { href: '/documents', label: 'Dökümanlar', icon: FileText },
  { href: '/residents', label: 'Sakinler', icon: Users },
  { href: '/notifications', label: 'Bildirimler', icon: Bell, badge: 3 },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
];

const mockUser = {
  name: 'Ahmet Yılmaz',
  email: 'ahmet@siteyonetim.com',
  role: 'Site Yöneticisi',
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

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
            SiteYönetim
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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

                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={cn(
                        'flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white transition-all duration-300',
                        sidebarCollapsed
                          ? 'absolute -right-1 -top-1 scale-75'
                          : 'ml-auto'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white shadow-md">
            {getInitials(mockUser.name)}
          </div>
          <div
            className={cn(
              'min-w-0 overflow-hidden transition-all duration-300',
              sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}
          >
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {mockUser.name}
            </p>
            <p className="truncate text-xs text-[var(--text-tertiary)]">
              {mockUser.role}
            </p>
          </div>
        </div>
      </div>

      {/* Collapse button */}
      <div className="border-t border-[var(--border-color)] p-3">
        <button
          onClick={toggleSidebarCollapsed}
          className="flex w-full items-center justify-center gap-2 rounded-xl p-2 text-sm text-[var(--text-tertiary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]"
          title={sidebarCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronsLeft className="h-5 w-5" />
              <span className="overflow-hidden whitespace-nowrap">Menüyü Daralt</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
