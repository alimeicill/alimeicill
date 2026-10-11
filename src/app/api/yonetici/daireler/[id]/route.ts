import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { deleteUnit } from '@/lib/server/units';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const result = await deleteUnit(auth.tenantId, id);
  if (result === 'not-found') return NextResponse.json({ error: 'Daire bulunamadı.' }, { status: 404 });
  if (result === 'has-records') {
    return NextResponse.json(
      { error: 'Bu daireye bağlı borç, ödeme, talep veya toplantı kaydı olduğu için silinemez.' },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
