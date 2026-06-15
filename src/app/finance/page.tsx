'use client';

import React from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/StatCard';
import { mockDashboardStats, mockMonthlyFinance } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  AlertCircle,
  FileText,
  CreditCard
} from 'lucide-react';

export default function FinancePage() {
  const stats = mockDashboardStats;

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `₺${(value / 1000).toFixed(0)}k`;
    }
    return `₺${value}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Finansal Yönetim
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Gelir, gider, aidat tahsilatları ve borç durumları
          </p>
        </div>

        {/* Action Quick Links */}
        <div className="flex items-center space-x-3">
          <Link
            href="/finance/invoices"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200"
          >
            <FileText className="mr-2 h-4 w-4" />
            Faturalar
          </Link>
          <Link
            href="/finance/payments"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors duration-200"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Ödemeler
          </Link>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Gelir (Yıllık)"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Tüm toplanan aidat ve ek ödemeler"
          icon={TrendingUp}
          trend="up"
          trendValue="%8.4 artış"
          color="green"
        />
        <StatCard
          title="Toplam Gider (Yıllık)"
          value={formatCurrency(stats.totalExpenses)}
          subtitle="Fatura, personel ve bakım giderleri"
          icon={TrendingDown}
          trend="down"
          trendValue="%2.1 düşüş"
          color="red"
        />
        <StatCard
          title="Tahsilat Oranı"
          value={`%${stats.collectionRate}`}
          subtitle="Dönem faturalarının ödenme yüzdesi"
          icon={Percent}
          trend="up"
          trendValue="%1.5 artış"
          color="blue"
        />
        <StatCard
          title="Toplam Borç"
          value={formatCurrency(87500)} // Mocked remaining outstanding
          subtitle="Sakinlerin toplam ödenmemiş borcu"
          icon={AlertCircle}
          trend="up"
          trendValue="+12 daire"
          color="amber"
        />
      </div>

      {/* Annual Finance Trend Chart */}
      <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Yıllık Finansal Trend</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Gelir ve giderlerin aylık bazda karşılaştırılması</p>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={mockMonthlyFinance}
              margin={{
                top: 10,
                right: 10,
                left: -15,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--text-tertiary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--text-tertiary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                }}
                formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {value === 'revenue' ? 'Gelir' : 'Gider'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                name="revenue"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                name="expense"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
