import { NextResponse } from 'next/server';
import { AdvancedFinanceService } from '@/lib/services/advanced-finance-service';
import { calculateLegalInterest } from '@/lib/services/financeMath';

export async function GET() {
  try {
    const legalProcesses = AdvancedFinanceService.getLegalProcesses();
    return NextResponse.json(legalProcesses);
  } catch (error: any) {
    return NextResponse.json({ error: 'İcra süreçleri getirilemedi.', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { principal, overdueDays, annualInterestRate = 24, lawyerFeeRate = 10 } = body;

    if (!principal || isNaN(Number(principal))) {
      return NextResponse.json({ error: 'Geçerli borç aslı girilmelidir.' }, { status: 400 });
    }

    const calc = calculateLegalInterest(
      Number(principal),
      Number(overdueDays || 60),
      Number(annualInterestRate),
      Number(lawyerFeeRate)
    );

    return NextResponse.json({
      success: true,
      data: calc
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'İcra hesaplama hatası.', details: error.message }, { status: 500 });
  }
}
