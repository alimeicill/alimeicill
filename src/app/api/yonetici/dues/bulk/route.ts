import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BorclandirmaEngine, DistributionType, Daire } from '@/lib/services/finance-engine';
import { DueType, DueStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tenantId,
      toplamButce,
      dagitimTipi,
      period,
      dueDate,
      dueType = DueType.MANAGEMENT,
      sabitAidatDegeri = 1500
    } = body;

    // Validation
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId gereklidir.' }, { status: 400 });
    }
    if (!toplamButce || isNaN(Number(toplamButce)) || Number(toplamButce) <= 0) {
      return NextResponse.json({ error: 'Geçersiz toplam bütçe tutarı.' }, { status: 400 });
    }
    if (!Object.values(DistributionType).includes(dagitimTipi)) {
      return NextResponse.json({ error: 'Geçersiz borçlandırma dağıtım tipi.' }, { status: 400 });
    }
    if (!period) {
      return NextResponse.json({ error: 'Dönem bilgisi gereklidir (Örn: 2026-07).' }, { status: 400 });
    }
    if (!dueDate) {
      return NextResponse.json({ error: 'Son ödeme tarihi gereklidir.' }, { status: 400 });
    }

    // 1. Fetch all apartments for this tenant
    const apartments = await prisma.apartment.findMany({
      where: {
        tenantId: tenantId
      }
    });

    if (apartments.length === 0) {
      return NextResponse.json({ error: 'Bu siteye kayıtlı daire bulunamadı.' }, { status: 404 });
    }

    // 2. Map prisma apartments to Daire objects for the finance engine
    const daireler: Daire[] = apartments.map(apt => ({
      daireId: apt.id,
      daireNo: apt.number,
      m2: apt.size || 100, // fallback size
      arsaPayi: apt.shareRatio || 5, // fallback share
      sabitAidat: sabitAidatDegeri
    }));

    // 3. Compute the dues share for each unit
    const duesDistribution = BorclandirmaEngine.aidatHesapla(
      daireler,
      Number(toplamButce),
      dagitimTipi as DistributionType
    );

    // 4. Create Prisma transaction to bulk insert the new Due records
    const createdDues = await prisma.$transaction(
      Object.entries(duesDistribution).map(([apartmentId, amount]) => {
        return prisma.due.create({
          data: {
            tenantId,
            apartmentId,
            type: dueType as DueType,
            period,
            amount: amount,
            dueDate: new Date(dueDate),
            status: DueStatus.PENDING,
            notes: `${period} Dönemi Toplu Aidat Dağıtımı (${dagitimTipi === 'EQUAL' ? 'Eşit Dağıtım' : dagitimTipi === 'SQUARE_METER' ? 'm² Bazlı' : dagitimTipi === 'SHARE' ? 'Arsa Paylı' : 'Sabit'})`
          }
        });
      })
    );

    const totalAmount = createdDues.reduce((sum, d) => sum + d.amount, 0);

    return NextResponse.json({
      success: true,
      message: `${createdDues.length} adet daire için toplu borçlandırma başarıyla tamamlandı.`,
      stats: {
        totalUnitsBilled: createdDues.length,
        requestedBudget: Number(toplamButce),
        actualDistributedAmount: totalAmount,
        averageAmount: totalAmount / createdDues.length
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Bulk dues generation error:', error);
    return NextResponse.json({ error: 'Toplu borçlandırma işlemi sırasında bir hata oluştu.', details: error.message }, { status: 500 });
  }
}
