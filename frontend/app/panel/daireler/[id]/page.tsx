'use client';

import { CircleDollarSign, FileSpreadsheet, Printer, Receipt, TrendingUp, Trash2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { LedgerTable } from '@/components/ledger-table';
import { PaymentModal } from '@/components/payment-modal';
import { PersonPicker } from '@/components/person-picker';
import { Badge, Button, Card, Checkbox, ConfirmButton, Empty, ErrorText, Field, Loading, Modal, StatCard, Tabs } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { amount, date, downloadCsv, money, phone, toNum } from '@/lib/format';
import type { Ledger, Occupant, Person, UnitType } from '@/lib/types';

interface UnitDetail {
  id: string;
  doorNo: string;
  floor: number | null;
  areaSqm: string | null;
  landShare: string | null;
  site: { id: string; name: string };
  block: { id: string; name: string };
  unitType: UnitType | null;
  occupants: Occupant[];
}

type Tab = 'genel' | 'malik' | 'borclar' | 'hareketler';

export default function UnitPage() {
  const { id } = useParams<{ id: string }>();
  const { data: unit, isLoading } = useApi<UnitDetail>(`/units/${id}`);
  const { data: ledger } = useApi<Ledger>(`/units/${id}/ledger`);
  const [tab, setTab] = useState<Tab>('hareketler');
  const [pay, setPay] = useState(false);
  const [occModal, setOccModal] = useState(false);
  const advance = useAction('POST', `/units/${id}/apply-advance`);
  const cancelPayment = useAction<string>('DELETE', (pid) => `/payments/${pid}`);

  if (isLoading || !unit) return <Loading />;
  const label = `${unit.block.name} / ${unit.doorNo}`;
  const s = ledger?.summary;
  const charges = ledger?.rows.filter((r) => r.kind === 'CHARGE') ?? [];

  return (
    <>
      <div className="mb-2 text-sm text-slate-500">
        <Link href="/panel/siteler" className="hover:underline">
          Siteler ve daireler
        </Link>{' '}
        /{' '}
        <Link href={`/panel/siteler/${unit.site.id}`} className="hover:underline">
          {unit.site.name}
        </Link>{' '}
        / {unit.block.name} / {unit.doorNo}
      </div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{label}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            {unit.site.name} {unit.occupants.length ? <Badge tone="blue">Dolu</Badge> : <Badge>Boş</Badge>}
          </div>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="success" onClick={() => setPay(true)}>
            Tahsilat al
          </Button>
          <Button variant="secondary" loading={advance.isPending} disabled={!s || toNum(s.advance) <= 0} onClick={() => advance.mutate(undefined)} title="Avansı açık borçlara mahsup et">
            Avans mahsup
          </Button>
        </div>
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'genel', label: 'Genel bilgiler' },
          { value: 'malik', label: 'Malik ve kiracı' },
          { value: 'borclar', label: 'Aidat borçları' },
          { value: 'hareketler', label: 'Hesap hareketleri' },
        ]}
      />
      <div className="mt-5 space-y-5">
        {tab === 'genel' && (
          <Card title="Bağımsız bölüm bilgileri" actions={<Link href={`/panel/siteler/${unit.site.id}`} className="text-sm text-brand-600 hover:underline">Site ekranında düzenle</Link>}>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              {[
                ['Blok / kapı', label],
                ['Kat', unit.floor ?? '—'],
                ['Daire tipi', unit.unitType ? `${unit.unitType.name} (×${toNum(unit.unitType.coefficient)})` : '—'],
                ['Brüt m²', unit.areaSqm ? amount(unit.areaSqm) : '—'],
                ['Arsa payı', unit.landShare ? toNum(unit.landShare).toLocaleString('tr-TR') : '—'],
                ['Güncel bakiye', s ? money(s.balance) : '—'],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        {tab === 'malik' && <Occupants occupants={unit.occupants} onAdd={() => setOccModal(true)} />}

        {tab === 'borclar' && (
          <Card title="Borç kalemleri" subtitle="Bu daireye yazılmış tüm borçlar ve kalan tutarlar.">
            {charges.length === 0 ? (
              <Empty>Bu daireye henüz borç yazılmadı. Daire borçları ekranından aidat oluşturabilirsiniz.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {charges.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <div>
                      <div className="font-medium">{c.description}</div>
                      <div className="text-xs text-slate-500">Son ödeme: {date(c.dueDate)}</div>
                    </div>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span>{money(c.debit)}</span>
                      {toNum(c.remaining) === 0 ? <Badge tone="green">Ödendi</Badge> : <Badge tone={toNum(c.lateFee) > 0 ? 'red' : 'amber'}>Kalan {money(c.remaining)}</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'hareketler' && ledger && (
          <>
            <Card title="Hesap özeti" subtitle="Güncel bakiye ve toplam borç/alacak özeti.">
              <div className="grid gap-3 sm:grid-cols-4">
                <StatCard
                  tone={toNum(ledger.summary.balance) > 0 ? 'rose' : 'green'}
                  label="Güncel bakiye"
                  value={money(ledger.summary.balance)}
                  icon={<Receipt className="size-5" />}
                  sub={toNum(ledger.summary.balance) <= 0 ? (toNum(ledger.summary.advance) > 0 ? `Avans: ${money(ledger.summary.advance)}` : 'Borç kalmadı') : `Vadesi gelen: ${money(ledger.summary.due)}`}
                />
                <StatCard label="Toplam borç" value={money(ledger.summary.totalDebit)} icon={<TrendingUp className="size-5" />} />
                <StatCard label="Toplam ödenen" value={money(ledger.summary.totalCredit)} icon={<CircleDollarSign className="size-5" />} />
                <StatCard tone="amber" label="Gecikme tazminatı" value={money(ledger.summary.lateFee)} sub="KMK md.20 — bilgi amaçlı" />
              </div>
            </Card>
            <Card
              title="Hesap hareketleri"
              subtitle="Tarih sırasıyla borç ve tahsilat kayıtları."
              actions={
                <div className="no-print flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      downloadCsv(`${label.replace(/\W+/g, '_')}_ekstre.csv`, [
                        ['Tarih', 'Son ödeme', 'Açıklama', 'Borç', 'Gecikme', 'Ödenen', 'Bakiye'],
                        ...ledger.rows.map((r) => [date(r.date), r.dueDate ? date(r.dueDate) : '', r.description, amount(r.debit), amount(r.lateFee), amount(r.credit), amount(r.balance)]),
                      ])
                    }
                  >
                    <FileSpreadsheet className="size-3.5" /> Excel indir
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => window.print()}>
                    <Printer className="size-3.5" /> Yazdır
                  </Button>
                </div>
              }
            >
              {ledger.rows.length === 0 ? (
                <Empty>Henüz hesap hareketi yok. Borç veya tahsilat sonrası satırlar burada listelenir.</Empty>
              ) : (
                <LedgerTable rows={ledger.rows} onCancelPayment={(pid) => cancelPayment.mutate(pid)} />
              )}
              <div className="mt-3">
                <ErrorText error={cancelPayment.error || advance.error} />
              </div>
            </Card>
          </>
        )}
      </div>

      <PaymentModal unit={pay ? { id, label, siteId: unit.site.id, balance: ledger?.summary.balance ?? '0' } : null} onClose={() => setPay(false)} />
      <OccupantModal unitId={id} open={occModal} onClose={() => setOccModal(false)} />
    </>
  );
}

function Occupants({ occupants, onAdd }: { occupants: Occupant[]; onAdd: () => void }) {
  const remove = useAction<string>('DELETE', (oid) => `/occupants/${oid}`);
  const debtor = useAction<string>('POST', (oid) => `/occupants/${oid}/debtor`);
  return (
    <Card
      title="Malik ve kiracılar"
      subtitle="Borçlar «borçlu» olarak işaretli kişiye yazılır; işaret yoksa malike yazılır."
      actions={
        <Button size="sm" onClick={onAdd}>
          <UserPlus className="size-3.5" /> Kişi bağla
        </Button>
      }
    >
      {occupants.length === 0 ? (
        <Empty>Bu daireye bağlı kişi yok.</Empty>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {occupants.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <div className="font-medium">
                  {o.person.firstName} {o.person.lastName} <Badge tone={o.role === 'OWNER' ? 'blue' : 'gray'}>{o.role === 'OWNER' ? 'Malik' : 'Kiracı'}</Badge>{' '}
                  {o.isDebtor && <Badge tone="amber">Borçlu</Badge>}
                </div>
                <div className="text-xs text-slate-500">
                  {phone(o.person.phone)} {o.person.email && `· ${o.person.email}`}
                </div>
              </div>
              <div className="flex gap-1">
                {!o.isDebtor && (
                  <Button size="sm" variant="secondary" onClick={() => debtor.mutate(o.id)}>
                    Borçlu yap
                  </Button>
                )}
                <ConfirmButton message="Kişinin daire bağlantısı kaldırılsın mı?" onConfirm={() => remove.mutate(o.id)}>
                  <Trash2 className="size-3.5" />
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function OccupantModal({ unitId, open, onClose }: { unitId: string; open: boolean; onClose: () => void }) {
  const [person, setPerson] = useState<Person | null>(null);
  const [role, setRole] = useState<'OWNER' | 'TENANT'>('OWNER');
  const [isDebtor, setIsDebtor] = useState(false);
  const save = useAction('POST', `/units/${unitId}/occupants`, {
    onSuccess: () => {
      setPerson(null);
      onClose();
    },
  });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Daireye kişi bağla"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button disabled={!person} loading={save.isPending} onClick={() => save.mutate({ personId: person!.id, role, isDebtor })}>
            Bağla
          </Button>
        </>
      }
    >
      <PersonPicker value={person} onChange={setPerson} />
      <Field label="Rol">
        <select className="field" value={role} onChange={(e) => setRole(e.target.value as 'OWNER' | 'TENANT')}>
          <option value="OWNER">Malik</option>
          <option value="TENANT">Kiracı</option>
        </select>
      </Field>
      <Checkbox label="Borçlar bu kişiye yazılsın (borçlu)" checked={isDebtor} onChange={setIsDebtor} />
      <ErrorText error={save.error} />
    </Modal>
  );
}
