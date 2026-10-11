import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { cancelDue } from '@/lib/server/dues';

type Ctx = { params: Promise<{ id: string }> };

/** Borcu iptal eder. Tahsilatı olan borç iptal edilemez. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const result = await cancelDue(auth.tenantId, id);
  if (result === 'not-found') return NextResponse.json({ error: 'Borç kaydı bulunamadı.' }, { status: 404 });
  if (result === 'has-payments') {
    return NextResponse.json({ error: 'Tahsilatı olan borç iptal edilemez.' }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
