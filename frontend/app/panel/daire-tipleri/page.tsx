'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, ConfirmButton, Empty, ErrorText, Field, HowItWorks, Loading, Modal, PageHeader, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { toNum } from '@/lib/format';
import type { UnitType } from '@/lib/types';

export default function UnitTypesPage() {
  const { data, isLoading } = useApi<UnitType[]>('/unit-types');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<UnitType | 'new' | null>(null);
  const list = (data ?? []).filter((t) => `${t.name} ${t.code ?? ''}`.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')));

  return (
    <>
      <HowItWorks>
        <p>
          Daire tipleri (ör. 2+1, 3+1, dubleks) aidat dağıtımında <strong>katsayı</strong> olarak kullanılır. «Katsayıya göre» aidat oluştururken her daireye
          <em> tutar × katsayı</em> yazılır. Tipi olmayan dairelerin katsayısı 1 kabul edilir.
        </p>
      </HowItWorks>
      <PageHeader
        title="Bağımsız bölüm tipleri"
        description="Daireleri sınıflandırmak için standart türler. Aidat payı dağılımında varsayılan katsayı olarak kullanılır."
        actions={
          <Button onClick={() => setEdit('new')}>
            <Plus className="size-4" /> Yeni tip
          </Button>
        }
      />
      <div className="card mb-4 p-4">
        <Field label="Arama">
          <input className="field" placeholder="Ad veya kod..." value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
      </div>
      {isLoading ? (
        <Loading />
      ) : !list.length ? (
        <Empty>Henüz daire tipi yok. «Yeni tip» ile ör. 2+1 veya Dubleks ekleyebilirsiniz.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>Kod</th>
              <th className="!text-right">Katsayı</th>
              <th className="!text-right">Daire sayısı</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td className="font-medium">{t.name}</td>
                <td>{t.code ?? '—'}</td>
                <td className="text-right tabular-nums">×{toNum(t.coefficient).toLocaleString('tr-TR')}</td>
                <td className="text-right tabular-nums">{t._count?.units ?? 0}</td>
                <td className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEdit(t)} aria-label="Düzenle">
                    <Pencil className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <TypeModal state={edit} onClose={() => setEdit(null)} />
    </>
  );
}

function TypeModal({ state, onClose }: { state: UnitType | 'new' | null; onClose: () => void }) {
  const editing = state && state !== 'new' ? state : null;
  const [form, setForm] = useState({ name: '', code: '', coefficient: '1' });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const key = state ? (editing?.id ?? 'new') : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setForm(editing ? { name: editing.name, code: editing.code ?? '', coefficient: String(toNum(editing.coefficient)) } : { name: '', code: '', coefficient: '1' });
  }
  const create = useAction('POST', '/unit-types', { onSuccess: onClose });
  const update = useAction('PATCH', `/unit-types/${editing?.id}`, { onSuccess: onClose });
  const remove = useAction('DELETE', `/unit-types/${editing?.id}`, { onSuccess: onClose });
  return (
    <Modal
      open={!!state}
      onClose={onClose}
      title={editing ? 'Daire tipini düzenle' : 'Yeni daire tipi'}
      footer={
        <>
          {editing && (
            <span className="mr-auto">
              <ConfirmButton message="Tip silinsin mi? Bu tipteki dairelerin tipi boşaltılır." onConfirm={() => remove.mutate(undefined)}>
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Ad" required className="sm:col-span-2">
          <input className="field" autoFocus placeholder="Örn. 3+1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Kod">
          <input className="field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </Field>
      </div>
      <Field label="Aidat katsayısı" hint="1 = standart aidat; 1,25 = %25 fazla.">
        <input className="field" inputMode="decimal" value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value.replace(',', '.') })} />
      </Field>
      <ErrorText error={create.error || update.error || remove.error} />
    </Modal>
  );
}
