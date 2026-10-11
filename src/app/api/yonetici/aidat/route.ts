import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireManager } from '@/lib/auth/session';
import { ChargeError, createCharges, listInvoices } from '@/lib/server/dues';
import { D } from '@/lib/server/money';

const ChargeSchema = z.object({
  unitId: z.string().trim().min(1, 'Daire seçin.'),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Dönem YYYY-AA biçiminde olmalı.'),
  amount: z.coerce
    .number({ invalid_type_error: 'Tutar sayı olmalı.' })
    .positive('Tutar sıfırdan büyük olmalı.')
    .max(100_000_000, 'Tutar çok büyük.'),
  dueDate: z.coerce.date({ errorMap: () => ({ message: 'Son ödeme tarihini girin.' }) }),
  description: z.string().trim().min(2, 'Açıklama girin.').max(120),
  method: z.enum(['fixed', 'equal', 'area', 'share'], { errorMap: () => ({ message: 'Geçersiz hesaplama yöntemi.' }) }),
});

export async function GET() {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await listInvoices({ tenantId: auth.tenantId }));
}

export async function POST(request: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const parsed = ChargeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const b = parsed.data;
  try {
    const result = await createCharges(auth.tenantId, {
      unitId: b.unitId,
      period: b.period,
      amount: D(b.amount),
      dueDate: b.dueDate,
      description: b.description,
      method: b.method,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof ChargeError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error('[aidat] tahakkuk hatası', e);
    return NextResponse.json({ error: 'Borç tahakkuku oluşturulamadı.' }, { status: 500 });
  }
}
