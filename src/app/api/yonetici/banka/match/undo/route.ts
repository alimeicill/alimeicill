import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { revertFromDue } from '@/lib/server/dues';
import { D } from '@/lib/server/money';
import { BankMovementStatus, DueStatus } from '@prisma/client';

export async function POST(req: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const tenantId = auth.tenantId;
  try {
    const body = await req.json();
    const { movementId } = body;

    if (!movementId) {
      return NextResponse.json({ error: 'movementId gereklidir.' }, { status: 400 });
    }

    // 1. Fetch bank movement
    const movement = await prisma.bankMovement.findFirst({
      where: { id: movementId, tenantId }
    });

    if (!movement) {
      return NextResponse.json({ error: 'Banka hareketi bulunamadı.' }, { status: 404 });
    }

    if (movement.status === BankMovementStatus.UNMATCHED) {
      return NextResponse.json({ error: 'Bu hareket zaten eşleşmemiş durumda.' }, { status: 400 });
    }

    // 2. Find payment linked to this transaction Ref
    const linkedPayment = await prisma.payment.findFirst({
      where: {
        tenantId,
        receiptNo: movement.transactionRef
      }
    });

    // 3. Execute undo in Prisma transaction
    await prisma.$transaction(async (tx) => {
      if (linkedPayment) {
        if (linkedPayment.dueId) {
          await revertFromDue(tx, linkedPayment.dueId, D(linkedPayment.amount));
        }

        // Delete the payment record
        await tx.payment.delete({
          where: { id: linkedPayment.id }
        });
      }

      // 4. Reset bank movement matching fields
      await tx.bankMovement.update({
        where: { id: movementId },
        data: {
          status: BankMovementStatus.UNMATCHED,
          matchedResidentId: null,
          matchedApartmentId: null,
          matchedDueId: null,
          confidenceScore: null,
          matchedBy: null,
          matchedAt: null
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Eşleşme başarıyla geri alındı, ödeme silindi ve ilgili aidat borcu güncellendi.'
    });

  } catch (error: any) {
    console.error('Undo match API error:', error);
    return NextResponse.json({ error: 'Eşleşmeyi geri alma sırasında hata oluştu.', details: error.message }, { status: 500 });
  }
}
