'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Building2, Calendar, CheckCircle2, DollarSign, FileText, Info, Landmark, Printer, Wallet, X } from 'lucide-react';
import { formatCurrency, formatPeriod } from '@/lib/utils';
import { useCurrentUser } from '@/lib/auth/use-current-user';

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  receiptNo: string;
  notes: string | null;
}

interface InvoiceRow {
  id: string;
  unitId: string;
  unitNumber: string;
  blockName: string;
  period: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  lateFee: number;
  status: 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  payments: PaymentRow[];
}

interface SakinAidat {
  units: { id: string; label: string; isOwner: boolean }[];
  invoices: InvoiceRow[];
}

type ReceiptView = PaymentRow & { invoice: InvoiceRow };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function SakinAidatPage() {
  const { data: me } = useCurrentUser();
  const { data, isLoading, error } = useQuery<SakinAidat>({
    queryKey: ['invoices', 'resident'],
    queryFn: async () => {
      const res = await fetch('/api/sakin/aidat');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Borç bilgileri yüklenemedi.');
      return body;
    },
  });
  const [receipt, setReceipt] = useState<ReceiptView | null>(null);
  const [showHowToPay, setShowHowToPay] = useState(false);

  const invoices = data?.invoices ?? [];
  const open = useMemo(() => invoices.filter((i) => i.remainingAmount > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [invoices]);
  const payments = useMemo(
    () => invoices.flatMap((inv) => inv.payments.map((p) => ({ ...p, invoice: inv }))).sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
    [invoices],
  );
  // Tutarlar sunucudan kuruş hassasiyetinde gelir; toplamlar kuruş üzerinden alınır.
  const sumCents = (xs: number[]) => xs.reduce((a, x) => a + Math.round(x * 100), 0) / 100;
  const unpaidSum = sumCents(open.map((i) => i.remainingAmount));
  const feeSum = sumCents(open.map((i) => i.lateFee));
  const paidSum = sumCents(payments.map((p) => p.amount));
  const nextDue = open[0]?.dueDate;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Borçlarım & Ödemelerim</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Dairenize ait aidat ve diğer borçları, ödemelerinizi ve makbuzlarınızı takip edin.</p>
        </div>
        <div className="flex shrink-0 items-center space-x-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 shadow-sm">
          <Building2 className="h-5 w-5 text-indigo-500" />
          <div className="text-xs">
            <span className="block font-bold text-[var(--text-primary)]">{me?.name}</span>
            <span className="block text-[var(--text-tertiary)]">{data?.units.map((u) => u.label).join(', ') || 'Daire bağlı değil'}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600">{(error as Error).message}</div>
      )}
      {data && data.units.length === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          Hesabınıza bağlı bir daire bulunmuyor. Site yönetiminizden hesabınızı dairenize bağlamasını isteyin.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Toplam Borç" value={formatCurrency(unpaidSum)} tone={unpaidSum > 0 ? 'rose' : 'emerald'} icon={<Wallet className="h-5 w-5" />} />
        <Stat label="Gecikme Tazminatı" value={formatCurrency(feeSum)} tone={feeSum > 0 ? 'amber' : 'emerald'} icon={<AlertTriangle className="h-5 w-5" />} />
        <Stat label="En Yakın Son Ödeme" value={nextDue ? fmtDate(nextDue) : 'Borç yok'} tone="blue" icon={<Calendar className="h-5 w-5" />} />
        <Stat label="Ödenen Toplam" value={formatCurrency(paidSum)} tone="emerald" icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="glass rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                <DollarSign className="h-4 w-4" />
              </span>
              Açık Borçlarınız
            </h3>
            {isLoading ? (
              <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">Yükleniyor…</p>
            ) : open.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-2 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] py-8 text-center text-sm text-[var(--text-tertiary)]">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <span>Ödenmemiş borcunuz bulunmuyor. Teşekkürler!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {open.map((inv) => (
                  <div key={inv.id} className="flex flex-col justify-between gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {formatPeriod(inv.period)} {inv.description}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-tertiary)]">
                        <span>
                          {inv.blockName} / Daire {inv.unitNumber}
                        </span>
                        <span className={inv.status === 'overdue' ? 'font-semibold text-rose-500' : 'font-semibold text-amber-600 dark:text-amber-400'}>
                          {inv.status === 'overdue' ? 'Vadesi geçti: ' : 'Son ödeme: '}
                          {fmtDate(inv.dueDate)}
                        </span>
                        {inv.paidAmount > 0 && <span>Ödenen: {formatCurrency(inv.paidAmount)}</span>}
                      </div>
                      {inv.lateFee > 0 && (
                        <p className="text-[11px] text-rose-500">+ {formatCurrency(inv.lateFee)} gecikme tazminatı (KMK md. 20, aylık %5)</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t pt-2 sm:justify-end sm:border-t-0 sm:pt-0">
                      <span className="text-base font-extrabold text-[var(--text-primary)]">{formatCurrency(inv.remainingAmount)}</span>
                      <button
                        onClick={() => setShowHowToPay(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-primary-700 hover:to-indigo-800"
                      >
                        <Landmark className="h-3.5 w-3.5" /> Nasıl öderim?
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Ödeme Geçmişi</h3>
            {payments.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--text-tertiary)]">Kayıtlı ödeme bulunmuyor.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[var(--text-tertiary)]">
                      <th className="pb-3 font-semibold">Açıklama / Dönem</th>
                      <th className="pb-3 font-semibold">Tarih</th>
                      <th className="pb-3 font-semibold">Yöntem</th>
                      <th className="pb-3 text-right font-semibold">Tutar</th>
                      <th className="pb-3 text-right font-semibold">Makbuz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]/40">
                    {payments.map((p) => (
                      <tr key={p.id} className="text-[var(--text-secondary)]">
                        <td className="py-3.5">
                          <span className="block font-bold text-[var(--text-primary)]">
                            {formatPeriod(p.invoice.period)} {p.invoice.description}
                          </span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">Makbuz: {p.receiptNo}</span>
                        </td>
                        <td className="py-3.5">{fmtDate(p.paidAt)}</td>
                        <td className="py-3.5">{p.method}</td>
                        <td className="py-3.5 text-right font-bold text-[var(--text-primary)]">{formatCurrency(p.amount)}</td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setReceipt(p)}
                            className="rounded-lg border border-[var(--border-color)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)]"
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
          </section>
        </div>

        <aside className="glass h-fit space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Info className="h-4 w-4 text-indigo-500" /> Bilgilendirme
          </h3>
          <ul className="list-disc space-y-2 pl-4 text-xs text-[var(--text-secondary)]">
            <li>Ödemeleriniz yönetim tarafından kaydedildiğinde burada görünür.</li>
            <li>Vadesi geçen borçlar için Kat Mülkiyeti Kanunu md. 20 uyarınca aylık %5 gecikme tazminatı uygulanabilir.</li>
            <li>Borcunuzla ilgili bir hata olduğunu düşünüyorsanız “Arıza Bildirimi” üzerinden yönetime iletebilirsiniz.</li>
          </ul>
        </aside>
      </div>

      {showHowToPay && (
        <Modal title="Ödeme nasıl yapılır?" onClose={() => setShowHowToPay(false)}>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            <li>Ödemenizi site yönetiminin banka hesabına havale / EFT ile yapın.</li>
            <li>
              Açıklama alanına <strong className="text-[var(--text-primary)]">blok ve daire numaranızı</strong> yazın (örn. {open[0] ? `${open[0].blockName} ${open[0].unitNumber}` : 'A Blok A-101'}).
            </li>
            <li>Yönetim ödemenizi kaydettiğinde borcunuz bu sayfada güncellenir ve makbuzunuz oluşur.</li>
          </ol>
          <p className="mt-4 rounded-lg bg-[var(--bg-primary)] p-3 text-xs text-[var(--text-tertiary)]">
            Banka hesap bilgileri için site yönetiminize başvurun. Online kartla ödeme henüz bu sitede etkin değildir.
          </p>
        </Modal>
      )}

      {receipt && (
        <Modal title="Tahsilat Makbuzu" onClose={() => setReceipt(null)}>
          <div id="makbuz" className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-[var(--text-tertiary)]">Makbuz No</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{receipt.receiptNo}</span>
            </div>
            <Row label="Sakin" value={me?.name ?? ''} />
            <Row label="Daire" value={`${receipt.invoice.blockName} / Daire ${receipt.invoice.unitNumber}`} />
            <Row label="Açıklama" value={`${formatPeriod(receipt.invoice.period)} ${receipt.invoice.description}`} />
            <Row label="Ödeme tarihi" value={fmtDate(receipt.paidAt)} />
            <Row label="Yöntem" value={receipt.method} />
            <div className="flex justify-between border-t border-[var(--border-color)] pt-2 text-base">
              <span className="font-semibold text-[var(--text-secondary)]">Tutar</span>
              <span className="font-extrabold text-emerald-600">{formatCurrency(receipt.amount)}</span>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
              <Printer className="h-3.5 w-3.5" /> Yazdır
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string; tone: 'rose' | 'emerald' | 'amber' | 'blue'; icon: React.ReactNode }) {
  const tones = {
    rose: 'text-rose-500 bg-rose-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
  };
  return (
    <div className="glass flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-sm">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
        <h3 className={`text-2xl font-extrabold ${tone === 'blue' ? 'text-[var(--text-primary)] text-base pt-1' : tones[tone].split(' ')[0]}`}>{value}</h3>
      </div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--text-tertiary)]">{label}</span>
      <span className="text-right font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm print:hidden" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
            <FileText className="h-5 w-5 text-indigo-500" /> {title}
          </h3>
          <button onClick={onClose} aria-label="Kapat" className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] print:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
