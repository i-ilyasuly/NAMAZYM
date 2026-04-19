"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { getPrayerTimeIcon } from "../lib/prayerIcons";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart"

interface PrayerBarChartProps {
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

export function PrayerBarChart({ data, activeStatus = "all", gender }: PrayerBarChartProps) {
  const { t } = useTranslation()

  // For Bar Chart, we'll show the count based on activeStatus
  const processedData = data.map(item => {
    let value = 0;
    if (activeStatus === "all") {
      value = item.prayed + item.congregation;
    } else if (activeStatus === "menstruation") {
      value = (item as any).menstruation || 0;
    } else {
      value = item[activeStatus as keyof typeof item] as number;
    }
    return {
      prayer: item.prayer,
      total: value
    };
  })

  const chartConfig = {
    total: {
      label: activeStatus === "all" 
        ? t("total_performed", { defaultValue: "Орындалғаны" })
        : t(`status_${activeStatus}`),
      color: activeStatus === "missed" ? "#000000" : 
             activeStatus === "delayed" ? "#ef4444" :
             activeStatus === "menstruation" ? "#ec4899" :
             activeStatus === "congregation" ? "#10b981" : 
             (gender === "female" ? "#10b981" : "#3b82f6"),
    },
  } satisfies ChartConfig

  return (
    <div className="w-full bg-transparent">
      <div className="pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={processedData}
            margin={{
              top: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} className="stroke-muted-foreground/10" />
            <XAxis
              dataKey="prayer"
              tickLine={false}
              tickMargin={12}
              axisLine={false}
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar 
              dataKey="total" 
              fill={chartConfig.total.color} 
              radius={8}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground font-bold"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
