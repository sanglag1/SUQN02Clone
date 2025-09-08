"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const description = "A radar chart with lines only"

interface ChartData {
  month: string;
  desktop: number;
  mobile: number;
}

interface ChartRadarLinesOnlyProps {
  data?: ChartData[];
  title?: string;
  description?: string;
  showTargets?: boolean;
  hideCard?: boolean;
}

const defaultChartData: ChartData[] = [
  { month: "January", desktop: 186, mobile: 160 },
  { month: "February", desktop: 185, mobile: 170 },
  { month: "March", desktop: 207, mobile: 180 },
  { month: "April", desktop: 173, mobile: 160 },
  { month: "May", desktop: 160, mobile: 190 },
  { month: "June", desktop: 174, mobile: 204 },
]

export function ChartRadarLinesOnly({ 
  data = defaultChartData, 
  title = "Radar Chart - Lines Only",
  description = "Showing total visitors for the last 6 months",
  showTargets = false,
  hideCard = false
}: ChartRadarLinesOnlyProps) {
  const chartData = data || defaultChartData;
  
  if (hideCard) {
    return (
      <div className="w-full">
        <div className="w-full h-80 flex flex-col items-center">
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} margin={{ top: 10, right: 25, bottom: 35, left: 25 }}>
                <Tooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="font-medium">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name || 'Unknown'}: {entry.value}
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <PolarAngleAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#374151' }}
                  tickFormatter={(value) => {
                    // Optimized text shortening for better fit
                    if (value === 'Total Activities') return 'Total Activities';
                    if (value === 'Average Score') return 'Avg Score';
                    if (value === 'Study Time') return 'Study Time';
                    if (value === 'Completion Rate') return 'Completion';
                    if (value === 'Learning Frequency') return 'Frequency';
                    
                    // Fallback for other cases
                    if (value.length > 10) {
                      return value.substring(0, 8) + '...';
                    }
                    return value;
                  }}
                />
                <PolarGrid radialLines={false} />
                <Radar
                  dataKey="desktop"
                  fill="#3b82f6"
                  fillOpacity={0}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={showTargets ? "Current" : "Desktop"}
                />
                <Radar
                  dataKey="mobile"
                  fill="#8b5cf6"
                  fillOpacity={0}
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name={showTargets ? "Target" : "Mobile"}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend for Current vs Target - Always show when showTargets is true */}
          {showTargets && (
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Target</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="w-full">
          <div className="w-full h-80 flex flex-col items-center">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} margin={{ top: 10, right: 25, bottom: 35, left: 25 }}>
                  <Tooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <p className="font-medium">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name || 'Unknown'}: {entry.value}
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <PolarAngleAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#374151' }}
                    tickFormatter={(value) => {
                      // Optimized text shortening for better fit
                      if (value === 'Total Activities') return 'Total Activities';
                      if (value === 'Average Score') return 'Avg Score';
                      if (value === 'Study Time') return 'Study Time';
                      if (value === 'Completion Rate') return 'Completion';
                      if (value === 'Learning Frequency') return 'Frequency';
                      
                      // Fallback for other cases
                      if (value.length > 10) {
                        return value.substring(0, 8) + '...';
                      }
                      return value;
                    }}
                  />
                  <PolarGrid radialLines={false} />
                  <Radar
                    dataKey="desktop"
                    fill="#3b82f6"
                    fillOpacity={0}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name={showTargets ? "Current" : "Desktop"}
                  />
                  <Radar
                    dataKey="mobile"
                    fill="#8b5cf6"
                    fillOpacity={0}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name={showTargets ? "Target" : "Mobile"}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend for Current vs Target - Always show when showTargets is true */}
            {showTargets && (
              <div className="flex items-center justify-center gap-6 mt-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Target</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      {!showTargets && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground flex items-center gap-2 leading-none">
            January - June 2024
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
