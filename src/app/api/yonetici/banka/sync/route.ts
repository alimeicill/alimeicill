import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BankAdapterFactory } from '@/lib/services/bank-adapters';
import { BankMovementStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, provider = 'Garanti', bankAccountId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId gereklidir.' }, { status: 400 });
    }

    // 1. Get bank adapter
    const adapter = BankAdapterFactory.getAdapter(provider);

    // 2. Fetch raw bank transactions
    const rawTxs = await adapter.fetchTransactions(bankAccountId || 'default-account');

    let newCount = 0;
    let duplicateCount = 0;

    // 3. Save transactions into BankMovement table, skip if transactionRef already exists
    for (const tx of rawTxs) {
      // Check duplicate
      const exists = await prisma.bankMovement.findUnique({
        where: { transactionRef: tx.transactionRef }
      });

      if (exists) {
        duplicateCount++;
        continue;
      }

      // Save new movement
      await prisma.bankMovement.create({
        data: {
          tenantId,
          transactionRef: tx.transactionRef,
          transactionDate: new Date(tx.transactionDate),
          amount: tx.amount,
          description: tx.description,
          senderName: tx.senderName || '',
          status: BankMovementStatus.UNMATCHED
        }
      });
      newCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Banka entegrasyon senkronizasyonu tamamlandı.`,
      stats: {
        fetched: rawTxs.length,
        inserted: newCount,
        skippedDuplicates: duplicateCount
      }
    });

  } catch (error: any) {
    console.error('Bank sync API error:', error);
    return NextResponse.json({ error: 'Banka hareketi senkronizasyonu sırasında hata oluştu.', details: error.message }, { status: 500 });
  }
}
