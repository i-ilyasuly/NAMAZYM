import React from "react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Share2, Sunrise, Sun, CloudSun, Sunset, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

type PrayerStatus = "prayed" | "congregation" | "delayed" | "missed" | "menstruation" | "none";
interface PrayerRecord { date: string; fajr: PrayerStatus; dhuhr: PrayerStatus; asr: PrayerStatus; maghrib: PrayerStatus; isha: PrayerStatus; }

export function StatisticsCalendarTab({
  currentMonth,
  setCurrentMonth,
  calendarWeekStart,
  setCalendarWeekStart,
  weeklyRecords,
  getDominantStatusColor,
  getStatusDotColor,
  getStatusDotColorForCell,
  getDynamicDayScore,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  isStarrySky,
  setIsShareScreenOpen
}: any) {
  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Monthly Block */}
      <div className={cn("bg-card rounded-2xl border border-muted/40 shadow-sm p-4 flex flex-col items-center w-full max-w-sm mx-auto", isStarrySky && "bg-card/40 backdrop-blur-md")}>
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

      {/* Dynamics Grid */}
      <div className={cn("bg-card rounded-2xl border border-muted/40 shadow-sm p-4 flex flex-col items-center w-full max-w-4xl mx-auto", isStarrySky && "bg-card/40 backdrop-blur-md")}>
        <div className="flex justify-between items-center w-full mb-4 px-2">
          <Button 
            variant="outline" 
            className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">Динамика</div>
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
                        isSelected ? "bg-primary/10" : isToday ? "bg-accent/30" : "hover:bg-accent/30",
                        !isCurrentMonth && "opacity-30",
                        isFuture && "opacity-50 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      {!isFuture && score >= 0 && (
                        <div 
                          className={cn("rounded-full transition-all duration-300", colorClass)} 
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

      {/* Weekly Grid */}
      <div className={cn("bg-card rounded-2xl border border-muted/40 shadow-sm p-4 flex flex-col items-center w-full max-w-md mx-auto", isStarrySky && "bg-card/40 backdrop-blur-md")}>
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
                          isSelected ? "bg-primary/10 ring-1 ring-primary/30" : isToday ? "bg-accent/50" : "hover:bg-accent/50",
                          isFuture && "opacity-50 cursor-not-allowed hover:bg-transparent"
                        )}
                      >
                        {prayersList.map((prayerId, idx) => {
                          const status = record[prayerId as keyof PrayerRecord] as PrayerStatus;
                          const dotColor = getStatusDotColorForCell(status);
                          const hasStatus = status && status !== "none";
                          
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
                                  className={cn("absolute left-1/2 top-1/2 -translate-y-1/2 w-[48px] sm:w-[54px] h-[2px] z-0 opacity-40", dotColor)} 
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
    </div>
  );
}
