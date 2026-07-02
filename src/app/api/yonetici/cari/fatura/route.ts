import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_TENANT_ID = 'tenant-001';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT_ID;

    // Fetch all current account invoices with their cari details
    const invoices = await prisma.cariFatura.findMany({
      where: {
        tenantId,
      },
      include: {
        cariHesap: {
          select: {
            code: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Error fetching cari faturalar:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      cariHesapId, 
      invoiceNo, 
      invoiceDate, 
      documentType, 
      netAmount, 
      taxAmount, 
      totalAmount, 
      description,
      tenantId = DEFAULT_TENANT_ID 
    } = body;

    // Validations
    if (!cariHesapId || !invoiceNo || !invoiceDate || !documentType || netAmount === undefined || taxAmount === undefined || totalAmount === undefined || !description) {
      return NextResponse.json({ error: 'Lütfen tüm zorunlu alanları doldurun.' }, { status: 400 });
    }

    // Verify current account exists
    const cariHesap = await prisma.cariHesap.findFirst({
      where: {
        id: cariHesapId,
        tenantId,
      },
    });

    if (!cariHesap) {
      return NextResponse.json({ error: 'Seçilen cari hesap bulunamadı.' }, { status: 404 });
    }

    // Prisma Transaction for atomic write to CariFatura and CariHareket
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the CariFatura
      const faturDateParsed = new Date(invoiceDate);
      const invoice = await tx.cariFatura.create({
        data: {
          tenantId,
          cariHesapId,
          invoiceNo,
          invoiceDate: faturDateParsed,
          documentType,
          netAmount: parseFloat(netAmount),
          taxAmount: parseFloat(taxAmount),
          totalAmount: parseFloat(totalAmount),
          description,
        },
      });

      // 2. Create the corresponding CariHareket (Borç / DEBIT)
      // Turkish business logic: Fatura is debited (Borç) to the current account as per prompt rules
      const docTypeLabel = documentType === 'FATURA' ? 'Fatura' : 'Tahakkuk';
      const movement = await tx.cariHareket.create({
        data: {
          tenantId,
          cariHesapId,
          cariFaturaId: invoice.id,
          date: faturDateParsed,
          description: `${docTypeLabel} Girişi: ${invoiceNo} - ${description}`,
          direction: 'DEBIT', // "Borç" kaydı as specified in the prompt rules
          amount: parseFloat(totalAmount),
          documentNo: invoiceNo,
        },
      });

      return { invoice, movement };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cari fatura transaction:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
