'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { PaymentModal } from '@/components/payment-modal';
import { Badge, Button, ConfirmButton, ErrorText, Field, Loading, Modal, PageHeader, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { amount, money, toNum } from '@/lib/format';
import type { SiteDetail, UnitRow, UnitType } from '@/lib/types';

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: site, isLoading } = useApi<SiteDetail>(`/sites/${id}`);
  const [blockModal, setBlockModal] = useState(false);
  const [unitModal, setUnitModal] = useState<{ blockId: string; unit?: UnitRow } | null>(null);
  const [editSite, setEditSite] = useState(false);
  const [payUnit, setPayUnit] = useState<{ id: string; label: string; siteId: string; balance: string } | null>(null);
  const del = useAction('DELETE', `/sites/${id}`, { onSuccess: () => router.replace('/panel/siteler') });
  const delBlock = useAction<string>('DELETE', (b) => `/blocks/${b}`);

  if (isLoading || !site) return <Loading />;
  const unitCount = site.blocks.reduce((a, b) => a + b.units.length, 0);
  const total = site.blocks.flatMap((b) => b.units).reduce((a, u) => a + toNum(u.balance), 0);

  return (
    <>
      <div className="mb-2 text-sm text-slate-500">
        <Link href="/panel/siteler" className="hover:underline">
          Siteler ve daireler
        </Link>{' '}
        / {site.name}
      </div>
      <PageHeader
        title={site.name}
        description={`${site.blocks.length} blok · ${unitCount} bağımsız bölüm · toplam bakiye ${money(total)}${site.address ? ` · ${site.address}` : ''}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditSite(true)}>
              <Pencil className="size-4" /> Düzenle
            </Button>
            <Link href={`/panel/daire-borclari?site=${site.id}`} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              Daire borçları
            </Link>
            <Button onClick={() => setBlockModal(true)}>
              <Plus className="size-4" /> Blok ekle
            </Button>
          </>
        }
      />
      <ErrorText error={del.error || delBlock.error} />

      <div className="space-y-6">
        {site.blocks.map((block) => (
          <section key={block.id} className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">
                {block.name} <span className="text-sm font-normal text-slate-500">({block.units.length} bölüm)</span>
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setUnitModal({ blockId: block.id })}>
                  <Plus className="size-3.5" /> Daire ekle
                </Button>
                <ConfirmButton message={`${block.name} ve içindeki tüm daireler silinsin mi?`} onConfirm={() => delBlock.mutate(block.id)}>
                  <Trash2 className="size-3.5" />
                </ConfirmButton>
              </div>
            </div>
            {block.units.length === 0 ? (
              <p className="text-sm text-slate-500">Bu blokta daire yok.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Kapı</th>
                    <th>Tip</th>
                    <th className="!text-right">m²</th>
                    <th className="!text-right">Arsa payı</th>
                    <th>Malik / borçlu</th>
                    <th className="!text-right">Bakiye</th>
                    <th className="!text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {block.units.map((u) => (
                    <tr key={u.id}>
                      <td className="font-medium">
                        <Link href={`/panel/daireler/${u.id}`} className="text-brand-700 hover:underline dark:text-brand-100">
                          {block.name} / {u.doorNo}
                        </Link>
                        {u.floor != null && <span className="ml-1 text-xs text-slate-400">{u.floor}. kat</span>}
                      </td>
                      <td>{u.unitType?.name ?? <span className="text-slate-400">—</span>}</td>
                      <td className="text-right tabular-nums">{u.areaSqm ? amount(u.areaSqm) : '—'}</td>
                      <td className="text-right tabular-nums">{u.landShare ? toNum(u.landShare).toLocaleString('tr-TR') : '—'}</td>
                      <td>{u.debtor ?? <Badge>Boş</Badge>}</td>
                      <td className={`text-right font-medium tabular-nums ${toNum(u.balance) > 0 ? 'text-rose-600' : toNum(u.balance) < 0 ? 'text-emerald-600' : ''}`}>
                        {money(u.balance)}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <Button size="sm" variant="success" onClick={() => setPayUnit({ id: u.id, label: `${block.name} / ${u.doorNo}`, siteId: site.id, balance: u.balance })}>
                          Tahsilat al
                        </Button>{' '}
                        <Button size="sm" variant="ghost" onClick={() => setUnitModal({ blockId: block.id, unit: u })} aria-label="Düzenle">
                          <Pencil className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </section>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <ConfirmButton variant="danger" loading={del.isPending} message="Site ve tüm blok/daire kayıtları silinecek. Emin misiniz?" onConfirm={() => del.mutate(undefined)}>
          <Trash2 className="size-3.5" /> Siteyi sil
        </ConfirmButton>
      </div>

      <BlockModal siteId={site.id} open={blockModal} onClose={() => setBlockModal(false)} />
      <UnitModal site={site} state={unitModal} onClose={() => setUnitModal(null)} />
      <SiteEditModal site={site} open={editSite} onClose={() => setEditSite(false)} />
      <PaymentModal unit={payUnit} onClose={() => setPayUnit(null)} />
    </>
  );
}

function BlockModal({ siteId, open, onClose }: { siteId: string; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', unitCount: '0', startNo: '1' });
  const save = useAction('POST', `/sites/${siteId}/blocks`, {
    onSuccess: () => {
      setForm({ name: '', unitCount: '0', startNo: '1' });
      onClose();
    },
  });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni blok"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate(form)}>
            Kaydet
          </Button>
        </>
      }
    >
      <Field label="Blok adı" required>
        <input className="field" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn. C Blok" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Oluşturulacak daire sayısı">
          <input className="field" inputMode="numeric" value={form.unitCount} onChange={(e) => setForm({ ...form, unitCount: e.target.value })} />
        </Field>
        <Field label="İlk kapı no">
          <input className="field" inputMode="numeric" value={form.startNo} onChange={(e) => setForm({ ...form, startNo: e.target.value })} />
        </Field>
      </div>
      <ErrorText error={save.error} />
    </Modal>
  );
}

function UnitModal({ site, state, onClose }: { site: SiteDetail; state: { blockId: string; unit?: UnitRow } | null; onClose: () => void }) {
  const { data: types } = useApi<UnitType[]>('/unit-types');
  const u = state?.unit;
  const [form, setForm] = useState<Record<string, string>>({});
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const key = state ? (u?.id ?? `new-${state.blockId}`) : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setForm({
      blockId: state?.blockId ?? '',
      doorNo: u?.doorNo ?? '',
      floor: u?.floor?.toString() ?? '',
      areaSqm: u?.areaSqm ?? '',
      landShare: u?.landShare ?? '',
      unitTypeId: u?.unitTypeId ?? '',
    });
  }
  const save = useAction('POST', `/sites/${site.id}/units`, { onSuccess: onClose });
  const update = useAction('PATCH', `/units/${u?.id}`, { onSuccess: onClose });
  const remove = useAction('DELETE', `/units/${u?.id}`, { onSuccess: onClose });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value.replace(',', '.') });

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      title={u ? 'Bağımsız bölümü düzenle' : 'Yeni bağımsız bölüm'}
      footer={
        <>
          {u && (
            <span className="mr-auto">
              <ConfirmButton loading={remove.isPending} message="Daire silinsin mi? Hesap hareketi olan daireler silinemez." onConfirm={() => remove.mutate(undefined)}>
                <Trash2 className="size-3.5" /> Sil
              </ConfirmButton>
            </span>
          )}
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button loading={save.isPending || update.isPending} onClick={() => (u ? update.mutate(form) : save.mutate(form))}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Blok" required>
          <select className="field" value={form.blockId} onChange={set('blockId')}>
            {site.blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kapı no" required>
          <input className="field" value={form.doorNo} onChange={set('doorNo')} />
        </Field>
        <Field label="Kat">
          <input className="field" inputMode="numeric" value={form.floor} onChange={set('floor')} />
        </Field>
        <Field label="Daire tipi" hint="Katsayı, aidat dağıtımında kullanılır.">
          <select className="field" value={form.unitTypeId} onChange={set('unitTypeId')}>
            <option value="">Seçilmedi (katsayı 1)</option>
            {types?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (×{toNum(t.coefficient)})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Brüt m²">
          <input className="field" inputMode="decimal" value={form.areaSqm} onChange={set('areaSqm')} />
        </Field>
        <Field label="Arsa payı">
          <input className="field" inputMode="decimal" value={form.landShare} onChange={set('landShare')} />
        </Field>
      </div>
      <ErrorText error={save.error || update.error || remove.error} />
    </Modal>
  );
}

function SiteEditModal({ site, open, onClose }: { site: SiteDetail; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: site.name, code: site.code ?? '', city: site.city ?? '', district: site.district ?? '', address: site.address ?? '' });
  const save = useAction('PATCH', `/sites/${site.id}`, { onSuccess: onClose });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Site bilgileri"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate(form)}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Site adı" required className="sm:col-span-2">
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Kısa kod">
          <input className="field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </Field>
        <Field label="İl">
          <input className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </Field>
        <Field label="İlçe">
          <input className="field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
        </Field>
        <Field label="Adres" className="sm:col-span-2">
          <textarea className="field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
      </div>
      <ErrorText error={save.error} />
    </Modal>
  );
}
