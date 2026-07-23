'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Users, 
  Building2, 
  Wallet, 
  Plus, 
  Search, 
  AlertTriangle, 
  FileText, 
  ArrowLeftRight, 
  Calendar, 
  DollarSign,
  Info,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// TS Interfaces
interface CariHesap {
  id: string;
  code: string;
  name: string;
  type: 'SUPPLIER' | 'INSTITUTION' | 'STAFF';
  taxOffice?: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

interface CariHareket {
  id: string;
  cariHesapId: string;
  date: string;
  description: string;
  direction: 'DEBIT' | 'CREDIT'; // DEBIT = Borç, CREDIT = Alacak
  amount: number;
  documentNo?: string;
}

export default function CariPage() {
  // Master states
  const [accounts, setAccounts] = useState<CariHesap[]>([]);
  const [movements, setMovements] = useState<CariHareket[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddMovementModal, setShowAddMovementModal] = useState(false);

  // Form states - Account
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'SUPPLIER' | 'INSTITUTION' | 'STAFF'>('SUPPLIER');
  const [newAccTaxOffice, setNewAccTaxOffice] = useState('');
  const [newAccTaxNumber, setNewAccTaxNumber] = useState('');
  const [newAccPhone, setNewAccPhone] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccAddress, setNewAccAddress] = useState('');

  // Form states - Movement
  const [newMovDate, setNewMovDate] = useState(new Date().toISOString().substring(0, 10));
  const [newMovDesc, setNewMovDesc] = useState('');
  const [newMovDirection, setNewMovDirection] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [newMovAmount, setNewMovAmount] = useState('');
  const [newMovDocNo, setNewMovDocNo] = useState('');

  // Helper: Automatically generate next Cari Code
  const generateNextCariCode = (currentAccounts: CariHesap[]) => {
    let maxNum = 0;
    currentAccounts.forEach(acc => {
      const match = acc.code.match(/^CAR-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `CAR-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Automatically generate code on modal open
  useEffect(() => {
    if (showAddAccountModal) {
      setNewAccCode(generateNextCariCode(accounts));
    }
  }, [showAddAccountModal, accounts]);

  // Load from localStorage or defaults
  useEffect(() => {
    const savedAccounts = localStorage.getItem('cari_accounts');
    const savedMovements = localStorage.getItem('cari_movements');

    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    } else {
      const defaultAccounts: CariHesap[] = [
        {
          id: 'cari-1',
          code: 'CAR-001',
          name: 'Özdemir Yapı Market A.Ş.',
          type: 'SUPPLIER',
          taxOffice: 'Beşiktaş',
          taxNumber: '1234567890',
          phone: '+90 212 555 44 33',
          email: 'siparis@ozdemirapi.com',
          address: 'Ihlamurdere Cad. No:12, Beşiktaş/İstanbul',
          isActive: true
        },
        {
          id: 'cari-2',
          code: 'CAR-002',
          name: 'İSKİ Genel Müdürlüğü',
          type: 'INSTITUTION',
          taxOffice: 'Aksaray',
          taxNumber: '9876543210',
          phone: '185',
          email: 'bilgi@iski.gov.tr',
          address: 'İSKİ Genel Md., Aksaray, Fatih/İstanbul',
          isActive: true
        },
        {
          id: 'cari-3',
          code: 'CAR-003',
          name: 'Murat Usta (Teknisyen)',
          type: 'STAFF',
          taxOffice: 'Kadıköy',
          taxNumber: '11122233344',
          phone: '+90 532 999 88 77',
          email: 'murat.teknik@yildiz.com',
          address: 'Moda Cad. No:45, Kadıköy/İstanbul',
          isActive: true
        }
      ];
      localStorage.setItem('cari_accounts', JSON.stringify(defaultAccounts));
      setAccounts(defaultAccounts);
    }

    if (savedMovements) {
      setMovements(JSON.parse(savedMovements));
    } else {
      const defaultMovements: CariHareket[] = [
        // CAR-001 (Özdemir Yapı)
        { id: 'mov-1', cariHesapId: 'cari-1', date: '2026-06-01', description: 'Bahçe Hortumu ve Vana Malzemeleri Alımı', direction: 'CREDIT', amount: 3500, documentNo: 'FAT-2026-0012' },
        { id: 'mov-2', cariHesapId: 'cari-1', date: '2026-06-10', description: 'Garanti BBVA Banka Ödemesi', direction: 'DEBIT', amount: 3500, documentNo: 'DEK-998877' },
        { id: 'mov-3', cariHesapId: 'cari-1', date: '2026-06-20', description: 'Ortak Alan Aydınlatma Ampulleri ve Kablolar', direction: 'CREDIT', amount: 1200, documentNo: 'FAT-2026-0045' },
        // CAR-002 (İSKİ)
        { id: 'mov-4', cariHesapId: 'cari-2', date: '2026-06-05', description: 'Ortak Alan Su Faturası - Haziran', direction: 'CREDIT', amount: 4500, documentNo: 'ISK-99221' },
        { id: 'mov-5', cariHesapId: 'cari-2', date: '2026-06-15', description: 'Otomatik Havale Ödemesi', direction: 'DEBIT', amount: 4500, documentNo: 'DEK-12345' },
        // CAR-003 (Murat Usta)
        { id: 'mov-6', cariHesapId: 'cari-3', date: '2026-06-05', description: 'Haziran Teknik Servis Bedeli', direction: 'CREDIT', amount: 2500, documentNo: 'MAK-001' },
        { id: 'mov-7', cariHesapId: 'cari-3', date: '2026-06-07', description: 'Nakit Avans Ödemesi', direction: 'DEBIT', amount: 2500, documentNo: 'KAS-092' },
        { id: 'mov-8', cariHesapId: 'cari-3', date: '2026-06-12', description: 'Asansör Revizyonu Ek Mesai', direction: 'CREDIT', amount: 1500, documentNo: 'MAK-002' }
      ];
      localStorage.setItem('cari_movements', JSON.stringify(defaultMovements));
      setMovements(defaultMovements);
    }
  }, []);

  // Save utility
  const saveAll = (newAccounts: CariHesap[], newMovements: CariHareket[]) => {
    setAccounts(newAccounts);
    setMovements(newMovements);
    localStorage.setItem('cari_accounts', JSON.stringify(newAccounts));
    localStorage.setItem('cari_movements', JSON.stringify(newMovements));
  };

  // Select first account by default if not set
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Form Submission handlers
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAccCode || !newAccName) {
      toast.error('Cari Kod ve Cari Adı alanları zorunludur.');
      return;
    }

    // Unique Code validation
    if (accounts.some(acc => acc.code.toLowerCase() === newAccCode.toLowerCase())) {
      toast.error('Bu cari kod zaten kullanılmaktadır. Lütfen benzersiz bir kod girin.');
      return;
    }

    const newAcc: CariHesap = {
      id: `cari-${Date.now()}`,
      code: newAccCode.trim().toUpperCase(),
      name: newAccName.trim(),
      type: newAccType,
      taxOffice: newAccTaxOffice.trim() || undefined,
      taxNumber: newAccTaxNumber.trim() || undefined,
      phone: newAccPhone.trim() || undefined,
      email: newAccEmail.trim() || undefined,
      address: newAccAddress.trim() || undefined,
      isActive: true
    };

    const updatedAccs = [...accounts, newAcc];
    saveAll(updatedAccs, movements);
    
    // Reset form
    setNewAccCode('');
    setNewAccName('');
    setNewAccTaxOffice('');
    setNewAccTaxNumber('');
    setNewAccPhone('');
    setNewAccEmail('');
    setNewAccAddress('');
    
    setShowAddAccountModal(false);
    setSelectedAccountId(newAcc.id);
    toast.success('Cari hesap başarıyla tanımlandı.');
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId) return;
    if (!newMovDesc || !newMovAmount) {
      toast.error('Açıklama ve Tutar alanları zorunludur.');
      return;
    }

    const amountNum = parseFloat(newMovAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Lütfen geçerli bir pozitif tutar girin.');
      return;
    }

    const newMov: CariHareket = {
      id: `mov-${Date.now()}`,
      cariHesapId: selectedAccountId,
      date: newMovDate,
      description: newMovDesc.trim(),
      direction: newMovDirection,
      amount: amountNum,
      documentNo: newMovDocNo.trim() || undefined
    };

    const updatedMovs = [...movements, newMov];
    saveAll(accounts, updatedMovs);

    // Reset Form
    setNewMovDesc('');
    setNewMovAmount('');
    setNewMovDocNo('');
    setNewMovDate(new Date().toISOString().substring(0, 10));

    setShowAddMovementModal(false);
    toast.success('Cari hareket başarıyla eklendi.');
  };

  // Helper calculations for specific account bakiye
  const getAccountBalances = (accountId: string) => {
    const accMovs = movements.filter(m => m.cariHesapId === accountId);
    let totalDebit = 0;  // Borç
    let totalCredit = 0; // Alacak

    accMovs.forEach(m => {
      if (m.direction === 'DEBIT') {
        totalDebit += m.amount;
      } else {
        totalCredit += m.amount;
      }
    });

    const netBakiye = totalDebit - totalCredit;
    return { totalDebit, totalCredit, netBakiye };
  };

  // Derived datasets
  const formattedAccountsList = useMemo(() => {
    return accounts.map(acc => {
      const { totalDebit, totalCredit, netBakiye } = getAccountBalances(acc.id);
      return {
        ...acc,
        totalDebit,
        totalCredit,
        bakiye: netBakiye
      };
    });
  }, [accounts, movements]);

  // Search & Type Filters applied to accounts
  const filteredAccounts = useMemo(() => {
    return formattedAccountsList.filter(acc => {
      const matchesSearch = 
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        acc.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || acc.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [formattedAccountsList, searchTerm, typeFilter]);

  // Selected Account details
  const selectedAccount = useMemo(() => {
    return accounts.find(acc => acc.id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  // Chronological statement (ekstre) of selected account with dynamic balance column
  const selectedAccountEkstre = useMemo(() => {
    if (!selectedAccountId) return [];

    const accMovs = movements
      .filter(m => m.cariHesapId === selectedAccountId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    return accMovs.map(m => {
      if (m.direction === 'DEBIT') {
        runningBalance += m.amount;
      } else {
        runningBalance -= m.amount;
      }
      return {
        ...m,
        bakiye: runningBalance
      };
    });
  }, [movements, selectedAccountId]);

  // General summary statistics for stats widgets
  const summaryStats = useMemo(() => {
    let totalSuppliersDebit = 0;
    let totalSuppliersCredit = 0;
    let totalOthersDebit = 0;
    let totalOthersCredit = 0;

    formattedAccountsList.forEach(acc => {
      if (acc.type === 'SUPPLIER') {
        totalSuppliersDebit += acc.totalDebit;
        totalSuppliersCredit += acc.totalCredit;
      } else {
        totalOthersDebit += acc.totalDebit;
        totalOthersCredit += acc.totalCredit;
      }
    });

    const netSupplierOwed = totalSuppliersCredit - totalSuppliersDebit; // How much we owe suppliers net
    const netOthersOwed = totalOthersCredit - totalOthersDebit;

    return {
      netSupplierOwed: netSupplierOwed > 0 ? netSupplierOwed : 0,
      netSupplierReceivable: netSupplierOwed < 0 ? Math.abs(netSupplierOwed) : 0,
      netOthersOwed: netOthersOwed > 0 ? netOthersOwed : 0,
      totalActiveAccounts: accounts.length
    };
  }, [formattedAccountsList, accounts]);

  const getBadgeTypeColor = (type: string) => {
    switch (type) {
      case 'SUPPLIER':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
      case 'INSTITUTION':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
    }
  };

  const getBadgeTypeLabel = (type: string) => {
    const labels = {
      SUPPLIER: 'Tedarikçi',
      INSTITUTION: 'Kurum / Belediye',
      STAFF: 'Personel / Serbest Çalışan'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Warnings / Business Logic banners */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Banner 1: Module Isolation Warning (Daire Sakinleri) */}
        <div className="glass bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start space-x-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Modül Kısıtlaması ve İzolasyon</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Daire sakinlerinin aidat borçlandırmaları, ödemeleri veya tahsilatları bu modüle eklenmemelidir. 
              <strong> Daire işlemleri için Daire Borçları ekranını kullanın.</strong>
            </p>
            <Link 
              href="/yonetici/aidat"
              className="inline-flex items-center text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 hover:underline gap-1 pt-1"
            >
              <span>Daire Borçları Ekranına Git</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Banner 2: Fatura Yönlendirme */}
        <div className="glass bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex items-start space-x-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Cari Fatura Kayıt Bilgilendirmesi</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              Cari hesaplara ait resmi gider faturaları ve tahakkuk girişleri için Faturalar modülünü kullanmalısınız. Burada doğrudan ödemeler ve manuel ekstre düzeltme hareketleri girilir.
            </p>
            <Link 
              href="/yonetici/cari/faturalar" 
              className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline gap-1 pt-1"
            >
              <span>Faturalar Modülüne Git</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Cari Hesaplar & Cari Ekstre
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Site yönetimi dış tedarikçi firmaları, kamu/belediye kurumları ve çalışan personel cari kart yönetimi
          </p>
        </div>

        <button
          onClick={() => setShowAddAccountModal(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Cari Hesap Tanımla
        </button>
      </div>

      {/* Mini Stats Widgets */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Tedarikçi Borçlarımız</span>
            <h3 className="text-xl font-extrabold text-rose-500">
              {formatCurrency(summaryStats.netSupplierOwed)}
            </h3>
          </div>
          <span className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Tedarikçi Alacaklarımız</span>
            <h3 className="text-xl font-extrabold text-emerald-500">
              {formatCurrency(summaryStats.netSupplierReceivable)}
            </h3>
          </div>
          <span className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Kurum & Personel Bakiye</span>
            <h3 className="text-xl font-extrabold text-[var(--text-primary)]">
              {formatCurrency(summaryStats.netOthersOwed)}
            </h3>
          </div>
          <span className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Tanımlı Cari Sayısı</span>
            <h3 className="text-xl font-extrabold text-[var(--text-primary)]">
              {summaryStats.totalActiveAccounts} Adet
            </h3>
          </div>
          <span className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Briefcase className="h-5 w-5" />
          </span>
        </div>
      </div>

      {/* Main Master-Detail Split Pane */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left 5 Columns: Cari Hesap Listesi (Master) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass rounded-2xl border border-[var(--border-color)] p-4 bg-[var(--bg-secondary)] shadow-sm space-y-4">
            
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Cari Listesi</h3>
            
            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Cari adı veya kodla ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-xs text-[var(--text-primary)] focus:border-primary-500 focus:outline-none"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="all">Tüm Türler</option>
                <option value="SUPPLIER">Tedarikçi</option>
                <option value="INSTITUTION">Kurum</option>
                <option value="STAFF">Personel</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredAccounts.length === 0 ? (
                <div className="text-center py-10 text-xs text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] rounded-xl">
                  Cari kayıt bulunamadı.
                </div>
              ) : (
                filteredAccounts.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;
                  
                  return (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm' 
                          : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[var(--border-color-hover)] hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                            {acc.code}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-1.5 py-0.2 text-[9px] font-bold ${getBadgeTypeColor(acc.type)}`}>
                            {acc.type === 'SUPPLIER' ? 'Tedarikçi' : acc.type === 'INSTITUTION' ? 'Kurum' : 'Personel'}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[var(--text-primary)] truncate pr-2">
                          {acc.name}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-[10px] text-[var(--text-tertiary)] font-medium">Bakiye</span>
                        <strong className={`text-xs font-bold ${
                          acc.bakiye < 0 
                            ? 'text-rose-500' 
                            : acc.bakiye > 0 
                              ? 'text-emerald-500' 
                              : 'text-[var(--text-secondary)]'
                        }`}>
                          {formatCurrency(acc.bakiye)}
                        </strong>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right 7 Columns: Cari Ekstre (Detail) */}
        <div className="lg:col-span-7">
          {selectedAccount ? (
            <div className="space-y-6">
              
              {/* Account Detail Card */}
              <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-tr ${
                  selectedAccount.type === 'SUPPLIER' 
                    ? 'from-purple-500 to-purple-600' 
                    : selectedAccount.type === 'INSTITUTION' 
                      ? 'from-blue-500 to-blue-600' 
                      : 'from-emerald-500 to-emerald-600'
                } opacity-5 blur-2xl`} />

                {/* Account Head */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
                        {selectedAccount.code}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${getBadgeTypeColor(selectedAccount.type)}`}>
                        {getBadgeTypeLabel(selectedAccount.type)}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
                      {selectedAccount.name}
                    </h2>
                  </div>

                  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 rounded-xl shadow-sm sm:text-right shrink-0 min-w-[150px]">
                    <span className="block text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Güncel Net Bakiye</span>
                    <strong className={`text-lg font-extrabold block ${
                      getAccountBalances(selectedAccount.id).netBakiye < 0 
                        ? 'text-rose-500' 
                        : getAccountBalances(selectedAccount.id).netBakiye > 0 
                          ? 'text-emerald-500' 
                          : 'text-[var(--text-secondary)]'
                    }`}>
                      {formatCurrency(getAccountBalances(selectedAccount.id).netBakiye)}
                    </strong>
                    <span className="text-[9px] text-[var(--text-tertiary)]">
                      {getAccountBalances(selectedAccount.id).netBakiye < 0 
                        ? 'Alacak Bakiyesi (Borcumuz Var)' 
                        : getAccountBalances(selectedAccount.id).netBakiye > 0 
                          ? 'Borç Bakiyesi (Alacağımız Var)' 
                          : 'Hesap Dengede'}
                    </span>
                  </div>
                </div>

                {/* Account Metadata Grid */}
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-[var(--border-color)]/50 text-xs text-[var(--text-secondary)]">
                  <div className="space-y-2.5">
                    {selectedAccount.phone && (
                      <div className="flex items-center space-x-2.5">
                        <Phone className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <span>{selectedAccount.phone}</span>
                      </div>
                    )}
                    {selectedAccount.email && (
                      <div className="flex items-center space-x-2.5">
                        <Mail className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <span className="break-all">{selectedAccount.email}</span>
                      </div>
                    )}
                    {selectedAccount.address && (
                      <div className="flex items-start space-x-2.5">
                        <MapPin className="h-4 w-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                        <span>{selectedAccount.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 sm:border-l sm:border-[var(--border-color)]/50 sm:pl-4">
                    <div>
                      <span className="block text-[10px] text-[var(--text-tertiary)] font-semibold">Vergi Dairesi</span>
                      <strong className="text-[var(--text-primary)]">{selectedAccount.taxOffice || '-'}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[var(--text-tertiary)] font-semibold">Vergi / TC No</span>
                      <strong className="text-[var(--text-primary)] font-mono">{selectedAccount.taxNumber || '-'}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Account Statement (Ekstre) Section */}
              <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-4">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
                    <span>Cari Ekstre (Hesap Hareketleri)</span>
                  </h3>
                  
                  <button
                    onClick={() => setShowAddMovementModal(true)}
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] shadow-sm transition-colors"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                    Yeni Hareket İşle
                  </button>
                </div>

                {/* Ekstre Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        <th className="p-3">Tarih</th>
                        <th className="p-3">Evrak/Belge No</th>
                        <th className="p-3">Açıklama</th>
                        <th className="p-3 text-right">Borç (Debit)</th>
                        <th className="p-3 text-right">Alacak (Credit)</th>
                        <th className="p-3 text-right">Bakiye</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]/60 text-xs">
                      {selectedAccountEkstre.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                            Kayıtlı cari hesap hareketi bulunmamaktadır.
                          </td>
                        </tr>
                      ) : (
                        selectedAccountEkstre.map((mov) => (
                          <tr key={mov.id} className="transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/10 text-[var(--text-secondary)]">
                            <td className="p-3 font-medium whitespace-nowrap">
                              {formatDate(mov.date)}
                            </td>
                            <td className="p-3 font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                              {mov.documentNo || '-'}
                            </td>
                            <td className="p-3 font-bold text-[var(--text-primary)]">
                              {mov.description}
                            </td>
                            <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              {mov.direction === 'DEBIT' ? formatCurrency(mov.amount) : '-'}
                            </td>
                            <td className="p-3 text-right font-semibold text-rose-500">
                              {mov.direction === 'CREDIT' ? formatCurrency(mov.amount) : '-'}
                            </td>
                            <td className={`p-3 text-right font-bold ${
                              mov.bakiye < 0 
                                ? 'text-rose-500' 
                                : mov.bakiye > 0 
                                  ? 'text-emerald-500' 
                                  : 'text-[var(--text-secondary)]'
                            }`}>
                              {formatCurrency(mov.bakiye)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          ) : (
            <div className="glass rounded-2xl border border-[var(--border-color)] p-12 text-center text-sm text-[var(--text-tertiary)] bg-[var(--bg-secondary)] shadow-sm">
              Lütfen sol listeden ekstre detaylarını görmek istediğiniz cari hesabı seçin.
            </div>
          )}
        </div>

      </div>

      {/* Modal 1: Yeni Cari Hesap Tanımlama Formu */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Yeni Cari Hesap Kartı Aç</h3>
              <button 
                onClick={() => setShowAddAccountModal(false)} 
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-semibold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4 pt-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Cari Kod (Otomatik)</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={newAccCode}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 px-3 py-2 text-xs font-bold text-[var(--text-primary)] font-mono cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Cari Türü *</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as any)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="SUPPLIER">Tedarikçi Firma</option>
                    <option value="INSTITUTION">Kamu / Belediye Kurumu</option>
                    <option value="STAFF">Personel / Çalışan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Cari Adı / Firma Unvanı *</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="Örn. Yıldız Tesisat San. Tic. Ltd. Şti."
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Vergi Dairesi</label>
                  <input
                    type="text"
                    value={newAccTaxOffice}
                    onChange={(e) => setNewAccTaxOffice(e.target.value)}
                    placeholder="Zincirlikuyu"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Vergi / TC Numarası</label>
                  <input
                    type="text"
                    value={newAccTaxNumber}
                    onChange={(e) => setNewAccTaxNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="9998887776"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Telefon</label>
                  <input
                    type="text"
                    value={newAccPhone}
                    onChange={(e) => setNewAccPhone(e.target.value)}
                    placeholder="+90 212 000 00 00"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">E-posta</label>
                  <input
                    type="email"
                    value={newAccEmail}
                    onChange={(e) => setNewAccEmail(e.target.value)}
                    placeholder="muhasebe@firma.com"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Adres</label>
                <textarea
                  value={newAccAddress}
                  onChange={(e) => setNewAccAddress(e.target.value)}
                  placeholder="Firma resmi adres bilgileri..."
                  rows={2}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  Cari Kartı Oluştur
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Yeni Cari Hareket İşleme Formu */}
      {showAddMovementModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Cari Hareket İşle</h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">{selectedAccount.name}</p>
              </div>
              <button 
                onClick={() => setShowAddMovementModal(false)} 
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-semibold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="space-y-4 pt-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">İşlem Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={newMovDate}
                    onChange={(e) => setNewMovDate(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Belge / Fatura / Dekont No</label>
                  <input
                    type="text"
                    value={newMovDocNo}
                    onChange={(e) => setNewMovDocNo(e.target.value)}
                    placeholder="Örn. FAT-2026-0001"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Hareket Yönü *</label>
                  <select
                    value={newMovDirection}
                    onChange={(e) => setNewMovDirection(e.target.value as any)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="CREDIT">Alacak (Mal / Hizmet Girişi - Borçlanırız)</option>
                    <option value="DEBIT">Borç (Ödeme / Tahsilat - Alacaklanırız)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Tutar (TRY) *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[var(--text-tertiary)]">
                      ₺
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newMovAmount}
                      onChange={(e) => setNewMovAmount(e.target.value)}
                      placeholder="0.00"
                      className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] pl-7 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Açıklama *</label>
                <input
                  type="text"
                  required
                  value={newMovDesc}
                  onChange={(e) => setNewMovDesc(e.target.value)}
                  placeholder="Örn. Boya işleri malzeme faturası bedeli"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddMovementModal(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  Hareketi İşle
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
