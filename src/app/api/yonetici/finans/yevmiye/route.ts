import { NextResponse } from 'next/server';
import { AdvancedFinanceService } from '@/lib/services/advanced-finance-service';

export async function GET() {
  try {
    const vouchers = AdvancedFinanceService.getAccountingVouchers();
    const chart = AdvancedFinanceService.getChartOfAccounts();

    return NextResponse.json({
      vouchers,
      chartOfAccounts: chart
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Yevmiye fişleri getirilemedi.', details: error.message }, { status: 500 });
  }
}
