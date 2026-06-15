'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Oca', consumption: 320 },
  { month: 'Şub', consumption: 310 },
  { month: 'Mar', consumption: 340 },
  { month: 'Nis', consumption: 380 },
  { month: 'May', consumption: 410 },
  { month: 'Haz', consumption: 460 },
];

export function MeterChartWidget() {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -15,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorMeter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
            tickFormatter={(value) => `${value}m³`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
            }}
            formatter={(value: any) => [`${value} m³`, 'Su Tüketimi']}
          />
          <Area
            type="monotone"
            dataKey="consumption"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMeter)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
