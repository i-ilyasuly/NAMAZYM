import React, { useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Users2, User } from "lucide-react";
import { Button } from "./ui/button";
import { QuranVerseLive } from "./QuranVerseLive";
import { LocationHeader } from "./home/LocationHeader";
import { CalendarStrip } from "./home/CalendarStrip";
import { PrayerList } from "./home/PrayerList";
import { PrayerRecord, PrayerStatus } from "../store";
import { cn } from "../lib/utils";

interface HomeScreenProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  hijriDate: string;
  locationName: string;
  locationError: string;
  isLoadingLocation: boolean;
  setIsLocationSearchOpen: (open: boolean) => void;
  currentStreak: number;
  streakAnimationTrigger?: number;
  statusStreaks: Record<string, number>;
  getStatusStreakConfig: (status: string) => any;
  showQuranSettings: boolean;
  setShowQuranSettings: (show: boolean) => void;
  PRAYER_BLOCK_SCALE: number;
  horizontalCalendarRef: React.RefObject<HTMLDivElement>;
  days: Date[];
  getDominantStatusColor: (date: string) => string | null;
  getStatusDotColor: (colorName: string | null) => string;
  prayerTimes: any;
  prayers: any[];
  expandedPrayerId: string | null;
  setExpandedPrayerId: (id: string | null) => void;
  currentRecord: PrayerRecord | null;
  gender: string | null;
  weeklyRecords: Record<string, PrayerRecord>;
  historyMap: Record<string, PrayerStatus[]>;
  setExpansionStep: (step: "status" | "context") => void;
  expansionStep: "status" | "context";
  setSelectedPrayer: (id: string | null) => void;
  setTempStatus: (status: PrayerStatus | null) => void;
  setTempContext: (context: string[]) => void;
  tempStatus: PrayerStatus | null;
  tempContext: string[];
  handleExtraPrayerUpdate: (id: string, val: any) => void;
  handleExtraPrayerUpdates: (updates: any) => void;
  handleStatusUpdate: () => void;
  showExtraPrayerSheet: boolean;
  setShowExtraPrayerSheet: (show: any) => void;
  isDarkMode: boolean;
  isStarrySky: boolean;
  backgroundType: string;
  contexts: any[];
  startTransition: (scope: () => void) => void;
}

export const HomeScreen = React.memo(({
  selectedDate,
  setSelectedDate,
  hijriDate,
  locationName,
  locationError,
  isLoadingLocation,
  setIsLocationSearchOpen,
  currentStreak,
  streakAnimationTrigger,
  statusStreaks,
  getStatusStreakConfig,
  showQuranSettings,
  setShowQuranSettings,
  PRAYER_BLOCK_SCALE,
  horizontalCalendarRef,
  days,
  getDominantStatusColor,
  getStatusDotColor,
  prayerTimes,
  prayers,
  expandedPrayerId,
  setExpandedPrayerId,
  currentRecord,
  gender,
  historyMap,
  setExpansionStep,
  expansionStep,
  setSelectedPrayer,
  setTempStatus,
  setTempContext,
  tempStatus,
  tempContext,
  handleExtraPrayerUpdate,
  handleExtraPrayerUpdates,
  handleStatusUpdate,
  showExtraPrayerSheet,
  setShowExtraPrayerSheet,
  isDarkMode,
  isStarrySky,
  backgroundType,
  contexts,
  startTransition,
}: HomeScreenProps) => {
  const { t } = useTranslation();
  const isSpecialBg = backgroundType !== 'stars' || (isDarkMode && isStarrySky);

  return (
    <div className="flex flex-col flex-1">
      <div className="px-4 py-2 space-y-4">
        <LocationHeader
          selectedDate={selectedDate}
          hijriDate={hijriDate}
          locationName={locationName}
          locationError={locationError}
          isLoadingLocation={isLoadingLocation}
          setIsLocationSearchOpen={setIsLocationSearchOpen}
          currentStreak={currentStreak}
          streakAnimationTrigger={streakAnimationTrigger}
          statusStreaks={statusStreaks}
          getStatusStreakConfig={getStatusStreakConfig}
          isSpecialBg={isSpecialBg}
        />
      </div>

      <div className="pt-2">
        <QuranVerseLive 
          showSettingsManaged={true} 
          isSettingsOpen={showQuranSettings}
          onSettingsToggle={setShowQuranSettings} 
        />
      </div>

      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-4 pt-2 pb-20 relative">
        <div style={{ zoom: PRAYER_BLOCK_SCALE } as React.CSSProperties} className="flex flex-col flex-1 max-w-full mx-auto w-full sm:max-w-sm">
          <CalendarStrip
            showQuranSettings={showQuranSettings}
            setShowQuranSettings={setShowQuranSettings}
            horizontalCalendarRef={horizontalCalendarRef}
            days={days}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            getDominantStatusColor={getDominantStatusColor}
            getStatusDotColor={getStatusDotColor}
          />

          <PrayerList
            prayers={prayers}
            prayerTimes={prayerTimes}
            currentRecord={currentRecord}
            historyMap={historyMap}
            expandedPrayerId={expandedPrayerId}
            setExpandedPrayerId={setExpandedPrayerId}
            expansionStep={expansionStep}
            setExpansionStep={setExpansionStep}
            tempStatus={tempStatus}
            setTempStatus={setTempStatus}
            tempContext={tempContext}
            setTempContext={setTempContext}
            contexts={contexts}
            handleStatusUpdate={handleStatusUpdate}
            setSelectedPrayer={setSelectedPrayer}
            gender={gender}
            handleExtraPrayerUpdate={handleExtraPrayerUpdate as any}
            handleExtraPrayerUpdates={handleExtraPrayerUpdates}
            showExtraPrayerSheet={showExtraPrayerSheet}
            setShowExtraPrayerSheet={setShowExtraPrayerSheet}
            isSpecialBg={isSpecialBg}
            startTransition={startTransition}
          />
          
          {/* Default Juma block that was part of HomeScreen */}
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
  );
});
