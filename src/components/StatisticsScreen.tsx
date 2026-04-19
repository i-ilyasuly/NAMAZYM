import React from "react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays } from "date-fns";
import { Share2, LayoutGrid, Users2, User, Clock, Ban, Flower2, CircleDashed, PieChart, BarChart3, AlignEndHorizontal, LineChart, AreaChart, Activity, Hexagon, ChevronLeft, ChevronRight, BarChart2, Sunrise, Sun, CloudSun, Sunset, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "../lib/utils";
import { LoadingScreen } from "./LoadingScreen";

import { PrayerDonutChart } from "./PrayerDonutChart";
import { PrayerPieChart } from "./PrayerPieChart";
import { PrayerBarChart } from "./PrayerBarChart";
import { PrayerStackedBarChart } from "./PrayerStackedBarChart";
import { PrayerLineChart } from "./PrayerLineChart";
import { PrayerAreaChart } from "./PrayerAreaChart";
import { PrayerRadarChart } from "./PrayerRadarChart";
import { PrayerRadarChart2 } from "./PrayerRadarChart2";

type PrayerStatus = "prayed" | "congregation" | "delayed" | "missed" | "menstruation" | "none";
interface PrayerRecord {  date: string;  fajr: PrayerStatus;  dhuhr: PrayerStatus;  asr: PrayerStatus;  maghrib: PrayerStatus;  isha: PrayerStatus; }

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
  setSelectedDate
}: any) {
  return (
    <>
          <div className="space-y-6 pb-24 px-4 pt-4 max-w-5xl mx-auto w-full">
            <div className="flex flex-col space-y-4">
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
                <>
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
              </div>

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

                {/* 1. Chart Type Filter (Moved Below Charts and Above Stats Grid) */}
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
                            ? "bg-background shadow-sm border border-border/50 text-foreground" 
                            : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
                        )}>
                          {item.label}
                        </div>
                        <div className={cn(
                          "flex items-center justify-center w-full h-16 rounded-2xl transition-all border",
                          activeChartType === item.value 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-muted/60 bg-muted/20 hover:bg-muted/40"
                        )}>
                          <div className={cn("p-2 rounded-xl", activeChartType === item.value ? item.bg : "bg-transparent")}>
                            <item.icon className={cn("w-6 h-6", item.color)} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground space-y-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <BarChart2 className="w-10 h-10 text-muted" />
                </div>
                <p className="text-center px-8 text-sm font-medium">
                  Статистиканы көру үшін кемінде бір күн намаз белгілеуіңіз қажет.
                </p>
                {user?.email === "ilyasuly.isakhan@gmail.com" && (
                  <Button variant="outline" onClick={generateMockData} disabled={isGeneratingMock}>
                    Тесттік деректерді жасау
                  </Button>
                )}
              </div>
            )}
            </>
          )}

          {statisticsSubTab === "calendar" && (
              <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
                <div className="bg-card rounded-2xl border border-muted/40 shadow-sm p-4 flex flex-col items-center w-full">
                  <div className="flex justify-between items-center w-full mb-4 px-2">
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    {['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'][currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </div>
                  <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 bg-transparent p-0 opacity-80 hover:opacity-100 text-primary"
                    onClick={() => setIsShareScreenOpen(true)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  </div>
                </div>

                <div className="w-full">
                  <div className="grid grid-cols-7 gap-y-2 mb-2">
                    {['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жк'].map((dayName, i) => (
                      <div key={i} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center mx-auto">
                        {dayName}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1">
                    {(() => {
                      const monthStart = startOfMonth(currentMonth);
                      const monthEnd = endOfMonth(monthStart);
                      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                      
                      return eachDayOfInterval({ start: startDate, end: endDate }).map((day, i) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const isSelected = isSameDay(day, new Date(selectedDate));
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isFuture = day > new Date();
                        
                        const statusColorName = getDominantStatusColor(dateStr);
                        const dotColor = getStatusDotColor(statusColorName);

                        return (
                          <div key={i} className="flex justify-center">
                            <button
                              onClick={() => {
                                if (!isFuture) {
                                  setSelectedDate(dateStr);
                                  setActiveTab("home");
                                }
                              }}
                              disabled={isFuture}
                              className={cn(
                                "relative h-9 w-9 p-0 font-normal text-sm rounded-md flex flex-col items-center justify-center transition-colors",
                                isSelected
                                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                                  : isToday
                                  ? "bg-accent text-accent-foreground"
                                  : "hover:bg-accent hover:text-accent-foreground",
                                !isCurrentMonth && "text-muted-foreground opacity-50",
                                isFuture && "opacity-50 cursor-not-allowed hover:bg-transparent"
                              )}
                            >
                              <span>{format(day, "d")}</span>
                              {statusColorName && !isFuture && (
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full absolute bottom-1", 
                                  dotColor,
                                  isSelected && "bg-primary-foreground"
                                )} />
                              )}
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-muted/40 shadow-sm p-4 flex flex-col items-center w-full max-w-4xl mx-auto">
                <div className="flex justify-between items-center w-full mb-4 px-2">
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    Динамика
                  </div>
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="w-full relative">
                  <div className="grid grid-cols-7 mb-2">
                    {['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жк'].map((dayName, i) => (
                      <div key={i} className="text-muted-foreground font-normal text-[0.8rem] text-center">
                        {dayName}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 border-t border-l border-muted/30 rounded-sm overflow-hidden bg-card/30">
                    {(() => {
                      const monthStart = startOfMonth(currentMonth);
                      const monthEnd = endOfMonth(monthStart);
                      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                      
                      return eachDayOfInterval({ start: startDate, end: endDate }).map((day, i) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const isSelected = isSameDay(day, new Date(selectedDate));
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isFuture = day > new Date();
                        
                        const { score, colorClass, sizePx } = getDynamicDayScore(dateStr);

                        return (
                          <div key={i} className="aspect-square border-b border-r border-muted/30 flex items-center justify-center relative">
                            <button
                              onClick={() => {
                                if (!isFuture) {
                                  setSelectedDate(dateStr);
                                  setActiveTab("home");
                                }
                              }}
                              disabled={isFuture}
                              className={cn(
                                "absolute inset-0 w-full h-full flex items-center justify-center transition-colors",
                                isSelected
                                  ? "bg-primary/10"
                                  : isToday
                                  ? "bg-accent/30"
                                  : "hover:bg-accent/30",
                                !isCurrentMonth && "opacity-30",
                                isFuture && "opacity-50 cursor-not-allowed hover:bg-transparent"
                              )}
                            >
                              {!isFuture && score >= 0 && (
                                <div 
                                  className={cn(
                                    "rounded-full transition-all duration-300", 
                                    colorClass
                                  )} 
                                  style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
                                />
                              )}
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            
{/* Weekly Calendar Start */}
<div className="bg-card rounded-2xl border border-muted/40 shadow-sm p-4 flex flex-col items-center w-full max-w-md mx-auto">
              <div className="flex justify-between items-center w-full mb-4 px-2">
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCalendarWeekStart(subDays(calendarWeekStart, 7))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    {format(calendarWeekStart, "d MMM")} - {format(endOfWeek(calendarWeekStart, { weekStartsOn: 1 }), "d MMM")}
                  </div>
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCalendarWeekStart(addDays(calendarWeekStart, 7))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="w-full flex">
                  {/* Left column for prayer icons */}
                  <div className="w-8 flex flex-col items-center">
                    <div className="text-transparent font-normal text-[0.8rem] mb-2">00</div>
                    <div className="flex flex-col gap-[14px] py-2 items-center">
                      <div className="h-[14px] flex items-center justify-center"><Sunrise className="w-5 h-5 text-sky-500" /></div>
                      <div className="h-[14px] flex items-center justify-center"><Sun className="w-5 h-5 text-amber-500" /></div>
                      <div className="h-[14px] flex items-center justify-center"><CloudSun className="w-5 h-5 text-orange-500" /></div>
                      <div className="h-[14px] flex items-center justify-center"><Sunset className="w-5 h-5 text-rose-500" /></div>
                      <div className="h-[14px] flex items-center justify-center"><Moon className="w-5 h-5 text-indigo-500" /></div>
                    </div>
                  </div>
                  
                  {/* Grid for days */}
                  <div className="flex-1">
                    <div className="grid grid-cols-7 gap-y-2 mb-2">
                      {['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жк'].map((dayName, i) => (
                        <div key={i} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center mx-auto">
                          {dayName}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1">
                      {(() => {
                        const startDate = startOfWeek(calendarWeekStart, { weekStartsOn: 1 });
                        const endDate = endOfWeek(calendarWeekStart, { weekStartsOn: 1 });
                        
                        return eachDayOfInterval({ start: startDate, end: endDate }).map((day, i) => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const isSelected = isSameDay(day, new Date(selectedDate));
                          const isToday = isSameDay(day, new Date());
                          const isFuture = day > new Date();
                          
                          const record = weeklyRecords[dateStr] || {};
                          const prayersList = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

                          return (
                            <div key={i} className="flex justify-center">
                              <button
                                onClick={() => {
                                  if (!isFuture) {
                                    setSelectedDate(dateStr);
                                    setActiveTab("home");
                                  }
                                }}
                                disabled={isFuture}
                                className={cn(
                                  "relative w-9 py-2 rounded-xl flex flex-col items-center gap-[14px] transition-colors",
                                  isSelected
                                    ? "bg-primary/10 ring-1 ring-primary/30"
                                    : isToday
                                    ? "bg-accent/50"
                                    : "hover:bg-accent/50",
                                  isFuture && "opacity-50 cursor-not-allowed hover:bg-transparent"
                                )}
                              >
                                {prayersList.map((prayerId, idx) => {
                                  const status = record[prayerId as keyof PrayerRecord] as PrayerStatus;
                                  const dotColor = getStatusDotColorForCell(status);
                                  const hasStatus = status && status !== "none";
                                  
                                  // 1. Define Status Hierarchy Rank
                                  const getStatusRank = (s: PrayerStatus | undefined): number => {
                                    switch (s) {
                                      case "congregation": return 4;
                                      case "prayed": return 3;
                                      case "delayed": return 2;
                                      case "missed": return 1;
                                      default: return 0;
                                    }
                                  };

                                  const currentRank = getStatusRank(status);
                                  
                                  const hasNextLine = (() => {
                                    if (currentRank === 0 || i >= 6) return false;
                                    
                                    const nextDay = addDays(day, 1);
                                    const nextDateStr = format(nextDay, "yyyy-MM-dd");
                                    const nextRecord = weeklyRecords[nextDateStr] || {};
                                    const nextStatus = nextRecord[prayerId as keyof PrayerRecord] as PrayerStatus;
                                    const nextRank = getStatusRank(nextStatus);
                                    
                                    // Line exists if next day is better or equal
                                    return nextRank >= currentRank && nextRank > 0;
                                  })();

                                  const hasPrevLine = (() => {
                                    if (currentRank === 0 || i <= 0) return false;
                                    
                                    const prevDay = subDays(day, 1);
                                    const prevDateStr = format(prevDay, "yyyy-MM-dd");
                                    const prevRecord = weeklyRecords[prevDateStr] || {};
                                    const prevStatus = prevRecord[prayerId as keyof PrayerRecord] as PrayerStatus;
                                    const prevRank = getStatusRank(prevStatus);
                                    
                                    return currentRank >= prevRank && prevRank > 0;
                                  })();
                                  
                                  return (
                                    <div key={idx} className="relative w-3.5 h-3.5 flex items-center justify-center">
                                      {hasNextLine && (
                                        <motion.div 
                                          initial={{ scaleX: 0 }}
                                          animate={{ scaleX: 1 }}
                                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                                          style={{ originX: 0 }}
                                          className={cn(
                                            "absolute left-1/2 top-1/2 -translate-y-1/2 w-[48px] sm:w-[54px] h-[2px] z-0 opacity-40",
                                            dotColor
                                          )} 
                                        />
                                      )}
                                      <div 
                                        className={cn(
                                          "relative z-10 w-3.5 h-3.5 rounded-full transition-all duration-300", 
                                          hasStatus ? dotColor : "bg-muted-foreground/10",
                                          (hasPrevLine || hasNextLine) && "scale-110 shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                                        )} 
                                      />
                                    </div>
                                  );
                                })}
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
{/* Weekly Calendar End */}
</div>
          )}

          </div>
    </>
  );
}