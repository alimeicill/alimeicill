'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Copy, 
  FileCode, 
  Printer, 
  Send, 
  Download, 
  Trash2, 
  Search, 
  ChevronDown, 
  Eye, 
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Layers
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface PurchaseInvoice {
  id: string;
  invoiceDate: string;
  invoiceNo: string;
  invoiceType: 'Alış Faturası' | 'Alınan Hizmet Faturası' | 'Alım İade Faturası';
  supplierName: string;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'GİB Gönderildi' | 'Taslak' | 'Ödendi' | 'Beklemede';
}

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals & Dropdowns
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);

  // Form states
  const [formType, setFormType] = useState<PurchaseInvoice['invoiceType']>('Alış Faturası');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formNo, setFormNo] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formNet, setFormNet] = useState('');
  const [formTax, setFormTax] = useState('');
  const [formTotal, setFormTotal] = useState('');
  const [formStatus, setFormStatus] = useState<PurchaseInvoice['status']>('Taslak');

  // Search & Global Filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'this_week'>('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sütun Göster/Gizle States
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    docNo: true,
    type: true,
    supplier: true,
    net: true,
    kdv: true,
    total: true,
    status: true
  });

  // Column Level Filters
  const [colFilters, setColFilters] = useState({
    date: '',
    docNo: '',
    type: '',
    supplier: '',
    net: '',
    kdv: '',
    total: '',
    status: ''
  });

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Default seed data
  const loadData = () => {
    const saved = localStorage.getItem('purchase_invoices');
    if (saved) {
      setInvoices(JSON.parse(saved));
    } else {
      const defaultInvoices: PurchaseInvoice[] = [
        { id: 'pinv-1', invoiceDate: '2026-06-15', invoiceNo: 'AL-202600000012', invoiceType: 'Alış Faturası', supplierName: 'Ulubey Elektrik Malzemeleri A.Ş.', netAmount: 1200, taxAmount: 240, totalAmount: 1440, status: 'Ödendi' },
        { id: 'pinv-2', invoiceDate: '2026-06-20', invoiceNo: 'HZ-202600000089', invoiceType: 'Alınan Hizmet Faturası', supplierName: 'Kardelen Temizlik Hizmetleri Ltd.', netAmount: 1500, taxAmount: 300, totalAmount: 1800, status: 'GİB Gönderildi' },
        { id: 'pinv-3', invoiceDate: '2026-06-25', invoiceNo: 'IAD-2026000001', invoiceType: 'Alım İade Faturası', supplierName: 'Saray Yapı Market', netAmount: 500, taxAmount: 100, totalAmount: 600, status: 'Taslak' },
        { id: 'pinv-4', invoiceDate: '2026-06-28', invoiceNo: 'AL-202600000134', invoiceType: 'Alış Faturası', supplierName: 'Yıldız Asansör Bakım Ltd.', netAmount: 2000, taxAmount: 400, totalAmount: 2400, status: 'Beklemede' },
        { id: 'pinv-5', invoiceDate: '2026-06-29', invoiceNo: 'HZ-202600000095', invoiceType: 'Alınan Hizmet Faturası', supplierName: 'Özel Güvenlik Çözümleri A.Ş.', netAmount: 3500, taxAmount: 700, totalAmount: 4200, status: 'Ödendi' }
      ];
      localStorage.setItem('purchase_invoices', JSON.stringify(defaultInvoices));
      setInvoices(defaultInvoices);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const saveState = (updated: PurchaseInvoice[]) => {
    setInvoices(updated);
    localStorage.setItem('purchase_invoices', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  // Recalculate Totals in Form when Net is edited
  useEffect(() => {
    const netVal = parseFloat(formNet);
    if (!isNaN(netVal) && netVal > 0) {
      const taxVal = netVal * 0.20; // 20% default VAT
      setFormTax(taxVal.toFixed(2));
      setFormTotal((netVal + taxVal).toFixed(2));
    } else {
      setFormTax('');
      setFormTotal('');
    }
  }, [formNet]);

  // Bulk actions checkbox helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredInvoices.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  // Filters & Search logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Global Search
      const matchesGlobal = 
        inv.invoiceNo.toLowerCase().includes(globalSearch.toLowerCase()) ||
        inv.supplierName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        inv.invoiceType.toLowerCase().includes(globalSearch.toLowerCase());
      
      // 2. Global Date range filter
      let matchesGlobalDate = true;
      if (dateFilter !== 'all') {
        const txTime = new Date(inv.invoiceDate).getTime();
        const now = Date.now();
        if (dateFilter === 'this_month') {
          matchesGlobalDate = (now - txTime) <= 30 * 24 * 60 * 60 * 1000;
        } else if (dateFilter === 'this_week') {
          matchesGlobalDate = (now - txTime) <= 7 * 24 * 60 * 60 * 1000;
        }
      }

      // 3. Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'gib') {
          matchesStatus = inv.status === 'GİB Gönderildi';
        } else if (statusFilter === 'taslak') {
          matchesStatus = inv.status === 'Taslak';
        } else if (statusFilter === 'ode') {
          matchesStatus = inv.status === 'Ödendi';
        } else if (statusFilter === 'bekle') {
          matchesStatus = inv.status === 'Beklemede';
        }
      }

      // 4. Column level filters
      const matchesColDate = !colFilters.date || inv.invoiceDate.includes(colFilters.date);
      const matchesColDocNo = !colFilters.docNo || inv.invoiceNo.toLowerCase().includes(colFilters.docNo.toLowerCase());
      const matchesColType = !colFilters.type || inv.invoiceType.toLowerCase().includes(colFilters.type.toLowerCase());
      const matchesColSupplier = !colFilters.supplier || inv.supplierName.toLowerCase().includes(colFilters.supplier.toLowerCase());
      const matchesColNet = !colFilters.net || inv.netAmount.toString().includes(colFilters.net);
      const matchesColKdv = !colFilters.kdv || inv.taxAmount.toString().includes(colFilters.kdv);
      const matchesColTotal = !colFilters.total || inv.totalAmount.toString().includes(colFilters.total);
      const matchesColStatus = !colFilters.status || inv.status.toLowerCase().includes(colFilters.status.toLowerCase());

      return matchesGlobal && matchesGlobalDate && matchesStatus && matchesColDate && matchesColDocNo && matchesColType && matchesColSupplier && matchesColNet && matchesColKdv && matchesColTotal && matchesColStatus;
    });
  }, [invoices, globalSearch, dateFilter, statusFilter, colFilters]);

  // Pagination calculations
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(startIndex, startIndex + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;

  // Stats
  const stats = useMemo(() => {
    const count = filteredInvoices.length;
    const total = filteredInvoices.reduce((s, i) => s + i.totalAmount, 0);
    return { count, total };
  }, [filteredInvoices]);

  // Toolbar Actions handlers
  const handleAddNew = (type: PurchaseInvoice['invoiceType']) => {
    setFormType(type);
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormNo('');
    setFormSupplier('');
    setFormNet('');
    setFormTax('');
    setFormTotal('');
    setFormStatus('Taslak');
    setIsNewDropdownOpen(false);
    setIsAddModalOpen(true);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const netVal = parseFloat(formNet);
    const taxVal = parseFloat(formTax);
    const totalVal = parseFloat(formTotal);

    if (!formNo.trim() || !formSupplier.trim() || isNaN(netVal)) {
      toast.error('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    const newInvoice: PurchaseInvoice = {
      id: `pinv-${Date.now()}`,
      invoiceDate: formDate,
      invoiceNo: formNo.trim(),
      invoiceType: formType,
      supplierName: formSupplier.trim(),
      netAmount: netVal,
      taxAmount: taxVal,
      totalAmount: totalVal,
      status: formStatus
    };

    saveState([newInvoice, ...invoices]);

    // Automatic Current Account (Cari) Integration
    const savedCariAccounts = localStorage.getItem('cari_accounts');
    const savedCariMovements = localStorage.getItem('cari_movements');
    
    let cariAccounts = savedCariAccounts ? JSON.parse(savedCariAccounts) : [];
    let cariMovements = savedCariMovements ? JSON.parse(savedCariMovements) : [];

    // Find or create supplier cari account
    let foundCari = cariAccounts.find((c: any) => c.name.toLowerCase() === formSupplier.trim().toLowerCase());
    
    if (!foundCari) {
      foundCari = {
        id: `cari-${Date.now()}`,
        code: `CAR-${Math.floor(100 + Math.random() * 900)}`,
        name: formSupplier.trim(),
        type: 'SUPPLIER'
      };
      cariAccounts = [foundCari, ...cariAccounts];
      localStorage.setItem('cari_accounts', JSON.stringify(cariAccounts));
    }

    // Add movement
    const docLabel = formType === 'Alım İade Faturası' ? 'İade Faturası' : 'Alış Faturası';
    const direction = formType === 'Alım İade Faturası' ? 'CREDIT' : 'DEBIT';

    const newMovement = {
      id: `mov-${Date.now()}`,
      cariHesapId: foundCari.id,
      cariFaturaId: newInvoice.id,
      date: formDate,
      description: `${docLabel} Girişi (Satın Alma): ${formNo} - ${formSupplier.trim()}`,
      direction: direction,
      amount: totalVal,
      documentNo: formNo.trim()
    };

    cariMovements = [...cariMovements, newMovement];
    localStorage.setItem('cari_movements', JSON.stringify(cariMovements));

    toast.success('Alış faturası belgesi başarıyla kaydedildi ve tedarikçi cari ekstresine işlendi.');
    setIsAddModalOpen(false);
  };

  const handleEditSelected = () => {
    if (selectedIds.length !== 1) return;
    const selected = invoices.find(i => i.id === selectedIds[0]);
    if (!selected) return;

    // Load form states
    setFormType(selected.invoiceType);
    setFormDate(selected.invoiceDate);
    setFormNo(selected.invoiceNo);
    setFormSupplier(selected.supplierName);
    setFormNet(selected.netAmount.toString());
    setFormTax(selected.taxAmount.toString());
    setFormTotal(selected.totalAmount.toString());
    setFormStatus(selected.status);
    
    // In edit, we delete first and save new
    setInvoices(invoices.filter(i => i.id !== selected.id));
    setIsAddModalOpen(true);
  };

  const handleCopySelected = () => {
    if (selectedIds.length !== 1) return;
    const selected = invoices.find(i => i.id === selectedIds[0]);
    if (!selected) return;

    const copiedInvoice: PurchaseInvoice = {
      ...selected,
      id: `pinv-${Date.now()}`,
      invoiceNo: `${selected.invoiceNo}-KOPYA`,
      status: 'Taslak'
    };

    saveState([copiedInvoice, ...invoices]);
    toast.success('Fatura başarıyla kopyalandı.');
    setSelectedIds([]);
  };

  const handleGibSend = () => {
    if (selectedIds.length === 0) return;
    const updated = invoices.map(i => {
      if (selectedIds.includes(i.id)) {
        return { ...i, status: 'GİB Gönderildi' as const };
      }
      return i;
    });
    saveState(updated);
    toast.success(`${selectedIds.length} fatura GİB'e başarıyla gönderildi.`);
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`${selectedIds.length} adet faturayı silmek istediğinize emin misiniz?`)) {
      const updated = invoices.filter(i => !selectedIds.includes(i.id));
      saveState(updated);

      // Clean up corresponding Cari Movements
      const savedCariMovements = localStorage.getItem('cari_movements');
      if (savedCariMovements) {
        const allMovements = JSON.parse(savedCariMovements);
        const updatedMovements = allMovements.filter((m: any) => !selectedIds.includes(m.cariFaturaId));
        localStorage.setItem('cari_movements', JSON.stringify(updatedMovements));
      }

      toast.success('Faturalar ve ilişkili cari hesap hareketleri başarıyla silindi.');
      setSelectedIds([]);
    }
  };

  const handleExcelExport = () => {
    try {
      let csv = "ALIŞ FATURALARI RAPORU\n";
      csv += "Tarih;Belge No;Tür;Cari Unvan;Net Tutar;KDV;Genel Tutar;Durumu\n";
      filteredInvoices.forEach(i => {
        csv += `${i.invoiceDate};${i.invoiceNo};${i.invoiceType};${i.supplierName};${i.netAmount};${i.taxAmount};${i.totalAmount};${i.status}\n`;
      });
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `alis_faturalari_rapor_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Alış faturaları excel (CSV) başarıyla indirildi.');
    } catch (err) {
      toast.error('Dışa aktarımda hata oluştu.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--border-color)] pb-3">
        <div className="text-[10px] text-[var(--text-tertiary)] flex items-center space-x-1.5 font-semibold">
          <Link href="/yonetici/dashboard" className="hover:text-indigo-500">Anasayfa</Link>
          <span>&gt;</span>
          <span>Satın Alma Yönetimi</span>
          <span>&gt;</span>
          <span className="text-[var(--text-secondary)]">Alış Faturaları</span>
        </div>
        <Link
          href="/yonetici/dashboard"
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Yönetici Paneline Dön
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Alış Faturaları
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Tedarikçi alımları, elektrik, su, internet faturaları ve iade süreçlerinin takibi
        </p>
      </div>

      {/* Action Buttons Bar (Toolbar) */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm">
        
        {/* Yeni Ekle (Dropdown) */}
        <div className="relative">
          <button
            onClick={() => setIsNewDropdownOpen(!isNewDropdownOpen)}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni Ekle
            <ChevronDown className="h-3 w-3" />
          </button>
          
          {isNewDropdownOpen && (
            <div className="absolute left-0 mt-1 w-44 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-1 shadow-lg z-20 animate-scale-in">
              <button 
                onClick={() => handleAddNew('Alış Faturası')}
                className="w-full text-left px-4 py-2 hover:bg-[var(--bg-tertiary)] text-[11px] font-semibold text-[var(--text-primary)]"
              >
                Alış Faturası
              </button>
              <button 
                onClick={() => handleAddNew('Alınan Hizmet Faturası')}
                className="w-full text-left px-4 py-2 hover:bg-[var(--bg-tertiary)] text-[11px] font-semibold text-[var(--text-primary)]"
              >
                Alınan Hizmet Faturası
              </button>
              <button 
                onClick={() => handleAddNew('Alım İade Faturası')}
                className="w-full text-left px-4 py-2 hover:bg-[var(--bg-tertiary)] text-[11px] font-semibold text-[var(--text-primary)]"
              >
                Alım İade Faturası
              </button>
            </div>
          )}
        </div>

        {/* Edit (Grey) */}
        <button
          onClick={handleEditSelected}
          disabled={selectedIds.length !== 1}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-all gap-1.5"
        >
          <Edit2 className="h-3.5 w-3.5 text-slate-500" />
          Düzenle
        </button>

        {/* Copy (Yellow) */}
        <button
          onClick={handleCopySelected}
          disabled={selectedIds.length !== 1}
          className="inline-flex items-center justify-center rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 disabled:opacity-40 transition-all gap-1.5"
        >
          <Copy className="h-3.5 w-3.5" />
          Kopyala
        </button>

        {/* E-Belge (Light Blue) */}
        <button
          onClick={() => {
            if (selectedIds.length === 0) return;
            toast.info('E-Belge XML şemaları ve imzalar doğrulanıyor...');
          }}
          disabled={selectedIds.length === 0}
          className="inline-flex items-center justify-center rounded-lg border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/10 px-3 py-2 text-xs font-bold text-sky-600 dark:text-sky-400 disabled:opacity-40 transition-all gap-1.5"
        >
          <FileCode className="h-3.5 w-3.5" />
          E-Belge
        </button>

        {/* Yazdır (Dropdown) */}
        <div className="relative">
          <button
            onClick={() => setIsPrintDropdownOpen(!isPrintDropdownOpen)}
            disabled={selectedIds.length === 0}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-all gap-1.5"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-500" />
            Yazdır
            <ChevronDown className="h-3 w-3" />
          </button>
          
          {isPrintDropdownOpen && (
            <div className="absolute left-0 mt-1 w-40 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-1 shadow-lg z-20 animate-scale-in">
              <button 
                onClick={() => {
                  setIsPrintDropdownOpen(false);
                  window.print();
                }}
                className="w-full text-left px-4 py-2 hover:bg-[var(--bg-tertiary)] text-[11px] font-semibold text-[var(--text-primary)]"
              >
                Toplu Yazdır
              </button>
              <button 
                onClick={() => {
                  setIsPrintDropdownOpen(false);
                  toast.success('Resmi irsaliye basım şablonu oluşturuldu.');
                }}
                className="w-full text-left px-4 py-2 hover:bg-[var(--bg-tertiary)] text-[11px] font-semibold text-[var(--text-primary)]"
              >
                İrsaliye Şablonu
              </button>
            </div>
          )}
        </div>

        {/* GİB'e Gönder (Green) */}
        <button
          onClick={handleGibSend}
          disabled={selectedIds.length === 0}
          className="inline-flex items-center justify-center rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/10 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 disabled:opacity-40 transition-all gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          GİB'e Gönder
        </button>

        {/* Dışarı Aktar (Excel) */}
        <button
          onClick={handleExcelExport}
          className="inline-flex items-center justify-center rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/10 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Dışarı Aktar
        </button>

        {/* Sil (Red) */}
        <button
          onClick={handleDeleteSelected}
          disabled={selectedIds.length === 0}
          className="inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 disabled:opacity-40 transition-all gap-1.5 ml-auto"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Sil
        </button>

      </div>

      {/* Summary Info Cards (Widgets) */}
      <div className="flex gap-4">
        {/* Count widget */}
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/20 px-3.5 py-1.5 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>{stats.count} Fatura</span>
        </div>

        {/* Sum widget */}
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1.5 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{formatCurrency(stats.total)} Toplam</span>
        </div>
      </div>

      {/* Search & Grid Columns Filters Area */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Tabloda ara..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Date shortcut filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-2 text-[var(--text-primary)] font-semibold focus:outline-none"
          >
            <option value="all">Tarih: Tümü</option>
            <option value="this_month">Tarih: Bu Ay</option>
            <option value="this_week">Tarih: Bu Hafta</option>
          </select>

          {/* Status shortcut filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-2 text-[var(--text-primary)] font-semibold focus:outline-none"
          >
            <option value="all">Durum: Tümü</option>
            <option value="gib">GİB'e Gönderilenler</option>
            <option value="taslak">Taslaklar</option>
            <option value="ode">Ödenenler</option>
            <option value="bekle">Bekleyenler</option>
          </select>

          {/* Columns Show/Hide Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-secondary)] font-semibold"
            >
              <span>Sütunlar</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {isColumnsDropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 shadow-lg z-20 space-y-1">
                {Object.keys(visibleColumns).map((col) => (
                  <label key={col} className="flex items-center gap-2 p-1 hover:bg-[var(--bg-tertiary)]/20 rounded cursor-pointer text-[10px] text-[var(--text-primary)] font-bold uppercase">
                    <input 
                      type="checkbox"
                      checked={(visibleColumns as any)[col]}
                      onChange={(e) => setVisibleColumns({
                        ...visibleColumns,
                        [col]: e.target.checked
                      })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{col === 'docNo' ? 'Belge No' : col === 'kdv' ? 'KDV' : col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Advanced Data Table with Header Filters */}
      <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm bg-[var(--bg-secondary)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* Header Titles */}
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-3 text-center w-10">
                  <input 
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredInvoices.length}
                    onChange={handleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                {visibleColumns.date && <th className="p-3">Tarih</th>}
                {visibleColumns.docNo && <th className="p-3">Belge No</th>}
                {visibleColumns.type && <th className="p-3">Tür</th>}
                {visibleColumns.supplier && <th className="p-3">Cari Unvan</th>}
                {visibleColumns.net && <th className="p-3 text-right">Net</th>}
                {visibleColumns.kdv && <th className="p-3 text-right">KDV</th>}
                {visibleColumns.total && <th className="p-3 text-right">Genel Tutar</th>}
                {visibleColumns.status && <th className="p-3 text-center">Durumu</th>}
              </tr>

              {/* Column-level Form Filters */}
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/5">
                <td className="p-1"></td>
                {visibleColumns.date && (
                  <td className="p-1">
                    <input 
                      type="text" 
                      placeholder="Filtrele..."
                      value={colFilters.date}
                      onChange={(e) => setColFilters({ ...colFilters, date: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)]/60 rounded px-1.5 py-0.5 text-[9px]"
                    />
                  </td>
                )}
                {visibleColumns.docNo && (
                  <td className="p-1">
                    <input 
                      type="text" 
                      placeholder="Filtrele..."
                      value={colFilters.docNo}
                      onChange={(e) => setColFilters({ ...colFilters, docNo: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)]/60 rounded px-1.5 py-0.5 text-[9px]"
                    />
                  </td>
                )}
                {visibleColumns.type && (
                  <td className="p-1">
                    <input 
                      type="text" 
                      placeholder="Filtrele..."
                      value={colFilters.type}
                      onChange={(e) => setColFilters({ ...colFilters, type: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)]/60 rounded px-1.5 py-0.5 text-[9px]"
                    />
                  </td>
                )}
                {visibleColumns.supplier && (
                  <td className="p-1">
                    <input 
                      type="text" 
                      placeholder="Filtrele..."
                      value={colFilters.supplier}
                      onChange={(e) => setColFilters({ ...colFilters, supplier: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)]/60 rounded px-1.5 py-0.5 text-[9px]"
                    />
                  </td>
                )}
                {visibleColumns.net && (
                  <td className="p-1">
                    <input 
                      type="text" 
                      placeholder="Filtrele..."
                      value={colFilters.net}
                      onChange={(e) => setColFilters({ ...colFilters, net: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)]/60 rounded px-1.5 py-0.5 text-[9px] text-right"
                    />
                  </td>
                )}
                {visibleColumns.kdv && (
                  <td className="p-1">
                    <input 
                      type="text" 
                      placeholder="Filtrele..."
                      value={colFilters.kdv}
                      onChange={(e) => setColFilters({ ...colFilters, kdv: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)]/60 rounded px-1.5 py-0.5 text-[9px] text-right"
                    />
                  </td>
                )}
                {visibleColumns.total && (
                  <td className="p-1">
                    <input 
                      type="text" 
                      placeholder="Filtrele..."
                      value={colFilters.total}
                      onChange={(e) => setColFilters({ ...colFilters, total: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)]/60 rounded px-1.5 py-0.5 text-[9px] text-right"
                    />
                  </td>
                )}
                {visibleColumns.status && (
                  <td className="p-1">
                    <input 
                      type="text" 
                      placeholder="Filtrele..."
                      value={colFilters.status}
                      onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)]/60 rounded px-1.5 py-0.5 text-[9px]"
                    />
                  </td>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/50">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[var(--text-tertiary)]">
                    Kriterlere uygun alış faturası belgesi bulunamadı.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--bg-tertiary)]/10 text-[var(--text-secondary)] transition-colors duration-150">
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={(e) => handleSelectOne(inv.id, e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    {visibleColumns.date && <td className="p-3">{formatDate(inv.invoiceDate)}</td>}
                    {visibleColumns.docNo && (
                      <td className="p-3">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="text-indigo-600 dark:text-indigo-400 font-mono font-bold hover:underline"
                        >
                          {inv.invoiceNo}
                        </button>
                      </td>
                    )}
                    {visibleColumns.type && <td className="p-3 font-medium">{inv.invoiceType}</td>}
                    {visibleColumns.supplier && <td className="p-3 font-bold text-[var(--text-primary)]">{inv.supplierName}</td>}
                    {visibleColumns.net && <td className="p-3 text-right">{formatCurrency(inv.netAmount)}</td>}
                    {visibleColumns.kdv && <td className="p-3 text-right text-[var(--text-tertiary)]">{formatCurrency(inv.taxAmount)}</td>}
                    {visibleColumns.total && <td className="p-3 text-right font-bold text-[var(--text-primary)]">{formatCurrency(inv.totalAmount)}</td>}
                    {visibleColumns.status && (
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          inv.status === 'Ödendi' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          inv.status === 'GİB Gönderildi' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                          inv.status === 'Taslak' ? 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/5 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-secondary)]">Sayfa başına kayıt:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[10px] text-[var(--text-primary)] focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="text-[10px] text-[var(--text-tertiary)] font-bold">
            {filteredInvoices.length} kayıt (Sayfa {currentPage} / {totalPages})
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded ${currentPage === idx + 1 ? 'bg-indigo-600 text-white' : 'border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]'}`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* NEW INVOICE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Yeni {formType} Kaydı
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Fatura Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Belge / Fatura No *</label>
                  <input
                    type="text"
                    required
                    placeholder="FAT202600129"
                    value={formNo}
                    onChange={(e) => setFormNo(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Cari Unvan (Tedarikçi) *</label>
                <input
                  type="text"
                  required
                  placeholder="Şirket veya şahıs unvanı..."
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Net Tutar (TL) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1000"
                    value={formNet}
                    onChange={(e) => setFormNet(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">KDV (%20)</label>
                  <input
                    type="text"
                    disabled
                    value={formTax}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 px-3 py-2 text-sm text-[var(--text-tertiary)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Genel Toplam</label>
                  <input
                    type="text"
                    disabled
                    value={formTotal}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 px-3 py-2 text-sm text-[var(--text-tertiary)] focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Durum *</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="Taslak">Taslak</option>
                  <option value="Beklemede">Beklemede</option>
                  <option value="Ödendi">Ödendi</option>
                </select>
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

      {/* VIEW INVOICE DETAILS MODAL */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Fatura Belge Detayları</h3>
              <button 
                onClick={() => setViewingInvoice(null)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold">Tarih</span>
                  <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">{formatDate(viewingInvoice.invoiceDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold">Belge / Fatura No</span>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)] mt-0.5 block">{viewingInvoice.invoiceNo}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold">Cari Unvan</span>
                <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">{viewingInvoice.supplierName}</span>
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold">Fatura Türü</span>
                <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">{viewingInvoice.invoiceType}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-[var(--border-color)]/40 pt-3">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold">Net Tutar</span>
                  <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">{formatCurrency(viewingInvoice.netAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold">KDV (20%)</span>
                  <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">{formatCurrency(viewingInvoice.taxAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold">Genel Toplam</span>
                  <span className="text-xs font-extrabold text-rose-500 mt-0.5 block">{formatCurrency(viewingInvoice.totalAmount)}</span>
                </div>
              </div>

              <div className="border-t border-[var(--border-color)]/40 pt-3">
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-semibold">Belge Durumu</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold mt-1.5 ${
                  viewingInvoice.status === 'Ödendi' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                  viewingInvoice.status === 'GİB Gönderildi' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                  viewingInvoice.status === 'Taslak' ? 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                }`}>
                  {viewingInvoice.status}
                </span>
              </div>

              <div className="pt-4 flex justify-end border-t border-[var(--border-color)]/30 mt-6">
                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
