import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_TENANT_ID = 'tenant-001'; // Matches mock tenant ID

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT_ID;

    // Fetch accounts and compute balance for each account
    const accounts = await prisma.cariHesap.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        hareketler: {
          select: {
            direction: true,
            amount: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    const formattedAccounts = accounts.map((acc) => {
      // Calculate bakiye dynamically: Borç (DEBIT) - Alacak (CREDIT)
      // Turkish accounting: 
      // Borç (DEBIT) = Bizim onlara verdiğimiz/ödediğimiz ya da onların bize borçlandığı
      // Alacak (CREDIT) = Onların bize mal/hizmet verdiği ya da bizim onlara borçlandığımız
      let totalDebit = 0;
      let totalCredit = 0;

      acc.hareketler.forEach((h) => {
        if (h.direction === 'DEBIT') {
          totalDebit += h.amount;
        } else {
          totalCredit += h.amount;
        }
      });

      const bakiye = totalDebit - totalCredit;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        taxOffice: acc.taxOffice,
        taxNumber: acc.taxNumber,
        phone: acc.phone,
        email: acc.email,
        address: acc.address,
        isActive: acc.isActive,
        createdAt: acc.createdAt,
        totalDebit,
        totalCredit,
        bakiye, // Positive: cari owes us; Negative: we owe cari
      };
    });

    return NextResponse.json(formattedAccounts);
  } catch (error: any) {
    console.error('Error fetching cari accounts:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, type, taxOffice, taxNumber, phone, email, address, tenantId = DEFAULT_TENANT_ID } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ error: 'Cari kod, unvan/ad ve tür alanları zorunludur.' }, { status: 400 });
    }

    // Check if code is already used in this tenant
    const existing = await prisma.cariHesap.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Bu cari kod zaten kullanılmaktadır.' }, { status: 400 });
    }

    const newAccount = await prisma.cariHesap.create({
      data: {
        tenantId,
        code,
        name,
        type,
        taxOffice,
        taxNumber,
        phone,
        email,
        address,
      },
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cari account:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
