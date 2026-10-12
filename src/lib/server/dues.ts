import 'server-only';
import { DueStatus, PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { D, ZERO, distribute, lateFee, minD, num, round2, type Money } from './money';
import { CashError, postCollection } from './cash';

type Tx = Prisma.TransactionClient;
const OPEN: DueStatus[] = ['PENDING', 'PARTIAL', 'OVERDUE'];

/**
 * Bir borca ödeme uygular (kalan tutarı aşmaz). Uygulanan tutarı döner.
 * Banka eşleştirme ve elle tahsilat aynı fonksiyonu kullanır.
 */
export async function applyToDue(tx: Tx, dueId: string, amount: Money): Promise<Money> {
  const due = await tx.due.findUniqueOrThrow({ where: { id: dueId } });
  const remaining = D(due.amount).sub(due.paidAmount);
  const applied = round2(minD(remaining, amount));
  if (applied.lte(0)) return ZERO;
  const paid = D(due.paidAmount).add(applied);
  const full = paid.gte(due.amount);
  await tx.due.update({
    where: { id: dueId },
    data: { paidAmount: paid, status: full ? 'PAID' : 'PARTIAL', paidAt: full ? new Date() : null },
  });
  return applied;
}

/** Ödemeyi geri alır (banka eşleştirmesi iptali vb.). */
export async function revertFromDue(tx: Tx, dueId: string, amount: Money) {
  const due = await tx.due.findUniqueOrThrow({ where: { id: dueId } });
  const paid = D(due.paidAmount).sub(amount);
  const newPaid = paid.lt(0) ? ZERO : paid;
  await tx.due.update({
    where: { id: dueId },
    data: { paidAmount: newPaid, status: newPaid.lte(0) ? 'PENDING' : 'PARTIAL', paidAt: null },
  });
}

// -------------------- Arayüz biçimi --------------------

export type InvoiceStatusUi = 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';

const dueInclude = {
  apartment: {
    select: {
      id: true,
      number: true,
      block: { select: { name: true } },
      residents: { select: { isOwner: true, user: { select: { name: true } } } },
    },
  },
  payments: { select: { id: true, amount: true, method: true, paidAt: true, receiptNo: true, notes: true }, orderBy: { paidAt: 'desc' } },
} satisfies Prisma.DueInclude;

type DueRow = Prisma.DueGetPayload<{ include: typeof dueInclude }>;

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CREDIT_CARD: 'Kredi Kartı',
  BANK_TRANSFER: 'Havale / EFT',
  CASH: 'Nakit',
  QR: 'QR',
  AUTO_PAYMENT: 'Otomatik Ödeme',
};

export function toInvoice(d: DueRow, now = new Date()) {
  const remaining = D(d.amount).sub(d.paidAmount);
  const tenant = d.apartment.residents.find((r) => !r.isOwner);
  const owner = d.apartment.residents.find((r) => r.isOwner);
  let status: InvoiceStatusUi;
  if (d.status === 'CANCELLED') status = 'cancelled';
  else if (d.status === 'PAID' || remaining.lte(0)) status = 'paid';
  else if (d.dueDate < now) status = 'overdue';
  else status = d.status === 'PARTIAL' ? 'partial' : 'sent';
  const description = d.description ?? 'Aidat';
  const fee = status === 'cancelled' ? ZERO : lateFee(remaining, d.dueDate, now);
  return {
    id: d.id,
    tenantId: d.tenantId,
    unitId: d.apartment.id,
    unitNumber: d.apartment.number,
    blockName: d.apartment.block.name,
    // Borçlu: kiracı varsa kiracı, yoksa kat maliki (arayüzdeki mevcut kural).
    ownerName: tenant?.user.name ?? owner?.user.name ?? 'Kayıtlı sakin yok',
    period: d.period,
    description,
    totalAmount: num(D(d.amount)),
    paidAmount: num(D(d.paidAmount)),
    remainingAmount: status === 'cancelled' || remaining.lt(0) ? 0 : num(remaining),
    lateFee: num(fee),
    status,
    dueDate: d.dueDate.toISOString().slice(0, 10),
    createdAt: d.createdAt.toISOString(),
    items: [{ id: `${d.id}-1`, description, amount: num(D(d.amount)), type: 'charge' as const }],
    payments: d.payments.map((p) => ({
      id: p.id,
      amount: num(D(p.amount)),
      method: METHOD_LABEL[p.method],
      paidAt: p.paidAt.toISOString(),
      receiptNo: p.receiptNo,
      notes: p.notes,
    })),
  };
}

export type InvoiceDto = ReturnType<typeof toInvoice>;

export async function listInvoices(where: Prisma.DueWhereInput) {
  const rows = await prisma.due.findMany({ where, include: dueInclude, orderBy: [{ period: 'desc' }, { createdAt: 'desc' }] });
  const now = new Date();
  return rows.map((r) => toInvoice(r, now));
}

export async function getInvoice(tenantId: string, id: string) {
  const row = await prisma.due.findFirst({ where: { id, tenantId }, include: dueInclude });
  return row ? toInvoice(row) : null;
}

// -------------------- Tahakkuk --------------------

export type CalcMethod = 'fixed' | 'equal' | 'area' | 'share';

export interface ChargeInput {
  unitId: string | 'all';
  period: string;
  amount: Money;
  dueDate: Date;
  description: string;
  method: CalcMethod;
}

/**
 * Borç tahakkuku. Tek daire için tutar aynen yazılır; tüm daireler için yönteme göre:
 *  fixed: her daireye girilen tutar · equal: toplam eşit bölünür · share: toplam arsa payına göre bölünür
 *  area: girilen tutar m² birim fiyatıdır (daire m² × birim fiyat).
 * Aynı dönem ve aynı açıklamayla iptal edilmemiş borcu olan daireler atlanır (mükerrer tahakkuk olmaz).
 */
export async function createCharges(tenantId: string, input: ChargeInput) {
  const units = await prisma.apartment.findMany({
    where: { tenantId, ...(input.unitId === 'all' ? {} : { id: input.unitId }) },
    select: { id: true, number: true, size: true, shareRatio: true },
    orderBy: [{ block: { name: 'asc' } }, { number: 'asc' }],
  });
  if (!units.length) throw new ChargeError(input.unitId === 'all' ? 'Sitede kayıtlı daire yok.' : 'Daire bulunamadı.');

  let amounts: Money[];
  if (input.unitId !== 'all' || input.method === 'fixed') {
    amounts = units.map(() => round2(input.amount));
  } else if (input.method === 'equal') {
    amounts = distribute(input.amount, units.map(() => D(1)));
  } else if (input.method === 'share') {
    if (units.some((u) => !u.shareRatio || u.shareRatio <= 0)) throw new ChargeError('Arsa payı girilmemiş daireler var; önce daire bilgilerini tamamlayın.');
    amounts = distribute(input.amount, units.map((u) => D(u.shareRatio!)));
  } else {
    if (units.some((u) => !u.size || u.size <= 0)) throw new ChargeError('Metrekaresi girilmemiş daireler var; önce daire bilgilerini tamamlayın.');
    amounts = units.map((u) => round2(input.amount.mul(u.size!)));
  }

  const existing = await prisma.due.findMany({
    where: { tenantId, period: input.period, description: input.description, status: { not: 'CANCELLED' }, apartmentId: { in: units.map((u) => u.id) } },
    select: { apartmentId: true },
  });
  const skip = new Set(existing.map((e) => e.apartmentId));
  const rows = units
    .map((u, i) => ({ unit: u, amount: amounts[i] }))
    .filter((r) => !skip.has(r.unit.id) && r.amount.gt(0));

  if (rows.length) {
    await prisma.due.createMany({
      data: rows.map((r) => ({
        tenantId,
        apartmentId: r.unit.id,
        type: 'MANAGEMENT',
        period: input.period,
        description: input.description,
        amount: r.amount,
        dueDate: input.dueDate,
        status: 'PENDING',
      })),
    });
  }
  return {
    created: rows.length,
    skipped: skip.size,
    total: num(rows.reduce((a, r) => a.add(r.amount), ZERO)),
  };
}

export class ChargeError extends Error {}

// -------------------- Tahsilat --------------------

let receiptSeq = 0;
function receiptNo() {
  // Okunabilir ve tekil makbuz numarası: TH-yyyymmdd-zaman-sayaç
  const d = new Date();
  receiptSeq = (receiptSeq + 1) % 1000;
  return `TH-${d.toISOString().slice(0, 10).replace(/-/g, '')}-${d.getTime().toString(36).toUpperCase()}${receiptSeq}`;
}

export async function recordPayment(
  tenantId: string,
  dueId: string,
  input: { amount: Money; method: PaymentMethod; paidAt: Date; notes?: string; accountId?: string | null; userId?: string },
): Promise<{ ok: true; applied: number } | { ok: false; error: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const due = await tx.due.findFirst({ where: { id: dueId, tenantId }, include: { apartment: { select: { number: true } } } });
      if (!due) return { ok: false, error: 'Borç kaydı bulunamadı.' };
      if (!OPEN.includes(due.status)) return { ok: false, error: 'Bu borç ödenmiş veya iptal edilmiş.' };
      const remaining = D(due.amount).sub(due.paidAmount);
      if (input.amount.gt(remaining)) {
        const tl = num(remaining).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return { ok: false, error: `Tahsilat kalan borçtan (${tl} ₺) fazla olamaz.` };
      }
      const applied = await applyToDue(tx, dueId, input.amount);
      const payment = await tx.payment.create({
        data: {
          tenantId,
          dueId,
          apartmentId: due.apartmentId,
          amount: applied,
          method: input.method,
          status: 'COMPLETED',
          receiptNo: receiptNo(),
          paidAt: input.paidAt,
          notes: input.notes || null,
        },
      });
      // Tahsilat aynı işlemde kasaya / bankaya giriş olarak işlenir.
      await postCollection(tx, {
        tenantId,
        paymentId: payment.id,
        amount: applied,
        date: input.paidAt,
        method: input.method,
        accountId: input.accountId,
        createdById: input.userId,
        description: collectionText(due.apartment.number, due.period, due.description),
      });
      return { ok: true, applied: num(applied) };
    });
  } catch (err) {
    if (err instanceof CashError) return { ok: false, error: err.message };
    throw err;
  }
}

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const periodText = (period: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  return m ? `${TR_MONTHS[Number(m[2]) - 1]} ${m[1]}` : period;
};

/** Kasa hareketi açıklaması: "Daire A-201 · Ekim 2026 Aidat" */
export const collectionText = (unitNumber: string, period: string | null, description: string | null) =>
  ['Daire ' + unitNumber, [period && periodText(period), description ?? 'Aidat'].filter(Boolean).join(' ')].join(' · ');

/** Tahsilatı olmayan borç iptal edilebilir (kayıt silinmez, iz kalır). */
export async function cancelDue(tenantId: string, dueId: string): Promise<'ok' | 'not-found' | 'has-payments'> {
  const due = await prisma.due.findFirst({ where: { id: dueId, tenantId }, select: { status: true, paidAmount: true, _count: { select: { payments: true } } } });
  if (!due) return 'not-found';
  if (due._count.payments > 0 || D(due.paidAmount).gt(0)) return 'has-payments';
  await prisma.due.update({ where: { id: dueId }, data: { status: 'CANCELLED' } });
  return 'ok';
}
