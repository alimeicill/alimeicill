import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const Schema = z.object({
  token: z.string().min(20, 'Geçersiz bağlantı.'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı.')
    .regex(/[A-Za-zÇĞİÖŞÜçğıöşü]/, 'Şifre en az bir harf içermeli.')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermeli.'),
});

const INVALID = 'Bağlantı geçersiz veya süresi dolmuş. Lütfen yeniden şifre sıfırlama isteyin.';

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { token, password } = parsed.data;

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: INVALID }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    // sessionVersion artınca diğer cihazlardaki açık oturumlar kapanır.
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);
  return NextResponse.json({ ok: true });
}
