import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { homePath } from '@/lib/auth/roles';
import { tooManyAttempts, recordFailure, clearFailures } from '@/lib/auth/throttle';

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Şifrenizi girin.'),
});

// Kullanıcı bulunamadığında da bcrypt çalıştırılır; yanıt süresinden e-postanın kayıtlı olup olmadığı anlaşılmasın.
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

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !ok || !user.isActive) {
    recordFailure(key);
    return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
  }

  clearFailures(key);
  await createSession({ userId: user.id, tenantId: user.tenantId, role: user.role });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return NextResponse.json({ name: user.name, role: user.role, home: homePath(user.role) });
}
