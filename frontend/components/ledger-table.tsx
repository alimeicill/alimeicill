'use client';

import { Badge, Table } from './ui';
import { date, money, toNum } from '@/lib/format';
import type { LedgerRow } from '@/lib/types';

/** Daire cari ekstresi tablosu (yönetici ve sakin panelinde ortak). */
export function LedgerTable({ rows, onCancelPayment }: { rows: LedgerRow[]; onCancelPayment?: (id: string) => void }) {
  const totals = rows.reduce(
    (a, r) => ({ debit: a.debit + toNum(r.debit), credit: a.credit + toNum(r.credit), fee: a.fee + toNum(r.lateFee) }),
    { debit: 0, credit: 0, fee: 0 },
  );
  return (
    <Table>
      <thead>
        <tr>
          <th>Tarih</th>
          <th>Son ödeme</th>
          <th>Dönem - işlem</th>
          <th className="!text-right">Borç</th>
          <th className="!text-right">Gecikme</th>
          <th className="!text-right">Ödenen</th>
          <th className="!text-right">Bakiye</th>
          {onCancelPayment && <th />}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const overdue = r.kind === 'CHARGE' && toNum(r.remaining) > 0 && r.dueDate && new Date(r.dueDate) < new Date();
          return (
            <tr key={r.id}>
              <td className="whitespace-nowrap">{date(r.date)}</td>
              <td className="whitespace-nowrap">{r.dueDate ? date(r.dueDate) : ''}</td>
              <td>
                {r.description}{' '}
                {r.kind === 'CHARGE' && toNum(r.remaining) === 0 && <Badge tone="green">Ödendi</Badge>}
                {overdue && <Badge tone="red">Gecikmede</Badge>}
              </td>
              <td className="text-right tabular-nums">{toNum(r.debit) ? money(r.debit) : ''}</td>
              <td className="text-right tabular-nums text-amber-700 dark:text-amber-400">{toNum(r.lateFee) ? money(r.lateFee) : ''}</td>
              <td className="text-right tabular-nums text-emerald-700 dark:text-emerald-400">{toNum(r.credit) ? money(r.credit) : ''}</td>
              <td className="text-right font-medium tabular-nums">{money(r.balance)}</td>
              {onCancelPayment && (
                <td className="text-right">
                  {r.kind === 'PAYMENT' && (
                    <button
                      type="button"
                      className="no-print text-xs text-rose-600 hover:underline"
                      onClick={() => window.confirm('Tahsilat iptal edilsin mi? Kasa hareketi de silinir.') && onCancelPayment(r.id)}
                    >
                      İptal
                    </button>
                  )}
                </td>
              )}
            </tr>
          );
        })}
        <tr className="bg-slate-50 font-semibold dark:bg-slate-900">
          <td colSpan={3}>Toplam</td>
          <td className="text-right tabular-nums">{money(totals.debit)}</td>
          <td className="text-right tabular-nums">{money(totals.fee)}</td>
          <td className="text-right tabular-nums">{money(totals.credit)}</td>
          <td colSpan={onCancelPayment ? 2 : 1} />
        </tr>
      </tbody>
    </Table>
  );
}
