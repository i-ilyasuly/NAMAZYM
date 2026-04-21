import React from "react";
import { format, subDays } from "date-fns";
import { LayoutGrid, Users2, User, Clock, Ban, Flower2, CircleDashed, PieChart, BarChart3, AlignEndHorizontal, LineChart, AreaChart, Activity, Hexagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "../../lib/utils";
import { LoadingScreen } from "../LoadingScreen";
import { PrayerDonutChart } from "../PrayerDonutChart";
import { PrayerPieChart } from "../PrayerPieChart";
import { PrayerBarChart } from "../PrayerBarChart";
import { PrayerStackedBarChart } from "../PrayerStackedBarChart";
import { PrayerLineChart } from "../PrayerLineChart";
import { PrayerAreaChart } from "../PrayerAreaChart";
import { PrayerRadarChart } from "../PrayerRadarChart";
import { PrayerRadarChart2 } from "../PrayerRadarChart2";

export function StatisticsChartsTab({
  t,
  gender,
  statsPeriod,
  setStatsPeriod,
  statsStatus,
  setStatsStatus,
  activeChartType,
  setActiveChartType,
  isLoadingStats,
  statsData,
  getDynamicDayScore
}: any) {
  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* 2. Period Filter */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <Tabs 
          value={statsPeriod.toString()} 
          onValueChange={(v) => setStatsPeriod(parseInt(v))}
          className="w-full"
        >
          <TabsList className="flex h-14 w-max items-center justify-start gap-1 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="3650"
              className="w-12 h-full rounded-lg transition-all flex flex-col items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <LayoutGrid className="w-5 h-5 text-slate-500" />
            </TabsTrigger>
            {[
              { value: "7", label: "1 " + t("week", { defaultValue: "апта" }) },
              { value: "14", label: "2 " + t("week", { defaultValue: "апта" }) },
              { value: "21", label: "3 " + t("week", { defaultValue: "апта" }) },
              { value: "30", label: "1 " + t("month", { defaultValue: "ай" }) },
              { value: "60", label: "2 " + t("month", { defaultValue: "ай" }) },
              { value: "90", label: "3 " + t("month", { defaultValue: "ай" }) },
              { value: "180", label: "6 " + t("month", { defaultValue: "ай" }) },
              { value: "365", label: "1 " + t("year", { defaultValue: "жыл" }) },
            ].map((period) => (
              <TabsTrigger 
                key={period.value}
                value={period.value}
                className="px-4 h-full rounded-lg transition-all whitespace-nowrap text-xs font-bold flex flex-col items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {period.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 3. Status Filter */}
      <AnimatePresence>
        {!["stacked", "pie", "donut"].includes(activeChartType) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full overflow-hidden"
          >
            <Tabs 
              value={statsStatus} 
              onValueChange={setStatsStatus}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5 h-14 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="all" className="flex flex-col items-center justify-center h-full data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                  <LayoutGrid className="w-5 h-5 text-slate-500" />
                </TabsTrigger>
                {gender === "male" && (
                  <TabsTrigger value="congregation" className="flex flex-col items-center justify-center h-full data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    <Users2 className="w-5 h-5 text-emerald-500" />
                  </TabsTrigger>
                )}
                <TabsTrigger value="prayed" className="flex flex-col items-center justify-center h-full data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                  <User className={cn("w-5 h-5", gender === "female" ? "text-emerald-500" : "text-blue-500")} />
                </TabsTrigger>
                <TabsTrigger value="delayed" className="flex flex-col items-center justify-center h-full data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                  <Clock className="w-5 h-5 text-rose-500" />
                </TabsTrigger>
                <TabsTrigger value="missed" className="flex flex-col items-center justify-center h-full data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                  <Ban className="w-5 h-5 text-zinc-500" />
                </TabsTrigger>
                {gender === "female" && (
                  <TabsTrigger value="menstruation" className="flex flex-col items-center justify-center h-full data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    <Flower2 className="w-5 h-5 text-pink-500" />
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoadingStats ? (
        <LoadingScreen fullScreen={false} message={t("loading")} />
      ) : statsData.length > 0 ? (
        <div className="space-y-6">
          <div className="p-2">
            {(() => {
              const filteredStatsData = statsData;
              
              return (
                <>
                  {activeChartType === "donut" && <PrayerDonutChart data={filteredStatsData} gender={gender} />}
                  {activeChartType === "pie" && <PrayerPieChart data={filteredStatsData} gender={gender} />}
                  {activeChartType === "bar" && <PrayerBarChart data={statsData} activeStatus={statsStatus} gender={gender} />}
                  {activeChartType === "stacked" && <PrayerStackedBarChart data={statsData} gender={gender} />}
                  {activeChartType === "line" && <PrayerLineChart data={filteredStatsData} activeStatus={statsStatus} gender={gender} />}
                  {activeChartType === "area" && <PrayerAreaChart data={filteredStatsData} activeStatus={statsStatus} gender={gender} />}
                  {activeChartType === "radar1" && <PrayerRadarChart data={statsData} activeStatus={statsStatus} gender={gender} />}
                  {activeChartType === "radar2" && <PrayerRadarChart2 data={statsData} activeStatus={statsStatus} gender={gender} />}
                </>
              );
            })()}
          </div>

          {/* Chart Type Filter */}
          <div className="w-full overflow-x-auto no-scrollbar pt-2 pb-2">
            <div className="flex items-center gap-3 w-max px-1">
              {[
                { value: "donut", label: "Donut", icon: CircleDashed, color: "text-indigo-500", bg: "bg-indigo-50" },
                { value: "pie", label: "Pie", icon: PieChart, color: "text-blue-500", bg: "bg-blue-50" },
                { value: "bar", label: "Bar", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-50" },
                { value: "stacked", label: "Stacked", icon: AlignEndHorizontal, color: "text-amber-500", bg: "bg-amber-50" },
                { value: "line", label: "Line", icon: LineChart, color: "text-rose-500", bg: "bg-rose-50" },
                { value: "area", label: "Area", icon: AreaChart, color: "text-purple-500", bg: "bg-purple-50" },
                { value: "radar1", label: "Radar 1", icon: Activity, color: "text-cyan-500", bg: "bg-cyan-50" },
                { value: "radar2", label: "Radar 2", icon: Hexagon, color: "text-teal-500", bg: "bg-teal-50" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveChartType(item.value);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center w-[72px] gap-2 transition-all",
                    activeChartType === item.value ? "opacity-100" : "opacity-70 hover:opacity-100"
                  )}
                >
                  <div className={cn(
                    "w-full h-8 flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all",
                    activeChartType === item.value 
                      ? "bg-foreground text-background shadow-md scale-105" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}>
                    {item.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full">
            <h3 className="text-sm font-bold mb-3">{t("day_score_dynamics", { defaultValue: "Күнделікті ұпай динамикасы" })}</h3>
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2">
              {Array.from({ length: Math.min(statsPeriod, 90) }).map((_, i) => {
                const date = format(subDays(new Date(), Math.min(statsPeriod, 90) - 1 - i), "yyyy-MM-dd");
                const score = getDynamicDayScore(date);
                const isToday = i === Math.min(statsPeriod, 90) - 1;
                
                return (
                  <div 
                    key={date} 
                    className="flex flex-col items-center gap-1 shrink-0 group relative"
                  >
                    <div className="text-[9px] text-muted-foreground/50 rotate-[-45deg] origin-left whitespace-nowrap mb-4 h-6 w-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {format(subDays(new Date(), Math.min(statsPeriod, 90) - 1 - i), "dd.MM")}
                    </div>
                    <div 
                      className={cn(
                        "w-2.5 rounded-full transition-all duration-300 relative",
                        score >= 80 ? "bg-emerald-500" : 
                        score >= 50 ? "bg-amber-400" : 
                        score > 0 ? "bg-rose-400" : "bg-muted",
                        isToday ? "ring-2 ring-primary ring-offset-1" : ""
                      )}
                      style={{ 
                        height: '60px',
                        opacity: score > 0 ? 0.7 + (score/100)*0.3 : 0.3
                      }}
                    >
                      <div 
                        className={cn(
                          "absolute bottom-0 w-full rounded-full transition-all",
                          score >= 80 ? "bg-emerald-600" : 
                          score >= 50 ? "bg-amber-500" : 
                          score > 0 ? "bg-rose-500" : "bg-muted-foreground/20"
                        )}
                        style={{ height: `${Math.max(10, score)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Бұл кезеңде статистика жоқ</p>
        </div>
      )}
    </div>
  );
}
