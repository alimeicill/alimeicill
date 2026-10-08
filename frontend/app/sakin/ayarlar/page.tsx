'use client';

import { useState } from 'react';
import { Button, Card, Checkbox, ErrorText, Field, Loading } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';

interface Settings {
  firstName: string;
  lastName: string;
  phone: string;
  smsNotify: boolean;
  mailNotify: boolean;
  units: { id: string; label: string }[];
}

export default function ResidentSettings() {
  const { data } = useApi<Settings>('/portal/settings');
  if (!data) return <Loading />;
  return <Form initial={data} />;
}

function Form({ initial }: { initial: Settings }) {
  const [form, setForm] = useState({ firstName: initial.firstName, lastName: initial.lastName, smsNotify: initial.smsNotify, mailNotify: initial.mailNotify });
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' });
  const save = useAction('PATCH', '/portal/settings');
  const changePw = useAction('POST', '/portal/password', { onSuccess: () => setPw({ current: '', password: '', confirm: '' }) });

  return (
    <Card title={<span className="text-emerald-700 dark:text-emerald-400">KULLANICI İŞLEMLERİ</span>}>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <Field label="İsim">
            <input className="field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Soyad">
            <input className="field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Daireler</div>
            <ul className="text-sm">
              {initial.units.map((u) => (
                <li key={u.id}>{u.label}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-6">
            <Checkbox label="SMS bildirim" checked={form.smsNotify} onChange={(v) => setForm({ ...form, smsNotify: v })} />
            <Checkbox label="E-posta bildirim" checked={form.mailNotify} onChange={(v) => setForm({ ...form, mailNotify: v })} />
          </div>
          <ErrorText error={save.error} />
          {save.isSuccess && <p className="text-sm text-emerald-600">Kaydedildi.</p>}
          <Button variant="success" loading={save.isPending} onClick={() => save.mutate(form)}>
            Kaydet
          </Button>
        </div>
        <div className="space-y-3">
          <Field label="Mevcut şifre" required>
            <input className="field" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label="Yeni şifre" required>
            <input className="field" type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
          </Field>
          <Field label="Şifre tekrar" required>
            <input className="field" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <ErrorText error={changePw.error} />
          {changePw.isSuccess && <p className="text-sm text-emerald-600">Şifreniz değiştirildi.</p>}
          <Button loading={changePw.isPending} onClick={() => changePw.mutate(pw)}>
            Şifre değiştir
          </Button>
        </div>
      </div>
    </Card>
  );
}
