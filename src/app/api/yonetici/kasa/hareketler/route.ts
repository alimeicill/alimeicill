import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireManager } from '@/lib/auth/session';
import { addManualTransaction } from '@/lib/server/cash';
import { D } from '@/lib/server/money';

// Aidat tahsilatı buradan girilmez: Aidat ekranındaki tahsilat kasaya kendiliğinden işlenir.
const TxSchema = z
  .object({
    kind: z.enum(['OTHER_INCOME', 'EXPENSE', 'VENDOR_PAYMENT', 'TRANSFER'], { errorMap: () => ({ message: 'İşlem türünü seçin.' }) }),
    accountId: z.string().trim().min(1, 'Hesap seçin.'),
    targetAccountId: z.string().trim().optional(),
    amount: z.coerce.number({ invalid_type_error: 'Tutar sayı olmalı.' }).positive('Tutar sıfırdan büyük olmalı.').max(100_000_000, 'Tutar çok büyük.'),
    date: z.coerce.date({ errorMap: () => ({ message: 'İşlem tarihini girin.' }) }),
    description: z.string().trim().max(200).default(''),
  })
  .superRefine((v, ctx) => {
    if (v.kind === 'TRANSFER' && !v.targetAccountId) ctx.addIssue({ code: 'custom', message: 'Hedef hesabı seçin.', path: ['targetAccountId'] });
    if (v.kind !== 'TRANSFER' && v.description.length < 2) ctx.addIssue({ code: 'custom', message: 'Açıklama girin.', path: ['description'] });
  });

/** Elle kasa hareketi: diğer gelir, gider, firma/personel ödemesi veya virman. */
export async function POST(request: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const parsed = TxSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  if (parsed.data.date > new Date(Date.now() + 86_400_000)) {
    return NextResponse.json({ error: 'İşlem tarihi ileri bir tarih olamaz.' }, { status: 400 });
  }
  const result = await addManualTransaction(auth.tenantId, auth.id, { ...parsed.data, amount: D(parsed.data.amount) });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
