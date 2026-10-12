import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { statement } from '@/lib/server/cash';

type Ctx = { params: Promise<{ id: string }> };

/** Hesap ekstresi (yürüyen bakiyeyle, en yeni üstte). */
export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const rows = await statement(auth.tenantId, id);
  if (!rows) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 });
  return NextResponse.json(rows);
}
