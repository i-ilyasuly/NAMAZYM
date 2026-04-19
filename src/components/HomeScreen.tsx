import React, { useRef, useEffect } from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { kk, ru } from "date-fns/locale";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Flame, Navigation, Loader2, Check, Plus, Minus, Moon, Sun, Users2, User, Clock, Ban, Flower2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import NightSky from "./NightSky";
import { Moon as MoonComponent } from "./Moon";
import { PrayerCard } from "./PrayerCard";
import { QuranVerseLive, QuranSettings } from "./QuranVerseLive";
import { Skeleton } from "./ui/skeleton";
import { PrayerRecord, PrayerStatus } from "../store";

export function HomeScreen({
  user,
  t,
  i18n,
  selectedDate,
  setSelectedDate,
  hijriDate,
  isLoadingLocation,
  locationError,
  locationName,
  setIsLocationSearchOpen,
  currentStreak,
  statusStreaks,
  weeklyRecords,
  dailyProgress,
  nextPrayer,
  timeToNextPrayer,
  prayerTimes,
  handlePrayerClick,
  getDominantStatusColor,
  getStatusDotColor,
  handlePrayerLocChange,
  handleKhushuChange,
  handleExtraPrayerUpdate,
  gender,
  isDarkMode,
  isStarrySky,
  getStatusStreakConfig,
  expandedPrayerId,
  setExpandedPrayerId,
  showQuranSettings,
  setShowQuranSettings,
  prayers,
  expansionStep,
  setExpansionStep,
  setSelectedPrayer,
  setTempStatus,
  setTempContext,
  handleStatusUpdate,
  tempStatus,
  tempContext,
  contexts
}: any) {
  const horizontalCalendarRef = useRef<HTMLDivElement>(null);
  const lastSelectedDate = useRef(selectedDate);
  const isFirstHomeRender = useRef(true);

  useEffect(() => {
    if (horizontalCalendarRef.current) {
      const container = horizontalCalendarRef.current;
      
      const performScroll = () => {
        const selectedBtn = container.querySelector('[data-selected="true"]') as HTMLElement;
        if (selectedBtn) {
          const isDateChanged = lastSelectedDate.current !== selectedDate;
          const scrollLeft = selectedBtn.offsetLeft - container.offsetWidth / 2 + selectedBtn.offsetWidth / 2;
          
          const behavior = (isDateChanged && !isFirstHomeRender.current) ? "smooth" : "auto";
          
          container.scrollTo({ left: scrollLeft, behavior });
          
          lastSelectedDate.current = selectedDate;
          isFirstHomeRender.current = false;
        }
      };

      const timer1 = setTimeout(performScroll, 50);
      const timer2 = setTimeout(performScroll, 300);
      const timer3 = setTimeout(performScroll, 1000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      isFirstHomeRender.current = true;
    }
  }, [selectedDate]);

  const getDateArray = () => {
    const dates = [];
    const today = new Date();
    for (let i = -30; i <= 30; i++) {
      dates.push(addDays(today, i));
    }
    return dates;
  };

  const dates = getDateArray();
  const currentRecord = weeklyRecords[selectedDate] || {};

  return (
    <>
          <div className="flex flex-col flex-1">
            <div className="space-y-2 relative">
              {isDarkMode && isStarrySky && (
                <div className="absolute -left-12 -top-12 z-0 opacity-100 pointer-events-none">
                  <MoonComponent size={140} className="scale-x-[-1] opacity-90" />
                </div>
              )}
              
              <div className="flex items-center justify-between relative z-10">
                <div className={cn(
                  "flex flex-col gap-1 transition-all duration-500",
                  isDarkMode && isStarrySky && "mix-blend-difference"
                )}>
                  <h1 className={cn(
                    "text-2xl font-bold tracking-tight leading-none",
                    isDarkMode && isStarrySky ? "text-white" : "text-foreground"
                  )}>
                    {format(new Date(selectedDate), "d MMMM", { locale: i18n.language === "kk" ? kk : ru })}
                  </h1>
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    isDarkMode && isStarrySky ? "text-white/80" : "text-muted-foreground"
                  )}>
                    <span className="capitalize">{format(new Date(selectedDate), "EEEE", { locale: i18n.language === "kk" ? kk : ru })}</span>
                    <span>•</span>
                    <span>{hijriDate}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={() => setIsLocationSearchOpen(true)}
                    disabled={isLoadingLocation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-muted/50 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none max-w-[180px]"
                  >
                    {isLoadingLocation ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 shrink-0 fill-current" /> 
                    )}
                    <span className="truncate">
                      {locationError ? "Қателік" : isLoadingLocation ? "Іздеу..." : (locationName || "Тұрған орным")}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {currentStreak > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-500 text-[10px] font-bold shadow-sm">
                        <Flame className="w-3 h-3" />
                        {currentStreak}
                      </div>
                    )}
                    {Object.entries(statusStreaks).map(([status, count]) => {
                      const streakCount = count as number;
                      if (streakCount < 2) return null; // Only show streaks of 2 or more
                      const config = getStatusStreakConfig(status);
                      const Icon = config.icon;
                      return (
                        <div key={status} className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm text-[10px] font-bold",
                          config.bg,
                          config.border,
                          config.color
                        )}>
                          <Icon className="w-3 h-3" />
                          {streakCount}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <QuranVerseLive 
                showSettingsManaged={true} 
                isSettingsOpen={showQuranSettings}
                onSettingsToggle={(open) => setShowQuranSettings(open)} 
              />
            </div>

            <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-4 pt-2 pb-20 relative">
              <div className="mb-3">
                <AnimatePresence mode="wait">
                  {showQuranSettings ? (
                    <motion.div 
                      key="quran-settings"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="py-1"
                    >
                       <QuranSettings onClose={() => setShowQuranSettings(false)} />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="calendar"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex overflow-x-auto no-scrollbar gap-2 snap-x snap-mandatory py-1 px-1" 
                      ref={horizontalCalendarRef}
                    >
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const days = Array.from({ length: 60 }).map((_, i) => {
                          const d = new Date();
                          d.setHours(0, 0, 0, 0);
                          d.setDate(today.getDate() - 59 + i);
                          return d;
                        });
                        
                        return days.map((day, i) => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const isSelected = isSameDay(day, new Date(selectedDate));
                          const isFuture = day > today;
                          const statusColorName = getDominantStatusColor(dateStr);
                          const dotColor = getStatusDotColor(statusColorName);
                          
                          return (
                            <button
                              key={i}
                              data-selected={isSelected}
                              onClick={() => {
                                if (!isFuture) {
                                  setSelectedDate(dateStr);
                                }
                              }}
                              disabled={isFuture}
                              className={cn(
                                "snap-center shrink-0 flex flex-col items-center justify-center min-w-[44px] h-[44px] rounded-xl transition-all border shadow-sm",
                                isSelected 
                                  ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-foreground" 
                                  : "bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-foreground",
                                isFuture && "opacity-30 cursor-not-allowed hover:bg-transparent"
                              )}
                            >
                              <span className={cn(
                                "text-[7px] font-medium uppercase mb-0",
                                isSelected ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {['Жк', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'][day.getDay()]}
                              </span>
                              <span className="text-xs font-bold leading-tight">
                                {format(day, "d")}
                              </span>
                              <div className="h-1 mt-1 flex items-center justify-center">
                                {statusColorName && !isFuture && (
                                  <div className={cn(
                                    "w-1 h-1 rounded-full",
                                    dotColor
                                  )} />
                                )}
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 flex flex-col justify-start min-w-0">
                <LayoutGroup>
                  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/50 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="flex flex-col relative">
                      {!prayerTimes
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-[64px] w-full border-b border-zinc-100 dark:border-zinc-800/50 last:border-0" />
                          ))
                        : prayers.map((prayer, index) => {
                        const isExpanded = expandedPrayerId === prayer.id;
                        const status = (currentRecord?.[prayer.id as keyof PrayerRecord] as PrayerStatus) || "none";
                        
                        const getHistoryForPrayer = (prayerId: string): PrayerStatus[] => {
                          const history: PrayerStatus[] = [];
                          // We use the selected date as the end point for the 7-day history
                          const baseDate = new Date(selectedDate);
                          for (let i = 6; i >= 0; i--) {
                            const d = subDays(baseDate, i);
                            const dateStr = format(d, "yyyy-MM-dd");
                            const record = weeklyRecords[dateStr];
                            history.push((record?.[prayerId as keyof PrayerRecord] as PrayerStatus) || "none");
                          }
                          return history;
                        };

                        return (
                          <div key={prayer.id} style={{ zIndex: 10 - index }} className={cn(
                            "flex flex-col border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors duration-300 relative",
                            isExpanded && "bg-zinc-50/50 dark:bg-zinc-800/20"
                          )}>
                            <PrayerCard
                              id={prayer.id}
                              name={prayer.name}
                              time={prayer.time || "--:--"}
                              status={status}
                              gender={gender}
                              noCard={true}
                              history={getHistoryForPrayer(prayer.id)}
                              onClick={(e) => {
                                if (e) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                                if (prayer.isPseudo) return;
                                
                                if (isExpanded) {
                                  setExpandedPrayerId(null);
                                  setExpansionStep("status");
                                } else {
                                  setSelectedPrayer(prayer.id);
                                  setTempStatus(status);
                                  const existingContexts = currentRecord?.contexts?.[
                                    prayer.id as keyof typeof currentRecord.contexts
                                  ];
                                  setTempContext(Array.isArray(existingContexts) ? existingContexts : []);
                                  setExpandedPrayerId(prayer.id);
                                  setExpansionStep("status");
                                }
                              }}
                            />
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-2">
                                    <div className="h-[48px] flex items-center overflow-hidden">
                                      {expansionStep === "status" ? (
                                        <div className="flex items-center justify-around w-full px-2">
                                          {[
                                            { id: "prayed", icon: User, color: gender === "female" ? "text-emerald-500" : "text-blue-500" },
                                            ...(gender === "male" ? [{ id: "congregation", icon: Users2, color: "text-emerald-500" }] : []),
                                            { id: "delayed", icon: Clock, color: "text-rose-500" },
                                            { id: "missed", icon: Ban, color: "text-zinc-900 dark:text-zinc-100" },
                                            ...(gender === "female" ? [{ id: "menstruation", icon: Flower2, color: "text-pink-500" }] : []),
                                            { id: "none", icon: Plus, color: "text-muted-foreground/40" },
                                          ].map((s) => (
                                            <button
                                              key={s.id}
                                              onClick={() => {
                                                if (s.id === "none") {
                                                  setTempStatus("none");
                                                  handleStatusUpdate();
                                                  return;
                                                }
                                                setTempStatus(s.id as PrayerStatus);
                                                if (s.id === "menstruation") {
                                                  handleStatusUpdate();
                                                } else {
                                                  setExpansionStep("context");
                                                }
                                              }}
                                              className="relative w-10 h-10 flex items-center justify-center transition-all active:scale-90"
                                            >
                                              <s.icon className={cn("w-5 h-5 relative z-10", s.color)} />
                                              {tempStatus === s.id && (
                                                <motion.div 
                                                  layoutId="statusGlow"
                                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                  className={cn(
                                                    "absolute inset-0 rounded-full blur-md opacity-[0.15] -z-0 scale-100",
                                                    s.id === "prayed" ? (gender === "female" ? "bg-emerald-500" : "bg-blue-500") :
                                                    s.id === "congregation" ? "bg-emerald-500" :
                                                    s.id === "delayed" ? "bg-rose-500" :
                                                    s.id === "missed" ? "bg-zinc-900 dark:bg-zinc-100" :
                                                    s.id === "menstruation" ? "bg-pink-500" : "bg-zinc-400"
                                                  )} 
                                                />
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="flex items-center w-full gap-2 px-2 overflow-x-auto no-scrollbar">
                                          <button 
                                            onClick={() => setExpansionStep("status")}
                                            className="p-2 shrink-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                          >
                                            <Plus className="w-4 h-4 rotate-45" />
                                          </button>
                                          <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
                                            {contexts.map((ctx) => {
                                              const isSelected = tempContext.includes(ctx.id);
                                              return (
                                                <button
                                                  key={ctx.id}
                                                  onClick={() => {
                                                    if (isSelected) {
                                                      setTempContext(tempContext.filter(c => c !== ctx.id));
                                                    } else {
                                                      setTempContext([...tempContext, ctx.id]);
                                                    }
                                                  }}
                                                  className="relative w-9 h-9 shrink-0 flex items-center justify-center transition-all active:scale-90"
                                                >
                                                  <ctx.icon className={cn("w-4 h-4 relative z-10", ctx.color)} />
                                                  {isSelected && (
                                                    <motion.div 
                                                      initial={{ opacity: 0, scale: 0.5 }}
                                                      animate={{ opacity: 0.1, scale: 0.75 }}
                                                      exit={{ opacity: 0, scale: 0.5 }}
                                                      className={cn(
                                                        "absolute inset-0 rounded-full blur-lg -z-0",
                                                        ctx.color.includes("emerald") ? "bg-emerald-500" :
                                                        ctx.color.includes("blue") ? "bg-blue-500" :
                                                        ctx.color.includes("amber") ? "bg-amber-500" :
                                                        ctx.color.includes("pink") ? "bg-pink-500" :
                                                        ctx.color.includes("indigo") ? "bg-indigo-500" : "bg-zinc-400"
                                                      )} 
                                                    />
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                          <Button 
                                            variant="outline"
                                            className="h-7 px-4 rounded-full font-bold text-[9px] uppercase tracking-wider border-zinc-200 dark:border-zinc-800 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 shrink-0"
                                            onClick={handleStatusUpdate}
                                          >
                                            {t("save")}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </LayoutGroup>

                {/* Қосымша намаздар (Extra Prayers) - Bento Style */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {/* Тахаджуд */}
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative p-4 rounded-3xl border transition-all duration-300 overflow-hidden group",
                      currentRecord?.tahajjud 
                        ? "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20" 
                        : "bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800/50"
                    )}
                  >
                    <div className="flex flex-col gap-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                            currentRecord?.tahajjud ? "bg-indigo-500 text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                          )}>
                            <Moon className="w-5 h-5" />
                          </div>
                          {currentRecord?.tahajjud && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-background flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">Тахаджуд</h4>
                          <p className="text-[10px] text-muted-foreground">Түнгі құлшылық</p>
                        </div>
                        <button
                          onClick={() => {
                            const isNowActive = !currentRecord?.tahajjud;
                            handleExtraPrayerUpdate('tahajjud', isNowActive);
                            if (isNowActive && !currentRecord?.tahajjudRakats) {
                              handleExtraPrayerUpdate('tahajjudRakats', 2);
                            }
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            currentRecord?.tahajjud ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                          )}
                        >
                          <Plus className={cn("w-4 h-4 transition-transform", currentRecord?.tahajjud && "rotate-45")} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center bg-background/50 backdrop-blur-sm rounded-xl border p-1">
                          <button 
                            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExtraPrayerUpdate('tahajjudRakats', Math.max(2, (currentRecord?.tahajjudRakats || 2) - 2));
                            }}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{currentRecord?.tahajjudRakats || 2}</span>
                          <button 
                            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExtraPrayerUpdate('tahajjudRakats', Math.min(12, (currentRecord?.tahajjudRakats || 2) + 2));
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {currentRecord?.tahajjud && (
                      <motion.div 
                        layoutId="tahajjudGlow"
                        className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full"
                      />
                    )}
                  </motion.div>

                  {/* Духа */}
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative p-4 rounded-3xl border transition-all duration-300 overflow-hidden group",
                      currentRecord?.duha 
                        ? "bg-amber-50/50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20" 
                        : "bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800/50"
                    )}
                  >
                    <div className="flex flex-col gap-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                            currentRecord?.duha ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                          )}>
                            <Sun className="w-5 h-5" />
                          </div>
                          {currentRecord?.duha && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">Духа</h4>
                          <p className="text-[10px] text-muted-foreground">Сәске намазы</p>
                        </div>
                        <button
                          onClick={() => {
                            const isNowActive = !currentRecord?.duha;
                            handleExtraPrayerUpdate('duha', isNowActive);
                            if (isNowActive && !currentRecord?.duhaRakats) {
                              handleExtraPrayerUpdate('duhaRakats', 2);
                            }
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            currentRecord?.duha ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                          )}
                        >
                          <Plus className={cn("w-4 h-4 transition-transform", currentRecord?.duha && "rotate-45")} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center bg-background/50 backdrop-blur-sm rounded-xl border p-1">
                          <button 
                            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExtraPrayerUpdate('duhaRakats', Math.max(2, (currentRecord?.duhaRakats || 2) - 2));
                            }}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{currentRecord?.duhaRakats || 2}</span>
                          <button 
                            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExtraPrayerUpdate('duhaRakats', Math.min(12, (currentRecord?.duhaRakats || 2) + 2));
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {currentRecord?.duha && (
                      <motion.div 
                        layoutId="duhaGlow"
                        className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full"
                      />
                    )}
                  </motion.div>
                </div>

                {/* Жұма (Тек жұма күні көрінеді) */}
                {new Date(selectedDate).getDay() === 5 && gender === "male" && (
                  <div className="mt-4 bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm p-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", currentRecord?.juma ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800")}>
                          <Users2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Жұма намазы</p>
                          <p className="text-[10px] text-muted-foreground">Мешітке бару</p>
                        </div>
                      </div>
                      <Button
                        variant={currentRecord?.juma ? "default" : "outline"}
                        size="sm"
                        className={cn("h-8 px-4 rounded-full font-bold text-[10px] uppercase tracking-wider", currentRecord?.juma && "bg-emerald-500 hover:bg-emerald-600")}
                        onClick={() => handleExtraPrayerUpdate('juma', !currentRecord?.juma)}
                      >
                        {currentRecord?.juma ? "Қатыстым" : "Белгілеу"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
    </>
  );
}
