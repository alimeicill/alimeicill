import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireManager } from '@/lib/auth/session';
import { getInvoice, recordPayment } from '@/lib/server/dues';
import { D } from '@/lib/server/money';

type Ctx = { params: Promise<{ id: string }> };

const PaymentSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: 'Tutar sayı olmalı.' }).positive('Tutar sıfırdan büyük olmalı.'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD'], { errorMap: () => ({ message: 'Ödeme yöntemi seçin.' }) }),
  paidAt: z.coerce.date({ errorMap: () => ({ message: 'Ödeme tarihini girin.' }) }),
  notes: z.string().trim().max(200).optional(),
});

/** Elle tahsilat kaydı (nakit, havale, POS). */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const parsed = PaymentSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  if (parsed.data.paidAt > new Date(Date.now() + 86_400_000)) {
    return NextResponse.json({ error: 'Ödeme tarihi ileri bir tarih olamaz.' }, { status: 400 });
  }
  const result = await recordPayment(auth.tenantId, id, { ...parsed.data, amount: D(parsed.data.amount) });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ applied: result.applied, invoice: await getInvoice(auth.tenantId, id) }, { status: 201 });
}
