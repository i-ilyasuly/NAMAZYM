"use client"

import { TrendingUp, Sunrise, Sun, CloudSun, Sunset, Moon, Clock } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { useTranslation } from "react-i18next"

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
    },
    missed: {
      label: t("status_missed"),
      color: "#000000",
    },
    congregation: {
      label: t("status_congregation"),
      color: "#10b981",
    },
    delayed: {
      label: t("status_delayed"),
      color: "#ef4444",
    },
    menstruation: {
      label: t("status_menstruation"),
      color: "#ec4899",
    },
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
              tick={({ x, y, cx, cy, index }) => {
                // Push icons further from center
                const radiusOffset = 1.2; // 20% further
                const newX = cx + (x - cx) * radiusOffset;
                const newY = cy + (y - cy) * radiusOffset;
                
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
                  <g transform={`translate(${newX - 10}, ${newY - 10})`} style={{ pointerEvents: 'none' }}>
                    <foreignObject width="20" height="20">
                      <div className="flex items-center justify-center w-full h-full">
                        {getIcon()}
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
      </div>
    </div>
  )
}
