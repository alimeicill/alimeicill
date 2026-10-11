import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireManager } from '@/lib/auth/session';
import { createUnit, listUnits } from '@/lib/server/units';

const optText = z.string().trim().max(120).optional().transform((v) => v || undefined);

const UnitSchema = z.object({
  blockName: z.string().trim().min(1, 'Blok adı zorunludur.').max(40),
  number: z.string().trim().min(1, 'Daire numarası zorunludur.').max(20),
  floor: z.coerce.number({ invalid_type_error: 'Kat sayı olmalı.' }).int('Kat tam sayı olmalı.').min(-5, 'Kat en az -5 olabilir.').max(200, 'Kat en fazla 200 olabilir.'),
  type: z.enum(['residential', 'commercial', 'parking'], { errorMap: () => ({ message: 'Geçersiz daire tipi.' }) }),
  areaSqm: z.coerce.number({ invalid_type_error: 'Metrekare sayı olmalı.' }).positive('Metrekare sıfırdan büyük olmalı.').max(100000, 'Metrekare çok büyük.'),
  ownershipShare: z.coerce.number({ invalid_type_error: 'Arsa payı sayı olmalı.' }).min(0, 'Arsa payı negatif olamaz.').max(1000000, 'Arsa payı çok büyük.'),
  status: z.enum(['occupied', 'vacant', 'maintenance'], { errorMap: () => ({ message: 'Geçersiz daire durumu.' }) }),
  rooms: optText,
  ownerName: optText,
  tenantName: optText,
  emergencyName: optText,
  emergencyPhone: optText,
  vehicle: optText,
  pet: optText,
});

export async function GET() {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await listUnits(auth.tenantId));
}

export async function POST(request: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const parsed = UnitSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    return NextResponse.json(await createUnit(auth.tenantId, parsed.data), { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json(
        { error: `${parsed.data.blockName} bloğunda ${parsed.data.number} numaralı daire zaten mevcut.` },
        { status: 409 },
      );
    }
    console.error('[daireler] ekleme hatası', e);
    return NextResponse.json({ error: 'Daire eklenemedi.' }, { status: 500 });
  }
}
