import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { homePath } from '@/lib/auth/roles';
import { tooManyAttempts, recordFailure, clearFailures } from '@/lib/auth/throttle';
import type { UserRole } from '@prisma/client';

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Şifrenizi girin.'),
});

// Demo hesapları (Veritabanı kapalı veya seed yapılmamış olsa bile her zaman çalışır)
export const DEMO_ACCOUNTS: Record<string, { id: string; name: string; role: UserRole; tenantId: string | null }> = {
  'admin@demo.apartmanyonet.com': { id: 'user-admin', name: 'Platform Yöneticisi', role: 'SUPER_ADMIN', tenantId: null },
  'yonetici@demo.apartmanyonet.com': { id: 'user-001', name: 'Hasan Korkmaz', role: 'SITE_MANAGER', tenantId: 'tenant-001' },
  'muhasebe@demo.apartmanyonet.com': { id: 'user-002', name: 'Zeynep Arslan', role: 'ACCOUNTANT', tenantId: 'tenant-001' },
  'personel@demo.apartmanyonet.com': { id: 'user-staff', name: 'Murat Usta', role: 'TECHNICAL_STAFF', tenantId: 'tenant-001' },
  'sakin@demo.apartmanyonet.com': { id: 'user-005', name: 'Mehmet Demir', role: 'OWNER', tenantId: 'tenant-001' },
};

const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 10);

export async function POST(request: Request) {
  const parsed = LoginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { email, password } = parsed.data;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  const key = `${ip}|${email}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ error: 'Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin.' }, { status: 429 });
  }

  // 1. Demo hesap kontrolü (Demo2026!)
  const demo = DEMO_ACCOUNTS[email];
  if (demo && password === 'Demo2026!') {
    clearFailures(key);
    await createSession({ userId: demo.id, tenantId: demo.tenantId, role: demo.role, ver: 1 });
    return NextResponse.json({ name: demo.name, role: demo.role, home: homePath(demo.role) });
  }

  // 2. Veritabanı kontrolü
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.passwordHash || !ok || !user.isActive) {
      recordFailure(key);
      return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
    }

    clearFailures(key);
    await createSession({ userId: user.id, tenantId: user.tenantId, role: user.role, ver: user.sessionVersion });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
    return NextResponse.json({ name: user.name, role: user.role, home: homePath(user.role) });
  } catch (err) {
    // Veritabanına ulaşılamadıysa ve demo hesabı ise giriş yaptır
    if (demo && password === 'Demo2026!') {
      clearFailures(key);
      await createSession({ userId: demo.id, tenantId: demo.tenantId, role: demo.role, ver: 1 });
      return NextResponse.json({ name: demo.name, role: demo.role, home: homePath(demo.role) });
    }
    recordFailure(key);
    return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
  }
}
