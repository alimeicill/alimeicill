'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { mockInvoices } from '@/lib/mock-data';
import { formatCurrency, formatPeriod, getStatusColor, formatDate } from '@/lib/utils';
import { Search, Plus, Filter, ArrowLeft, Calendar, FileText } from 'lucide-react';

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  // Unique periods for filter
  const periods = useMemo(() => {
    const allPeriods = mockInvoices.map((inv) => inv.period);
    return Array.from(new Set(allPeriods)).sort().reverse();
  }, []);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Ödendi',
      sent: 'Gönderildi',
      draft: 'Taslak',
      partial: 'Kısmi Ödeme',
      overdue: 'Gecikmiş',
      cancelled: 'İptal',
    };
    return labels[status] || status;
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter((invoice) => {
      const matchesSearch =
        invoice.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesPeriod = periodFilter === 'all' || invoice.period === periodFilter;

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [searchTerm, statusFilter, periodFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back to Finance and Header */}
      <div className="space-y-4">
        <Link
          href="/finance"
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Finansal Yönetime Dön
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Faturalar
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Aidat, elektrik, su ve ortak alan faturalarının listesi ve takibi
            </p>
          </div>
          
          <button
            onClick={() => alert('Yeni fatura ekleme özelliği yakında eklenecektir.')}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Fatura
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Daire no, sakin ismi veya fatura no ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="paid">Ödenenler</option>
              <option value="sent">Gönderilenler</option>
              <option value="partial">Kısmi Ödenenler</option>
              <option value="overdue">Gecikmişler</option>
              <option value="draft">Taslaklar</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-[var(--text-secondary)]" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">Tüm Dönemler</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {formatPeriod(p)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Table - Desktop & List - Mobile */}
      <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-md">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-4">Fatura No</th>
                <th className="p-4">Daire</th>
                <th className="p-4">Sakin</th>
                <th className="p-4">Dönem</th>
                <th className="p-4">Tutar</th>
                <th className="p-4">Ödenen</th>
                <th className="p-4">Kalan</th>
                <th className="p-4">Son Ödeme</th>
                <th className="p-4 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                    Kriterlere uygun fatura bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const remaining = invoice.totalAmount - invoice.paidAmount;
                  return (
                    <tr 
                      key={invoice.id} 
                      className="group transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/20"
                    >
                      <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">
                        {invoice.id}
                      </td>
                      <td className="p-4 font-semibold text-[var(--text-primary)]">
                        {invoice.unitNumber}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        {invoice.ownerName}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        {formatPeriod(invoice.period)}
                      </td>
                      <td className="p-4 font-bold text-[var(--text-primary)]">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(invoice.paidAmount)}
                      </td>
                      <td className={`p-4 font-semibold ${remaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-secondary)]'}`}>
                        {formatCurrency(remaining)}
                      </td>
                      <td className="p-4 text-xs text-[var(--text-secondary)]">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-[var(--border-color)] p-4 space-y-4">
          {filteredInvoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              Kriterlere uygun fatura bulunamadı.
            </div>
          ) : (
            filteredInvoices.map((invoice) => {
              const remaining = invoice.totalAmount - invoice.paidAmount;
              return (
                <div key={invoice.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)]">
                      Daire {invoice.unitNumber}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>{invoice.ownerName}</span>
                    <span>{formatPeriod(invoice.period)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[var(--text-tertiary)]">Toplam / Kalan:</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {formatCurrency(invoice.totalAmount)} / <span className={remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}>{formatCurrency(remaining)}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
