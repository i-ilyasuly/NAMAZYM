import React, { useEffect, useState, useRef, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs, limit, orderBy, writeBatch, deleteDoc, getDocFromServer } from "firebase/firestore";
import { format, subDays, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from "date-fns";
import { kk, ru } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { auth, db } from "./firebase";
import { useStore, PrayerStatus, PrayerRecord } from "./store";
import { fetchPrayerTimes } from "./lib/aladhan";
import { AuthScreen } from "./components/AuthScreen";
import { toast } from "sonner";
import { BottomNav } from "./components/BottomNav";
import { PrayerCard } from "./components/PrayerCard";
import NightSky from "./components/NightSky";
import { Moon as MoonComponent } from "./components/Moon";
import { PrayerRadarChart } from "./components/PrayerRadarChart";
import { PrayerRadarChart2 } from "./components/PrayerRadarChart2";
import { PrayerBarChart } from "./components/PrayerBarChart";
import { PrayerStackedBarChart } from "./components/PrayerStackedBarChart";
import { PrayerAreaChart } from "./components/PrayerAreaChart";
import { PrayerLineChart } from "./components/PrayerLineChart";
import { PrayerPieChart } from "./components/PrayerPieChart";
import { PrayerDonutChart } from "./components/PrayerDonutChart";
import { ShareScreen } from "./components/ShareScreen";
import { LocationSearchScreen } from "./components/LocationSearchScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { CommunityScreen } from "./components/CommunityScreen";
import { LeaderboardScreen } from "./components/LeaderboardScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { StatisticsScreen } from "./components/StatisticsScreen";
import { QuranVerseLive, QuranSettings } from "./components/QuranVerseLive";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "./components/ui/drawer";
import { Skeleton } from "./components/ui/skeleton";
import { Button } from "./components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Card, CardContent } from "./components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Switch } from "./components/ui/switch";
import { Separator } from "./components/ui/separator";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import {
  Moon,
  Sun,
  Plus,
  MapPin,
  Navigation,
  LogOut,
  User,
  Bell,
  Calculator,
  BarChart2,
  Home,
  Briefcase,
  GraduationCap,
  Plane,
  Bed,
  Car,
  HeartPulse,
  Users,
  UserPlus,
  Coffee,
  MoreHorizontal,
  Gamepad2,
  Film,
  Tv,
  BookOpen,
  Palette,
  Mic2,
  Trophy,
  UserCheck,
  Book,
  Dumbbell,
  ShoppingBag,
  Utensils,
  CloudRain,
  AlarmClock,
  Flower2,
  Check,
  Users2,
  Clock,
  X,
  Minus,
  Lock,
  BellRing,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Sunset,
  CloudSun,
  Share2,
  Stars,
  LayoutGrid,
  Ban,
  Flame,
  PieChart,
  BarChart3,
  LineChart,
  AreaChart,
  Activity,
  Hexagon,
  CircleDashed,
  AlignEndHorizontal,
  Loader2,
  Award,
  RefreshCw,
  Database,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  Globe,
  UserX
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { cn } from "./lib/utils";
import { calculateDelayPercent, calculateBaseNP, applyModifiers, aggregateDayScore, DayAggregationInput, PrayerName, PrayerLocation, KhushuLevel, prepareAggregationInput, calculateInactivityDecay } from "./lib/scoreEngine";
import "./i18n";

import { QuranProvider } from "./context/QuranContext";

export default function App() {
  return (
    <QuranProvider>
      <AppContent />
    </QuranProvider>
  );
}

function AppContent() {
  const { t, i18n } = useTranslation();
  const {
    user,
    setUser,
    isAuthReady,
    setAuthReady,
    gender,
    setGender,
    currentRecord,
    setCurrentRecord,
    prayerTimes,
    prayerTimesDate,
    setPrayerTimes,
    locationError,
    setLocationError,
    locationName,
    setLocationName,
    coordinates,
    setCoordinates,
    calculationMethod,
    setCalculationMethod,
    isDarkMode,
    setIsDarkMode,
    username,
    setUsername,
    bio,
    setBio,
    showChartMarkers,
    setShowChartMarkers,
    showChartPriceLine,
    setShowChartPriceLine,
    showChartCommunity,
    setShowChartCommunity,
    showChartMA,
    setShowChartMA,
    chartType,
    setChartType,
    isPrivate,
    setIsPrivate
  } = useStore();

  // Force refresh if method changed to 2 (ҚМДБ)
  useEffect(() => {
    if (calculationMethod !== 2) {
      setPrayerTimes(null, "");
      setCalculationMethod(2);
    }
  }, [calculationMethod, setPrayerTimes, setCalculationMethod]);

  const [activeTab, setActiveTab] = useState<
    "home" | "calendar" | "statistics" | "settings" | "analytics" | "leaderboard" | "community"
  >("home");
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [expandedPrayerId, setExpandedPrayerId] = useState<string | null>(null);
  const [expansionStep, setExpansionStep] = useState<"status" | "context">("status");
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<"status" | "context">("status");
  const [tempStatus, setTempStatus] = useState<PrayerStatus | null>(null);
  const [tempContext, setTempContext] = useState<string[]>([]);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [showQuranSettings, setShowQuranSettings] = useState(false);
  const [isStarrySky, setIsStarrySky] = useState(true);
  const [hijriDate, setHijriDate] = useState("");
  const [statsData, setStatsData] = useState<any[]>([]);
  const [allStatsRecords, setAllStatsRecords] = useState<PrayerRecord[] | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<number>(() => parseInt(localStorage.getItem("statsPeriod") || "7"));
  const [activeChartType, setActiveChartType] = useState<string>(() => localStorage.getItem("activeChartType") || "donut");
  const [statisticsSubTab, setStatisticsSubTab] = useState<"stats" | "calendar">(() => (localStorage.getItem("statisticsSubTab") as "stats" | "calendar") || "stats");
  const [statsStatus, setStatsStatus] = useState<string>(() => localStorage.getItem("statsStatus") || "all");
  const [isGeneratingMock, setIsGeneratingMock] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingGender, setIsCheckingGender] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isShareScreenOpen, setIsShareScreenOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem("statsPeriod", statsPeriod.toString());
  }, [statsPeriod]);

  useEffect(() => {
    localStorage.setItem("activeChartType", activeChartType);
  }, [activeChartType]);

  useEffect(() => {
    localStorage.setItem("statisticsSubTab", statisticsSubTab);
  }, [statisticsSubTab]);

  useEffect(() => {
    localStorage.setItem("statsStatus", statsStatus);
  }, [statsStatus]);


  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [setupUsername, setSetupUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  // Telegram WebApp Integration
  useEffect(() => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      // Sync with Telegram theme colors if possible
      const tgTheme = tg.themeParams;
      if (tgTheme.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tgTheme.bg_color);
      }
    }
  }, []);

  const statsNeedsRefresh = useRef(false);
  const lastFetchedPeriod = useRef<number | null>(null);
  const horizontalCalendarRef = useRef<HTMLDivElement>(null);

  const lastSelectedDate = useRef(selectedDate);
  const isFirstHomeRender = useRef(true);

  useEffect(() => {
    if (activeTab !== "home") {
      isFirstHomeRender.current = true;
      return;
    }

    const performScroll = () => {
      const c = horizontalCalendarRef.current;
      if (!c || c.clientWidth === 0) return;

      const selectedBtn = c.querySelector('[data-selected="true"]') as HTMLElement;
      if (!selectedBtn) return;

      const targetScrollLeft = selectedBtn.offsetLeft - (c.clientWidth - selectedBtn.offsetWidth) / 2;

      const isDateChanged = lastSelectedDate.current !== selectedDate;
      const behavior: ScrollBehavior =
        isDateChanged && !isFirstHomeRender.current ? "smooth" : "auto";

      c.scrollTo({ left: Math.max(0, targetScrollLeft), behavior });
      lastSelectedDate.current = selectedDate;
      isFirstHomeRender.current = false;
    };

    let rafId = requestAnimationFrame(() => requestAnimationFrame(performScroll));
    const timer1 = setTimeout(performScroll, 150);
    const timer2 = setTimeout(performScroll, 600);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeTab, selectedDate]);

  const [calendarWeekStart, setCalendarWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [calendarView, setCalendarView] = useState<"weekly" | "monthly">("weekly");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [weeklyRecords, setWeeklyRecords] = useState<Record<string, PrayerRecord>>({});
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  const prayers = [
    { id: "fajr", name: t("fajr"), time: prayerTimes?.fajr },
    { id: "sunrise", name: t("sunrise"), time: prayerTimes?.sunrise, isPseudo: true },
    { id: "dhuhr", name: t("dhuhr"), time: prayerTimes?.dhuhr },
    { id: "asr", name: t("asr"), time: prayerTimes?.asr },
    { id: "maghrib", name: t("maghrib"), time: prayerTimes?.maghrib },
    { id: "isha", name: t("isha"), time: prayerTimes?.isha },
  ];

  const weeklyProgress = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start, end });
    
    let totalPrayers = 0;
    let completedPrayers = 0;
    
    daysInWeek.forEach(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const record = weeklyRecords[dateStr];
      if (record) {
        prayers.forEach(p => {
          if (p.isPseudo) return;
          totalPrayers++;
          const status = record[p.id as keyof PrayerRecord];
          if (status === "prayed" || status === "congregation" || status === "delayed") {
            completedPrayers++;
          }
        });
      }
    });
    
    return totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
  }, [weeklyRecords, prayers]);

  const quotes = [
    "Намаз — мүміннің миғражы.",
    "Намаз — діннің тірегі.",
    "Намаз — жүректің нұры.",
    "Намаз — жәннаттың кілті.",
    "Намаз — Алламен тілдесу.",
    "Намаз — екі дүние бақыты.",
    "Намаз — пенде мен Раббысының арасындағы байланыс."
  ];

  const dailyQuote = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return quotes[dayOfYear % quotes.length];
  }, []);

  const statusStreaks = useMemo(() => {
    const prayerIds = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const streaks: Record<string, number> = {
      congregation: 0,
      prayed: 0,
      delayed: 0,
      missed: 0
    };

    const statuses: PrayerStatus[] = ["congregation", "prayed", "delayed", "missed"];
    
    // Calculate current streak for each status
    // A streak is consecutive days where at least one prayer has this status? 
    // Or consecutive prayers? Let's go with consecutive days for simplicity and consistency with the "Fire" streak.
    // Actually, the user wants it to be like the fire streak.
    
    statuses.forEach(status => {
      let count = 0;
      let date = new Date();
      
      while (true) {
        const dateStr = format(date, "yyyy-MM-dd");
        const record = weeklyRecords[dateStr];
        
        if (!record) break;
        
        // Check if any prayer this day has this status
        const hasStatus = prayerIds.some(pid => record[pid as keyof PrayerRecord] === status);
        
        if (hasStatus) {
          count++;
          date = subDays(date, 1);
        } else {
          break;
        }
      }
      streaks[status] = count;
    });

    return streaks;
  }, [weeklyRecords]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) { // minimum swipe distance
      if (diff > 0) {
        // swipe left -> go to monthly
        setCalendarView("monthly");
      } else {
        // swipe right -> go to weekly
        setCalendarView("weekly");
      }
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.username) setUsername(data.username);
          if (data.bio) setBio(data.bio);
          if (data.gender) setGender(data.gender);
          if (data.isPrivate !== undefined) setIsPrivate(data.isPrivate);
        }
      } catch (error) {
        console.error("Error fetching user profile (profile fetcher):", error instanceof Error ? error.message : error);
      }
    };
    
    if (user && isAuthReady) {
      fetchUserProfile();
    }
  }, [user, isAuthReady, setUsername, setBio, setGender]);

  const calculateStreak = async () => {
    if (!user) return;
    
    const q = query(
      collection(db, "users", user.uid, "prayer_records"),
      orderBy("date", "desc"),
      limit(365)
    );
    
    try {
      const querySnapshot = await getDocs(q);
      const recordsMap = new Map<string, PrayerRecord>();
      querySnapshot.docs.forEach(doc => recordsMap.set(doc.id, doc.data() as PrayerRecord));
      
      let streak = 0;
      let dateToCheck = new Date();
      const todayStr = format(dateToCheck, "yyyy-MM-dd");
      
      const isPerfectDay = (record: PrayerRecord) => {
        const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
        return prayers.every(p => {
          const status = record[p as keyof PrayerRecord];
          return status === "prayed" || status === "congregation" || status === "delayed" || status === "menstruation";
        });
      };

      // Check today
      const todayRecord = recordsMap.get(todayStr);
      if (todayRecord && isPerfectDay(todayRecord)) {
        streak++;
      }

      // Check previous days
      dateToCheck = subDays(dateToCheck, 1);
      while (true) {
        const dateStr = format(dateToCheck, "yyyy-MM-dd");
        const record = recordsMap.get(dateStr);
        if (record && isPerfectDay(record)) {
          streak++;
          dateToCheck = subDays(dateToCheck, 1);
        } else {
          break;
        }
      }
      
      setCurrentStreak(streak);
    } catch (error) {
      console.error("Error calculating streak:", error);
    }
  };

  useEffect(() => {
    if (user && isAuthReady) {
      calculateStreak();
      
      // --- INACTIVITY DECAY CHECK ---
      const checkDecay = async () => {
        const lastLoginStr = localStorage.getItem(`last_login_${user.uid}`);
        const todayStr = format(new Date(), "yyyy-MM-dd");
        
        if (lastLoginStr && lastLoginStr !== todayStr) {
          const lastLoginDate = new Date(lastLoginStr);
          const todayDate = new Date(todayStr);
          const diffDays = Math.floor((todayDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 1) {
            // Apply decay for missed days
            try {
              const prevDateStr = format(subDays(todayDate, diffDays), "yyyy-MM-dd");
              const prevScoreSnap = await getDoc(doc(db, "users", user.uid, "daily_scores", prevDateStr));
              
              if (prevScoreSnap.exists()) {
                let currentClose = prevScoreSnap.data().candle?.close || 50.00;
                const batch = writeBatch(db);
                
                for (let i = 1; i < diffDays; i++) {
                  const decayDate = format(subDays(todayDate, diffDays - i), "yyyy-MM-dd");
                  const decayedClose = calculateInactivityDecay(currentClose, 1);
                  
                  const scoreRef = doc(db, "users", user.uid, "daily_scores", decayDate);
                  batch.set(scoreRef, {
                    date: decayDate,
                    candle: {
                      open: currentClose,
                      high: currentClose,
                      low: decayedClose,
                      close: decayedClose
                    },
                    daily_summary: {
                      total_np: decayedClose,
                      fard_count: 0,
                      missed_count: 5, // Assume all missed if not logged
                      delayed_count: 0,
                      streak_eligible: false
                    },
                    updatedAt: serverTimestamp(),
                    isDecay: true
                  }, { merge: true });
                  
                  currentClose = decayedClose;
                }
                await batch.commit();
              }
            } catch (error) {
              console.error("Error applying inactivity decay:", error);
            }
          }
        }
        localStorage.setItem(`last_login_${user.uid}`, todayStr);
      };
      
      checkDecay();
    }
  }, [user, isAuthReady, currentRecord]);

  // Generate Mock Data for Testing
  const generateMockData = async () => {
    if (!user) return;
    setIsGeneratingMock(true);
    const statuses: PrayerStatus[] = ["prayed", "congregation", "delayed", "missed"];
    
    try {
      const batch = writeBatch(db);
      // We need to generate from oldest to newest for NI continuity
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        
        const record = {
          uid: user.uid,
          date: dateStr,
          fajr: statuses[Math.floor(Math.random() * statuses.length)],
          dhuhr: statuses[Math.floor(Math.random() * statuses.length)],
          asr: statuses[Math.floor(Math.random() * statuses.length)],
          maghrib: statuses[Math.floor(Math.random() * statuses.length)],
          isha: statuses[Math.floor(Math.random() * statuses.length)],
          updatedAt: serverTimestamp(),
        };
        
        const docRef = doc(db, "users", user.uid, "prayer_records", dateStr);
        batch.set(docRef, record, { merge: true });
      }
      
      await batch.commit();
      toast.success("Тест деректері сәтті жасалды!");
      fetchStats(true);
    } catch (error) {
      console.error("Error generating mock data:", error);
      toast.error("Тест деректерін жасау кезінде қате шықты.");
    } finally {
      setIsGeneratingMock(false);
    }
  };

  const syncAllData = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const recordsSnap = await getDocs(query(collection(db, "users", user.uid, "prayer_records"), orderBy("date", "asc")));
      const records = recordsSnap.docs.map(d => d.data() as PrayerRecord);
      
      // Delete orphaned daily_scores (mock data that doesn't exist in prayer_records)
      const scoresSnap = await getDocs(collection(db, "users", user.uid, "daily_scores"));
      const validDates = new Set(records.map(r => r.date));
      
      // Use batches for both deletions and updates to improve performance
      let batch = writeBatch(db);
      let operationCount = 0;
      
      const commitBatchIfNeeded = async () => {
        if (operationCount >= 400) { // Firestore batch limit is 500
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      };

      for (const docSnap of scoresSnap.docs) {
        if (!validDates.has(docSnap.id)) {
          batch.delete(docSnap.ref);
          operationCount++;
          await commitBatchIfNeeded();
        }
      }

      let prevClose = 50.00;
      for (const record of records) {
        const aggregationInput = prepareAggregationInput(record, gender || 'male');
        const dayScore = aggregateDayScore(aggregationInput, prevClose);
        
        const docRef = doc(db, "users", user.uid, "daily_scores", record.date);
        batch.set(docRef, {
          date: record.date,
          ...dayScore,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        operationCount++;
        await commitBatchIfNeeded();
        
        prevClose = dayScore.candle.close;
      }
      
      // Update lastNI in profile
      const userRef = doc(db, "users", user.uid);
      batch.set(userRef, { lastNI: prevClose, updatedAt: serverTimestamp() }, { merge: true });
      
      await batch.commit();
      
      toast.success("Деректер синхрондалды!");
    } catch (error) {
      console.error("Error syncing data:", error);
      toast.error("Синхрондау кезінде қате шықты.");
    } finally {
      setIsSyncing(false);
    }
  };

  const processStats = (records: PrayerRecord[], days: number) => {
    const filteredRecords = records.slice(0, days);
    const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const processedData = prayers.map(p => {
      const prayedCount = filteredRecords.filter(r => r[p as keyof PrayerRecord] === "prayed").length;
      const congregationCount = filteredRecords.filter(r => r[p as keyof PrayerRecord] === "congregation").length;
      const delayedCount = filteredRecords.filter(r => r[p as keyof PrayerRecord] === "delayed").length;
      const missedCount = filteredRecords.filter(r => r[p as keyof PrayerRecord] === "missed").length;
      const menstruationCount = filteredRecords.filter(r => r[p as keyof PrayerRecord] === "menstruation").length;
      
      return {
        prayer: t(p),
        prayed: gender === "female" ? prayedCount + congregationCount : prayedCount,
        congregation: gender === "female" ? 0 : congregationCount,
        delayed: delayedCount,
        missed: missedCount,
        menstruation: menstruationCount,
        fullMark: days
      };
    });
    
    setStatsData(processedData);
  };

  const fetchStats = async (forceRefresh = false) => {
    if (!user) return;
    
    if (allStatsRecords === null || forceRefresh) {
      // If we already have records from the real-time listener, use them
      const recordsArray = (Object.values(weeklyRecords) as PrayerRecord[]).sort((a, b) => b.date.localeCompare(a.date));
      if (recordsArray.length > 0 && !forceRefresh) {
        setAllStatsRecords(recordsArray);
        processStats(recordsArray, statsPeriod);
        return;
      }

      setIsLoadingStats(true);
      const q = query(
        collection(db, "users", user.uid, "prayer_records"),
        orderBy("date", "desc"),
        limit(3650)
      );
      
      try {
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => doc.data() as PrayerRecord);
        setAllStatsRecords(records);
        processStats(records, statsPeriod);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    } else {
      processStats(allStatsRecords, statsPeriod);
    }
  };

  useEffect(() => {
    if (activeTab === "statistics" && user) {
      if (statsNeedsRefresh.current || lastFetchedPeriod.current !== statsPeriod) {
        fetchStats(statsNeedsRefresh.current);
        statsNeedsRefresh.current = false;
        lastFetchedPeriod.current = statsPeriod;
      }
    }
  }, [activeTab, user, statsPeriod]);

  useEffect(() => {
    if ((activeTab === "calendar" || activeTab === "home") && user) {
      let startDate, endDate;
      
      if (activeTab === "home") {
        startDate = format(subDays(new Date(), 60), "yyyy-MM-dd");
        endDate = format(new Date(), "yyyy-MM-dd");
      } else {
        // In calendar tab, we need data for the whole current month view
        // Plus some buffer for the weekly view
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const viewStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const viewEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        
        startDate = format(subDays(viewStart, 7), "yyyy-MM-dd"); // Add buffer
        endDate = format(addDays(viewEnd, 7), "yyyy-MM-dd");
      }
      
      const q = query(
        collection(db, "users", user.uid, "prayer_records"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setWeeklyRecords(prev => {
          const records = { ...prev };
          snapshot.docs.forEach(doc => {
            records[doc.id] = doc.data() as PrayerRecord;
          });
          return records;
        });
      });
      
      return () => unsubscribe();
    }
  }, [activeTab, user, currentMonth]);

  const handleCalendarCellClick = (date: string, prayerId: string) => {
    setSelectedDate(date);
    setSelectedPrayer(prayerId);
    
    // Check if record exists for that date
    const record = weeklyRecords[date];
    if (record && record[prayerId as keyof PrayerRecord]) {
      setTempStatus(record[prayerId as keyof PrayerRecord] as PrayerStatus);
    } else {
      setTempStatus(null);
    }
    
    setIsStatusDrawerOpen(true);
  };

  const getStatusColor = (status: PrayerStatus | undefined) => {
    switch (status) {
      case "prayed": 
        return gender === "female" 
          ? "bg-emerald-500 border-emerald-700 dark:border-emerald-400"
          : "bg-blue-500 border-blue-700 dark:border-blue-400";
      case "congregation": return "bg-emerald-500 border-emerald-700 dark:border-emerald-400";
      case "delayed": return "bg-rose-500 border-rose-700 dark:border-rose-400";
      case "missed": return "bg-zinc-900 border-zinc-950 dark:bg-zinc-100 dark:border-zinc-300";
      case "menstruation": return "bg-pink-500 border-pink-700 dark:border-pink-400";
      default: return "bg-zinc-100 dark:bg-zinc-800";
    }
  };

  const getStatusDotColorForCell = (status: PrayerStatus | undefined) => {
    switch (status) {
      case "prayed": return gender === "female" ? "bg-emerald-500" : "bg-blue-500";
      case "congregation": return "bg-emerald-500";
      case "delayed": return "bg-rose-500";
      case "missed": return "bg-zinc-900 dark:bg-zinc-100";
      case "menstruation": return "bg-pink-500";
      default: return "bg-transparent";
    }
  };

  const getStatusStreakConfig = (status: string) => {
    switch (status) {
      case "congregation": return { icon: Users2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      case "prayed": return { icon: User, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
      case "delayed": return { icon: Clock, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
      case "missed": return { icon: Ban, color: "text-zinc-900 dark:text-zinc-100", bg: "bg-zinc-500/10", border: "border-zinc-500/20" };
      default: return { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    }
  };

  const getDominantStatusColor = (dateStr: string) => {
    const record = weeklyRecords[dateStr];
    if (!record) return "bg-transparent";

    const statuses: PrayerStatus[] = [
      record.fajr as PrayerStatus,
      record.dhuhr as PrayerStatus,
      record.asr as PrayerStatus,
      record.maghrib as PrayerStatus,
      record.isha as PrayerStatus
    ].filter(s => s && s !== "none");

    if (statuses.length === 0) return "bg-transparent";

    const counts: Record<string, number> = {};
    statuses.forEach(s => {
      counts[s] = (counts[s] || 0) + 1;
    });

    const priority: PrayerStatus[] = ["congregation", "prayed", "delayed", "missed", "menstruation"];
    
    let highestCount = 0;
    Object.values(counts).forEach(c => {
      if (c > highestCount) highestCount = c;
    });

    let dominant: PrayerStatus = "none";
    for (const p of priority) {
      if (counts[p] === highestCount) {
        dominant = p;
        break;
      }
    }

    switch (dominant) {
      case "congregation": return "emerald";
      case "prayed": return gender === "female" ? "emerald" : "blue";
      case "delayed": return "rose";
      case "missed": return "zinc";
      case "menstruation": return "pink";
      default: return null;
    }
  };

  const getDynamicDayScore = (dateStr: string) => {
    const record = weeklyRecords[dateStr];
    if (!record) return { score: 0, colorClass: "bg-transparent", sizePx: 6 };

    const statuses: PrayerStatus[] = [
      record.fajr as PrayerStatus,
      record.dhuhr as PrayerStatus,
      record.asr as PrayerStatus,
      record.maghrib as PrayerStatus,
      record.isha as PrayerStatus
    ].filter(s => s && s !== "none");

    if (statuses.length === 0) return { score: 0, colorClass: "bg-transparent", sizePx: 6 };

    let score = 0;
    let hasMenstruation = false;

    statuses.forEach(s => {
      if (s === "congregation") score += 20;
      else if (s === "prayed") score += (gender === "female" ? 20 : 15);
      else if (s === "delayed") score += 5;
      else if (s === "menstruation") hasMenstruation = true;
    });

    if (hasMenstruation) {
      return { score: 100, colorClass: "bg-pink-500", sizePx: 24 };
    }

    const dominantColorName = getDominantStatusColor(dateStr);
    let colorClass = "bg-transparent";
    
    if (dominantColorName === "emerald") colorClass = "bg-emerald-500";
    else if (dominantColorName === "blue") colorClass = "bg-blue-500";
    else if (dominantColorName === "rose") colorClass = "bg-rose-500";
    else if (dominantColorName === "zinc") colorClass = "bg-zinc-500";
    else if (dominantColorName === "pink") colorClass = "bg-pink-500";

    // Calculate exact size based on score (from 8px to 24px)
    const sizePx = score === 0 ? 8 : 10 + (score / 100) * 14;

    return { score, colorClass, sizePx };
  };

  const getStatusDotColor = (colorName: string | null) => {
    switch (colorName) {
      case "emerald": return "bg-emerald-500";
      case "blue": return "bg-blue-500";
      case "rose": return "bg-rose-500";
      case "zinc": return "bg-zinc-500";
      case "pink": return "bg-pink-500";
      default: return "bg-transparent";
    }
  };

  const getStatusBgColor = (colorName: string | null) => {
    switch (colorName) {
      case "emerald": return "bg-emerald-500/40 dark:bg-emerald-500/50";
      case "blue": return "bg-blue-500/40 dark:bg-blue-500/50";
      case "rose": return "bg-rose-500/40 dark:bg-rose-500/50";
      case "zinc": return "bg-zinc-500/40 dark:bg-zinc-500/50";
      case "pink": return "bg-pink-500/40 dark:bg-pink-500/50";
      default: return "bg-transparent";
    }
  };

  useEffect(() => {
    if (activeTab === "calendar") {
      const container = document.getElementById("calendar-scroll-container");
      if (container) {
        container.scrollLeft = container.scrollWidth;
      }
    }
  }, [activeTab]);

  // Initialize dark mode and Hijri date
  useEffect(() => {
    const isDark =
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
    
    const starryPref = localStorage.getItem("starrySky");
    setIsStarrySky(starryPref === null ? true : starryPref === "true");

    if (isDark) {
      document.documentElement.classList.add("dark");
    }

    try {
      const hijri = new Intl.DateTimeFormat(i18n.language === "kk" ? "kk-KZ-u-ca-islamic" : "ru-RU-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
      // Remove "б.з.д.", "ж." and other common suffixes
      setHijriDate(hijri.replace(/б\.з\.д\.|ж\.|г\./g, "").trim());
    } catch (e) {
      setHijriDate("");
    }
  }, [i18n.language]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const toggleStarrySky = () => {
    const newMode = !isStarrySky;
    setIsStarrySky(newMode);
    localStorage.setItem("starrySky", String(newMode));
  };

  // Auth Listener
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firestore connection test failed: the client is offline. This might indicate an incorrect Firebase configuration.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true); // Unblock UI immediately
      
      if (currentUser) {
        setIsCheckingGender(true); // Ensure we are in checking state when user logs in
        // Run Firestore operations in background
        (async () => {
          try {
            const userRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const data = userDoc.data();
              // If gender is missing, we need to ask for it
              if (!data.gender) {
                setGender(null);
              } else {
                setGender(data.gender);
              }
              
              // Update last login and Telegram info if available
              // @ts-ignore
              const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
              const tgData: any = {
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
              };

              if (tgUser) {
                tgData.telegramId = tgUser.id;
                tgData.telegramUser = tgUser.username;
              }

              await setDoc(userRef, tgData, { merge: true });
            } else {
              // Brand new user
              setGender(null);
              // @ts-ignore
              const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
              const initialUsername = tgUser?.username 
                ? `@${tgUser.username}` 
                : "@user" + currentUser.uid.slice(-4);

              const newUserData: any = {
                uid: currentUser.uid,
                displayName: currentUser.displayName || tgUser?.first_name,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                username: initialUsername,
                username_lower: initialUsername.toLowerCase(),
                isPrivate: false,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
              };

              if (tgUser) {
                newUserData.telegramId = tgUser.id;
                newUserData.telegramUser = tgUser.username;
              }

              await setDoc(userRef, newUserData);
            }
          } catch (error) {
            console.error("Error in auth state change document fetch:", error instanceof Error ? error.message : error);
          } finally {
            setIsCheckingGender(false);
          }
        })();
      } else {
        setIsCheckingGender(false);
        setGender(null); // Clear gender on logout
      }
    });
    return unsubscribe;
  }, [setUser, setAuthReady, setGender]);

  // Real-time listener for ALL user records to keep stats in sync and fast
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(
      collection(db, "users", user.uid, "prayer_records"),
      orderBy("date", "desc"),
      limit(365) // Cache last year of data for instant stats
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => doc.data() as PrayerRecord);
      setAllStatsRecords(records);
      processStats(records, statsPeriod);
    }, (error) => {
      console.error("Error in stats real-time listener:", error);
    });

    return unsubscribe;
  }, [user, isAuthReady, statsPeriod]);

  // Fetch Location & Prayer Times
  const fetchLocationAndTimes = (force = false) => {
    if (!user) return;

    const todayStr = format(new Date(), "yyyy-MM-dd");
    
    // Check if we already have today's prayer times
    if (!force && prayerTimesDate === todayStr && prayerTimes) {
      return; // Skip fetching if we already have today's times
    }

    // If we have coordinates saved, use them instead of geolocation
    if (coordinates && !force) {
      fetchPrayerTimes(coordinates.lat, coordinates.lng, new Date(), calculationMethod).then(times => {
        if (times) {
          setPrayerTimes(times, todayStr);
          setLocationError(null);
        }
      });
      return;
    }

    setIsLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const times = await fetchPrayerTimes(latitude, longitude, new Date(), calculationMethod);
          if (times) {
            setPrayerTimes(times, todayStr);
            setCoordinates({ lat: latitude, lng: longitude });
            setLocationError(null);
            
            // Try to get location name
            try {
              const lang = i18n.language === "kk" ? "kk" : "ru";
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=${lang}`
              );
              const data = await response.json();
              if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.county;
                const detail = data.address.suburb || data.address.neighbourhood || data.address.road || data.address.state;
                const firstWordDetail = detail ? detail.split(/[ ,./]/)[0] : "";
                const formatted = city ? (firstWordDetail && firstWordDetail !== city ? `${city}, ${firstWordDetail}` : city) : (detail || "Unknown");
                setLocationName(formatted);
              }
            } catch (e) {
              console.error("Reverse geocoding failed", e);
            }
          } else {
            setLocationError(t("location_error"));
          }
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError(t("location_error"));
          setIsLoadingLocation(false);
        },
      );
    } else {
      setLocationError(t("location_error"));
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchLocationAndTimes();
  }, [user, t, prayerTimes, setLocationError]);

  // Firestore Listener for Selected Date's Record
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const docRef = doc(db, "users", user.uid, "prayer_records", selectedDate);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setCurrentRecord(snapshot.data() as PrayerRecord);
        } else {
          // Initialize empty record
          setCurrentRecord({
            uid: user.uid,
            date: selectedDate,
            fajr: "none",
            dhuhr: "none",
            asr: "none",
            maghrib: "none",
            isha: "none",
            updatedAt: new Date(),
          });
        }
      },
      (error) => {
        console.error("Firestore error:", error);
      },
    );

    return unsubscribe;
  }, [user, isAuthReady, selectedDate, setCurrentRecord]);

  // Auto-missed logic: Automatically mark prayers as 'missed' if the next prayer time has arrived
  useEffect(() => {
    if (!user || !prayerTimes || !currentRecord || currentRecord.date !== format(new Date(), "yyyy-MM-dd")) return;

    const checkMissed = async () => {
      const now = new Date();
      const prayerIds = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
      
      // Define when each prayer is considered "missed" (when the next prayer starts)
      const nextPrayerTimes: Record<string, string> = {
        fajr: prayerTimes.dhuhr,
        dhuhr: prayerTimes.asr,
        asr: prayerTimes.maghrib,
        maghrib: prayerTimes.isha,
        isha: "23:59", // Isha ends at the end of the day for this logic
      };

      let hasChanges = false;
      const updates: any = {};

      for (const id of prayerIds) {
        const nextTimeStr = nextPrayerTimes[id];
        if (!nextTimeStr) continue;

        const [h, m] = nextTimeStr.split(":").map(Number);
        const nextTime = new Date();
        nextTime.setHours(h, m, 0, 0);

        if (now > nextTime && currentRecord[id as keyof PrayerRecord] === "none") {
          updates[id] = "missed";
          hasChanges = true;
        }
      }

      if (hasChanges) {
        const docRef = doc(db, "users", user.uid, "prayer_records", currentRecord.date);
        try {
          // Include essential fields to satisfy security rules (uid, date and other statuses)
          await setDoc(docRef, { 
            ...currentRecord, 
            ...updates, 
            updatedAt: serverTimestamp() 
          }, { merge: true });
        } catch (e) {
          console.error("Auto-missed update failed", e);
        }
      }
    };

    // Run once on load/update
    checkMissed();

    // Also run every minute to catch transitions
    const interval = setInterval(checkMissed, 60000);
    return () => clearInterval(interval);
  }, [user, prayerTimes, currentRecord]);

  const handleExtraPrayerUpdate = async (prayerId: string, value: any) => {
    if (!user) return;

    const dateStr = selectedDate;
    const docRef = doc(db, "users", user.uid, "prayer_records", dateStr);

    try {
      let recordToUpdate = currentRecord;
      if (dateStr !== format(new Date(), "yyyy-MM-dd")) {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          recordToUpdate = snap.data() as PrayerRecord;
        } else {
          recordToUpdate = {
            uid: user.uid,
            date: dateStr,
            fajr: "none",
            dhuhr: "none",
            asr: "none",
            maghrib: "none",
            isha: "none",
            updatedAt: new Date(),
          };
        }
      }

      const updatedRecord = {
        ...recordToUpdate,
        [prayerId]: value,
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, updatedRecord, { merge: true });

      // We should also recalculate the daily score if needed, but for now just update the record
      // The daily score aggregation can be called here similarly to handleStatusUpdate
      // --- AGGREGATE DAY SCORE ---
      try {
        // Fetch previous day's close for continuity
        const prevDateStr = format(subDays(new Date(dateStr), 1), "yyyy-MM-dd");
        const prevScoreSnap = await getDoc(doc(db, "users", user.uid, "daily_scores", prevDateStr));
        const prevClose = prevScoreSnap.exists() ? prevScoreSnap.data().candle?.close : 50.00;

        const aggregationInput = prepareAggregationInput(updatedRecord, gender || 'male');
        const dayScore = aggregateDayScore(aggregationInput, prevClose);
        
        const dailyScoreRef = doc(db, "users", user.uid, "daily_scores", dateStr);
        await setDoc(dailyScoreRef, {
          date: dateStr,
          ...dayScore,
          updatedAt: serverTimestamp()
        }, { merge: true });

      } catch (aggError) {
        console.error("Error aggregating day score:", aggError);
      }
      // --- END AGGREGATE ---

      statsNeedsRefresh.current = true;
    } catch (error) {
      console.error("Error updating extra prayer:", error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!user || !selectedPrayer || !tempStatus) return;

    const dateStr = selectedDate;
    const docRef = doc(db, "users", user.uid, "prayer_records", dateStr);

    try {
      // Fetch current record for that date if it's not today's record
      let recordToUpdate = currentRecord;
      if (dateStr !== format(new Date(), "yyyy-MM-dd")) {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          recordToUpdate = snap.data() as PrayerRecord;
        } else {
          recordToUpdate = {
            uid: user.uid,
            date: dateStr,
            fajr: "none",
            dhuhr: "none",
            asr: "none",
            maghrib: "none",
            isha: "none",
            updatedAt: new Date(),
          };
        }
      }

      // --- NP ENGINE LOGIC START ---
      let finalNP = 0;
      let breakdown = null;
      
      if (tempStatus !== "none") {
        // 1. Determine location from context
        let location: PrayerLocation = "unknown";
        let congregation = false;
        let aloneAtMosque = false;
        
        if (tempContext.includes("mosque")) {
          location = "mosque";
          if (tempContext.includes("alone")) aloneAtMosque = true;
          else congregation = true;
        } else if (tempContext.includes("home")) {
          location = "home";
          if (tempContext.includes("congregation")) congregation = true;
        } else if (tempContext.includes("work")) {
          location = "work_mosque";
          if (tempContext.includes("congregation")) congregation = true;
        } else if (tempContext.includes("travel")) {
          location = "travel";
        } else if (tempContext.includes("hospital")) {
          location = "hospital";
        }

        // 2. Calculate Base NP
        const baseNP = calculateBaseNP(tempStatus, location, congregation, aloneAtMosque);

        // 3. Calculate Delay (if applicable)
        let delayPercent = null;
        let delayZone: any = null;
        let windowMinutes = null;
        
        if (tempStatus === "delayed" || tempStatus === "prayed") {
           // For now, we'll use a simplified delay calculation if we don't have exact times
           // In a full implementation, we'd use the actual prayer times from `prayerTimes`
           if (tempStatus === "delayed") {
             delayPercent = 80; // Placeholder: assume 80% delayed if marked as delayed
             delayZone = "delayed";
             windowMinutes = 120; // Placeholder: 2 hour window
           } else {
             delayPercent = 10; // Placeholder: 10% into the window
             delayZone = "on_time";
             windowMinutes = 120;
           }
        }

        // 4. Apply Modifiers
        const khushuRating = 3; // Default to 3 (normal) for now. Future UI can set this.
        const rawatibMultiplier = 1.0; // Default to 1.0. Future UI can set this based on sunnah checkboxes.
        
        const result = applyModifiers(
          baseNP,
          tempStatus,
          delayZone,
          delayPercent,
          windowMinutes,
          khushuRating,
          rawatibMultiplier,
          selectedPrayer as PrayerName,
          gender === "female"
        );
        
        finalNP = result.finalNP;
        breakdown = result.breakdown;
      }
      // --- NP ENGINE LOGIC END ---

      const updatedRecord = {
        ...recordToUpdate,
        [selectedPrayer]: tempStatus,
        contexts: {
          ...(recordToUpdate?.contexts || {}),
          [selectedPrayer]: tempContext,
        },
        np_scores: {
          ...(recordToUpdate?.np_scores || {}),
          [selectedPrayer]: finalNP
        },
        np_breakdown: {
          ...(recordToUpdate?.np_breakdown || {}),
          [selectedPrayer]: breakdown
        },
        updatedAt: serverTimestamp(),
      };

      // Automatically set witr if Isha is prayed
      if (selectedPrayer === 'isha') {
        updatedRecord.witr = tempStatus === 'prayed' || tempStatus === 'congregation';
      }

      await setDoc(docRef, updatedRecord, { merge: true });

      // --- AGGREGATE DAY SCORE ---
      // We need to calculate the total day score and save it to daily_scores collection
      try {
        // Fetch previous day's close for continuity
        const prevDateStr = format(subDays(new Date(dateStr), 1), "yyyy-MM-dd");
        const prevScoreSnap = await getDoc(doc(db, "users", user.uid, "daily_scores", prevDateStr));
        const prevClose = prevScoreSnap.exists() ? prevScoreSnap.data().candle?.close : 50.00;

        const aggregationInput = prepareAggregationInput(updatedRecord, gender || 'male');
        const dayScore = aggregateDayScore(aggregationInput, prevClose);
        
        // Save to daily_scores collection
        const dailyScoreRef = doc(db, "users", user.uid, "daily_scores", dateStr);
        await setDoc(dailyScoreRef, {
          date: dateStr,
          ...dayScore,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Update lastNI on user profile if this is today
        if (dateStr === format(new Date(), "yyyy-MM-dd")) {
          await setDoc(doc(db, "users", user.uid), {
            lastNI: dayScore.candle.close,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

      } catch (aggError) {
        console.error("Error aggregating day score:", aggError);
      }
      // --- END AGGREGATE ---

      statsNeedsRefresh.current = true;
      setIsStatusDrawerOpen(false);
      setDrawerStep("status");
      setExpandedPrayerId(null);
      setExpansionStep("status");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Username Validation logic
  useEffect(() => {
    if (!setupUsername) {
      setUsernameError("");
      return;
    }

    const validateUsername = async () => {
      if (setupUsername.length < 5) {
        setUsernameError("Ник кемінде 5 әріптен тұруы керек");
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(setupUsername)) {
        setUsernameError("Тек латын әріптері, сандар және _ (астыңғы сызық) рұқсат етілген");
        return;
      }

      setIsCheckingUsername(true);
      try {
        const lowerUsername = setupUsername.toLowerCase();
        const q = query(collection(db, "users"), where("username_lower", "==", `@${lowerUsername}`));
        const snap = await getDocs(q);
        if (!snap.empty && snap.docs[0].id !== user?.uid) {
          setUsernameError("Бұл ник бос емес");
        } else {
          setUsernameError("");
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(validateUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [setupUsername, user]);

  if (!isAuthReady) {
    return <LoadingScreen message={t("loading")} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleSaveSetupUsername = async () => {
    if (!user || usernameError || setupUsername.length < 5 || isCheckingUsername) return;
    
    setIsSavingSetup(true);
    try {
      const lowerUsername = setupUsername.toLowerCase();
      const formattedUsername = `@${lowerUsername}`;
      await setDoc(doc(db, "users", user.uid), {
        username: formattedUsername,
        username_lower: formattedUsername.toLowerCase(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUsername(formattedUsername);
      setIsUsernameModalOpen(false);
      toast.success("Ник сәтті сақталды!");
    } catch (error) {
      console.error("Error saving username:", error);
      toast.error("Қате шықты");
    } finally {
      setIsSavingSetup(false);
    }
  };

  const contexts = [
    { id: "home", icon: Home, label: t("ctx_home"), color: "text-emerald-500" },
    {
      id: "work",
      icon: Briefcase,
      label: t("ctx_work"),
      color: "text-blue-500",
    },
    {
      id: "education",
      icon: GraduationCap,
      label: t("ctx_education"),
      color: "text-indigo-500",
    },
    {
      id: "travel",
      icon: Plane,
      label: t("ctx_travel"),
      color: "text-sky-500",
    },
    { id: "sleep", icon: Bed, label: t("ctx_sleep"), color: "text-amber-700" },
    {
      id: "traffic",
      icon: Car,
      label: t("ctx_traffic"),
      color: "text-rose-500",
    },
    {
      id: "health",
      icon: HeartPulse,
      label: t("ctx_health"),
      color: "text-rose-400",
    },
    {
      id: "family",
      icon: Users,
      label: t("ctx_family"),
      color: "text-orange-500",
    },
    {
      id: "friends",
      icon: UserPlus,
      label: t("ctx_friends"),
      color: "text-cyan-500",
    },
    {
      id: "leisure",
      icon: Coffee,
      label: t("ctx_leisure"),
      color: "text-amber-500",
    },
    {
      id: "gaming",
      icon: Gamepad2,
      label: t("ctx_gaming"),
      color: "text-purple-500",
    },
    {
      id: "movies",
      icon: Film,
      label: t("ctx_movies"),
      color: "text-indigo-400",
    },
    {
      id: "tv",
      icon: Tv,
      label: t("ctx_tv"),
      color: "text-slate-600",
    },
    {
      id: "quran",
      icon: BookOpen,
      label: t("ctx_quran"),
      color: "text-emerald-600",
    },
    {
      id: "hobbies",
      icon: Palette,
      label: t("ctx_hobbies"),
      color: "text-pink-500",
    },
    {
      id: "dawah",
      icon: Mic2,
      label: t("ctx_dawah"),
      color: "text-amber-600",
    },
    {
      id: "sports",
      icon: Trophy,
      label: t("ctx_sports"),
      color: "text-yellow-600",
    },
    {
      id: "guests",
      icon: UserCheck,
      label: t("ctx_guests"),
      color: "text-teal-500",
    },
    {
      id: "reading",
      icon: Book,
      label: t("ctx_reading"),
      color: "text-blue-600",
    },
    {
      id: "exercise",
      icon: Dumbbell,
      label: t("ctx_exercise"),
      color: "text-red-500",
    },
    {
      id: "shopping",
      icon: ShoppingBag,
      label: t("ctx_shopping"),
      color: "text-violet-500",
    },
    {
      id: "food",
      icon: Utensils,
      label: t("ctx_food"),
      color: "text-orange-400",
    },
    {
      id: "lockdown",
      icon: Lock,
      label: t("ctx_lockdown"),
      color: "text-slate-700",
    },
    {
      id: "notifications",
      icon: BellRing,
      label: t("ctx_notifications"),
      color: "text-yellow-500",
    },
    {
      id: "weather",
      icon: CloudRain,
      label: t("ctx_weather"),
      color: "text-blue-400",
    },
    {
      id: "alarm",
      icon: AlarmClock,
      label: t("ctx_alarm"),
      color: "text-red-600",
    },
    {
      id: "other",
      icon: MoreHorizontal,
      label: t("ctx_other"),
      color: "text-slate-500",
    },
  ];

  return (
    <div className={cn(
      "h-[100dvh] overflow-hidden font-sans text-foreground transition-colors duration-300 flex flex-col",
      activeTab === "home" && isDarkMode && isStarrySky ? "bg-transparent" : "bg-background"
    )}>
      {/* Username Setup Modal */}
      <Dialog open={isUsernameModalOpen} onOpenChange={(open) => {
        // Prevent closing if username is not set
        if (!username && !open) return;
        setIsUsernameModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md rounded-3xl" showCloseButton={!!username}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Қош келдіңіз!</DialogTitle>
            <DialogDescription className="text-center">
              Жобаны толық пайдалану үшін өзіңізге бірегей ник (username) ойлап табыңыз.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 relative">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground font-bold">@</span>
                <Input
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value.toLowerCase())}
                  placeholder="username"
                  className={cn(
                    "pl-8 h-12 rounded-xl text-lg",
                    usernameError ? "border-rose-500 focus-visible:ring-rose-500" : 
                    (setupUsername.length >= 5 && !isCheckingUsername ? "border-emerald-500 focus-visible:ring-emerald-500" : "")
                  )}
                  maxLength={20}
                />
                <div className="absolute right-3 flex items-center">
                  {isCheckingUsername && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                  {!isCheckingUsername && setupUsername.length >= 5 && !usernameError && (
                    <Check className="w-5 h-5 text-emerald-500" />
                  )}
                  {!isCheckingUsername && usernameError && (
                    <X className="w-5 h-5 text-rose-500" />
                  )}
                </div>
              </div>
              {usernameError ? (
                <p className="text-sm text-rose-500 font-medium pl-1">{usernameError}</p>
              ) : setupUsername.length >= 5 && !isCheckingUsername ? (
                <p className="text-sm text-emerald-500 font-medium pl-1">Бұл ник бос!</p>
              ) : (
                <p className="text-xs text-muted-foreground pl-1">Кемінде 5 әріп немесе сан. Үтір, нүкте рұқсат етілмейді.</p>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={handleSaveSetupUsername} 
              disabled={!!usernameError || setupUsername.length < 5 || isCheckingUsername || isSavingSetup}
              className="w-full h-12 rounded-xl text-lg font-bold"
            >
              {isSavingSetup ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Сақтау және Жалғастыру
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeTab === "home" && isDarkMode && isStarrySky && <NightSky />}
      <main className="flex-1 flex flex-col max-w-full mx-auto w-full p-4 pt-6 overflow-y-auto custom-scrollbar border-x border-muted/10">
        {activeTab === "home" && (
          <div className="flex flex-col flex-1">
            <div className="space-y-2 relative">
              {activeTab === "home" && isDarkMode && isStarrySky && (
                <div className="absolute -left-12 -top-12 z-0 opacity-100 pointer-events-none">
                  <MoonComponent size={140} className="scale-x-[-1] opacity-90" />
                </div>
              )}
              
              <div className="flex items-center justify-between relative z-10">
                <div className={cn(
                  "flex flex-col gap-1 transition-all duration-500",
                  activeTab === "home" && isDarkMode && isStarrySky && "mix-blend-difference"
                )}>
                  <h1 className={cn(
                    "text-2xl font-bold tracking-tight leading-none",
                    activeTab === "home" && isDarkMode && isStarrySky ? "text-white" : "text-foreground"
                  )}>
                    {format(new Date(selectedDate), "d MMMM", { locale: i18n.language === "kk" ? kk : ru })}
                  </h1>
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    activeTab === "home" && isDarkMode && isStarrySky ? "text-white/80" : "text-muted-foreground"
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
                      className="flex overflow-x-auto no-scrollbar gap-2 snap-x snap-mandatory py-1 px-1 relative" 
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
        )}


        

        {activeTab === "statistics" && (
          <StatisticsScreen
            user={user}
            t={t}
            gender={gender}
            statisticsSubTab={statisticsSubTab}
            setStatisticsSubTab={setStatisticsSubTab}
            statsPeriod={statsPeriod}
            setStatsPeriod={setStatsPeriod}
            statsStatus={statsStatus}
            setStatsStatus={setStatsStatus}
            activeChartType={activeChartType}
            setActiveChartType={setActiveChartType}
            isLoadingStats={isLoadingStats}
            statsData={statsData}
            isGeneratingMock={isGeneratingMock}
            generateMockData={generateMockData}
            setIsShareScreenOpen={setIsShareScreenOpen}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            calendarWeekStart={calendarWeekStart}
            setCalendarWeekStart={setCalendarWeekStart}
            weeklyRecords={weeklyRecords}
            handleCalendarCellClick={handleCalendarCellClick}
            getDominantStatusColor={getDominantStatusColor}
            getStatusDotColor={getStatusDotColor}
            getStatusDotColorForCell={getStatusDotColorForCell}
            getDynamicDayScore={getDynamicDayScore}
            setActiveTab={setActiveTab}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsScreen currentStreak={currentStreak} />
        )}

        {activeTab === "community" && (
          <CommunityScreen />
        )}

        {activeTab === "settings" && (
          <SettingsScreen
            setActiveTab={setActiveTab}
            setIsShareScreenOpen={setIsShareScreenOpen}
            toggleDarkMode={toggleDarkMode}
            toggleStarrySky={toggleStarrySky}
            isStarrySky={isStarrySky}
            generateMockData={generateMockData}
            isGeneratingMock={isGeneratingMock}
            setIsLogoutDialogOpen={setIsLogoutDialogOpen}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardScreen />
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      {/* Logout Confirmation Dialog */}
      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
        <AlertDialogContent className="max-w-[90%] sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("logout_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("logout_confirm_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsLogoutDialogOpen(false);
                setGender(null);
                setUser(null);
                setCurrentRecord(null);
                auth.signOut();
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {t("yes_logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gender Selection Dialog */}
      <AlertDialog open={!isCheckingGender && user !== null && !gender}>
        <AlertDialogContent className="max-w-[90%] sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Қош келдіңіз!</AlertDialogTitle>
            <AlertDialogDescription>
              Қосымшаны толық пайдалану үшін жынысыңызды көрсетіңіз. Бұл статистиканы дұрыс есептеу үшін қажет (мысалы, әйелдер үшін хайз күндері).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button 
              variant="outline" 
              className="h-14 justify-start px-6"
              onClick={async () => {
                setGender("male");
                if (user) {
                  await setDoc(doc(db, "users", user.uid), { 
                    uid: user.uid,
                    email: user.email,
                    gender: "male",
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mr-4">
                <User className="w-4 h-4" />
              </div>
              <span className="text-base font-medium">Ер адам</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-14 justify-start px-6"
              onClick={async () => {
                setGender("female");
                if (user) {
                  await setDoc(doc(db, "users", user.uid), { 
                    uid: user.uid,
                    email: user.email,
                    gender: "female",
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 flex items-center justify-center mr-4">
                <User className="w-4 h-4" />
              </div>
              <span className="text-base font-medium">Әйел адам</span>
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer open={isStatusDrawerOpen} onOpenChange={setIsStatusDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-md p-6 overflow-y-auto custom-scrollbar">
            <DrawerHeader className="px-0 pt-0">
              <DrawerTitle className="text-2xl font-black tracking-tight text-center uppercase">
                {drawerStep === "status"
                  ? prayers.find((p) => p.id === selectedPrayer)?.name
                  : t("context")}
              </DrawerTitle>
            </DrawerHeader>

            {drawerStep === "status" ? (
              <>
                <div className="flex flex-col bg-card rounded-2xl border border-muted/40 overflow-hidden shadow-sm">
                  <button
                    className={cn(
                      "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                      tempStatus === "prayed"
                        ? "bg-muted/50"
                        : "hover:bg-muted/30",
                    )}
                    onClick={() => setTempStatus("prayed")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          tempStatus === "prayed"
                            ? (gender === "female" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600")
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                        )}
                      >
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">
                        {t("status_prayed")}
                      </span>
                    </div>
                    {tempStatus === "prayed" && (
                      <div className={cn("w-2 h-2 rounded-full", gender === "female" ? "bg-emerald-500" : "bg-blue-500")} />
                    )}
                  </button>
                  {gender === "male" && (
                    <button
                      className={cn(
                        "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                        tempStatus === "congregation"
                          ? "bg-muted/50"
                          : "hover:bg-muted/30",
                      )}
                      onClick={() => setTempStatus("congregation")}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            tempStatus === "congregation"
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                          )}
                        >
                          <Users2 className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">
                          {t("status_congregation")}
                        </span>
                      </div>
                      {tempStatus === "congregation" && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  )}
                  <button
                    className={cn(
                      "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                      tempStatus === "delayed"
                        ? "bg-muted/50"
                        : "hover:bg-muted/30",
                    )}
                    onClick={() => setTempStatus("delayed")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          tempStatus === "delayed"
                            ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                        )}
                      >
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">
                        {t("status_delayed")}
                      </span>
                    </div>
                    {tempStatus === "delayed" && (
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                  <button
                    className={cn(
                      "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                      tempStatus === "missed"
                        ? "bg-muted/50"
                        : "hover:bg-muted/30",
                    )}
                    onClick={() => setTempStatus("missed")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          tempStatus === "missed"
                            ? "bg-zinc-900 dark:bg-zinc-950 text-zinc-100 border border-zinc-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                        )}
                      >
                        <Ban className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">
                        {t("status_missed")}
                      </span>
                    </div>
                    {tempStatus === "missed" && (
                      <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    )}
                  </button>
                  {gender === "female" && (
                    <button
                      className={cn(
                        "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                        tempStatus === "menstruation"
                          ? "bg-muted/50"
                          : "hover:bg-muted/30",
                      )}
                      onClick={() => setTempStatus("menstruation")}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            tempStatus === "menstruation"
                              ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                          )}
                        >
                          <Flower2 className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">
                          {t("status_menstruation")}
                        </span>
                      </div>
                      {tempStatus === "menstruation" && (
                        <div className="w-2 h-2 rounded-full bg-pink-500" />
                      )}
                    </button>
                  )}
                  <button
                    className={cn(
                      "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                      tempStatus === "none"
                        ? "bg-muted/50"
                        : "hover:bg-muted/30",
                    )}
                    onClick={() => setTempStatus("none")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          tempStatus === "none"
                            ? "bg-slate-200 dark:bg-slate-700 text-slate-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                        )}
                      >
                        <Minus className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">
                        {t("status_none")}
                      </span>
                    </div>
                    {tempStatus === "none" && (
                      <div className="w-2 h-2 rounded-full bg-slate-500" />
                    )}
                  </button>
                </div>

                <div className="mt-6">
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (
                        tempStatus === "none" ||
                        tempStatus === "menstruation"
                      ) {
                        handleStatusUpdate();
                      } else {
                        setDrawerStep("context");
                      }
                    }}
                  >
                    {tempStatus === "none" || tempStatus === "menstruation"
                      ? t("save")
                      : t("next")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 text-center">
                      {t("select_context")}
                    </h3>
                    <p className="text-[10px] text-muted-foreground/40 text-center uppercase tracking-tighter">
                      {t("optional_context")}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {contexts.map((ctx) => {
                      const isSelected = tempContext.includes(ctx.id);
                      const Icon = ctx.icon;
                      return (
                        <button
                          key={ctx.id}
                          onClick={() => {
                            if (isSelected) {
                              setTempContext(tempContext.filter((id) => id !== ctx.id));
                            } else if (tempContext.length < 5) {
                              setTempContext([...tempContext, ctx.id]);
                            }
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 gap-2 group relative overflow-hidden",
                            isSelected
                              ? "bg-primary border-primary shadow-md shadow-primary/20 scale-[1.02]"
                              : "bg-card border-muted/40 hover:border-muted-foreground/20 hover:bg-muted/30"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5 transition-colors",
                              isSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-tighter text-center leading-none",
                              isSelected ? "text-primary-foreground" : "text-muted-foreground/60"
                            )}
                          >
                            {ctx.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDrawerStep("status")}
                  >
                    {t("back")}
                  </Button>
                  <Button className="flex-1" onClick={handleStatusUpdate}>
                    {t("save")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
      <ShareScreen 
        isOpen={isShareScreenOpen} 
        onClose={() => setIsShareScreenOpen(false)} 
        user={user}
        statsData={statsData}
        currentStreak={currentStreak}
        weeklyRecords={weeklyRecords}
      />
      <LocationSearchScreen
        isOpen={isLocationSearchOpen}
        onClose={() => setIsLocationSearchOpen(false)}
        onLocationSelected={() => {
          // Additional logic if needed when location is selected
        }}
      />
    </div>
  );
}
