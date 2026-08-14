import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BankMovementClassification, BankMovementStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, csvContent, columnMapping } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId gereklidir.' }, { status: 400 });
    }
    if (!csvContent) {
      return NextResponse.json({ error: 'Dosya içeriği boş veya geçersiz.' }, { status: 400 });
    }
    if (!columnMapping) {
      return NextResponse.json({ error: 'Sütun eşleştirme şablonu tanımlanmalıdır.' }, { status: 400 });
    }

    const { dateIndex, amountIndex, senderIndex, descriptionIndex } = columnMapping;

    const lines = csvContent.split('\n');
    let importedCount = 0;
    let duplicateCount = 0;

    // We start from line index 1 (skipping header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(';');
      if (columns.length <= Math.max(dateIndex, amountIndex, senderIndex, descriptionIndex)) {
        continue;
      }

      const dateStr = columns[dateIndex]?.trim();
      const amountStr = columns[amountIndex]?.trim();
      const sender = columns[senderIndex]?.trim() || '';
      const description = columns[descriptionIndex]?.trim() || '';

      const amountVal = Number(amountStr?.replace(',', '.'));
      if (isNaN(amountVal) || amountVal <= 0) continue;

      // Unique transaction ref generation to prevent duplicate insertions
      // Generate a simple hash based on date, amount, sender and description to identify duplicates
      const hashStr = `${dateStr}-${amountVal}-${sender}-${description}`;
      const transactionRef = 'TX' + Buffer.from(hashStr).toString('base64').substring(0, 10).toUpperCase();

      // Duplicate Check
      const exists = await prisma.bankMovement.findUnique({
        where: { transactionRef }
      });

      if (exists) {
        duplicateCount++;
        continue;
      }

      // Save as unmatched bank movement
      await prisma.bankMovement.create({
        data: {
          tenantId,
          transactionRef,
          transactionDate: new Date(dateStr || Date.now()),
          amount: amountVal,
          description,
          senderName: sender,
          status: BankMovementStatus.UNMATCHED,
          classification: BankMovementClassification.MEMBER_COLLECTION
        }
      });

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${importedCount} adet yeni banka hareketi başarıyla yüklendi.`,
      stats: {
        imported: importedCount,
        skippedDuplicates: duplicateCount
      }
    });

  } catch (error: any) {
    console.error('Import bank movements error:', error);
    return NextResponse.json({ error: 'Dekont dosyası aktarılırken hata oluştu.', details: error.message }, { status: 500 });
  }
}
