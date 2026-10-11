import { NextResponse } from 'next/server';
import type { UserRole as DbRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/auth/session';
import type { User, UserRole } from '@/types';

// Veritabanı rolü → arayüz rolü. Personel ve platform yöneticisi sakin rehberinde listelenmez.
const ROLE_TO_UI: Partial<Record<DbRole, UserRole>> = {
  SITE_MANAGER: 'site_manager',
  ACCOUNTANT: 'accountant',
  BOARD_MEMBER: 'block_rep',
  OWNER: 'owner',
  TENANT_RESIDENT: 'tenant',
  GUARANTOR: 'tenant',
};

export type ResidentDto = User & { email: string; unitLabel: string | null; canLogin: boolean };

const ResidentSchema = z.object({
  name: z.string().trim().min(2, 'Ad soyad girin.').max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().email('Geçerli bir e-posta adresi girin.').optional()),
  phone: z.string().trim().max(30).optional().transform((v) => v || undefined),
  // Yönetim hesapları bu ekrandan açılamaz (panele erişim verir).
  role: z.enum(['owner', 'tenant'], { errorMap: () => ({ message: 'Sakin türü malik veya kiracı olmalıdır.' }) }),
  unitId: z.string().trim().optional().transform((v) => v || undefined),
});

export async function GET() {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const users = await prisma.user.findMany({
    where: { tenantId: auth.tenantId, role: { in: Object.keys(ROLE_TO_UI) as DbRole[] } },
    include: { apartments: { include: { apartment: { include: { block: { select: { name: true } } } } } } },
    orderBy: { name: 'asc' },
  });
  const list: ResidentDto[] = users.map((u) => {
    const link = u.apartments.find((a) => a.isOwner) ?? u.apartments[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email ?? '',
      phone: u.phone ?? undefined,
      role: ROLE_TO_UI[u.role]!,
      unitId: link?.apartmentId,
      unitLabel: link ? `${link.apartment.block.name} / Daire ${link.apartment.number}${link.isOwner ? ' (Malik)' : ' (Kiracı)'}` : null,
      tenantId: auth.tenantId,
      canLogin: !!u.passwordHash,
      createdAt: u.createdAt.toISOString(),
    };
  });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const parsed = ResidentSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { name, email, phone, role, unitId } = parsed.data;

  if (email && (await prisma.user.findUnique({ where: { email } }))) {
    return NextResponse.json({ error: 'Bu e-posta adresi başka bir kullanıcıya kayıtlı.' }, { status: 409 });
  }
  if (unitId && !(await prisma.apartment.findFirst({ where: { id: unitId, tenantId: auth.tenantId }, select: { id: true } }))) {
    return NextResponse.json({ error: 'Seçilen daire bulunamadı.' }, { status: 404 });
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { tenantId: auth.tenantId, name, email: email ?? null, phone: phone ?? null, role: role === 'owner' ? 'OWNER' : 'TENANT_RESIDENT' },
    });
    if (unitId) {
      await tx.apartmentUser.create({ data: { apartmentId: unitId, userId: created.id, isOwner: role === 'owner' } });
      await tx.apartment.update({ where: { id: unitId }, data: { status: 'OCCUPIED' } });
    }
    return created;
  });
  return NextResponse.json({ id: user.id }, { status: 201 });
}
