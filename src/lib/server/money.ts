// Kuruş hassasiyetinde para hesapları (Prisma.Decimal). Float kullanılmaz.
import { Prisma } from '@prisma/client';

export type Money = Prisma.Decimal;
export const D = (v: Prisma.Decimal.Value | null | undefined) => new Prisma.Decimal(v ?? 0);
export const ZERO = D(0);
export const round2 = (v: Money) => v.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
export const maxD = (a: Money, b: Money) => (a.gt(b) ? a : b);
export const minD = (a: Money, b: Money) => (a.lt(b) ? a : b);
/** JSON yanıtları için sayıya çevirir (2 basamak). */
export const num = (v: Money) => round2(v).toNumber();

/**
 * Toplam tutarı ağırlıklara göre böler; kuruşlar en büyük kalan yöntemiyle dağıtılır,
 * böylece parçaların toplamı her zaman tam olarak toplam tutara eşittir.
 */
export function distribute(total: Money, weights: Money[]): Money[] {
  const sum = weights.reduce((a, w) => a.add(w), ZERO);
  if (sum.lte(0)) throw new Error('Dağıtım ağırlıklarının toplamı sıfırdan büyük olmalı.');
  const cents = total.mul(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const raw = weights.map((w) => cents.mul(w).div(sum));
  const floors = raw.map((r) => r.floor());
  let left = cents.sub(floors.reduce((a, f) => a.add(f), ZERO)).toNumber();
  const order = raw.map((r, i) => ({ i, frac: r.sub(floors[i]) })).sort((a, b) => b.frac.cmp(a.frac) || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] = floors[i].add(1);
    left--;
  }
  return floors.map((f) => f.div(100));
}

/**
 * Gecikme tazminatı (KMK md. 20): ödenmeyen tutar için aylık oran (varsayılan %5), gün bazında orantılanır.
 * Kayıt altına alınmaz; her görüntülemede güncel tarihe göre hesaplanır.
 */
export function lateFee(remaining: Money, dueDate: Date, now = new Date(), monthlyRatePct = 5): Money {
  if (remaining.lte(0) || dueDate >= now) return ZERO;
  const days = Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000);
  if (days <= 0) return ZERO;
  return round2(remaining.mul(monthlyRatePct).div(100).mul(days).div(30));
}
