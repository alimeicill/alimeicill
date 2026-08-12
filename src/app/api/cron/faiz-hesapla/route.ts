import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GecikmeFaiziEngine } from '@/lib/services/finance-engine';
import { DueStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // 1. Cron Authentication check
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // In production, enforce cron secret security check.
    // In dev or local testing, we can allow execution if CRON_SECRET is not set, or query has token.
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Yetkisiz erişim. Geçersiz cron token.' }, { status: 401 });
      }
    }

    const now = new Date();

    // 2. Fetch all unpaid or partially paid dues that are overdue
    const overdueDues = await prisma.due.findMany({
      where: {
        status: {
          in: [DueStatus.PENDING, DueStatus.PARTIAL, DueStatus.OVERDUE]
        },
        dueDate: {
          lt: now
        }
      }
    });

    if (overdueDues.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Gecikmiş borç kaydı bulunamadı. Faiz hesaplama işlemine gerek yok.',
        totalDuesProcessed: 0,
        totalInterestAccrued: 0
      });
    }

    let totalInterestAccrued = 0;
    let updatedCount = 0;

    // 3. Process each overdue due in a Prisma transaction batch
    const updates = overdueDues.map((due) => {
      const remainingAmount = due.amount - due.paidAmount;
      
      // Calculate dynamic daily late interest (5% monthly yasal KMK rate)
      const interestResult = GecikmeFaiziEngine.faizHesapla(
        remainingAmount,
        new Date(due.dueDate),
        now,
        5.0, // 5% monthly rate
        true // daily flexible accrual
      );

      totalInterestAccrued += interestResult.faizTutari;
      updatedCount++;

      // Update the lateInterest field and set status to OVERDUE if it was PENDING
      return prisma.due.update({
        where: { id: due.id },
        data: {
          lateInterest: interestResult.faizTutari,
          status: due.status === DueStatus.PENDING ? DueStatus.OVERDUE : due.status
        }
      });
    });

    await prisma.$transaction(updates);

    return NextResponse.json({
      success: true,
      message: `Gecikme faizi hesaplama cron görevi başarıyla tamamlandı.`,
      stats: {
        totalDuesProcessed: updatedCount,
        totalInterestAccrued: totalInterestAccrued,
        timestamp: now.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Late interest calculation cron error:', error);
    return NextResponse.json({ error: 'Gecikme faizi hesaplama sırasında hata oluştu.', details: error.message }, { status: 500 });
  }
}

// Support GET request for easy manual/webhook triggers
export async function GET(req: Request) {
  return POST(req);
}
