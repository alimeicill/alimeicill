'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Landmark, 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  Search, 
  X, 
  Download, 
  Printer,
  Calendar,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface SaaSAccount {
  id: string;
  name: string;
  type: 'BANKA' | 'KASA' | 'ONLINE_POS';
  balance: number;
}

interface SaasTransaction {
  id: string;
  accountId: string;
  type: 'ABONELIK_GELIRI' | 'LISANS_GELIRI' | 'SUNUCU_GIDERI' | 'SMS_GIDERI' | 'REKLAM_GIDERI' | 'DIGER';
  amount: number;
  direction: 'giris' | 'cikis';
  tenantName?: string;
  description: string;
  transactionDate: string;
}

interface TenantPaymentInfo {
  id: string;
  tenantName: string;
  managerName: string;
  planName: 'Standart' | 'Premium' | 'Enterprise';
  amount: number;
  interval: 'Aylık' | 'Yıllık';
  status: 'Aktif' | 'Askıda' | 'Süresi Dolmuş';
  lastPaymentDate: string;
  nextRenewalDate: string;
}

export default function SuperAdminFinansPage() {
  const [accounts, setAccounts] = useState<SaaSAccount[]>([]);
  const [transactions, setTransactions] = useState<SaasTransaction[]>([]);
  const [tenants, setTenants] = useState<TenantPaymentInfo[]>([]);

  // State Management
  const [activeTab, setActiveTab] = useState<'summary' | 'payments' | 'sms'>('summary');
  
  // SMS States
  const [smsRecipientType, setSmsRecipientType] = useState<'all_active' | 'all_expired' | 'single'>('all_active');
  const [smsSelectedTenantId, setSmsSelectedTenantId] = useState('');
  const [smsContent, setSmsContent] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'gelir' | 'gider'>('gelir');

  // Add Form States
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [txType, setTxType] = useState('ABONELIK_GELIRI');
  const [description, setDescription] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load from localStorage
  const loadData = () => {
    const savedAccs = localStorage.getItem('saas_payment_accounts');
    const savedTxs = localStorage.getItem('saas_transactions');
    const savedTenants = localStorage.getItem('saas_tenants_billing');

    if (savedAccs && savedTxs && savedTenants) {
      setAccounts(JSON.parse(savedAccs));
      setTransactions(JSON.parse(savedTxs));
      setTenants(JSON.parse(savedTenants));
    } else {
      // Seed default SaaS finance data
      const defaultAccounts: SaaSAccount[] = [
        { id: 'saas-acc-1', name: 'Vakıfbank SaaS Ticari Hesap', type: 'BANKA', balance: 145000 },
        { id: 'saas-acc-2', name: 'Stripe POS Hesabı', type: 'ONLINE_POS', balance: 58900 },
        { id: 'saas-acc-3', name: 'Şirket Kredi Kartı (Giderler)', type: 'KASA', balance: -12400 } // negative represents outflow limit
      ];

      const defaultTransactions: SaasTransaction[] = [
        { id: 'saas-tx-1', accountId: 'saas-acc-2', type: 'ABONELIK_GELIRI', amount: 1500, direction: 'giris', tenantName: 'Yıldız Konakları', description: 'Haziran 2026 Premium Paket Aboneliği', transactionDate: '2026-06-20T10:00:00Z' },
        { id: 'saas-tx-2', accountId: 'saas-acc-2', type: 'ABONELIK_GELIRI', amount: 2400, direction: 'giris', tenantName: 'Akasya Sitesi', description: 'Yıllık Standart Paket Yenileme', transactionDate: '2026-06-22T14:30:00Z' },
        { id: 'saas-tx-3', accountId: 'saas-acc-3', type: 'SUNUCU_GIDERI', amount: 4800, direction: 'cikis', description: 'AWS Hosting & Database Bulut Faturaları', transactionDate: '2026-06-25T08:00:00Z' },
        { id: 'saas-tx-4', accountId: 'saas-acc-3', type: 'SMS_GIDERI', amount: 1200, direction: 'cikis', description: 'Netgsm SMS API Kredi Yüklemesi (100k Adet)', transactionDate: '2026-06-26T11:00:00Z' },
        { id: 'saas-tx-5', accountId: 'saas-acc-1', type: 'LISANS_GELIRI', amount: 12500, direction: 'giris', tenantName: 'Hilal Kentsel Dönüşüm', description: 'Enterprise Paket Özel Lisans Kurulumu', transactionDate: '2026-06-28T16:00:00Z' }
      ];

      const defaultTenants: TenantPaymentInfo[] = [
        { id: 't-pay-1', tenantName: 'Yıldız Konakları Sitesi', managerName: 'Hasan Korkmaz', planName: 'Premium', amount: 1500, interval: 'Aylık', status: 'Aktif', lastPaymentDate: '2026-06-20', nextRenewalDate: '2026-07-20' },
        { id: 't-pay-2', tenantName: 'Akasya Konutları', managerName: 'Ali Demir', planName: 'Standart', amount: 2400, interval: 'Yıllık', status: 'Aktif', lastPaymentDate: '2026-06-22', nextRenewalDate: '2027-06-22' },
        { id: 't-pay-3', tenantName: 'Zümrüt Apartmanı', managerName: 'Veli Şahin', planName: 'Standart', amount: 250, interval: 'Aylık', status: 'Süresi Dolmuş', lastPaymentDate: '2026-05-10', nextRenewalDate: '2026-06-10' },
        { id: 't-pay-4', tenantName: 'Hilal Plaza Yönetimi', managerName: 'Fatma Yılmaz', planName: 'Enterprise', amount: 12500, interval: 'Yıllık', status: 'Aktif', lastPaymentDate: '2026-06-28', nextRenewalDate: '2027-06-28' }
      ];

      localStorage.setItem('saas_payment_accounts', JSON.stringify(defaultAccounts));
      localStorage.setItem('saas_transactions', JSON.stringify(defaultTransactions));
      localStorage.setItem('saas_tenants_billing', JSON.stringify(defaultTenants));
      setAccounts(defaultAccounts);
      setTransactions(defaultTransactions);
      setTenants(defaultTenants);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const saveState = (newAccs: SaaSAccount[], newTxs: SaasTransaction[], newTenants: TenantPaymentInfo[]) => {
    setAccounts(newAccs);
    setTransactions(newTxs);
    setTenants(newTenants);
    localStorage.setItem('saas_payment_accounts', JSON.stringify(newAccs));
    localStorage.setItem('saas_transactions', JSON.stringify(newTxs));
    localStorage.setItem('saas_tenants_billing', JSON.stringify(newTenants));
    window.dispatchEvent(new Event('storage'));
  };

  // SaaS General Stats
  const saasStats = useMemo(() => {
    const totalSaaSCiro = transactions
      .filter(t => t.direction === 'giris')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSaaSExpense = transactions
      .filter(t => t.direction === 'cikis')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSaaSProfit = totalSaaSCiro - totalSaaSExpense;
    
    // MRR (Monthly Recurring Revenue) estimation
    const mrr = tenants
      .filter(t => t.status === 'Aktif')
      .reduce((sum, t) => {
        const monthlyAmount = t.interval === 'Yıllık' ? t.amount / 12 : t.amount;
        return sum + monthlyAmount;
      }, 0);

    return {
      totalSaaSCiro,
      totalSaaSExpense,
      totalSaaSProfit,
      mrr
    };
  }, [transactions, tenants]);

  // Filtered Payments Table
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = t.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.managerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'active' && t.status === 'Aktif') ||
                            (statusFilter === 'expired' && t.status === 'Süresi Dolmuş');
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  // Handle Add SaaS Transaction
  const handleAddSaaSTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(amount);
    if (!amount || amountVal <= 0 || !accountId) {
      toast.error('Lütfen geçerli bir tutar ve SaaS ödeme hesabı seçiniz.');
      return;
    }

    const direction = addMode === 'gelir' ? 'giris' : 'cikis';

    const newTx: SaasTransaction = {
      id: `saas-tx-${Date.now()}`,
      accountId,
      type: txType as any,
      amount: amountVal,
      direction,
      tenantName: addMode === 'gelir' ? tenantName.trim() : undefined,
      description: description.trim() || `${txType} Kaydı`,
      transactionDate: new Date(date).toISOString()
    };

    // Update SaaS Account Balance
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          balance: direction === 'giris' ? acc.balance + amountVal : acc.balance - amountVal
        };
      }
      return acc;
    });

    saveState(updatedAccounts, [newTx, ...transactions], tenants);
    toast.success(`SaaS ${addMode === 'gelir' ? 'Gelir' : 'Gider'} kaydı başarıyla eklendi.`);

    // Reset Form
    setAmount('');
    setDescription('');
    setTenantName('');
    setIsAddModalOpen(false);
  };

  // Simulate Tenant Payment Reminder
  const handleSendBillingReminder = (t: TenantPaymentInfo) => {
    toast.success(`${t.tenantName} yöneticisi ${t.managerName} için abonelik yenileme e-postası ve SMS'i gönderildi.`);
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsContent.trim()) {
      toast.error('Lütfen SMS mesajı yazınız.');
      return;
    }

    let recipientLabel = '';
    if (smsRecipientType === 'all_active') {
      recipientLabel = 'tüm aktif apartman yöneticilerine';
    } else if (smsRecipientType === 'all_expired') {
      recipientLabel = 'tüm süresi dolmuş apartman yöneticilerine';
    } else {
      const selectedT = tenants.find(t => t.id === smsSelectedTenantId);
      if (!selectedT) {
        toast.error('Lütfen bir apartman seçiniz.');
        return;
      }
      recipientLabel = `${selectedT.tenantName} yöneticisi ${selectedT.managerName} kişisine`;
    }

    toast.success(`Abonelik Bilgilendirme SMS'i ${recipientLabel} başarıyla gönderildi.`);
    setSmsContent('');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-xs">
      
      {/* Page Header */}
      <div className="space-y-4">
        <Link
          href="/super-admin/dashboard"
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Süper Admin Paneline Dön
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              SaaS Finansal Yönetim
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              SaaS platform abonelik ciroları, bulut barındırma giderleri ve lisans ödemeleri
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setAddMode('gider');
                setTxType('SUNUCU_GIDERI');
                setAccountId(accounts.length > 0 ? accounts[0].id : '');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-sm transition-all"
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              SaaS Gideri Kaydet
            </button>

            <button
              onClick={() => {
                setAddMode('gelir');
                setTxType('ABONELIK_GELIRI');
                setAccountId(accounts.length > 0 ? accounts[0].id : '');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Abonelik Geliri Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* SaaS Dashboard Financial Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-4">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-secondary)] shadow-sm">
          <span className="block text-[10px] text-[var(--text-tertiary)] uppercase font-semibold text-emerald-500">Toplam SaaS Cirosu</span>
          <strong className="text-2xl font-black text-emerald-500 mt-1 block">
            {formatCurrency(saasStats.totalSaaSCiro)}
          </strong>
          <span className="block text-[9px] text-[var(--text-tertiary)] mt-1">Platform lisans ve abonelik toplamı</span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-secondary)] shadow-sm">
          <span className="block text-[10px] text-[var(--text-tertiary)] uppercase font-semibold text-rose-500">Platform Giderleri</span>
          <strong className="text-2xl font-black text-rose-500 mt-1 block">
            {formatCurrency(saasStats.totalSaaSExpense)}
          </strong>
          <span className="block text-[9px] text-[var(--text-tertiary)] mt-1">Bulut sunucu, veritabanı, SMS maliyetleri</span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-secondary)] shadow-sm">
          <span className="block text-[10px] text-[var(--text-tertiary)] uppercase font-semibold text-indigo-500">Net Platform Karı</span>
          <strong className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {formatCurrency(saasStats.totalSaaSProfit)}
          </strong>
          <span className="block text-[9px] text-[var(--text-tertiary)] mt-1">Gelir ve gider farkı net nakit akışı</span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-secondary)] shadow-sm">
          <span className="block text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Tahmini MRR</span>
          <strong className="text-2xl font-black text-[var(--text-primary)] mt-1 block">
            {formatCurrency(saasStats.mrr)}
          </strong>
          <span className="block text-[9px] text-[var(--text-tertiary)] mt-1">Aylık tekrarlayan aktif ciro</span>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-[var(--border-color)] pb-px gap-6">
        {[
          { id: 'summary', label: 'Platform Hesapları & Hareketler' },
          { id: 'payments', label: 'Müşteri Abonelik & Ödemeleri' },
          { id: 'sms', label: 'Abonelere SMS Bildirimi' }
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

      {/* TAB 1: Accounts & Statements */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          
          {/* Bank Accounts Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
            {accounts.map(acc => (
              <div key={acc.id} className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-secondary)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                    {acc.type === 'ONLINE_POS' ? 'Online Sanal POS' : acc.type === 'BANKA' ? 'Banka Hesabı' : 'Gider Kartı'}
                  </span>
                  <strong className="text-xs text-[var(--text-primary)] mt-1 block">{acc.name}</strong>
                </div>
                <strong className={`text-base font-extrabold ${acc.balance >= 0 ? 'text-indigo-500' : 'text-rose-500'}`}>
                  {formatCurrency(acc.balance)}
                </strong>
              </div>
            ))}
          </div>

          {/* SaaS Transaction History */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)]/50 pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Platform Son Finansal İşlemleri</h3>
              <span className="text-[10px] text-[var(--text-tertiary)]">Toplam {transactions.length} Kayıt</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]/10">
                    <th className="p-3">Tarih</th>
                    <th className="p-3">İşlem Tipi</th>
                    <th className="p-3">Açıklama</th>
                    <th className="p-3">Müşteri (Tenant)</th>
                    <th className="p-3 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-secondary)]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--text-tertiary)]">
                        Platform hareketi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t.id} className="hover:bg-[var(--bg-tertiary)]/10">
                        <td className="p-3 text-[10px] text-[var(--text-tertiary)]">{formatDate(t.transactionDate)}</td>
                        <td className="p-3 font-semibold text-[var(--text-primary)]">
                          {t.type === 'ABONELIK_GELIRI' ? 'Abonelik Cirosu' : 
                           t.type === 'LISANS_GELIRI' ? 'Özel Lisans' : 
                           t.type === 'SUNUCU_GIDERI' ? 'Hosting / Server' : 
                           t.type === 'SMS_GIDERI' ? 'SMS Api Gideri' : 'Reklam / Pazarlama'}
                        </td>
                        <td className="p-3">{t.description}</td>
                        <td className="p-3 font-bold text-[var(--text-primary)]">{t.tenantName || 'Platform Gideri'}</td>
                        <td className={`p-3 text-right font-bold ${t.direction === 'giris' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.direction === 'giris' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Customer Subscriptions & Billing Status */}
      {activeTab === 'payments' && (
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)]/50 pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">SaaS Müşteri Abonelik Listesi</h3>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <input 
                  type="text" 
                  placeholder="Apartman veya yönetici ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 text-[var(--text-primary)] focus:outline-none"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktifler</option>
                <option value="expired">Aboneliği Dolanlar</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]/10">
                  <th className="p-3">Müşteri (Site/Apartman)</th>
                  <th className="p-3">Yönetici / Yetkili</th>
                  <th className="p-3">Abonelik Planı</th>
                  <th className="p-3">Faturalandırma</th>
                  <th className="p-3 text-right">Lisans Bedeli</th>
                  <th className="p-3">Yenileme Tarihi</th>
                  <th className="p-3">Durum</th>
                  <th className="p-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-secondary)]">
                {filteredTenants.map(t => (
                  <tr key={t.id} className="hover:bg-[var(--bg-tertiary)]/10">
                    <td className="p-3 font-bold text-[var(--text-primary)]">{t.tenantName}</td>
                    <td className="p-3">{t.managerName}</td>
                    <td className="p-3 font-semibold">{t.planName} Paket</td>
                    <td className="p-3">{t.interval}</td>
                    <td className="p-3 text-right font-bold text-[var(--text-primary)]">{formatCurrency(t.amount)}</td>
                    <td className="p-3">{formatDate(t.nextRenewalDate)}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        t.status === 'Aktif' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleSendBillingReminder(t)}
                        className="rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)] font-semibold"
                      >
                        Ödeme Hatırlat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SMS Announcement / Broadcast */}
      {activeTab === 'sms' && (
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Form */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-4">
            <div className="border-b border-[var(--border-color)]/50 pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Müşteri Yöneticilerine SMS Gönder</h3>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                Lisans sahiplerine duyuru, fatura hatırlatması veya sistem kesintisi mesajları yollayın.
              </p>
            </div>

            <form onSubmit={handleSendSms} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Alıcı Grubu *</label>
                <select
                  value={smsRecipientType}
                  onChange={(e) => setSmsRecipientType(e.target.value as any)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="all_active">Tüm Aktif Müşteriler (Yöneticiler)</option>
                  <option value="all_expired">Tüm Aboneliği Dolan Müşteriler</option>
                  <option value="single">Belirli Bir Müşteri (Site/Apartman)</option>
                </select>
              </div>

              {smsRecipientType === 'single' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Müşteri Seçin *</label>
                  <select
                    value={smsSelectedTenantId}
                    onChange={(e) => setSmsSelectedTenantId(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="">Müşteri Seçiniz</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.tenantName} ({t.managerName})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">SMS Mesaj Metni *</label>
                  <span className="text-[10px] text-[var(--text-tertiary)] font-bold">
                    {smsContent.length} / 160 Karakter ({Math.ceil(smsContent.length / 160) || 1} SMS)
                  </span>
                </div>
                <textarea
                  required
                  rows={6}
                  value={smsContent}
                  onChange={(e) => setSmsContent(e.target.value)}
                  placeholder="Yazacağınız SMS metni sağdaki telefonda anlık olarak önizlenir..."
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:from-indigo-600 hover:to-indigo-700 transition-all"
                >
                  SMS Mesajını Gönder
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live iPhone Mockup */}
          <div className="flex justify-center items-center">
            <div className="relative w-[280px] h-[540px] rounded-[36px] border-[8px] border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col justify-between p-3.5">
              
              {/* iPhone top notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
                <div className="w-8 h-1 bg-slate-900 rounded-full" />
              </div>

              {/* iPhone screen body */}
              <div className="flex-1 bg-slate-900 rounded-[24px] overflow-hidden flex flex-col justify-between pt-6 p-3 relative">
                
                {/* Header Mock */}
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>9:41 AM</span>
                  <strong className="font-bold text-white">ApartmanYönet</strong>
                  <span>100%</span>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3 flex flex-col justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-slate-800 text-white p-3 self-start text-[10px] leading-relaxed shadow break-words">
                    {smsContent || 'ApartmanYönet sistem bilgilendirme mesajı buraya yansıyacaktır.'}
                  </div>
                  {smsContent && (
                    <div className="text-[8px] text-slate-500 pl-1">
                      Şimdi gönderiliyor • ApartmanYönet
                    </div>
                  )}
                </div>

                {/* Keyboard / Input Mock */}
                <div className="border-t border-slate-800 pt-2 text-[9px] text-slate-500 flex justify-between items-center">
                  <span>Mesaj yaz...</span>
                  <span className="h-4 w-4 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-[8px]">↑</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD TRANSACTION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Yeni SaaS {addMode === 'gelir' ? 'Gelir' : 'Gider'} İşlemi Kaydet
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSaaSTx} className="space-y-4 pt-4 text-xs">
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
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Tarih *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* İşlem Tipi Seçimi */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Kategori / İşlem Tipi *</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  {addMode === 'gelir' ? (
                    <>
                      <option value="ABONELIK_GELIRI">Abonelik Geliri</option>
                      <option value="LISANS_GELIRI">Özel Kurulum / Ek Lisans</option>
                      <option value="DIGER">Diğer SaaS Geliri</option>
                    </>
                  ) : (
                    <>
                      <option value="SUNUCU_GIDERI">Sunucu / Veritabanı Gideri (AWS/Azure)</option>
                      <option value="SMS_GIDERI">SMS API Servis Gideri</option>
                      <option value="REKLAM_GIDERI">Pazarlama & Reklam Gideri</option>
                      <option value="DIGER">Şirket Genel Operasyon Gideri</option>
                    </>
                  )}
                </select>
              </div>

              {/* Hesap Seçimi */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">İlgili Platform Hesabı *</label>
                <select
                  value={accountId}
                  required
                  onChange={(e) => setAccountId(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="">Hesap Seçiniz</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (Bakiye: {formatCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>

              {/* Müşteri Adı (Sadece Gelir İçin) */}
              {addMode === 'gelir' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Müşteri (Site/Apartman Adı) *</label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Örn: Kardelen Sitesi"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              )}

              {/* Açıklama */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">İşlem Açıklaması</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detaylı işlem açıklaması giriniz..."
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                />
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
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
