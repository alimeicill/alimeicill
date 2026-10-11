import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { listUnits } from '@/lib/server/units';

/**
 * Sitedeki bağımsız bölümlerin özet listesi (genel kurul hazirun cetveli vb.).
 * Tüm site kullanıcılarına açıktır; iletişim ve araç bilgileri gibi kişisel alanlar döndürülmez.
 */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  if (!auth.tenantId) return NextResponse.json([]);
  const units = await listUnits(auth.tenantId);
  return NextResponse.json(
    units.map((u) => ({
      id: u.id,
      tenantId: u.tenantId,
      blockName: u.blockName,
      number: u.number,
      floor: u.floor,
      areaSqm: u.areaSqm,
      ownershipShare: u.ownershipShare,
      ownerId: u.ownerId,
      ownerName: u.ownerName,
      status: u.status,
      type: u.type,
    })),
  );
}
