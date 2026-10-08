import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { BillingService } from './billing.service';
import { AuthUser, CurrentUser } from './common/auth';
import { PrismaService } from './common/prisma.service';
import { ZodPipe, dateStr, optStr, period, posMoney } from './common/zod';

const Scope = {
  siteId: z.string().uuid(),
  blockId: optStr(),
  unitId: optStr(),
  financeItemId: z.string().uuid('Borçlandırma kalemi seçin'),
  distribution: z.enum(['FIXED', 'EQUAL', 'COEFFICIENT', 'AREA', 'LAND_SHARE']),
  amount: posMoney(),
  description: optStr(),
  preview: z.boolean().default(false),
};

const AidatSchema = z.object({
  ...Scope,
  periods: z.array(period()).min(1, 'En az bir ay seçin').max(24),
  dueDay: z.coerce.number().int().min(1).max(28).default(10),
});

const ManualSchema = z.object({
  ...Scope,
  date: dateStr(),
  dueDate: dateStr(),
  installments: z.coerce.number().int().min(1).max(36).default(1),
});

const PaymentSchema = z.object({
  unitId: z.string().uuid(),
  paymentAccountId: z.string().uuid('Ödeme hesabı seçin'),
  amount: posMoney(),
  date: dateStr(),
  description: optStr(),
});

@Controller()
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('sites/:id/debts')
  siteDebts(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.billing.siteDebts(u.tenantId, id);
  }

  @Get('units/:id/ledger')
  ledger(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.billing.unitLedger(u.tenantId, id);
  }

  @Post('charges/aidat')
  aidat(@CurrentUser() u: AuthUser, @Body(new ZodPipe(AidatSchema)) body: z.infer<typeof AidatSchema>) {
    return this.billing.createAidat({ ...body, tenantId: u.tenantId });
  }

  @Post('charges/manual')
  manual(@CurrentUser() u: AuthUser, @Body(new ZodPipe(ManualSchema)) body: z.infer<typeof ManualSchema>) {
    return this.billing.createManual({ ...body, tenantId: u.tenantId });
  }

  @Get('charge-batches')
  batches(@CurrentUser() u: AuthUser, @Query('siteId') siteId?: string) {
    return this.prisma.chargeBatch.findMany({
      where: { tenantId: u.tenantId, ...(siteId ? { siteId } : {}) },
      include: { site: { select: { name: true } }, _count: { select: { charges: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  @Delete('charge-batches/:id')
  cancelBatch(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.billing.cancelBatch(u.tenantId, id);
  }

  @Post('payments')
  pay(@CurrentUser() u: AuthUser, @Body(new ZodPipe(PaymentSchema)) body: z.infer<typeof PaymentSchema>) {
    return this.billing.createPayment(u.tenantId, body);
  }

  @Delete('payments/:id')
  cancelPayment(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.billing.cancelPayment(u.tenantId, id);
  }

  @Post('units/:id/apply-advance')
  async applyAdvance(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const unit = await this.prisma.unit.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!unit) throw new NotFoundException('Daire bulunamadı.');
    await this.prisma.$transaction((tx) => this.billing.allocateUnit(tx, id));
    return { ok: true };
  }

  @Get('debtors')
  debtors(
    @CurrentUser() u: AuthUser,
    @Query('siteId') siteId?: string,
    @Query('blockId') blockId?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    return this.billing.debtors(u.tenantId, {
      siteId: siteId || undefined,
      blockId: blockId || undefined,
      overdueOnly: status !== 'all',
      sort: sort === 'oldest' ? 'oldest' : 'amount',
    });
  }
}
