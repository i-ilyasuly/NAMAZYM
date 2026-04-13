"use client"

import { Pie, PieChart, Label } from "recharts"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { User, Users2, Clock, Ban, Flower2 } from "lucide-react"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "./ui/chart"

interface PrayerDonutChartProps {
  data: {
    prayer: string
    prayed: number
    missed: number
    congregation: number
    delayed: number
    menstruation?: number
  }[]
  gender?: string
}

export function PrayerDonutChart({ data, gender }: PrayerDonutChartProps) {
  const { t } = useTranslation()

  // Calculate totals for each status across all prayers
  const totals = useMemo(() => {
    return data.reduce(
      (acc, curr) => {
        acc.prayed += curr.prayed
        acc.missed += curr.missed
        acc.congregation += curr.congregation
        acc.delayed += curr.delayed
        if (gender === "female") {
          acc.menstruation += (curr as any).menstruation || 0
        }
        return acc
      },
      { prayed: 0, missed: 0, congregation: 0, delayed: 0, menstruation: 0 }
    )
  }, [data, gender])

  const totalPrayers = useMemo(() => {
    return Object.values(totals).reduce((a, b) => a + b, 0)
  }, [totals])

  const chartData = [
    { status: "prayed", value: totals.prayed, fill: "var(--color-prayed)" },
    ...(gender === "male" ? [{ status: "congregation", value: totals.congregation, fill: "var(--color-congregation)" }] : []),
    { status: "delayed", value: totals.delayed, fill: "var(--color-delayed)" },
    ...(gender === "female" ? [{ status: "menstruation", value: totals.menstruation, fill: "var(--color-menstruation)" }] : []),
    { status: "missed", value: totals.missed, fill: "var(--color-missed)" },
  ].filter(item => item.value > 0) // Only show statuses that have at least 1 record

  const chartConfig = {
    value: {
      label: t("total_performed", { defaultValue: "Жалпы" }),
    },
    prayed: {
      label: <span><User className="h-5 w-5" style={{ color: gender === "female" ? "#10b981" : "#3b82f6" }} /></span>,
      color: gender === "female" ? "#10b981" : "#3b82f6",
      icon: () => null,
    },
    congregation: {
      label: <span><Users2 className="h-5 w-5" style={{ color: "#10b981" }} /></span>,
      color: "#10b981",
      icon: () => null,
    },
    delayed: {
      label: <span><Clock className="h-5 w-5" style={{ color: "#f43f5e" }} /></span>,
      color: "#f43f5e",
      icon: () => null,
    },
    missed: {
      label: <span><Ban className="h-5 w-5" style={{ color: "#18181b" }} /></span>,
      color: "#18181b",
      icon: () => null,
    },
    ...(gender === "female" ? {
      menstruation: {
        label: <span><Flower2 className="h-5 w-5" style={{ color: "#ec4899" }} /></span>,
        color: "#ec4899",
        icon: () => null,
      }
    } : {})
  } satisfies ChartConfig

  return (
    <div className="w-full bg-transparent">
      <div className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="status"
              innerRadius={70}
              strokeWidth={2}
              stroke="var(--background)"
            />
          </PieChart>
        </ChartContainer>
        
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {Object.entries(chartConfig).map(([key, config]) => {
            if (key === 'value') return null;
            return (
              <div key={key} className="flex items-center justify-center">
                {config.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
