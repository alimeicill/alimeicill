'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency, formatPeriod } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export interface RecentPayment {
  id: string;
  unitNumber: string;
  label: string;
  amount: number;
  paidAt: string;
  method: string;
}

const METHOD: Record<string, string> = { CASH: 'Nakit', BANK_TRANSFER: 'Havale', CREDIT_CARD: 'Kart', QR: 'QR', AUTO_PAYMENT: 'Otomatik' };

/** Son kaydedilen tahsilatlar (veritabanından). */
export function RecentInvoicesWidget({ payments }: { payments: RecentPayment[] }) {
  const label = (l: string) => {
    const m = /^(\d{4}-\d{2}) (.*)$/.exec(l);
    return m ? `${formatPeriod(m[1])} ${m[2]}` : l;
  };

  return (
    <div className="w-full">
      {payments.length === 0 ? (
        <p className="py-8 text-center text-xs text-[var(--text-tertiary)]">Henüz tahsilat kaydı yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                <th className="pb-3 pt-1">Daire</th>
                <th className="pb-3 pt-1">Açıklama</th>
                <th className="pb-3 pt-1 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {payments.map((p) => (
                <tr key={p.id} className="text-sm transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/30">
                  <td className="py-3 font-medium text-[var(--text-primary)]">{p.unitNumber}</td>
                  <td className="py-3 text-[var(--text-secondary)]">
                    <span className="block">{label(p.label)}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {new Date(p.paidAt).toLocaleDateString('tr-TR')} · {METHOD[p.method] ?? p.method}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <Link href="/yonetici/aidat" className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150">
          Aidat ve tahsilatlar
          <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
