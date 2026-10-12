import 'server-only';
import { DueStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { D, ZERO, num } from './money';
import { balancesOf } from './cash';

const OPEN: DueStatus[] = ['PENDING', 'PARTIAL', 'OVERDUE'];
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Yönetici panosundaki tüm rakamlar; hepsi veritabanından, site (tenant) bazında. */
export async function managerDashboard(tenantId: string, now = new Date()) {
  const period = now.toISOString().slice(0, 7);
  const chartStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const [tenant, unitsByStatus, openDues, monthDues, accounts, flows, recent] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
    prisma.apartment.groupBy({ by: ['status'], where: { tenantId }, _count: { _all: true } }),
    prisma.due.findMany({
      where: { tenantId, status: { in: OPEN } },
      select: { apartmentId: true, amount: true, paidAmount: true, dueDate: true },
    }),
    prisma.due.aggregate({
      where: { tenantId, period, status: { not: 'CANCELLED' } },
      _sum: { amount: true, paidAmount: true },
      _count: { _all: true },
    }),
    prisma.cashAccount.findMany({ where: { tenantId, isActive: true }, select: { id: true, type: true } }),
    // Gelir-gider grafiği: virman ve açılış bakiyesi gelir/gider sayılmaz.
    prisma.cashTransaction.findMany({
      where: { tenantId, date: { gte: chartStart }, type: { notIn: ['TRANSFER_IN', 'TRANSFER_OUT', 'OPENING'] } },
      select: { date: true, amount: true },
    }),
    prisma.payment.findMany({
      where: { tenantId, status: 'COMPLETED' },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        id: true,
        amount: true,
        paidAt: true,
        method: true,
        apartment: { select: { number: true } },
        due: { select: { period: true, description: true } },
      },
    }),
  ]);

  // Daireler ve doluluk
  const count = (s: string) => unitsByStatus.find((u) => u.status === s)?._count._all ?? 0;
  const totalUnits = unitsByStatus.reduce((a, u) => a + u._count._all, 0);
  const occupied = count('OCCUPIED');
  const renovation = count('RENOVATION');
  const empty = totalUnits - occupied - renovation;

  // Borçlar
  let outstanding = ZERO;
  let overdue = ZERO;
  const debtorUnits = new Set<string>();
  const overdueUnits = new Set<string>();
  for (const d of openDues) {
    const rem = D(d.amount).sub(d.paidAmount);
    if (rem.lte(0)) continue;
    outstanding = outstanding.add(rem);
    debtorUnits.add(d.apartmentId);
    if (d.dueDate < now) {
      overdue = overdue.add(rem);
      overdueUnits.add(d.apartmentId);
    }
  }

  // Bu ayın tahakkuk / tahsilatı
  const accrued = D(monthDues._sum.amount);
  const collected = D(monthDues._sum.paidAmount);

  // Kasa / banka
  const balances = await balancesOf(prisma, tenantId, accounts.map((a) => a.id));
  let cash = ZERO;
  let bank = ZERO;
  for (const a of accounts) {
    const b = balances.get(a.id) ?? ZERO;
    if (a.type === 'CASH') cash = cash.add(b);
    else bank = bank.add(b);
  }

  // Son 6 ay gelir / gider
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(chartStart.getUTCFullYear(), chartStart.getUTCMonth() + i, 1));
    return { key: d.toISOString().slice(0, 7), month: MONTHS[d.getUTCMonth()], income: ZERO, expense: ZERO };
  });
  for (const f of flows) {
    const b = buckets.find((x) => x.key === f.date.toISOString().slice(0, 7));
    if (!b) continue;
    const a = D(f.amount);
    if (a.gte(0)) b.income = b.income.add(a);
    else b.expense = b.expense.add(a.neg());
  }

  return {
    siteName: tenant?.name ?? '',
    period,
    units: { total: totalUnits, occupied, empty, renovation, occupancyRate: pct(occupied, totalUnits) },
    dues: {
      monthAccrued: num(accrued),
      monthCollected: num(collected),
      monthCollectionRate: pct(num(collected), num(accrued)),
      monthDueCount: monthDues._count._all,
      outstanding: num(outstanding),
      overdue: num(overdue),
      debtorUnits: debtorUnits.size,
      overdueUnits: overdueUnits.size,
    },
    cash: { total: num(cash.add(bank)), cash: num(cash), bank: num(bank), accountCount: accounts.length },
    monthly: buckets.map((b) => ({ month: b.month, period: b.key, revenue: num(b.income), expense: num(b.expense) })),
    recentPayments: recent.map((p) => ({
      id: p.id,
      unitNumber: p.apartment.number,
      label: p.due ? `${p.due.period} ${p.due.description ?? 'Aidat'}` : 'Avans',
      amount: num(D(p.amount)),
      paidAt: p.paidAt.toISOString(),
      method: p.method,
    })),
  };
}

export type ManagerDashboard = Awaited<ReturnType<typeof managerDashboard>>;
