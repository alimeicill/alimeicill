'use client';

import { KeyRound, Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Badge, Button, ConfirmButton, Empty, ErrorText, Field, HowItWorks, Loading, Modal, PageHeader, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { date, money, phone } from '@/lib/format';
import type { Person } from '@/lib/types';

interface PersonRow extends Person {
  hasPortal: boolean;
  units: { id: string; role: 'OWNER' | 'TENANT'; unit: { id: string; doorNo: string; block: { name: string }; site: { name: string } } }[];
}

export default function PeoplePage() {
  return (
    <Suspense fallback={<Loading />}>
      <People />
    </Suspense>
  );
}

function People() {
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useApi<{ items: PersonRow[]; total: number; page: number; pages: number }>(`/people?q=${encodeURIComponent(query)}&page=${page}`);
  const [edit, setEdit] = useState<Person | 'new' | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  useEffect(() => {
    if (params.get('yeni')) setEdit('new');
  }, [params]);

  return (
    <>
      <HowItWorks>
        <p>
          <strong>Kişiler</strong> (malik, kiracı, sakin) firma genelinde tutulur; daireye bağlantı daire detayındaki «Malik ve kiracı» sekmesinden yapılır.
        </p>
        <p>Telefon ve e-posta isteğe bağlıdır. Kişi detayından sakin paneli girişi açabilir ve hukuki takip dökümünü alabilirsiniz.</p>
      </HowItWorks>
      <PageHeader
        title="Kişiler"
        actions={
          <Button onClick={() => setEdit('new')}>
            <Plus className="size-4" /> Yeni kişi
          </Button>
        }
      />
      <form
        className="card mb-4 flex gap-2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(q);
        }}
      >
        <input className="field" placeholder="Ad, soyad veya telefon" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" variant="secondary">
          <Search className="size-4" /> Ara
        </Button>
      </form>
      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Empty>Henüz kişi yok.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Ad soyad</th>
              <th>Telefon</th>
              <th>Daireler</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id}>
                <td>
                  <button type="button" className="font-medium text-brand-700 hover:underline dark:text-brand-100" onClick={() => setDetail(p.id)}>
                    {p.firstName} {p.lastName}
                  </button>
                </td>
                <td className="whitespace-nowrap">{phone(p.phone)}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {p.units.map((u) => (
                      <Link key={u.id} href={`/panel/daireler/${u.unit.id}`}>
                        <Badge tone={u.role === 'OWNER' ? 'blue' : 'gray'}>
                          {u.unit.block.name}/{u.unit.doorNo} {u.role === 'OWNER' ? 'Malik' : 'Kiracı'}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </td>
                <td className="space-x-1">
                  {p.hasPortal && <Badge tone="green">Panel erişimi</Badge>}
                  {p.kvkkConsentAt ? <Badge tone="green">KVKK</Badge> : <Badge tone="amber">KVKK yok</Badge>}
                </td>
                <td className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEdit(p)} aria-label="Düzenle">
                    <Pencil className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>
            Toplam <strong>{data.total}</strong> kayıt — Sayfa <strong>{data.page}</strong> / {data.pages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Önceki
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
              Sonraki
            </Button>
          </div>
        </div>
      )}
      <PersonModal person={edit} onClose={() => setEdit(null)} />
      <PersonDetail id={detail} onClose={() => setDetail(null)} />
    </>
  );
}

const EMPTY = { firstName: '', lastName: '', phone: '', email: '', tckn: '', notes: '' };

function PersonModal({ person, onClose }: { person: Person | 'new' | null; onClose: () => void }) {
  const editing = person && person !== 'new' ? person : null;
  const [form, setForm] = useState(EMPTY);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const key = person ? (editing?.id ?? 'new') : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setForm(editing ? { firstName: editing.firstName, lastName: editing.lastName, phone: editing.phone ?? '', email: editing.email ?? '', tckn: editing.tckn ?? '', notes: editing.notes ?? '' } : EMPTY);
  }
  const create = useAction('POST', '/people', { onSuccess: onClose });
  const update = useAction('PATCH', `/people/${editing?.id}`, { onSuccess: onClose });
  const remove = useAction('DELETE', `/people/${editing?.id}`, { onSuccess: onClose });
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal
      open={!!person}
      onClose={onClose}
      title={editing ? 'Kişiyi düzenle' : 'Yeni kişi'}
      footer={
        <>
          {editing && (
            <span className="mr-auto">
              <ConfirmButton loading={remove.isPending} message="Kişi silinsin mi?" onConfirm={() => remove.mutate(undefined)}>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ad" required>
          <input className="field" autoFocus value={form.firstName} onChange={set('firstName')} />
        </Field>
        <Field label="Soyad" required>
          <input className="field" value={form.lastName} onChange={set('lastName')} />
        </Field>
        <Field label="Telefon" hint="Sakin paneli girişi bu numarayla yapılır.">
          <input className="field" placeholder="0 (5__) ___ __ __" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="E-posta">
          <input className="field" type="email" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="TCKN" className="sm:col-span-2">
          <input className="field" inputMode="numeric" maxLength={11} value={form.tckn} onChange={set('tckn')} />
        </Field>
        <Field label="Not" className="sm:col-span-2">
          <textarea className="field" rows={2} value={form.notes} onChange={set('notes')} />
        </Field>
      </div>
      <ErrorText error={create.error || update.error || remove.error} />
    </Modal>
  );
}

interface PersonDetailData extends Person {
  user: { id: string; phone: string } | null;
  units: PersonRow['units'];
  openCharges: { id: string; unit: string; description: string; period: string | null; dueDate: string; amount: string; remaining: string }[];
  openTotal: string;
}

function PersonDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: p } = useApi<PersonDetailData>(id ? `/people/${id}` : null);
  const [password, setPassword] = useState('');
  const portal = useAction('POST', `/people/${id}/portal-access`, { onSuccess: () => setPassword('') });
  const revoke = useAction('DELETE', `/people/${id}/portal-access`);
  const kvkk = useAction<{ consent: boolean }>('POST', `/people/${id}/kvkk`);

  return (
    <Modal open={!!id} onClose={onClose} wide title={p ? `${p.firstName} ${p.lastName}` : 'Kişi'}>
      {!p ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs text-slate-500">Telefon</div>
              {phone(p.phone)}
            </div>
            <div>
              <div className="text-xs text-slate-500">E-posta</div>
              {p.email || '—'}
            </div>
            <div>
              <div className="text-xs text-slate-500">KVKK onayı</div>
              {p.kvkkConsentAt ? (
                <span>
                  {date(p.kvkkConsentAt)}{' '}
                  <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => kvkk.mutate({ consent: false })}>
                    geri al
                  </button>
                </span>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => kvkk.mutate({ consent: true })}>
                  Onay alındı olarak işaretle
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <KeyRound className="size-4" /> Sakin paneli erişimi
            </div>
            {p.user ? (
              <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                Açık — giriş: <strong>{phone(p.user.phone)}</strong>.{' '}
                <button type="button" className="text-rose-600 hover:underline" onClick={() => revoke.mutate(undefined)}>
                  Erişimi kapat
                </button>
              </p>
            ) : (
              <p className="mb-2 text-sm text-slate-500">Kişi, telefon numarası ve belirlediğiniz şifreyle sakin paneline girip borçlarını görebilir, talep açabilir.</p>
            )}
            <div className="flex gap-2">
              <input className="field" type="text" placeholder={p.user ? 'Yeni şifre' : 'Şifre (en az 6 karakter)'} value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button loading={portal.isPending} onClick={() => portal.mutate({ password })}>
                {p.user ? 'Şifreyi yenile' : 'Erişim aç'}
              </Button>
            </div>
            {portal.isSuccess && <p className="mt-2 text-sm text-emerald-600">Kaydedildi. Şifreyi kişiye güvenli bir kanaldan iletin.</p>}
            <div className="mt-2">
              <ErrorText error={portal.error || revoke.error} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">Hukuki takip dökümü — açık borçlar</h4>
              <Button size="sm" variant="secondary" onClick={() => window.print()}>
                <Printer className="size-3.5" /> Yazdır
              </Button>
            </div>
            {p.openCharges.length === 0 ? (
              <Empty>Kişiye yazılmış açık borç yok.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Daire</th>
                    <th>Açıklama</th>
                    <th>Vade</th>
                    <th className="!text-right">Tutar</th>
                    <th className="!text-right">Kalan</th>
                  </tr>
                </thead>
                <tbody>
                  {p.openCharges.map((c) => (
                    <tr key={c.id}>
                      <td>{c.unit}</td>
                      <td>
                        {c.description} {c.period && <span className="text-slate-400">({c.period})</span>}
                      </td>
                      <td>{date(c.dueDate)}</td>
                      <td className="text-right tabular-nums">{money(c.amount)}</td>
                      <td className="text-right font-medium tabular-nums text-rose-600">{money(c.remaining)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold dark:bg-slate-900">
                    <td colSpan={4}>Toplam açık borç</td>
                    <td className="text-right tabular-nums">{money(p.openTotal)}</td>
                  </tr>
                </tbody>
              </Table>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
