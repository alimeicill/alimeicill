import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { deleteManualTransaction } from '@/lib/server/cash';

type Ctx = { params: Promise<{ id: string }> };

/** Elle girilmiş hatalı hareketi siler (aidat tahsilatları hariç). */
export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const result = await deleteManualTransaction(auth.tenantId, id);
  if (result === 'not-found') return NextResponse.json({ error: 'Hareket bulunamadı.' }, { status: 404 });
  if (result !== 'ok') return NextResponse.json({ error: result }, { status: 400 });
  return NextResponse.json({ ok: true });
}
