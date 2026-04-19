"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { format, subDays } from "date-fns"
import { kk } from "date-fns/locale"
import { getPrayerTimeIcon, PRAYER_STATUS_ICONS } from "../lib/prayerIcons";

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
      icon: PRAYER_STATUS_ICONS.prayed,
    },
    ...(gender === "male" ? {
      congregation: {
        label: t("status_congregation"),
        color: "#10b981",
        icon: PRAYER_STATUS_ICONS.congregation,
      }
    } : {}),
    delayed: {
      label: t("status_delayed"),
      color: "#f43f5e",
      icon: PRAYER_STATUS_ICONS.delayed,
    },
    missed: {
      label: t("status_missed"),
      color: "#18181b",
      icon: PRAYER_STATUS_ICONS.missed,
    },
    ...(gender === "female" ? {
      menstruation: {
        label: t("status_menstruation"),
        color: "#ec4899",
        icon: PRAYER_STATUS_ICONS.menstruation,
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
              dataKey="prayer"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={({ x, y, payload }) => {
                const prayerKey = payload.value.toLowerCase();
                let prayerId = 'default';
                if (prayerKey.includes("таң") || prayerKey.includes("fajr")) prayerId = 'fajr';
                else if (prayerKey.includes("бесін") || prayerKey.includes("dhuhr")) prayerId = 'dhuhr';
                else if (prayerKey.includes("екінті") || prayerKey.includes("asr")) prayerId = 'asr';
                else if (prayerKey.includes("ақшам") || prayerKey.includes("maghrib")) prayerId = 'maghrib';
                else if (prayerKey.includes("құптан") || prayerKey.includes("isha")) prayerId = 'isha';

                return (
                  <foreignObject x={x - 10} y={y + 8} width={20} height={20}>
                    <div className="flex items-center justify-center w-full h-full">
                      {getPrayerTimeIcon(prayerId)}
                    </div>
                  </foreignObject>
                );
              }}
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
              />
            )}
            
            {gender === "male" && (activeStatus === "all" || activeStatus === "congregation") && (
              <Area
                dataKey="congregation"
                type="natural"
                fill="var(--color-congregation)"
                fillOpacity={0.4}
                stroke="var(--color-congregation)"
              />
            )}
            
            {(activeStatus === "all" || activeStatus === "delayed") && (
              <Area
                dataKey="delayed"
                type="natural"
                fill="var(--color-delayed)"
                fillOpacity={0.4}
                stroke="var(--color-delayed)"
              />
            )}
            
            {gender === "female" && (activeStatus === "all" || activeStatus === "menstruation") && (
              <Area
                dataKey="menstruation"
                type="natural"
                fill="var(--color-menstruation)"
                fillOpacity={0.4}
                stroke="var(--color-menstruation)"
              />
            )}
            
            {(activeStatus === "all" || activeStatus === "missed") && (
              <Area
                dataKey="missed"
                type="natural"
                fill="var(--color-missed)"
                fillOpacity={0.4}
                stroke="var(--color-missed)"
              />
            )}
            
          </AreaChart>
        </ChartContainer>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {Object.entries(chartConfig).map(([key, config]) => {
            if (key === 'value') return null;
            const Icon = (config as any).icon;
            return (
              <div key={key} className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {Icon && <Icon className="h-5 w-5" style={{ color: (config as any).color }} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
