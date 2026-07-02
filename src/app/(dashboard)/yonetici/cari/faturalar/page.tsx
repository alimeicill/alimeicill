'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  ArrowLeft, 
  AlertTriangle, 
  Info,
  Calendar, 
  User, 
  Percent, 
  Briefcase,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface CariHesap {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface CariFatura {
  id: string;
  cariHesapId: string;
  invoiceNo: string;
  invoiceDate: string;
  documentType: 'FATURA' | 'TAHAKKUK';
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  description: string;
}

interface CariHareket {
  id: string;
  cariHesapId: string;
  cariFaturaId?: string;
  date: string;
  description: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  documentNo?: string;
}

export default function CariFaturalarPage() {
  const [accounts, setAccounts] = useState<CariHesap[]>([]);
  const [invoices, setInvoices] = useState<CariFatura[]>([]);
  const [movements, setMovements] = useState<CariHareket[]>([]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('all');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [selectedCariId, setSelectedCariId] = useState('');
  const [newDocType, setNewDocType] = useState<'FATURA' | 'TAHAKKUK'>('FATURA');
  const [newInvoiceNo, setNewInvoiceNo] = useState('');
  const [newInvoiceDate, setNewInvoiceDate] = useState(new Date().toISOString().substring(0, 10));
  const [newNetAmount, setNewNetAmount] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('20'); // KDV oranı percentage (0, 10, 20)
  const [newTaxAmount, setNewTaxAmount] = useState('0');
  const [newTotalAmount, setNewTotalAmount] = useState('0');
  const [newDescription, setNewDescription] = useState('');

  // Load datasets from localStorage
  useEffect(() => {
    const savedAccounts = localStorage.getItem('cari_accounts');
    const savedInvoices = localStorage.getItem('cari_invoices');
    const savedMovements = localStorage.getItem('cari_movements');

    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }

    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    } else {
      const defaultInvoices: CariFatura[] = [
        { id: 'inv-1', cariHesapId: 'cari-1', invoiceNo: 'FAT-2026-0012', invoiceDate: '2026-06-01', documentType: 'FATURA', netAmount: 2916.67, taxAmount: 583.33, totalAmount: 3500.00, description: 'Bahçe Hortumu ve Vana Malzemeleri Alımı' },
        { id: 'inv-2', cariHesapId: 'cari-2', invoiceNo: 'ISK-99221', invoiceDate: '2026-06-05', documentType: 'TAHAKKUK', netAmount: 4500.00, taxAmount: 0.00, totalAmount: 4500.00, description: 'Ortak Alan Su Faturası - Haziran' },
        { id: 'inv-3', cariHesapId: 'cari-3', invoiceNo: 'MAK-001', invoiceDate: '2026-06-05', documentType: 'TAHAKKUK', netAmount: 2500.00, taxAmount: 0.00, totalAmount: 2500.00, description: 'Haziran Teknik Servis Bedeli' },
        { id: 'inv-4', cariHesapId: 'cari-3', invoiceNo: 'MAK-002', invoiceDate: '2026-06-12', documentType: 'TAHAKKUK', netAmount: 1500.00, taxAmount: 0.00, totalAmount: 1500.00, description: 'Asansör Revizyonu Ek Mesai' }
      ];
      localStorage.setItem('cari_invoices', JSON.stringify(defaultInvoices));
      setInvoices(defaultInvoices);
    }

    if (savedMovements) {
      setMovements(JSON.parse(savedMovements));
    }
  }, []);

  // Save changes
  const saveAll = (newInvoices: CariFatura[], newMovements: CariHareket[]) => {
    setInvoices(newInvoices);
    setMovements(newMovements);
    localStorage.setItem('cari_invoices', JSON.stringify(newInvoices));
    localStorage.setItem('cari_movements', JSON.stringify(newMovements));
  };

  // Recalculate KDV and Total Amount when Net Amount or Tax Rate changes
  useEffect(() => {
    const net = parseFloat(newNetAmount);
    const rate = parseFloat(newTaxRate);
    if (!isNaN(net) && !isNaN(rate)) {
      const tax = (net * rate) / 100;
      const total = net + tax;
      setNewTaxAmount(tax.toFixed(2));
      setNewTotalAmount(total.toFixed(2));
    } else {
      setNewTaxAmount('0');
      setNewTotalAmount('0');
    }
  }, [newNetAmount, newTaxRate]);

  // Submit invoice handler
  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCariId || !newInvoiceNo || !newInvoiceDate || !newNetAmount || !newDescription) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const netVal = parseFloat(newNetAmount);
    const taxVal = parseFloat(newTaxAmount);
    const totalVal = parseFloat(newTotalAmount);

    if (isNaN(netVal) || netVal <= 0) {
      toast.error('Lütfen geçerli bir net tutar girin.');
      return;
    }

    // Unique FaturaNo check for this Cari
    if (invoices.some(inv => inv.cariHesapId === selectedCariId && inv.invoiceNo.toLowerCase() === newInvoiceNo.toLowerCase())) {
      toast.error('Bu cari hesap için aynı fatura numarası daha önce girilmiştir.');
      return;
    }

    const newInvoice: CariFatura = {
      id: `inv-${Date.now()}`,
      cariHesapId: selectedCariId,
      invoiceNo: newInvoiceNo.trim(),
      invoiceDate: newInvoiceDate,
      documentType: newDocType,
      netAmount: netVal,
      taxAmount: taxVal,
      totalAmount: totalVal,
      description: newDescription.trim()
    };

    // Automatically generate a Borç (DEBIT) movement for the current account
    const docTypeLabel = newDocType === 'FATURA' ? 'Fatura' : 'Tahakkuk';
    const newMovement: CariHareket = {
      id: `mov-${Date.now()}`,
      cariHesapId: selectedCariId,
      cariFaturaId: newInvoice.id,
      date: newInvoiceDate,
      description: `${docTypeLabel} Girişi: ${newInvoiceNo} - ${newDescription.trim()}`,
      direction: 'DEBIT', // "Borç" kaydı as specified in the prompt rules
      amount: totalVal,
      documentNo: newInvoiceNo.trim()
    };

    const updatedInvoices = [newInvoice, ...invoices];
    const updatedMovements = [...movements, newMovement];

    saveAll(updatedInvoices, updatedMovements);

    // Reset Form
    setSelectedCariId('');
    setNewInvoiceNo('');
    setNewNetAmount('');
    setNewDescription('');
    setNewInvoiceDate(new Date().toISOString().substring(0, 10));

    setShowAddModal(false);
    toast.success('Fatura/Tahakkuk kaydı ve cari borç hareketi başarıyla oluşturuldu.');
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Bu fatura belgesini silmek istediğinize emin misiniz?')) {
      const updatedInvoices = invoices.filter(inv => inv.id !== id);
      const updatedMovements = movements.filter(m => m.cariFaturaId !== id);
      saveAll(updatedInvoices, updatedMovements);
      window.dispatchEvent(new Event('storage'));
      toast.success('Fatura belgesi ve ilişkili cari borç hareketi başarıyla silindi.');
    }
  };

  // Helper: Get Cari Hesap Details
  const getCariDetails = (cariId: string) => {
    return accounts.find(acc => acc.id === cariId);
  };

  // Filters
  const filteredInvoices = invoices.filter(inv => {
    const cari = getCariDetails(inv.cariHesapId);
    const cariName = cari ? cari.name.toLowerCase() : '';
    const cariCode = cari ? cari.code.toLowerCase() : '';
    
    const matchesSearch = 
      inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cariName.includes(searchTerm.toLowerCase()) ||
      cariCode.includes(searchTerm.toLowerCase());

    const matchesDocType = docTypeFilter === 'all' || inv.documentType === docTypeFilter;

    return matchesSearch && matchesDocType;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <Link 
          href="/yonetici/cari"
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Cari Hesaplar & Ekstre Sayfasına Dön
        </Link>
      </div>

      {/* Warning Banner */}
      <div className="glass bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex items-start space-x-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
          <Info className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Cari Fatura Giriş İş Mantığı</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Cari hesaplara ait resmi gider faturaları ve tahakkuk girişleri için **Faturalar** modülünü kullanmalısınız. 
            Buradan girilen her fatura, ilişkili olduğu cari hesaba otomatik olarak bir **Borç (DEBIT)** hareketi olarak yansıtılacaktır. 
            Doğrudan ödemeler ve manuel ekstre düzeltme hareketleri buradan girilemez; bu işlemler Cari Ekstre ekranından yönetilmelidir.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Cari Faturalar & Tahakkuklar
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Paydaş cari hesaplarına ait gider faturalarının kaydı ve resmi takibi
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Fatura / Tahakkuk Gir
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-secondary)] shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari unvanı, fatura no veya açıklama ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none"
          />
        </div>

        <select
          value={docTypeFilter}
          onChange={(e) => setDocTypeFilter(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
        >
          <option value="all">Tüm Evrak Tipleri</option>
          <option value="FATURA">Fatura</option>
          <option value="TAHAKKUK">Tahakkuk</option>
        </select>
      </div>

      {/* Invoice List Table */}
      <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm bg-[var(--bg-secondary)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-4">Cari Hesap</th>
                <th className="p-4">Evrak Tipi</th>
                <th className="p-4">Fatura/Belge No</th>
                <th className="p-4">Fatura Tarihi</th>
                <th className="p-4">Açıklama</th>
                <th className="p-4 text-right">KDV Hariç Net</th>
                <th className="p-4 text-right">KDV Tutarı</th>
                <th className="p-4 text-right">Toplam Tutar</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/60 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                    Kayıtlı cari fatura bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const cari = getCariDetails(inv.cariHesapId);
                  return (
                    <tr 
                      key={inv.id} 
                      className="transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/20 text-xs text-[var(--text-secondary)]"
                    >
                      <td className="p-4">
                        <span className="font-bold block text-[var(--text-primary)]">{cari ? cari.name : 'Silinmiş Cari'}</span>
                        <span className="font-mono text-[9px] text-[var(--text-tertiary)]">{cari ? cari.code : '-'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                          inv.documentType === 'FATURA' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200'
                        }`}>
                          {inv.documentType === 'FATURA' ? 'Fatura' : 'Tahakkuk'}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-[var(--text-primary)]">
                        {inv.invoiceNo}
                      </td>
                      <td className="p-4">
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="p-4 max-w-[200px] truncate text-[var(--text-primary)] font-semibold" title={inv.description}>
                        {inv.description}
                      </td>
                      <td className="p-4 text-right">
                        {formatCurrency(inv.netAmount)}
                      </td>
                      <td className="p-4 text-right text-[var(--text-tertiary)]">
                        {formatCurrency(inv.taxAmount)}
                      </td>
                      <td className="p-4 text-right font-extrabold text-rose-500">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="rounded-lg bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/30 px-2.5 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 transition-all"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Yeni Fatura / Tahakkuk Giriş Formu */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Resmi Gider Faturası Girişi</h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">Tedarikçi, kurum ve personel gider faturaları için</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-semibold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-4 pt-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">İlişkili Cari Hesap *</label>
                <select
                  required
                  value={selectedCariId}
                  onChange={(e) => setSelectedCariId(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="">Cari Hesap Seçiniz...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code} - {acc.type === 'SUPPLIER' ? 'Tedarikçi' : acc.type === 'INSTITUTION' ? 'Kurum' : 'Personel'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Evrak Tipi *</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="FATURA">Fatura</option>
                    <option value="TAHAKKUK">Tahakkuk Kaydı</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Fatura / Belge No *</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceNo}
                    onChange={(e) => setNewInvoiceNo(e.target.value)}
                    placeholder="FAT-2026-0004"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Fatura Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceDate}
                    onChange={(e) => setNewInvoiceDate(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">KDV Oranı *</label>
                  <select
                    value={newTaxRate}
                    onChange={(e) => setNewTaxRate(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="20">%20 (Standart KDV)</option>
                    <option value="10">%10 (İndirimli KDV)</option>
                    <option value="0">%0 (KDV Muaf)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Net Tutar (KDV Hariç) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newNetAmount}
                    onChange={(e) => setNewNetAmount(e.target.value)}
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)]">Hesaplanan KDV</label>
                  <div className="block w-full rounded-lg bg-[var(--bg-tertiary)]/30 px-2.5 py-2 text-xs text-[var(--text-secondary)] font-mono">
                    {formatCurrency(parseFloat(newTaxAmount))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-rose-500">Toplam Tutar</label>
                  <div className="block w-full rounded-lg bg-rose-500/10 px-2.5 py-2 text-xs text-rose-600 dark:text-rose-400 font-extrabold font-mono">
                    {formatCurrency(parseFloat(newTotalAmount))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Açıklama *</label>
                <input
                  type="text"
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Örn. Binanın asansör motor bakımı hizmet bedeli"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  Faturayı Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
