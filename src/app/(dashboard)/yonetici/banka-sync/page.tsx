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
  Check,
  RefreshCw,
  HelpCircle,
  CornerUpLeft,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface BankMovement {
  id: string;
  transactionRef: string;
  transactionDate: string;
  amount: number;
  senderName: string;
  description: string;
  classification: 'MEMBER_COLLECTION' | 'EXTERNAL_COLLECTION' | 'EXPENSE_PAYMENT' | 'VENDOR_PAYMENT' | 'STAFF_PAYMENT' | 'TRANSFER';
  status: 'UNMATCHED' | 'MATCHED_AUTO' | 'MATCHED_MANUAL' | 'ROLLBACKED';
  matchedResidentId?: string;
  matchedApartmentId?: string;
  matchedDueId?: string;
  confidenceScore?: number;
  matchedBy?: string;
  matchedAt?: string;
}

interface ResidentUnit {
  id: string;
  number: string;
  ownerName: string;
  totalDebt: number;
}

export default function BankSyncPage() {
  const [bankTxs, setBankTxs] = useState<BankMovement[]>([]);
  const [units, setUnits] = useState<ResidentUnit[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  
  // CSV Import States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    dateIndex: 0,
    amountIndex: 1,
    senderIndex: 2,
    descriptionIndex: 3
  });
  const [showMappingPanel, setShowMappingPanel] = useState(false);

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Match State
  const [selectedTxForMatch, setSelectedTxForMatch] = useState<BankMovement | null>(null);
  const [selectedUnitIdForMatch, setSelectedUnitIdForMatch] = useState('');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Load mock/local storage data
  const loadData = () => {
    // Bank Transactions
    const savedBankTxs = localStorage.getItem('site_bank_sync_txs');
    if (savedBankTxs) {
      setBankTxs(JSON.parse(savedBankTxs));
    } else {
      const defaultBankTxs: BankMovement[] = [
        { 
          id: 'btx-1', 
          transactionRef: 'FT987612', 
          transactionDate: '2026-06-28T09:15:00Z', 
          amount: 1500, 
          senderName: 'Ahmet Yılmaz', 
          description: 'A-1 HAZIRAN AIDAT', 
          classification: 'MEMBER_COLLECTION',
          status: 'MATCHED_AUTO', 
          matchedApartmentId: 'u-1',
          matchedDueId: 'due-1',
          confidenceScore: 100,
          matchedBy: 'SYSTEM',
          matchedAt: '2026-06-28T09:15:00Z'
        },
        { 
          id: 'btx-2', 
          transactionRef: 'FT987613', 
          transactionDate: '2026-06-28T10:30:00Z', 
          amount: 240, 
          senderName: 'Ali Yıldırım', 
          description: 'B1 ELEKTRIK FARK', 
          classification: 'MEMBER_COLLECTION',
          status: 'MATCHED_AUTO', 
          matchedApartmentId: 'u-4',
          matchedDueId: 'due-4',
          confidenceScore: 100,
          matchedBy: 'SYSTEM',
          matchedAt: '2026-06-28T10:30:00Z'
        },
        { 
          id: 'btx-3', 
          transactionRef: 'FT987614', 
          transactionDate: '2026-06-29T11:00:00Z', 
          amount: 4500, 
          senderName: 'ZEYNEP KAYA', 
          description: 'KAYA HESAP ODEMESI', 
          classification: 'MEMBER_COLLECTION',
          status: 'UNMATCHED' 
        },
        { 
          id: 'btx-4', 
          transactionRef: 'FT987615', 
          transactionDate: '2026-06-29T12:00:00Z', 
          amount: 6200, 
          senderName: 'Fatma Arslan', 
          description: 'BLOK B NO 2 ENTEGRE AİDAT', 
          classification: 'MEMBER_COLLECTION',
          status: 'MATCHED_AUTO', 
          matchedApartmentId: 'u-5',
          matchedDueId: 'due-5',
          confidenceScore: 75,
          matchedBy: 'SYSTEM',
          matchedAt: '2026-06-29T12:00:00Z'
        },
        { 
          id: 'btx-5', 
          transactionRef: 'FT987616', 
          transactionDate: '2026-06-30T15:20:00Z', 
          amount: 1500, 
          senderName: 'KEMAL YURT', 
          description: 'AIDAT ODEME DETAYSIZ', 
          classification: 'MEMBER_COLLECTION',
          status: 'UNMATCHED' 
        }
      ];
      localStorage.setItem('site_bank_sync_txs', JSON.stringify(defaultBankTxs));
      setBankTxs(defaultBankTxs);
    }

    // Units for manual match list
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

  const saveState = (updatedTxs: BankMovement[]) => {
    setBankTxs(updatedTxs);
    localStorage.setItem('site_bank_sync_txs', JSON.stringify(updatedTxs));
    window.dispatchEvent(new Event('storage'));
  };

  // 1. Fetch Movements from Bank API
  const handleSyncWithBank = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      
      const newItems: BankMovement[] = [
        { 
          id: `btx-${Date.now()}-1`, 
          transactionRef: `FT${Math.floor(100000 + Math.random() * 900000)}`, 
          transactionDate: new Date().toISOString(), 
          amount: 1500, 
          senderName: 'Mehmet Kaya', 
          description: 'A-2 Haziran Aidatı', 
          classification: 'MEMBER_COLLECTION',
          status: 'UNMATCHED'
        },
        { 
          id: `btx-${Date.now()}-2`, 
          transactionRef: `FT${Math.floor(100000 + Math.random() * 900000)}`, 
          transactionDate: new Date().toISOString(), 
          amount: 1800, 
          senderName: 'HUSEYIN DEMIR', 
          description: 'DEKONT 76543', 
          classification: 'MEMBER_COLLECTION',
          status: 'UNMATCHED'
        }
      ];

      saveState([...newItems, ...bankTxs]);
      toast.success('Banka web servis senkronizasyonu tamamlandı. 2 yeni hareket eklendi.');
      
      // Auto run matching engine after sync
      handleAutoReconcile();
    }, 1500);
  };

  // 2. Auto Reconciliation Engine
  const handleAutoReconcile = () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      
      // Run automatic reconciliation simulation
      const updatedTxs = bankTxs.map(tx => {
        if (tx.status !== 'UNMATCHED') return tx;

        // Daire Kodu Match
        const descMatch = tx.description.match(/(A|B)\s?-?\s?\d+/i);
        if (descMatch) {
          const matchStr = descMatch[0].toUpperCase().replace(' ', '');
          const foundUnit = units.find(u => u.number === matchStr);
          if (foundUnit) {
            return {
              ...tx,
              status: 'MATCHED_AUTO' as const,
              matchedApartmentId: foundUnit.id,
              confidenceScore: 100,
              matchedBy: 'SYSTEM',
              matchedAt: new Date().toISOString()
            };
          }
        }

        // Name match
        const foundUnitByName = units.find(u => tx.senderName.toUpperCase().includes(u.ownerName.split(' ')[0].toUpperCase()));
        if (foundUnitByName) {
          return {
            ...tx,
            status: 'MATCHED_AUTO' as const,
            matchedApartmentId: foundUnitByName.id,
            confidenceScore: 75,
            matchedBy: 'SYSTEM',
            matchedAt: new Date().toISOString()
          };
        }

        return tx;
      });

      // Post payments to units
      const matchedDiff = updatedTxs.filter((t, idx) => t.status === 'MATCHED_AUTO' && bankTxs[idx].status === 'UNMATCHED');
      if (matchedDiff.length > 0) {
        const savedUnits = localStorage.getItem('site_units_report');
        if (savedUnits) {
          const allUnits = JSON.parse(savedUnits);
          matchedDiff.forEach(m => {
            const unitIndex = allUnits.findIndex((u: any) => u.id === m.matchedApartmentId);
            if (unitIndex !== -1) {
              allUnits[unitIndex].totalDebt = Math.max(0, allUnits[unitIndex].totalDebt - m.amount);
            }
          });
          localStorage.setItem('site_units_report', JSON.stringify(allUnits));
        }
        toast.success(`Akıllı eşleştirme motoru çalıştı: ${matchedDiff.length} hareket otomatik eşleştirildi!`);
      } else {
        toast.info('Eşleştirme motoru çalıştı ancak yeni eşleşme bulunamadı.');
      }

      saveState(updatedTxs);
    }, 1200);
  };

  // 3. Classification update handler
  const handleUpdateClassification = (id: string, value: any) => {
    const updated = bankTxs.map(t => t.id === id ? { ...t, classification: value } : t);
    saveState(updated);
    toast.success('İşlem tipi sınıflandırması güncellendi.');
  };

  // 4. Undo Match handler
  const handleUndoMatch = (tx: BankMovement) => {
    // 1. Reset movement status to unmatched
    const updated = bankTxs.map(t => {
      if (t.id === tx.id) {
        return {
          ...t,
          status: 'UNMATCHED' as const,
          matchedApartmentId: undefined,
          matchedDueId: undefined,
          confidenceScore: undefined,
          matchedBy: undefined,
          matchedAt: undefined
        };
      }
      return t;
    });

    // 2. Add back debt to unit
    if (tx.matchedApartmentId) {
      const savedUnits = localStorage.getItem('site_units_report');
      if (savedUnits) {
        const allUnits = JSON.parse(savedUnits);
        const updatedUnits = allUnits.map((u: any) => {
          if (u.id === tx.matchedApartmentId) {
            return {
              ...u,
              totalDebt: u.totalDebt + tx.amount
            };
          }
          return u;
        });
        localStorage.setItem('site_units_report', JSON.stringify(updatedUnits));
      }
    }

    saveState(updated);
    toast.success('Eşleşme başarıyla geri alındı, tahsilat iptal edildi ve daire borcu geri yüklendi.');
  };

  // 5. Excel/CSV Custom Column Mapping Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvContent(text);
        const firstLine = text.split('\n')[0];
        if (firstLine) {
          const headers = firstLine.split(';').map(h => h.trim());
          setCsvHeaders(headers);
          setShowMappingPanel(true);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImportWithMapping = () => {
    if (!csvContent) return;

    try {
      const lines = csvContent.split('\n');
      const newItems: BankMovement[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(';');
        
        const dateStr = parts[columnMapping.dateIndex]?.trim();
        const amountStr = parts[columnMapping.amountIndex]?.trim();
        const sender = parts[columnMapping.senderIndex]?.trim() || '';
        const desc = parts[columnMapping.descriptionIndex]?.trim() || '';

        const amountVal = Number(amountStr?.replace(',', '.'));
        if (isNaN(amountVal) || amountVal <= 0) continue;

        newItems.push({
          id: `btx-csv-${Date.now()}-${i}`,
          transactionRef: `CSV${Math.floor(100000 + Math.random() * 900000)}`,
          transactionDate: new Date(dateStr || Date.now()).toISOString(),
          amount: amountVal,
          senderName: sender,
          description: desc,
          classification: 'MEMBER_COLLECTION',
          status: 'UNMATCHED'
        });
      }

      if (newItems.length > 0) {
        saveState([...newItems, ...bankTxs]);
        toast.success(`${newItems.length} adet yeni banka hareketi başarıyla yüklendi.`);
        setIsUploadModalOpen(false);
        setShowMappingPanel(false);
        setCsvContent('');
        
        // Run auto match
        setTimeout(() => handleAutoReconcile(), 500);
      } else {
        toast.error('Geçerli bir veri satırı bulunamadı. Lütfen CSV formatını kontrol edin.');
      }
    } catch (err) {
      toast.error('Dosya ayrıştırılırken hata oluştu.');
    }
  };

  const handleUploadDemoCSV = () => {
    const demoCsvText = `Tarih;Tutar;Gönderici;Açıklama
2026-07-01;1500;Zeynep Kaya;A-3 Haziran Dairesi
2026-07-01;240;Ali Yıldırım;B-1 Ortak Alan
2026-07-01;750;Kemal Arslan;Detaysiz Transfer`;
    
    setCsvContent(demoCsvText);
    setCsvHeaders(['Tarih', 'Tutar', 'Gönderici', 'Açıklama']);
    setShowMappingPanel(true);
  };

  // 6. Manual matching submission
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
          status: 'MATCHED_MANUAL' as const,
          matchedApartmentId: matchedUnit.id,
          confidenceScore: 100,
          matchedBy: 'USER',
          matchedAt: new Date().toISOString()
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
          return {
            ...u,
            totalDebt: Math.max(0, u.totalDebt - selectedTxForMatch.amount)
          };
        }
        return u;
      });
      localStorage.setItem('site_units_report', JSON.stringify(updatedUnits));
    }

    saveState(updatedTxs);
    toast.success(`${selectedTxForMatch.senderName} ödemesi ${matchedUnit.number} dairesiyle manuel eşleştirildi.`);
    
    setSelectedTxForMatch(null);
    setSelectedUnitIdForMatch('');
  };

  // Calculations
  const stats = useMemo(() => {
    const totalCount = bankTxs.length;
    const matchedCount = bankTxs.filter(t => t.status === 'MATCHED_AUTO' || t.status === 'MATCHED_MANUAL').length;
    const unmatchedCount = bankTxs.filter(t => t.status === 'UNMATCHED').length;
    const totalAmountMatched = bankTxs.filter(t => t.status !== 'UNMATCHED').reduce((s, t) => s + t.amount, 0);

    return { totalCount, matchedCount, unmatchedCount, totalAmountMatched };
  }, [bankTxs]);

  // Filtered List
  const filteredTxs = useMemo(() => {
    return bankTxs.filter(t => {
      // Tab filter
      if (activeTab === 'matched' && t.status === 'UNMATCHED') return false;
      if (activeTab === 'unmatched' && t.status !== 'UNMATCHED') return false;

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
              Banka Entegrasyon & Hesap Dökümü
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Banka hesap hareketlerinin otomatik senkronizasyonu, akıllı eşleştirme ve Excel kolon eşlemeli içe aktarımı
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
              onClick={handleAutoReconcile}
              disabled={isMatching}
              className="inline-flex items-center justify-center rounded-xl border border-indigo-200/50 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-sm transition-all"
            >
              <ArrowRightLeft className={`mr-2 h-4 w-4 ${isMatching ? 'animate-pulse' : ''}`} />
              Otomatik Eşleştir (Reconcile)
            </button>
            
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#E31B23] to-[#ff474f] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-[#c9181e] transition-all shrink-0"
            >
              <Upload className="mr-2 h-4 w-4" />
              Hesap Özeti Yükle (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Card Row */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-4">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Eşleşen Hareketler</p>
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
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Eşleşme Bekleyenler</p>
            <h3 className="text-2xl font-black text-rose-500 mt-1">
              {stats.unmatchedCount} Adet
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-[#E31B23]">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Kapatılan Toplam Tutar</p>
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
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Eşleşme Oranı</p>
            <h3 className="text-2xl font-black text-emerald-500 mt-1">
              %{stats.totalCount > 0 ? Math.round((stats.matchedCount / stats.totalCount) * 100) : 0}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[var(--border-color)] pb-px gap-6">
        {[
          { id: 'all', label: 'Tüm Hesap Hareketleri' },
          { id: 'matched', label: 'Eşleşenler' },
          { id: 'unmatched', label: 'Eşleşmeyenler (Manuel İnceleme)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === tab.id 
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-[#E31B23] dark:border-indigo-400' 
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
                <th className="p-4">Dekont No</th>
                <th className="p-4">Tarih</th>
                <th className="p-4">Gönderici Bilgisi</th>
                <th className="p-4">Açıklama</th>
                <th className="p-4">Hareket Sınıflandırması</th>
                <th className="p-4 text-right">Tutar</th>
                <th className="p-4">Eşleşen Daire / Skor</th>
                <th className="p-4 text-center">Durum</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/40">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-xs text-[var(--text-tertiary)]">
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
                    <td className="p-4">
                      {/* Classification Dropdown */}
                      <select
                        value={t.classification}
                        onChange={(e) => handleUpdateClassification(t.id, e.target.value as any)}
                        className="rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-[10px] font-bold focus:outline-none"
                      >
                        <option value="MEMBER_COLLECTION">Sakin Tahsilatı</option>
                        <option value="EXTERNAL_COLLECTION">Harici Tahsilat</option>
                        <option value="EXPENSE_PAYMENT">Gider Ödemesi</option>
                        <option value="VENDOR_PAYMENT">Firma Ödemesi</option>
                        <option value="STAFF_PAYMENT">Personel Ödemesi</option>
                        <option value="TRANSFER">Virman</option>
                      </select>
                    </td>
                    <td className="p-4 text-right font-bold text-[var(--text-primary)]">{formatCurrency(t.amount)}</td>
                    <td className="p-4">
                      {t.status.startsWith('MATCHED') ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-[var(--text-primary)] block">
                            Daire {units.find(u => u.id === t.matchedApartmentId)?.number || 'Bilinmeyen'}
                          </span>
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            t.confidenceScore === 100 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            %{t.confidenceScore} Güven
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)] italic">Eşleşme Yok</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        t.status.startsWith('MATCHED') 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}>
                        {t.status.startsWith('MATCHED') ? 'Eşleşti' : 'Eşleşme Bekliyor'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      {t.status === 'UNMATCHED' ? (
                        <button
                          onClick={() => setSelectedTxForMatch(t)}
                          className="rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 font-bold text-white shadow-sm"
                        >
                          Manuel Eşleştir
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUndoMatch(t)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 hover:bg-rose-50 px-2.5 py-1.5 font-bold text-rose-600 transition-colors"
                        >
                          <CornerUpLeft className="h-3.5 w-3.5" /> Geri Al
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL MATCHING MODAL */}
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
                  <span className="text-[var(--text-secondary)]">Gönderici:</span>
                  <strong className="text-[var(--text-primary)]">{selectedTxForMatch.senderName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Açıklama:</span>
                  <strong className="text-[var(--text-primary)] italic">"{selectedTxForMatch.description}"</strong>
                </div>
                <div className="flex justify-between border-t border-[var(--border-color)]/50 pt-1.5 mt-1.5">
                  <span className="text-[var(--text-secondary)]">Tutar:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">{formatCurrency(selectedTxForMatch.amount)}</strong>
                </div>
              </div>

              {/* Apartment unit select */}
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
                  Eşleşmeyi Onayla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV UPLOAD & DYNAMIC COLUMN MAPPING MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Banka Hesap Ekstresi Yükle</h3>
              <button 
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setShowMappingPanel(false);
                }}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              {!showMappingPanel ? (
                <>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                    <p className="font-semibold">Dinamik Sütun Eşleştirme Sistemi:</p>
                    <p className="mt-1 leading-relaxed">
                      Farklı bankaların Excel/CSV çıktı formatları değişkenlik gösterir. Sütun başlıklarını eşleştirerek her türlü banka döküm dosyasını içe aktarabilirsiniz.
                    </p>
                  </div>

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
                      <span>Ekstre Dosyası Seç (CSV)...</span>
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
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 dark:bg-slate-700/30 border border-indigo-100 rounded-xl">
                    <p className="font-bold text-[var(--text-primary)]">Sütun Eşleştirme Paneli</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Dosyada tespit edilen sütunları sistem alanlarıyla eşleştirin.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400">İşlem Tarihi</label>
                      <select
                        value={columnMapping.dateIndex}
                        onChange={(e) => setColumnMapping({ ...columnMapping, dateIndex: Number(e.target.value) })}
                        className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-2 text-xs"
                      >
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400">Tutar</label>
                      <select
                        value={columnMapping.amountIndex}
                        onChange={(e) => setColumnMapping({ ...columnMapping, amountIndex: Number(e.target.value) })}
                        className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-2 text-xs"
                      >
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400">Gönderen Hesap</label>
                      <select
                        value={columnMapping.senderIndex}
                        onChange={(e) => setColumnMapping({ ...columnMapping, senderIndex: Number(e.target.value) })}
                        className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-2 text-xs"
                      >
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400">İşlem Açıklaması</label>
                      <select
                        value={columnMapping.descriptionIndex}
                        onChange={(e) => setColumnMapping({ ...columnMapping, descriptionIndex: Number(e.target.value) })}
                        className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-2 text-xs"
                      >
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3 border-t border-[var(--border-color)]/30 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowMappingPanel(false)}
                      className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                    >
                      Geri Dön
                    </button>
                    <button
                      type="button"
                      onClick={handleImportWithMapping}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2 font-semibold text-white shadow"
                    >
                      Eşleştir & Aktar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
