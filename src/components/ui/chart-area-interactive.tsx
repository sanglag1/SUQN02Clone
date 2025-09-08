"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const description = "An interactive area chart"

interface ChartData {
  date: string;
  revenue: number;
  transactions: number;
}

interface ChartAreaInteractiveProps {
  data?: ChartData[];
  title?: string;
  description?: string;
  height?: number;
  hideCard?: boolean;
}

export function ChartAreaInteractive({ 
  data = [], 
  title = "Area Chart - Interactive",
  description = "Showing total visitors for the last 3 months",
  height = 300,
  hideCard = false 
}: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("90d")

  // Process data to ensure proper chart display
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    
    // Ensure we have at least 2 data points for proper area chart display
    if (data.length === 1) {
      // If only one data point, duplicate it to show at least a small area
      const singleItem = data[0]
      return [
        { ...singleItem, date: singleItem.date, revenue: Number(singleItem.revenue) || 0, transactions: Number(singleItem.transactions) || 0 },
        { ...singleItem, date: singleItem.date, revenue: Number(singleItem.revenue) || 0, transactions: Number(singleItem.transactions) || 0 }
      ]
    }
    
    return data.map(item => ({
      ...item,
      date: item.date,
      revenue: Number(item.revenue) || 0,
      transactions: Number(item.transactions) || 0
    }))
    // Don't sort by date for revenue data since it's already ordered
  }, [data])

  const filteredData = React.useMemo(() => {
    if (processedData.length === 0) return processedData
    
    // For revenue data, we might not need time filtering since it's monthly data
    // Just return the processed data for now
    return processedData
  }, [processedData])


  if (hideCard) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row mb-4">
          <div className="grid flex-1 gap-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#3b82f6"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#3b82f6"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillTransactions" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
                             <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
               <XAxis
                 dataKey="date"
                 tickLine={false}
                 axisLine={false}
                 tickMargin={8}
                 minTickGap={32}
                                 tickFormatter={(value) => {
                  // Handle both date and month formats
                  if (typeof value === 'string') {
                    if (value.includes('-')) {
                      // Date format like "2025-08-25"
                      const date = new Date(value)
                      
                      if (!isNaN(date.getTime())) {
                        const formatted = date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                        
                        return formatted
                      }
                    } else {
                      // Month format like "January" or "Jan"
                      return value.length > 3 ? value.substring(0, 3) : value
                    }
                  }
                  return value
                }}
               />
               <YAxis 
                 yAxisId="left"
                 tickLine={false}
                 axisLine={false}
                 tickMargin={8}
                 tickFormatter={(value) => value.toLocaleString()}
                
               />
               <YAxis 
                 yAxisId="right"
                 orientation="right"
                 tickLine={false}
                 axisLine={false}
                 tickMargin={8}
                 tickFormatter={(value) => value.toLocaleString()}
               />
               <Tooltip
                 cursor={false}
                 content={({ active, payload, label }) => {
                   if (active && payload && payload.length) {
                     return (
                       <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                         <p className="font-medium mb-2">
                           {typeof label === 'string' && label.includes('-') 
                             ? (() => {
                                 const date = new Date(label);
                                 if (!isNaN(date.getTime())) {
                                   return date.toLocaleDateString("en-US", {
                                     month: "short",
                                     day: "numeric",
                                     year: "numeric"
                                   });
                                 }
                                 return label;
                               })()
                             : label
                           }
                         </p>
                         {payload.map((entry, index) => (
                           <p key={index} className="text-sm" style={{ color: entry.color }}>
                             {entry.name || 'Unknown'}: {entry.value?.toLocaleString()}
                           </p>
                         ))}
                       </div>
                     )
                   }
                   return null
                 }}
               />
               <Area
                 dataKey="transactions"
                 yAxisId="right"
                 type="monotone"
                 fill="url(#fillTransactions)"
                 stroke="#8b5cf6"
                 strokeWidth={2}
                 name="Transactions"
                 fillOpacity={0.8}
                 connectNulls={true}
                 isAnimationActive={true}
               />
                              <Area
                 dataKey="revenue"
                 yAxisId="left"
                 type="monotone"
                 fill="url(#fillRevenue)"
                 stroke="#3b82f6"
                 strokeWidth={2}
                 name="Revenue"
                 fillOpacity={0.8}
                 connectNulls={true}
                 isAnimationActive={true}
               />
             </AreaChart>
           </ResponsiveContainer>
         </div>
         
         {/* Legend */}
         <div className="flex items-center justify-center gap-6 mt-4">
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 bg-blue-500 rounded"></div>
             <span className="text-sm font-medium text-gray-700">Revenue</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 bg-purple-500 rounded"></div>
             <span className="text-sm font-medium text-gray-700">Transactions</span>
           </div>
         </div>
       </div>
     )
   }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#3b82f6"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#3b82f6"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillTransactions" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                                        tickFormatter={(value) => {
                          // Handle both date and month formats
                          if (typeof value === 'string') {
                            if (value.includes('-')) {
                              // Date format like "2025-08-25"
                              const date = new Date(value)
                              if (!isNaN(date.getTime())) {
                                const formatted = date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                                return formatted
                              }
                            } else {
                              // Month format like "January" or "Jan"
                              return value.length > 3 ? value.substring(0, 3) : value
                            }
                          }
                          return value
                        }}
              />
                             <YAxis 
                 yAxisId="left"
                 tickLine={false}
                 axisLine={false}
                 tickMargin={8}
                 tickFormatter={(value) => value.toLocaleString()}
                 label={{ value: 'Revenue (VND)', angle: -90, position: 'insideLeft' }}
               />
               <YAxis 
                 yAxisId="right"
                 orientation="right"
                 tickLine={false}
                 axisLine={false}
                 tickMargin={8}
                 tickFormatter={(value) => value.toLocaleString()}
                 label={{ value: 'Transactions', angle: 90, position: 'insideRight' }}
               />
              <Tooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                                        <p className="font-medium mb-2">
                                  {typeof label === 'string' && label.includes('-') 
                                    ? (() => {
                                        const date = new Date(label);
                                        if (!isNaN(date.getTime())) {
                                          const formatted = date.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric"
                                          });
                                          return formatted;
                                        }
                                        return label;
                                      })()
                                    : label
                                  }
                                </p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name || 'Unknown'}: {entry.value?.toLocaleString()}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
                             <Area
                 dataKey="transactions"
                 yAxisId="right"
                 type="monotone"
                 fill="url(#fillTransactions)"
                 stroke="#8b5cf6"
                 strokeWidth={2}
                 name="Transactions"
                 fillOpacity={0.6}
                 connectNulls={true}
               />
                              <Area
                 dataKey="revenue"
                 yAxisId="left"
                 type="monotone"
                 fill="url(#fillRevenue)"
                 stroke="#3b82f6"
                 strokeWidth={2}
                 name="Revenue"
                 fillOpacity={0.6}
                 connectNulls={true}
               />
             </AreaChart>
           </ResponsiveContainer>
           
           {/* Legend */}
           <div className="flex items-center justify-center gap-6 mt-4">
             <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-blue-500 rounded"></div>
               <span className="text-sm font-medium text-gray-700">Revenue</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-purple-500 rounded"></div>
               <span className="text-sm font-medium text-gray-700">Transactions</span>
             </div>
           </div>
         </div>
       </CardContent>
     </Card>
   )
 }
