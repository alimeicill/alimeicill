import React from 'react';
import { StatItem } from '@/types/dashboard';
import { formatCurrency } from '@/lib/utils';
import { 
  Building, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  AlertTriangle, 
  Wallet,
  TrendingUp
} from 'lucide-react';

interface StatCardsProps {
  stats: {
    totalProperties: number;
    occupancyRate: number;
    collectionRate: number;
    totalCollected: number;
    totalOutstanding: number;
    debtorCount: number;
    overdueAmount: number;
    netCash: number;
  };
}

export function StatCards({ stats }: StatCardsProps) {
  const statItems: StatItem[] = [
    {
      id: 'kpi-1',
      title: 'Toplam Taşınmaz',
      value: `${stats.totalProperties} Daire`,
      subtitle: `Doluluk Oranı: %${stats.occupancyRate}`,
      progress: stats.occupancyRate,
      color: 'blue'
    },
    {
      id: 'kpi-2',
      title: 'Genel Tahsilat Durumu',
      value: formatCurrency(stats.totalCollected),
      subtitle: `Ödeme Oranı: %${stats.collectionRate}`,
      progress: stats.collectionRate,
      color: 'green'
    },
    {
      id: 'kpi-3',
      title: 'Kalan Üye Borcu',
      value: formatCurrency(stats.overdueAmount),
      subtitle: `${stats.debtorCount} üyenin gecikmiş borcu`,
      color: 'red'
    },
    {
      id: 'kpi-4',
      title: 'Kasa / Banka Bakiyesi',
      value: formatCurrency(stats.netCash),
      subtitle: 'Aktif net nakit varlığı',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'green':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
          progressBg: 'bg-emerald-500'
        };
      case 'red':
        return {
          iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400',
          progressBg: 'bg-rose-500'
        };
      case 'blue':
        return {
          iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400',
          progressBg: 'bg-sky-500'
        };
      case 'indigo':
      default:
        return {
          iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400',
          progressBg: 'bg-indigo-500'
        };
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'kpi-1':
        return Building;
      case 'kpi-2':
        return TrendingUp;
      case 'kpi-3':
        return AlertTriangle;
      case 'kpi-4':
      default:
        return Wallet;
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const colors = getColorClasses(item.color);
        const Icon = getIcon(item.id);

        return (
          <div 
            key={item.id}
            className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {item.title}
              </span>
              <span className={`p-2.5 rounded-xl ${colors.iconBg}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
            </div>

            <div className="mt-2.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                {item.value}
              </span>
              <span className="block text-slate-400 dark:text-slate-500 text-[10px] mt-1 font-medium">
                {item.subtitle}
              </span>
            </div>

            {item.progress !== undefined && (
              <div className="mt-4">
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colors.progressBg} rounded-full`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
