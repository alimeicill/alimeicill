'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { mockUnits } from '@/lib/mock-data';

export function OccupancyWidget() {
  const stats = mockUnits.reduce(
    (acc, unit) => {
      acc[unit.status] = (acc[unit.status] || 0) + 1;
      return acc;
    },
    { occupied: 0, vacant: 0, maintenance: 0 }
  );

  const data = [
    { name: 'Dolu', value: stats.occupied, color: '#10b981' }, // emerald-500
    { name: 'Boş', value: stats.vacant, color: '#64748b' }, // slate-500
    { name: 'Bakım', value: stats.maintenance, color: '#f59e0b' }, // amber-500
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const occupancyRate = total > 0 ? ((stats.occupied / total) * 100).toFixed(0) : 0;

  return (
    <div className="relative flex h-80 w-full flex-col justify-between">
      <div className="relative flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
              }}
              formatter={(value: any) => [`${value} Daire`, '']}
            />
            <Pie
              data={data}
              cx="55%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={8}
              formatter={(value, entry: any) => (
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {value}: {entry.payload.value} ({((entry.payload.value / total) * 100).toFixed(0)}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute left-[36%] top-[50%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            %{occupancyRate}
          </span>
          <span className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            Doluluk
          </span>
        </div>
      </div>
    </div>
  );
}
