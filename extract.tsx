import * as fs from "fs";

const lines = fs.readFileSync("src/App.tsx", "utf-8").split("\n");

// We know from earlier logs that the Statistics tab rendering starts around 2330
// Let's find exactly the line numbers by regex
const startIdx = lines.findIndex(l => l.includes(`{activeTab === "statistics" && (`));
// The end is the closing div `          )}` before `{activeTab === "analytics" && (`
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes(`{activeTab === "analytics" && (`)) - 2;

if (startIdx !== -1 && endIdx !== -1) {
  const newLines = [
    ...lines.slice(0, startIdx + 1),
    `          <StatisticsScreen`,
    `            user={user}`,
    `            t={t}`,
    `            gender={gender}`,
    `            statisticsSubTab={statisticsSubTab}`,
    `            setStatisticsSubTab={setStatisticsSubTab}`,
    `            statsPeriod={statsPeriod}`,
    `            setStatsPeriod={setStatsPeriod}`,
    `            statsStatus={statsStatus}`,
    `            setStatsStatus={setStatsStatus}`,
    `            activeChartType={activeChartType}`,
    `            setActiveChartType={setActiveChartType}`,
    `            isLoadingStats={isLoadingStats}`,
    `            statsData={statsData}`,
    `            isGeneratingMock={isGeneratingMock}`,
    `            generateMockData={generateMockData}`,
    `            setIsShareScreenOpen={setIsShareScreenOpen}`,
    `            currentMonth={currentMonth}`,
    `            setCurrentMonth={setCurrentMonth}`,
    `            calendarWeekStart={calendarWeekStart}`,
    `            setCalendarWeekStart={setCalendarWeekStart}`,
    `            weeklyRecords={weeklyRecords}`,
    `            handleCalendarCellClick={handleCalendarCellClick}`,
    `            getDominantStatusColor={getDominantStatusColor}`,
    `            getStatusDotColor={getStatusDotColor}`,
    `            getStatusDotColorForCell={getStatusDotColorForCell}`,
    `            setActiveTab={setActiveTab}`,
    `            selectedDate={selectedDate}`,
    `            setSelectedDate={setSelectedDate}`,
    `          />`,
    ...lines.slice(endIdx + 1)
  ];
  fs.writeFileSync("src/App.tsx", newLines.join("\n"));
  
  // Now write the extracted component to src/components/StatisticsScreen.tsx EXACTLY as it was
  const componentContent = `import React from "react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays } from "date-fns";
import { Share2, LayoutGrid, Users2, User, Clock, Ban, Flower2, CircleDashed, PieChart, BarChart3, AlignEndHorizontal, LineChart, AreaChart, Activity, Hexagon, ChevronLeft, ChevronRight, BarChart2, Sunrise, Sun, CloudSun, Sunset, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "../lib/utils";

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
  setActiveTab,
  selectedDate,
  setSelectedDate
}: any) {
  return (
    <>
` + lines.slice(startIdx + 1, endIdx + 1).join("\n") + `
    </>
  );
}`;
  fs.writeFileSync("src/components/StatisticsScreen.tsx", componentContent);
  console.log("Extraction complete!");
} else {
  console.log("Could not find start or end index.");
}
