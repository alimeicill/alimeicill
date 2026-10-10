'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { FeedbackWidget } from '@/components/layout/FeedbackWidget';
import { useUIStore } from '@/stores/ui';
import { cn } from '@/lib/utils';

const authRoutes = ['/giris', '/kayit', '/sifremi-unuttum', '/kurulum'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUIStore();

  const isAuthOrLanding = pathname === '/' || authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthOrLanding) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300 print:ml-0',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-64'
        )}
      >
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 print:overflow-visible print:p-0">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
      <div className="print:hidden">
        <FeedbackWidget />
      </div>
    </div>
  );
}
