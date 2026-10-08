'use client';

import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Checkbox, ConfirmButton, Empty, ErrorText, Field, HowItWorks, Loading, Modal, PageHeader, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { downloadCsv, phone } from '@/lib/format';
import type { CurrentAccount } from '@/lib/types';

const KIND = { SUPPLIER: 'Tedarikçi', CUSTOMER: 'Müşteri', OTHER: 'Diğer' };

export default function CurrentAccountsPage() {
  const [filters, setFilters] = useState({ q: '', kind: '', active: '' });
  const [applied, setApplied] = useState(filters);
  const { data, isLoading } = useApi<CurrentAccount[]>(`/current-accounts?q=${encodeURIComponent(applied.q)}&kind=${applied.kind}&active=${applied.active}`);
  const [edit, setEdit] = useState<CurrentAccount | 'new' | null>(null);

  return (
    <>
      <HowItWorks>
        <p>
          <strong>Cari hesaplar</strong>; tedarikçi, hizmet sağlayıcı ve diğer firmalardır. Fatura ve gider kayıtlarında karşı taraf olarak seçilir.
        </p>
      </HowItWorks>
      <PageHeader
        title="Cari hesaplar"
        actions={
          <>
            <Button
              variant="secondary"
              disabled={!data?.length}
              onClick={() =>
                downloadCsv('cari_hesaplar.csv', [
                  ['Ünvan', 'Tür', 'Vergi dairesi', 'Vergi no', 'TCKN', 'Telefon', 'E-posta', 'İl', 'İlçe', 'Durum'],
                  ...(data ?? []).map((c) => [c.title, KIND[c.kind], c.taxOffice, c.taxNo, c.tckn, c.phone, c.email, c.city, c.district, c.active ? 'Aktif' : 'Pasif']),
                ])
              }
            >
              <Download className="size-4" /> CSV indir
            </Button>
            <Button onClick={() => setEdit('new')}>
              <Plus className="size-4" /> Yeni cari
            </Button>
          </>
        }
      />
      <form
        className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_160px_140px_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(filters);
        }}
      >
        <Field label="Arama">
          <input className="field" placeholder="Ünvan, telefon, e-posta veya vergi no" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </Field>
        <Field label="Cari tipi">
          <select className="field" value={filters.kind} onChange={(e) => setFilters({ ...filters, kind: e.target.value })}>
            <option value="">Tümü</option>
            {Object.entries(KIND).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Durum">
          <select className="field" value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })}>
            <option value="">Tümü</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </Field>
        <Button type="submit" variant="secondary">
          <Search className="size-4" /> Ara
        </Button>
      </form>
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Henüz cari hesap yok.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Ünvan</th>
              <th>Tür</th>
              <th>Vergi no / TCKN</th>
              <th>Telefon</th>
              <th>İl / ilçe</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.title}</td>
                <td>{KIND[c.kind]}</td>
                <td>{c.taxNo || c.tckn || '—'}</td>
                <td>{phone(c.phone)}</td>
                <td>{[c.city, c.district].filter(Boolean).join(' / ') || '—'}</td>
                <td>{c.active ? <Badge tone="green">Aktif</Badge> : <Badge>Pasif</Badge>}</td>
                <td className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEdit(c)} aria-label="Düzenle">
                    <Pencil className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <CurrentModal state={edit} onClose={() => setEdit(null)} />
    </>
  );
}

const EMPTY = { kind: 'SUPPLIER', title: '', taxOffice: '', taxNo: '', tckn: '', phone: '', email: '', city: '', district: '', address: '', active: true };

function CurrentModal({ state, onClose }: { state: CurrentAccount | 'new' | null; onClose: () => void }) {
  const editing = state && state !== 'new' ? state : null;
  const [form, setForm] = useState(EMPTY);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const key = state ? (editing?.id ?? 'new') : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setForm(
      editing
        ? {
            kind: editing.kind,
            title: editing.title,
            taxOffice: editing.taxOffice ?? '',
            taxNo: editing.taxNo ?? '',
            tckn: editing.tckn ?? '',
            phone: editing.phone ?? '',
            email: editing.email ?? '',
            city: editing.city ?? '',
            district: editing.district ?? '',
            address: editing.address ?? '',
            active: editing.active,
          }
        : EMPTY,
    );
  }
  const create = useAction('POST', '/current-accounts', { onSuccess: onClose });
  const update = useAction('PATCH', `/current-accounts/${editing?.id}`, { onSuccess: onClose });
  const remove = useAction('DELETE', `/current-accounts/${editing?.id}`, { onSuccess: onClose });
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      wide
      title={editing ? 'Cariyi düzenle' : 'Yeni cari'}
      footer={
        <>
          {editing && (
            <span className="mr-auto">
              <ConfirmButton onConfirm={() => remove.mutate(undefined)}>
                <Trash2 className="size-3.5" /> Sil
              </ConfirmButton>
            </span>
          )}
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button loading={create.isPending || update.isPending} onClick={() => (editing ? update.mutate(form) : create.mutate(form))}>
            Cari hesabı kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cari türü" required className="sm:col-span-2">
          <select className="field" value={form.kind} onChange={set('kind')}>
            {Object.entries(KIND).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ünvan" required className="sm:col-span-2">
          <input className="field" autoFocus value={form.title} onChange={set('title')} />
        </Field>
        <Field label="Vergi dairesi">
          <input className="field" value={form.taxOffice} onChange={set('taxOffice')} />
        </Field>
        <Field label="Vergi no">
          <input className="field" value={form.taxNo} onChange={set('taxNo')} />
        </Field>
        <Field label="TCKN">
          <input className="field" maxLength={11} value={form.tckn} onChange={set('tckn')} />
        </Field>
        <Field label="Telefon">
          <input className="field" placeholder="0 (5__) ___ __ __" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="E-posta" className="sm:col-span-2">
          <input className="field" type="email" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="İlçe">
          <input className="field" value={form.district} onChange={set('district')} />
        </Field>
        <Field label="İl">
          <input className="field" value={form.city} onChange={set('city')} />
        </Field>
        <Field label="Adres" className="sm:col-span-2">
          <textarea className="field" rows={2} value={form.address} onChange={set('address')} />
        </Field>
      </div>
      <Checkbox label="Aktif" checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
      <ErrorText error={create.error || update.error || remove.error} />
    </Modal>
  );
}
