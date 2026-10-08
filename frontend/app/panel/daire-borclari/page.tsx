'use client';

import { Building, Clock, Eye, History, Plus, Search, Wallet, FileInput } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { PaymentModal } from '@/components/payment-modal';
import { Badge, Button, Checkbox, ConfirmButton, Empty, ErrorText, Field, Loading, Modal, PageHeader, StatCard, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { MONTHS, date, money, periodLabel, toNum, today } from '@/lib/format';
import type { FinanceItem, Site, SiteDetail } from '@/lib/types';

interface Debts {
  site: Site;
  summary: { dueTotal: string; dueUnits: number; balanceTotal: string };
  units: { unitId: string; label: string; block: string; doorNo: string; debtor: string | null; due: string; balance: string }[];
}

export default function DebtsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DebtsInner />
    </Suspense>
  );
}

function DebtsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: sites } = useApi<Site[]>('/sites');
  const siteId = params.get('site') || sites?.[0]?.id || '';
  const { data, isLoading } = useApi<Debts>(siteId ? `/sites/${siteId}/debts` : null);
  const [q, setQ] = useState('');
  const [onlyDue, setOnlyDue] = useState(false);
  const [modal, setModal] = useState<'aidat' | 'manual' | 'history' | null>(null);
  const [payUnit, setPayUnit] = useState<{ id: string; label: string; siteId: string; balance: string } | null>(null);

  const rows = useMemo(
    () =>
      (data?.units ?? []).filter(
        (u) => (!onlyDue || toNum(u.due) > 0) && `${u.label} ${u.debtor ?? ''}`.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')),
      ),
    [data, q, onlyDue],
  );

  if (sites && sites.length === 0) {
    return (
      <>
        <PageHeader title="Daire borçları" />
        <Empty>
          Önce bir site oluşturun.{' '}
          <Link href="/panel/siteler?yeni=1" className="text-brand-600 hover:underline">
            Kurulum sihirbazı
          </Link>
        </Empty>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Daire borçları" description="Site seçin; özet ve işlemler aşağıdadır." />
      <div className="card mb-5 p-4">
        <Field label="Site" className="max-w-sm">
          <select className="field" value={siteId} onChange={(e) => router.replace(`/panel/daire-borclari?site=${e.target.value}`)}>
            {sites?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.code ? ` (${s.code})` : ''}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard tone="amber" label="Vadesi gelen toplam" value={money(data.summary.dueTotal)} icon={<Clock className="size-5" />} />
            <StatCard tone="orange" label="Vadesi gelen bağımsız bölüm" value={data.summary.dueUnits} sub="Bu site için adet" icon={<Building className="size-5" />} />
            <StatCard tone="blue" label="Toplam bakiye" value={money(data.summary.balanceTotal)} sub="Vadesi gelmemiş borç ve avans dahil" icon={<Wallet className="size-5" />} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <ActionCard icon={<Plus className="size-4" />} title="Aidat borcu oluştur" text="Seçilen aylar için toplu aidat borcu yazın." primary onClick={() => setModal('aidat')} button="Aidat borcu oluştur" />
            <ActionCard icon={<FileInput className="size-4" />} title="Mevcut borç girişi" text="Aidat dışı tekil, ortak veya blok borcu." onClick={() => setModal('manual')} button="Mevcut borç gir" />
            <ActionCard icon={<History className="size-4" />} title="Borç ve ödeme geçmişi" text="Borçlandırma belgeleri ve geçmiş işlemler." onClick={() => setModal('history')} button="Geçmişi aç" />
          </div>

          <section className="card mt-5 p-5">
            <h2 className="mb-3 font-semibold">Bağımsız bölümler</h2>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input className="field pl-9" placeholder="Blok, kapı no veya muhatap ara..." value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Checkbox label="Sadece vadesi gelen borcu olanlar" checked={onlyDue} onChange={setOnlyDue} />
            </div>
            {rows.length === 0 ? (
              <Empty>Filtreye uyan daire yok.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Blok / kapı</th>
                    <th>Muhatap</th>
                    <th className="!text-right">Vadesi gelen borç</th>
                    <th className="!text-right">Bakiye</th>
                    <th className="!text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.unitId}>
                      <td className="font-medium">
                        <Link href={`/panel/daireler/${u.unitId}`} className="hover:underline">
                          {u.label}
                        </Link>
                      </td>
                      <td>
                        {u.debtor ?? <span className="text-slate-400">Muhatap yok</span>}
                        <div className="text-xs text-slate-500">Açık borç sahibi</div>
                      </td>
                      <td className={`text-right tabular-nums ${toNum(u.due) > 0 ? 'font-medium text-rose-600' : 'text-slate-500'}`}>{money(u.due)}</td>
                      <td className="text-right font-medium tabular-nums">{money(u.balance)}</td>
                      <td className="whitespace-nowrap text-right">
                        <Button size="sm" variant="success" onClick={() => setPayUnit({ id: u.unitId, label: u.label, siteId, balance: u.balance })}>
                          Tahsilat al
                        </Button>{' '}
                        <Link href={`/panel/daireler/${u.unitId}`} className="inline-flex rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                          Ekstre
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </section>
        </>
      )}
      {siteId && (
        <>
          <AidatModal siteId={siteId} open={modal === 'aidat'} onClose={() => setModal(null)} />
          <ManualModal siteId={siteId} open={modal === 'manual'} onClose={() => setModal(null)} />
          <HistoryModal siteId={siteId} open={modal === 'history'} onClose={() => setModal(null)} />
        </>
      )}
      <PaymentModal unit={payUnit} onClose={() => setPayUnit(null)} />
    </>
  );
}

function ActionCard({ icon, title, text, button, onClick, primary }: { icon: React.ReactNode; title: string; text: string; button: string; onClick: () => void; primary?: boolean }) {
  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-center gap-2 font-semibold">
        {icon} {title}
      </div>
      <p className="mb-3 mt-1 text-xs text-slate-500">{text}</p>
      <Button variant={primary ? 'primary' : 'secondary'} className="mt-auto w-full" onClick={onClick}>
        {button}
      </Button>
    </div>
  );
}

const DISTRIBUTIONS = [
  { value: 'FIXED', label: 'Her daireye sabit tutar', hint: 'Girilen tutar her daireye aynen yazılır.' },
  { value: 'COEFFICIENT', label: 'Daire tipi katsayısına göre', hint: 'Her daireye tutar × daire tipi katsayısı yazılır.' },
  { value: 'EQUAL', label: 'Toplamı eşit böl', hint: 'Girilen toplam tutar daire sayısına eşit bölünür.' },
  { value: 'AREA', label: 'Toplamı m²’ye göre böl', hint: 'Toplam tutar dairelerin metrekaresine oranla dağıtılır.' },
  { value: 'LAND_SHARE', label: 'Toplamı arsa payına göre böl', hint: 'KMK md.20 varsayılanı: giderler arsa payı oranında paylaşılır.' },
];

interface PreviewRes {
  preview: boolean;
  rows: { unitId: string; label: string; debtor: string | null; amount: string; period?: string; skipped?: boolean; dueDate?: string; description?: string }[];
  total: string;
  createCount: number;
  skipCount: number;
}

function useChargeItems(open: boolean) {
  const { data } = useApi<FinanceItem[]>(open ? '/finance-items?kind=CHARGE' : null);
  return (data ?? []).filter((i) => i.active);
}

function monthOptions() {
  const now = new Date();
  return Array.from({ length: 15 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 2 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

function AidatModal({ siteId, open, onClose }: { siteId: string; open: boolean; onClose: () => void }) {
  const items = useChargeItems(open);
  const { data: site } = useApi<SiteDetail>(open ? `/sites/${siteId}` : null);
  const months = useMemo(monthOptions, []);
  const current = months[2];
  const [form, setForm] = useState({ financeItemId: '', blockId: '', distribution: 'FIXED', amount: '', dueDay: '10', description: '' });
  const [periods, setPeriods] = useState<string[]>([current]);
  const [preview, setPreview] = useState<PreviewRes | null>(null);
  const run = useAction<Record<string, unknown>, PreviewRes>('POST', '/charges/aidat', {
    onSuccess: (res) => {
      if (res.preview) setPreview(res);
      else close();
    },
  });

  useEffect(() => {
    if (!form.financeItemId && items.length) setForm((f) => ({ ...f, financeItemId: (items.find((i) => i.isDefault) ?? items[0]).id }));
  }, [items, form.financeItemId]);

  function close() {
    setPreview(null);
    setPeriods([current]);
    run.reset();
    onClose();
  }
  const body = (p: boolean) => ({ ...form, siteId, periods, preview: p });
  const dist = DISTRIBUTIONS.find((d) => d.value === form.distribution)!;
  const perUnit = form.distribution === 'FIXED' || form.distribution === 'COEFFICIENT';

  return (
    <Modal
      open={open}
      onClose={close}
      wide
      title="Aidat borcu oluştur"
      footer={
        <>
          <Button variant="secondary" className="mr-auto" loading={run.isPending && !preview} onClick={() => run.mutate(body(true))}>
            <Eye className="size-4" /> Önizle
          </Button>
          <Button variant="secondary" onClick={close}>
            Vazgeç
          </Button>
          <Button disabled={!preview || preview.createCount === 0} loading={run.isPending && !!preview} onClick={() => run.mutate(body(false))}>
            {preview ? `${preview.createCount} borç satırı oluştur` : 'Önce önizleyin'}
          </Button>
        </>
      }
    >
      {items.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Borçlandırma türünde aktif bir kalem gerekir.{' '}
          <Link href="/panel/finans-kalemleri" className="underline">
            Kalemleri yönet
          </Link>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Borçlandırma kalemi" required>
          <select className="field" value={form.financeItemId} onChange={(e) => (setForm({ ...form, financeItemId: e.target.value }), setPreview(null))}>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kapsam">
          <select className="field" value={form.blockId} onChange={(e) => (setForm({ ...form, blockId: e.target.value }), setPreview(null))}>
            <option value="">Tüm site</option>
            {site?.blocks.map((b) => (
              <option key={b.id} value={b.id}>
                Yalnız {b.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Aylar" required hint="Daha önce aynı ay için yazılmış aidat tekrar yazılmaz.">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {months.map((m) => {
            const on = periods.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setPeriods(on ? periods.filter((p) => p !== m) : [...periods, m].sort());
                  setPreview(null);
                }}
                className={
                  on
                    ? 'rounded-lg border border-brand-600 bg-brand-600 px-2 py-1.5 text-xs font-medium text-white'
                    : 'rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }
              >
                {MONTHS[Number(m.slice(5)) - 1].slice(0, 3)} {m.slice(0, 4)}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Dağıtım yöntemi" hint={dist.hint} className="sm:col-span-3">
          <select className="field" value={form.distribution} onChange={(e) => (setForm({ ...form, distribution: e.target.value }), setPreview(null))}>
            {DISTRIBUTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={perUnit ? 'Daire başı tutar (₺)' : 'Aylık toplam tutar (₺)'} required>
          <input className="field tabular-nums" inputMode="decimal" value={form.amount} onChange={(e) => (setForm({ ...form, amount: e.target.value.replace(',', '.') }), setPreview(null))} />
        </Field>
        <Field label="Son ödeme günü">
          <input className="field" inputMode="numeric" value={form.dueDay} onChange={(e) => (setForm({ ...form, dueDay: e.target.value }), setPreview(null))} />
        </Field>
        <Field label="Açıklama">
          <input className="field" placeholder="Aidat" value={form.description} onChange={(e) => (setForm({ ...form, description: e.target.value }), setPreview(null))} />
        </Field>
      </div>
      <ErrorText error={run.error} />
      {preview && <PreviewTable preview={preview} showPeriod />}
    </Modal>
  );
}

function ManualModal({ siteId, open, onClose }: { siteId: string; open: boolean; onClose: () => void }) {
  const items = useChargeItems(open);
  const { data: site } = useApi<SiteDetail>(open ? `/sites/${siteId}` : null);
  const [scope, setScope] = useState<'UNIT' | 'BLOCK' | 'SITE'>('UNIT');
  const [form, setForm] = useState({ financeItemId: '', unitId: '', blockId: '', distribution: 'FIXED', amount: '', date: today(), dueDate: today(), installments: '1', description: '' });
  const [taksit, setTaksit] = useState(false);
  const [preview, setPreview] = useState<PreviewRes | null>(null);
  const run = useAction<Record<string, unknown>, PreviewRes>('POST', '/charges/manual', {
    onSuccess: (res) => {
      if (res.preview) setPreview(res);
      else close();
    },
  });
  useEffect(() => {
    if (!form.financeItemId && items.length) setForm((f) => ({ ...f, financeItemId: items[0].id }));
  }, [items, form.financeItemId]);

  function close() {
    setPreview(null);
    run.reset();
    onClose();
  }
  const upd = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setPreview(null);
  };
  const body = (p: boolean) => ({
    ...form,
    siteId,
    unitId: scope === 'UNIT' ? form.unitId : null,
    blockId: scope === 'BLOCK' ? form.blockId : null,
    distribution: scope === 'UNIT' ? 'FIXED' : form.distribution,
    installments: taksit ? form.installments : '1',
    preview: p,
  });
  const units = site?.blocks.flatMap((b) => b.units.map((u) => ({ id: u.id, label: `${b.name} / ${u.doorNo}`, debtor: u.debtor }))) ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      wide
      title="Mevcut borç girişi"
      footer={
        <>
          <Button variant="secondary" className="mr-auto" onClick={() => run.mutate(body(true))}>
            <Eye className="size-4" /> Önizle
          </Button>
          <Button variant="secondary" onClick={close}>
            Vazgeç
          </Button>
          <Button disabled={!preview} loading={run.isPending} onClick={() => run.mutate(body(false))}>
            Borcu kaydet
          </Button>
        </>
      }
    >
      <Field label="Borçlandırma türü">
        <select className="field" value={scope} onChange={(e) => (setScope(e.target.value as typeof scope), setPreview(null))}>
          <option value="UNIT">Tek daire</option>
          <option value="BLOCK">Blok</option>
          <option value="SITE">Tüm site (ortak gider)</option>
        </select>
      </Field>
      {items.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Borçlandırma türünde aktif bir kalem gerekir.{' '}
          <Link href="/panel/finans-kalemleri" className="underline">
            Tüm kalemleri yönet
          </Link>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Borçlandırma kalemi" required>
          <select className="field" value={form.financeItemId} onChange={(e) => upd({ financeItemId: e.target.value })}>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>
        {scope === 'UNIT' && (
          <Field label="Daire" required>
            <select className="field" value={form.unitId} onChange={(e) => upd({ unitId: e.target.value })}>
              <option value="">Seçin...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                  {u.debtor ? ` — ${u.debtor}` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}
        {scope === 'BLOCK' && (
          <Field label="Blok" required>
            <select className="field" value={form.blockId} onChange={(e) => upd({ blockId: e.target.value })}>
              <option value="">Seçin...</option>
              {site?.blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {scope !== 'UNIT' && (
          <Field label="Dağıtım" className="sm:col-span-2">
            <select className="field" value={form.distribution} onChange={(e) => upd({ distribution: e.target.value })}>
              {DISTRIBUTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Borç tarihi" required>
          <input className="field" type="date" value={form.date} onChange={(e) => upd({ date: e.target.value })} />
        </Field>
        <Field label="Son ödeme tarihi" required>
          <input className="field" type="date" value={form.dueDate} onChange={(e) => upd({ dueDate: e.target.value })} />
        </Field>
        <Field label={scope === 'UNIT' || form.distribution === 'FIXED' || form.distribution === 'COEFFICIENT' ? 'Tutar (₺)' : 'Toplam tutar (₺)'} required>
          <input className="field tabular-nums" inputMode="decimal" value={form.amount} onChange={(e) => upd({ amount: e.target.value.replace(',', '.') })} />
        </Field>
        <div className="flex items-end gap-3">
          <Checkbox label="Taksitlendir" checked={taksit} onChange={(v) => (setTaksit(v), setPreview(null))} />
          {taksit && <input className="field w-24" inputMode="numeric" value={form.installments} onChange={(e) => upd({ installments: e.target.value })} aria-label="Taksit sayısı" />}
          {taksit && <span className="pb-2 text-sm text-slate-500">ay</span>}
        </div>
        <Field label="Not (isteğe bağlı)" className="sm:col-span-2">
          <input className="field" placeholder="Örn. Asansör bakımı ortak elektrik" value={form.description} onChange={(e) => upd({ description: e.target.value })} />
        </Field>
      </div>
      <p className="text-xs text-slate-500">Önizlemede dağılımı kontrol edebilirsiniz; ardından borçlandırmayı oluşturun.</p>
      <ErrorText error={run.error} />
      {preview && <PreviewTable preview={preview} />}
    </Modal>
  );
}

function PreviewTable({ preview, showPeriod }: { preview: PreviewRes; showPeriod?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 text-sm">
        <Badge tone="blue">{preview.createCount} satır yazılacak</Badge>
        {preview.skipCount > 0 && <Badge tone="amber">{preview.skipCount} satır zaten borçlandırılmış, atlanacak</Badge>}
        <span>
          Toplam: <strong className="tabular-nums">{money(preview.total)}</strong>
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto">
        <Table>
          <thead>
            <tr>
              <th>Daire</th>
              {showPeriod && <th>Dönem</th>}
              {!showPeriod && <th>Vade</th>}
              <th>Borçlu</th>
              <th className="!text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((r, i) => (
              <tr key={i} className={r.skipped ? 'opacity-50' : ''}>
                <td>{r.label}</td>
                {showPeriod && <td>{r.period && periodLabel(r.period)}</td>}
                {!showPeriod && <td>{date(r.dueDate)}</td>}
                <td>{r.debtor ?? <span className="text-slate-400">—</span>}</td>
                <td className="text-right tabular-nums">{r.skipped ? 'atlandı' : money(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

interface Batch {
  id: string;
  kind: 'AIDAT' | 'MANUAL';
  description: string;
  totalAmount: string;
  cancelledAt: string | null;
  createdAt: string;
  _count: { charges: number };
}

function HistoryModal({ siteId, open, onClose }: { siteId: string; open: boolean; onClose: () => void }) {
  const { data } = useApi<Batch[]>(open ? `/charge-batches?siteId=${siteId}` : null);
  const cancel = useAction<string>('DELETE', (id) => `/charge-batches/${id}`);
  return (
    <Modal open={open} onClose={onClose} wide title="Borçlandırma geçmişi">
      {!data ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty>Bu sitede henüz borçlandırma yapılmadı.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Tür</th>
              <th>Açıklama</th>
              <th className="!text-right">Satır</th>
              <th className="!text-right">Toplam</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.id} className={b.cancelledAt ? 'opacity-50' : ''}>
                <td className="whitespace-nowrap">{date(b.createdAt)}</td>
                <td>
                  <Badge tone={b.kind === 'AIDAT' ? 'blue' : 'gray'}>{b.kind === 'AIDAT' ? 'Aidat' : 'Tekil/ortak'}</Badge>
                </td>
                <td>{b.description}</td>
                <td className="text-right tabular-nums">{b._count.charges}</td>
                <td className="text-right tabular-nums">{money(b.totalAmount)}</td>
                <td className="text-right">
                  {b.cancelledAt ? (
                    <Badge tone="red">İptal</Badge>
                  ) : (
                    <ConfirmButton
                      loading={cancel.isPending && cancel.variables === b.id}
                      message="Borçlandırma iptal edilsin mi? Bu borçlara yapılmış tahsilatlar avansa döner ve diğer açık borçlara mahsup edilir."
                      onConfirm={() => cancel.mutate(b.id)}
                    >
                      İptal et
                    </ConfirmButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ErrorText error={cancel.error} />
    </Modal>
  );
}
