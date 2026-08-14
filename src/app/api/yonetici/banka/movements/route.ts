import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BankMovementClassification } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId gereklidir.' }, { status: 400 });
    }

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
  try {
    const body = await req.json();
    const { movementId, classification } = body;

    if (!movementId) {
      return NextResponse.json({ error: 'movementId gereklidir.' }, { status: 400 });
    }
    if (!Object.values(BankMovementClassification).includes(classification)) {
      return NextResponse.json({ error: 'Geçersiz sınıflandırma değeri.' }, { status: 400 });
    }

    const updated = await prisma.bankMovement.update({
      where: { id: movementId },
      data: {
        classification: classification as BankMovementClassification
      }
    });

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
