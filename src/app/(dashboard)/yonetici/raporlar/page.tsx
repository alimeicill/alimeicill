'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  ArrowLeft, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  UserX, 
  Scale, 
  MessageSquare, 
  Info,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  ChevronRight,
  Landmark,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// Interfaces matching system entities
interface UnitReportItem {
  id: string;
  number: string;
  blockName: string;
  ownerName: string;
  tenantName?: string;
  totalDebt: number;
  paidAmount: number;
  lastPaymentDate?: string;
  executionStatus: string; // 'Yok' | 'Icra_Takibinde' | 'Avukatta'
  executionNotes?: string;
  areaSqm: number;
}

interface PaymentAccount {
  id: string;
  name: string;
  balance: number;
}

export default function RaporlarPage() {
  const [units, setUnits] = useState<UnitReportItem[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  
  // Selected Section View: 'finance' | 'ekstre' | 'borc' | 'icra'
  const [activeSection, setActiveSection] = useState<'finance' | 'ekstre' | 'borc' | 'icra'>('finance');
  
  // Filters for Borç Dökümü
  const [blockFilter, setBlockFilter] = useState('all');
  const [debtSearch, setDebtSearch] = useState('');
  
  // Account selected for Ekstre shortcut
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [accountTransactions, setAccountTransactions] = useState<any[]>([]);

  // Legal (İcra) Modal edit state
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [newExecutionStatus, setNewExecutionStatus] = useState('Yok');
  const [newExecutionNotes, setNewExecutionNotes] = useState('');

  // Load Data
  const loadData = () => {
    // Load accounts
    const savedAccs = localStorage.getItem('site_payment_accounts');
    if (savedAccs) {
      setAccounts(JSON.parse(savedAccs));
    } else {
      const defaultAccs = [
        { id: 'acc-1', name: 'Merkez Yönetim Kasası', balance: 4500 },
        { id: 'acc-2', name: 'Garanti Bankası Aidat Hesabı', balance: 34500 },
        { id: 'acc-3', name: 'Vakıfbank Rezerv Fonu', balance: 75000 }
      ];
      setAccounts(defaultAccs);
    }

    // Load transactions for ekstre preview
    const savedTxs = localStorage.getItem('site_account_transactions');
    if (savedTxs) {
      setAccountTransactions(JSON.parse(savedTxs));
    }

    // Load units and map outstanding debt
    const savedInvoices = localStorage.getItem('site_invoices');
    const invoicesList = savedInvoices ? JSON.parse(savedInvoices) : [];

    // Let's seed units or load mock units
    const defaultUnits: UnitReportItem[] = [
      { id: 'u-1', number: 'A-1', blockName: 'A Blok', ownerName: 'Ahmet Yılmaz', totalDebt: 1500, paidAmount: 3000, lastPaymentDate: '2026-06-15', executionStatus: 'Yok', areaSqm: 110 },
      { id: 'u-2', number: 'A-2', blockName: 'A Blok', ownerName: 'Mehmet Kaya', totalDebt: 0, paidAmount: 4500, lastPaymentDate: '2026-06-14', executionStatus: 'Yok', areaSqm: 120 },
      { id: 'u-3', number: 'A-3', blockName: 'A Blok', ownerName: 'Zeynep Kaya', totalDebt: 4500, paidAmount: 0, executionStatus: 'Icra_Takibinde', executionNotes: '3 dönem aidat ödemedi. İcra takibi başlatıldı.', areaSqm: 110 },
      { id: 'u-4', number: 'B-1', blockName: 'B Blok', ownerName: 'Ali Yıldırım', totalDebt: 240, paidAmount: 4260, lastPaymentDate: '2026-06-20', executionStatus: 'Yok', areaSqm: 115 },
      { id: 'u-5', number: 'B-2', blockName: 'B Blok', ownerName: 'Fatma Arslan', totalDebt: 6200, paidAmount: 1500, lastPaymentDate: '2026-04-10', executionStatus: 'Avukatta', executionNotes: 'Avukat Süleyman Bey dosyayı yürütüyor.', areaSqm: 130 },
      { id: 'u-6', number: 'B-3', blockName: 'B Blok', ownerName: 'Mustafa Şahin', totalDebt: 0, paidAmount: 4500, lastPaymentDate: '2026-06-25', executionStatus: 'Yok', areaSqm: 115 }
    ];

    const savedUnitsData = localStorage.getItem('site_units_report');
    if (savedUnitsData) {
      setUnits(JSON.parse(savedUnitsData));
    } else {
      localStorage.setItem('site_units_report', JSON.stringify(defaultUnits));
      setUnits(defaultUnits);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const saveUnits = (updatedUnits: UnitReportItem[]) => {
    setUnits(updatedUnits);
    localStorage.setItem('site_units_report', JSON.stringify(updatedUnits));
    window.dispatchEvent(new Event('storage'));
  };

  // Calculations for financial summary
  const financeSummary = useMemo(() => {
    const totalOutstandingDebt = units.reduce((sum, u) => sum + u.totalDebt, 0);
    const totalCollected = units.reduce((sum, u) => sum + u.paidAmount, 0);
    const cashImpact = accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalBilled = totalOutstandingDebt + totalCollected;
    const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '100';

    return {
      totalOutstandingDebt,
      totalCollected,
      cashImpact,
      totalBilled,
      collectionRate
    };
  }, [units, accounts]);

  // Filtered Debt Breakdown
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchesBlock = blockFilter === 'all' || u.blockName === blockFilter;
      const matchesSearch = u.ownerName.toLowerCase().includes(debtSearch.toLowerCase()) || 
                            u.number.toLowerCase().includes(debtSearch.toLowerCase());
      return matchesBlock && matchesSearch;
    });
  }, [units, blockFilter, debtSearch]);

  // Selected Account Statement Preview
  const selectedAccountStatement = useMemo(() => {
    if (!selectedAccountId) return [];
    return accountTransactions
      .filter(t => t.accountId === selectedAccountId)
      .slice(0, 5); // Just show top 5 recent entries for preview
  }, [selectedAccountId, accountTransactions]);

  // SMS Debt Reminder Trigger
  const handleSendReminder = (unit: UnitReportItem) => {
    if (unit.totalDebt <= 0) {
      toast.error('Bu dairenin vadesi geçmiş borcu bulunmamaktadır.');
      return;
    }
    
    // Simulate SMS Trigger
    toast.success(`${unit.number} dairesi sakini ${unit.ownerName} için borç hatırlatma SMS'i başarıyla gönderildi.`);
  };

  // Save Legal Tracking (İcra) Updates
  const handleSaveExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnitId) return;

    const updated = units.map(u => {
      if (u.id === editingUnitId) {
        return {
          ...u,
          executionStatus: newExecutionStatus,
          executionNotes: newExecutionStatus === 'Yok' ? '' : newExecutionNotes
        };
      }
      return u;
    });

    saveUnits(updated);
    toast.success('Hukuki takip/icra durumu başarıyla güncellendi.');
    setEditingUnitId(null);
  };

  const handleExportToExcel = () => {
    try {
      let csvContent = "SİTE FİNANSAL RAPORU\n";
      csvContent += `Rapor Tarihi;${new Date().toLocaleDateString('tr-TR')}\n\n`;
      
      csvContent += "SİTE FİNANSAL GENEL DURUM ÖZETİ\n";
      csvContent += `Toplam Tahakkuk;${financeSummary.totalBilled} TL\n`;
      csvContent += `Toplam Tahsil Edilen;${financeSummary.totalCollected} TL\n`;
      csvContent += `Geciken Sakin Borcu;${financeSummary.totalOutstandingDebt} TL\n`;
      csvContent += `Mevcut Nakit Varlıkları;${financeSummary.cashImpact} TL\n`;
      csvContent += `Tahsilat Başarı Oranı;%${financeSummary.collectionRate}\n\n`;

      csvContent += "DAİRE DETAYLI BORÇ DÖKÜM LİSTESİ\n";
      csvContent += "Daire No;Blok;Sakin Adı;Kalan Borç (TL);Ödenen Tutar (TL);Hukuki Durum\n";
      
      units.forEach(u => {
        csvContent += `${u.number};${u.blockName};${u.ownerName};${u.totalDebt};${u.paidAmount};${u.executionStatus === 'Yok' ? 'Yok' : u.executionStatus}\n`;
      });

      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `apartman_finans_raporu_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Finansal Rapor Excel (CSV) formatında başarıyla indirildi.');
    } catch (err) {
      toast.error('Rapor dışa aktarılırken bir hata oluştu.');
    }
  };

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
              Yönetici Finansal Raporları
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Daire borç dökümleri, kasa/banka nakit akışı ve hukuki/icra takip merkezi
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleExportToExcel}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all"
            >
              <Download className="mr-2 h-4 w-4 text-indigo-500" />
              Tümünü Excel'e Aktar
            </button>
            
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shrink-0"
            >
              <Printer className="mr-2 h-4 w-4" />
              Yazdır
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats: Site Finans Özeti */}
      <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-500" />
          <span>Site Finansal Genel Durum Özeti</span>
        </h3>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <span className="block text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Toplam Tahakkuk</span>
            <strong className="text-base font-extrabold text-[var(--text-primary)] mt-0.5 block">
              {formatCurrency(financeSummary.totalBilled)}
            </strong>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <span className="block text-[10px] text-[var(--text-tertiary)] uppercase font-semibold text-emerald-500">Toplam Tahsil Edilen</span>
            <strong className="text-base font-extrabold text-emerald-500 mt-0.5 block">
              {formatCurrency(financeSummary.totalCollected)}
            </strong>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <span className="block text-[10px] text-[var(--text-tertiary)] uppercase font-semibold text-rose-500">Geciken Sakin Borcu</span>
            <strong className="text-base font-extrabold text-rose-500 mt-0.5 block">
              {formatCurrency(financeSummary.totalOutstandingDebt)}
            </strong>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <span className="block text-[10px] text-[var(--text-tertiary)] uppercase font-semibold text-indigo-500">Nakit Varlıkları (Mevcut)</span>
            <strong className="text-base font-extrabold text-indigo-500 mt-0.5 block">
              {formatCurrency(financeSummary.cashImpact)}
            </strong>
          </div>
        </div>

        {/* Progress Bar for collection rate */}
        <div className="space-y-2 border-t border-[var(--border-color)]/50 pt-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--text-secondary)] font-semibold">Tahsilat Başarı Oranı:</span>
            <strong className="text-indigo-500 font-extrabold">{financeSummary.collectionRate}%</strong>
          </div>
          <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]/60">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${financeSummary.collectionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Shortcuts Center Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        {[
          { id: 'finance', label: 'Site Finans Özeti', desc: 'Genel tahsilat ve nakit bilançosu', icon: BarChart3 },
          { id: 'borc', label: 'Daire Borç Dökümü', desc: 'Sakinlere ait borçlar ve SMS takibi', icon: UserX },
          { id: 'icra', label: 'Hukuki Takip (İcra)', desc: 'Avukatlık/İcra durumundaki daireler', icon: Scale },
          { id: 'ekstre', label: 'Banka Ekstre Sorgu', desc: 'Hesap bazlı son hareket detayları', icon: Landmark }
        ].map((sec) => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                activeSection === sec.id 
                  ? 'border-indigo-500 bg-indigo-500/5 shadow-sm' 
                  : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]/20'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`p-2 rounded-xl ${activeSection === sec.id ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
              </div>
              <div className="mt-4">
                <h4 className="font-extrabold text-[var(--text-primary)] text-xs">{sec.label}</h4>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">{sec.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: Finance summary detailed metrics */}
      {activeSection === 'finance' && (
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/50 pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Banka Kasa Hesap Varlıkları</h3>
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold">Toplam: {formatCurrency(financeSummary.cashImpact)}</span>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {accounts.map(acc => (
              <div key={acc.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 flex items-center justify-between">
                <div>
                  <strong className="text-[var(--text-primary)] text-xs block">{acc.name}</strong>
                  <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5 block">Güncel Bakiye</span>
                </div>
                <span className="text-sm font-extrabold text-indigo-500">{formatCurrency(acc.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Daire Borç Dökümü (Debt breakdown) */}
      {activeSection === 'borc' && (
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)]/50 pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Daire Bazlı Aidat ve Borç Durumu</h3>
            
            {/* Table Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <input 
                  type="text" 
                  placeholder="Daire no veya isim..."
                  value={debtSearch}
                  onChange={(e) => setDebtSearch(e.target.value)}
                  className="pl-7 pr-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <select 
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 text-[var(--text-primary)] focus:outline-none"
              >
                <option value="all">Tüm Bloklar</option>
                <option value="A Blok">A Blok</option>
                <option value="B Blok">B Blok</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]/15">
                  <th className="p-3">Daire No</th>
                  <th className="p-3">Sakin / Kat Malik</th>
                  <th className="p-3">Daire Alanı (m²)</th>
                  <th className="p-3 text-right">Ödenen Toplam</th>
                  <th className="p-3 text-right text-rose-500">Ödenmemiş Borç</th>
                  <th className="p-3">Hukuki Durum</th>
                  <th className="p-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/40">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-tertiary)]">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map(unit => (
                    <tr key={unit.id} className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/10">
                      <td className="p-3 font-bold text-[var(--text-primary)]">{unit.number}</td>
                      <td className="p-3">{unit.ownerName}</td>
                      <td className="p-3 font-mono">{unit.areaSqm} m²</td>
                      <td className="p-3 text-right text-emerald-500 font-semibold">{formatCurrency(unit.paidAmount)}</td>
                      <td className={`p-3 text-right font-bold ${unit.totalDebt > 0 ? 'text-rose-500' : 'text-[var(--text-tertiary)]'}`}>
                        {formatCurrency(unit.totalDebt)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          unit.executionStatus === 'Yok' 
                            ? 'bg-slate-100 text-slate-700' 
                            : unit.executionStatus === 'Icra_Takibinde' 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {unit.executionStatus === 'Yok' ? 'Temiz' : unit.executionStatus === 'Icra_Takibinde' ? 'İcrada' : 'Avukatta'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingUnitId(unit.id);
                            setNewExecutionStatus(unit.executionStatus);
                            setNewExecutionNotes(unit.executionNotes || '');
                          }}
                          className="rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] px-2 py-1 text-[10px] text-[var(--text-secondary)] font-semibold"
                        >
                          Hukuki Durum
                        </button>
                        <button
                          onClick={() => handleSendReminder(unit)}
                          className="rounded-lg bg-indigo-500 hover:bg-indigo-600 px-2 py-1 text-[10px] text-white font-semibold flex-inline items-center"
                        >
                          SMS Hatırlat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: Hukuki Takip (Legal/Icra tracking) */}
      {activeSection === 'icra' && (
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/50 pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">İcra ve Avukatlık Takip Dosyaları</h3>
            <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-bold">
              {units.filter(u => u.executionStatus !== 'Yok').length} Aktif Dosya
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {units.filter(u => u.executionStatus !== 'Yok').map(unit => (
              <div 
                key={unit.id} 
                className="rounded-xl border border-rose-200/60 dark:border-rose-950/40 bg-rose-50/10 dark:bg-rose-950/5 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[var(--border-color)]/50 pb-2 mb-3">
                    <strong className="text-sm text-[var(--text-primary)]">{unit.number} - {unit.ownerName}</strong>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      unit.executionStatus === 'Icra_Takibinde' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {unit.executionStatus === 'Icra_Takibinde' ? 'İCRA TAKİBİNDE' : 'AVUKATTA'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Dosya Alacak Tutarı:</span>
                      <strong className="text-rose-500 font-extrabold">{formatCurrency(unit.totalDebt)}</strong>
                    </div>
                    <div className="pt-2 border-t border-[var(--border-color)]/30 mt-2">
                      <span className="block text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Takip Notları / Avukat Bilgisi</span>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 italic">
                        {unit.executionNotes || 'Dosya ile ilgili detaylı not girilmemiş.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-color)]/40 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingUnitId(unit.id);
                      setNewExecutionStatus(unit.executionStatus);
                      setNewExecutionNotes(unit.executionNotes || '');
                    }}
                    className="rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] px-3 py-1 text-[10px] font-bold text-[var(--text-secondary)]"
                  >
                    Dosyayı Düzenle
                  </button>
                  
                  <button
                    onClick={() => handleSendReminder(unit)}
                    className="rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    SMS Bildirim
                  </button>
                </div>
              </div>
            ))}
            
            {units.filter(u => u.executionStatus !== 'Yok').length === 0 && (
              <div className="col-span-2 py-8 text-center text-xs text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <span>Şu anda hukuki veya icra takibinde olan daire bulunmamaktadır.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: Banka Ekstre Sorgulama */}
      {activeSection === 'ekstre' && (
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)]/50 pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Hesap Bazlı Ekstre Detayları</h3>
            
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] font-bold focus:outline-none"
            >
              <option value="">Seçilecek Ödeme Hesabı</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} (Bakiye: {formatCurrency(acc.balance)})</option>
              ))}
            </select>
          </div>

          {selectedAccountId ? (
            <div className="space-y-4">
              <span className="block text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Son 5 Hesap Hareketi</span>
              <div className="border border-[var(--border-color)]/70 rounded-xl overflow-hidden bg-[var(--bg-primary)]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[9px] font-bold text-[var(--text-secondary)]">
                      <th className="p-3">Tarih</th>
                      <th className="p-3">Açıklama</th>
                      <th className="p-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]/40">
                    {selectedAccountStatement.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-[var(--text-tertiary)]">
                          Bu hesaba ait son hareket bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      selectedAccountStatement.map(tx => (
                        <tr key={tx.id} className="text-[var(--text-secondary)] text-xs hover:bg-[var(--bg-tertiary)]/5">
                          <td className="p-3 text-[10px] text-[var(--text-tertiary)]">{formatDate(tx.transactionDate)}</td>
                          <td className="p-3">{tx.description}</td>
                          <td className={`p-3 text-right font-bold ${tx.direction === 'giris' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tx.direction === 'giris' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)] flex flex-col items-center justify-center space-y-1">
              <Info className="h-5 w-5 text-[var(--text-tertiary)] opacity-60" />
              <span>Lütfen yukarıdaki menüden hareketlerini görmek istediğiniz ödeme hesabını seçiniz.</span>
            </div>
          )}
        </div>
      )}

      {/* EDIT LEGAL MODAL */}
      {editingUnitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Hukuki Takip / İcra Bilgisi Düzenle</h3>
              <button 
                onClick={() => setEditingUnitId(null)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExecution} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Takip Durumu</label>
                <select
                  value={newExecutionStatus}
                  onChange={(e) => setNewExecutionStatus(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="Yok">Dosya Yok / Normal</option>
                  <option value="Icra_Takibinde">İcra Takibinde</option>
                  <option value="Avukatta">Avukatta / Arabulucuda</option>
                </select>
              </div>

              {newExecutionStatus !== 'Yok' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Dosya Notu / Detaylar</label>
                  <textarea
                    required
                    rows={4}
                    value={newExecutionNotes}
                    onChange={(e) => setNewExecutionNotes(e.target.value)}
                    placeholder="Avukat dosya no, arabulucu görüşme notları veya icra dairesi bilgilerini giriniz..."
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--border-color)]/30 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUnitId(null)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
