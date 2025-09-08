'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface RevenueChartData {
  month: string;
  revenue: number;
  transactions: number;
  averageOrderValue: number;
}

interface RevenueChartProps {
  data: RevenueChartData[];
  type?: 'line' | 'bar';
  title?: string;
  height?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  type = 'line', 
  title = 'Revenue Overview',
  height = 300 
}) => {
  // Format month for display (YYYY-MM to MMM YYYY)
  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Format currency for Vietnamese Dong
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const chartData = data.map(item => ({
    ...item,
    displayMonth: formatMonth(item.month)
  }));

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.dataKey === 'revenue' && `Revenue: ${formatCurrency(entry.value)}`}
                {entry.dataKey === 'transactions' && `Transactions: ${entry.value}`}
                {entry.dataKey === 'averageOrderValue' && `Avg Order: ${formatCurrency(entry.value)}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayMonth" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                name="Revenue"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="transactions"
                stroke="#059669"
                strokeWidth={2}
                name="Transactions"
                dot={{ r: 3 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayMonth" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="revenue" 
                fill="#2563eb" 
                name="Revenue"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
