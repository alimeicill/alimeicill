import { Prisma } from '@prisma/client';

export const D = (v: Prisma.Decimal.Value | null | undefined) => new Prisma.Decimal(v ?? 0);
export const ZERO = new Prisma.Decimal(0);

export const round2 = (v: Prisma.Decimal) => v.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

const DAY = 24 * 60 * 60 * 1000;

/**
 * Gecikme tazminatı (KMK md. 20): ödenmeyen tutar için aylık oran, gün bazında orantılanır.
 * Kayıt altına alınmaz; her görüntülemede güncel tarihe göre hesaplanır.
 */
export function lateFee(remaining: Prisma.Decimal, dueDate: Date, monthlyRatePct: Prisma.Decimal, now = new Date()) {
  if (remaining.lte(0) || dueDate >= now) return ZERO;
  const days = Math.floor((now.getTime() - dueDate.getTime()) / DAY);
  if (days <= 0) return ZERO;
  return round2(remaining.mul(monthlyRatePct).div(100).mul(days).div(30));
}

/** Toplam tutarı ağırlıklara göre kuruş hassasiyetinde dağıtır; yuvarlama farkı son satıra eklenir. */
export function distribute(total: Prisma.Decimal, weights: Prisma.Decimal[]): Prisma.Decimal[] {
  const sum = weights.reduce((a, w) => a.add(w), ZERO);
  if (sum.lte(0)) throw new Error('Dağıtım ağırlıklarının toplamı sıfır olamaz.');
  const parts = weights.map((w) => round2(total.mul(w).div(sum)));
  const diff = total.sub(parts.reduce((a, p) => a.add(p), ZERO));
  parts[parts.length - 1] = parts[parts.length - 1].add(diff);
  return parts;
}
