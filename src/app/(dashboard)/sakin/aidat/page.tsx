'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  Calendar, 
  CheckCircle2, 
  Building2, 
  FileText, 
  ChevronRight, 
  Info,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface DueItem {
  id: string;
  type: string;
  period: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID';
}

interface PaymentHistoryItem {
  id: string;
  type: string;
  period: string;
  amount: number;
  paidAt: string;
  method: string;
  receiptNo: string;
}

export default function SakinAidatPage() {
  const [dues, setDues] = useState<DueItem[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [selectedDue, setSelectedDue] = useState<DueItem | null>(null);
  
  // Card Form states
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [showReceipt, setShowReceipt] = useState<PaymentHistoryItem | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const savedDues = localStorage.getItem('sakin_dues');
    const savedPayments = localStorage.getItem('sakin_payments');

    if (savedDues) {
      setDues(JSON.parse(savedDues));
    } else {
      const defaultDues: DueItem[] = [
        { id: 'due-1', type: 'Haziran 2026 Aidatı', period: 'Haziran 2026', amount: 1500, dueDate: '15.06.2026', status: 'PENDING' },
        { id: 'due-2', type: 'Ortak Alan Elektrik', period: 'Haziran 2026', amount: 240, dueDate: '20.06.2026', status: 'PENDING' },
      ];
      localStorage.setItem('sakin_dues', JSON.stringify(defaultDues));
      setDues(defaultDues);
    }

    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    } else {
      const defaultPayments: PaymentHistoryItem[] = [
        { id: 'pay-1', type: 'Mayıs 2026 Aidatı', period: 'Mayıs 2026', amount: 1500, paidAt: '10.05.2026', method: 'Kredi Kartı', receiptNo: 'RE-2026-0091' },
        { id: 'pay-2', type: 'Ortak Alan Elektrik', period: 'Mayıs 2026', amount: 180, paidAt: '10.05.2026', method: 'Kredi Kartı', receiptNo: 'RE-2026-0092' },
      ];
      localStorage.setItem('sakin_payments', JSON.stringify(defaultPayments));
      setPayments(defaultPayments);
    }
  }, []);

  const saveDuesAndPayments = (newDues: DueItem[], newPayments: PaymentHistoryItem[]) => {
    setDues(newDues);
    setPayments(newPayments);
    localStorage.setItem('sakin_dues', JSON.stringify(newDues));
    localStorage.setItem('sakin_payments', JSON.stringify(newPayments));
  };

  const [installment, setInstallment] = useState<number>(1);

  const handleOpenPayment = (due: DueItem) => {
    setSelectedDue(due);
    setCardHolder('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setInstallment(1);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDue) return;

    setIsPaying(true);

    setTimeout(() => {
      setIsPaying(false);
      
      const interestMultiplier = installment === 1 ? 1 : 1 + (installment * 0.015);
      const finalAmount = Math.round(selectedDue.amount * interestMultiplier);

      const newPayment: PaymentHistoryItem = {
        id: `pay-${Date.now()}`,
        type: selectedDue.type,
        period: selectedDue.period,
        amount: finalAmount,
        paidAt: new Date().toLocaleDateString('tr-TR'),
        method: installment > 1 ? `Kredi Kartı (${installment} Taksit)` : 'Kredi Kartı',
        receiptNo: `RE-2026-${Math.floor(1000 + Math.random() * 9000)}`
      };

      const updatedDues = dues.filter(d => d.id !== selectedDue.id);
      const updatedPayments = [newPayment, ...payments];
      
      saveDuesAndPayments(updatedDues, updatedPayments);
      
      // Auto-post payment to payment accounts (Garanti BBVA - acc-2)
      const savedAccs = localStorage.getItem('site_payment_accounts');
      const savedTxs = localStorage.getItem('site_account_transactions');
      if (savedAccs && savedTxs) {
        const allAccs = JSON.parse(savedAccs);
        const allTxs = JSON.parse(savedTxs);
        
        const newTransaction = {
          id: `tx-${Date.now()}-pos`,
          accountId: 'acc-2',
          type: 'TAHSILAT',
          amount: finalAmount,
          direction: 'giris',
          description: `Sakin Online Kart Ödemesi: A-12 Mehmet Kaya (${installment} Taksit)`,
          transactionDate: new Date().toISOString(),
          category: 'Aidat'
        };

        const updatedAccs = allAccs.map((a: any) => {
          if (a.id === 'acc-2') {
            return { ...a, balance: a.balance + finalAmount };
          }
          return a;
        });

        localStorage.setItem('site_payment_accounts', JSON.stringify(updatedAccs));
        localStorage.setItem('site_account_transactions', JSON.stringify([newTransaction, ...allTxs]));
      }
      
      // Notify other pages
      window.dispatchEvent(new Event('storage'));

      toast.success(`${selectedDue.type} ödemesi ${installment} taksitle başarıyla gerçekleştirildi.`);
      setSelectedDue(null);
    }, 1500);
  };

  const unpaidSum = dues.reduce((sum, d) => sum + d.amount, 0);
  const paidSum = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Borçlarım & Ödemelerim
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Dairenize ait güncel aidat borçlarını takip edin ve güvenli online ödeme gerçekleştirin.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 rounded-xl shadow-sm shrink-0">
          <Building2 className="h-5 w-5 text-indigo-500" />
          <div className="text-xs">
            <span className="block font-bold text-[var(--text-primary)]">Mehmet Kaya</span>
            <span className="block text-[var(--text-tertiary)]">Blok A, Daire 12</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Toplam Borç</span>
            <h3 className={`text-2xl font-extrabold ${unpaidSum > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500'}`}>
              {formatCurrency(unpaidSum)}
            </h3>
          </div>
          <span className={`h-11 w-11 rounded-xl flex items-center justify-center ${unpaidSum > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <Wallet className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Bekleyen Fatura</span>
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">
              {dues.length} Adet
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Son Ödeme Tarihi</span>
            <h3 className="text-sm font-extrabold text-[var(--text-primary)] pt-1">
              {dues.length > 0 ? dues[0].dueDate : 'Borç Yok'}
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Ödenen Toplam</span>
            <h3 className="text-2xl font-extrabold text-emerald-500">
              {formatCurrency(paidSum)}
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Unpaid and History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Unpaid section */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                <DollarSign className="h-4 w-4" />
              </span>
              <span>Aktif Borçlarınız</span>
            </h3>

            {dues.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <span>Ödenmemiş borcunuz bulunmamaktadır. Teşekkürler!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {dues.map((due) => (
                  <div key={due.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-indigo-500/30 transition-all gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">{due.type}</h4>
                      <div className="flex items-center space-x-3 text-xs text-[var(--text-tertiary)]">
                        <span>Dönem: {due.period}</span>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Son Vade: {due.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className="text-base font-extrabold text-[var(--text-primary)]">{formatCurrency(due.amount)}</span>
                      <button
                        onClick={() => handleOpenPayment(due)}
                        className="rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 hover:from-primary-700 hover:to-indigo-800 px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Öde
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment History Section */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Ödeme Geçmişi</h3>

            {payments.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">
                Kayıtlı ödeme geçmişi bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[var(--text-tertiary)]">
                      <th className="pb-3 font-semibold">Açıklama / Dönem</th>
                      <th className="pb-3 font-semibold">Tarih</th>
                      <th className="pb-3 font-semibold">Yöntem</th>
                      <th className="pb-3 font-semibold text-right">Tutar</th>
                      <th className="pb-3 font-semibold text-right">Makbuz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]/40">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <td className="py-3.5">
                          <span className="font-bold block text-[var(--text-primary)]">{pay.type}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">Makbuz: {pay.receiptNo}</span>
                        </td>
                        <td className="py-3.5">{pay.paidAt}</td>
                        <td className="py-3.5">{pay.method}</td>
                        <td className="py-3.5 text-right font-bold text-[var(--text-primary)]">{formatCurrency(pay.amount)}</td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setShowReceipt(pay)}
                            className="rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-secondary)] transition-colors"
                          >
                            Makbuz
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Bank Info */}
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-500" />
              <span>Banka Havale/EFT Detayları</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Ödemelerinizi doğrudan site yönetim banka hesabına havale veya EFT olarak da yapabilirsiniz.
            </p>
            
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 space-y-3 text-xs">
              <div>
                <span className="block text-[10px] text-[var(--text-tertiary)] font-semibold">Banka Adı</span>
                <strong className="text-[var(--text-primary)]">Garanti BBVA</strong>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--text-tertiary)] font-semibold">Alıcı Adı</span>
                <strong className="text-[var(--text-primary)]">Yıldız Konakları Site Yönetimi</strong>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--text-tertiary)] font-semibold">IBAN Numarası</span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <strong className="text-[var(--text-primary)] font-mono break-all text-[11px]">
                    TR56 0006 2000 0001 2345 6789 01
                  </strong>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('TR560006200000012345678901');
                      toast.success('IBAN panoya kopyalandı.');
                    }}
                    className="text-[10px] font-bold text-indigo-500 hover:underline shrink-0"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--border-color)]/50">
                <span className="block text-[10px] text-[var(--text-tertiary)] font-semibold">Önemli Açıklama Kodu</span>
                <strong className="text-rose-500 font-mono">A-12 - [Ödenen Dönem]</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Card Payment Modal */}
      {selectedDue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Kartla Güvenli Ödeme</h3>
              <button 
                onClick={() => setSelectedDue(null)} 
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-semibold"
              >
                Kapat
              </button>
            </div>
            
            <div className="my-4 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Ödenecek Borç:</span>
                <strong className="text-[var(--text-primary)]">{selectedDue.type}</strong>
              </div>
              <div className="flex justify-between items-center mt-1 text-sm">
                <span className="text-[var(--text-secondary)]">Tutar:</span>
                <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{formatCurrency(selectedDue.amount)}</strong>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Kart Sahibi Adı Soyadı</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Kart üzerinde yazan isim"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Kart Numarası</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                  placeholder="0000 0000 0000 0000"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Son Kullanma Tarihi</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.substring(0, 5))}
                    placeholder="AA/YY"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">CVC / CVV</label>
                  <input
                    type="password"
                    required
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                    placeholder="***"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Taksit Seçeneği</label>
                <select
                  value={installment}
                  onChange={(e) => setInstallment(Number(e.target.value))}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value={1}>Tek Çekim ({formatCurrency(selectedDue.amount)})</option>
                  <option value={3}>3 Taksit ({formatCurrency(Math.round(selectedDue.amount * 1.045))} - Aylık {formatCurrency(Math.round(selectedDue.amount * 1.045 / 3))})</option>
                  <option value={6}>6 Taksit ({formatCurrency(Math.round(selectedDue.amount * 1.09))} - Aylık {formatCurrency(Math.round(selectedDue.amount * 1.09 / 6))})</option>
                  <option value={12}>12 Taksit ({formatCurrency(Math.round(selectedDue.amount * 1.18))} - Aylık {formatCurrency(Math.round(selectedDue.amount * 1.18 / 12))})</option>
                </select>
                {installment > 1 && (
                  <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
                    * Taksitli işlemlerde %{(installment * 1.5).toFixed(1)} banka vade farkı uygulanmıştır.
                  </span>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedDue(null)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="rounded-lg bg-gradient-to-r from-primary-600 to-indigo-700 px-5 py-2 text-xs font-semibold text-white shadow hover:from-primary-700 hover:to-indigo-800 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPaying ? 'Ödeniyor...' : 'Ödemeyi Tamamla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in relative overflow-hidden">
            
            {/* Receipt details */}
            <div className="text-center pb-6 border-b border-dashed border-[var(--border-color)]">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Ödeme Makbuzu</h3>
              <span className="text-[10px] text-[var(--text-tertiary)]">{showReceipt.receiptNo}</span>
            </div>

            <div className="py-6 space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Ödeyen Sakin:</span>
                <span className="font-semibold text-[var(--text-primary)]">Mehmet Kaya</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Daire:</span>
                <span className="font-semibold text-[var(--text-primary)]">A Blok, Daire 12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Fatura Dönemi:</span>
                <span className="font-semibold text-[var(--text-primary)]">{showReceipt.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Açıklama:</span>
                <span className="font-semibold text-[var(--text-primary)]">{showReceipt.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Ödeme Tarihi:</span>
                <span className="font-semibold text-[var(--text-primary)]">{showReceipt.paidAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Ödeme Yöntemi:</span>
                <span className="font-semibold text-[var(--text-primary)]">{showReceipt.method}</span>
              </div>
              <div className="pt-3 border-t border-[var(--border-color)]/30 flex justify-between items-center text-sm">
                <strong className="text-[var(--text-primary)]">Toplam Tutar:</strong>
                <strong className="text-emerald-500 font-extrabold text-base">{formatCurrency(showReceipt.amount)}</strong>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setShowReceipt(null)}
                className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 py-2.5 text-xs font-bold text-white shadow hover:from-primary-700 hover:to-indigo-800"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
