import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { homePath, ROLE_LABELS } from '@/lib/auth/roles';
import { mockUnits } from '@/lib/mock-data';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role],
    tenantName: user.tenant?.name ?? null,
    home: homePath(user.role),
    // Daireler henüz veritabanında değil; kat maliki olunan daireler örnek veriden eşlenir.
    ownedUnitIds: mockUnits.filter((u) => u.ownerId === user.id).map((u) => u.id),
  });
}
