"use client"

import * as React from "react"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"

type LineMode = "score" | "total"

interface LegacyPoint {
  period: string
  quiz: number
  test: number
  interview: number
}

interface ChartAreaProgressAdapterProps {
  data: LegacyPoint[]
  lineMode: LineMode
  height?: number
  title?: string
  description?: string
}

export function ChartAreaProgressAdapter({
  data,
  lineMode,
  height = 288,
  title = "",
  description = ""
}: ChartAreaProgressAdapterProps) {
  const mapped = React.useMemo(
    () =>
      (data || []).map((d) => ({
        date: d.period,
        // Map quiz to primary area
        revenue: Number(d.quiz) || 0,
        // Combine test + interview so we retain both signals in the secondary area
        transactions:
          lineMode === "score"
            ? Math.round((((Number(d.test) || 0) + (Number(d.interview) || 0)) / 2) * 10) / 10
            : (Number(d.test) || 0) + (Number(d.interview) || 0),
      })),
    [data, lineMode]
  )

  return (
    <ChartAreaInteractive
      data={mapped}
      title={title}
      description={description}
      height={height}
      hideCard={true}
    />
  )
}


