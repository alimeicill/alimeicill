import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { BankMovementClassification } from '@prisma/client';

export async function GET(req: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const tenantId = auth.tenantId;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');


    const whereClause: any = { tenantId };
    if (status) {
      whereClause.status = status;
    }

    const movements = await prisma.bankMovement.findMany({
      where: whereClause,
      orderBy: { transactionDate: 'desc' }
    });

    return NextResponse.json(movements);

  } catch (error: any) {
    console.error('Fetch bank movements error:', error);
    return NextResponse.json({ error: 'Banka hareketleri getirilirken hata oluştu.', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const tenantId = auth.tenantId;
  try {
    const body = await req.json();
    const { movementId, classification } = body;

    if (!movementId) {
      return NextResponse.json({ error: 'movementId gereklidir.' }, { status: 400 });
    }
    if (!Object.values(BankMovementClassification).includes(classification)) {
      return NextResponse.json({ error: 'Geçersiz sınıflandırma değeri.' }, { status: 400 });
    }

    // Yalnızca bu siteye ait hareket güncellenebilir.
    const { count } = await prisma.bankMovement.updateMany({
      where: { id: movementId, tenantId },
      data: {
        classification: classification as BankMovementClassification
      }
    });
    if (count === 0) {
      return NextResponse.json({ error: 'Banka hareketi bulunamadı.' }, { status: 404 });
    }
    const updated = await prisma.bankMovement.findUnique({ where: { id: movementId } });

    return NextResponse.json({
      success: true,
      message: 'Hareket sınıflandırması güncellendi.',
      data: updated
    });

  } catch (error: any) {
    console.error('Update bank movement error:', error);
    return NextResponse.json({ error: 'Banka hareketi güncellenirken hata oluştu.', details: error.message }, { status: 500 });
  }
}
