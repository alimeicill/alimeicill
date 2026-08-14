import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BankMovementStatus, DueStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { movementId } = body;

    if (!movementId) {
      return NextResponse.json({ error: 'movementId gereklidir.' }, { status: 400 });
    }

    // 1. Fetch bank movement
    const movement = await prisma.bankMovement.findUnique({
      where: { id: movementId }
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
        receiptNo: movement.transactionRef
      }
    });

    // 3. Execute undo in Prisma transaction
    await prisma.$transaction(async (tx) => {
      if (linkedPayment) {
        if (linkedPayment.dueId) {
          const due = await tx.due.findUnique({
            where: { id: linkedPayment.dueId }
          });

          if (due) {
            // Revert due amounts
            const revertedPaidAmount = Math.max(0, due.paidAmount - linkedPayment.amount);
            const isRevertedToPending = revertedPaidAmount <= 0;

            await tx.due.update({
              where: { id: due.id },
              data: {
                paidAmount: revertedPaidAmount,
                status: isRevertedToPending ? DueStatus.PENDING : DueStatus.PARTIAL,
                paidAt: null
              }
            });
          }
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
