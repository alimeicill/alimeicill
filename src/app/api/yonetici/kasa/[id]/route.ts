import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireManager } from '@/lib/auth/session';
import { isValidTrIban, updateAccount } from '@/lib/server/cash';

type Ctx = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  name: z.string().trim().min(2, 'Hesap adını girin.').max(80).optional(),
  bankName: z.string().trim().max(60).optional().nullable(),
  iban: z
    .string()
    .trim()
    .max(40)
    .refine((v) => !v || isValidTrIban(v), 'IBAN geçersiz. TR ile başlayan 26 karakterlik IBAN numarasını kontrol edin.')
    .optional()
    .nullable(),
  holderName: z.string().trim().max(120).optional().nullable(),
  showToResidents: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/** Hesap bilgilerini düzenler; sakinlere gösterme ve hesabı kapatma da buradan. */
export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const parsed = PatchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const result = await updateAccount(auth.tenantId, id, parsed.data);
  if (result === 'not-found') return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 });
  if (result !== 'ok') return NextResponse.json({ error: result }, { status: 400 });
  return NextResponse.json({ ok: true });
}
