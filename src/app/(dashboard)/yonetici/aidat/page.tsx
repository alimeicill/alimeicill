'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { mockInvoices, mockUnits } from '@/lib/mock-data';
import { formatCurrency, formatPeriod, getStatusColor, formatDate } from '@/lib/utils';
import { Search, Plus, Filter, ArrowLeft, Calendar, FileText, X, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<typeof mockInvoices>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  useEffect(() => {
    const saved = localStorage.getItem('invoices_list');
    if (saved) {
      setInvoices(JSON.parse(saved));
    } else {
      localStorage.setItem('invoices_list', JSON.stringify(mockInvoices));
      setInvoices(mockInvoices);
    }
  }, []);

  const saveInvoices = (newInvs: typeof mockInvoices) => {
    setInvoices(newInvs);
    localStorage.setItem('invoices_list', JSON.stringify(newInvs));
    window.dispatchEvent(new Event('storage'));
  };

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState('all');
  const [period, setPeriod] = useState('2026-07');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-07-15');
  const [description, setDescription] = useState('Aidat');

  // Advanced calculation method states
  const [calcMethod, setCalcMethod] = useState<'fixed' | 'equal' | 'area' | 'share'>('fixed');

  // Helper to calculate dynamic late interest (daily interest based on 5% monthly rate)
  const calculateLateInterest = (inv: typeof mockInvoices[0]) => {
    const remaining = inv.totalAmount - inv.paidAmount;
    if (remaining <= 0 || inv.status === 'paid' || inv.status === 'cancelled') return 0;
    
    const dueTime = new Date(inv.dueDate).getTime();
    const nowTime = new Date().getTime();
    if (nowTime <= dueTime) return 0;

    const daysOverdue = Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24));
    if (daysOverdue <= 0) return 0;

    const monthlyInterestRate = 0.05; // 5% per month
    const dailyInterestRate = monthlyInterestRate / 30; // 0.167% daily
    
    // Round to 2 decimals
    return Math.round(remaining * dailyInterestRate * daysOverdue * 100) / 100;
  };

  // Unique periods for filter
  const periods = useMemo(() => {
    const allPeriods = invoices.map((inv) => inv.period);
    return Array.from(new Set(allPeriods)).sort().reverse();
  }, [invoices]);

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
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesPeriod = periodFilter === 'all' || invoice.period === periodFilter;

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [invoices, searchTerm, statusFilter, periodFilter]);

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Lütfen geçerli bir tutar giriniz.');
      return;
    }
    if (!period) {
      toast.error('Lütfen dönem seçiniz.');
      return;
    }

    if (selectedUnitId === 'all') {
      let totalShares = mockUnits.reduce((sum, u) => sum + (u.ownershipShare || 0), 0) || 100;
      
      const newInvoices = mockUnits.map((unit, index) => {
        let calculatedAmount = Number(amount);
        
        if (calcMethod === 'equal') {
          calculatedAmount = Number(amount) / mockUnits.length;
        } else if (calcMethod === 'area') {
          calculatedAmount = Number(amount) * (unit.areaSqm || 100);
        } else if (calcMethod === 'share') {
          calculatedAmount = (Number(amount) * (unit.ownershipShare || 5)) / totalShares;
        }

        // Round to 2 decimals
        calculatedAmount = Math.round(calculatedAmount * 100) / 100;

        return {
          id: `inv-${Date.now()}-${index}`,
          tenantId: 'tenant-001',
          unitId: unit.id,
          unitNumber: unit.number,
          ownerName: unit.tenantName || unit.ownerName || 'Bilinmeyen Sakin',
          period,
          totalAmount: calculatedAmount,
          paidAmount: 0,
          status: 'sent' as const,
          dueDate,
          createdAt: new Date().toISOString(),
          items: [
            {
              id: `ii-${Math.random().toString(36).substring(7)}`,
              description: `${description} (${calcMethod === 'equal' ? 'Eşit Dağıtılan' : calcMethod === 'area' ? 'm² Bazlı' : calcMethod === 'share' ? 'Arsa Paylı' : 'Sabit'})`,
              amount: calculatedAmount,
              type: 'charge' as const
            }
          ]
        };
      });

      saveInvoices([...newInvoices, ...invoices]);
      toast.success(`${newInvoices.length} daire için ${calcMethod === 'equal' ? 'Eşit Dağıtımlı' : calcMethod === 'area' ? 'm² Bazlı' : calcMethod === 'share' ? 'Arsa Payı Bazlı' : 'Toplu'} ${description} tahakkuku oluşturuldu.`);
    } else {
      const unit = mockUnits.find(u => u.id === selectedUnitId);
      if (!unit) return;

      const calculatedAmount = Math.round(Number(amount) * 100) / 100;

      const newInvoice = {
        id: `inv-${Date.now()}`,
        tenantId: 'tenant-001',
        unitId: selectedUnitId,
        unitNumber: unit.number,
        ownerName: unit.tenantName || unit.ownerName || 'Bilinmeyen Sakin',
        period,
        totalAmount: calculatedAmount,
        paidAmount: 0,
        status: 'sent' as const,
        dueDate,
        createdAt: new Date().toISOString(),
        items: [
          {
            id: `ii-${Math.random().toString(36).substring(7)}`,
            description,
            amount: calculatedAmount,
            type: 'charge' as const
          }
        ]
      };

      saveInvoices([newInvoice, ...invoices]);
      toast.success(`${unit.number} dairesi için ${formatCurrency(calculatedAmount)} tutarında ${description} oluşturuldu.`);
    }
    setIsAddModalOpen(false);
    setAmount('');
    setSelectedUnitId('all');
  };

  const handleExportData = () => {
    toast.success('Aidat ve Borç raporu Excel (CSV) dosyası olarak indiriliyor...');
    const headerRow = 'Belge No,Daire,Sakin,Dönem,Tutar,Ödenen,Kalan,Gecikme Faizi,Toplam Bakiye,Son Ödeme,Durum\n';
    const csvContent = invoices.map(inv => {
      const remaining = inv.totalAmount - inv.paidAmount;
      const interest = calculateLateInterest(inv);
      return `"${inv.id}","${inv.unitNumber}","${inv.ownerName}","${inv.period}",${inv.totalAmount},${inv.paidAmount},${remaining},${interest},${remaining + interest},"${inv.dueDate}","${inv.status}"`;
    }).join('\n');
    
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(headerRow + csvContent)}`;
    link.download = `aidat_borc_listesi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back to Finance and Header */}
      <div className="space-y-4">
        <Link
          href="/yonetici/dashboard"
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Finansal Yönetime Dön
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Aidat & Borç
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Aidat, elektrik, su ve ortak alan borçlarının listesi ve takibi
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportData}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition-all"
            >
              <Download className="mr-2 h-4 w-4" />
              Excel Aktar
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Aidat / Borç
            </button>
          </div>
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
            placeholder="Daire no, sakin ismi veya işlem no ile ara..."
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
                <th className="p-4">İşlem No</th>
                <th className="p-4">Daire</th>
                <th className="p-4">Sakin</th>
                <th className="p-4">Dönem</th>
                <th className="p-4">Tutar</th>
                <th className="p-4">Ödenen</th>
                <th className="p-4">Kalan</th>
                <th className="p-4">Gecikme Faizi (%5)</th>
                <th className="p-4">Toplam Bakiye</th>
                <th className="p-4">Son Ödeme</th>
                <th className="p-4 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                    Kriterlere uygun aidat/borç kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const remaining = invoice.totalAmount - invoice.paidAmount;
                  const interest = calculateLateInterest(invoice);
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
                      <td className="p-4 text-xs font-semibold text-rose-500 font-mono">
                        {interest > 0 ? `+${formatCurrency(interest)}` : '₺0,00'}
                      </td>
                      <td className="p-4 font-bold text-[var(--text-primary)] font-mono">
                        {formatCurrency(remaining + interest)}
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
              Kriterlere uygun aidat/borç kaydı bulunamadı.
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

      {/* Add Dues Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsAddModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Yeni Aidat / Borç Tahakkuku
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleAddInvoice} className="p-6 space-y-4">
              {/* Daire Seçimi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Daire Seçimi</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Tüm Daireler (Toplu Aidat)</option>
                  {mockUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.number} - {unit.tenantName || unit.ownerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Borç Tipi / Açıklama */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Açıklama / Tip</label>
                <select
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Aidat">Aidat</option>
                  <option value="Ortak Alan Gideri">Ortak Alan Gideri</option>
                  <option value="Elektrik Payı">Elektrik Payı</option>
                  <option value="Su Payı">Su Payı</option>
                  <option value="Demirbaş Katılım">Demirbaş Katılım</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              {/* Borçlandırma Yöntemi (Sadece toplu borçlandırmada aktif) */}
              {selectedUnitId === 'all' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Borçlandırma Yöntemi</label>
                  <select
                    value={calcMethod}
                    onChange={(e) => setCalcMethod(e.target.value as any)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="fixed">Sabit Tutar (Daire Başı Sabit)</option>
                    <option value="equal">Eşit Dağıtım (Toplam Tutar / Daire)</option>
                    <option value="area">m² Bazlı Dağıtım (Birim Fiyat * m²)</option>
                    <option value="share">Arsa Payı Bazlı (Toplam Tutar * Arsa Payı Raporu)</option>
                  </select>
                </div>
              )}

              {/* Tutar & Dönem */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    {selectedUnitId === 'all' 
                      ? (calcMethod === 'fixed' ? 'Daire Başı Tutar (TL)' : calcMethod === 'area' ? 'm² Birim Fiyat (TL)' : 'Dağıtılacak Toplam (TL)')
                      : 'Tutar (TL)'
                    }
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="2000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Dönem</label>
                  <input
                    type="text"
                    required
                    placeholder="2026-07"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Son Ödeme Tarihi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Son Ödeme Tarihi</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700"
                >
                  Tahakkuk Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
