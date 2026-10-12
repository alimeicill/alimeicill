'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Landmark,
  ArrowLeft,
  Plus,
  DollarSign,
  Wallet,
  ArrowRightLeft,
  Search,
  X,
  Printer,
  Pencil,
  Eye,
  Trash2,
  Info,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// Sunucudan gelen hesap (bakiye hareketlerden hesaplanır).
interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK';
  bankName: string | null;
  iban: string | null;
  holderName: string | null;
  showToResidents: boolean;
  isActive: boolean;
  balance: number;
}

interface StatementRow {
  id: string;
  type: string;
  typeLabel: string;
  amount: number;
  date: string;
  description: string;
  receiptNo: string | null;
  manual: boolean;
  balance: number;
}

type TxKind = 'OTHER_INCOME' | 'EXPENSE' | 'VENDOR_PAYMENT' | 'TRANSFER';

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'İşlem tamamlanamadı.');
  return data as T;
}

const today = () => new Date().toISOString().slice(0, 10);
const inputCls = 'block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none';
const labelCls = 'text-xs font-semibold text-[var(--text-secondary)]';

export default function KasaBankaPage() {
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading, error } = useQuery<Account[]>({
    queryKey: ['cash-accounts'],
    queryFn: () => apiJson<Account[]>('/api/yonetici/kasa'),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['cash-accounts'] }).then(() => queryClient.invalidateQueries({ queryKey: ['cash-statement'] }));
  const active = accounts.filter((a) => a.isActive);

  const [saving, setSaving] = useState(false);
  const [accountForm, setAccountForm] = useState<{ edit: Account | null } | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [ekstreAccount, setEkstreAccount] = useState<Account | null>(null);

  // Hesap formu
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'CASH' | 'BANK'>('BANK');
  const [accBank, setAccBank] = useState('');
  const [accIban, setAccIban] = useState('');
  const [accHolder, setAccHolder] = useState('');
  const [accShow, setAccShow] = useState(true);
  const [accOpening, setAccOpening] = useState('');

  const openAccountForm = (edit: Account | null) => {
    setAccName(edit?.name ?? '');
    setAccType(edit?.type ?? 'BANK');
    setAccBank(edit?.bankName ?? '');
    setAccIban(edit?.iban ?? '');
    setAccHolder(edit?.holderName ?? '');
    setAccShow(edit ? edit.showToResidents : true);
    setAccOpening('');
    setAccountForm({ edit });
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm) return;
    setSaving(true);
    try {
      const common = { name: accName, bankName: accBank, iban: accIban, holderName: accHolder, showToResidents: accType === 'BANK' && accShow };
      if (accountForm.edit) {
        await apiJson(`/api/yonetici/kasa/${accountForm.edit.id}`, { method: 'PATCH', body: JSON.stringify(common) });
        toast.success('Hesap bilgileri güncellendi.');
      } else {
        await apiJson('/api/yonetici/kasa', {
          method: 'POST',
          body: JSON.stringify({ ...common, type: accType, openingBalance: accOpening ? accOpening.replace(',', '.') : undefined }),
        });
        toast.success(`${accName} hesabı tanımlandı.`);
      }
      await refresh();
      setAccountForm(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (acc: Account) => {
    const msg = acc.isActive ? `${acc.name} hesabı kapatılsın mı? Kapalı hesaba işlem yapılamaz.` : `${acc.name} hesabı yeniden açılsın mı?`;
    if (!window.confirm(msg)) return;
    try {
      await apiJson(`/api/yonetici/kasa/${acc.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !acc.isActive }) });
      await refresh();
      toast.success(acc.isActive ? 'Hesap kapatıldı.' : 'Hesap açıldı.');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // İşlem formu
  const [txKind, setTxKind] = useState<TxKind>('EXPENSE');
  const [txAccountId, setTxAccountId] = useState('');
  const [txTargetId, setTxTargetId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(today());

  const openTxForm = () => {
    setTxKind('EXPENSE');
    setTxAccountId('');
    setTxTargetId('');
    setTxAmount('');
    setTxDescription('');
    setTxDate(today());
    setTxOpen(true);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiJson('/api/yonetici/kasa/hareketler', {
        method: 'POST',
        body: JSON.stringify({
          kind: txKind,
          accountId: txAccountId,
          targetAccountId: txKind === 'TRANSFER' ? txTargetId : undefined,
          amount: txAmount.replace(',', '.'),
          date: txDate,
          description: txDescription,
        }),
      });
      await refresh();
      toast.success(txKind === 'TRANSFER' ? 'Virman kaydedildi.' : 'İşlem kaydedildi.');
      setTxOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    const sum = (xs: Account[]) => xs.reduce((a, x) => a + Math.round(x.balance * 100), 0) / 100;
    return { all: sum(active), cash: sum(active.filter((a) => a.type === 'CASH')), bank: sum(active.filter((a) => a.type === 'BANK')) };
  }, [active]);

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen pb-12">
      <div className="space-y-4">
        <Link
          href="/yonetici/dashboard"
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Panoya Dön
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Kasa & Banka Hesapları</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Aidat tahsilatları seçilen hesaba kendiliğinden işlenir. Giderleri ve hesaplar arası virmanı buradan girin.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openTxForm}
              disabled={active.length === 0}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all disabled:opacity-50"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4 text-indigo-500" />
              İşlem Ekle
            </button>
            <button
              onClick={() => openAccountForm(null)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Hesap Ekle
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600">{(error as Error).message}</div>}

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
        <SummaryCard label="Toplam Varlık" value={totals.all} tone="indigo" icon={<DollarSign className="h-6 w-6" />} />
        <SummaryCard label="Kasa Toplamı" value={totals.cash} tone="emerald" icon={<Wallet className="h-6 w-6" />} />
        <SummaryCard label="Banka Toplamı" value={totals.bank} tone="blue" icon={<Landmark className="h-6 w-6" />} />
      </div>

      {!isLoading && accounts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 text-center text-sm text-[var(--text-secondary)]">
          Henüz hesap tanımlı değil. Sitenin banka hesabını ekleyin; IBAN’ı sakinlerin borç sayfasında görünsün.
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className={`glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between ${acc.isActive ? '' : 'opacity-60'}`}
          >
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border-color)]/50 pb-3 mb-4 gap-2">
                <span
                  className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    acc.type === 'CASH'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                  }`}
                >
                  {acc.type === 'CASH' ? 'Nakit Kasa' : 'Banka Hesabı'}
                </span>
                <div className="flex items-center gap-2">
                  {!acc.isActive && <span className="text-[10px] font-bold text-rose-500">KAPALI</span>}
                  {acc.showToResidents && (
                    <span title="Sakinlerin borç sayfasında görünür" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      <Eye className="h-3 w-3" /> Sakinlere açık
                    </span>
                  )}
                  {acc.type === 'BANK' && <span className="truncate text-[10px] text-[var(--text-tertiary)] font-semibold uppercase">{acc.bankName}</span>}
                </div>
              </div>

              <div className="flex items-start justify-between gap-2">
                <h4 className="font-extrabold text-[var(--text-primary)] text-sm">{acc.name}</h4>
                <button onClick={() => openAccountForm(acc)} title="Düzenle" aria-label={`${acc.name} hesabını düzenle`} className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              {acc.iban && (
                <div className="mt-3 bg-[var(--bg-primary)] p-2.5 rounded-lg border border-[var(--border-color)]/65 font-mono text-[11px] text-[var(--text-secondary)] break-all select-all">
                  {acc.iban}
                </div>
              )}

              <div className="mt-3 text-[11px] text-[var(--text-secondary)]">
                {acc.type === 'BANK' ? 'Hesap sahibi' : 'Sorumlu'}: <strong className="text-[var(--text-primary)]">{acc.holderName || 'Belirtilmemiş'}</strong>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-color)]/50 flex items-center justify-between gap-2">
              <div>
                <span className="block text-[9px] text-[var(--text-tertiary)] uppercase font-semibold">Bakiye</span>
                <strong className={`text-lg font-black ${acc.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>{formatCurrency(acc.balance)}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                {(acc.balance === 0 || !acc.isActive) && (
                  <button onClick={() => handleToggleActive(acc)} className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]">
                    {acc.isActive ? 'Kapat' : 'Aç'}
                  </button>
                )}
                <button
                  onClick={() => setEkstreAccount(acc)}
                  className="rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                >
                  Ekstre
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {accountForm && (
        <ModalShell title={accountForm.edit ? 'Hesabı Düzenle' : 'Yeni Hesap Ekle'} onClose={() => setAccountForm(null)}>
          <form onSubmit={handleSaveAccount} className="space-y-4 pt-4 text-xs">
            {!accountForm.edit && (
              <div className="space-y-1">
                <label htmlFor="acc-type" className={labelCls}>Hesap türü *</label>
                <select id="acc-type" value={accType} onChange={(e) => setAccType(e.target.value as 'CASH' | 'BANK')} className={inputCls}>
                  <option value="BANK">Banka hesabı</option>
                  <option value="CASH">Nakit kasa</option>
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label htmlFor="acc-name" className={labelCls}>Hesap adı *</label>
              <input id="acc-name" required value={accName} onChange={(e) => setAccName(e.target.value)} placeholder={accType === 'BANK' ? 'Örn: Aidat Hesabı' : 'Örn: Yönetim Kasası'} className={inputCls} />
            </div>
            {accType === 'BANK' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="acc-bank" className={labelCls}>Banka *</label>
                    <input id="acc-bank" required value={accBank} onChange={(e) => setAccBank(e.target.value)} placeholder="Örn: Ziraat Bankası" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acc-holder" className={labelCls}>Hesap sahibi</label>
                    <input id="acc-holder" value={accHolder} onChange={(e) => setAccHolder(e.target.value)} placeholder="Örn: … Site Yönetimi" className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="acc-iban" className={labelCls}>IBAN</label>
                  <input id="acc-iban" value={accIban} onChange={(e) => setAccIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" className={`${inputCls} font-mono`} />
                </div>
                <label className="flex items-start gap-2 rounded-lg bg-[var(--bg-primary)] p-3 cursor-pointer">
                  <input type="checkbox" checked={accShow} onChange={(e) => setAccShow(e.target.checked)} className="mt-0.5" />
                  <span className="text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Sakinlere göster.</strong> Sakinler borç sayfasında bu hesabın IBAN’ını görür ve kopyalayabilir.
                  </span>
                </label>
              </>
            )}
            {accType === 'CASH' && (
              <div className="space-y-1">
                <label htmlFor="acc-holder" className={labelCls}>Sorumlu kişi</label>
                <input id="acc-holder" value={accHolder} onChange={(e) => setAccHolder(e.target.value)} className={inputCls} />
              </div>
            )}
            {!accountForm.edit && (
              <div className="space-y-1">
                <label htmlFor="acc-opening" className={labelCls}>Açılış bakiyesi (₺)</label>
                <input id="acc-opening" inputMode="decimal" placeholder="0,00" value={accOpening} onChange={(e) => setAccOpening(e.target.value)} className={inputCls} />
              </div>
            )}
            <FormButtons saving={saving} onCancel={() => setAccountForm(null)} label={accountForm.edit ? 'Kaydet' : 'Hesap Tanımla'} />
          </form>
        </ModalShell>
      )}

      {txOpen && (
        <ModalShell title="Kasa / Banka İşlemi" onClose={() => setTxOpen(false)}>
          <form onSubmit={handleAddTransaction} className="space-y-4 pt-4 text-xs">
            <div className="space-y-1">
              <label htmlFor="tx-kind" className={labelCls}>İşlem türü *</label>
              <select id="tx-kind" value={txKind} onChange={(e) => setTxKind(e.target.value as TxKind)} className={inputCls}>
                <option value="EXPENSE">Gider ödemesi (çıkış)</option>
                <option value="VENDOR_PAYMENT">Firma / personel ödemesi (çıkış)</option>
                <option value="OTHER_INCOME">Diğer gelir (giriş)</option>
                <option value="TRANSFER">Virman (hesaplar arası)</option>
              </select>
            </div>
            <p className="flex gap-2 rounded-lg bg-indigo-500/5 p-2.5 text-[11px] text-[var(--text-secondary)]">
              <Info className="h-4 w-4 shrink-0 text-indigo-500" />
              Aidat tahsilatlarını Aidat ekranından girin; kasaya kendiliğinden işlenir.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="tx-amount" className={labelCls}>Tutar (₺) *</label>
                <input id="tx-amount" required inputMode="decimal" placeholder="0,00" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label htmlFor="tx-date" className={labelCls}>Tarih *</label>
                <input id="tx-date" type="date" required max={today()} value={txDate} onChange={(e) => setTxDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className={txKind === 'TRANSFER' ? 'grid grid-cols-2 gap-4' : ''}>
              <div className="space-y-1">
                <label htmlFor="tx-account" className={labelCls}>{txKind === 'TRANSFER' ? 'Kaynak hesap *' : 'Hesap *'}</label>
                <select id="tx-account" required value={txAccountId} onChange={(e) => setTxAccountId(e.target.value)} className={inputCls}>
                  <option value="">Seçin</option>
                  {active.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                  ))}
                </select>
              </div>
              {txKind === 'TRANSFER' && (
                <div className="space-y-1">
                  <label htmlFor="tx-target" className={labelCls}>Hedef hesap *</label>
                  <select id="tx-target" required value={txTargetId} onChange={(e) => setTxTargetId(e.target.value)} className={inputCls}>
                    <option value="">Seçin</option>
                    {active.filter((a) => a.id !== txAccountId).map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="tx-desc" className={labelCls}>Açıklama {txKind === 'TRANSFER' ? '' : '*'}</label>
              <input id="tx-desc" required={txKind !== 'TRANSFER'} value={txDescription} onChange={(e) => setTxDescription(e.target.value)} placeholder="Örn: Asansör bakım faturası" className={inputCls} />
            </div>
            <FormButtons saving={saving} onCancel={() => setTxOpen(false)} label="İşlemi Kaydet" />
          </form>
        </ModalShell>
      )}

      {ekstreAccount && <StatementModal account={accounts.find((a) => a.id === ekstreAccount.id) ?? ekstreAccount} onClose={() => setEkstreAccount(null)} onChanged={refresh} />}
    </div>
  );
}

function StatementModal({ account, onClose, onChanged }: { account: Account; onClose: () => void; onChanged: () => Promise<unknown> }) {
  const { data: rows = [], isLoading } = useQuery<StatementRow[]>({
    queryKey: ['cash-statement', account.id],
    queryFn: () => apiJson<StatementRow[]>(`/api/yonetici/kasa/${account.id}/ekstre`),
  });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.toLocaleLowerCase('tr-TR');
    const now = Date.now();
    const days = { today: 1, week: 7, month: 30 }[periodFilter as 'today' | 'week' | 'month'];
    return rows.filter((t) => {
      const matchesSearch = !q || t.description.toLocaleLowerCase('tr-TR').includes(q) || String(t.amount).includes(q) || (t.receiptNo ?? '').toLowerCase().includes(q);
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'in' && t.amount > 0 && !t.type.startsWith('TRANSFER')) ||
        (typeFilter === 'out' && t.amount < 0 && !t.type.startsWith('TRANSFER')) ||
        (typeFilter === 'transfer' && t.type.startsWith('TRANSFER'));
      const matchesPeriod = !days || now - new Date(t.date).getTime() <= days * 86_400_000;
      return matchesSearch && matchesType && matchesPeriod;
    });
  }, [rows, search, typeFilter, periodFilter]);

  const sumIn = filtered.reduce((a, t) => a + (t.amount > 0 ? Math.round(t.amount * 100) : 0), 0) / 100;
  const sumOut = filtered.reduce((a, t) => a + (t.amount < 0 ? Math.round(-t.amount * 100) : 0), 0) / 100;

  const handleDelete = async (row: StatementRow) => {
    if (!window.confirm(`“${row.description}” kaydı silinsin mi?${row.type.startsWith('TRANSFER') ? ' Virmanın diğer hesaptaki karşılığı da silinir.' : ''}`)) return;
    try {
      await apiJson(`/api/yonetici/kasa/hareketler/${row.id}`, { method: 'DELETE' });
      await onChanged();
      toast.success('Kayıt silindi.');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="glass w-full max-w-4xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in relative overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)]">Hesap Ekstresi</h3>
            <span className="text-xs text-[var(--text-secondary)] mt-0.5 font-bold block">
              {account.name} {account.bankName ? `(${account.bankName})` : ''}
            </span>
          </div>
          <button onClick={onClose} aria-label="Kapat" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] print:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-4 flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Ekstrede ara (açıklama, tutar, makbuz)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-primary)] focus:outline-none">
              <option value="all">Tüm hareketler</option>
              <option value="in">Girişler</option>
              <option value="out">Çıkışlar</option>
              <option value="transfer">Virmanlar</option>
            </select>
            <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-primary)] focus:outline-none">
              <option value="all">Tüm zamanlar</option>
              <option value="today">Bugün</option>
              <option value="week">Son 7 gün</option>
              <option value="month">Son 30 gün</option>
            </select>
            <button onClick={() => window.print()} className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" title="Yazdır" aria-label="Yazdır">
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] border border-[var(--border-color)]/70 rounded-xl bg-[var(--bg-primary)]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sticky top-0 backdrop-blur-md">
                <th className="p-3">Tarih</th>
                <th className="p-3">Açıklama</th>
                <th className="p-3 text-right">Giriş</th>
                <th className="p-3 text-right">Çıkış</th>
                <th className="p-3 text-right">Bakiye</th>
                <th className="p-3 print:hidden" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/40">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-[var(--text-tertiary)]">Yükleniyor…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-[var(--text-tertiary)]">Seçilen ölçütlerde hareket yok.</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/10">
                    <td className="p-3 text-[11px] whitespace-nowrap text-[var(--text-tertiary)]">{formatDate(t.date)}</td>
                    <td className="p-3">
                      <span className="font-bold text-[var(--text-primary)] block">{t.description}</span>
                      <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">
                        {t.typeLabel}
                        {t.receiptNo ? ` · Makbuz ${t.receiptNo}` : ''}
                      </span>
                    </td>
                    <td className="p-3 text-right text-emerald-500 font-bold">{t.amount > 0 ? formatCurrency(t.amount) : ''}</td>
                    <td className="p-3 text-right text-rose-500 font-bold">{t.amount < 0 ? formatCurrency(-t.amount) : ''}</td>
                    <td className="p-3 text-right font-black text-[var(--text-primary)]">{formatCurrency(t.balance)}</td>
                    <td className="p-3 text-right print:hidden">
                      {t.manual && (
                        <button onClick={() => handleDelete(t)} title="Hatalı kaydı sil" aria-label="Hatalı kaydı sil" className="rounded p-1 text-[var(--text-tertiary)] hover:bg-rose-500/10 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-[var(--border-color)]/50 mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex gap-4">
            <span>Girişler: <strong className="text-emerald-500">{formatCurrency(sumIn)}</strong></span>
            <span>Çıkışlar: <strong className="text-rose-500">{formatCurrency(sumOut)}</strong></span>
          </div>
          <div>
            Güncel bakiye: <strong className="text-indigo-500 text-sm">{formatCurrency(account.balance)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone, icon }: { label: string; value: number; tone: 'indigo' | 'emerald' | 'blue'; icon: React.ReactNode }) {
  const tones = { indigo: 'bg-indigo-500/10 text-indigo-500', emerald: 'bg-emerald-500/10 text-emerald-500', blue: 'bg-blue-500/10 text-blue-500' };
  return (
    <div className="glass rounded-2xl border border-[var(--border-color)] p-5 flex items-center justify-between bg-[var(--bg-secondary)] shadow-sm">
      <div>
        <p className="text-xs font-semibold text-[var(--text-secondary)]">{label}</p>
        <h3 className={`text-2xl font-black mt-1 ${tone === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-primary)]'}`}>{formatCurrency(value)}</h3>
      </div>
      <div className={`p-3 rounded-xl ${tones[tone]}`}>{icon}</div>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
          <button onClick={onClose} aria-label="Kapat" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormButtons({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--border-color)]/30 mt-6">
      <button type="button" onClick={onCancel} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
        Vazgeç
      </button>
      <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-60">
        {saving ? 'Kaydediliyor…' : label}
      </button>
    </div>
  );
}
