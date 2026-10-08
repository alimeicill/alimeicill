'use client';

import { Megaphone } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, Loading, Modal } from '@/components/ui';
import { useApi } from '@/lib/api';
import { dateTime, money, toNum } from '@/lib/format';

interface Summary {
  units: { id: string; label: string; role: 'OWNER' | 'TENANT'; balance: string; lateFee: string }[];
  totalDebt: string;
  totalLateFee: string;
  announcements: { id: string; title: string; body: string; createdAt: string }[];
}

export default function ResidentHome() {
  const { data } = useApi<Summary>('/portal/summary');
  const [pay, setPay] = useState(false);
  if (!data) return <Loading />;
  const debt = toNum(data.totalDebt);

  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-md dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="font-medium text-rose-700 dark:text-rose-400">Toplam borç</div>
            <Button size="sm" onClick={() => setPay(true)} disabled={debt <= 0}>
              Şimdi öde
            </Button>
          </div>
          <div className={`mt-6 text-right text-3xl font-bold tabular-nums ${debt > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-600'}`}>{money(Math.max(debt, 0))}</div>
          {debt < 0 && <div className="text-right text-sm text-emerald-600">Avans: {money(-debt)}</div>}
          {toNum(data.totalLateFee) > 0 && <div className="mt-1 text-right text-xs text-amber-700">+ {money(data.totalLateFee)} gecikme tazminatı</div>}
          <div className="mt-3 h-0.5 rounded bg-rose-600" />
        </div>
        {data.units.map((u) => (
          <div key={u.id} className="card p-4 text-sm">
            <div className="font-medium">{u.label}</div>
            <div className="mt-1 flex items-center justify-between">
              <Badge tone={u.role === 'OWNER' ? 'blue' : 'gray'}>{u.role === 'OWNER' ? 'Malik' : 'Kiracı'}</Badge>
              <span className="tabular-nums">{money(u.balance)}</span>
            </div>
          </div>
        ))}
      </div>
      <Card
        title={
          <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Megaphone className="size-4" /> DUYURULAR
          </span>
        }
      >
        {data.announcements.length === 0 ? (
          <p className="text-sm text-slate-500">Duyuru yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.announcements.map((a) => (
              <li key={a.id} className="py-3">
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-slate-500">{dateTime(a.createdAt)}</div>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{a.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Modal open={pay} onClose={() => setPay(false)} title="Ödeme">
        <p className="text-sm">
          Ödenecek tutar: <strong>{money(debt)}</strong>
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Online kart ile ödeme henüz aktif değil. Ödemenizi yönetimin banka hesabına havale/EFT ile yapabilir, açıklamaya blok ve daire numaranızı
          yazabilirsiniz. Tahsilat yönetim tarafından işlendiğinde bakiyeniz güncellenir.
        </p>
      </Modal>
    </div>
  );
}
