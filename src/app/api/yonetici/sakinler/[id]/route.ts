import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/auth/session';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  // Yalnızca bu sitenin sakinleri silinebilir; yönetim hesapları buradan silinmez.
  const user = await prisma.user.findFirst({
    where: { id, tenantId: auth.tenantId, role: { in: ['OWNER', 'TENANT_RESIDENT', 'GUARANTOR'] } },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'Sakin bulunamadı veya bu ekrandan silinemez.' }, { status: 404 });
  await prisma.$transaction([
    prisma.apartmentUser.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
