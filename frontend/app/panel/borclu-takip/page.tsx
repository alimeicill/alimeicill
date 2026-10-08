'use client';

import { Download, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Empty, Field, HowItWorks, Loading, PageHeader, StatCard, Table, Button } from '@/components/ui';
import { useApi } from '@/lib/api';
import { amount, date, downloadCsv, money, phone, toNum } from '@/lib/format';
import type { SiteDetail, Site } from '@/lib/types';

interface Debtors {
  summary: { totalOpen: string; totalLateFee: string; debtorUnits: number; lines: number };
  lateFeeRate: string;
  rows: { unitId: string; site: string; label: string; debtor: string | null; phone: string | null; open: string; lateFee: string; oldestDue: string; overdueDays: number; lines: number }[];
}

export default function DebtorsPage() {
  const { data: sites } = useApi<Site[]>('/sites');
  const [f, setF] = useState({ siteId: '', blockId: '', status: 'overdue', sort: 'amount' });
  const siteId = f.siteId || sites?.[0]?.id || '';
  const { data: site } = useApi<SiteDetail>(siteId ? `/sites/${siteId}` : null);
  const { data, isLoading } = useApi<Debtors>(siteId ? `/debtors?siteId=${siteId}&blockId=${f.blockId}&status=${f.status}&sort=${f.sort}` : null);
  const [q, setQ] = useState('');
  const rows = (data?.rows ?? []).filter((r) => `${r.label} ${r.debtor ?? ''}`.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')));

  return (
    <>
      <HowItWorks>
        <p>Açık borcu olan daireleri vade durumuna göre listeler. Gecikme tazminatı, KMK md.20 uyarınca ödenmeyen tutara aylık oran üzerinden gün bazında hesaplanır ve kayda yazılmaz; yalnızca takip içindir.</p>
        <p>Oranı Ayarlar sayfasından değiştirebilirsiniz (yasal üst sınır aylık %5).</p>
      </HowItWorks>
      <PageHeader title="Borçlu takip merkezi" />
      <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Site">
          <select className="field" value={siteId} onChange={(e) => setF({ ...f, siteId: e.target.value, blockId: '' })}>
            {sites?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Blok">
          <select className="field" value={f.blockId} onChange={(e) => setF({ ...f, blockId: e.target.value })}>
            <option value="">Tüm bloklar</option>
            {site?.blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vade durumu">
          <select className="field" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="overdue">Vadesi geçmiş</option>
            <option value="all">Tüm açık borçlar</option>
          </select>
        </Field>
        <Field label="Sıralama">
          <select className="field" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })}>
            <option value="amount">En yüksek borç</option>
            <option value="oldest">En eski vade</option>
          </select>
        </Field>
      </div>
      {isLoading || !data ? (
        sites?.length === 0 ? <Empty>Önce bir site oluşturun.</Empty> : <Loading />
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <StatCard tone="rose" label="Toplam açık borç" value={money(data.summary.totalOpen)} sub={`Gecikme tazminatı: ${money(data.summary.totalLateFee)}`} />
            <StatCard tone="amber" label="Borçlu bağımsız bölüm" value={data.summary.debtorUnits} />
            <StatCard label={f.status === 'overdue' ? 'Vadesi geçmiş satır' : 'Açık borç satırı'} value={data.summary.lines} />
          </div>
          <section className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input className="field pl-9" placeholder="Muhatap, blok veya kapı ara..." value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={!rows.length}
                onClick={() =>
                  downloadCsv('borclu_takip.csv', [
                    ['Site', 'Daire', 'Muhatap', 'Telefon', 'Açık borç', 'Gecikme tazminatı', 'En eski vade', 'Gecikme (gün)'],
                    ...rows.map((r) => [r.site, r.label, r.debtor, r.phone, amount(r.open), amount(r.lateFee), date(r.oldestDue), r.overdueDays]),
                  ])
                }
              >
                <Download className="size-3.5" /> CSV indir
              </Button>
            </div>
            {rows.length === 0 ? (
              <Empty>Seçili filtrelere göre açık borç bulunamadı.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Daire</th>
                    <th>Muhatap</th>
                    <th>En eski vade</th>
                    <th className="!text-right">Açık borç</th>
                    <th className="!text-right">Gecikme tazm.</th>
                    <th className="!text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.unitId}>
                      <td className="font-medium">
                        <Link href={`/panel/daireler/${r.unitId}`} className="hover:underline">
                          {r.label}
                        </Link>
                      </td>
                      <td>
                        {r.debtor ?? <span className="text-slate-400">Muhatap yok</span>}
                        <div className="text-xs text-slate-500">{phone(r.phone)}</div>
                      </td>
                      <td>
                        {date(r.oldestDue)}
                        {r.overdueDays > 0 && <div className="text-xs text-rose-600">{r.overdueDays} gün gecikme</div>}
                      </td>
                      <td className="text-right tabular-nums">{money(r.open)}</td>
                      <td className="text-right tabular-nums text-amber-700">{money(r.lateFee)}</td>
                      <td className="text-right font-semibold tabular-nums text-rose-600">{money(toNum(r.open) + toNum(r.lateFee))}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </section>
        </>
      )}
    </>
  );
}
