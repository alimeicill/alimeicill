'use client';

import { useEffect, useState } from 'react';
import { Button, ErrorText, Field, Modal } from './ui';
import { useAction, useApi } from '@/lib/api';
import { money, today } from '@/lib/format';
import type { PaymentAccount } from '@/lib/types';

/** Daireden tahsilat alır; tutar FIFO ile en eski borçlara dağıtılır, artan kısım avans olarak kalır. */
export function PaymentModal({
  unit,
  onClose,
}: {
  unit: { id: string; label: string; siteId: string; balance?: string } | null;
  onClose: () => void;
}) {
  const { data: accounts } = useApi<PaymentAccount[]>(unit ? '/payment-accounts' : null);
  const usable = (accounts ?? []).filter((a) => a.active && (!a.siteId || a.siteId === unit?.siteId));
  const [form, setForm] = useState({ paymentAccountId: '', amount: '', date: today(), description: '' });
  const pay = useAction('POST', '/payments', { onSuccess: onClose });

  useEffect(() => {
    if (!unit) return;
    pay.reset();
    const bal = Number(unit.balance ?? 0);
    setForm({ paymentAccountId: '', amount: bal > 0 ? bal.toFixed(2) : '', date: today(), description: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit?.id]);

  useEffect(() => {
    if (!form.paymentAccountId && usable.length) setForm((f) => ({ ...f, paymentAccountId: usable[0].id }));
  }, [usable, form.paymentAccountId]);

  return (
    <Modal
      open={!!unit}
      onClose={onClose}
      title={`Tahsilat al — ${unit?.label ?? ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="success" loading={pay.isPending} onClick={() => pay.mutate({ unitId: unit!.id, ...form })}>
            Tahsilatı kaydet
          </Button>
        </>
      }
    >
      {unit?.balance !== undefined && (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
          Güncel bakiye: <strong className="tabular-nums">{money(unit.balance)}</strong>
        </div>
      )}
      <Field label="Ödeme hesabı" required hint={usable.length === 0 ? 'Önce Ödeme hesapları sayfasından bir kasa veya banka ekleyin.' : undefined}>
        <select className="field" value={form.paymentAccountId} onChange={(e) => setForm({ ...form, paymentAccountId: e.target.value })}>
          {usable.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.kind === 'CASH' ? 'Kasa' : 'Banka'})
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tutar (₺)" required>
          <input className="field tabular-nums" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(',', '.') })} />
        </Field>
        <Field label="Tarih" required>
          <input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
      </div>
      <Field label="Açıklama">
        <input className="field" placeholder="Örn. Ekim aidatı — havale" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <p className="text-xs text-slate-500">Tutar, vadesi en eski borçtan başlayarak kapatılır. Borçtan fazla ödeme avans olarak kalır ve sonraki borçlara otomatik mahsup edilir.</p>
      <ErrorText error={pay.error} />
    </Modal>
  );
}
