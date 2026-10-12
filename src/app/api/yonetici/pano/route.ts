import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { managerDashboard } from '@/lib/server/dashboard';

/** Yönetici panosu rakamları: doluluk, tahsilat, borç, kasa ve son 6 ayın gelir-gideri. */
export async function GET() {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await managerDashboard(auth.tenantId));
}
