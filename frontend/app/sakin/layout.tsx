'use client';

import { CircleUser, Home, LogOut, PieChart, Settings, Wrench } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/guard';
import { cx } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { useSession } from '@/lib/session';

const TABS = [
  { href: '/sakin', label: 'Anasayfa', icon: Home },
  { href: '/sakin/borclar', label: 'Borç / Ödenen', icon: PieChart },
  { href: '/sakin/talepler', label: 'Talep / Arıza', icon: Wrench },
  { href: '/sakin/ayarlar', label: 'Ayarlar', icon: Settings },
];

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="RESIDENT">
      <Shell>{children}</Shell>
    </RoleGuard>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="no-print bg-gradient-to-r from-navy-950 via-navy-800 to-emerald-600 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="text-xl font-bold tracking-tight">{BRAND}</div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden items-center gap-1.5 sm:flex">
              <CircleUser className="size-5" /> {user?.name}
            </span>
            <button
              type="button"
              className="flex items-center gap-1.5 font-medium hover:underline"
              onClick={() => {
                logout();
                router.replace('/giris');
              }}
            >
              <LogOut className="size-4" /> Güvenli çıkış
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <nav className="no-print mb-6 flex flex-wrap gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.href === '/sakin' ? pathname === t.href : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cx(
                  'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition',
                  active ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900',
                )}
              >
                <Icon className="size-4" /> {t.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </div>
  );
}
