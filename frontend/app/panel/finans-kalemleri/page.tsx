'use client';

import { ChevronDown, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Checkbox, ConfirmButton, Empty, ErrorText, Field, HowItWorks, Loading, Modal, PageHeader, Pills, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { KIND_LABEL, type FinanceItem } from '@/lib/types';

type Kind = FinanceItem['kind'];

export default function FinanceItemsPage() {
  const [kind, setKind] = useState<'' | Kind>('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const { data, isLoading } = useApi<FinanceItem[]>(`/finance-items?kind=${kind}&q=${encodeURIComponent(query)}`);
  const [edit, setEdit] = useState<FinanceItem | { kind: Kind } | null>(null);
  const [menu, setMenu] = useState(false);

  return (
    <>
      <HowItWorks>
        <p>
          <strong>Gelir</strong> kalemleri kasa/banka girişlerini, <strong>gider</strong> kalemleri çıkışları, <strong>borçlandırma</strong> kalemleri ise
          dairelere yazılan borçları (aidat, ortak gider payı, demirbaş vb.) sınıflandırır.
        </p>
        <p>Kullanılmış kalemler silinemez; pasife alındığında yeni kayıtlarda seçilemez.</p>
      </HowItWorks>
      <PageHeader
        title="Gelir / gider kalemleri"
        actions={
          <div className="relative">
            <Button onClick={() => setMenu(!menu)}>
              <Plus className="size-4" /> Yeni <ChevronDown className="size-3.5" />
            </Button>
            {menu && (
              <div className="card absolute right-0 z-10 mt-1 w-48 overflow-hidden p-1">
                {(['INCOME', 'EXPENSE', 'CHARGE'] as Kind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => {
                      setMenu(false);
                      setEdit({ kind: k });
                    }}
                  >
                    {KIND_LABEL[k]} kalemi
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />
      <div className="card mb-4 space-y-3 p-4">
        <Pills
          value={kind}
          onChange={setKind}
          options={[
            { value: '', label: 'Tümü' },
            { value: 'INCOME', label: 'Gelir' },
            { value: 'EXPENSE', label: 'Gider' },
            { value: 'CHARGE', label: 'Borçlandırma' },
          ]}
        />
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q);
          }}
        >
          <input className="field" placeholder="Kalem adı" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" variant="secondary">
            <Search className="size-4" /> Ara
          </Button>
        </form>
      </div>
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Henüz finans kalemi yok.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>Tür</th>
              <th>Durum</th>
              <th>Açıklama</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((i) => (
              <tr key={i.id}>
                <td className="font-medium">
                  {i.name} {i.isDefault && <Badge tone="blue">Varsayılan</Badge>}
                </td>
                <td>
                  <Badge tone={i.kind === 'INCOME' ? 'green' : i.kind === 'EXPENSE' ? 'red' : 'amber'}>{KIND_LABEL[i.kind]}</Badge>
                </td>
                <td>{i.active ? <Badge tone="green">Aktif</Badge> : <Badge>Pasif</Badge>}</td>
                <td className="text-slate-500">{i.description}</td>
                <td className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEdit(i)} aria-label="Düzenle">
                    <Pencil className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ItemModal state={edit} onClose={() => setEdit(null)} />
    </>
  );
}

function ItemModal({ state, onClose }: { state: FinanceItem | { kind: Kind } | null; onClose: () => void }) {
  const editing = state && 'id' in state ? state : null;
  const [form, setForm] = useState({ name: '', kind: 'INCOME' as Kind, active: true, isDefault: false, description: '' });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const key = state ? (editing?.id ?? `new-${state.kind}`) : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setForm(
      editing
        ? { name: editing.name, kind: editing.kind, active: editing.active, isDefault: editing.isDefault, description: editing.description ?? '' }
        : { name: '', kind: state?.kind ?? 'INCOME', active: true, isDefault: false, description: '' },
    );
  }
  const create = useAction('POST', '/finance-items', { onSuccess: onClose });
  const update = useAction('PATCH', `/finance-items/${editing?.id}`, { onSuccess: onClose });
  const remove = useAction('DELETE', `/finance-items/${editing?.id}`, { onSuccess: onClose });

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      title={editing ? 'Kalemi düzenle' : `Yeni ${KIND_LABEL[form.kind].toLocaleLowerCase('tr')} kalemi`}
      footer={
        <>
          {editing && (
            <span className="mr-auto">
              <ConfirmButton loading={remove.isPending} onConfirm={() => remove.mutate(undefined)}>
                <Trash2 className="size-3.5" /> Sil
              </ConfirmButton>
            </span>
          )}
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button loading={create.isPending || update.isPending} onClick={() => (editing ? update.mutate(form) : create.mutate(form))}>
            Kaydet
          </Button>
        </>
      }
    >
      <Field label="Ad" required>
        <input className="field" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Tür">
        <select className="field" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}>
          {(['INCOME', 'EXPENSE', 'CHARGE'] as Kind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex flex-col gap-2">
        <Checkbox label="Aktif" checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
        <Checkbox label="Bu tür için varsayılan kalem" checked={form.isDefault} onChange={(v) => setForm({ ...form, isDefault: v })} />
      </div>
      <Field label="Açıklama (isteğe bağlı)">
        <textarea className="field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <ErrorText error={create.error || update.error || remove.error} />
    </Modal>
  );
}
