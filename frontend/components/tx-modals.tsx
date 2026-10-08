'use client';

import { useEffect, useState } from 'react';
import { Button, ErrorText, Field, Modal } from './ui';
import { useAction, useApi } from '@/lib/api';
import { today } from '@/lib/format';
import type { CurrentAccount, FinanceItem, PaymentAccount, Site } from '@/lib/types';

/** Gelir veya gider kaydı (kasa/banka hareketi). */
export function TxModal({ direction, onClose }: { direction: 'IN' | 'OUT' | null; onClose: () => void }) {
  const open = !!direction;
  const { data: accounts } = useApi<PaymentAccount[]>(open ? '/payment-accounts' : null);
  const { data: items } = useApi<FinanceItem[]>(open ? `/finance-items?kind=${direction === 'IN' ? 'INCOME' : 'EXPENSE'}` : null);
  const { data: currents } = useApi<CurrentAccount[]>(open ? '/current-accounts?active=true' : null);
  const { data: sites } = useApi<Site[]>(open ? '/sites' : null);
  const empty = { paymentAccountId: '', financeItemId: '', currentAccountId: '', siteId: '', amount: '', date: today(), description: '' };
  const [form, setForm] = useState(empty);
  const save = useAction('POST', '/transactions', { onSuccess: onClose });

  useEffect(() => {
    if (open) {
      setForm(empty);
      save.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);
  useEffect(() => {
    const acc = accounts?.find((a) => a.active);
    const item = items?.find((i) => i.active && i.isDefault) ?? items?.find((i) => i.active);
    setForm((f) => ({ ...f, paymentAccountId: f.paymentAccountId || acc?.id || '', financeItemId: f.financeItemId || item?.id || '' }));
  }, [accounts, items]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: k === 'amount' ? e.target.value.replace(',', '.') : e.target.value });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={direction === 'IN' ? 'Gelir kaydet' : 'Gider kaydet'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant={direction === 'IN' ? 'success' : 'primary'} loading={save.isPending} onClick={() => save.mutate({ ...form, direction })}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={direction === 'IN' ? 'Giriş yapılan hesap' : 'Ödeme yapılan hesap'} required>
          <select className="field" value={form.paymentAccountId} onChange={set('paymentAccountId')}>
            {accounts
              ?.filter((a) => a.active)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label={direction === 'IN' ? 'Gelir kalemi' : 'Gider kalemi'} required>
          <select className="field" value={form.financeItemId} onChange={set('financeItemId')}>
            <option value="">Seçin...</option>
            {items
              ?.filter((i) => i.active)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Tutar (₺)" required>
          <input className="field tabular-nums" inputMode="decimal" value={form.amount} onChange={set('amount')} />
        </Field>
        <Field label="Tarih" required>
          <input className="field" type="date" value={form.date} onChange={set('date')} />
        </Field>
        <Field label="Site">
          <select className="field" value={form.siteId} onChange={set('siteId')}>
            <option value="">Hesabın sitesi</option>
            {sites?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cari (isteğe bağlı)">
          <select className="field" value={form.currentAccountId} onChange={set('currentAccountId')}>
            <option value="">—</option>
            {currents?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Açıklama" className="sm:col-span-2">
          <input className="field" value={form.description} onChange={set('description')} />
        </Field>
      </div>
      {items && items.length === 0 && <p className="text-sm text-amber-700">Önce Gelir / gider kalemleri sayfasından bir kalem ekleyin.</p>}
      <ErrorText error={save.error} />
    </Modal>
  );
}

/** Hesaplar arası para aktarımı (virman). */
export function TransferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: accounts } = useApi<PaymentAccount[]>(open ? '/payment-accounts' : null);
  const [form, setForm] = useState({ fromId: '', toId: '', amount: '', date: today(), description: '' });
  const save = useAction('POST', '/transactions/transfer', { onSuccess: onClose });
  const active = accounts?.filter((a) => a.active) ?? [];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Virman (hesaplar arası aktarım)"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate(form)}>
            Aktar
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(['fromId', 'toId'] as const).map((k) => (
          <Field key={k} label={k === 'fromId' ? 'Çıkış hesabı' : 'Giriş hesabı'} required>
            <select className="field" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
              <option value="">Seçin...</option>
              {active.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        ))}
        <Field label="Tutar (₺)" required>
          <input className="field" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(',', '.') })} />
        </Field>
        <Field label="Tarih" required>
          <input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Açıklama" className="sm:col-span-2">
          <input className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </div>
      <ErrorText error={save.error} />
    </Modal>
  );
}
