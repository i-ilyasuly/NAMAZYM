"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { format, subDays } from "date-fns"
import { kk } from "date-fns/locale"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart"

interface PrayerAreaChartProps {
  data: {
    prayer: string
    prayed: number
    missed: number
    congregation: number
    delayed: number
    menstruation?: number
  }[]
  activeStatus: string
  gender?: string
}

export function PrayerAreaChart({ data, activeStatus, gender }: PrayerAreaChartProps) {
  const { t } = useTranslation()

  // Process data to translate prayer names
  const processedData = data.map(item => {
    return {
      ...item,
      translatedPrayer: t(item.prayer, { defaultValue: item.prayer }),
    }
  })

  // Define chart configuration based on gender and active status
  const chartConfig = {
    prayed: {
      label: t("status_prayed"),
      color: gender === "female" ? "#10b981" : "#3b82f6",
    },
    congregation: {
      label: t("status_congregation"),
      color: "#10b981",
    },
    delayed: {
      label: t("status_delayed"),
      color: "#f43f5e",
    },
    missed: {
      label: t("status_missed"),
      color: "#18181b",
    },
    ...(gender === "female" ? {
      menstruation: {
        label: t("status_menstruation"),
        color: "#ec4899",
      }
    } : {})
  } satisfies ChartConfig

  return (
    <div className="w-full bg-transparent">
      <div className="pb-0">
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={processedData}
            margin={{
              left: 12,
              right: 12,
              top: 20,
              bottom: 20
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="translatedPrayer"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            
            {/* Render areas based on activeStatus */}
            {(activeStatus === "all" || activeStatus === "prayed") && (
              <Area
                dataKey="prayed"
                type="natural"
                fill="var(--color-prayed)"
                fillOpacity={0.4}
                stroke="var(--color-prayed)"
                stackId="a"
              />
            )}
            
            {gender === "male" && (activeStatus === "all" || activeStatus === "congregation") && (
              <Area
                dataKey="congregation"
                type="natural"
                fill="var(--color-congregation)"
                fillOpacity={0.4}
                stroke="var(--color-congregation)"
                stackId="a"
              />
            )}
            
            {(activeStatus === "all" || activeStatus === "delayed") && (
              <Area
                dataKey="delayed"
                type="natural"
                fill="var(--color-delayed)"
                fillOpacity={0.4}
                stroke="var(--color-delayed)"
                stackId="a"
              />
            )}
            
            {gender === "female" && (activeStatus === "all" || activeStatus === "menstruation") && (
              <Area
                dataKey="menstruation"
                type="natural"
                fill="var(--color-menstruation)"
                fillOpacity={0.4}
                stroke="var(--color-menstruation)"
                stackId="a"
              />
            )}
            
            {(activeStatus === "all" || activeStatus === "missed") && (
              <Area
                dataKey="missed"
                type="natural"
                fill="var(--color-missed)"
                fillOpacity={0.4}
                stroke="var(--color-missed)"
                stackId="a"
              />
            )}
            
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}
