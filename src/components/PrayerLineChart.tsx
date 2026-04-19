"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { getPrayerTimeIcon, PRAYER_STATUS_ICONS } from "../lib/prayerIcons";

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
    ...(gender === "male" ? {
      congregation: {
        label: t("status_congregation"),
        color: "#10b981",
        icon: PRAYER_STATUS_ICONS.congregation,
      }
    } : {}),
    prayed: {
      label: t("status_prayed"),
      color: gender === "female" ? "#10b981" : "#3b82f6",
      icon: PRAYER_STATUS_ICONS.prayed,
    },
    delayed: {
      label: t("status_delayed"),
      color: "#ef4444",
      icon: PRAYER_STATUS_ICONS.delayed,
    },
    missed: {
      label: t("status_missed"),
      color: "#000000",
      icon: PRAYER_STATUS_ICONS.missed,
    },
    ...(gender === "female" ? {
      menstruation: {
        label: t("status_menstruation"),
        color: "#ec4899",
        icon: PRAYER_STATUS_ICONS.menstruation,
      }
    } : {}),
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
                const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
                return (
                  <g transform={`translate(${x - 10}, ${y + 10})`} style={{ pointerEvents: 'none' }}>
                    <foreignObject width="20" height="20">
                      <div className="flex items-center justify-center w-full h-full">
                        {getPrayerTimeIcon(prayers[index] ?? 'default')}
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

        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {Object.entries(chartConfig).map(([key, config]) => {
            if (key === 'value') return null;
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {Icon && <Icon className="h-5 w-5" style={{ color: config.color }} />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  )
}
