import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';
import { listInvoices } from '@/lib/server/dues';

/** Sakinin bağlı olduğu (malik veya kiracı) dairelerin borç ve ödemeleri. */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  if (!auth.tenantId) return NextResponse.json({ units: [], invoices: [] });
  const links = await prisma.apartmentUser.findMany({
    where: { userId: auth.id, apartment: { tenantId: auth.tenantId } },
    select: { isOwner: true, apartment: { select: { id: true, number: true, block: { select: { name: true } } } } },
  });
  const unitIds = links.map((l) => l.apartment.id);
  const invoices = unitIds.length
    ? await listInvoices({ tenantId: auth.tenantId, apartmentId: { in: unitIds }, status: { not: 'CANCELLED' } })
    : [];
  return NextResponse.json({
    units: links.map((l) => ({ id: l.apartment.id, label: `${l.apartment.block.name} / Daire ${l.apartment.number}`, isOwner: l.isOwner })),
    invoices,
  });
}
