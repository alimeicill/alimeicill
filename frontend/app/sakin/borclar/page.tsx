'use client';

import { Building } from 'lucide-react';
import { useState } from 'react';
import { LedgerTable } from '@/components/ledger-table';
import { Card, Empty, Field, Loading } from '@/components/ui';
import { useApi } from '@/lib/api';
import { money } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Ledger } from '@/lib/types';

export default function ResidentLedger() {
  const [year, setYear] = useState('');
  const { data } = useApi<Ledger[]>(`/portal/ledger?year=${year}`);
  const user = useSession((s) => s.user);
  const thisYear = new Date().getFullYear();

  return (
    <div className="space-y-5">
      <Card>
        <Field label="Yıl" className="max-w-xs">
          <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Tüm yıllar</option>
            {[0, 1, 2, 3].map((i) => (
              <option key={i} value={thisYear - i}>
                {thisYear - i}
              </option>
            ))}
          </select>
        </Field>
      </Card>
      {!data ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty>Hesabınıza bağlı daire bulunamadı. Yönetimle iletişime geçin.</Empty>
      ) : (
        data.map((l) => (
          <Card key={l.unit.id} title={<span className="text-emerald-700 dark:text-emerald-400">BAKİYE HAREKETLERİ</span>}>
            <div className="mb-4 flex items-center gap-4 overflow-hidden rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <div className="bg-emerald-600 p-5 text-white">
                <Building className="size-8" />
              </div>
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                <div>
                  Kişi: {user?.name} — {l.unit.label}
                </div>
                <div>Bakiye: {money(l.summary.balance)}</div>
              </div>
            </div>
            {l.rows.length === 0 ? <Empty>Bu dönemde hareket yok.</Empty> : <LedgerTable rows={l.rows} />}
          </Card>
        ))
      )}
    </div>
  );
}
