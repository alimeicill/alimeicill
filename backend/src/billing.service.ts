import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BatchKind, Prisma, UnitOccupant, Person } from '@prisma/client';
import { D, ZERO, distribute, lateFee, round2 } from './common/money';
import { PrismaService } from './common/prisma.service';

type Tx = Prisma.TransactionClient;
type OccupantWithPerson = UnitOccupant & { person: Person };

export type Distribution = 'FIXED' | 'EQUAL' | 'COEFFICIENT' | 'AREA' | 'LAND_SHARE';

export interface ChargePlanInput {
  tenantId: string;
  siteId: string;
  blockId?: string | null;
  unitId?: string | null;
  financeItemId: string;
  distribution: Distribution;
  amount: number;
}

const unitLabel = (u: { doorNo: string; block: { name: string } }) => `${u.block.name} / ${u.doorNo}`;

/** Borcun yazılacağı kişi: işaretli borçlu → malik → kiracı. */
export function debtorOf(occupants: OccupantWithPerson[]) {
  return (
    occupants.find((o) => o.isDebtor) ?? occupants.find((o) => o.role === 'OWNER') ?? occupants[0] ?? null
  )?.person ?? null;
}

const fullName = (p: Person | null) => (p ? `${p.firstName} ${p.lastName}` : null);

function periodDates(period: string, dueDay: number) {
  const [y, m] = period.split('-').map(Number);
  return { date: new Date(Date.UTC(y, m - 1, 1)), dueDate: new Date(Date.UTC(y, m - 1, Math.min(dueDay, 28), 23, 59)) };
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const periodLabel = (p: string) => `${p.slice(0, 4)} / ${MONTHS[Number(p.slice(5)) - 1]}`;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dairenin dağıtılmamış tahsilatlarını vadesi en eski açık borçlardan başlayarak kapatır (FIFO).
   * Tahsilat, borç oluşturma ve iptal işlemlerinden sonra çağrılır; tekrar çalıştırılması güvenlidir.
   */
  async allocateUnit(tx: Tx, unitId: string) {
    const payments = (
      await tx.payment.findMany({ where: { unitId, cancelledAt: null }, orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] })
    ).filter((p) => p.amount.gt(p.allocated));
    if (!payments.length) return;
    const charges = (
      await tx.charge.findMany({ where: { unitId, cancelledAt: null }, orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }] })
    ).filter((c) => c.amount.gt(c.paid));

    let ci = 0;
    for (const p of payments) {
      let free = p.amount.sub(p.allocated);
      while (free.gt(0) && ci < charges.length) {
        const c = charges[ci];
        const open = c.amount.sub(c.paid);
        const amt = Prisma.Decimal.min(free, open);
        await tx.paymentAllocation.create({ data: { paymentId: p.id, chargeId: c.id, amount: amt } });
        c.paid = c.paid.add(amt);
        await tx.charge.update({ where: { id: c.id }, data: { paid: c.paid } });
        free = free.sub(amt);
        if (c.paid.gte(c.amount)) ci++;
      }
      const allocated = p.amount.sub(free);
      if (!allocated.eq(p.allocated)) await tx.payment.update({ where: { id: p.id }, data: { allocated } });
      if (ci >= charges.length) break;
    }
  }

  /** Belirli tahsilat dağıtımlarını geri alır (iptal öncesi). */
  private async releaseAllocations(tx: Tx, where: Prisma.PaymentAllocationWhereInput) {
    const allocs = await tx.paymentAllocation.findMany({ where });
    for (const a of allocs) {
      await tx.charge.update({ where: { id: a.chargeId }, data: { paid: { decrement: a.amount } } });
      await tx.payment.update({ where: { id: a.paymentId }, data: { allocated: { decrement: a.amount } } });
    }
    await tx.paymentAllocation.deleteMany({ where: { id: { in: allocs.map((a) => a.id) } } });
  }

  /** Site içindeki tüm dairelerin bakiyeleri. */
  async siteBalances(tenantId: string, siteId: string) {
    const now = new Date();
    const [all, due, adv] = await Promise.all([
      this.prisma.charge.groupBy({
        by: ['unitId'],
        where: { tenantId, siteId, cancelledAt: null },
        _sum: { amount: true, paid: true },
      }),
      this.prisma.charge.groupBy({
        by: ['unitId'],
        where: { tenantId, siteId, cancelledAt: null, dueDate: { lte: now } },
        _sum: { amount: true, paid: true },
      }),
      this.prisma.payment.groupBy({
        by: ['unitId'],
        where: { tenantId, siteId, cancelledAt: null },
        _sum: { amount: true, allocated: true },
      }),
    ]);
    const map = new Map<string, { charged: Prisma.Decimal; open: Prisma.Decimal; due: Prisma.Decimal; advance: Prisma.Decimal }>();
    const get = (id: string) => {
      if (!map.has(id)) map.set(id, { charged: ZERO, open: ZERO, due: ZERO, advance: ZERO });
      return map.get(id)!;
    };
    for (const r of all) {
      const b = get(r.unitId);
      b.charged = D(r._sum.amount);
      b.open = D(r._sum.amount).sub(D(r._sum.paid));
    }
    for (const r of due) get(r.unitId).due = D(r._sum.amount).sub(D(r._sum.paid));
    for (const r of adv) get(r.unitId).advance = D(r._sum.amount).sub(D(r._sum.allocated));
    return map;
  }

  async siteDebts(tenantId: string, siteId: string) {
    const site = await this.prisma.site.findFirst({ where: { id: siteId, tenantId } });
    if (!site) throw new NotFoundException('Site bulunamadı.');
    const units = await this.prisma.unit.findMany({
      where: { tenantId, siteId },
      include: { block: true, occupants: { include: { person: true } } },
      orderBy: [{ block: { name: 'asc' } }, { doorNo: 'asc' }],
    });
    const balances = await this.siteBalances(tenantId, siteId);
    const rows = units
      .map((u) => {
        const b = balances.get(u.id);
        const debtor = debtorOf(u.occupants);
        return {
          unitId: u.id,
          label: unitLabel(u),
          block: u.block.name,
          doorNo: u.doorNo,
          debtor: fullName(debtor),
          debtorId: debtor?.id ?? null,
          due: b?.due ?? ZERO,
          balance: (b?.open ?? ZERO).sub(b?.advance ?? ZERO),
        };
      })
      .sort((a, b) => a.block.localeCompare(b.block, 'tr') || a.doorNo.localeCompare(b.doorNo, 'tr', { numeric: true }));
    return {
      site,
      summary: {
        dueTotal: rows.reduce((a, r) => a.add(r.due.gt(0) ? r.due : ZERO), ZERO),
        dueUnits: rows.filter((r) => r.due.gt(0)).length,
        balanceTotal: rows.reduce((a, r) => a.add(r.balance), ZERO),
      },
      units: rows,
    };
  }

  /** Daire cari ekstresi: borç ve tahsilatlar tarih sırasıyla, yürüyen bakiyeyle. */
  async unitLedger(tenantId: string, unitId: string, year?: number) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId },
      include: { block: true, site: true, tenant: true },
    });
    if (!unit) throw new NotFoundException('Daire bulunamadı.');
    const now = new Date();
    const [charges, payments] = await Promise.all([
      this.prisma.charge.findMany({ where: { unitId, cancelledAt: null }, include: { financeItem: true } }),
      this.prisma.payment.findMany({ where: { unitId, cancelledAt: null }, include: { paymentAccount: true } }),
    ]);

    type Row = {
      id: string;
      kind: 'CHARGE' | 'PAYMENT';
      date: Date;
      dueDate: Date | null;
      description: string;
      debit: Prisma.Decimal;
      credit: Prisma.Decimal;
      remaining: Prisma.Decimal;
      lateFee: Prisma.Decimal;
      balance: Prisma.Decimal;
    };
    const rows: Row[] = [
      ...charges.map((c) => ({
        id: c.id,
        kind: 'CHARGE' as const,
        date: c.date,
        dueDate: c.dueDate,
        description: c.period ? `${periodLabel(c.period)} - ${c.description}` : c.description,
        debit: c.amount,
        credit: ZERO,
        remaining: c.amount.sub(c.paid),
        lateFee: lateFee(c.amount.sub(c.paid), c.dueDate, unit.tenant.lateFeeRate, now),
        balance: ZERO,
      })),
      ...payments.map((p) => ({
        id: p.id,
        kind: 'PAYMENT' as const,
        date: p.date,
        dueDate: null,
        description: p.description || `Tahsilat (${p.paymentAccount.name})`,
        debit: ZERO,
        credit: p.amount,
        remaining: ZERO,
        lateFee: ZERO,
        balance: ZERO,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime() || (a.kind === 'CHARGE' ? -1 : 1));

    let running = ZERO;
    for (const r of rows) {
      running = running.add(r.debit).sub(r.credit);
      r.balance = running;
    }
    const totalDebit = rows.reduce((a, r) => a.add(r.debit), ZERO);
    const totalCredit = rows.reduce((a, r) => a.add(r.credit), ZERO);
    const due = charges
      .filter((c) => c.dueDate <= now)
      .reduce((a, c) => a.add(c.amount.sub(c.paid)), ZERO);
    const advance = payments.reduce((a, p) => a.add(p.amount.sub(p.allocated)), ZERO);
    const totalLateFee = rows.reduce((a, r) => a.add(r.lateFee), ZERO);
    const filtered = year ? rows.filter((r) => r.date.getUTCFullYear() === year) : rows;

    return {
      unit: { id: unit.id, label: unitLabel(unit), siteId: unit.siteId, siteName: unit.site.name },
      summary: { balance: running, totalDebit, totalCredit, due, advance, lateFee: totalLateFee },
      rows: filtered,
    };
  }

  async createPayment(
    tenantId: string,
    input: { unitId: string; paymentAccountId: string; amount: number; date: Date; description: string | null },
  ) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: input.unitId, tenantId },
      include: { block: true, occupants: { include: { person: true } } },
    });
    if (!unit) throw new NotFoundException('Daire bulunamadı.');
    const account = await this.prisma.paymentAccount.findFirst({ where: { id: input.paymentAccountId, tenantId } });
    if (!account) throw new NotFoundException('Ödeme hesabı bulunamadı.');
    if (!account.active) throw new BadRequestException('Pasif ödeme hesabına tahsilat yapılamaz.');
    const income = await this.prisma.financeItem.findFirst({
      where: { tenantId, kind: 'INCOME', active: true },
      orderBy: { isDefault: 'desc' },
    });
    const debtor = debtorOf(unit.occupants);
    const description = input.description || `${unitLabel(unit)} tahsilat`;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          siteId: unit.siteId,
          unitId: unit.id,
          personId: debtor?.id,
          paymentAccountId: account.id,
          amount: D(input.amount),
          date: input.date,
          description,
        },
      });
      await tx.cashTransaction.create({
        data: {
          tenantId,
          paymentAccountId: account.id,
          direction: 'IN',
          source: 'COLLECTION',
          amount: D(input.amount),
          date: input.date,
          description,
          siteId: unit.siteId,
          financeItemId: income?.id,
          paymentId: payment.id,
        },
      });
      await this.allocateUnit(tx, unit.id);
      return payment;
    });
  }

  async cancelPayment(tenantId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, tenantId, cancelledAt: null } });
    if (!payment) throw new NotFoundException('Tahsilat bulunamadı.');
    await this.prisma.$transaction(async (tx) => {
      await this.releaseAllocations(tx, { paymentId });
      await tx.cashTransaction.deleteMany({ where: { paymentId } });
      await tx.payment.update({ where: { id: paymentId }, data: { cancelledAt: new Date() } });
      await this.allocateUnit(tx, payment.unitId);
    });
    return { ok: true };
  }

  /** Dağıtım yöntemine göre her daireye düşen tutarı hesaplar (önizleme ve kayıt için ortak). */
  async planCharges(input: ChargePlanInput) {
    const units = await this.prisma.unit.findMany({
      where: {
        tenantId: input.tenantId,
        siteId: input.siteId,
        ...(input.blockId ? { blockId: input.blockId } : {}),
        ...(input.unitId ? { id: input.unitId } : {}),
      },
      include: { block: true, unitType: true, occupants: { include: { person: true } } },
    });
    if (!units.length) throw new BadRequestException('Seçilen kapsamda daire yok.');
    units.sort((a, b) => a.block.name.localeCompare(b.block.name, 'tr') || a.doorNo.localeCompare(b.doorNo, 'tr', { numeric: true }));

    const amount = D(input.amount);
    let amounts: Prisma.Decimal[];
    switch (input.distribution) {
      case 'FIXED':
        amounts = units.map(() => round2(amount));
        break;
      case 'COEFFICIENT':
        amounts = units.map((u) => round2(amount.mul(u.unitType?.coefficient ?? 1)));
        break;
      case 'EQUAL':
        amounts = distribute(amount, units.map(() => D(1)));
        break;
      case 'AREA':
        if (units.some((u) => !u.areaSqm || u.areaSqm.lte(0)))
          throw new BadRequestException('Metrekareye göre dağıtım için tüm dairelerin metrekaresi girilmiş olmalı.');
        amounts = distribute(amount, units.map((u) => u.areaSqm!));
        break;
      case 'LAND_SHARE':
        if (units.some((u) => !u.landShare || u.landShare.lte(0)))
          throw new BadRequestException('Arsa payına göre dağıtım için tüm dairelerin arsa payı girilmiş olmalı.');
        amounts = distribute(amount, units.map((u) => u.landShare!));
        break;
    }
    return units.map((u, i) => {
      const debtor = debtorOf(u.occupants);
      return { unitId: u.id, label: unitLabel(u), debtorId: debtor?.id ?? null, debtor: fullName(debtor), amount: amounts[i] };
    });
  }

  /**
   * Seçilen aylar için toplu aidat borcu. Aynı daire + dönem + kalem için ikinci kez borç yazılmaz
   * (idempotent), bu yüzden işlem güvenle tekrar çalıştırılabilir.
   */
  async createAidat(
    input: ChargePlanInput & { periods: string[]; dueDay: number; description: string | null; preview: boolean },
  ) {
    const item = await this.prisma.financeItem.findFirst({ where: { id: input.financeItemId, tenantId: input.tenantId } });
    if (!item) throw new NotFoundException('Borçlandırma kalemi bulunamadı.');
    const plan = await this.planCharges(input);
    const periods = [...new Set(input.periods)].sort();

    const existing = await this.prisma.charge.findMany({
      where: {
        tenantId: input.tenantId,
        unitId: { in: plan.map((p) => p.unitId) },
        financeItemId: item.id,
        period: { in: periods },
        cancelledAt: null,
      },
      select: { unitId: true, period: true },
    });
    const taken = new Set(existing.map((e) => `${e.unitId}|${e.period}`));
    const rows = periods.flatMap((period) =>
      plan.map((p) => ({ ...p, period, skipped: taken.has(`${p.unitId}|${period}`) })),
    );
    const toCreate = rows.filter((r) => !r.skipped && r.amount.gt(0));
    const total = toCreate.reduce((a, r) => a.add(r.amount), ZERO);

    if (input.preview) {
      return { preview: true, rows, total, createCount: toCreate.length, skipCount: rows.length - toCreate.length };
    }
    if (!toCreate.length) throw new BadRequestException('Yazılacak yeni borç yok; seçilen dönemler zaten borçlandırılmış.');

    const description = input.description || item.name;
    const batch = await this.prisma.$transaction(
      async (tx) => {
        const batch = await tx.chargeBatch.create({
          data: {
            tenantId: input.tenantId,
            siteId: input.siteId,
            kind: BatchKind.AIDAT,
            financeItemId: item.id,
            description: `${description} — ${periods.map(periodLabel).join(', ')}`,
            totalAmount: total,
          },
        });
        await tx.charge.createMany({
          data: toCreate.map((r) => ({
            tenantId: input.tenantId,
            siteId: input.siteId,
            unitId: r.unitId,
            personId: r.debtorId,
            batchId: batch.id,
            financeItemId: item.id,
            period: r.period,
            description,
            amount: r.amount,
            ...periodDates(r.period, input.dueDay),
          })),
        });
        for (const unitId of new Set(toCreate.map((r) => r.unitId))) await this.allocateUnit(tx, unitId);
        return batch;
      },
      { timeout: 60_000 },
    );
    return { preview: false, batchId: batch.id, total, createCount: toCreate.length, skipCount: rows.length - toCreate.length };
  }

  /** Aidat dışı tekil/ortak borç; isteğe bağlı aylık taksitlendirme. */
  async createManual(
    input: ChargePlanInput & {
      date: Date;
      dueDate: Date;
      installments: number;
      description: string | null;
      preview: boolean;
    },
  ) {
    const item = await this.prisma.financeItem.findFirst({ where: { id: input.financeItemId, tenantId: input.tenantId } });
    if (!item) throw new NotFoundException('Borçlandırma kalemi bulunamadı.');
    const plan = await this.planCharges(input);
    const n = input.installments;
    const description = input.description || item.name;

    const rows = plan.flatMap((p) => {
      const parts = n > 1 ? distribute(p.amount, Array.from({ length: n }, () => D(1))) : [p.amount];
      return parts.map((amount, i) => {
        const dueDate = new Date(input.dueDate);
        dueDate.setUTCMonth(dueDate.getUTCMonth() + i);
        return { ...p, amount, dueDate, description: n > 1 ? `${description} (${i + 1}/${n}. taksit)` : description };
      });
    });
    const total = rows.reduce((a, r) => a.add(r.amount), ZERO);
    if (input.preview) return { preview: true, rows, total, createCount: rows.length, skipCount: 0 };
    if (total.lte(0)) throw new BadRequestException('Toplam tutar sıfırdan büyük olmalı.');

    const batch = await this.prisma.$transaction(
      async (tx) => {
        const batch = await tx.chargeBatch.create({
          data: {
            tenantId: input.tenantId,
            siteId: input.siteId,
            kind: BatchKind.MANUAL,
            financeItemId: item.id,
            description,
            totalAmount: total,
          },
        });
        await tx.charge.createMany({
          data: rows
            .filter((r) => r.amount.gt(0))
            .map((r) => ({
              tenantId: input.tenantId,
              siteId: input.siteId,
              unitId: r.unitId,
              personId: r.debtorId,
              batchId: batch.id,
              financeItemId: item.id,
              description: r.description,
              amount: r.amount,
              date: input.date,
              dueDate: r.dueDate,
            })),
        });
        for (const unitId of new Set(rows.map((r) => r.unitId))) await this.allocateUnit(tx, unitId);
        return batch;
      },
      { timeout: 60_000 },
    );
    return { preview: false, batchId: batch.id, total, createCount: rows.length, skipCount: 0 };
  }

  /** Borçlandırmayı iptal eder; bu borçlara dağıtılmış tahsilatlar avansa döner ve diğer borçlara yeniden dağıtılır. */
  async cancelBatch(tenantId: string, batchId: string) {
    const batch = await this.prisma.chargeBatch.findFirst({ where: { id: batchId, tenantId, cancelledAt: null } });
    if (!batch) throw new NotFoundException('Borçlandırma bulunamadı.');
    await this.prisma.$transaction(
      async (tx) => {
        const charges = await tx.charge.findMany({ where: { batchId }, select: { id: true, unitId: true } });
        await this.releaseAllocations(tx, { chargeId: { in: charges.map((c) => c.id) } });
        const now = new Date();
        await tx.charge.updateMany({ where: { batchId }, data: { cancelledAt: now } });
        await tx.chargeBatch.update({ where: { id: batchId }, data: { cancelledAt: now } });
        for (const unitId of new Set(charges.map((c) => c.unitId))) await this.allocateUnit(tx, unitId);
      },
      { timeout: 60_000 },
    );
    return { ok: true };
  }

  /** Borçlu takip: açık borcu olan daireler, gecikme tazminatı ile. */
  async debtors(tenantId: string, q: { siteId?: string; blockId?: string; overdueOnly: boolean; sort: 'amount' | 'oldest' }) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const now = new Date();
    const charges = await this.prisma.charge.findMany({
      where: {
        tenantId,
        cancelledAt: null,
        ...(q.siteId ? { siteId: q.siteId } : {}),
        ...(q.blockId ? { unit: { blockId: q.blockId } } : {}),
        ...(q.overdueOnly ? { dueDate: { lt: now } } : {}),
      },
      include: { unit: { include: { block: true, site: true, occupants: { include: { person: true } } } } },
    });
    const byUnit = new Map<string, { unit: (typeof charges)[number]['unit']; open: Prisma.Decimal; fee: Prisma.Decimal; oldest: Date; lines: number }>();
    for (const c of charges) {
      const remaining = c.amount.sub(c.paid);
      if (remaining.lte(0)) continue;
      const row = byUnit.get(c.unitId) ?? { unit: c.unit, open: ZERO, fee: ZERO, oldest: c.dueDate, lines: 0 };
      row.open = row.open.add(remaining);
      row.fee = row.fee.add(lateFee(remaining, c.dueDate, tenant.lateFeeRate, now));
      if (c.dueDate < row.oldest) row.oldest = c.dueDate;
      row.lines++;
      byUnit.set(c.unitId, row);
    }
    const rows = [...byUnit.values()].map((r) => {
      const debtor = debtorOf(r.unit.occupants);
      return {
        unitId: r.unit.id,
        site: r.unit.site.name,
        label: unitLabel(r.unit),
        debtor: fullName(debtor),
        phone: debtor?.phone ?? null,
        open: r.open,
        lateFee: r.fee,
        oldestDue: r.oldest,
        overdueDays: Math.max(0, Math.floor((now.getTime() - r.oldest.getTime()) / 86_400_000)),
        lines: r.lines,
      };
    });
    rows.sort((a, b) => (q.sort === 'oldest' ? a.oldestDue.getTime() - b.oldestDue.getTime() : b.open.cmp(a.open)));
    return {
      summary: {
        totalOpen: rows.reduce((a, r) => a.add(r.open), ZERO),
        totalLateFee: rows.reduce((a, r) => a.add(r.lateFee), ZERO),
        debtorUnits: rows.length,
        lines: rows.reduce((a, r) => a + r.lines, 0),
      },
      lateFeeRate: tenant.lateFeeRate,
      rows,
    };
  }
}
