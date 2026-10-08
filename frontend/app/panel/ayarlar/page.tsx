'use client';

import { useState } from 'react';
import { Button, Card, ErrorText, Field, Loading, PageHeader } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { toNum } from '@/lib/format';
import { useSession } from '@/lib/session';

interface Settings {
  id: string;
  name: string;
  lateFeeRate: string;
}

export default function SettingsPage() {
  const { data } = useApi<Settings>('/settings');
  if (!data) return <Loading />;
  return <SettingsForm initial={data} />;
}

function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState({ name: initial.name, lateFeeRate: String(toNum(initial.lateFeeRate)) });
  const { user, setSession, token } = useSession();
  const save = useAction<typeof form, Settings>('PATCH', '/settings', {
    onSuccess: (s) => user && token && setSession(token, { ...user, tenantName: s.name }),
  });
  return (
    <>
      <PageHeader title="Ayarlar" />
      <Card title="Firma ve tahsilat ayarları" className="max-w-xl">
        <div className="space-y-4">
          <Field label="Firma / yönetim adı" required>
            <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Aylık gecikme tazminatı oranı (%)" hint="Kat Mülkiyeti Kanunu md.20: ödemede geciken kat maliki aylık %5 gecikme tazminatı öder. 0 girerseniz hesaplanmaz.">
            <input className="field w-32" inputMode="decimal" value={form.lateFeeRate} onChange={(e) => setForm({ ...form, lateFeeRate: e.target.value.replace(',', '.') })} />
          </Field>
          <ErrorText error={save.error} />
          {save.isSuccess && <p className="text-sm text-emerald-600">Kaydedildi.</p>}
          <Button loading={save.isPending} onClick={() => save.mutate(form)}>
            Kaydet
          </Button>
        </div>
      </Card>
    </>
  );
}
