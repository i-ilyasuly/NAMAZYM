"use client"

import { Sunrise, Sun, CloudSun, Sunset, Moon, Clock, User, Users2, Ban, Flower2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useTranslation } from "react-i18next"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart"

interface PrayerStackedBarChartProps {
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

export function PrayerStackedBarChart({ data, gender }: PrayerStackedBarChartProps) {
  const { t } = useTranslation()

  const chartConfig = {
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
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 20, bottom: 20 }}>
            <CartesianGrid vertical={false} className="stroke-muted-foreground/10" />
            <XAxis
              dataKey="prayer"
              tickLine={false}
              tickMargin={12}
              axisLine={false}
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
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="prayed"
              stackId="a"
              fill="var(--color-prayed)"
            />
            {gender === "male" && (
              <Bar
                dataKey="congregation"
                stackId="a"
                fill="var(--color-congregation)"
              />
            )}
            <Bar
              dataKey="delayed"
              stackId="a"
              fill="var(--color-delayed)"
            />
            {gender === "female" && (
              <Bar
                dataKey="menstruation"
                stackId="a"
                fill="var(--color-menstruation)"
              />
            )}
            <Bar
              dataKey="missed"
              stackId="a"
              fill="var(--color-missed)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
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
