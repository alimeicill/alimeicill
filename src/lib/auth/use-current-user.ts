'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '@prisma/client';

export interface Me {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  tenantName: string | null;
  home: string;
  ownedUnitIds: string[];
}

/** Giriş yapmış kullanıcı (oturum yoksa null). */
export function useCurrentUser() {
  return useQuery<Me | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      return res.ok ? res.json() : null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    qc.clear();
    // Tam sayfa yenileme: önbellekteki tüm kullanıcı verisi temizlensin.
    window.location.href = '/giris';
  };
}
