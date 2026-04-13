"use client"

import { TrendingUp, Sunrise, Sun, CloudSun, Sunset, Moon, Clock } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { useTranslation } from "react-i18next"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart"

interface PrayerLineChartProps {
  data: {
    prayer: string
    prayed: number
    missed: number
    congregation: number
    delayed: number
  }[]
  activeStatus?: string
  gender?: string
}

export function PrayerLineChart({ data, activeStatus = "all", gender }: PrayerLineChartProps) {
  const { t } = useTranslation()

  const chartConfig = {
    congregation: {
      label: t("status_congregation"),
      color: "#10b981",
    },
    prayed: {
      label: t("status_prayed"),
      color: gender === "female" ? "#10b981" : "#3b82f6",
    },
    delayed: {
      label: t("status_delayed"),
      color: "#ef4444",
    },
    missed: {
      label: t("status_missed"),
      color: "#000000",
    },
    menstruation: {
      label: t("status_menstruation"),
      color: "#ec4899",
    },
  } satisfies ChartConfig

  return (
    <Card className="border-none shadow-none bg-transparent ring-0">
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 20,
              right: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} className="stroke-muted-foreground/10" />
            <XAxis
              dataKey="prayer"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={({ x, y, payload, index }) => {
                const getIcon = () => {
                  switch(index) {
                    case 0: return <Sunrise className="w-5 h-5 text-amber-500" />;
                    case 1: return <Sun className="w-5 h-5 text-orange-500" />;
                    case 2: return <CloudSun className="w-5 h-5 text-amber-600" />;
                    case 3: return <Sunset className="w-5 h-5 text-indigo-400" />;
                    case 4: return <Moon className="w-5 h-5 text-slate-500" />;
                    default: return <Clock className="w-5 h-5" />;
                  }
                }

                return (
                  <g transform={`translate(${x - 10}, ${y + 10})`} style={{ pointerEvents: 'none' }}>
                    <foreignObject width="20" height="20">
                      <div className="flex items-center justify-center w-full h-full">
                        {getIcon()}
                      </div>
                    </foreignObject>
                  </g>
                )
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            
            {gender === "male" && (activeStatus === "all" || activeStatus === "congregation") && (
              <Line
                dataKey="congregation"
                type="monotone"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            )}
            {(activeStatus === "all" || activeStatus === "prayed") && (
              <Line
                dataKey="prayed"
                type="monotone"
                stroke={gender === "female" ? "#10b981" : "#3b82f6"}
                strokeWidth={2}
                dot={false}
              />
            )}
            {(activeStatus === "all" || activeStatus === "delayed") && (
              <Line
                dataKey="delayed"
                type="monotone"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            )}
            {(activeStatus === "all" || activeStatus === "missed") && (
              <Line
                dataKey="missed"
                type="monotone"
                stroke="#000000"
                strokeWidth={2}
                dot={false}
              />
            )}
            {(activeStatus === "all" || activeStatus === "menstruation") && gender === "female" && (
              <Line
                dataKey="menstruation"
                type="monotone"
                stroke="#ec4899"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
