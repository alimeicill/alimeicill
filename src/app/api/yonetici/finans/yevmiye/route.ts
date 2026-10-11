import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { AdvancedFinanceService } from '@/lib/services/advanced-finance-service';

export async function GET() {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const tenantId = auth.tenantId;
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
