'use client';

import { Printer } from 'lucide-react';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button, Card, Empty, Field, Loading, PageHeader, StatCard, Table } from '@/components/ui';
import { useApi } from '@/lib/api';
import { money, toNum } from '@/lib/format';
import type { Site } from '@/lib/types';

interface Report {
  site: Site;
  year: number;
  charged: string;
  collected: string;
  collectionRate: string;
  totalIncome: string;
  totalExpense: string;
  incomeByItem: { name: string; total: string }[];
  expenseByItem: { name: string; total: string }[];
  chargesByItem: { name: string; total: string }[];
  openBalance: string;
}

const COLORS = ['#1d43b8', '#f59e0b', '#0ea5e9', '#10b981', '#e11d48', '#8b5cf6', '#64748b'];

export default function ReportsPage() {
  const { data: sites } = useApi<Site[]>('/sites');
  const [siteId, setSiteId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const sid = siteId || sites?.[0]?.id || '';
  const { data, isLoading } = useApi<Report>(sid ? `/reports/site/${sid}?year=${year}` : null);

  return (
    <>
      <PageHeader
        title="Raporlar"
        description="Site finans özeti: borçlandırma, tahsilat oranı, gelir ve gider dağılımı."
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" /> Yazdır
          </Button>
        }
      />
      <div className="no-print card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_160px]">
        <Field label="Site">
          <select className="field" value={sid} onChange={(e) => setSiteId(e.target.value)}>
            {sites?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Yıl">
          <select className="field" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[0, 1, 2, 3].map((i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </Field>
      </div>
      {sites?.length === 0 ? (
        <Empty>Önce bir site oluşturun.</Empty>
      ) : isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <h2 className="mb-3 text-lg font-semibold">
            {data.site.name} — {data.year}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard tone="blue" label="Borçlandırılan" value={money(data.charged)} />
            <StatCard tone="green" label="Tahsil edilen" value={money(data.collected)} sub={`Tahsilat oranı %${toNum(data.collectionRate).toLocaleString('tr-TR')}`} />
            <StatCard tone="amber" label="Toplam gider" value={money(data.totalExpense)} />
            <StatCard tone="rose" label="Güncel açık bakiye" value={money(data.openBalance)} sub="Tüm dönemler" />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Breakdown title="Gider dağılımı" rows={data.expenseByItem} />
            <Breakdown title="Gelir dağılımı" rows={data.incomeByItem} />
          </div>
          <Card className="mt-5" title="Borçlandırma kalemleri">
            <ItemTable rows={data.chargesByItem} />
          </Card>
          <Card className="mt-5" title="Net nakit etkisi">
            <div className="text-2xl font-semibold tabular-nums">{money(toNum(data.totalIncome) - toNum(data.totalExpense))}</div>
            <p className="text-sm text-slate-500">
              Gelir {money(data.totalIncome)} − gider {money(data.totalExpense)} (virmanlar hariç)
            </p>
          </Card>
        </>
      )}
    </>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { name: string; total: string }[] }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Kayıt yok.</p>
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
          <div className="h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={rows.map((r) => ({ name: r.name, value: toNum(r.total) }))} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {rows.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ItemTable rows={rows} colors />
        </div>
      )}
    </Card>
  );
}

function ItemTable({ rows, colors }: { rows: { name: string; total: string }[]; colors?: boolean }) {
  const total = rows.reduce((a, r) => a + toNum(r.total), 0);
  if (!rows.length) return <p className="text-sm text-slate-500">Kayıt yok.</p>;
  return (
    <Table>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.name}>
            <td>
              {colors && <span className="mr-2 inline-block size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />}
              {r.name}
            </td>
            <td className="text-right tabular-nums">{money(r.total)}</td>
            <td className="w-16 text-right text-xs text-slate-500">%{total ? Math.round((toNum(r.total) / total) * 100) : 0}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
