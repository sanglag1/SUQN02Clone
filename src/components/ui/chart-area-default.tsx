"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"



export const description = "A simple area chart"

interface ChartData {
  month: string;
  revenue: number;
}

interface ChartAreaDefaultProps {
  data: ChartData[];
  title?: string;
  description?: string;
  showFooter?: boolean;
}

export function ChartAreaDefault({ 
  data, 
  title = "Area Chart", 
  description = "Showing revenue trend",
  showFooter = true 
}: ChartAreaDefaultProps) {
  // Calculate total revenue for footer
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              console.log('Month value received:', value); // Debug log
              // Convert Vietnamese month format "thg 8 2025" to short English format
              if (value.includes('thg')) {
                const monthMap: { [key: string]: string } = {
                  '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr',
                  '5': 'May', '6': 'Jun', '7': 'Jul', '8': 'Aug',
                  '9': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
                };
                // Extract month number from "thg 8 2025" format
                const parts = value.split(' ');
                const monthNumber = parts[1]; // Get the month number
                const result = monthMap[monthNumber] || monthNumber;
                console.log('Converted from', monthNumber, 'to', result); // Debug log
                return result;
              }
              // If not Vietnamese format, try to extract month number and convert
              if (value.includes('/')) {
                const monthMap: { [key: string]: string } = {
                  '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr',
                  '5': 'May', '6': 'Jun', '7': 'Jul', '8': 'Aug',
                  '9': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
                };
                const monthPart = value.split('/')[0];
                const result = monthMap[monthPart] || monthPart;
                console.log('Converted from', monthPart, 'to', result); // Debug log
                return result;
              }
              console.log('No conversion applied, returning:', value); // Debug log
              return value;
            }}
            height={40}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatCurrency(value)}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            labelFormatter={(label) => `Month: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Area
            dataKey="revenue"
            type="monotone"
            fill="#3b82f6"
            fillOpacity={0.4}
            stroke="#2563eb"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      {showFooter && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 leading-none font-medium text-gray-900">
                Total Revenue: {formatCurrency(totalRevenue)} <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-gray-500 flex items-center gap-2 leading-none">
                Average: {formatCurrency(avgRevenue)} per month
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
