'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { mockPayments } from '@/lib/mock-data';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Search, ArrowLeft, CreditCard, Landmark, Banknote, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4 text-indigo-500" />;
      case 'bank_transfer':
        return <Landmark className="h-4 w-4 text-blue-500" />;
      case 'cash':
        return <Banknote className="h-4 w-4 text-emerald-500" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      credit_card: 'Kredi Kartı',
      bank_transfer: 'Banka Havalesi',
      cash: 'Nakit',
      check: 'Çek',
    };
    return labels[method] || method;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Tamamlandı',
      pending: 'Beklemede',
      failed: 'Başarısız',
      refunded: 'İade Edildi',
    };
    return labels[status] || status;
  };

  const filteredPayments = useMemo(() => {
    return mockPayments.filter((p) => {
      const matchesSearch =
        p.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod = methodFilter === 'all' || p.method === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [searchTerm, methodFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/finance"
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Finansal Yönetime Dön
        </Link>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Ödeme Geçmişi
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Site sakinleri tarafından yapılan kredi kartı, havale ve nakit ödemelerin detayları
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Daire no, sakin ismi veya işlem no ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Tüm Yöntemler</option>
            <option value="credit_card">Kredi Kartı</option>
            <option value="bank_transfer">Banka Havalesi</option>
            <option value="cash">Nakit</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-4">İşlem No</th>
                <th className="p-4">Daire</th>
                <th className="p-4">Ödeyen Sakin</th>
                <th className="p-4">Tutar</th>
                <th className="p-4">Yöntem</th>
                <th className="p-4">Tarih</th>
                <th className="p-4 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-sm">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                    Ödeme kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr 
                    key={payment.id} 
                    className="group transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/20"
                  >
                    <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">
                      {payment.id}
                    </td>
                    <td className="p-4 font-semibold text-[var(--text-primary)]">
                      {payment.unitNumber}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">
                      {payment.ownerName}
                    </td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {getMethodIcon(payment.method)}
                        <span className="text-[var(--text-secondary)]">{getMethodLabel(payment.method)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-[var(--text-secondary)]">
                      {formatDate(payment.paidAt)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
