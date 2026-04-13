"use client"

import { Pie, PieChart } from "recharts"
import { useTranslation } from "react-i18next"
import { User, Users2, Clock, Ban, Flower2 } from "lucide-react"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "./ui/chart"

interface PrayerPieChartProps {
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

export function PrayerPieChart({ data, gender }: PrayerPieChartProps) {
  const { t } = useTranslation()

  // Calculate totals for each status across all prayers
  const totals = data.reduce(
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
      label: t("prayed", { defaultValue: "Уақытында" }),
      color: gender === "female" ? "#10b981" : "#3b82f6",
      icon: User,
    },
    ...(gender === "male" ? {
      congregation: {
        label: t("congregation", { defaultValue: "Жамағатпен" }),
        color: "#10b981",
        icon: Users2,
      }
    } : {}),
    delayed: {
      label: t("delayed", { defaultValue: "Кешіктіріліп" }),
      color: "#f43f5e",
      icon: Clock,
    },
    missed: {
      label: t("missed", { defaultValue: "Қаза" }),
      color: "#18181b",
      icon: Ban,
    },
    ...(gender === "female" ? {
      menstruation: {
        label: t("menstruation", { defaultValue: "Ерекше күндер" }),
        color: "#ec4899",
        icon: Flower2,
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
              stroke="var(--background)"
              strokeWidth={2}
            />
          </PieChart>
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
      </div>
    </div>
  )
}
