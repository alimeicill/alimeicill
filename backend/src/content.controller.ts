import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { BillingService } from './billing.service';
import { AuthUser, CurrentUser } from './common/auth';
import { D, ZERO } from './common/money';
import { PrismaService } from './common/prisma.service';
import { ZodPipe, optStr } from './common/zod';

const AnnouncementSchema = z.object({
  siteId: optStr(),
  title: z.string().trim().min(2, 'Başlık girin'),
  body: z.string().trim().min(2, 'İçerik girin'),
});

const TicketUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']),
  response: optStr(),
});

const SettingsSchema = z.object({
  name: z.string().trim().min(2, 'Firma adı girin'),
  lateFeeRate: z.coerce.number().min(0).max(5, 'KMK md.20 uyarınca aylık %5 üst sınırdır'),
});

@Controller()
export class ContentController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  @Get('dashboard')
  async dashboard(@CurrentUser() u: AuthUser) {
    const t = u.tenantId;
    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const [sites, units, people, openTickets, open, overdue, txs, recent, accounts] = await Promise.all([
      this.prisma.site.count({ where: { tenantId: t } }),
      this.prisma.unit.count({ where: { tenantId: t } }),
      this.prisma.person.count({ where: { tenantId: t } }),
      this.prisma.ticket.count({ where: { tenantId: t, status: { not: 'DONE' } } }),
      this.prisma.charge.aggregate({ where: { tenantId: t, cancelledAt: null }, _sum: { amount: true, paid: true } }),
      this.prisma.charge.aggregate({
        where: { tenantId: t, cancelledAt: null, dueDate: { lt: now } },
        _sum: { amount: true, paid: true },
      }),
      this.prisma.cashTransaction.findMany({
        where: { tenantId: t, date: { gte: sixMonthsAgo }, source: { not: 'TRANSFER' } },
        select: { date: true, amount: true, direction: true },
      }),
      this.prisma.cashTransaction.findMany({
        where: { tenantId: t },
        include: { paymentAccount: { select: { name: true } }, financeItem: { select: { name: true } } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 8,
      }),
      this.prisma.paymentAccount.findMany({ where: { tenantId: t }, select: { openingBalance: true } }),
    ]);
    const cashSums = await this.prisma.cashTransaction.groupBy({ by: ['direction'], where: { tenantId: t }, _sum: { amount: true } });
    const cash = accounts
      .reduce((a, x) => a.add(x.openingBalance), ZERO)
      .add(D(cashSums.find((s) => s.direction === 'IN')?._sum.amount))
      .sub(D(cashSums.find((s) => s.direction === 'OUT')?._sum.amount));

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
      return { key: d.toISOString().slice(0, 7), income: ZERO, expense: ZERO };
    });
    for (const tx of txs) {
      const m = months.find((x) => x.key === tx.date.toISOString().slice(0, 7));
      if (!m) continue;
      if (tx.direction === 'IN') m.income = m.income.add(tx.amount);
      else m.expense = m.expense.add(tx.amount);
    }
    return {
      counts: { sites, units, people, openTickets },
      openDebt: D(open._sum.amount).sub(D(open._sum.paid)),
      overdueDebt: D(overdue._sum.amount).sub(D(overdue._sum.paid)),
      cash,
      months,
      recent,
    };
  }

  @Get('reports/site/:id')
  async siteReport(@CurrentUser() u: AuthUser, @Param('id') id: string, @Query('year') yearStr?: string) {
    const site = await this.prisma.site.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!site) throw new NotFoundException('Site bulunamadı.');
    const year = Number(yearStr) || new Date().getUTCFullYear();
    const range = { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
    const [charges, txs, debts] = await Promise.all([
      this.prisma.charge.findMany({ where: { siteId: id, cancelledAt: null, date: range }, include: { financeItem: true } }),
      this.prisma.cashTransaction.findMany({
        where: { siteId: id, date: range, source: { not: 'TRANSFER' } },
        include: { financeItem: true },
      }),
      this.billing.siteDebts(u.tenantId, id),
    ]);
    const group = <T>(list: T[], key: (x: T) => string, val: (x: T) => ReturnType<typeof D>) => {
      const m = new Map<string, ReturnType<typeof D>>();
      for (const x of list) m.set(key(x), (m.get(key(x)) ?? ZERO).add(val(x)));
      return [...m.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total.cmp(a.total));
    };
    const income = txs.filter((t) => t.direction === 'IN');
    const expense = txs.filter((t) => t.direction === 'OUT');
    const charged = charges.reduce((a, c) => a.add(c.amount), ZERO);
    const collected = charges.reduce((a, c) => a.add(c.paid), ZERO);
    return {
      site,
      year,
      charged,
      collected,
      collectionRate: charged.gt(0) ? collected.div(charged).mul(100).toDecimalPlaces(1) : ZERO,
      totalIncome: income.reduce((a, t) => a.add(t.amount), ZERO),
      totalExpense: expense.reduce((a, t) => a.add(t.amount), ZERO),
      incomeByItem: group(income, (t) => t.financeItem?.name ?? 'Diğer', (t) => t.amount),
      expenseByItem: group(expense, (t) => t.financeItem?.name ?? 'Diğer', (t) => t.amount),
      chargesByItem: group(charges, (c) => c.financeItem?.name ?? c.description, (c) => c.amount),
      openBalance: debts.summary.balanceTotal,
    };
  }

  // ---- Duyurular ----

  @Get('announcements')
  announcements(@CurrentUser() u: AuthUser) {
    return this.prisma.announcement.findMany({
      where: { tenantId: u.tenantId },
      include: { site: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('announcements')
  createAnnouncement(@CurrentUser() u: AuthUser, @Body(new ZodPipe(AnnouncementSchema)) body: z.infer<typeof AnnouncementSchema>) {
    return this.prisma.announcement.create({ data: { ...body, tenantId: u.tenantId } });
  }

  @Delete('announcements/:id')
  async deleteAnnouncement(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.prisma.announcement.deleteMany({ where: { id, tenantId: u.tenantId } });
    return { ok: true };
  }

  // ---- Talep / arıza ----

  @Get('tickets')
  tickets(@CurrentUser() u: AuthUser, @Query('status') status?: string) {
    return this.prisma.ticket.findMany({
      where: { tenantId: u.tenantId, ...(status ? { status: status as never } : {}) },
      include: {
        site: { select: { name: true } },
        unit: { include: { block: { select: { name: true } } } },
        person: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch('tickets/:id')
  async updateTicket(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(TicketUpdateSchema)) body: z.infer<typeof TicketUpdateSchema>) {
    const t = await this.prisma.ticket.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!t) throw new NotFoundException('Talep bulunamadı.');
    return this.prisma.ticket.update({ where: { id }, data: body });
  }

  // ---- KVKK ----

  @Get('kvkk')
  async kvkk(@CurrentUser() u: AuthUser) {
    const people = await this.prisma.person.findMany({
      where: { tenantId: u.tenantId },
      select: { id: true, firstName: true, lastName: true, phone: true, kvkkConsentAt: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    return { total: people.length, consented: people.filter((p) => p.kvkkConsentAt).length, people };
  }

  // ---- Firma ayarları ----

  @Get('settings')
  settings(@CurrentUser() u: AuthUser) {
    return this.prisma.tenant.findUniqueOrThrow({ where: { id: u.tenantId } });
  }

  @Patch('settings')
  updateSettings(@CurrentUser() u: AuthUser, @Body(new ZodPipe(SettingsSchema)) body: z.infer<typeof SettingsSchema>) {
    return this.prisma.tenant.update({ where: { id: u.tenantId }, data: body });
  }
}
