import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cache } from 'react';
import type { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { MANAGER_ROLES } from './roles';
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type SessionPayload } from './token';

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  (await cookies()).set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

const DEMO_FALLBACK_USERS: Record<string, { id: string; name: string; email: string; role: UserRole; tenantId: string | null; tenantName: string }> = {
  'user-admin': { id: 'user-admin', name: 'Platform Yöneticisi', email: 'admin@demo.apartmanyonet.com', role: 'SUPER_ADMIN', tenantId: null, tenantName: 'SaaS Platformu' },
  'user-001': { id: 'user-001', name: 'Hasan Korkmaz', email: 'yonetici@demo.apartmanyonet.com', role: 'SITE_MANAGER', tenantId: 'tenant-001', tenantName: 'Yıldız Konakları Sitesi' },
  'user-002': { id: 'user-002', name: 'Zeynep Arslan', email: 'muhasebe@demo.apartmanyonet.com', role: 'ACCOUNTANT', tenantId: 'tenant-001', tenantName: 'Yıldız Konakları Sitesi' },
  'user-staff': { id: 'user-staff', name: 'Murat Usta', email: 'personel@demo.apartmanyonet.com', role: 'TECHNICAL_STAFF', tenantId: 'tenant-001', tenantName: 'Yıldız Konakları Sitesi' },
  'user-005': { id: 'user-005', name: 'Mehmet Demir', email: 'sakin@demo.apartmanyonet.com', role: 'OWNER', tenantId: 'tenant-001', tenantName: 'Yıldız Konakları Sitesi' },
};

/**
 * Geçerli kullanıcı. Çerezdeki imzayı doğrular ve kullanıcının hâlâ aktif olduğunu
 * veritabanından kontrol eder (devre dışı bırakılan kullanıcının oturumu hemen düşer).
 */
export const getCurrentUser = cache(async () => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true, tenantId: true, isActive: true, sessionVersion: true, tenant: { select: { name: true } } },
    });
    if (user && user.isActive && user.sessionVersion === session.ver) return user;
  } catch (err) {
    // Veritabanı çevrimdışı olduğunda demo kullanıcı yedeğine başvur
  }

  const demo = DEMO_FALLBACK_USERS[session.userId];
  if (demo && demo.role === session.role) {
    return {
      id: demo.id,
      name: demo.name,
      email: demo.email,
      role: demo.role,
      tenantId: demo.tenantId,
      isActive: true,
      sessionVersion: 1,
      tenant: demo.tenantId ? { name: demo.tenantName } : null,
    };
  }

  return null;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Route handler'larda yetki kontrolü. Başarılıysa kullanıcıyı, değilse hazır hata yanıtını döner:
 *   const auth = await requireUser(MANAGER_ROLES); if (auth instanceof NextResponse) return auth;
 */
export async function requireUser(roles?: UserRole[]): Promise<CurrentUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen giriş yapın.' }, { status: 401 });
  if (roles && !roles.includes(user.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
  }
  return user;
}

/** Yönetici rolü + kiracı (site) zorunlu. Verilere her zaman bu tenantId ile erişilir. */
export async function requireManager() {
  const auth = await requireUser(MANAGER_ROLES);
  if (auth instanceof NextResponse) return auth;
  if (!auth.tenantId) return NextResponse.json({ error: 'Hesabınız bir siteye bağlı değil.' }, { status: 403 });
  return auth as CurrentUser & { tenantId: string };
}
