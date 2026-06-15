'use client';

import React from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { FinancialSummaryWidget } from '@/components/dashboard/FinancialSummaryWidget';
import { RecentInvoicesWidget } from '@/components/dashboard/RecentInvoicesWidget';
import { TaskListWidget } from '@/components/dashboard/TaskListWidget';
import { AnnouncementsWidget } from '@/components/dashboard/AnnouncementsWidget';
import { OccupancyWidget } from '@/components/dashboard/OccupancyWidget';
import { MeterChartWidget } from '@/components/dashboard/MeterChartWidget';
import { mockDashboardStats } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  AlertTriangle 
} from 'lucide-react';

export default function DashboardPage() {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Kontrol Paneli
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Yıldız Konakları Sitesi — Yönetim Özeti
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Gelir"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Bu yılki toplam aidat ve diğer gelirler"
          icon={TrendingUp}
          trend="up"
          trendValue="%12.5 artış"
          color="green"
        />
        <StatCard
          title="Toplam Gider"
          value={formatCurrency(stats.totalExpenses)}
          subtitle="Bu yılki toplam fatura ve bakım giderleri"
          icon={TrendingDown}
          trend="down"
          trendValue="%4.2 düşüş"
          color="red"
        />
        <StatCard
          title="Tahsilat Oranı"
          value={`%${stats.collectionRate}`}
          subtitle="Faturaların ödenme oranı"
          icon={Percent}
          trend="up"
          trendValue="%3.1 artış"
          color="blue"
        />
        <StatCard
          title="Gecikmiş Faturalar"
          value={stats.overdueInvoices}
          subtitle="Ödeme tarihi geçmiş fatura sayısı"
          icon={AlertTriangle}
          trend="up"
          trendValue="+2 yeni"
          color="amber"
        />
      </div>

      {/* Widgets Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Financial Summary */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Finansal Özet</h3>
          <FinancialSummaryWidget />
        </div>

        {/* Occupancy Donut */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Doluluk Oranı</h3>
          <OccupancyWidget />
        </div>

        {/* Recent Invoices */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Son Faturalar</h3>
          <RecentInvoicesWidget />
        </div>

        {/* Active Tasks */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Açık Görevler</h3>
          <TaskListWidget />
        </div>

        {/* Announcements */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Son Duyurular</h3>
          <AnnouncementsWidget />
        </div>

        {/* Meter readings line chart */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Sayaç Okumaları - Su Tüketimi</h3>
          <MeterChartWidget />
        </div>
      </div>
    </div>
  );
}
