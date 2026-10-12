import 'server-only';
import { randomUUID } from 'node:crypto';
import { CashAccountType, CashTxType, PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { D, ZERO, num, round2, type Money } from './money';

type Tx = Prisma.TransactionClient;
type Db = Tx | typeof prisma;

// -------------------- IBAN --------------------

/** Boşlukları kaldırır, büyük harfe çevirir. */
export const normalizeIban = (v: string) => v.replace(/\s+/g, '').toUpperCase();

/** TR IBAN: TR + 24 hane ve ISO 13616 mod-97 kontrolü (yanlış yazılmış IBAN'ı yakalar). */
export function isValidTrIban(raw: string) {
  const iban = normalizeIban(raw);
  if (!/^TR\d{24}$/.test(iban)) return false;
  const moved = iban.slice(4) + iban.slice(0, 4);
  const digits = moved.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of digits) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1;
}

/** Okunabilir biçim: TR12 3456 7890 ... */
export const formatIban = (iban: string) => normalizeIban(iban).replace(/(.{4})/g, '$1 ').trim();

// -------------------- Hesaplar ve bakiye --------------------

export async function balancesOf(db: Db, tenantId: string, accountIds?: string[]) {
  const rows = await db.cashTransaction.groupBy({
    by: ['accountId'],
    where: { tenantId, ...(accountIds ? { accountId: { in: accountIds } } : {}) },
    _sum: { amount: true },
  });
  return new Map(rows.map((r) => [r.accountId, D(r._sum.amount)]));
}

export async function balanceOf(db: Db, tenantId: string, accountId: string): Promise<Money> {
  return (await balancesOf(db, tenantId, [accountId])).get(accountId) ?? ZERO;
}

export async function listAccounts(tenantId: string) {
  const accounts = await prisma.cashAccount.findMany({
    where: { tenantId },
    orderBy: [{ isActive: 'desc' }, { type: 'asc' }, { createdAt: 'asc' }],
  });
  const balances = await balancesOf(prisma, tenantId);
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    bankName: a.bankName,
    iban: a.iban ? formatIban(a.iban) : null,
    holderName: a.holderName,
    showToResidents: a.showToResidents,
    isActive: a.isActive,
    balance: num(balances.get(a.id) ?? ZERO),
  }));
}

export type AccountDto = Awaited<ReturnType<typeof listAccounts>>[number];

/** Sakinlerin aidat ödeyebileceği banka hesapları (yalnızca gösterilmesine izin verilenler). */
export async function residentPaymentAccounts(tenantId: string) {
  const rows = await prisma.cashAccount.findMany({
    where: { tenantId, type: 'BANK', isActive: true, showToResidents: true, iban: { not: null } },
    select: { id: true, bankName: true, holderName: true, iban: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((r) => ({ id: r.id, bankName: r.bankName, holderName: r.holderName, iban: formatIban(r.iban!) }));
}

/**
 * Tahsilatın işleneceği hesap. Seçilmişse o hesap (aynı site, aktif) kullanılır; seçilmemişse
 * nakit → ilk kasa, diğer yöntemler → ilk banka hesabı (sakinlere gösterilen önce).
 * Sitede uygun hesap yoksa bir tane açılır; böylece hiçbir tahsilat kasa dışında kalmaz.
 */
export async function resolveCollectionAccount(tx: Tx, tenantId: string, method: PaymentMethod, accountId?: string | null) {
  if (accountId) {
    const acc = await tx.cashAccount.findFirst({ where: { id: accountId, tenantId, isActive: true }, select: { id: true } });
    if (!acc) throw new CashError('Seçilen kasa / banka hesabı bulunamadı.');
    return acc.id;
  }
  const type: CashAccountType = method === 'CASH' ? 'CASH' : 'BANK';
  const found = await tx.cashAccount.findFirst({
    where: { tenantId, type, isActive: true },
    orderBy: [{ showToResidents: 'desc' }, { createdAt: 'asc' }],
    select: { id: true },
  });
  if (found) return found.id;
  const created = await tx.cashAccount.create({
    data: { tenantId, type, name: type === 'CASH' ? 'Yönetim Kasası' : 'Banka Hesabı' },
    select: { id: true },
  });
  return created.id;
}

/** Aidat tahsilatını kasaya / bankaya giriş olarak işler. */
export async function postCollection(
  tx: Tx,
  p: { tenantId: string; paymentId: string; amount: Money; date: Date; method: PaymentMethod; description: string; accountId?: string | null; createdById?: string | null },
) {
  if (D(p.amount).lte(0)) return;
  const accountId = await resolveCollectionAccount(tx, p.tenantId, p.method, p.accountId);
  await tx.cashTransaction.create({
    data: {
      tenantId: p.tenantId,
      accountId,
      type: 'DUES_COLLECTION',
      amount: round2(D(p.amount)),
      date: p.date,
      description: p.description,
      paymentId: p.paymentId,
      createdById: p.createdById ?? null,
    },
  });
}

export class CashError extends Error {}

// -------------------- Hesap açma / düzenleme --------------------

export interface AccountInput {
  name: string;
  type: CashAccountType;
  bankName?: string | null;
  iban?: string | null;
  holderName?: string | null;
  showToResidents?: boolean;
  openingBalance?: Money;
  openingDate?: Date;
}

export async function createAccount(tenantId: string, userId: string, input: AccountInput) {
  const isBank = input.type === 'BANK';
  return prisma.$transaction(async (tx) => {
    const acc = await tx.cashAccount.create({
      data: {
        tenantId,
        name: input.name,
        type: input.type,
        bankName: isBank ? input.bankName || null : null,
        iban: isBank && input.iban ? normalizeIban(input.iban) : null,
        holderName: input.holderName || null,
        showToResidents: isBank && !!input.iban && !!input.showToResidents,
      },
    });
    if (input.openingBalance && input.openingBalance.gt(0)) {
      await tx.cashTransaction.create({
        data: {
          tenantId,
          accountId: acc.id,
          type: 'OPENING',
          amount: round2(input.openingBalance),
          date: input.openingDate ?? new Date(),
          description: 'Açılış bakiyesi',
          createdById: userId,
        },
      });
    }
    return acc.id;
  });
}

export async function updateAccount(
  tenantId: string,
  id: string,
  patch: Partial<Pick<AccountInput, 'name' | 'bankName' | 'iban' | 'holderName' | 'showToResidents'>> & { isActive?: boolean },
): Promise<'ok' | 'not-found' | string> {
  const acc = await prisma.cashAccount.findFirst({ where: { id, tenantId } });
  if (!acc) return 'not-found';
  const isBank = acc.type === 'BANK';
  const iban = patch.iban === undefined ? acc.iban : patch.iban ? normalizeIban(patch.iban) : null;
  const show = patch.showToResidents ?? acc.showToResidents;
  if (isBank && show && !iban) return 'Sakinlere göstermek için IBAN girin.';
  if (patch.isActive === false) {
    const bal = await balanceOf(prisma, tenantId, id);
    if (!bal.eq(0)) return 'Bakiyesi sıfır olmayan hesap kapatılamaz; önce virmanla boşaltın.';
  }
  const isActive = patch.isActive ?? acc.isActive;
  await prisma.cashAccount.update({
    where: { id },
    data: {
      name: patch.name ?? undefined,
      bankName: isBank && patch.bankName !== undefined ? patch.bankName || null : undefined,
      iban: isBank ? iban : null,
      holderName: patch.holderName !== undefined ? patch.holderName || null : undefined,
      isActive,
      showToResidents: isBank && isActive && !!iban && show,
    },
  });
  return 'ok';
}

// -------------------- Elle hareket / virman --------------------

export type ManualKind = 'OTHER_INCOME' | 'EXPENSE' | 'VENDOR_PAYMENT' | 'TRANSFER';

export async function addManualTransaction(
  tenantId: string,
  userId: string,
  input: { kind: ManualKind; accountId: string; targetAccountId?: string; amount: Money; date: Date; description: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const amount = round2(input.amount);
  return prisma.$transaction(async (tx) => {
    const ids = [input.accountId, ...(input.kind === 'TRANSFER' && input.targetAccountId ? [input.targetAccountId] : [])];
    const accounts = await tx.cashAccount.findMany({ where: { tenantId, id: { in: ids }, isActive: true } });
    const source = accounts.find((a) => a.id === input.accountId);
    if (!source) return { ok: false, error: 'Hesap bulunamadı.' };

    if (input.kind === 'OTHER_INCOME') {
      await tx.cashTransaction.create({
        data: { tenantId, accountId: source.id, type: 'OTHER_INCOME', amount, date: input.date, description: input.description, createdById: userId },
      });
      return { ok: true };
    }

    // Çıkışlar: hesap bakiyesi eksiye düşemez.
    const balance = await balanceOf(tx, tenantId, source.id);
    if (balance.lt(amount)) {
      return { ok: false, error: `Yetersiz bakiye: ${source.name} bakiyesi ${trl(balance)}.` };
    }

    if (input.kind === 'TRANSFER') {
      const target = accounts.find((a) => a.id === input.targetAccountId);
      if (!target) return { ok: false, error: 'Hedef hesap bulunamadı.' };
      if (target.id === source.id) return { ok: false, error: 'Kaynak ve hedef hesap aynı olamaz.' };
      const transferId = randomUUID();
      const description = input.description || `${source.name} → ${target.name}`;
      await tx.cashTransaction.createMany({
        data: [
          { tenantId, accountId: source.id, type: 'TRANSFER_OUT', amount: amount.neg(), date: input.date, description, transferId, createdById: userId },
          { tenantId, accountId: target.id, type: 'TRANSFER_IN', amount, date: input.date, description, transferId, createdById: userId },
        ],
      });
      return { ok: true };
    }

    await tx.cashTransaction.create({
      data: { tenantId, accountId: source.id, type: input.kind, amount: amount.neg(), date: input.date, description: input.description, createdById: userId },
    });
    return { ok: true };
  });
}

/**
 * Elle girilmiş hareketi siler (hatalı kayıt düzeltme). Aidat tahsilatından gelen hareketler
 * buradan silinemez. Virman iki ayağıyla birlikte silinir. Silme bir hesabı eksiye düşüremez.
 */
export async function deleteManualTransaction(tenantId: string, id: string): Promise<'ok' | 'not-found' | string> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.cashTransaction.findFirst({ where: { id, tenantId } });
    if (!row) return 'not-found';
    if (row.paymentId) return 'Aidat tahsilatından gelen hareket buradan silinemez.';
    const rows = row.transferId ? await tx.cashTransaction.findMany({ where: { tenantId, transferId: row.transferId } }) : [row];
    const balances = await balancesOf(tx, tenantId, [...new Set(rows.map((r) => r.accountId))]);
    for (const r of rows) {
      const after = (balances.get(r.accountId) ?? ZERO).sub(r.amount);
      if (after.lt(0)) return 'Bu kayıt silinirse hesap bakiyesi eksiye düşer.';
      balances.set(r.accountId, after);
    }
    await tx.cashTransaction.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
    return 'ok';
  });
}

// -------------------- Ekstre --------------------

export const TX_LABEL: Record<CashTxType, string> = {
  OPENING: 'Açılış bakiyesi',
  DUES_COLLECTION: 'Aidat tahsilatı',
  OTHER_INCOME: 'Diğer gelir',
  EXPENSE: 'Gider ödemesi',
  VENDOR_PAYMENT: 'Firma / personel ödemesi',
  TRANSFER_IN: 'Virman girişi',
  TRANSFER_OUT: 'Virman çıkışı',
};

/** Hesap ekstresi: tarih sırasıyla yürüyen bakiye, en yeni üstte. */
export async function statement(tenantId: string, accountId: string) {
  const acc = await prisma.cashAccount.findFirst({ where: { id: accountId, tenantId }, select: { id: true } });
  if (!acc) return null;
  const rows = await prisma.cashTransaction.findMany({
    where: { tenantId, accountId },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    include: { payment: { select: { receiptNo: true } } },
  });
  let running = ZERO;
  const out = rows.map((r) => {
    running = running.add(r.amount);
    return {
      id: r.id,
      type: r.type,
      typeLabel: TX_LABEL[r.type],
      amount: num(D(r.amount)),
      date: r.date.toISOString(),
      description: r.description,
      receiptNo: r.payment?.receiptNo ?? null,
      manual: !r.paymentId,
      balance: num(running),
    };
  });
  return out.reverse();
}

const trl = (v: Money) => `${num(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
