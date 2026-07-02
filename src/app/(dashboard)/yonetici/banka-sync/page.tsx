'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  X, 
  Upload, 
  User, 
  Building2, 
  Layers,
  Check,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface BankSyncItem {
  id: string;
  transactionRef: string;
  transactionDate: string;
  amount: number;
  senderName: string;
  description: string;
  status: 'Eslesti' | 'Beklemede' | 'Manuel_Incelemede';
  matchedResidentId?: string;
  matchedResidentName?: string;
  matchedUnitNumber?: string;
  matchCriteria?: 'TCNo' | 'Telefon' | 'Isim_Eslesmesi' | 'DaireKodu' | 'Manuel';
}

interface ResidentUnit {
  id: string;
  number: string;
  ownerName: string;
  totalDebt: number;
}

export default function BankSyncPage() {
  const [bankTxs, setBankTxs] = useState<BankSyncItem[]>([]);
  const [units, setUnits] = useState<ResidentUnit[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Match State
  const [selectedTxForMatch, setSelectedTxForMatch] = useState<BankSyncItem | null>(null);
  const [selectedUnitIdForMatch, setSelectedUnitIdForMatch] = useState('');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Load mock data
  const loadData = () => {
    // Bank Transactions
    const savedBankTxs = localStorage.getItem('site_bank_sync_txs');
    if (savedBankTxs) {
      setBankTxs(JSON.parse(savedBankTxs));
    } else {
      const defaultBankTxs: BankSyncItem[] = [
        { id: 'btx-1', transactionRef: 'FT987612', transactionDate: '2026-06-28T09:15:00Z', amount: 1500, senderName: 'Ahmet Yılmaz', description: 'A-1 HAZIRAN AIDAT', status: 'Eslesti', matchedResidentName: 'Ahmet Yılmaz', matchedUnitNumber: 'A-1', matchCriteria: 'DaireKodu' },
        { id: 'btx-2', transactionRef: 'FT987613', transactionDate: '2026-06-28T10:30:00Z', amount: 240, senderName: 'Ali Yıldırım', description: 'B1 ELEKTRIK FARK', status: 'Eslesti', matchedResidentName: 'Ali Yıldırım', matchedUnitNumber: 'B-1', matchCriteria: 'DaireKodu' },
        { id: 'btx-3', transactionRef: 'FT987614', transactionDate: '2026-06-29T11:00:00Z', amount: 4500, senderName: 'ZEYNEP KAYA', description: 'KAYA HESAP ODEMESI', status: 'Manuel_Incelemede' },
        { id: 'btx-4', transactionRef: 'FT987615', transactionDate: '2026-06-29T12:00:00Z', amount: 6200, senderName: 'Fatma Arslan', description: 'BLOK B NO 2 ENTEGRE AİDAT', status: 'Eslesti', matchedResidentName: 'Fatma Arslan', matchedUnitNumber: 'B-2', matchCriteria: 'Isim_Eslesmesi' },
        { id: 'btx-5', transactionRef: 'FT987616', transactionDate: '2026-06-30T15:20:00Z', amount: 1500, senderName: 'KEMAL YURT', description: 'AIDAT ODEME DETAYSIZ', status: 'Manuel_Incelemede' }
      ];
      localStorage.setItem('site_bank_sync_txs', JSON.stringify(defaultBankTxs));
      setBankTxs(defaultBankTxs);
    }

    // Units for Manual Matching dropdown
    const savedUnits = localStorage.getItem('site_units_report');
    if (savedUnits) {
      setUnits(JSON.parse(savedUnits));
    } else {
      const defaultUnits: ResidentUnit[] = [
        { id: 'u-1', number: 'A-1', ownerName: 'Ahmet Yılmaz', totalDebt: 1500 },
        { id: 'u-2', number: 'A-2', ownerName: 'Mehmet Kaya', totalDebt: 0 },
        { id: 'u-3', number: 'A-3', ownerName: 'Zeynep Kaya', totalDebt: 4500 },
        { id: 'u-4', number: 'B-1', ownerName: 'Ali Yıldırım', totalDebt: 240 },
        { id: 'u-5', number: 'B-2', ownerName: 'Fatma Arslan', totalDebt: 6200 },
        { id: 'u-6', number: 'B-3', ownerName: 'Mustafa Şahin', totalDebt: 0 }
      ];
      setUnits(defaultUnits);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const saveState = (updatedTxs: BankSyncItem[]) => {
    setBankTxs(updatedTxs);
    localStorage.setItem('site_bank_sync_txs', JSON.stringify(updatedTxs));
    window.dispatchEvent(new Event('storage'));
  };

  // Re-run Bank Sync simulation
  const handleSyncWithBank = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Banka web servis senkronizasyonu tamamlandı. 2 yeni hareket eklendi.');
      
      const newItems: BankSyncItem[] = [
        { id: `btx-${Date.now()}-1`, transactionRef: `FT${Math.floor(100000 + Math.random() * 900000)}`, transactionDate: new Date().toISOString(), amount: 1500, senderName: 'Mehmet Kaya', description: 'A-2 Haziran Aidatı', status: 'Eslesti', matchedResidentName: 'Mehmet Kaya', matchedUnitNumber: 'A-2', matchCriteria: 'DaireKodu' },
        { id: `btx-${Date.now()}-2`, transactionRef: `FT${Math.floor(100000 + Math.random() * 900000)}`, transactionDate: new Date().toISOString(), amount: 1800, senderName: 'HUSEYIN DEMIR', description: 'DEKONT 76543', status: 'Manuel_Incelemede' }
      ];

      saveState([...newItems, ...bankTxs]);
    }, 1500);
  };

  const parseCSVContent = (text: string) => {
    try {
      const lines = text.split('\n');
      const newItems: BankSyncItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(';');
        if (parts.length < 4) continue;

        const [dateStr, amountStr, sender, desc] = parts;
        const amountVal = Number(amountStr.replace(',', '.'));

        if (isNaN(amountVal) || amountVal <= 0) continue;

        // Auto Match Logic (Frontend Simulation)
        let status: 'Eslesti' | 'Manuel_Incelemede' = 'Manuel_Incelemede';
        let matchedName = '';
        let matchedUnit = '';
        let criteria: any = undefined;

        // Simple matching logic based on description containing unit number
        const daireMatch = desc.match(/(A|B)\s?-?\s?\d+/i);
        if (daireMatch) {
          const matchStr = daireMatch[0].toUpperCase().replace(' ', '');
          const foundUnit = units.find(u => u.number === matchStr);
          if (foundUnit) {
            status = 'Eslesti';
            matchedName = foundUnit.ownerName;
            matchedUnit = foundUnit.number;
            criteria = 'DaireKodu';
          }
        } else if (sender.toUpperCase().includes('KAYA') || sender.toUpperCase().includes('YILMAZ')) {
          const foundUnit = units.find(u => sender.toUpperCase().includes(u.ownerName.split(' ')[0].toUpperCase()));
          if (foundUnit) {
            status = 'Eslesti';
            matchedName = foundUnit.ownerName;
            matchedUnit = foundUnit.number;
            criteria = 'Isim_Eslesmesi';
          }
        }

        newItems.push({
          id: `btx-csv-${Date.now()}-${i}`,
          transactionRef: `CSV${Math.floor(100000 + Math.random() * 900000)}`,
          transactionDate: new Date(dateStr || Date.now()).toISOString(),
          amount: amountVal,
          senderName: sender,
          description: desc,
          status,
          matchedResidentName: matchedName || undefined,
          matchedUnitNumber: matchedUnit || undefined,
          matchCriteria: criteria
        });
      }

      if (newItems.length > 0) {
        saveState([...newItems, ...bankTxs]);
        toast.success(`${newItems.length} adet yeni banka hareketi başarıyla yüklendi ve işlendi.`);
        setIsUploadModalOpen(false);
      } else {
        toast.error('Geçerli bir veri satırı bulunamadı. Lütfen CSV formatını kontrol edin.');
      }
    } catch (err) {
      toast.error('CSV dosyası ayrıştırılırken hata oluştu.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCSVContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleUploadDemoCSV = () => {
    const demoCsvText = `Tarih;Tutar;Gönderici;Açıklama
2026-07-01;1500;Zeynep Kaya;A-3 Haziran Dairesi
2026-07-01;240;Ali Yıldırım;B-1 Ortak Alan
2026-07-01;750;Kemal Arslan;Detaysiz Transfer`;
    
    parseCSVContent(demoCsvText);
  };

  // Handle Manual Match Submit
  const handleManualMatchConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForMatch || !selectedUnitIdForMatch) return;

    const matchedUnit = units.find(u => u.id === selectedUnitIdForMatch);
    if (!matchedUnit) return;

    // Update status to matched
    const updatedTxs = bankTxs.map(t => {
      if (t.id === selectedTxForMatch.id) {
        return {
          ...t,
          status: 'Eslesti' as const,
          matchedResidentName: matchedUnit.ownerName,
          matchedUnitNumber: matchedUnit.number,
          matchCriteria: 'Manuel' as const
        };
      }
      return t;
    });

    // Update unit's outstanding debt
    const savedUnits = localStorage.getItem('site_units_report');
    if (savedUnits) {
      const allUnits = JSON.parse(savedUnits);
      const updatedUnits = allUnits.map((u: any) => {
        if (u.id === matchedUnit.id) {
          const currentDebt = u.totalDebt;
          return {
            ...u,
            totalDebt: Math.max(0, currentDebt - selectedTxForMatch.amount),
            paidAmount: u.paidAmount + selectedTxForMatch.amount,
            lastPaymentDate: new Date().toISOString().split('T')[0]
          };
        }
        return u;
      });
      localStorage.setItem('site_units_report', JSON.stringify(updatedUnits));
    }

    // Auto post payment transaction to Kasa & Banka account (Garanti Bankası Hesabı acc-2)
    const savedAccs = localStorage.getItem('site_payment_accounts');
    const savedSiteTxs = localStorage.getItem('site_account_transactions');
    if (savedAccs && savedSiteTxs) {
      const allAccs = JSON.parse(savedAccs);
      const allSiteTxs = JSON.parse(savedSiteTxs);

      const targetAccId = 'acc-2'; // Garanti BBVA bank account
      
      const newTransaction = {
        id: `tx-${Date.now()}-bank`,
        accountId: targetAccId,
        type: 'TAHSILAT',
        amount: selectedTxForMatch.amount,
        direction: 'giris',
        description: `Banka Entegrasyon (Manuel): ${matchedUnit.number} ${matchedUnit.ownerName}`,
        transactionDate: new Date().toISOString(),
        category: 'Aidat'
      };

      const updatedAccs = allAccs.map((a: any) => {
        if (a.id === targetAccId) {
          return { ...a, balance: a.balance + selectedTxForMatch.amount };
        }
        return a;
      });

      localStorage.setItem('site_payment_accounts', JSON.stringify(updatedAccs));
      localStorage.setItem('site_account_transactions', JSON.stringify([newTransaction, ...allSiteTxs]));
    }

    saveState(updatedTxs);
    toast.success(`${selectedTxForMatch.senderName} ödemesi ${matchedUnit.number} dairesiyle manuel eşleştirildi ve cari hesaba işlendi.`);
    
    // Close modal
    setSelectedTxForMatch(null);
    setSelectedUnitIdForMatch('');
  };

  // Calculations
  const stats = useMemo(() => {
    const totalCount = bankTxs.length;
    const matchedCount = bankTxs.filter(t => t.status === 'Eslesti').length;
    const unmatchedCount = bankTxs.filter(t => t.status === 'Manuel_Incelemede').length;
    const totalAmountMatched = bankTxs.filter(t => t.status === 'Eslesti').reduce((s, t) => s + t.amount, 0);

    return { totalCount, matchedCount, unmatchedCount, totalAmountMatched };
  }, [bankTxs]);

  // Filtered List
  const filteredTxs = useMemo(() => {
    return bankTxs.filter(t => {
      // Tab filter
      if (activeTab === 'matched' && t.status !== 'Eslesti') return false;
      if (activeTab === 'unmatched' && t.status !== 'Manuel_Incelemede') return false;

      // Search filter
      const matchesSearch = t.senderName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.transactionRef.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [bankTxs, activeTab, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/yonetici/dashboard"
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Yönetici Paneline Dön
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Banka Entegrasyon
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Banka hesap hareketlerinin otomatik veya dosya bazlı içe aktarımı ve sakinlerle eşleştirilmesi
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncWithBank}
              disabled={isSyncing}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all"
            >
              <RefreshCw className={`mr-2 h-4 w-4 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Senkronize Ediliyor...' : 'Bankayı Güncelle (API)'}
            </button>
            
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shrink-0"
            >
              <Upload className="mr-2 h-4 w-4" />
              Dekont Yükle (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Card Row */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-4">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Otomatik Eşleşen</p>
            <h3 className="text-2xl font-black text-emerald-500 mt-1">
              {stats.matchedCount} Adet
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Manuel Eşleme Bekleyen</p>
            <h3 className="text-2xl font-black text-rose-500 mt-1">
              {stats.unmatchedCount} Adet
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Eşleşen Hacim (Toplam)</p>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(stats.totalAmountMatched)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <ArrowRightLeft className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Banka API Bağlantısı</p>
            <h3 className="text-sm font-black text-emerald-500 mt-2 block">
              Aktif / Senkronize
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[var(--border-color)] pb-px gap-6">
        {[
          { id: 'all', label: 'Tüm Hesap Hareketleri' },
          { id: 'matched', label: 'Otomatik Eşleşenler' },
          { id: 'unmatched', label: 'Eşleşmeyenler (Manuel İnceleme)' }
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

      {/* Search Filter Area */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-secondary)] shadow-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Dekont no, gönderen adı veya açıklama ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Bank Transactions Table */}
      <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm bg-[var(--bg-secondary)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-4">Dekont Ref</th>
                <th className="p-4">Tarih</th>
                <th className="p-4">Gönderen Hesap</th>
                <th className="p-4">Banka Açıklaması</th>
                <th className="p-4 text-right">Tutar</th>
                <th className="p-4">Eşleşen Daire / Kriter</th>
                <th className="p-4 text-center">Durum</th>
                <th className="p-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/40">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-xs text-[var(--text-tertiary)]">
                    Kriterlere uygun banka hareketi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((t) => (
                  <tr key={t.id} className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/10 text-xs">
                    <td className="p-4 font-mono font-bold text-[var(--text-primary)]">{t.transactionRef}</td>
                    <td className="p-4 text-[var(--text-tertiary)]">{formatDate(t.transactionDate)}</td>
                    <td className="p-4 font-bold text-[var(--text-primary)]">{t.senderName}</td>
                    <td className="p-4 italic text-[var(--text-secondary)]">{t.description}</td>
                    <td className="p-4 text-right font-bold text-[var(--text-primary)]">{formatCurrency(t.amount)}</td>
                    <td className="p-4">
                      {t.status === 'Eslesti' ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-[var(--text-primary)] block">Daire {t.matchedUnitNumber} ({t.matchedResidentName})</span>
                          <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-semibold">
                            Kriter: {t.matchCriteria === 'DaireKodu' ? 'Daire Kodu' : t.matchCriteria === 'Isim_Eslesmesi' ? 'İsim Benzerliği' : t.matchCriteria}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)] italic">Eşleşme Yok</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        t.status === 'Eslesti' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}>
                        {t.status === 'Eslesti' ? 'Eşleşti' : 'İnceleme Gerekli'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {t.status !== 'Eslesti' ? (
                        <button
                          onClick={() => setSelectedTxForMatch(t)}
                          className="rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 font-bold text-white shadow-sm"
                        >
                          Manuel Eşleştir
                        </button>
                      ) : (
                        <span className="text-emerald-500 font-bold flex items-center justify-end gap-1">
                          <Check className="h-4 w-4" /> Eşleşti
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL RECONCILIATION MODAL */}
      {selectedTxForMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Manuel Ödeme Mutabakatı</h3>
              <button 
                onClick={() => {
                  setSelectedTxForMatch(null);
                  setSelectedUnitIdForMatch('');
                }}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualMatchConfirm} className="space-y-4 pt-4 text-xs">
              
              <div className="my-2 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Banka İşlem Ref:</span>
                  <strong className="text-[var(--text-primary)] font-mono">{selectedTxForMatch.transactionRef}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Gönderen Adı:</span>
                  <strong className="text-[var(--text-primary)]">{selectedTxForMatch.senderName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Banka Açıklama:</span>
                  <strong className="text-[var(--text-primary)] italic">"{selectedTxForMatch.description}"</strong>
                </div>
                <div className="flex justify-between border-t border-[var(--border-color)]/50 pt-1.5 mt-1.5">
                  <span className="text-[var(--text-secondary)]">Tutar:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">{formatCurrency(selectedTxForMatch.amount)}</strong>
                </div>
              </div>

              {/* Daire Seçimi */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Eşleştirilecek Daire / Sakin *
                </label>
                <select
                  value={selectedUnitIdForMatch}
                  required
                  onChange={(e) => setSelectedUnitIdForMatch(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="">Seçiniz...</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      Daire {unit.number} - {unit.ownerName} (Kalan Borç: {formatCurrency(unit.totalDebt)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--border-color)]/30 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTxForMatch(null);
                    setSelectedUnitIdForMatch('');
                  }}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  Eşleşmeyi Onayla & Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CSV UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Banka Hesap Ekstresi Yükle (CSV)</h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                <p className="font-semibold">Desteklenen CSV Dosya Şablonu:</p>
                <p className="mt-1 leading-relaxed">
                  CSV dosyasının ilk satırı başlık olmalıdır. Kolonlar noktalı virgül (;) ile ayrılmalıdır:
                  <br />
                  <code className="font-mono text-[10px] bg-amber-500/10 px-1 py-0.5 rounded block mt-1">
                    Tarih;Tutar;Gönderici;Açıklama
                  </code>
                </p>
              </div>

              {/* Hidden Native File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] py-8 font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                >
                  <Upload className="h-6 w-6 text-indigo-500" />
                  <span>Bilgisayardan CSV Seçin...</span>
                </button>

                <div className="flex items-center justify-center text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
                  <span>Veya Test İçin</span>
                </div>

                <button
                  type="button"
                  onClick={handleUploadDemoCSV}
                  className="w-full rounded-xl bg-indigo-50/50 hover:bg-indigo-100/50 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 py-2.5 font-bold text-indigo-600 dark:text-indigo-400"
                >
                  Hazır Örnek Şablon Yükle (Demo)
                </button>
              </div>

              <div className="pt-4 flex justify-end border-t border-[var(--border-color)]/30 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
