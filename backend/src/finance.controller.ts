import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { AuthUser, CurrentUser } from './common/auth';
import { D, ZERO } from './common/money';
import { PrismaService } from './common/prisma.service';
import { ZodPipe, dateStr, money, optStr, posMoney } from './common/zod';

const ItemSchema = z.object({
  name: z.string().trim().min(1, 'Ad girin'),
  kind: z.enum(['INCOME', 'EXPENSE', 'CHARGE']),
  active: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  description: optStr(),
});

const CurrentAccountSchema = z.object({
  kind: z.enum(['SUPPLIER', 'CUSTOMER', 'OTHER']).default('SUPPLIER'),
  title: z.string().trim().min(1, 'Ünvan girin'),
  taxOffice: optStr(),
  taxNo: optStr(),
  tckn: optStr(),
  phone: optStr(),
  email: optStr(),
  city: optStr(),
  district: optStr(),
  address: optStr(),
  active: z.boolean().default(true),
});

const PaymentAccountSchema = z.object({
  kind: z.enum(['CASH', 'BANK']),
  name: z.string().trim().min(1, 'Hesap adı girin'),
  siteId: optStr(),
  iban: optStr(),
  openingBalance: money().default(0),
  active: z.boolean().default(true),
  description: optStr(),
});

const TxSchema = z.object({
  direction: z.enum(['IN', 'OUT']),
  paymentAccountId: z.string().uuid('Ödeme hesabı seçin'),
  amount: posMoney(),
  date: dateStr(),
  financeItemId: z.string().uuid('Kalem seçin'),
  currentAccountId: optStr(),
  siteId: optStr(),
  description: optStr(),
});

const TransferSchema = z.object({
  fromId: z.string().uuid('Çıkış hesabı seçin'),
  toId: z.string().uuid('Giriş hesabı seçin'),
  amount: posMoney(),
  date: dateStr(),
  description: optStr(),
});

const InvoiceSchema = z.object({
  currentAccountId: z.string().uuid('Cari seçin'),
  siteId: optStr(),
  financeItemId: optStr(),
  invoiceNo: optStr(),
  date: dateStr(),
  dueDate: z.preprocess((v) => (v ? v : null), z.coerce.date().nullable()),
  amount: posMoney(),
  description: optStr(),
});

const InvoicePaySchema = z.object({
  paymentAccountId: z.string().uuid('Ödeme hesabı seçin'),
  amount: posMoney(),
  date: dateStr(),
});

@Controller()
export class FinanceController {
  constructor(private readonly prisma: PrismaService) {}

  private async ensure<T>(p: Promise<T | null>, msg: string): Promise<T> {
    const v = await p;
    if (!v) throw new NotFoundException(msg);
    return v;
  }

  // ---- Gelir / gider / borçlandırma kalemleri ----

  @Get('finance-items')
  items(@CurrentUser() u: AuthUser, @Query('kind') kind?: string, @Query('q') q?: string) {
    return this.prisma.financeItem.findMany({
      where: {
        tenantId: u.tenantId,
        ...(kind ? { kind: kind as never } : {}),
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    });
  }

  @Post('finance-items')
  async createItem(@CurrentUser() u: AuthUser, @Body(new ZodPipe(ItemSchema)) body: z.infer<typeof ItemSchema>) {
    return this.prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.financeItem.updateMany({ where: { tenantId: u.tenantId, kind: body.kind }, data: { isDefault: false } });
      return tx.financeItem.create({ data: { ...body, tenantId: u.tenantId } });
    });
  }

  @Patch('finance-items/:id')
  async updateItem(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(ItemSchema)) body: z.infer<typeof ItemSchema>) {
    await this.ensure(this.prisma.financeItem.findFirst({ where: { id, tenantId: u.tenantId } }), 'Kalem bulunamadı.');
    return this.prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.financeItem.updateMany({ where: { tenantId: u.tenantId, kind: body.kind }, data: { isDefault: false } });
      return tx.financeItem.update({ where: { id }, data: body });
    });
  }

  @Delete('finance-items/:id')
  async deleteItem(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.ensure(this.prisma.financeItem.findFirst({ where: { id, tenantId: u.tenantId } }), 'Kalem bulunamadı.');
    const used =
      (await this.prisma.charge.count({ where: { financeItemId: id } })) +
      (await this.prisma.cashTransaction.count({ where: { financeItemId: id } }));
    if (used) throw new BadRequestException('Kullanılmış kalem silinemez; pasife alabilirsiniz.');
    await this.prisma.financeItem.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Cari hesaplar ----

  @Get('current-accounts')
  currentAccounts(@CurrentUser() u: AuthUser, @Query('q') q?: string, @Query('kind') kind?: string, @Query('active') active?: string) {
    return this.prisma.currentAccount.findMany({
      where: {
        tenantId: u.tenantId,
        ...(kind ? { kind: kind as never } : {}),
        ...(active === 'true' ? { active: true } : active === 'false' ? { active: false } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
                { email: { contains: q, mode: 'insensitive' } },
                { taxNo: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { title: 'asc' },
    });
  }

  @Post('current-accounts')
  createCurrent(@CurrentUser() u: AuthUser, @Body(new ZodPipe(CurrentAccountSchema)) body: z.infer<typeof CurrentAccountSchema>) {
    return this.prisma.currentAccount.create({ data: { ...body, tenantId: u.tenantId } });
  }

  @Patch('current-accounts/:id')
  async updateCurrent(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(CurrentAccountSchema)) body: z.infer<typeof CurrentAccountSchema>,
  ) {
    await this.ensure(this.prisma.currentAccount.findFirst({ where: { id, tenantId: u.tenantId } }), 'Cari bulunamadı.');
    return this.prisma.currentAccount.update({ where: { id }, data: body });
  }

  @Delete('current-accounts/:id')
  async deleteCurrent(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.ensure(this.prisma.currentAccount.findFirst({ where: { id, tenantId: u.tenantId } }), 'Cari bulunamadı.');
    const used = await this.prisma.supplierInvoice.count({ where: { currentAccountId: id } });
    if (used) throw new BadRequestException('Faturası olan cari silinemez; pasife alabilirsiniz.');
    await this.prisma.currentAccount.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Ödeme hesapları (kasa / banka) ----

  private async balances(tenantId: string) {
    const sums = await this.prisma.cashTransaction.groupBy({
      by: ['paymentAccountId', 'direction'],
      where: { tenantId },
      _sum: { amount: true },
    });
    const map = new Map<string, { in: Prisma.Decimal; out: Prisma.Decimal }>();
    for (const s of sums) {
      const b = map.get(s.paymentAccountId) ?? { in: ZERO, out: ZERO };
      if (s.direction === 'IN') b.in = D(s._sum.amount);
      else b.out = D(s._sum.amount);
      map.set(s.paymentAccountId, b);
    }
    return map;
  }

  @Get('payment-accounts')
  async paymentAccounts(@CurrentUser() u: AuthUser) {
    const [accounts, balances] = await Promise.all([
      this.prisma.paymentAccount.findMany({
        where: { tenantId: u.tenantId },
        include: { site: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
      }),
      this.balances(u.tenantId),
    ]);
    return accounts.map((a) => {
      const b = balances.get(a.id);
      return { ...a, totalIn: b?.in ?? ZERO, totalOut: b?.out ?? ZERO, balance: a.openingBalance.add(b?.in ?? ZERO).sub(b?.out ?? ZERO) };
    });
  }

  @Post('payment-accounts')
  createPaymentAccount(@CurrentUser() u: AuthUser, @Body(new ZodPipe(PaymentAccountSchema)) body: z.infer<typeof PaymentAccountSchema>) {
    return this.prisma.paymentAccount.create({ data: { ...body, tenantId: u.tenantId } });
  }

  @Patch('payment-accounts/:id')
  async updatePaymentAccount(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(PaymentAccountSchema)) body: z.infer<typeof PaymentAccountSchema>,
  ) {
    await this.ensure(this.prisma.paymentAccount.findFirst({ where: { id, tenantId: u.tenantId } }), 'Hesap bulunamadı.');
    return this.prisma.paymentAccount.update({ where: { id }, data: body });
  }

  @Get('payment-accounts/:id/statement')
  async statement(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const account = await this.ensure(
      this.prisma.paymentAccount.findFirst({ where: { id, tenantId: u.tenantId }, include: { site: true } }),
      'Hesap bulunamadı.',
    );
    const txs = await this.prisma.cashTransaction.findMany({
      where: { paymentAccountId: id },
      include: { financeItem: true, currentAccount: true, site: true },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    let running = account.openingBalance;
    const rows = txs.map((t) => {
      running = t.direction === 'IN' ? running.add(t.amount) : running.sub(t.amount);
      return { ...t, balance: running };
    });
    return {
      account,
      opening: account.openingBalance,
      totalIn: txs.filter((t) => t.direction === 'IN').reduce((a, t) => a.add(t.amount), ZERO),
      totalOut: txs.filter((t) => t.direction === 'OUT').reduce((a, t) => a.add(t.amount), ZERO),
      balance: running,
      rows: rows.reverse(),
    };
  }

  // ---- Finans kayıtları (gelir / gider / virman) ----

  @Get('transactions')
  async transactions(
    @CurrentUser() u: AuthUser,
    @Query('source') source?: string,
    @Query('siteId') siteId?: string,
    @Query('accountId') accountId?: string,
    @Query('take') take = '100',
  ) {
    return this.prisma.cashTransaction.findMany({
      where: {
        tenantId: u.tenantId,
        ...(source ? { source: source as never } : {}),
        ...(siteId ? { siteId } : {}),
        ...(accountId ? { paymentAccountId: accountId } : {}),
      },
      include: {
        paymentAccount: { select: { name: true, kind: true } },
        financeItem: { select: { name: true } },
        currentAccount: { select: { title: true } },
        site: { select: { name: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(500, Number(take) || 100),
    });
  }

  @Post('transactions')
  async createTx(@CurrentUser() u: AuthUser, @Body(new ZodPipe(TxSchema)) body: z.infer<typeof TxSchema>) {
    const acc = await this.ensure(
      this.prisma.paymentAccount.findFirst({ where: { id: body.paymentAccountId, tenantId: u.tenantId } }),
      'Ödeme hesabı bulunamadı.',
    );
    if (!acc.active) throw new BadRequestException('Pasif hesaba işlem yapılamaz.');
    const item = await this.ensure(
      this.prisma.financeItem.findFirst({ where: { id: body.financeItemId, tenantId: u.tenantId } }),
      'Kalem bulunamadı.',
    );
    if (body.direction === 'IN' && item.kind !== 'INCOME') throw new BadRequestException('Gelir kaydı için gelir kalemi seçin.');
    if (body.direction === 'OUT' && item.kind !== 'EXPENSE') throw new BadRequestException('Gider kaydı için gider kalemi seçin.');
    return this.prisma.cashTransaction.create({
      data: {
        ...body,
        tenantId: u.tenantId,
        siteId: body.siteId ?? acc.siteId,
        amount: D(body.amount),
        source: body.direction === 'IN' ? 'INCOME' : 'EXPENSE',
      },
    });
  }

  @Post('transactions/transfer')
  async transfer(@CurrentUser() u: AuthUser, @Body(new ZodPipe(TransferSchema)) body: z.infer<typeof TransferSchema>) {
    if (body.fromId === body.toId) throw new BadRequestException('Aynı hesaba virman yapılamaz.');
    const [from, to] = await Promise.all([
      this.prisma.paymentAccount.findFirst({ where: { id: body.fromId, tenantId: u.tenantId } }),
      this.prisma.paymentAccount.findFirst({ where: { id: body.toId, tenantId: u.tenantId } }),
    ]);
    if (!from || !to) throw new NotFoundException('Ödeme hesabı bulunamadı.');
    const group = randomUUID();
    const description = body.description || `Virman: ${from.name} → ${to.name}`;
    const common = { tenantId: u.tenantId, source: 'TRANSFER' as const, amount: D(body.amount), date: body.date, description, transferGroup: group };
    await this.prisma.cashTransaction.createMany({
      data: [
        { ...common, paymentAccountId: from.id, direction: 'OUT', siteId: from.siteId },
        { ...common, paymentAccountId: to.id, direction: 'IN', siteId: to.siteId },
      ],
    });
    return { ok: true };
  }

  @Delete('transactions/:id')
  async deleteTx(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const tx = await this.ensure(this.prisma.cashTransaction.findFirst({ where: { id, tenantId: u.tenantId } }), 'Kayıt bulunamadı.');
    if (tx.source === 'COLLECTION') throw new BadRequestException('Tahsilat kayıtları daire ekranından iptal edilir.');
    if (tx.source === 'INVOICE_PAYMENT' && tx.invoiceId) {
      await this.prisma.$transaction([
        this.prisma.supplierInvoice.update({ where: { id: tx.invoiceId }, data: { paidAmount: { decrement: tx.amount } } }),
        this.prisma.cashTransaction.delete({ where: { id } }),
      ]);
    } else if (tx.transferGroup) {
      await this.prisma.cashTransaction.deleteMany({ where: { transferGroup: tx.transferGroup, tenantId: u.tenantId } });
    } else {
      await this.prisma.cashTransaction.delete({ where: { id } });
    }
    return { ok: true };
  }

  // ---- Tedarikçi faturaları ----

  @Get('invoices')
  invoices(@CurrentUser() u: AuthUser, @Query('status') status?: string) {
    return this.prisma.supplierInvoice
      .findMany({
        where: { tenantId: u.tenantId },
        include: {
          currentAccount: { select: { title: true } },
          site: { select: { name: true } },
          financeItem: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      })
      .then((list) =>
        list.filter((i) => (status === 'open' ? i.paidAmount.lt(i.amount) : status === 'paid' ? i.paidAmount.gte(i.amount) : true)),
      );
  }

  @Post('invoices')
  async createInvoice(@CurrentUser() u: AuthUser, @Body(new ZodPipe(InvoiceSchema)) body: z.infer<typeof InvoiceSchema>) {
    await this.ensure(
      this.prisma.currentAccount.findFirst({ where: { id: body.currentAccountId, tenantId: u.tenantId } }),
      'Cari bulunamadı.',
    );
    return this.prisma.supplierInvoice.create({ data: { ...body, amount: D(body.amount), tenantId: u.tenantId } });
  }

  @Post('invoices/:id/pay')
  async payInvoice(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(InvoicePaySchema)) body: z.infer<typeof InvoicePaySchema>) {
    const inv = await this.ensure(
      this.prisma.supplierInvoice.findFirst({ where: { id, tenantId: u.tenantId }, include: { currentAccount: true } }),
      'Fatura bulunamadı.',
    );
    const acc = await this.ensure(
      this.prisma.paymentAccount.findFirst({ where: { id: body.paymentAccountId, tenantId: u.tenantId } }),
      'Ödeme hesabı bulunamadı.',
    );
    const open = inv.amount.sub(inv.paidAmount);
    if (D(body.amount).gt(open)) throw new BadRequestException(`Kalan tutardan (${open.toFixed(2)} ₺) fazla ödeme yapılamaz.`);
    await this.prisma.$transaction([
      this.prisma.cashTransaction.create({
        data: {
          tenantId: u.tenantId,
          paymentAccountId: acc.id,
          direction: 'OUT',
          source: 'INVOICE_PAYMENT',
          amount: D(body.amount),
          date: body.date,
          description: `Fatura ödemesi: ${inv.currentAccount.title}${inv.invoiceNo ? ` #${inv.invoiceNo}` : ''}`,
          siteId: inv.siteId ?? acc.siteId,
          financeItemId: inv.financeItemId,
          currentAccountId: inv.currentAccountId,
          invoiceId: inv.id,
        },
      }),
      this.prisma.supplierInvoice.update({ where: { id }, data: { paidAmount: { increment: D(body.amount) } } }),
    ]);
    return { ok: true };
  }

  @Delete('invoices/:id')
  async deleteInvoice(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const inv = await this.ensure(this.prisma.supplierInvoice.findFirst({ where: { id, tenantId: u.tenantId } }), 'Fatura bulunamadı.');
    if (inv.paidAmount.gt(0)) throw new BadRequestException('Ödemesi yapılmış fatura silinemez; önce ödeme kayıtlarını silin.');
    await this.prisma.supplierInvoice.delete({ where: { id } });
    return { ok: true };
  }
}
