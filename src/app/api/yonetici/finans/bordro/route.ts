import { NextResponse } from 'next/server';
import { calculatePayroll } from '@/lib/services/financeMath';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { grossSalary, attendanceDays = 30, workYears = 0, isNotice = false, huzurHakki = 0 } = body;

    if (!grossSalary || isNaN(Number(grossSalary))) {
      return NextResponse.json({ error: 'Geçerli brüt maaş girilmelidir.' }, { status: 400 });
    }

    const payroll = calculatePayroll(
      Number(grossSalary),
      Number(attendanceDays),
      Number(workYears),
      Boolean(isNotice),
      Number(huzurHakki)
    );

    return NextResponse.json({
      success: true,
      data: payroll
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Bordro hesaplama hatası.', details: error.message }, { status: 500 });
  }
}
