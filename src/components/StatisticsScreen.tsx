import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "../lib/utils";

import { StatisticsChartsTab } from "./statistics/StatisticsChartsTab";
import { StatisticsCalendarTab } from "./statistics/StatisticsCalendarTab";
import { useStore } from "../store";

export function StatisticsScreen({
  user,
  t,
  gender,
  statisticsSubTab,
  setStatisticsSubTab,
  statsPeriod,
  setStatsPeriod,
  statsStatus,
  setStatsStatus,
  activeChartType,
  setActiveChartType,
  isLoadingStats,
  statsData,
  isGeneratingMock,
  generateMockData,
  setIsShareScreenOpen,
  currentMonth,
  setCurrentMonth,
  calendarWeekStart,
  setCalendarWeekStart,
  weeklyRecords,
  handleCalendarCellClick,
  getDominantStatusColor,
  getStatusDotColor,
  getStatusDotColorForCell,
  getDynamicDayScore,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  isStarrySky,
  backgroundType
}: any) {
  const { isDarkMode } = useStore();
  const isSpecialBg = backgroundType !== 'stars' || (isDarkMode && isStarrySky);

  return (
    <div className={cn(
      "space-y-6 pb-24 px-4 pt-4 max-w-5xl mx-auto w-full transition-colors",
      isSpecialBg ? "bg-transparent" : "bg-transparent"
    )}>
      <div className="flex flex-col space-y-4">
        {/* Header without frame */}
        <div className="flex flex-col space-y-4 mb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("statistics")}
            </h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsShareScreenOpen(true)}
                className="h-8 px-4"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Бөлісу
              </Button>
              {user?.email === "ilyasuly.isakhan@gmail.com" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateMockData}
                  disabled={isGeneratingMock}
                  className="text-[10px] h-8 rounded-full"
                >
                  {isGeneratingMock ? "..." : "Mock Data"}
                </Button>
              )}
            </div>
          </div>

          <Tabs 
            value={statisticsSubTab} 
            onValueChange={(v: any) => setStatisticsSubTab(v)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted rounded-xl">
              <TabsTrigger 
                value="stats" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold"
              >
                Статистика
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold"
              >
                Күнтізбе
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {statisticsSubTab === "stats" && (
          <StatisticsChartsTab
            t={t}
            gender={gender}
            statsPeriod={statsPeriod}
            setStatsPeriod={setStatsPeriod}
            statsStatus={statsStatus}
            setStatsStatus={setStatsStatus}
            activeChartType={activeChartType}
            setActiveChartType={setActiveChartType}
            isLoadingStats={isLoadingStats}
            statsData={statsData}
            getDynamicDayScore={getDynamicDayScore}
          />
        )}

        {statisticsSubTab === "calendar" && (
          <StatisticsCalendarTab
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            calendarWeekStart={calendarWeekStart}
            setCalendarWeekStart={setCalendarWeekStart}
            weeklyRecords={weeklyRecords}
            getDominantStatusColor={getDominantStatusColor}
            getStatusDotColor={getStatusDotColor}
            getStatusDotColorForCell={getStatusDotColorForCell}
            getDynamicDayScore={getDynamicDayScore}
            setActiveTab={setActiveTab}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isStarrySky={isStarrySky}
            setIsShareScreenOpen={setIsShareScreenOpen}
          />
        )}
      </div>
    </div>
  );
}
