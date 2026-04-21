import React from 'react';
import { format } from "date-fns";
import { kk } from "date-fns/locale";
import { Loader2, Navigation, Flame, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

interface LocationHeaderProps {
  selectedDate: string;
  hijriDate: string;
  locationName: string;
  locationError: string | null;
  isLoadingLocation: boolean;
  setIsLocationSearchOpen: (open: boolean) => void;
  currentStreak: number;
  streakAnimationTrigger?: number;
  statusStreaks: Record<string, number>;
  getStatusStreakConfig: (status: string) => any;
  isSpecialBg: boolean;
}

export const LocationHeader: React.FC<LocationHeaderProps> = React.memo(({
  selectedDate,
  hijriDate,
  locationName,
  locationError,
  isLoadingLocation,
  setIsLocationSearchOpen,
  currentStreak,
  streakAnimationTrigger = 0,
  statusStreaks,
  getStatusStreakConfig,
  isSpecialBg
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className={cn("text-2xl font-black tracking-tight transition-colors", isSpecialBg ? "text-white" : "text-foreground")}>
            {format(new Date(selectedDate), "d MMMM", { locale: kk })}
          </h1>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        </div>
        <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors", isSpecialBg ? "text-white/70" : "text-muted-foreground")}>
          <span>{format(new Date(selectedDate), "EEEE", { locale: kk })}</span>
          <span>•</span>
          <span className="truncate max-w-[120px]">{hijriDate}</span>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button 
            onClick={() => setIsLocationSearchOpen(true)}
            disabled={isLoadingLocation}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-[10px] font-bold transition-all active:scale-95 disabled:opacity-50",
              isSpecialBg ? "bg-black/20 border-white/10 text-white/80 hover:text-white hover:bg-black/40 backdrop-blur-sm" : "bg-muted/30 border-muted/5 text-muted-foreground hover:text-foreground"
            )}
          >
            {isLoadingLocation ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span className="max-w-[70px] truncate">{locationError || locationName || "Іздеу..."}</span>
          </button>
          
          <motion.div 
            key={streakAnimationTrigger}
            initial={streakAnimationTrigger > 0 ? { scale: 1.2, y: -2 } : false}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            className="relative"
          >
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-[10px] font-bold transition-colors overflow-visible relative",
              isSpecialBg ? "bg-black/20 border-white/10 text-white backdrop-blur-sm" : "bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400"
            )}>
              <AnimatePresence>
                {streakAnimationTrigger > 0 && (
                  <motion.div
                    key={`spark-${streakAnimationTrigger}`}
                    initial={{ opacity: 1, y: 0, scale: 0.5, rotate: -20 }}
                    animate={{ opacity: 0, y: -40, scale: 1.5, rotate: 20 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center justify-center text-orange-500"
                  >
                    <Sparkles className="w-4 h-4 fill-amber-400" />
                    <span className="font-black text-xs drop-shadow-sm ml-1 text-amber-500">+10</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                animate={streakAnimationTrigger > 0 ? {
                  scale: [1, 1.4, 0.9, 1.2, 1],
                  rotate: [0, -15, 15, -10, 0]
                } : {}}
                transition={{ duration: 0.5 }}
              >
                <Flame className={cn("w-3.5 h-3.5", isSpecialBg ? "text-orange-400" : "text-orange-500")} />
              </motion.div>
              <span>{currentStreak} күн</span>
            </div>
          </motion.div>
        </div>

        {/* Status streaks */}
        <div className="flex items-center gap-1">
          {['prayed', 'congregation'].map(status => {
            const count = statusStreaks[status] || 0;
            if (count < 2) return null;
            const config = getStatusStreakConfig(status);
            const Icon = config.icon;
            return (
              <div 
                key={status}
                className={cn(
                  "flex items-center justify-center w-[22px] h-[22px] rounded-lg border",
                  isSpecialBg ? "bg-black/20 border-white/10 text-white backdrop-blur-sm" : config.bg + " " + config.border,
                  config.color
                )}
                title={`${count} күн қатарынан`}
              >
                <div className="relative">
                  <Icon className="w-3 h-3" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-background flex items-center justify-center">
                    <span className="text-[6px] font-black leading-none">{count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
