"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { useTranslation } from "react-i18next"
import { getPrayerTimeIcon, PRAYER_STATUS_ICONS } from "../lib/prayerIcons";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart"

interface PrayerRadarChart2Props {
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

export function PrayerRadarChart2({ data, activeStatus = "all", gender }: PrayerRadarChart2Props) {
  const { t } = useTranslation()

  const chartConfig = {
    prayed: {
      label: t("status_prayed"),
      color: gender === "female" ? "#10b981" : "#3b82f6",
      icon: PRAYER_STATUS_ICONS.prayed,
    },
    missed: {
      label: t("status_missed"),
      color: "#000000",
      icon: PRAYER_STATUS_ICONS.missed,
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
      color: "#ef4444",
      icon: PRAYER_STATUS_ICONS.delayed,
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
    <div className="w-full bg-transparent">
      <div className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px] w-full"
        >
          <RadarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              bottom: 10,
              left: 10,
            }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis
              dataKey="prayer"
              tick={(props: any) => {
                const { x, y, cx, cy, index } = props;
                // Push icons further from center
                const radiusOffset = 1.2; // 20% further
                const newX = cx + (x - cx) * radiusOffset;
                const newY = cy + (y - cy) * radiusOffset;
                
                const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

                return (
                  <g transform={`translate(${newX - 10}, ${newY - 10})`} style={{ pointerEvents: 'none' }}>
                    <foreignObject width="20" height="20">
                      <div className="flex items-center justify-center w-full h-full">
                        {getPrayerTimeIcon(prayers[index] ?? 'default')}
                      </div>
                    </foreignObject>
                  </g>
                )
              }}
            />

            <PolarGrid radialLines={false} className="stroke-muted-foreground/20" />
            {(activeStatus === "all" || activeStatus === "missed") && (
              <Radar 
                dataKey="missed" 
                fill="#000000" 
                fillOpacity={0}
                stroke="#000000"
                strokeWidth={2}
              />
            )}
            {(activeStatus === "all" || activeStatus === "delayed") && (
              <Radar
                dataKey="delayed"
                fill="#ef4444"
                fillOpacity={0}
                stroke="#ef4444"
                strokeWidth={2}
              />
            )}
            {(activeStatus === "all" || activeStatus === "prayed") && (
              <Radar
                dataKey="prayed"
                fill={gender === "female" ? "#10b981" : "#3b82f6"}
                fillOpacity={0}
                stroke={gender === "female" ? "#10b981" : "#3b82f6"}
                strokeWidth={2}
              />
            )}
            {gender === "male" && (activeStatus === "all" || activeStatus === "congregation") && (
              <Radar
                dataKey="congregation"
                fill="#10b981"
                fillOpacity={0}
                stroke="#10b981"
                strokeWidth={2}
              />
            )}
            {gender === "female" && (activeStatus === "all" || activeStatus === "menstruation") && (
              <Radar
                dataKey="menstruation"
                fill="#ec4899"
                fillOpacity={0}
                stroke="#ec4899"
                strokeWidth={2}
              />
            )}
          </RadarChart>
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
