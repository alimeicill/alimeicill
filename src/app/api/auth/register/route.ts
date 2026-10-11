import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';

const RegisterSchema = z.object({
  siteName: z.string().trim().min(2, 'Site / apartman adını girin.'),
  name: z.string().trim().min(2, 'Ad soyad girin.'),
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi girin.'),
  phone: z.string().trim().optional(),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı.')
    .regex(/[A-Za-zÇĞİÖŞÜçğıöşü]/, 'Şifre en az bir harf içermeli.')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermeli.'),
});

function slugify(s: string) {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => map[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/** Yeni yönetim hesabı: site (tenant) ve site yöneticisi kullanıcıyı birlikte oluşturur. */
export async function POST(request: Request) {
  const parsed = RegisterSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { siteName, name, email, phone, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = `${slugify(siteName) || 'site'}-${Math.random().toString(36).slice(2, 7)}`;
  const user = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name: siteName, slug, type: 'SITE', email } });
    return tx.user.create({
      data: { tenantId: tenant.id, name, email, phone: phone || null, passwordHash, role: 'SITE_MANAGER' },
    });
  });

  await createSession({ userId: user.id, tenantId: user.tenantId, role: user.role });
  return NextResponse.json({ home: '/kurulum' }, { status: 201 });
}
