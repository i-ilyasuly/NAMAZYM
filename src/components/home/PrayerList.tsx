import React from 'react';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { PrayerCard } from "../PrayerCard";
import { 
  ChevronLeft, 
  ChevronDown, 
  Check, 
  X,
  User, 
  Users2, 
  Clock, 
  Ban, 
  Flower2, 
  Plus, 
  Moon, 
  Sun 
} from "lucide-react";
import { PrayerRecord, PrayerStatus } from "../../store";

interface PrayerListProps {
  prayers: any[];
  prayerTimes: any;
  currentRecord: PrayerRecord | null;
  historyMap: Record<string, PrayerStatus[]>;
  expandedPrayerId: string | null;
  setExpandedPrayerId: (id: string | null) => void;
  expansionStep: "status" | "context";
  setExpansionStep: (step: "status" | "context") => void;
  tempStatus: PrayerStatus | null;
  setTempStatus: (status: PrayerStatus | null) => void;
  tempContext: string[];
  setTempContext: (context: string[]) => void;
  contexts: any[];
  handleStatusUpdate: () => void;
  setSelectedPrayer: (id: string | null) => void;
  gender: string | null;
  handleExtraPrayerUpdate: (id: keyof PrayerRecord, val: any) => void;
  handleExtraPrayerUpdates: (updates: any) => void;
  showExtraPrayerSheet: boolean;
  setShowExtraPrayerSheet: (val: any) => void;
  isSpecialBg: boolean;
  startTransition: (scope: () => void) => void;
}

export const PrayerList: React.FC<PrayerListProps> = React.memo(({
  prayers,
  prayerTimes,
  currentRecord,
  historyMap,
  expandedPrayerId,
  setExpandedPrayerId,
  expansionStep,
  setExpansionStep,
  tempStatus,
  setTempStatus,
  tempContext,
  setTempContext,
  contexts,
  handleStatusUpdate,
  setSelectedPrayer,
  gender,
  handleExtraPrayerUpdate,
  handleExtraPrayerUpdates,
  showExtraPrayerSheet,
  setShowExtraPrayerSheet,
  isSpecialBg,
  startTransition
}) => {

  return (
    <div className="flex-1 flex flex-col justify-start min-w-0 pb-[10px]">
      <LayoutGroup>
        <div 
          className={cn(
            "bg-white/80 dark:bg-zinc-900/60 border border-zinc-100/50 dark:border-zinc-800/50 rounded-3xl shadow-sm relative overflow-hidden transition-all duration-300 transform-gpu origin-top",
            isSpecialBg && "backdrop-blur-xl"
          )}
        >
          <div className="flex flex-col relative text-zinc-900 dark:text-zinc-100">
            {!prayerTimes
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[64px] w-full border-b border-zinc-100 dark:border-zinc-800/50 last:border-0" />
                ))
              : prayers.map((prayer, index) => {
              const isExpanded = expandedPrayerId === prayer.id;
              
              const rawStatus = currentRecord?.[prayer.id as keyof PrayerRecord];
              const status = prayer.isExtra 
                ? (rawStatus === true || rawStatus === "prayed" ? "prayed" : "none")
                : (rawStatus as PrayerStatus) || "none";
              
              const history = historyMap[prayer.id] || Array(7).fill("none");

              return (
                <div key={prayer.id} style={{ zIndex: 10 - index }} className={cn(
                  "flex flex-col border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors duration-300 relative",
                  isExpanded && "bg-zinc-50/50 dark:bg-zinc-800/20"
                )}>
                  <PrayerCard
                    id={prayer.id}
                    name={prayer.name}
                    time={prayer.time || "--:--"}
                    status={status as PrayerStatus}
                    gender={gender || "male"}
                    noCard={true}
                    isExtra={prayer.isExtra}
                    history={history}
                    onClick={(e) => {
                      if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                      if (prayer.isPseudo) return;
                      
                      if (isExpanded) {
                        startTransition(() => {
                          setExpandedPrayerId(null);
                          setExpansionStep("status");
                        });
                      } else {
                        startTransition(() => {
                          setSelectedPrayer(prayer.id);
                          setTempStatus(status as any);
                          const existingContexts = currentRecord?.contexts?.[
                            prayer.id as keyof typeof currentRecord.contexts
                          ];
                          setTempContext(Array.isArray(existingContexts) ? existingContexts : []);
                          setExpandedPrayerId(prayer.id);
                          setExpansionStep("status");
                        });
                      }
                    }}
                  />
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-2">
                          {prayer.isExtra ? (
                            <div className="h-[48px] flex items-center justify-between px-2 gap-4">
                              <Button 
                                variant="ghost"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleExtraPrayerUpdate(prayer.id as keyof PrayerRecord, false);
                                  setExpandedPrayerId(null); 
                                }}
                                className="flex-1 h-10 rounded-full font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shadow-sm"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                              
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentIsDone = currentRecord?.[prayer.id as keyof PrayerRecord] === true || currentRecord?.[prayer.id as keyof PrayerRecord] === "prayed";
                                  handleExtraPrayerUpdate(prayer.id as keyof PrayerRecord, currentIsDone ? false : "prayed");
                                  setExpandedPrayerId(null);
                                }}
                                className={cn(
                                  "flex-1 h-10 rounded-full font-bold transition-all shadow-sm",
                                  (currentRecord?.[prayer.id as keyof PrayerRecord] === true || currentRecord?.[prayer.id as keyof PrayerRecord] === "prayed")
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                    : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                                )}
                              >
                                <Check className="w-5 h-5" />
                              </Button>
                            </div>
                          ) : (
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
                                    className="relative w-12 h-12 flex items-center justify-center transition-all touch-manipulation"
                                  >
                                    <motion.div
                                      animate={{ 
                                        scale: tempStatus === s.id ? 1.4 : 1,
                                      }}
                                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                      <s.icon className={cn("w-6 h-6", s.color)} />
                                    </motion.div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center w-full justify-between lg:items-stretch">
                                <button 
                                  onClick={() => setExpansionStep("status")}
                                  className="p-3 shrink-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors touch-manipulation"
                                >
                                  <ChevronLeft className="w-6 h-6" />
                                </button>
                                
                                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar scroll-smooth px-2">
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
                                        className="relative w-10 h-10 shrink-0 flex items-center justify-center transition-all active:scale-90 touch-manipulation"
                                      >
                                        <ctx.icon className={cn("w-5 h-5 relative z-10", isSelected ? ctx.color : "text-zinc-300 dark:text-zinc-600")} />
                                        {isSelected && (
                                          <motion.div 
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 0.15, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className={cn(
                                              "absolute inset-0 rounded-full blur-md -z-0",
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

                                <button 
                                  className="p-3 shrink-0 flex items-center justify-center text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors touch-manipulation"
                                  onClick={handleStatusUpdate}
                                >
                                  <Check className="w-7 h-7 font-black" />
                                </button>
                              </div>
                            )}
                          </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/50">
            <button
              onClick={() => setShowExtraPrayerSheet(prev => !prev)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="h-px w-5 bg-zinc-200 dark:bg-zinc-700" />
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">нәпіл намаздар</span>
                <div className="h-px w-5 bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-zinc-400">Қосу</span>
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 text-zinc-400 transition-transform duration-200",
                  showExtraPrayerSheet && "rotate-180"
                )} />
              </div>
            </button>

            <AnimatePresence>
              {showExtraPrayerSheet && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const isNowActive = !(currentRecord?.tahajjudActive || currentRecord?.tahajjud !== undefined);
                        handleExtraPrayerUpdates({
                          tahajjudActive: isNowActive,
                          ...(isNowActive ? { tahajjud: currentRecord?.tahajjud || "none" } : { tahajjud: undefined }),
                          ...(!currentRecord?.tahajjudRakats && isNowActive ? { tahajjudRakats: 2 } : {})
                        });
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left w-full",
                        (currentRecord?.tahajjudActive || currentRecord?.tahajjud !== undefined)
                          ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30"
                          : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        (currentRecord?.tahajjudActive || currentRecord?.tahajjud !== undefined) ? "bg-indigo-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                      )}>
                        <Moon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">Тахаджуд</p>
                        <p className="text-[10px] text-muted-foreground">Түнгі құлшылық</p>
                      </div>
                      {(currentRecord?.tahajjudActive || currentRecord?.tahajjud !== undefined) && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                    </button>
                    <button
                      onClick={() => {
                        const isNowActive = !(currentRecord?.duhaActive || currentRecord?.duha !== undefined);
                        handleExtraPrayerUpdates({
                          duhaActive: isNowActive,
                          ...(isNowActive ? { duha: currentRecord?.duha || "none" } : { duha: undefined }),
                          ...(!currentRecord?.duhaRakats && isNowActive ? { duhaRakats: 2 } : {})
                        });
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left w-full",
                        (currentRecord?.duhaActive || currentRecord?.duha !== undefined)
                          ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30"
                          : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        (currentRecord?.duhaActive || currentRecord?.duha !== undefined) ? "bg-amber-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                      )}>
                        <Sun className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">Духа</p>
                        <p className="text-[10px] text-muted-foreground">Сәске намазы</p>
                      </div>
                      {(currentRecord?.duhaActive || currentRecord?.duha !== undefined) && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </LayoutGroup>
    </div>
  );
});
