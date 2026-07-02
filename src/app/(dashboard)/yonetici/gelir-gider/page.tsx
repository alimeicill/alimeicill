'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Search, 
  X, 
  Download, 
  Printer, 
  FileText, 
  ArrowRight,
  Wallet,
  Landmark,
  Building
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentAccount {
  id: string;
  name: string;
  type: 'KASA' | 'BANKA';
  balance: number;
}

interface FinancialTransaction {
  id: string;
  accountId: string;
  type: 'TAHSILAT' | 'HARICI_TAHSILAT' | 'GIDER_ODEME' | 'FIRMA_PERSONEL_ODEME' | 'VIRMAN_GIRIS' | 'VIRMAN_CIKIS';
  amount: number;
  direction: 'giris' | 'cikis';
  description: string;
  transactionDate: string;
  category?: string; // Aidat, Kira, Fatura, Bakım, Temizlik, Personel vb.
}

export default function GelirGiderPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  
  // Tab State: 'all' | 'gelir' | 'gider' | 'reports'
  const [activeTab, setActiveTab] = useState<'all' | 'gelir' | 'gider' | 'reports'>('all');
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'gelir' | 'gider'>('gelir');

  // Add Form States
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Aidat');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all'); // all, today, week, month

  // Load from localStorage
  const loadData = () => {
    const savedTxs = localStorage.getItem('site_account_transactions');
    const savedAccs = localStorage.getItem('site_payment_accounts');

    if (savedTxs && savedAccs) {
      setTransactions(JSON.parse(savedTxs));
      setAccounts(JSON.parse(savedAccs));
    } else {
      // Default Seed Data
      const defaultAccounts: PaymentAccount[] = [
        { id: 'acc-1', name: 'Merkez Yönetim Kasası', type: 'KASA', balance: 4500 },
        { id: 'acc-2', name: 'Garanti Bankası Aidat Hesabı', type: 'BANKA', balance: 34500 },
        { id: 'acc-3', name: 'Vakıfbank Rezerv Fonu', type: 'BANKA', balance: 75000 }
      ];

      const defaultTransactions: FinancialTransaction[] = [
        { id: 'tx-1', accountId: 'acc-2', type: 'TAHSILAT', amount: 1500, direction: 'giris', description: 'A-101 Ahmet Yılmaz Haziran Aidatı', transactionDate: '2026-06-25T10:00:00.000Z', category: 'Aidat' },
        { id: 'tx-2', accountId: 'acc-2', type: 'TAHSILAT', amount: 1800, direction: 'giris', description: 'A-102 Fatma Kaya Haziran Aidatı', transactionDate: '2026-06-25T11:30:00.000Z', category: 'Aidat' },
        { id: 'tx-3', accountId: 'acc-1', type: 'TAHSILAT', amount: 1600, direction: 'giris', description: 'B-101 Ali Yıldırım Elden Nakit Aidat', transactionDate: '2026-06-26T14:00:00.000Z', category: 'Aidat' },
        { id: 'tx-4', accountId: 'acc-2', type: 'GIDER_ODEME', amount: 2400, direction: 'cikis', description: 'Asansör Periyodik Bakım Ödemesi - A Blok', transactionDate: '2026-06-27T09:00:00.000Z', category: 'Bakım & Onarım' },
        { id: 'tx-5', accountId: 'acc-2', type: 'VIRMAN_CIKIS', amount: 10000, direction: 'cikis', description: 'Yedek akçe hesabına transfer', transactionDate: '2026-06-28T15:00:00.000Z', category: 'Virman' },
        { id: 'tx-6', accountId: 'acc-3', type: 'VIRMAN_GIRIS', amount: 10000, direction: 'giris', description: 'Yedek akçe hesabına transfer', transactionDate: '2026-06-28T15:00:00.000Z', category: 'Virman' }
      ];

      localStorage.setItem('site_payment_accounts', JSON.stringify(defaultAccounts));
      localStorage.setItem('site_account_transactions', JSON.stringify(defaultTransactions));
      setAccounts(defaultAccounts);
      setTransactions(defaultTransactions);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const saveState = (newAccs: PaymentAccount[], newTxs: FinancialTransaction[]) => {
    setAccounts(newAccs);
    setTransactions(newTxs);
    localStorage.setItem('site_payment_accounts', JSON.stringify(newAccs));
    localStorage.setItem('site_account_transactions', JSON.stringify(newTxs));
    window.dispatchEvent(new Event('storage')); // Notify other pages
  };

  // Categories lists
  const incomeCategories = ['Aidat', 'Kira Geliri', 'Reklam Geliri', 'Faiz Geliri', 'Dış Katkı', 'Diğer Gelir'];
  const expenseCategories = ['Elektrik Faturası', 'Su Faturası', 'Ortak Alan Temizlik', 'Güvenlik Gideri', 'Bakım & Onarım', 'Personel Maaşı', 'Hukuk / İcra Masrafı', 'Diğer Gider'];

  // Financial Stats
  const stats = useMemo(() => {
    // Filter out Virman transfers from income/expense totals
    const standardTxs = transactions.filter(t => t.type !== 'VIRMAN_GIRIS' && t.type !== 'VIRMAN_CIKIS');
    
    const income = standardTxs
      .filter(t => t.direction === 'giris')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = standardTxs
      .filter(t => t.direction === 'cikis')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    return { income, expense, balance };
  }, [transactions]);

  // Unique categories for filter
  const allCategories = useMemo(() => {
    const cats = transactions.map(t => t.category || 'Belirtilmemiş').filter(Boolean);
    return Array.from(new Set(cats));
  }, [transactions]);

  // Handle Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(amount);
    if (!amount || amountVal <= 0 || !selectedAccountId) {
      toast.error('Lütfen geçerli bir tutar ve ödeme hesabı seçiniz.');
      return;
    }

    const selectedAcc = accounts.find(a => a.id === selectedAccountId);
    if (!selectedAcc) return;

    const direction = addMode === 'gelir' ? 'giris' : 'cikis';
    const txType = addMode === 'gelir' 
      ? (category === 'Aidat' ? 'TAHSILAT' : 'HARICI_TAHSILAT') 
      : (category === 'Personel Maaşı' ? 'FIRMA_PERSONEL_ODEME' : 'GIDER_ODEME');

    // Confirm overdraft
    if (direction === 'cikis' && selectedAcc.balance < amountVal) {
      if (!window.confirm(`UYARI: Yetersiz Bakiye! Seçilen hesaptan çıkış bakiyeyi eksiye düşürecektir. Devam etmek istiyor musunuz?`)) {
        return;
      }
    }

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      accountId: selectedAccountId,
      type: txType as any,
      amount: amountVal,
      direction,
      description: description.trim() || `${category} Kaydı`,
      transactionDate: new Date(date).toISOString(),
      category
    };

    // Update chosen account balance
    const updatedAccounts = accounts.map(a => {
      if (a.id === selectedAccountId) {
        return {
          ...a,
          balance: direction === 'giris' ? a.balance + amountVal : a.balance - amountVal
        };
      }
      return a;
    });

    saveState(updatedAccounts, [newTx, ...transactions]);
    toast.success(`${addMode === 'gelir' ? 'Gelir' : 'Gider'} kaydı başarıyla eklendi.`);

    // Reset Form
    setAmount('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Tab filter
      if (activeTab === 'gelir' && t.direction !== 'giris') return false;
      if (activeTab === 'gider' && t.direction !== 'cikis') return false;
      
      // Search filter
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.amount.toString().includes(searchTerm);

      // Category filter
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

      // Period filter
      let matchesPeriod = true;
      if (periodFilter !== 'all') {
        const txTime = new Date(t.transactionDate).getTime();
        const now = Date.now();
        if (periodFilter === 'today') {
          matchesPeriod = (now - txTime) <= 24 * 60 * 60 * 1000;
        } else if (periodFilter === 'week') {
          matchesPeriod = (now - txTime) <= 7 * 24 * 60 * 60 * 1000;
        } else if (periodFilter === 'month') {
          matchesPeriod = (now - txTime) <= 30 * 24 * 60 * 60 * 1000;
        }
      }

      return matchesSearch && matchesCategory && matchesPeriod;
    });
  }, [transactions, activeTab, searchTerm, categoryFilter, periodFilter]);

  const getAccountName = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.name : 'Bilinmeyen Hesap';
  };

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen pb-12">
      {/* Header */}
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
              Gelir & Gider Tablosu
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Apartman gelir ve giderlerinin takibi, ödeme hesabı entegrasyonu ve raporlaması
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setAddMode('gider');
                setCategory('Elektrik Faturası');
                setSelectedAccountId(accounts.length > 0 ? accounts[0].id : '');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-sm transition-all"
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              Gider Kaydı Ekle
            </button>

            <button
              onClick={() => {
                setAddMode('gelir');
                setCategory('Aidat');
                setSelectedAccountId(accounts.length > 0 ? accounts[0].id : '');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Gelir Kaydı Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Toplam Gelir (Yıllık)</p>
            <h3 className="text-2xl font-black text-emerald-500 mt-1">
              {formatCurrency(stats.income)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Toplam Gider (Yıllık)</p>
            <h3 className="text-2xl font-black text-rose-500 mt-1">
              {formatCurrency(stats.expense)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Net Kasa / Fark</p>
            <h3 className={`text-2xl font-black mt-1 ${stats.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
              {formatCurrency(stats.balance)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[var(--border-color)] pb-px gap-6">
        {[
          { id: 'all', label: 'Tüm Hareketler' },
          { id: 'gelir', label: 'Yalnızca Gelirler' },
          { id: 'gider', label: 'Yalnızca Giderler' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === tab.id 
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Area */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-secondary)] text-xs">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <input 
            type="text"
            placeholder="Açıklama veya tutar ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-primary)] pl-8 pr-3 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 font-bold text-[var(--text-primary)] focus:outline-none"
          >
            <option value="all">Tüm Kategoriler</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 font-bold text-[var(--text-primary)] focus:outline-none"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="today">Bugün</option>
            <option value="week">Son 7 Gün</option>
            <option value="month">Son 30 Gün</option>
          </select>

          <div className="flex items-center gap-2 border-l border-[var(--border-color)]/60 pl-3">
            <button 
              onClick={() => toast.success('Finansal rapor Excel dosyası indiriliyor...')}
              className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" 
              title="Excel İhracatı"
            >
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={() => window.print()}
              className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" 
              title="Yazdır"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm bg-[var(--bg-secondary)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-4">Tarih</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Açıklama / Detay</th>
                <th className="p-4">Kasa/Banka Hesabı</th>
                <th className="p-4 text-right">Tutar</th>
                <th className="p-4 text-center">Yön</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/40">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-xs text-[var(--text-tertiary)]">
                    Kriterlere uygun finansal kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/10 text-xs">
                    <td className="p-4 text-[var(--text-tertiary)]">
                      {formatDate(t.transactionDate)}
                    </td>
                    <td className="p-4 font-bold text-[var(--text-primary)]">
                      {t.category || (t.direction === 'giris' ? 'Gelir' : 'Gider')}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">
                      {t.description}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">
                      {getAccountName(t.accountId)}
                    </td>
                    <td className={`p-4 text-right font-bold text-sm ${t.direction === 'giris' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.direction === 'giris' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center rounded-lg p-1.5 ${
                        t.direction === 'giris' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                      }`}>
                        {t.direction === 'giris' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD INCOME / EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Yeni {addMode === 'gelir' ? 'Gelir' : 'Gider'} Kaydı Ekle
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 pt-4 text-xs">
              {/* Tutar & Tarih */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Tutar (TL) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">İşlem Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Kategori Seçimi */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Kategori *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  {addMode === 'gelir' 
                    ? incomeCategories.map(c => <option key={c} value={c}>{c}</option>)
                    : expenseCategories.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>

              {/* Ödeme Hesabı Entegrasyonu */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  İşlenecek Ödeme Hesabı *
                </label>
                <select
                  value={selectedAccountId}
                  required
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="">Hesap Seçiniz</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type === 'KASA' ? 'Kasa' : 'Banka'} • Bakiyesi: {formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Açıklama */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Açıklama</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="İşlem açıklamasını yazınız..."
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              {/* Belge Yükleme */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Fatura / Belge Yükle</label>
                <div className="flex items-center justify-center border border-dashed border-[var(--border-color)] rounded-lg p-3 bg-[var(--bg-primary)] text-center text-[10px] text-[var(--text-tertiary)] hover:border-indigo-500 transition-colors cursor-pointer">
                  <span>Sürükleyin veya Seçin (PDF, Görsel)</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--border-color)]/30 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  {addMode === 'gelir' ? 'Gelir Ekle' : 'Gider Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
