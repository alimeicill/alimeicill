'use client';

import { Banknote, CheckCircle2, ChevronDown, FileSpreadsheet, Landmark, Pencil, Plus, Wallet } from 'lucide-react';
import { useState } from 'react';
import { TransferModal, TxModal } from '@/components/tx-modals';
import { Badge, Button, Checkbox, Empty, ErrorText, Field, HowItWorks, Loading, Modal, PageHeader, Pills, StatCard, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { amount, date, downloadCsv, money, toNum } from '@/lib/format';
import { SOURCE_LABEL, type CashTx, type PaymentAccount, type Site } from '@/lib/types';

export default function PaymentAccountsPage() {
  const { data, isLoading } = useApi<PaymentAccount[]>('/payment-accounts');
  const { data: sites } = useApi<Site[]>('/sites');
  const [kind, setKind] = useState<'' | 'CASH' | 'BANK'>('');
  const [siteId, setSiteId] = useState('');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<PaymentAccount | 'new' | null>(null);
  const [statement, setStatement] = useState<PaymentAccount | null>(null);
  const [menu, setMenu] = useState(false);
  const [tx, setTx] = useState<'IN' | 'OUT' | null>(null);
  const [transfer, setTransfer] = useState(false);

  const all = data ?? [];
  const list = all.filter(
    (a) =>
      (!kind || a.kind === kind) &&
      (!siteId || a.siteId === siteId) &&
      `${a.name} ${a.site?.name ?? ''}`.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')),
  );
  const sum = (arr: PaymentAccount[]) => arr.reduce((s, a) => s + toNum(a.balance), 0);
  const cash = all.filter((a) => a.kind === 'CASH');
  const bank = all.filter((a) => a.kind === 'BANK');

  return (
    <>
      <HowItWorks>
        <p>
          <strong>Ödeme hesapları</strong>, sitenin kasa ve banka hesaplarını takip etmek içindir. Tahsilat, ödeme, havale ve virman işlemleri bu hesapların
          bakiyesini etkiler.
        </p>
        <ul className="list-disc pl-5">
          <li>
            Ekstrede <strong>Giriş</strong> hesaba giren, <strong>Çıkış</strong> hesaptan çıkan tutardır; <strong>Bakiye</strong> açılış + giriş − çıkıştır.
          </li>
          <li>Günlük para hareketleri için «İşlem ekle» menüsünü kullanın.</li>
        </ul>
      </HowItWorks>
      <PageHeader
        title="Ödeme hesapları"
        actions={
          <>
            <div className="relative">
              <Button variant="secondary" onClick={() => setMenu(!menu)}>
                <Plus className="size-4" /> İşlem ekle <ChevronDown className="size-3.5" />
              </Button>
              {menu && (
                <div className="card absolute right-0 z-10 mt-1 w-44 p-1">
                  {[
                    ['Gelir kaydet', () => setTx('IN')],
                    ['Gider kaydet', () => setTx('OUT')],
                    ['Virman', () => setTransfer(true)],
                  ].map(([label, fn]) => (
                    <button
                      key={label as string}
                      type="button"
                      className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => {
                        setMenu(false);
                        (fn as () => void)();
                      }}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={() => setEdit('new')}>
              <Plus className="size-4" /> Yeni ödeme hesabı
            </Button>
          </>
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bakiye" value={money(sum(all))} sub={`${all.length} hesap`} icon={<Wallet className="size-5" />} />
        <StatCard tone="amber" label="Kasa bakiyesi" value={money(sum(cash))} sub={`${cash.length} kasa`} icon={<Banknote className="size-5" />} />
        <StatCard tone="blue" label="Banka bakiyesi" value={money(sum(bank))} sub={`${bank.length} banka`} icon={<Landmark className="size-5" />} />
        <StatCard tone="green" label="Aktif hesap" value={all.filter((a) => a.active).length} sub={all.every((a) => a.active) ? 'Tümü aktif' : undefined} icon={<CheckCircle2 className="size-5" />} />
      </div>
      <div className="card mb-4 space-y-3 p-4">
        <Pills
          value={kind}
          onChange={setKind}
          options={[
            { value: '', label: 'Tümü' },
            { value: 'CASH', label: 'Kasalar' },
            { value: 'BANK', label: 'Bankalar' },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Site filtresi">
            <select className="field" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="">Tüm hesaplar</option>
              {sites?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Arama">
            <input className="field" placeholder="Hesap adı, site veya tür ara..." value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
        </div>
      </div>
      {isLoading ? (
        <Loading />
      ) : !list.length ? (
        <Empty>Tahsilat veya gider kaydı için önce bir ödeme hesabı ekleyin.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>Tür</th>
              <th>Kapsam</th>
              <th>Para birimi</th>
              <th className="!text-right">Bakiye</th>
              <th>Durum</th>
              <th className="!text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.name}</td>
                <td>
                  <Badge tone={a.kind === 'CASH' ? 'amber' : 'blue'}>{a.kind === 'CASH' ? 'Kasa' : 'Banka'}</Badge>
                </td>
                <td>
                  {a.site ? (
                    <>
                      Siteye bağlı <div className="text-xs text-slate-500">{a.site.name}</div>
                    </>
                  ) : (
                    'Firma geneli'
                  )}
                </td>
                <td>{a.currency}</td>
                <td className="text-right font-medium tabular-nums">{money(a.balance)}</td>
                <td>{a.active ? <Badge tone="green">Aktif</Badge> : <Badge>Pasif</Badge>}</td>
                <td className="whitespace-nowrap text-right">
                  <Button size="sm" variant="secondary" onClick={() => setStatement(a)}>
                    Ekstre
                  </Button>{' '}
                  <Button size="sm" variant="ghost" onClick={() => setEdit(a)} aria-label="Düzenle">
                    <Pencil className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <AccountModal state={edit} sites={sites ?? []} onClose={() => setEdit(null)} />
      <StatementModal account={statement} onClose={() => setStatement(null)} />
      <TxModal direction={tx} onClose={() => setTx(null)} />
      <TransferModal open={transfer} onClose={() => setTransfer(false)} />
    </>
  );
}

function AccountModal({ state, sites, onClose }: { state: PaymentAccount | 'new' | null; sites: Site[]; onClose: () => void }) {
  const editing = state && state !== 'new' ? state : null;
  const empty = { kind: 'CASH', name: '', siteId: '', iban: '', openingBalance: '0', active: true, description: '' };
  const [form, setForm] = useState(empty);
  const [scope, setScope] = useState<'site' | 'firm'>('site');
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const key = state ? (editing?.id ?? 'new') : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setForm(
      editing
        ? {
            kind: editing.kind,
            name: editing.name,
            siteId: editing.siteId ?? '',
            iban: editing.iban ?? '',
            openingBalance: String(toNum(editing.openingBalance)),
            active: editing.active,
            description: editing.description ?? '',
          }
        : { ...empty, siteId: sites[0]?.id ?? '' },
    );
    setScope(editing && !editing.siteId ? 'firm' : 'site');
  }
  const body = { ...form, siteId: scope === 'site' ? form.siteId : null };
  const create = useAction('POST', '/payment-accounts', { onSuccess: onClose });
  const update = useAction('PATCH', `/payment-accounts/${editing?.id}`, { onSuccess: onClose });

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      wide
      title={editing ? 'Ödeme hesabını düzenle' : 'Yeni ödeme hesabı'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button loading={create.isPending || update.isPending} onClick={() => (editing ? update.mutate(body) : create.mutate(body))}>
            {editing ? 'Değişiklikleri kaydet' : 'Kaydet'}
          </Button>
        </>
      }
    >
      <Field label="Hesap türü">
        <select className="field" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
          <option value="CASH">Kasa</option>
          <option value="BANK">Banka</option>
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Field label="Ad" required>
            <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          {form.kind === 'BANK' && (
            <Field label="IBAN">
              <input className="field" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
            </Field>
          )}
          <Field label="Para birimi" hint="Şimdilik yalnızca TRY.">
            <input className="field" value="TRY" disabled />
          </Field>
          <Field label="Açılış bakiyesi (₺)">
            <input className="field" inputMode="decimal" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value.replace(',', '.') })} />
          </Field>
          <Checkbox label="Aktif — pasif hesaplar listede kalır; yeni tahsilatta seçilemez." checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
        </div>
        <div className="space-y-3">
          <Field label="Kapsam">
            <div className="flex flex-col gap-1.5 pt-1 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" className="accent-brand-600" checked={scope === 'site'} onChange={() => setScope('site')} /> Siteye bağlı
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" className="accent-brand-600" checked={scope === 'firm'} onChange={() => setScope('firm')} /> Firma geneli
              </label>
            </div>
          </Field>
          {scope === 'site' && (
            <Field label="Site">
              <select className="field" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Açıklama">
            <textarea className="field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </div>
      <ErrorText error={create.error || update.error} />
    </Modal>
  );
}

interface Statement {
  opening: string;
  totalIn: string;
  totalOut: string;
  balance: string;
  rows: CashTx[];
}

function StatementModal({ account, onClose }: { account: PaymentAccount | null; onClose: () => void }) {
  const { data } = useApi<Statement>(account ? `/payment-accounts/${account.id}/statement` : null);
  const del = useAction<string>('DELETE', (id) => `/transactions/${id}`);
  return (
    <Modal open={!!account} onClose={onClose} wide title={`Ekstre — ${account?.name ?? ''}`}>
      {!data ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard label="Açılış" value={money(data.opening)} />
            <StatCard tone="green" label="Giriş" value={money(data.totalIn)} />
            <StatCard tone="rose" label="Çıkış" value={money(data.totalOut)} />
            <StatCard tone="blue" label="Bakiye" value={money(data.balance)} />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                downloadCsv(`${account!.name}_ekstre.csv`, [
                  ['Tarih', 'Tür', 'Açıklama', 'Giriş', 'Çıkış', 'Bakiye'],
                  ...data.rows.map((r) => [date(r.date), SOURCE_LABEL[r.source], r.description, r.direction === 'IN' ? amount(r.amount) : '', r.direction === 'OUT' ? amount(r.amount) : '', amount(r.balance)]),
                ])
              }
            >
              <FileSpreadsheet className="size-3.5" /> Excel indir
            </Button>
          </div>
          {data.rows.length === 0 ? (
            <Empty>Bu hesapta hareket yok.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tür</th>
                  <th>Açıklama</th>
                  <th className="!text-right">Giriş</th>
                  <th className="!text-right">Çıkış</th>
                  <th className="!text-right">Bakiye</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{date(r.date)}</td>
                    <td>{SOURCE_LABEL[r.source]}</td>
                    <td>
                      {r.description || r.financeItem?.name}
                      {r.currentAccount && <div className="text-xs text-slate-500">{r.currentAccount.title}</div>}
                    </td>
                    <td className="text-right tabular-nums text-emerald-700">{r.direction === 'IN' ? money(r.amount) : ''}</td>
                    <td className="text-right tabular-nums text-rose-600">{r.direction === 'OUT' ? money(r.amount) : ''}</td>
                    <td className="text-right font-medium tabular-nums">{money(r.balance)}</td>
                    <td className="text-right">
                      {r.source !== 'COLLECTION' && (
                        <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => window.confirm('Kayıt silinsin mi?') && del.mutate(r.id)}>
                          Sil
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <ErrorText error={del.error} />
        </>
      )}
    </Modal>
  );
}
