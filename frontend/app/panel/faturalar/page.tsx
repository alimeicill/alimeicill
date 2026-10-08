'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Badge, Button, ConfirmButton, Empty, ErrorText, Field, HowItWorks, Loading, Modal, PageHeader, Pills, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { date, money, toNum, today } from '@/lib/format';
import type { CurrentAccount, FinanceItem, PaymentAccount, Site } from '@/lib/types';

interface Invoice {
  id: string;
  invoiceNo: string | null;
  date: string;
  dueDate: string | null;
  amount: string;
  paidAmount: string;
  description: string | null;
  currentAccount: { title: string };
  site: { name: string } | null;
  financeItem: { name: string } | null;
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Invoices />
    </Suspense>
  );
}

function Invoices() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'' | 'open' | 'paid'>('');
  const { data, isLoading } = useApi<Invoice[]>(`/invoices?status=${status}`);
  const [create, setCreate] = useState(false);
  const [pay, setPay] = useState<Invoice | null>(null);
  const del = useAction<string>('DELETE', (id) => `/invoices/${id}`);
  useEffect(() => {
    if (params.get('yeni')) setCreate(true);
  }, [params]);

  return (
    <>
      <HowItWorks>
        <p>
          Tedarikçilerden gelen faturaları (temizlik, bakım, elektrik vb.) kaydedin. «Öde» ile seçtiğiniz kasa/bankadan çıkış yapılır ve fatura kısmen ya da
          tamamen kapanır.
        </p>
      </HowItWorks>
      <PageHeader
        title="Faturalar"
        actions={
          <Button onClick={() => setCreate(true)}>
            <Plus className="size-4" /> Fatura ekle
          </Button>
        }
      />
      <div className="mb-4">
        <Pills
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Tümü' },
            { value: 'open', label: 'Ödenmemiş' },
            { value: 'paid', label: 'Ödenmiş' },
          ]}
        />
      </div>
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Fatura yok.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Cari</th>
              <th>Fatura no</th>
              <th>Kalem / site</th>
              <th>Vade</th>
              <th className="!text-right">Tutar</th>
              <th className="!text-right">Kalan</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((i) => {
              const open = toNum(i.amount) - toNum(i.paidAmount);
              const late = open > 0 && i.dueDate && new Date(i.dueDate) < new Date();
              return (
                <tr key={i.id}>
                  <td>{date(i.date)}</td>
                  <td className="font-medium">{i.currentAccount.title}</td>
                  <td>{i.invoiceNo ?? '—'}</td>
                  <td>
                    {i.financeItem?.name ?? '—'}
                    <div className="text-xs text-slate-500">{i.site?.name}</div>
                  </td>
                  <td>
                    {date(i.dueDate)} {late && <Badge tone="red">Gecikti</Badge>}
                  </td>
                  <td className="text-right tabular-nums">{money(i.amount)}</td>
                  <td className="text-right tabular-nums">{open > 0 ? <span className="font-medium text-rose-600">{money(open)}</span> : <Badge tone="green">Ödendi</Badge>}</td>
                  <td className="whitespace-nowrap text-right">
                    {open > 0 && (
                      <Button size="sm" variant="success" onClick={() => setPay(i)}>
                        Öde
                      </Button>
                    )}{' '}
                    {toNum(i.paidAmount) === 0 && (
                      <ConfirmButton message="Fatura silinsin mi?" onConfirm={() => del.mutate(i.id)}>
                        <Trash2 className="size-3.5" />
                      </ConfirmButton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <div className="mt-3">
        <ErrorText error={del.error} />
      </div>
      <InvoiceModal open={create} onClose={() => setCreate(false)} />
      <PayModal invoice={pay} onClose={() => setPay(null)} />
    </>
  );
}

function InvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: currents } = useApi<CurrentAccount[]>(open ? '/current-accounts?active=true' : null);
  const { data: items } = useApi<FinanceItem[]>(open ? '/finance-items?kind=EXPENSE' : null);
  const { data: sites } = useApi<Site[]>(open ? '/sites' : null);
  const empty = { currentAccountId: '', financeItemId: '', siteId: '', invoiceNo: '', date: today(), dueDate: '', amount: '', description: '' };
  const [form, setForm] = useState(empty);
  const save = useAction('POST', '/invoices', {
    onSuccess: () => {
      setForm(empty);
      onClose();
    },
  });
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: k === 'amount' ? e.target.value.replace(',', '.') : e.target.value });

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Fatura ekle"
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
        <Field label="Cari" required hint={currents?.length === 0 ? 'Önce Cari hesaplar sayfasından tedarikçi ekleyin.' : undefined}>
          <select className="field" value={form.currentAccountId} onChange={set('currentAccountId')}>
            <option value="">Seçin...</option>
            {currents?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fatura no">
          <input className="field" value={form.invoiceNo} onChange={set('invoiceNo')} />
        </Field>
        <Field label="Gider kalemi">
          <select className="field" value={form.financeItemId} onChange={set('financeItemId')}>
            <option value="">—</option>
            {items?.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Site">
          <select className="field" value={form.siteId} onChange={set('siteId')}>
            <option value="">Firma geneli</option>
            {sites?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fatura tarihi" required>
          <input className="field" type="date" value={form.date} onChange={set('date')} />
        </Field>
        <Field label="Son ödeme tarihi">
          <input className="field" type="date" value={form.dueDate} onChange={set('dueDate')} />
        </Field>
        <Field label="Tutar (₺)" required>
          <input className="field" inputMode="decimal" value={form.amount} onChange={set('amount')} />
        </Field>
        <Field label="Açıklama">
          <input className="field" value={form.description} onChange={set('description')} />
        </Field>
      </div>
      <ErrorText error={save.error} />
    </Modal>
  );
}

function PayModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { data: accounts } = useApi<PaymentAccount[]>(invoice ? '/payment-accounts' : null);
  const [form, setForm] = useState({ paymentAccountId: '', amount: '', date: today() });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if ((invoice?.id ?? null) !== loadedFor) {
    setLoadedFor(invoice?.id ?? null);
    setForm({ paymentAccountId: '', amount: invoice ? (toNum(invoice.amount) - toNum(invoice.paidAmount)).toFixed(2) : '', date: today() });
  }
  const pay = useAction('POST', `/invoices/${invoice?.id}/pay`, { onSuccess: onClose });
  const active = accounts?.filter((a) => a.active) ?? [];
  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title={`Fatura ödemesi — ${invoice?.currentAccount.title ?? ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="success" loading={pay.isPending} onClick={() => pay.mutate({ ...form, paymentAccountId: form.paymentAccountId || active[0]?.id })}>
            Ödemeyi kaydet
          </Button>
        </>
      }
    >
      <Field label="Ödeme yapılan hesap" required>
        <select className="field" value={form.paymentAccountId || active[0]?.id || ''} onChange={(e) => setForm({ ...form, paymentAccountId: e.target.value })}>
          {active.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {money(a.balance)}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tutar (₺)" required>
          <input className="field" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(',', '.') })} />
        </Field>
        <Field label="Tarih" required>
          <input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
      </div>
      <ErrorText error={pay.error} />
    </Modal>
  );
}
