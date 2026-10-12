import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireManager } from '@/lib/auth/session';
import { createAccount, isValidTrIban, listAccounts } from '@/lib/server/cash';
import { D } from '@/lib/server/money';

const IBAN_ERROR = 'IBAN geçersiz. TR ile başlayan 26 karakterlik IBAN numarasını kontrol edin.';

const AccountSchema = z
  .object({
    name: z.string().trim().min(2, 'Hesap adını girin.').max(80),
    type: z.enum(['CASH', 'BANK'], { errorMap: () => ({ message: 'Hesap türünü seçin.' }) }),
    bankName: z.string().trim().max(60).optional().nullable(),
    iban: z.string().trim().max(40).optional().nullable(),
    holderName: z.string().trim().max(120).optional().nullable(),
    showToResidents: z.boolean().optional(),
    openingBalance: z.coerce
      .number({ invalid_type_error: 'Açılış bakiyesi sayı olmalı.' })
      .min(0, 'Açılış bakiyesi eksi olamaz.')
      .max(100_000_000, 'Tutar çok büyük.')
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type !== 'BANK') return;
    if (!v.bankName) ctx.addIssue({ code: 'custom', message: 'Banka adını girin.', path: ['bankName'] });
    if (v.iban && !isValidTrIban(v.iban)) ctx.addIssue({ code: 'custom', message: IBAN_ERROR, path: ['iban'] });
    if (v.showToResidents && !v.iban) ctx.addIssue({ code: 'custom', message: 'Sakinlere göstermek için IBAN girin.', path: ['iban'] });
  });

/** Kasa ve banka hesapları, güncel bakiyeleriyle. */
export async function GET() {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await listAccounts(auth.tenantId));
}

export async function POST(request: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const parsed = AccountSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const b = parsed.data;
  const id = await createAccount(auth.tenantId, auth.id, { ...b, openingBalance: b.openingBalance ? D(b.openingBalance) : undefined });
  return NextResponse.json({ id }, { status: 201 });
}
