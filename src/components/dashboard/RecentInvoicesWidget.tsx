'use client';

import React from 'react';
import Link from 'next/link';
import { mockInvoices } from '@/lib/mock-data';
import { formatCurrency, formatPeriod, getStatusColor } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export function RecentInvoicesWidget() {
  // Take last 5 invoices
  const invoices = mockInvoices.slice(0, 5);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Ödendi',
      sent: 'Gönderildi',
      draft: 'Taslak',
      partial: 'Kısmi',
      overdue: 'Gecikmiş',
      cancelled: 'İptal',
    };
    return labels[status] || status;
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <th className="pb-3 pt-1">Daire</th>
              <th className="pb-3 pt-1">Dönem</th>
              <th className="pb-3 pt-1">Tutar</th>
              <th className="pb-3 pt-1 text-right">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {invoices.map((invoice) => (
              <tr 
                key={invoice.id} 
                className="group text-sm transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/30"
              >
                <td className="py-3.5 font-medium text-[var(--text-primary)]">
                  {invoice.unitNumber}
                </td>
                <td className="py-3.5 text-[var(--text-secondary)]">
                  {formatPeriod(invoice.period)}
                </td>
                <td className="py-3.5 font-semibold text-[var(--text-primary)]">
                  {formatCurrency(invoice.totalAmount)}
                </td>
                <td className="py-3.5 text-right">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <Link 
          href="/finance/invoices" 
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          Tüm Faturaları Gör
          <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
