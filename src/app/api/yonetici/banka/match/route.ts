import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { applyToDue } from '@/lib/server/dues';
import { D } from '@/lib/server/money';
import { ReconciliationEngine } from '@/lib/services/reconciliation-engine';
import { BankMovementStatus, DueStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export async function POST(req: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const tenantId = auth.tenantId;
  try {
    const body = await req.json();


    // 1. Fetch unmatched bank movements
    const unmatchedMovements = await prisma.bankMovement.findMany({
      where: {
        tenantId,
        status: BankMovementStatus.UNMATCHED
      }
    });

    if (unmatchedMovements.length === 0) {
      return NextResponse.json({ success: true, message: 'Eşleştirilecek yeni hareket bulunamadı.', matchedCount: 0 });
    }

    // 2. Fetch all active residents and apartments for matching context
    const users = await prisma.user.findMany({
      where: { tenantId },
      include: {
        apartments: true
      }
    });

    const dbResidents = await prisma.resident.findMany({
      where: { tenantId }
    });

    const residents = dbResidents.map(res => ({
      ...res,
      user: users.find(u => u.id === res.userId)
    }));

    const apartments = await prisma.apartment.findMany({
      where: { tenantId },
      include: {
        block: true,
        residents: {
          include: {
            user: true
          }
        }
      }
    });

    let autoMatchedCount = 0;

    // 3. Process each unmatched bank movement
    for (const movement of unmatchedMovements) {
      const matchResult = ReconciliationEngine.reconcile(
        movement.description,
        movement.senderName || '',
        residents,
        apartments
      );

      if (matchResult.isMatched && matchResult.matchedApartmentId) {
        // Eşleşen daire için en eski ödenmemiş aidatı bul
        const oldestDue = await prisma.due.findFirst({
          where: {
            apartmentId: matchResult.matchedApartmentId,
            status: {
              in: [DueStatus.PENDING, DueStatus.PARTIAL, DueStatus.OVERDUE]
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        });

        // Veritabanı işlemleri (Prisma Transaction)
        await prisma.$transaction(async (tx) => {
          let linkedDueId: string | null = null;

          if (oldestDue) {
            linkedDueId = oldestDue.id;
            // 1. Borca uygula (kalan tutarı aşmaz)
            const paymentApplied = await applyToDue(tx, oldestDue.id, D(movement.amount));

            // 2. Create Payment record
            await tx.payment.create({
              data: {
                tenantId,
                dueId: oldestDue.id,
                apartmentId: matchResult.matchedApartmentId!,
                amount: paymentApplied,
                method: PaymentMethod.BANK_TRANSFER,
                status: PaymentStatus.COMPLETED,
                receiptNo: movement.transactionRef,
                paidAt: new Date(movement.transactionDate),
                notes: `Banka Entegrasyon Otomatik Mutabakat (%${matchResult.confidenceScore})`
              }
            });
          } else {
            // Eşleşen aidat borcu yoksa genel bir avans/tahsilat kaydı ekle
            await tx.payment.create({
              data: {
                tenantId,
                apartmentId: matchResult.matchedApartmentId!,
                amount: movement.amount,
                method: PaymentMethod.BANK_TRANSFER,
                status: PaymentStatus.COMPLETED,
                receiptNo: movement.transactionRef,
                paidAt: new Date(movement.transactionDate),
                notes: `Banka Entegrasyon Otomatik Mutabakat (Borçsuz Daire Avansı)`
              }
            });
          }

          // 3. Update BankMovement status
          await tx.bankMovement.update({
            where: { id: movement.id },
            data: {
              status: BankMovementStatus.MATCHED_AUTO,
              matchedResidentId: matchResult.matchedResidentId,
              matchedApartmentId: matchResult.matchedApartmentId,
              matchedDueId: linkedDueId,
              confidenceScore: matchResult.confidenceScore,
              matchedBy: 'SYSTEM',
              matchedAt: new Date()
            }
          });
        });

        autoMatchedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Akıllı eşleştirme motoru çalıştırıldı. ${autoMatchedCount} hareket otomatik eşleştirildi.`,
      matchedCount: autoMatchedCount
    });

  } catch (error: any) {
    console.error('Auto match API error:', error);
    return NextResponse.json({ error: 'Otomatik mutabakat işlemi sırasında hata oluştu.', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const tenantId = auth.tenantId;
  try {
    const body = await req.json();
    const { movementId, apartmentId, dueId } = body;

    if (!movementId || !apartmentId) {
      return NextResponse.json({ error: 'movementId ve apartmentId gereklidir.' }, { status: 400 });
    }

    const movement = await prisma.bankMovement.findFirst({
      where: { id: movementId, tenantId }
    });

    if (!movement) {
      return NextResponse.json({ error: 'Banka hareketi bulunamadı.' }, { status: 404 });
    }
    // Daire ve borç da bu siteye ait olmalı.
    const apartment = await prisma.apartment.findFirst({ where: { id: apartmentId, tenantId }, select: { id: true } });
    if (!apartment) {
      return NextResponse.json({ error: 'Daire bulunamadı.' }, { status: 404 });
    }
    if (dueId && !(await prisma.due.findFirst({ where: { id: dueId, tenantId }, select: { id: true } }))) {
      return NextResponse.json({ error: 'Borç kaydı bulunamadı.' }, { status: 404 });
    }

    // Daire sakin bilgilerini bul
    const apartmentUsers = await prisma.apartmentUser.findMany({
      where: { apartmentId },
      include: { user: true }
    });
    const matchedResidentId = apartmentUsers[0]?.userId || null;

    // Prisma Transaction ile manuel kapatma
    await prisma.$transaction(async (tx) => {
      let targetDueId = dueId;

      if (dueId) {
        const due = await tx.due.findUnique({ where: { id: dueId } });
        if (due) {
          const paymentApplied = await applyToDue(tx, dueId, D(movement.amount));

          await tx.payment.create({
            data: {
              tenantId: movement.tenantId,
              dueId,
              apartmentId,
              amount: paymentApplied,
              method: PaymentMethod.BANK_TRANSFER,
              status: PaymentStatus.COMPLETED,
              receiptNo: movement.transactionRef,
              paidAt: new Date(movement.transactionDate),
              notes: `Banka Entegrasyon Manuel Mutabakat`
            }
          });
        }
      } else {
        // Borç seçilmediyse en eski borcu bul veya avans ekle
        const oldestDue = await tx.due.findFirst({
          where: {
            apartmentId,
            status: { in: [DueStatus.PENDING, DueStatus.PARTIAL, DueStatus.OVERDUE] }
          },
          orderBy: { dueDate: 'asc' }
        });

        if (oldestDue) {
          targetDueId = oldestDue.id;
          const paymentApplied = await applyToDue(tx, oldestDue.id, D(movement.amount));

          await tx.payment.create({
            data: {
              tenantId: movement.tenantId,
              dueId: oldestDue.id,
              apartmentId,
              amount: paymentApplied,
              method: PaymentMethod.BANK_TRANSFER,
              status: PaymentStatus.COMPLETED,
              receiptNo: movement.transactionRef,
              paidAt: new Date(movement.transactionDate),
              notes: `Banka Entegrasyon Manuel Mutabakat (Otomatik Borç Kapatma)`
            }
          });
        } else {
          await tx.payment.create({
            data: {
              tenantId: movement.tenantId,
              apartmentId,
              amount: movement.amount,
              method: PaymentMethod.BANK_TRANSFER,
              status: PaymentStatus.COMPLETED,
              receiptNo: movement.transactionRef,
              paidAt: new Date(movement.transactionDate),
              notes: `Banka Entegrasyon Manuel Mutabakat (Avans Tahsilat)`
            }
          });
        }
      }

      // BankMovement güncellemesi
      await tx.bankMovement.update({
        where: { id: movementId },
        data: {
          status: BankMovementStatus.MATCHED_MANUAL,
          matchedResidentId,
          matchedApartmentId: apartmentId,
          matchedDueId: targetDueId || null,
          confidenceScore: 100,
          matchedBy: 'USER',
          matchedAt: new Date()
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Banka hareketi daireyle başarıyla manuel eşleştirildi.'
    });

  } catch (error: any) {
    console.error('Manual match API error:', error);
    return NextResponse.json({ error: 'Manuel mutabakat işlemi sırasında hata oluştu.', details: error.message }, { status: 500 });
  }
}
