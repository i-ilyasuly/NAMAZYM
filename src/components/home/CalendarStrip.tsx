import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { cn } from "../../lib/utils";
import { QuranSettings } from "../QuranVerseLive";

interface CalendarStripProps {
  showQuranSettings: boolean;
  setShowQuranSettings: (show: boolean) => void;
  horizontalCalendarRef: React.RefObject<HTMLDivElement>;
  days: Date[];
  selectedDate: string;
  setSelectedDate: (dateStr: string) => void;
  getDominantStatusColor: (dateStr: string) => string | null;
  getStatusDotColor: (colorName: string | null) => string;
}

export const CalendarStrip: React.FC<CalendarStripProps> = React.memo(({
  showQuranSettings,
  setShowQuranSettings,
  horizontalCalendarRef,
  days,
  selectedDate,
  setSelectedDate,
  getDominantStatusColor,
  getStatusDotColor
}) => {
  return (
    <div className="mb-1 relative h-[56px] overflow-hidden w-full">
      <AnimatePresence>
        {showQuranSettings ? (
          <motion.div 
            key="quran-settings"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 pt-1 z-[1] flex justify-center w-full bg-white dark:bg-zinc-950 px-2 rounded-2xl border"
          >
             <QuranSettings onClose={() => setShowQuranSettings(false)} />
          </motion.div>
        ) : (
          <motion.div 
            key="calendar"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 flex overflow-x-auto no-scrollbar gap-1 snap-x snap-mandatory px-1" 
            ref={horizontalCalendarRef}
          >
            {days.map((day, i) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
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
                    "snap-center shrink-0 flex flex-col items-center justify-center min-w-[36px] py-1 transition-all",
                    isSelected 
                      ? "text-foreground font-black scale-110" 
                      : "text-muted-foreground hover:text-foreground",
                    isFuture && "opacity-30 cursor-not-allowed hover:text-muted-foreground"
                  )}
                >
                  <span className="text-[9px] font-medium uppercase mb-0.5">
                    {['Жк', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'][day.getDay()]}
                  </span>
                  <span className="text-[13px] leading-none mb-1">
                    {format(day, "d")}
                  </span>
                  <div className="h-[4px] mt-0.5 flex items-center justify-center w-full px-0.5">
                    {statusColorName && !isFuture ? (
                      <div className={cn(
                        "w-[5px] h-[5px] rounded-full",
                        isSelected ? dotColor : cn(dotColor, "opacity-40")
                      )} />
                    ) : (
                      <div className="w-[5px] h-[5px]" />
                    )}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
