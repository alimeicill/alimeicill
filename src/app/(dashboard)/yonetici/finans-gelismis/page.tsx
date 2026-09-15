'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Calculator, CreditCard, Scale, BookOpen, 
  Users, BarChart3, FileSpreadsheet, Download, Printer, 
  Plus, CheckCircle2, AlertTriangle, Clock, RefreshCw, 
  DollarSign, ShieldAlert, FileText, Check, ChevronRight, X
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { AdvancedFinanceService } from '@/lib/services/advanced-finance-service';
import { calculateVat, calculatePayroll, calculateLegalInterest } from '@/lib/services/financeMath';
import { 
  ResidentFinance, 
  PayrollEngine, 
  AccountingVoucher, 
  AccountPlanItem, 
  LegalProcess, 
  BusinessProjectBudget, 
  CheckNoteItem, 
  AssetItem, 
  ContractItem 
} from '@/types/advanced-finance';

export default function AdvancedFinancePage() {
  const [activeTab, setActiveTab] = useState<'motor' | 'tahsilat' | 'muhasebe' | 'personel' | 'raporlar'>('motor');

  // Module 1 States
  const [residentFinances, setResidentFinances] = useState<ResidentFinance[]>([]);
  const [vatAmount, setVatAmount] = useState<number>(1000);
  const [vatRate, setVatRate] = useState<number>(20);
  const [vatInclusive, setVatInclusive] = useState<boolean>(true);
  const [vatResult, setVatResult] = useState<any>(null);

  // Module 2 States (POS & Legal)
  const [selectedResidentForPos, setSelectedResidentForPos] = useState<string>('');
  const [posAmount, setPosAmount] = useState<number>(1500);
  const [cardNumber, setCardNumber] = useState<string>('4543 6000 1234 5678');
  const [installments, setInstallments] = useState<number>(1);
  const [legalProcesses, setLegalProcesses] = useState<LegalProcess[]>([]);
  const [selectedLegalPrint, setSelectedLegalPrint] = useState<LegalProcess | null>(null);

  // Module 3 States (Accounting)
  const [chartOfAccounts, setChartOfAccounts] = useState<AccountPlanItem[]>([]);
  const [vouchers, setVouchers] = useState<AccountingVoucher[]>([]);
  const [checkNotes, setCheckNotes] = useState<CheckNoteItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);

  // Module 4 States (Personnel & Business Project)
  const [personnelList, setPersonnelList] = useState<PayrollEngine[]>([]);
  const [businessProject, setBusinessProject] = useState<BusinessProjectBudget | null>(null);
  
  // Custom Payroll Calc Form State
  const [grossSalaryInput, setGrossSalaryInput] = useState<number>(30000);
  const [workYearsInput, setWorkYearsInput] = useState<number>(2);
  const [calcPayrollResult, setCalcPayrollResult] = useState<PayrollEngine | null>(null);

  // Load Initial Data
  useEffect(() => {
    setResidentFinances(AdvancedFinanceService.getResidentFinances());
    setLegalProcesses(AdvancedFinanceService.getLegalProcesses());
    setChartOfAccounts(AdvancedFinanceService.getChartOfAccounts());
    setVouchers(AdvancedFinanceService.getAccountingVouchers());
    setCheckNotes(AdvancedFinanceService.getCheckNotes());
    setAssets(AdvancedFinanceService.getAssets());
    setContracts(AdvancedFinanceService.getContracts());
    setPersonnelList(AdvancedFinanceService.getPersonnelList());
    setBusinessProject(AdvancedFinanceService.getBusinessProjectBudget());

    // Initial VAT Calc
    setVatResult(calculateVat(vatAmount, vatRate, vatInclusive));
    // Initial Payroll Calc
    setCalcPayrollResult(calculatePayroll(grossSalaryInput, 30, workYearsInput));
  }, []);

  // Handlers
  const handleVatCalculate = () => {
    const res = calculateVat(vatAmount, vatRate, vatInclusive);
    setVatResult(res);
  };

  const handlePosPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentForPos) {
      toast.error('Lütfen ödeme yapılacak sakini seçiniz.');
      return;
    }

    const tx = AdvancedFinanceService.processVirtualPos(
      selectedResidentForPos,
      cardNumber,
      posAmount,
      installments
    );

    toast.success(`Sanal POS Tahsilatı Başarılı! Onay Kodu: ${tx.authCode}`);
    setResidentFinances(AdvancedFinanceService.getResidentFinances());
    setSelectedResidentForPos('');
  };

  const handleCalculateCustomPayroll = () => {
    const res = calculatePayroll(grossSalaryInput, 30, workYearsInput);
    setCalcPayrollResult(res);
  };

  const handleBulkUploadSimulate = () => {
    toast.info("XLSX Borçlandırma dosyası doğrulandı. 24 satır başarılı, 0 hatalı satır.");
    toast.success("Excel'den toplu borçlandırma veritabanına işlendi.");
  };

  const handleExportSimulate = (type: string) => {
    toast.success(`${type.toUpperCase()} formatında resmi rapor başarıyla indirildi.`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 text-xs text-slate-800 dark:text-slate-100">
      
      {/* Top Header */}
      <div className="space-y-4">
        <Link
          href="/yonetici/dashboard"
          className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Yönetici Paneline Dön
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              İleri Seviye Finans & Resmi Muhasebe
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              KDV Hesaplama, Sanal POS, İcra Takibi, Tek Düzen Yevmiye Fişleri, Personel Bordro ve İşletme Projesi Varyans Analizi
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleExportSimulate('excel')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel Dışa Aktar
            </button>
            <button
              onClick={() => handleExportSimulate('pdf')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all"
            >
              <Download className="h-4 w-4" /> PDF Rapor
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6 overflow-x-auto pb-px">
        {[
          { id: 'motor', label: '1. Finansal Motor & KDV', icon: Calculator },
          { id: 'tahsilat', label: '2. Sanal POS & İcra Süreci', icon: CreditCard },
          { id: 'muhasebe', label: '3. Tek Düzen Muhasebe & Varlıklar', icon: BookOpen },
          { id: 'personel', label: '4. Personel & İşletme Projesi', icon: Users },
          { id: 'raporlar', label: '5. Raporlama & Ekstreler', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative shrink-0 ${
                activeTab === tab.id 
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODÜL 1: FİNANSAL MOTOR, KDV & BORÇLANDIRMA */}
      {activeTab === 'motor' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KDV Hesaplayıcı Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-indigo-600" />
                  Çift Yönlü KDV Hesaplayıcı
                </h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 font-mono text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                  ROUND_HALF_UP
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Tutar (₺)</label>
                  <input
                    type="number"
                    value={vatAmount}
                    onChange={(e) => setVatAmount(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">KDV Oranı</label>
                    <select
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      <option value={1}>%1 KDV</option>
                      <option value={10}>%10 KDV</option>
                      <option value={20}>%20 KDV</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500">Hesap Tipi</label>
                    <select
                      value={vatInclusive ? 'inclusive' : 'exclusive'}
                      onChange={(e) => setVatInclusive(e.target.value === 'inclusive')}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      <option value="inclusive">KDV Dahil</option>
                      <option value="exclusive">KDV Hariç</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleVatCalculate}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all mt-2"
                >
                  KDV Hesapla
                </button>
              </div>

              {vatResult && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Matrah (Net Tutar):</span>
                    <strong className="text-slate-900 dark:text-white">{formatCurrency(vatResult.netAmount)}</strong>
                  </div>
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                    <span>KDV Tutarı (%{vatResult.rate}):</span>
                    <strong>{formatCurrency(vatResult.vatAmount)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-600 border-t border-slate-200 dark:border-slate-700 pt-2 font-bold">
                    <span>Genel Toplam:</span>
                    <strong className="text-sm">{formatCurrency(vatResult.totalAmount)}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Upload Simulation Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Excel ile Toplu Borçlandırma (XLSX)
                </h3>
              </div>

              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Ay başında otomatik Cron Job ile borçlandırılmayan özel gider kalemlerini Excel şablonu ile yükleyebilirsiniz. XLSX parser servisi hatalı satırları otomatik doğrular.
              </p>

              <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                <FileSpreadsheet className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-200">Dosyayı sürükleyin veya seçin (.xlsx, .csv)</p>
                <span className="text-[10px] text-slate-400 block">Sütunlar: DaireNo, Tutar, Açıklama, VadeTarihi</span>
              </div>

              <button
                onClick={handleBulkUploadSimulate}
                className="w-full py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all"
              >
                Yüklemeyi Doğrula ve İşle (XLSX Parser)
              </button>
            </div>

            {/* Cron Job Info Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  Otomatik Borçlandırma (Cron Job)
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-700 dark:text-indigo-300 space-y-1">
                  <span className="font-bold block">Tetikleyici Zamanlayıcı:</span>
                  <p>Her ayın 1'i saat 00:01 (`0 1 1 * *` Cron)</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-700 dark:text-emerald-300 space-y-1">
                  <span className="font-bold block">Günlük Faiz Cron:</span>
                  <p>Her gece saat 23:59 (`59 23 * * *` Cron)</p>
                </div>
              </div>
            </div>

          </div>

          {/* Sakin Kişilere Göre Cari Finansal Durum Tablosu */}
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sakin Kişisel Cari Ekstre & Borç Durumu
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Daire</th>
                    <th className="p-3">Sakin Adı</th>
                    <th className="p-3">Geciken Taksit</th>
                    <th className="p-3 text-right">Gecikmiş Borç</th>
                    <th className="p-3 text-right">Anlık Toplam Bakiye</th>
                    <th className="p-3 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {residentFinances.map(r => (
                    <tr key={r.residentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="p-3 font-bold font-mono">{r.apartmentNo}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.residentName}</td>
                      <td className="p-3 font-mono">{r.overdueInstallmentsCount} Taksit</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">{formatCurrency(r.totalOverdueAmount)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(r.currentBalance)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.currentBalance > 0 
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}>
                          {r.currentBalance > 0 ? 'Borçlu' : 'Temiz'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODÜL 2: TAHSİLAT SİSTEMLERİ & ENTEGRASYONLAR */}
      {activeTab === 'tahsilat' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sanal POS Ödeme Formu */}
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  Sanal POS Online Ödeme Formu
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                  3D Secure Aktif
                </span>
              </div>

              <form onSubmit={handlePosPayment} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Ödeme Yapacak Daire / Sakin *</label>
                  <select
                    required
                    value={selectedResidentForPos}
                    onChange={(e) => setSelectedResidentForPos(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none"
                  >
                    <option value="">Seçiniz...</option>
                    {residentFinances.map(r => (
                      <option key={r.residentId} value={r.residentId}>
                        Daire {r.apartmentNo} - {r.residentName} (Borç: {formatCurrency(r.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">Kart Numarası</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Ödenecek Tutar (₺)</label>
                    <input
                      type="number"
                      value={posAmount}
                      onChange={(e) => setPosAmount(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500">Taksit Seçeneği</label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      <option value={1}>Tek Çekim (Taksitsiz)</option>
                      <option value={3}>3 Taksit</option>
                      <option value={6}>6 Taksit</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md transition-all mt-2"
                >
                  Ödemeyi Tamamla ve Kasa Hesabına İşle
                </button>
              </form>
            </div>

            {/* Hukuki Takip & İcra Süreci */}
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="h-4 w-4 text-rose-600" />
                  Hukuki Takip & İcra Adayları (60+ Gün Vade)
                </h3>
              </div>

              <div className="space-y-3">
                {legalProcesses.map(proc => (
                  <div key={proc.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900 dark:text-white">Daire {proc.apartmentNo} — {proc.residentName}</strong>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        proc.status === 'IN_ENFORCEMENT' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {proc.status === 'IN_ENFORCEMENT' ? 'Dava Açıldı' : 'İcra Adayı'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-500 border-t border-slate-200/60 dark:border-slate-800 pt-2">
                      <div>Borç Aslı: <strong>{formatCurrency(proc.principalAmount)}</strong></div>
                      <div>Yasal Faiz: <strong>{formatCurrency(proc.legalInterest)}</strong></div>
                      <div>Avukat/Masraf: <strong>{formatCurrency(proc.lawyerFee)}</strong></div>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200/60 dark:border-slate-800 pt-2">
                      <span className="font-bold text-rose-600 font-mono">Toplam Föy: {formatCurrency(proc.totalExecutionAmount)}</span>
                      <button
                        onClick={() => setSelectedLegalPrint(proc)}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px]"
                      >
                        İcra Föyü PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODÜL 3: TEK DÜZEN MUHASEBE & FİNANS */}
      {activeTab === 'muhasebe' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tek Düzen Hesap Planı */}
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                Tek Düzen Hesap Planı Bakiye Listesi
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-2.5">Kod</th>
                      <th className="p-2.5">Hesap Adı</th>
                      <th className="p-2.5 text-right">Bakiye (₺)</th>
                      <th className="p-2.5 text-center">Bakiye Tipi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {chartOfAccounts.map(acc => (
                      <tr key={acc.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="p-2.5 font-bold text-indigo-600">{acc.code}</td>
                        <td className="p-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">{acc.name}</td>
                        <td className="p-2.5 text-right font-bold">{formatCurrency(acc.balance)}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            acc.type === 'DEBIT' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {acc.type === 'DEBIT' ? 'BORÇ' : 'ALACAK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Otomatik Yevmiye Fişleri (Mahsup, Tahsil, Tediye) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Yevmiye Defteri Fiş Kayıtları (Mahsup/Tahsil/Tediye)
              </h3>

              <div className="space-y-3">
                {vouchers.map(vch => (
                  <div key={vch.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="font-mono text-indigo-600">{vch.voucherNo} ({vch.type})</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{vch.date}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-semibold">{vch.description}</p>
                    
                    <div className="border-t border-slate-200/60 dark:border-slate-800 pt-2 space-y-1 font-mono text-[11px]">
                      {vch.lines.map((line, idx) => (
                        <div key={idx} className="flex justify-between text-slate-500">
                          <span>{line.accountCode} {line.accountName}</span>
                          <span>B: {formatCurrency(line.debit)} | A: {formatCurrency(line.credit)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sözleşmeler & Amortismanlı Demirbaşlar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Demirbaş Takibi & Amortisman Hesapları</h3>
              {assets.map(ast => (
                <div key={ast.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 flex justify-between items-center font-mono">
                  <div>
                    <strong className="font-sans text-slate-900 dark:text-white block">{ast.name}</strong>
                    <span className="text-[10px] text-slate-400">Alış: {formatCurrency(ast.purchaseValue)} | Faydalı Ömür: {ast.usefulLifeYears} Yıl</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 font-bold block">Net Değer: {formatCurrency(ast.currentBookValue)}</span>
                    <span className="text-[10px] text-slate-400">Birikmiş Amortisman: {formatCurrency(ast.accumulatedDepreciation)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Firma Sözleşme Süreleri & Uyarılar</h3>
              {contracts.map(cnt => (
                <div key={cnt.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900 dark:text-white block">{cnt.vendorName} ({cnt.serviceType})</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Bitiş: {cnt.endDate}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cnt.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : cnt.status === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {cnt.daysRemaining > 0 ? `${cnt.daysRemaining} Gün Kaldı` : 'Süresi Doldu!'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODÜL 4: PERSONEL İŞLEMLERİ & İŞLETME PROJESİ */}
      {activeTab === 'personel' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Personel Bordro Hesaplayıcı & Kartları */}
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Personel Bordro & Tazminat Tavan Motoru
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Brüt Maaş (₺)</label>
                  <input
                    type="number"
                    value={grossSalaryInput}
                    onChange={(e) => setGrossSalaryInput(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">Çalışma Yılı (Kıdem)</label>
                  <input
                    type="number"
                    value={workYearsInput}
                    onChange={(e) => setWorkYearsInput(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateCustomPayroll}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Bordro ve Tazminat Hesapla
              </button>

              {calcPayrollResult && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Brüt Ücret:</span>
                    <strong>{formatCurrency(calcPayrollResult.grossSalary)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>SGK İşçi Payı (%14):</span>
                    <strong>{formatCurrency(calcPayrollResult.sgkEmployeeShare)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Gelir Vergisi + Damga V.:</span>
                    <strong>{formatCurrency(calcPayrollResult.incomeTax + calcPayrollResult.stampTax)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold border-t border-slate-200 dark:border-slate-800 pt-1">
                    <span>Net Ödenecek Maaş:</span>
                    <strong className="text-xs">{formatCurrency(calcPayrollResult.netSalary)}</strong>
                  </div>
                  <div className="flex justify-between text-amber-600 border-t border-slate-200 dark:border-slate-800 pt-1">
                    <span>Kıdem Tazminatı Tutarı:</span>
                    <strong>{formatCurrency(calcPayrollResult.seniorityBonus)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-bold border-t border-slate-200 dark:border-slate-800 pt-1">
                    <span>Toplam İşveren Maliyeti:</span>
                    <strong className="text-xs">{formatCurrency(calcPayrollResult.totalEmployerCost)}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* İşletme Projesi (Bütçe Varyans Analizi) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                İşletme Projesi (Planlanan vs Gerçekleşen Bütçe)
              </h3>

              {businessProject && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {businessProject.categories.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{cat.name}</span>
                          <span className={cat.variance < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {formatCurrency(cat.actualAmount)} / {formatCurrency(cat.plannedAmount)} ({cat.variancePercentage > 0 ? `+${cat.variancePercentage}%` : `${cat.variancePercentage}%`})
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${cat.variance < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (cat.actualAmount / cat.plannedAmount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between font-mono font-bold text-xs">
                    <span>Toplam Bütçe Farkı (Sapma):</span>
                    <span className={businessProject.totalVariance < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {formatCurrency(businessProject.totalVariance)}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODÜL 5: GELİŞMİŞ RAPORLAMA VE EXPORT ÇÖZÜMÜ */}
      {activeTab === 'raporlar' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Resmi Muhasebe & Cari Ekstre Raporlama Motoru
                </h3>
                <p className="text-slate-500 text-xs">Filtrelenmiş verileri resmi çıktı formatında Excel veya PDF olarak indirin.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleExportSimulate('excel')}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExportSimulate('pdf')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                >
                  PDF Rapor
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Daire / Cari</th>
                    <th className="p-3">İşlem Açıklaması</th>
                    <th className="p-3 text-right">Borç (₺)</th>
                    <th className="p-3 text-right">Alacak (₺)</th>
                    <th className="p-3 text-right">Bakiye (₺)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="p-3">2026-06-01</td>
                    <td className="p-3 font-bold font-sans">A-1 Ahmet Yılmaz</td>
                    <td className="p-3 font-sans">Haziran Aidat Tahakkuku</td>
                    <td className="p-3 text-right text-rose-600">1,500.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right font-bold">1,500.00</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="p-3">2026-06-05</td>
                    <td className="p-3 font-bold font-sans">A-3 Zeynep Kaya</td>
                    <td className="p-3 font-sans">Sanal POS Ödemesi Auth: 991823</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-emerald-600">1,500.00</td>
                    <td className="p-3 text-right font-bold">3,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PDF Print Modal for Legal Execution Sheet */}
      {selectedLegalPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl animate-scale-in p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-rose-600" />
                Resmi İcra Takip Föyü (Örnek No: 7)
              </h3>
              <button onClick={() => setSelectedLegalPrint(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 font-mono text-xs border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Borçlu Sakin:</span>
                <strong className="text-slate-900 dark:text-white">{selectedLegalPrint.residentName} (Daire {selectedLegalPrint.apartmentNo})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gecikme Süresi:</span>
                <strong>{selectedLegalPrint.overdueDays} Gün</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                <span>Asıl Alacak:</span>
                <strong>{formatCurrency(selectedLegalPrint.principalAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Yasal İşlemiş Faiz (%24 Yıllık):</span>
                <strong>{formatCurrency(selectedLegalPrint.legalInterest)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Avukatlık Ücreti & Masraf (%10):</span>
                <strong>{formatCurrency(selectedLegalPrint.lawyerFee)}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-rose-600 font-bold text-sm">
                <span>Toplam İcra Alacağı:</span>
                <span>{formatCurrency(selectedLegalPrint.totalExecutionAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedLegalPrint(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  toast.success('Resmi İcra Föyü PDF olarak yazdırıldı.');
                  setSelectedLegalPrint(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Yazdır / PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
