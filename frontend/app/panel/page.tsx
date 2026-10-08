'use client';

import { AlertTriangle, Building2, Home, Landmark, Users, Wallet, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, Loading, PageHeader, StatCard } from '@/components/ui';
import { useApi } from '@/lib/api';
import { MONTHS, date, money, toNum } from '@/lib/format';
import { SOURCE_LABEL, type CashTx, type Dec } from '@/lib/types';

interface Dashboard {
  counts: { sites: number; units: number; people: number; openTickets: number };
  openDebt: Dec;
  overdueDebt: Dec;
  cash: Dec;
  months: { key: string; income: Dec; expense: Dec }[];
  recent: CashTx[];
}

export default function DashboardPage() {
  const { data, isLoading } = useApi<Dashboard>('/dashboard');
  if (isLoading || !data) return <Loading />;

  if (data.counts.sites === 0) {
    return (
      <div className="flex justify-center pt-10">
        <div className="card relative w-full max-w-xl overflow-hidden p-8">
          <div className="absolute inset-x-6 top-0 h-1 rounded-b bg-gradient-to-r from-brand-700 to-accent-400" />
          <div className="text-[11px] font-bold uppercase tracking-widest text-brand-600">Yönetim kurulumu</div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">İlk siteni kur</h1>
          <p className="mt-2 text-sm text-slate-500">Site, blok ve daire bilgilerini ekleyerek yönetim panelini kullanmaya başlayın.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Site bilgileri', 'Blok ve daireler', 'Sakinler'].map((s) => (
              <span key={s} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                • {s}
              </span>
            ))}
          </div>
          <Link
            href="/panel/siteler?yeni=1"
            className="mt-6 inline-flex rounded-lg bg-gradient-to-r from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow"
          >
            Kurulum sihirbazı
          </Link>
        </div>
      </div>
    );
  }

  const chart = data.months.map((m) => ({
    name: MONTHS[Number(m.key.slice(5)) - 1].slice(0, 3),
    Gelir: toNum(m.income),
    Gider: toNum(m.expense),
  }));

  return (
    <>
      <PageHeader title="Pano" description="Firmanızdaki tüm sitelerin özet görünümü." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="blue" label="Kasa + banka" value={money(data.cash)} icon={<Landmark className="size-5" />} sub="Tüm ödeme hesapları" />
        <StatCard tone="amber" label="Açık borç" value={money(data.openDebt)} icon={<Wallet className="size-5" />} sub="Vadesi gelmemiş dahil" />
        <StatCard tone="rose" label="Vadesi geçmiş" value={money(data.overdueDebt)} icon={<AlertTriangle className="size-5" />} sub={<Link href="/panel/borclu-takip" className="text-brand-600 hover:underline">Borçlu takibe git</Link>} />
        <StatCard tone="green" label="Açık talep" value={data.counts.openTickets} icon={<Wrench className="size-5" />} sub={<Link href="/panel/talepler" className="text-brand-600 hover:underline">Talepleri gör</Link>} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Site" value={data.counts.sites} icon={<Building2 className="size-5" />} />
        <StatCard label="Bağımsız bölüm" value={data.counts.units} icon={<Home className="size-5" />} />
        <StatCard label="Kişi" value={data.counts.people} icon={<Users className="size-5" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="Son 6 ay gelir / gider" subtitle="Virmanlar hariç kasa ve banka hareketleri">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={chart} margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}B`} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend iconType="circle" />
                <Bar dataKey="Gelir" fill="#1d43b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gider" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="xl:col-span-2" title="Son finans hareketleri" actions={<Link href="/panel/finans-kayitlari" className="text-sm text-brand-600 hover:underline">Tümü</Link>}>
          {data.recent.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz kayıt yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{t.description || t.financeItem?.name || SOURCE_LABEL[t.source]}</div>
                    <div className="text-xs text-slate-500">
                      {date(t.date)} · {t.paymentAccount?.name}
                    </div>
                  </div>
                  <span className={t.direction === 'IN' ? 'font-semibold text-emerald-600 tabular-nums' : 'font-semibold text-rose-600 tabular-nums'}>
                    {t.direction === 'IN' ? '+' : '−'}
                    {money(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
