'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loading } from './ui';
import { useSession } from '@/lib/session';

/** Oturum localStorage'dan yüklenene kadar bekler, sonra role göre yönlendirir. */
export function RoleGuard({ role, children }: { role: 'ADMIN' | 'RESIDENT'; children: React.ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const user = useSession((s) => s.user);

  useEffect(() => {
    if (useSession.persist.hasHydrated()) setHydrated(true);
    return useSession.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace('/giris');
    else if (user.role !== role) router.replace(user.role === 'ADMIN' ? '/panel' : '/sakin');
  }, [hydrated, user, role, router]);

  if (!hydrated || !user || user.role !== role) return <Loading />;
  return <>{children}</>;
}
