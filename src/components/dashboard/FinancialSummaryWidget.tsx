'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { mockMonthlyFinance } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';

export function FinancialSummaryWidget() {
  // Take last 6 months for summary
  const data = mockMonthlyFinance.slice(-6);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `₺${(value / 1000).toFixed(0)}k`;
    }
    return `₺${value}`;
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -10,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1}/>
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
          <Bar 
            name="revenue" 
            dataKey="revenue" 
            fill="url(#colorRevenue)" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            name="expense" 
            dataKey="expense" 
            fill="url(#colorExpense)" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
