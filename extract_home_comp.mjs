import * as fs from "fs";

const lines = fs.readFileSync("src/App.tsx", "utf-8").split("\n");

const nightSkyIdx = lines.findIndex(l => l.includes(`{activeTab === "home" && isDarkMode && isStarrySky && <NightSky />} `) || l.includes(`{activeTab === "home" && isDarkMode && isStarrySky && <NightSky />}`));
const homeEndIdx = lines.findIndex(l => l.includes(`{activeTab === "statistics" && (`)) - 2;

// The returned code block starts around nightSkyIdx and ends around homeEndIdx.
// We also need to get the horizontalCalendar logic:
// Lines 280 to 318
const fileContent = `import React, { useRef, useEffect, useState } from "react";
import { format, addDays, getDay, isSameDay } from "date-fns";
import { kk, ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { Flame, Navigation, Loader2, Check, Plus, Minus, Moon, Sun, Users2, MapPin } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { NightSky } from "./NightSky";
import { Moon as MoonComponent } from "./Moon";
import { PrayerCard } from "./PrayerCard";

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
  isStarrySky
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
` + lines.slice(nightSkyIdx, homeEndIdx).join("\n")
// We need to clean up `activeTab === "home"` checks but it's okay to leave them or replace them
.replace(/activeTab === "home" && /g, "")
.replace(/\{activeTab === "home" && \(/g, "{true && (")
+ `    </>
  );
}
`;

fs.writeFileSync("src/components/HomeScreen.tsx", fileContent);
console.log("HomeScreen extracted");
