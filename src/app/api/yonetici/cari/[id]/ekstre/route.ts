import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_TENANT_ID = 'tenant-001';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cariHesapId = id;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT_ID;

    // Fetch the account to ensure it exists
    const account = await prisma.cariHesap.findFirst({
      where: {
        id: cariHesapId,
        tenantId,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Cari hesap bulunamadı.' }, { status: 404 });
    }

    // Fetch movements sorted chronologically (asc)
    const movements = await prisma.cariHareket.findMany({
      where: {
        cariHesapId,
        tenantId,
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Calculate dynamic running balance (yürüyen bakiye)
    let runningBalance = 0;
    const movementsWithBalance = movements.map((m) => {
      // DEBIT (Borç) increases the balance from the perspective of what they owe us (or bizden çıkan ödeme)
      // CREDIT (Alacak) decreases it (what we owe them / mal-hizmet girişi)
      if (m.direction === 'DEBIT') {
        runningBalance += m.amount;
      } else {
        runningBalance -= m.amount;
      }

      return {
        id: m.id,
        date: m.date,
        description: m.description,
        direction: m.direction,
        amount: m.amount,
        documentNo: m.documentNo,
        createdAt: m.createdAt,
        bakiye: runningBalance,
      };
    });

    return NextResponse.json({
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        taxOffice: account.taxOffice,
        taxNumber: account.taxNumber,
        phone: account.phone,
        email: account.email,
        address: account.address,
        bakiye: runningBalance,
      },
      hareketler: movementsWithBalance,
    });
  } catch (error: any) {
    console.error('Error fetching cari ekstre:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cariHesapId = id;
    const body = await request.json();
    const { date, description, direction, amount, documentNo, tenantId = DEFAULT_TENANT_ID } = body;

    if (!description || !direction || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Açıklama, yön (BORÇ/ALACAK) ve tutar alanları zorunludur.' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Tutar sıfırdan büyük olmalıdır.' }, { status: 400 });
    }

    if (direction !== 'DEBIT' && direction !== 'CREDIT') {
      return NextResponse.json({ error: 'Geçersiz hareket yönü. DEBIT veya CREDIT olmalıdır.' }, { status: 400 });
    }

    // Verify account exists
    const account = await prisma.cariHesap.findFirst({
      where: {
        id: cariHesapId,
        tenantId,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Cari hesap bulunamadı.' }, { status: 404 });
    }

    const newMovement = await prisma.cariHareket.create({
      data: {
        tenantId,
        cariHesapId,
        date: date ? new Date(date) : new Date(),
        description,
        direction,
        amount: parseFloat(amount),
        documentNo,
      },
    });

    return NextResponse.json(newMovement, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cari hareket:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
