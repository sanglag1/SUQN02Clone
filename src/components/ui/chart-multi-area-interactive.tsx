"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface DataPoint {
  date: string
  quiz: number
  test: number
  interview: number
}

interface Props {
  data?: DataPoint[]
  title?: string
  description?: string
  height?: number
  hideCard?: boolean
}

export function ChartMultiAreaInteractive({
  data = [],
  height = 300,
  hideCard = false,
}: Props) {
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    const normalized = data.map((d) => ({
      date: d.date,
      quiz: Number(d.quiz) || 0,
      test: Number(d.test) || 0,
      interview: Number(d.interview) || 0,
    }))
    // If there is only one data point, duplicate it so the area has width
    if (normalized.length === 1) {
      const single = normalized[0]
      return [
        { ...single },
        { ...single },
      ]
    }
    return normalized
  }, [data])

  const ChartBody = (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={processedData} margin={{ top: 16, right: 10, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="fillQuiz" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillTest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillInterview" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
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
              if (typeof value === "string") {
                if (value.includes("-")) {
                  const date = new Date(value)
                  if (!isNaN(date.getTime())) {
                    const formatted = date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                    return formatted
                  }
                }
                return value.length > 3 ? value.substring(0, 3) : value
              }
              return value as unknown as string
            }}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.toLocaleString()} />
          <Tooltip
            cursor={false}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <p className="font-medium mb-2">
                      {typeof label === 'string' && label.includes('-')
                        ? (() => {
                            const date = new Date(label)
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            }
                            return label
                          })()
                        : label}
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
          <Area type="monotone" dataKey="quiz" fill="url(#fillQuiz)" stroke="#3b82f6" strokeWidth={2} name="Quiz" fillOpacity={0.6} connectNulls={true} />
          <Area type="monotone" dataKey="test" fill="url(#fillTest)" stroke="#8b5cf6" strokeWidth={2} name="Assessment" fillOpacity={0.6} connectNulls={true} />
          <Area type="monotone" dataKey="interview" fill="url(#fillInterview)" stroke="#10b981" strokeWidth={2} name="Interview" fillOpacity={0.6} connectNulls={true} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-1">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div><span className="text-sm font-medium text-gray-700">Quiz</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-purple-500 rounded"></div><span className="text-sm font-medium text-gray-700">Assessment</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-500 rounded"></div><span className="text-sm font-medium text-gray-700">Interview</span></div>
      </div>
    </div>
  )

  if (hideCard) {
    return (
      <>{ChartBody}</>
    )
  }

  return ChartBody
}


