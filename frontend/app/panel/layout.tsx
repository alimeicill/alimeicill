'use client';

import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Landmark,
  LayoutGrid,
  ListTree,
  LogOut,
  Megaphone,
  Moon,
  Network,
  Receipt,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  UserSearch,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { RoleGuard } from '@/components/guard';
import { cx } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { useSession } from '@/lib/session';

const NAV = [
  {
    title: 'Tanımlar',
    items: [
      { href: '/panel/siteler', label: 'Siteler ve daireler', icon: Building2 },
      { href: '/panel/kisiler', label: 'Kişiler', icon: Users },
      { href: '/panel/finans-kalemleri', label: 'Gelir / gider kalemleri', icon: Network },
      { href: '/panel/daire-tipleri', label: 'Daire tipleri', icon: ListTree },
    ],
  },
  {
    title: 'Finans işlemleri',
    items: [
      { href: '/panel/cari-hesaplar', label: 'Cari hesaplar', icon: FileText },
      { href: '/panel/odeme-hesaplari', label: 'Ödeme hesapları', icon: Landmark },
      { href: '/panel/finans-kayitlari', label: 'Finans kayıtları', icon: Wallet },
      { href: '/panel/faturalar', label: 'Faturalar', icon: Receipt },
      { href: '/panel/daire-borclari', label: 'Daire borçları', icon: ClipboardList },
      { href: '/panel/borclu-takip', label: 'Borçlu takip', icon: UserSearch },
    ],
  },
  { title: 'Rapor', items: [{ href: '/panel/raporlar', label: 'Raporlar', icon: BarChart3 }] },
  {
    title: 'Operasyon',
    items: [
      { href: '/panel/duyurular', label: 'Duyurular', icon: Megaphone },
      { href: '/panel/talepler', label: 'Talep / arıza', icon: Wrench },
    ],
  },
  {
    title: 'Uyumluluk',
    items: [
      { href: '/panel/kvkk', label: 'KVKK onayları', icon: ShieldCheck },
      { href: '/panel/ayarlar', label: 'Ayarlar', icon: Settings },
    ],
  },
];
const ALL = NAV.flatMap((g) => g.items);

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="ADMIN">
      <Shell>{children}</Shell>
    </RoleGuard>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, dark, toggleDark, sidebarCollapsed: collapsed, toggleSidebar, favorites, toggleFavorite, logout } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = (href: string) => (href === '/panel' ? pathname === href : pathname.startsWith(href));
  const favItems = ALL.filter((i) => favorites.includes(i.href));

  const link = (item: (typeof ALL)[number], fav = true) => {
    const Icon = item.icon;
    const isFav = favorites.includes(item.href);
    return (
      <div key={item.href} className="group relative">
        <Link
          href={item.href}
          title={collapsed ? item.label : undefined}
          onClick={() => setMobileOpen(false)}
          className={cx(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition',
            active(item.href) ? 'bg-navy-700 text-white ring-1 ring-sky-400/30' : 'text-slate-300 hover:bg-navy-800 hover:text-white',
            collapsed && 'justify-center px-2',
          )}
        >
          <Icon className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
        {!collapsed && fav && (
          <button
            type="button"
            onClick={() => toggleFavorite(item.href)}
            className={cx('absolute right-2 top-1/2 -translate-y-1/2 rounded p-1', isFav ? 'text-amber-400' : 'text-slate-500 opacity-0 group-hover:opacity-100')}
            aria-label={isFav ? 'Menümden çıkar' : 'Menüme ekle'}
          >
            <Star className={cx('size-3.5', isFav && 'fill-current')} />
          </button>
        )}
      </div>
    );
  };

  const sidebar = (
    <aside className={cx('flex h-full flex-col bg-navy-900 text-white', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-4">
        {!collapsed && (
          <Link href="/panel" className="flex items-center gap-2">
            <Logo />
            <div>
              <div className="font-bold leading-tight">{BRAND}</div>
              <div className="text-[11px] text-slate-400">Yönetim paneli</div>
            </div>
          </Link>
        )}
        <button type="button" onClick={toggleSidebar} className="hidden rounded-md bg-navy-800 p-1.5 text-slate-300 hover:text-white lg:block" aria-label="Menüyü daralt">
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {link({ href: '/panel', label: 'Pano', icon: LayoutGrid }, false)}
        {!collapsed && (
          <div>
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-sky-400/80">Benim menüm</div>
            {favItems.length ? (
              favItems.map((i) => link(i))
            ) : (
              <p className="px-3 text-[11px] leading-snug text-slate-400">Menüdeki yıldıza tıklayarak sık kullandığınız sayfaları buraya ekleyin.</p>
            )}
          </div>
        )}
        {NAV.map((g) => (
          <div key={g.title}>
            {!collapsed && <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-sky-400/80">{g.title}</div>}
            <div className="space-y-0.5">{g.items.map((i) => link(i))}</div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="no-print hidden lg:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="h-full">{sidebar}</div>
          <button type="button" className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Menüyü kapat" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="rounded-md border border-slate-200 p-1.5 lg:hidden dark:border-slate-700" onClick={() => setMobileOpen(true)} aria-label="Menü">
              <LayoutGrid className="size-4" />
            </button>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-200">
              {user?.tenantName.charAt(0).toLocaleUpperCase('tr')}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Çalışma alanı</div>
              <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.tenantName}</div>
              <div className="truncate text-[11px] text-slate-500">{user?.name}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleDark}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              <span className="hidden sm:inline">{dark ? 'Açık tema' : 'Koyu tema'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace('/giris');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-brand-600 text-white shadow">
      <Building2 className="size-5" />
    </div>
  );
}
