import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/auth/session';
import { findResident } from '@/lib/server/residents';

type Ctx = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().email('Geçerli bir e-posta adresi girin.').optional()),
  phone: z.string().trim().max(30).optional(),
});

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const parsed = UpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const user = await findResident(id, auth.tenantId);
  if (!user) return NextResponse.json({ error: 'Sakin bulunamadı.' }, { status: 404 });
  const { email, phone } = parsed.data;
  // Giriş yapabilen sakinin e-postası değiştirilemez (hesap ele geçirmeye yol açabilir).
  if (email !== undefined && email !== user.email && user.passwordHash) {
    return NextResponse.json({ error: 'Giriş yapabilen sakinin e-posta adresi buradan değiştirilemez.' }, { status: 409 });
  }
  if (email && email !== user.email && (await prisma.user.findUnique({ where: { email } }))) {
    return NextResponse.json({ error: 'Bu e-posta adresi başka bir kullanıcıya kayıtlı.' }, { status: 409 });
  }
  await prisma.user.update({
    where: { id },
    data: { ...(email !== undefined ? { email } : {}), ...(phone !== undefined ? { phone: phone || null } : {}) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const user = await findResident(id, auth.tenantId);
  if (!user) return NextResponse.json({ error: 'Sakin bulunamadı veya bu ekrandan silinemez.' }, { status: 404 });
  await prisma.$transaction([
    prisma.apartmentUser.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
