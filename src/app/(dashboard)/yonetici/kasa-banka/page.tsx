'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Landmark, 
  ArrowLeft, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText, 
  ArrowRightLeft, 
  Search, 
  X, 
  Info,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentAccount {
  id: string;
  name: string;
  type: 'KASA' | 'BANKA';
  bankName?: string;
  iban?: string;
  owner?: string;
  balance: number;
}

interface AccountTransaction {
  id: string;
  accountId: string;
  type: 'TAHSILAT' | 'HARICI_TAHSILAT' | 'GIDER_ODEME' | 'FIRMA_PERSONEL_ODEME' | 'VIRMAN_GIRIS' | 'VIRMAN_CIKIS';
  amount: number;
  direction: 'giris' | 'cikis';
  relatedAccountId?: string;
  description: string;
  transactionDate: string;
  documentUrl?: string;
}

export default function KasaBankaPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  
  // Modal States
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedAccountForEkstre, setSelectedAccountForEkstre] = useState<PaymentAccount | null>(null);

  // New Account Form States
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'KASA' | 'BANKA'>('KASA');
  const [newAccBank, setNewAccBank] = useState('');
  const [newAccIban, setNewAccIban] = useState('');
  const [newAccOwner, setNewAccOwner] = useState('Hasan Korkmaz');
  const [newAccInitialBalance, setNewAccInitialBalance] = useState('');

  // New Transaction Form States
  const [txType, setTxType] = useState<string>('TAHSILAT'); // TAHSILAT, HARICI_TAHSILAT, GIDER_ODEME, FIRMA_PERSONEL_ODEME, VIRMAN
  const [txAccountId, setTxAccountId] = useState('');
  const [txTargetAccountId, setTxTargetAccountId] = useState(''); // Only for Virman
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // Ekstre Filter States
  const [ekstreSearch, setEkstreSearch] = useState('');
  const [ekstreTypeFilter, setEkstreTypeFilter] = useState('all');
  const [ekstrePeriodFilter, setEkstrePeriodFilter] = useState('all'); // all, today, week, month

  // Initial Load from localStorage
  useEffect(() => {
    const savedAccounts = localStorage.getItem('site_payment_accounts');
    const savedTransactions = localStorage.getItem('site_account_transactions');

    if (savedAccounts && savedTransactions) {
      setAccounts(JSON.parse(savedAccounts));
      setTransactions(JSON.parse(savedTransactions));
    } else {
      // Default Seed Data
      const defaultAccounts: PaymentAccount[] = [
        { id: 'acc-1', name: 'Merkez Yönetim Kasası', type: 'KASA', owner: 'Hasan Korkmaz', balance: 4500 },
        { id: 'acc-2', name: 'Garanti Bankası Aidat Hesabı', type: 'BANKA', bankName: 'Garanti BBVA', iban: 'TR56 0006 2000 0001 2345 6789 01', owner: 'Yıldız Konakları Site Yönetimi', balance: 34500 },
        { id: 'acc-3', name: 'Vakıfbank Rezerv Fonu', type: 'BANKA', bankName: 'Vakıfbank', iban: 'TR12 0001 5000 0002 9876 5432 10', owner: 'Yıldız Konakları Site Yönetimi', balance: 75000 }
      ];

      const defaultTransactions: AccountTransaction[] = [
        { id: 'tx-1', accountId: 'acc-2', type: 'TAHSILAT', amount: 1500, direction: 'giris', description: 'A-101 Ahmet Yılmaz Haziran Aidatı', transactionDate: '2026-06-25T10:00:00.000Z' },
        { id: 'tx-2', accountId: 'acc-2', type: 'TAHSILAT', amount: 1800, direction: 'giris', description: 'A-102 Fatma Kaya Haziran Aidatı', transactionDate: '2026-06-25T11:30:00.000Z' },
        { id: 'tx-3', accountId: 'acc-1', type: 'TAHSILAT', amount: 1600, direction: 'giris', description: 'B-101 Ali Yıldırım Elden Nakit Aidat', transactionDate: '2026-06-26T14:00:00.000Z' },
        { id: 'tx-4', accountId: 'acc-2', type: 'GIDER_ODEME', amount: 2400, direction: 'cikis', description: 'Asansör Periyodik Bakım Ödemesi - A Blok', transactionDate: '2026-06-27T09:00:00.000Z' },
        { id: 'tx-5', accountId: 'acc-2', type: 'VIRMAN_CIKIS', amount: 10000, direction: 'cikis', relatedAccountId: 'acc-3', description: 'Yedek akçe hesabına transfer', transactionDate: '2026-06-28T15:00:00.000Z' },
        { id: 'tx-6', accountId: 'acc-3', type: 'VIRMAN_GIRIS', amount: 10000, direction: 'giris', relatedAccountId: 'acc-2', description: 'Yedek akçe hesabına transfer', transactionDate: '2026-06-28T15:00:00.000Z' }
      ];

      localStorage.setItem('site_payment_accounts', JSON.stringify(defaultAccounts));
      localStorage.setItem('site_account_transactions', JSON.stringify(defaultTransactions));
      setAccounts(defaultAccounts);
      setTransactions(defaultTransactions);
    }
  }, []);

  const saveState = (newAccs: PaymentAccount[], newTxs: AccountTransaction[]) => {
    setAccounts(newAccs);
    setTransactions(newTxs);
    localStorage.setItem('site_payment_accounts', JSON.stringify(newAccs));
    localStorage.setItem('site_account_transactions', JSON.stringify(newTxs));
    window.dispatchEvent(new Event('storage')); // Notify other widgets/pages
  };

  // Calculations
  const totalAssets = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const totalCash = useMemo(() => {
    return accounts.filter(a => a.type === 'KASA').reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const totalBank = useMemo(() => {
    return accounts.filter(a => a.type === 'BANKA').reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  // Handle Add Account
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      toast.error('Lütfen geçerli bir hesap adı giriniz.');
      return;
    }

    const initialBal = Number(newAccInitialBalance) || 0;

    const newAccount: PaymentAccount = {
      id: `acc-${Date.now()}`,
      name: newAccName.trim(),
      type: newAccType,
      bankName: newAccType === 'BANKA' ? newAccBank.trim() : undefined,
      iban: newAccType === 'BANKA' ? newAccIban.trim() : undefined,
      owner: newAccOwner.trim(),
      balance: initialBal
    };

    const newTransactionList = [...transactions];
    if (initialBal > 0) {
      newTransactionList.push({
        id: `tx-${Date.now()}-init`,
        accountId: newAccount.id,
        type: 'HARICI_TAHSILAT',
        amount: initialBal,
        direction: 'giris',
        description: 'Hesap Açılış Bakiyesi',
        transactionDate: new Date().toISOString()
      });
    }

    saveState([...accounts, newAccount], newTransactionList);
    toast.success(`${newAccount.name} hesabı başarıyla tanımlandı.`);

    // Reset Form & Close
    setNewAccName('');
    setNewAccBank('');
    setNewAccIban('');
    setNewAccInitialBalance('');
    setIsAccountModalOpen(false);
  };

  // Handle Add Transaction
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(txAmount);
    if (!txAccountId || !txAmount || amountVal <= 0) {
      toast.error('Lütfen geçerli bir hesap ve tutar seçiniz.');
      return;
    }

    const sourceAccount = accounts.find(a => a.id === txAccountId);
    if (!sourceAccount) return;

    if (txType === 'VIRMAN') {
      if (!txTargetAccountId) {
        toast.error('Lütfen hedef hesabı seçiniz.');
        return;
      }
      if (txAccountId === txTargetAccountId) {
        toast.error('Kaynak ve hedef hesap aynı olamaz.');
        return;
      }

      // Check balance limit
      if (sourceAccount.balance < amountVal) {
        toast.error(`Yetersiz Bakiye! ${sourceAccount.name} güncel bakiyesi ${formatCurrency(sourceAccount.balance)}'dir.`);
        return;
      }

      const targetAccount = accounts.find(a => a.id === txTargetAccountId);
      if (!targetAccount) return;

      const txDateIso = new Date(txDate).toISOString();

      // Create dual records
      const txOut: AccountTransaction = {
        id: `tx-${Date.now()}-out`,
        accountId: txAccountId,
        type: 'VIRMAN_CIKIS',
        amount: amountVal,
        direction: 'cikis',
        relatedAccountId: txTargetAccountId,
        description: txDescription || 'Virman Çıkış',
        transactionDate: txDateIso
      };

      const txIn: AccountTransaction = {
        id: `tx-${Date.now()}-in`,
        accountId: txTargetAccountId,
        type: 'VIRMAN_GIRIS',
        amount: amountVal,
        direction: 'giris',
        relatedAccountId: txAccountId,
        description: txDescription || 'Virman Giriş',
        transactionDate: txDateIso
      };

      // Update balances
      const updatedAccounts = accounts.map(a => {
        if (a.id === txAccountId) return { ...a, balance: a.balance - amountVal };
        if (a.id === txTargetAccountId) return { ...a, balance: a.balance + amountVal };
        return a;
      });

      saveState(updatedAccounts, [txOut, txIn, ...transactions]);
      toast.success(`${sourceAccount.name} hesabından ${targetAccount.name} hesabına ${formatCurrency(amountVal)} virman gerçekleştirildi.`);
    } else {
      // Normal Single Transaction
      const direction: 'giris' | 'cikis' = (txType === 'TAHSILAT' || txType === 'HARICI_TAHSILAT') ? 'giris' : 'cikis';

      // Check balance limit for outflows
      if (direction === 'cikis' && sourceAccount.balance < amountVal) {
        if (!window.confirm(`UYARI: Yetersiz Bakiye! Hesap bakiyesi eksiye düşecektir. Devam etmek istiyor musunuz?`)) {
          return;
        }
      }

      const newTx: AccountTransaction = {
        id: `tx-${Date.now()}`,
        accountId: txAccountId,
        type: txType as any,
        amount: amountVal,
        direction,
        description: txDescription || (txType === 'TAHSILAT' ? 'Aidat Tahsilatı' : 'Gider Ödemesi'),
        transactionDate: new Date(txDate).toISOString()
      };

      const updatedAccounts = accounts.map(a => {
        if (a.id === txAccountId) {
          return {
            ...a,
            balance: direction === 'giris' ? a.balance + amountVal : a.balance - amountVal
          };
        }
        return a;
      });

      saveState(updatedAccounts, [newTx, ...transactions]);
      toast.success(`İşlem başarıyla kaydedildi.`);
    }

    // Reset Form & Close
    setTxAmount('');
    setTxDescription('');
    setIsTransactionModalOpen(false);
  };

  // Ekstre filtered list & running balance calculations
  const ekstreData = useMemo(() => {
    if (!selectedAccountForEkstre) return [];
    
    // Sort transactions Chronologically to calculate correct running balance!
    const accountTxs = transactions
      .filter(t => t.accountId === selectedAccountForEkstre.id)
      .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

    // Calculate running balance
    let runningBalance = 0;
    const computed = accountTxs.map(t => {
      if (t.direction === 'giris') runningBalance += t.amount;
      else runningBalance -= t.amount;

      return {
        ...t,
        runningBalance
      };
    });

    // Reverse again for display (newest first)
    computed.reverse();

    // Apply filters
    return computed.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(ekstreSearch.toLowerCase()) || t.amount.toString().includes(ekstreSearch);
      
      const matchesType = ekstreTypeFilter === 'all' || 
        (ekstreTypeFilter === 'tahsilat' && (t.type === 'TAHSILAT' || t.type === 'HARICI_TAHSILAT')) ||
        (ekstreTypeFilter === 'odeme' && (t.type === 'GIDER_ODEME' || t.type === 'FIRMA_PERSONEL_ODEME')) ||
        (ekstreTypeFilter === 'virman' && (t.type === 'VIRMAN_GIRIS' || t.type === 'VIRMAN_CIKIS'));

      let matchesPeriod = true;
      if (ekstrePeriodFilter !== 'all') {
        const txTime = new Date(t.transactionDate).getTime();
        const now = Date.now();
        if (ekstrePeriodFilter === 'today') {
          matchesPeriod = (now - txTime) <= 24 * 60 * 60 * 1000;
        } else if (ekstrePeriodFilter === 'week') {
          matchesPeriod = (now - txTime) <= 7 * 24 * 60 * 60 * 1000;
        } else if (ekstrePeriodFilter === 'month') {
          matchesPeriod = (now - txTime) <= 30 * 24 * 60 * 60 * 1000;
        }
      }

      return matchesSearch && matchesType && matchesPeriod;
    });
  }, [selectedAccountForEkstre, transactions, ekstreSearch, ekstreTypeFilter, ekstrePeriodFilter]);

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen pb-12">
      {/* Header and Back Link */}
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
              Kasa & Banka Hesapları
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Site ödeme hesaplarının takibi, kasalar arası virman transferleri ve hesap ekstreleri
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsTransactionModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4 text-indigo-500" />
              İşlem Ekle
            </button>
            
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Hesap Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Asset Summary Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Toplam Varlıklar</p>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(totalAssets)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Kasa Toplamı</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {formatCurrency(totalCash)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Banka Toplamı</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {formatCurrency(totalBank)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Landmark className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Accounts List Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => (
          <div 
            key={acc.id} 
            className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border-color)]/50 pb-3 mb-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  acc.type === 'KASA' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                }`}>
                  {acc.type === 'KASA' ? 'Nakit Kasa' : 'Banka Hesabı'}
                </span>
                
                {acc.type === 'BANKA' && (
                  <span className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase">
                    {acc.bankName}
                  </span>
                )}
              </div>

              <h4 className="font-extrabold text-[var(--text-primary)] text-sm">{acc.name}</h4>
              
              {acc.type === 'BANKA' && acc.iban && (
                <div className="mt-3 bg-[var(--bg-primary)] p-2.5 rounded-lg border border-[var(--border-color)]/65 font-mono text-[10px] text-[var(--text-secondary)] break-all select-all">
                  {acc.iban}
                </div>
              )}

              <div className="mt-3 text-[11px] text-[var(--text-secondary)] space-y-1">
                <span>Yetkili: <strong className="text-[var(--text-primary)]">{acc.owner || 'Belirtilmemiş'}</strong></span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-color)]/50 flex items-center justify-between">
              <div>
                <span className="block text-[9px] text-[var(--text-tertiary)] uppercase font-semibold">Bakiye</span>
                <strong className={`text-lg font-black ${acc.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                  {formatCurrency(acc.balance)}
                </strong>
              </div>

              <button
                onClick={() => setSelectedAccountForEkstre(acc)}
                className="rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                Ekstre Görüntüle
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: Add New Account */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Yeni Ödeme Hesabı Ekle</h3>
              <button 
                onClick={() => setIsAccountModalOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4 pt-4 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Hesap Adı / Tanımı *</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="Örn: Garanti Bankası TL Hesabı"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Hesap Türü *</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as any)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="KASA">Nakit Kasa</option>
                  <option value="BANKA">Banka Hesabı</option>
                </select>
              </div>

              {newAccType === 'BANKA' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Banka Adı *</label>
                      <input
                        type="text"
                        required
                        value={newAccBank}
                        onChange={(e) => setNewAccBank(e.target.value)}
                        placeholder="Örn: Yapı Kredi"
                        className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Hesap Sahibi *</label>
                      <input
                        type="text"
                        required
                        value={newAccOwner}
                        onChange={(e) => setNewAccOwner(e.target.value)}
                        placeholder="Örn: Site Yönetimi"
                        className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">IBAN Numarası *</label>
                    <input
                      type="text"
                      required
                      value={newAccIban}
                      onChange={(e) => setNewAccIban(e.target.value)}
                      placeholder="TR00 0000..."
                      className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none font-mono"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Açılış Bakiyesi (TL)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newAccInitialBalance}
                  onChange={(e) => setNewAccInitialBalance(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--border-color)]/30 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  Hesap Tanımla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Transaction / Transfer */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Kasa / Banka İşlemi Ekle</h3>
              <button 
                onClick={() => setIsTransactionModalOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4 pt-4 text-xs">
              {/* İşlem Türü */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">İşlem Türü *</label>
                <select
                  value={txType}
                  onChange={(e) => {
                    setTxType(e.target.value);
                    setTxAccountId('');
                    setTxTargetAccountId('');
                  }}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="TAHSILAT">Aidat/Borç Tahsilatı (Giriş)</option>
                  <option value="HARICI_TAHSILAT">Harici Tahsilat / Diğer Gelir (Giriş)</option>
                  <option value="GIDER_ODEME">Ortak Alan Gider Ödemesi (Çıkış)</option>
                  <option value="FIRMA_PERSONEL_ODEME">Firma / Personel Ödemesi (Çıkış)</option>
                  <option value="VIRMAN">Virman / Hesaplar Arası Transfer</option>
                </select>
              </div>

              {/* Tutar & Tarih */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Tutar (TL) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1500"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">İşlem Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Hesap Seçimleri (Dinamik) */}
              {txType === 'VIRMAN' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Kaynak Hesap (Çıkış) *</label>
                    <select
                      value={txAccountId}
                      onChange={(e) => setTxAccountId(e.target.value)}
                      className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="">Seçiniz</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Hedef Hesap (Giriş) *</label>
                    <select
                      value={txTargetAccountId}
                      onChange={(e) => setTxTargetAccountId(e.target.value)}
                      className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="">Seçiniz</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Hesap Seçimi *</label>
                  <select
                    value={txAccountId}
                    onChange={(e) => setTxAccountId(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="">Seçiniz</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Açıklama */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Açıklama / Detay</label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="İşlem detayı yazınız..."
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              {/* Belge Yükleme Mockup */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Dekont / Belge Yükle</label>
                <div className="flex items-center justify-center border border-dashed border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-primary)] text-center text-[10px] text-[var(--text-tertiary)] hover:border-indigo-500 transition-colors cursor-pointer">
                  <span>Sürükleyip Bırakın veya Seçin (PDF, PNG, JPG)</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--border-color)]/30 mt-6">
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  İşlemi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Account statement (Ekstre) */}
      {selectedAccountForEkstre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-4xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in relative overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <div>
                <h3 className="text-lg font-black text-[var(--text-primary)]">
                  Hesap Ekstresi
                </h3>
                <span className="text-xs text-[var(--text-secondary)] mt-0.5 font-bold block">
                  {selectedAccountForEkstre.name} {selectedAccountForEkstre.type === 'BANKA' ? `(${selectedAccountForEkstre.bankName})` : ''}
                </span>
              </div>
              <button 
                onClick={() => {
                  setSelectedAccountForEkstre(null);
                  setEkstreSearch('');
                  setEkstreTypeFilter('all');
                  setEkstrePeriodFilter('all');
                }}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="my-4 flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <input 
                  type="text"
                  placeholder="Ekstrede ara..."
                  value={ekstreSearch}
                  onChange={(e) => setEkstreSearch(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={ekstreTypeFilter}
                  onChange={(e) => setEkstreTypeFilter(e.target.value)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="all">Tüm Hareketler</option>
                  <option value="tahsilat">Gelir / Girişler</option>
                  <option value="odeme">Gider / Çıkışlar</option>
                  <option value="virman">Virman İşlemleri</option>
                </select>

                <select
                  value={ekstrePeriodFilter}
                  onChange={(e) => setEkstrePeriodFilter(e.target.value)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="all">Tüm Zamanlar</option>
                  <option value="today">Bugün</option>
                  <option value="week">Son 7 Gün</option>
                  <option value="month">Son 30 Gün</option>
                </select>

                <div className="flex items-center gap-1.5 shrink-0 border-l border-[var(--border-color)]/60 pl-3">
                  <button 
                    onClick={() => {
                      toast.success('Ekstre Excel raporu indiriliyor...');
                    }}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" 
                    title="Excel İhracatı"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" 
                    title="Yazdır"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Statement Grid Table */}
            <div className="flex-1 overflow-y-auto min-h-[300px] border border-[var(--border-color)]/70 rounded-xl bg-[var(--bg-primary)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sticky top-0 backdrop-blur-md">
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Açıklama / Detay</th>
                    <th className="p-3 text-right">Giriş (Gelir)</th>
                    <th className="p-3 text-right">Çıkış (Gider)</th>
                    <th className="p-3 text-right">Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/40 text-sm">
                  {ekstreData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                        Seçilen kriterlerde hesap hareketi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    ekstreData.map((t) => (
                      <tr 
                        key={t.id} 
                        className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/10 text-xs"
                      >
                        <td className="p-3 text-[11px] whitespace-nowrap text-[var(--text-tertiary)]">
                          {formatDate(t.transactionDate)}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-[var(--text-primary)] block">{t.description}</span>
                          <span className="text-[9px] text-[var(--text-tertiary)] tracking-wider">
                            {t.type === 'TAHSILAT' ? 'AİDAT TAHSİLATI' : 
                             t.type === 'HARICI_TAHSILAT' ? 'HARİCİ GELİR' : 
                             t.type === 'GIDER_ODEME' ? 'GİDER ÖDEMESİ' : 
                             t.type === 'FIRMA_PERSONEL_ODEME' ? 'FİRMA/PERSONEL ÖDEMESİ' : 
                             t.type === 'VIRMAN_GIRIS' ? 'VİRMAN GİRİŞ' : 'VİRMAN ÇIKIŞ'}
                          </span>
                        </td>
                        <td className="p-3 text-right text-emerald-500 font-bold">
                          {t.direction === 'giris' ? formatCurrency(t.amount) : ''}
                        </td>
                        <td className="p-3 text-right text-rose-500 font-bold">
                          {t.direction === 'cikis' ? formatCurrency(t.amount) : ''}
                        </td>
                        <td className="p-3 text-right font-black text-[var(--text-primary)]">
                          {formatCurrency(t.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)]/50 mt-4 flex items-center justify-between text-xs">
              <div className="flex gap-4">
                <span>Girişler Toplamı: <strong className="text-emerald-500">{formatCurrency(ekstreData.filter(d=>d.direction==='giris').reduce((s,t)=>s+t.amount,0))}</strong></span>
                <span>Çıkışlar Toplamı: <strong className="text-rose-500">{formatCurrency(ekstreData.filter(d=>d.direction==='cikis').reduce((s,t)=>s+t.amount,0))}</strong></span>
              </div>
              
              <div>
                Hesap Güncel Bakiyesi: <strong className="text-indigo-500 text-sm">{formatCurrency(selectedAccountForEkstre.balance)}</strong>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
