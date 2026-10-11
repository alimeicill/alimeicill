'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Unit } from '@/types';
import { formatCurrency, formatPeriod, getStatusColor, formatDate } from '@/lib/utils';
import { Search, Plus, Filter, ArrowLeft, Calendar, FileText, X, Download, Wallet, Ban } from 'lucide-react';
import { toast } from 'sonner';

// Sunucudan gelen borç kaydı (gecikme tazminatı sunucuda hesaplanır).
type InvoiceRow = {
  id: string;
  unitId: string;
  unitNumber: string;
  blockName: string;
  ownerName: string;
  period: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  lateFee: number;
  status: 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'İşlem tamamlanamadı.');
  return data as T;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading, error: loadError } = useQuery<InvoiceRow[]>({
    queryKey: ['invoices', 'manager'],
    queryFn: () => apiJson<InvoiceRow[]>('/api/yonetici/aidat'),
  });
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['units', 'manager'],
    queryFn: () => apiJson<Unit[]>('/api/yonetici/daireler'),
  });
  const refreshInvoices = () => queryClient.invalidateQueries({ queryKey: ['invoices'] });
  const [saving, setSaving] = useState(false);

  // Tahsilat penceresi
  const [payTarget, setPayTarget] = useState<InvoiceRow | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD'>('BANK_TRANSFER');
  const [payDate, setPayDate] = useState(today());
  const [payNotes, setPayNotes] = useState('');

  const openPayment = (inv: InvoiceRow) => {
    setPayTarget(inv);
    setPayAmount(String(inv.remainingAmount));
    setPayMethod('BANK_TRANSFER');
    setPayDate(today());
    setPayNotes('');
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;
    setSaving(true);
    try {
      await apiJson(`/api/yonetici/aidat/${payTarget.id}/odeme`, {
        method: 'POST',
        body: JSON.stringify({ amount: payAmount.replace(',', '.'), method: payMethod, paidAt: payDate, notes: payNotes }),
      });
      await refreshInvoices();
      toast.success(`Daire ${payTarget.unitNumber} için ${formatCurrency(Number(payAmount.replace(',', '.')))} tahsilat kaydedildi.`);
      setPayTarget(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (inv: InvoiceRow) => {
    if (!window.confirm(`Daire ${inv.unitNumber} - ${formatPeriod(inv.period)} ${inv.description} borcu iptal edilsin mi?`)) return;
    try {
      await apiJson(`/api/yonetici/aidat/${inv.id}`, { method: 'DELETE' });
      await refreshInvoices();
      toast.success('Borç iptal edildi.');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');


  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState('all');
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => `${new Date().toISOString().slice(0, 7)}-15`);
  const [description, setDescription] = useState('Aidat');

  // Advanced calculation method states
  const [calcMethod, setCalcMethod] = useState<'fixed' | 'equal' | 'area' | 'share'>('fixed');

  // Gecikme tazminatı (KMK md. 20, aylık %5) sunucuda güncel tarihe göre hesaplanır.
  const calculateLateInterest = (inv: InvoiceRow) => inv.lateFee;

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

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount.replace(',', '.')) <= 0) {
      toast.error('Lütfen geçerli bir tutar giriniz.');
      return;
    }
    if (!period) {
      toast.error('Lütfen dönem seçiniz.');
      return;
    }

    setSaving(true);
    try {
      const result = await apiJson<{ created: number; skipped: number; total: number }>('/api/yonetici/aidat', {
        method: 'POST',
        body: JSON.stringify({
          unitId: selectedUnitId,
          period,
          amount: amount.replace(',', '.'),
          dueDate,
          description,
          method: selectedUnitId === 'all' ? calcMethod : 'fixed',
        }),
      });
      await refreshInvoices();
      if (result.created === 0) {
        toast.warning(`Yeni borç yazılmadı: seçilen dairelerde ${formatPeriod(period)} dönemi için "${description}" zaten tahakkuk etmiş.`);
      } else {
        toast.success(
          `${result.created} daire için toplam ${formatCurrency(result.total)} ${description} tahakkuku oluşturuldu.` +
            (result.skipped ? ` ${result.skipped} dairede bu dönem zaten borçlandırıldığı için atlandı.` : ''),
        );
      }
    } catch (err) {
      toast.error((err as Error).message);
      return;
    } finally {
      setSaving(false);
    }
    setIsAddModalOpen(false);
    setAmount('');
    setSelectedUnitId('all');
  };

  const handleExportData = () => {
    toast.success('Aidat ve Borç raporu Excel (CSV) dosyası olarak indiriliyor...');
    const headerRow = 'Belge No,Daire,Sakin,Dönem,Tutar,Ödenen,Kalan,Gecikme Faizi,Toplam Bakiye,Son Ödeme,Durum\n';
    const csvContent = invoices.map(inv => {
      const remaining = inv.remainingAmount;
      const interest = calculateLateInterest(inv);
      return `"${inv.id}","${inv.unitNumber}","${inv.ownerName}","${inv.period}",${inv.totalAmount},${inv.paidAmount},${remaining},${interest},${Math.round((remaining + interest) * 100) / 100},"${inv.dueDate}","${inv.status}"`;
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
                <th className="p-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                    {isLoading ? 'Borç kayıtları yükleniyor…' : loadError ? `Borç kayıtları yüklenemedi: ${(loadError as Error).message}` : 'Kriterlere uygun aidat/borç kaydı bulunamadı.'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const remaining = invoice.remainingAmount;
                  const interest = calculateLateInterest(invoice);
                  return (
                    <tr 
                      key={invoice.id} 
                      className="group transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/20"
                    >
                      <td className="p-4 font-mono text-xs text-[var(--text-secondary)]" title={invoice.id}>
                        {invoice.id.slice(-8).toUpperCase()}
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
                      <td className="p-4 text-right whitespace-nowrap">
                        <RowActions invoice={invoice} onPay={openPayment} onCancel={handleCancel} />
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
              const remaining = invoice.remainingAmount;
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
                  <div className="flex justify-end pt-1">
                    <RowActions invoice={invoice} onPay={openPayment} onCancel={handleCancel} />
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
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.number} - {unit.tenantName || unit.ownerName || 'Sakin yok'}
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
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Oluşturuluyor…' : 'Tahakkuk Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPayTarget(null)} />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Tahsilat Kaydı</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Daire {payTarget.unitNumber} · {payTarget.ownerName} · {formatPeriod(payTarget.period)} {payTarget.description}
                </p>
              </div>
              <button onClick={() => setPayTarget(null)} aria-label="Kapat" className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePayment} className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[var(--bg-primary)] p-3 text-xs">
                <div>
                  <div className="text-[var(--text-tertiary)]">Kalan borç</div>
                  <div className="font-bold text-rose-600">{formatCurrency(payTarget.remainingAmount)}</div>
                </div>
                <div>
                  <div className="text-[var(--text-tertiary)]">Gecikme tazminatı</div>
                  <div className="font-bold text-[var(--text-primary)]">{formatCurrency(payTarget.lateFee)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="pay-amount" className="text-xs font-semibold text-[var(--text-secondary)]">Tutar (₺)</label>
                  <input id="pay-amount" required inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="pay-date" className="text-xs font-semibold text-[var(--text-secondary)]">Ödeme tarihi</label>
                  <input id="pay-date" type="date" required max={today()} value={payDate} onChange={(e) => setPayDate(e.target.value)} className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="pay-method" className="text-xs font-semibold text-[var(--text-secondary)]">Ödeme yöntemi</label>
                <select id="pay-method" value={payMethod} onChange={(e) => setPayMethod(e.target.value as typeof payMethod)} className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none">
                  <option value="BANK_TRANSFER">Havale / EFT</option>
                  <option value="CASH">Nakit</option>
                  <option value="CREDIT_CARD">Kredi kartı (POS)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="pay-notes" className="text-xs font-semibold text-[var(--text-secondary)]">Not (isteğe bağlı)</label>
                <input id="pay-notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Örn: dekont no" className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none" />
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">Tahsilat kalan borcu aşamaz. Gecikme tazminatı ayrıca tahakkuk ettirilmelidir.</p>
              <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-3">
                <button type="button" onClick={() => setPayTarget(null)} className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">Vazgeç</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60">
                  {saving ? 'Kaydediliyor…' : 'Tahsilatı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RowActions({ invoice, onPay, onCancel }: { invoice: InvoiceRow; onPay: (i: InvoiceRow) => void; onCancel: (i: InvoiceRow) => void }) {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return <span className="text-xs text-[var(--text-tertiary)]">—</span>;
  return (
    <div className="inline-flex gap-1.5">
      <button onClick={() => onPay(invoice)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors">
        <Wallet className="h-3.5 w-3.5" /> Tahsilat
      </button>
      {invoice.paidAmount === 0 && (
        <button onClick={() => onCancel(invoice)} title="Borcu iptal et" aria-label="Borcu iptal et" className="inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors">
          <Ban className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
