import React, { useEffect, useState, useRef, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs, limit, orderBy, writeBatch, deleteDoc } from "firebase/firestore";
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

// --- Settings Helper Components ---
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">
        {title}
      </h3>
      <div className="bg-card border rounded-3xl overflow-hidden divide-y">
        {children}
      </div>
    </div>
  );
}

function SettingsItem({ 
  icon, 
  bgColor, 
  title, 
  description, 
  onClick, 
  rightElement, 
  showChevron = true,
  disabled = false
}: { 
  icon: React.ReactNode; 
  bgColor: string; 
  title: string; 
  description: string; 
  onClick?: () => void; 
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
}) {
  const isClickable = onClick && !disabled;
  const Tag = isClickable && !rightElement ? "button" : "div";

  return (
    <Tag 
      type={Tag === "button" ? "button" : undefined}
      className={cn(
        "w-full flex items-center gap-4 p-4 text-left transition-colors",
        isClickable ? "hover:bg-muted/50 active:bg-muted cursor-pointer" : "cursor-default",
        disabled && "opacity-50"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", bgColor)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-none">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        {showChevron && onClick && !rightElement && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </div>
    </Tag>
  );
}

export default function App() {
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
  const [isStarrySky, setIsStarrySky] = useState(true);
  const [hijriDate, setHijriDate] = useState("");
  const [statsData, setStatsData] = useState<any[]>([]);
  const [allStatsRecords, setAllStatsRecords] = useState<PrayerRecord[] | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<number>(7);
  const [activeChartType, setActiveChartType] = useState<string>("donut");
  const [statsStatus, setStatsStatus] = useState<string>("all");
  const [isGeneratingMock, setIsGeneratingMock] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || "");
  const [tempBio, setTempBio] = useState(bio || "");
  const [isSyncing, setIsSyncing] = useState(false);
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isCheckingGender, setIsCheckingGender] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isShareScreenOpen, setIsShareScreenOpen] = useState(false);
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [setupUsername, setSetupUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  const statsNeedsRefresh = useRef(false);
  const lastFetchedPeriod = useRef<number | null>(null);
  const horizontalCalendarRef = useRef<HTMLDivElement>(null);

  const lastSelectedDate = useRef(selectedDate);
  const isFirstHomeRender = useRef(true);

  useEffect(() => {
    if (activeTab === "home" && horizontalCalendarRef.current) {
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

      // Try multiple times to ensure the scroll happens after layout is stable
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
        console.error("Error fetching user profile:", error);
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

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const q = query(collection(db, "users"), orderBy("lastNI", "desc"), limit(50));
      const snap = await getDocs(q);
      setLeaderboardUsers(snap.docs.map(d => d.data()));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === "leaderboard") {
      fetchLeaderboard();
    }
  }, [activeTab]);

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
        const records: Record<string, PrayerRecord> = { ...weeklyRecords };
        snapshot.docs.forEach(doc => {
          records[doc.id] = doc.data() as PrayerRecord;
        });
        setWeeklyRecords(records);
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
              
              // Update last login
              await setDoc(userRef, {
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                lastLogin: serverTimestamp()
              }, { merge: true });
            } else {
              // Brand new user
              setGender(null);
              await setDoc(userRef, {
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
              });
            }
          } catch (error) {
            console.error("Error in auth state change:", error);
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
          await setDoc(docRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
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

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSavingProfile(true);
    // Validate username
    const lowerUsername = tempUsername.trim().toLowerCase();
    let cleanUsername = lowerUsername;
    if (cleanUsername && !cleanUsername.startsWith("@")) {
      cleanUsername = "@" + cleanUsername;
    }
    
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        username: cleanUsername,
        username_lower: cleanUsername,
        bio: tempBio,
        gender: gender,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUsername(cleanUsername);
      setBio(tempBio);
      setIsProfileEditing(false);
      toast.success("Профиль сақталды!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Профильді сақтау кезінде қате шықты.");
    } finally {
      setIsSavingProfile(false);
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

  const handleTogglePrivate = async (checked: boolean) => {
    if (!user) return;
    setIsPrivate(checked);
    try {
      await setDoc(doc(db, "users", user.uid), {
        isPrivate: checked,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating privacy:", error);
      setIsPrivate(!checked); // Revert on error
      toast.error("Қате шықты");
    }
  };

  const handleSaveSetupUsername = async () => {
    if (!user || usernameError || setupUsername.length < 5 || isCheckingUsername) return;
    
    setIsSavingSetup(true);
    try {
      const lowerUsername = setupUsername.toLowerCase();
      const formattedUsername = `@${lowerUsername}`;
      await setDoc(doc(db, "users", user.uid), {
        username: formattedUsername,
        username_lower: formattedUsername,
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
                    {format(new Date(selectedDate), "d MMMM", { locale: i18n.language === "kk" ? kk : ru })}
                  </h1>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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

            <div className="mt-4 mb-2 px-[5%]">
              <div className="border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
                <div className="flex overflow-x-auto no-scrollbar gap-1 px-1 snap-x snap-mandatory" ref={horizontalCalendarRef}>
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const days = Array.from({ length: 60 }).map((_, i) => {
                      const d = new Date();
                      d.setHours(0, 0, 0, 0);
                      d.setDate(today.getDate() - 59 + i); // 59 days past + today
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
                            "snap-center shrink-0 flex flex-col items-center justify-center w-11 h-14 rounded-2xl transition-all",
                            isSelected 
                              ? "bg-zinc-100 dark:bg-zinc-800 text-foreground shadow-sm" 
                              : "bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-foreground",
                            isFuture && "opacity-50 cursor-not-allowed hover:bg-transparent"
                          )}
                        >
                          <span className={cn(
                            "text-[9px] font-medium uppercase mb-0.5",
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {['Жк', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'][day.getDay()]}
                          </span>
                          <span className="text-base font-bold leading-none">
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
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full pt-4 pb-32">
              <LayoutGroup>
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
                  <div className="flex flex-col">
                    {!prayerTimes
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-[64px] w-full border-b border-zinc-100 dark:border-zinc-800/50 last:border-0" />
                        ))
                      : prayers.map((prayer, index) => {
                      const isExpanded = expandedPrayerId === prayer.id;
                      const status = (currentRecord?.[prayer.id as keyof PrayerRecord] as PrayerStatus) || "none";
                      
                      return (
                        <div key={prayer.id} className={cn(
                          "flex flex-col border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors duration-300",
                          isExpanded && "bg-zinc-50/50 dark:bg-zinc-800/20"
                        )}>
                          <PrayerCard
                            id={prayer.id}
                            name={prayer.name}
                            time={prayer.time || "--:--"}
                            status={status}
                            gender={gender}
                            noCard={true}
                            onClick={() => {
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
        )}

        {activeTab === "calendar" && (
          <div 
            className="space-y-6 max-w-7xl mx-auto"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {t("calendar")}
                </h1>
              </div>

              <Tabs 
                value={calendarView} 
                onValueChange={(v: any) => setCalendarView(v)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted rounded-xl">
                  <TabsTrigger 
                    value="weekly" 
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold"
                  >
                    {t("weekly", { defaultValue: "Апталық" })}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="monthly" 
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold"
                  >
                    {t("monthly", { defaultValue: "Айлық" })}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {calendarView === "weekly" ? (
              <div className="bg-card rounded-2xl border border-muted/40 shadow-sm p-4 flex flex-col items-center w-full max-w-4xl mx-auto">
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
                                  
                                  // 2. Check for "Drop" in the entire week for this specific prayer
                                  // If there's any day where quality decreased, all lines for this prayer in this week disappear.
                                  const hasWeeklyDrop = (() => {
                                    const weekStart = startOfWeek(calendarWeekStart, { weekStartsOn: 1 });
                                    let lastRank = -1;
                                    
                                    for (let d = 0; d < 7; d++) {
                                      const dStr = format(addDays(weekStart, d), "yyyy-MM-dd");
                                      const r = weeklyRecords[dStr];
                                      const s = r ? (r[prayerId as keyof PrayerRecord] as PrayerStatus) : "none";
                                      const rnk = getStatusRank(s);
                                      
                                      if (rnk > 0) {
                                        if (lastRank !== -1 && rnk < lastRank) return true; // Drop detected!
                                        lastRank = rnk;
                                      }
                                    }
                                    return false;
                                  })();

                                  const hasNextLine = (() => {
                                    if (hasWeeklyDrop || currentRank === 0 || i >= 6) return false;
                                    
                                    const nextDay = addDays(day, 1);
                                    const nextDateStr = format(nextDay, "yyyy-MM-dd");
                                    const nextRecord = weeklyRecords[nextDateStr] || {};
                                    const nextStatus = nextRecord[prayerId as keyof PrayerRecord] as PrayerStatus;
                                    const nextRank = getStatusRank(nextStatus);
                                    
                                    // Line exists if next day is better or equal
                                    return nextRank >= currentRank;
                                  })();

                                  const hasPrevLine = (() => {
                                    if (hasWeeklyDrop || currentRank === 0 || i <= 0) return false;
                                    
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
                                            "absolute left-1/2 top-1/2 -translate-y-1/2 w-[48px] h-[2px] z-0 opacity-60",
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
            ) : (
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
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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
            </div>
            )}

          </div>
        )}

        {activeTab === "statistics" && (
          <div className="space-y-6 max-w-5xl mx-auto w-full">
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

              <div className="flex flex-col space-y-4 w-full">
                {/* 1. Chart Type Filter (Text & Icons combined for synced scrolling) */}
                <div className="w-full overflow-x-auto no-scrollbar pb-2">
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
                
                <div className="grid grid-cols-2 gap-3">
                  <Card className={cn(
                    "border-none shadow-none",
                    gender === "female" ? "bg-emerald-50/50 dark:bg-emerald-950/20" : "bg-blue-50/50 dark:bg-blue-950/20"
                  )}>
                    <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                      <span className={cn(
                        "text-xl font-bold",
                        gender === "female" ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                      )}>
                        {statsData.reduce((acc, curr) => acc + curr.prayed, 0)}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {t("status_prayed")}
                      </span>
                    </CardContent>
                  </Card>
                  {gender === "male" && (
                    <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-none shadow-none">
                      <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {statsData.reduce((acc, curr) => acc + curr.congregation, 0)}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {t("status_congregation")}
                        </span>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-none shadow-none">
                    <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                        {statsData.reduce((acc, curr) => acc + curr.delayed, 0)}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {t("status_delayed")}
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-100 dark:bg-zinc-950 border-none shadow-none">
                    <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {statsData.reduce((acc, curr) => acc + curr.missed, 0)}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {t("status_missed")}
                      </span>
                    </CardContent>
                  </Card>
                  {gender === "female" && (
                    <Card className="bg-pink-50/50 dark:bg-pink-950/20 border-none shadow-none">
                      <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
                          {statsData.reduce((acc, curr) => acc + ((curr as any).menstruation || 0), 0)}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {t("status_menstruation")}
                        </span>
                      </CardContent>
                    </Card>
                  )}
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
          </div>
        )}

        {activeTab === "analytics" && (
          <AnalyticsScreen currentStreak={currentStreak} />
        )}

        {activeTab === "community" && (
          <CommunityScreen />
        )}

        {activeTab === "settings" && (
          <div className="space-y-8 pb-28 px-4 pt-4 max-w-3xl mx-auto w-full">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center space-y-4 py-6 bg-card border rounded-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent" />
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-background shadow-2xl">
                  <AvatarImage src={user?.photoURL || ""} referrerPolicy="no-referrer" />
                  <AvatarFallback className="bg-muted"><User className="w-12 h-12 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="absolute bottom-0 right-0 rounded-full w-9 h-9 shadow-xl border-2 border-background"
                  onClick={() => setIsProfileEditing(true)}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1 relative z-10">
                <h2 className="text-2xl font-bold tracking-tight">{user?.displayName || "Пайдаланушы"}</h2>
                <p className="text-sm text-indigo-500 font-mono font-bold">{username || "@username"}</p>
                {bio && <p className="text-sm text-muted-foreground max-w-[250px] mx-auto italic mt-2">"{bio}"</p>}
              </div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-8">
              <SettingsSection title="Профиль және қатынас">
                <SettingsItem 
                  icon={<User className="w-5 h-5 text-blue-500" />}
                  bgColor="bg-blue-500/10"
                  title="Профильді өңдеу"
                  description="Логин мен бионы өзгерту"
                  onClick={() => setIsProfileEditing(true)}
                />
                <SettingsItem 
                  icon={<Share2 className="w-5 h-5 text-emerald-500" />}
                  bgColor="bg-emerald-500/10"
                  title="Достармен бөлісу"
                  description="Қосымшаны басқаларға ұсыну"
                  onClick={() => setIsShareScreenOpen(true)}
                />
              </SettingsSection>

              <SettingsSection title="Қолданба баптаулары">
                <SettingsItem 
                  icon={<Globe className="w-5 h-5 text-sky-500" />}
                  bgColor="bg-sky-500/10"
                  title="Тіл / Язык"
                  description={i18n.language === "kk" ? "Қазақша" : "Русский"}
                  rightElement={
                    <Select 
                      value={i18n.language} 
                      onValueChange={(val) => i18n.changeLanguage(val)}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-[10px] border-none bg-muted/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kk">Қазақша</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                <SettingsItem 
                  icon={<Trophy className="w-5 h-5 text-yellow-500" />}
                  bgColor="bg-yellow-500/10"
                  title="Рейтинг"
                  description="Пайдаланушылар көшбасшылар тақтасы"
                  onClick={() => setActiveTab("leaderboard")}
                />
                <SettingsItem 
                  icon={<Calculator className="w-5 h-5 text-indigo-500" />}
                  bgColor="bg-indigo-500/10"
                  title="Есептеу әдісі"
                  description={calculationMethod === 2 ? "Қазақстан (ҚМДБ)" : "Басқа әдіс"}
                  rightElement={
                    <Select 
                      value={calculationMethod.toString()} 
                      onValueChange={(val) => {
                        setCalculationMethod(parseInt(val));
                        setPrayerTimes(null, "");
                      }}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-[10px] border-none bg-muted/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">ҚМДБ</SelectItem>
                        <SelectItem value="14">САМР</SelectItem>
                        <SelectItem value="13">Diyanet</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                <SettingsItem 
                  icon={isDarkMode ? <Moon className="w-5 h-5 text-purple-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  bgColor={isDarkMode ? "bg-purple-500/10" : "bg-amber-500/10"}
                  title="Түнгі режим"
                  description="Көзге жайлы интерфейс"
                  rightElement={
                    <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                  }
                />
                {isDarkMode && (
                  <SettingsItem 
                    icon={<Sparkles className="w-5 h-5 text-indigo-500" />}
                    bgColor="bg-indigo-500/10"
                    title="Жұлдызды аспан"
                    description="Басты беттегі анимация"
                    rightElement={
                      <Switch checked={isStarrySky} onCheckedChange={toggleStarrySky} />
                    }
                  />
                )}
                <SettingsItem 
                  icon={<Bell className="w-5 h-5 text-rose-500" />}
                  bgColor="bg-rose-500/10"
                  title="Хабарламалар"
                  description="Намаз уақыттарын ескерту"
                  rightElement={<Switch checked={true} />}
                />
              </SettingsSection>

              <SettingsSection title="Аналитика баптаулары">
                <SettingsItem 
                  icon={<LineChart className="w-5 h-5 text-indigo-500" />}
                  bgColor="bg-indigo-500/10"
                  title="График түрі"
                  description="Аналитика графигінің стилі"
                  rightElement={
                    <Select 
                      value={chartType} 
                      onValueChange={(val: any) => setChartType(val)}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-[10px] border-none bg-muted/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baseline">Baseline</SelectItem>
                        <SelectItem value="candlestick">Шамдар (Кызыл/Жасыл)</SelectItem>
                        <SelectItem value="realtime">Realtime</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                <SettingsItem 
                  icon={<Activity className="w-5 h-5 text-emerald-500" />}
                  bgColor="bg-emerald-500/10"
                  title="Маркерлер"
                  description="Керемет/Қаза белгілері"
                  rightElement={
                    <Switch checked={showChartMarkers} onCheckedChange={setShowChartMarkers} />
                  }
                />
                <SettingsItem 
                  icon={<Target className="w-5 h-5 text-teal-500" />}
                  bgColor="bg-teal-500/10"
                  title="Мақсатты сызық"
                  description="80 ұпай деңгейі"
                  rightElement={
                    <Switch checked={showChartPriceLine} onCheckedChange={setShowChartPriceLine} />
                  }
                />
                <SettingsItem 
                  icon={<Users className="w-5 h-5 text-purple-500" />}
                  bgColor="bg-purple-500/10"
                  title="Қауымдастық"
                  description="Орташа көрсеткіш"
                  rightElement={
                    <Switch checked={showChartCommunity} onCheckedChange={setShowChartCommunity} />
                  }
                />
                <SettingsItem 
                  icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                  bgColor="bg-blue-500/10"
                  title="Жылжымалы орташа"
                  description="7 күндік тренд (MA)"
                  rightElement={
                    <Switch checked={showChartMA} onCheckedChange={setShowChartMA} />
                  }
                />
              </SettingsSection>

              <SettingsSection title="Құпиялылық және Қауіпсіздік">
                <SettingsItem 
                  icon={<Lock className="w-5 h-5 text-rose-500" />}
                  bgColor="bg-rose-500/10"
                  title="Профиль жабықтығы"
                  description="Тек достар ғана көре алады"
                  rightElement={<Switch checked={isPrivate} onCheckedChange={handleTogglePrivate} />}
                />
                <SettingsItem 
                  icon={<UserX className="w-5 h-5 text-slate-500" />}
                  bgColor="bg-slate-500/10"
                  title="Блокталған қолданушылар"
                  description="Блокталғандар тізімі"
                  onClick={() => {}}
                />
              </SettingsSection>

              <SettingsSection title="Деректерді басқару">
                <SettingsItem 
                  icon={<Database className="w-5 h-5 text-orange-500" />}
                  bgColor="bg-orange-500/10"
                  title="Тест деректері"
                  description="30 күндік жасанды деректер"
                  onClick={generateMockData}
                  disabled={isGeneratingMock}
                  rightElement={isGeneratingMock ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                />
                <SettingsItem 
                  icon={<LogOut className="w-5 h-5 text-slate-500" />}
                  bgColor="bg-slate-500/10"
                  title="Шығу"
                  description="Аккаунттан шығу"
                  onClick={() => setIsLogoutDialogOpen(true)}
                  showChevron={false}
                />
              </SettingsSection>
            </div>

            {/* Profile Edit Modal */}
            <Dialog open={isProfileEditing} onOpenChange={setIsProfileEditing}>
              <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Профильді өңдеу</DialogTitle>
                  <DialogDescription className="text-xs">
                    Логин мен бионы осы жерде өзгерте аласыз.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Логин (@username)</label>
                    <Input 
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      placeholder="@username"
                      className="rounded-2xl h-12 bg-muted/30 border-none focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Өзіңіз туралы</label>
                    <Textarea 
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      placeholder="Био..."
                      className="rounded-2xl min-h-[120px] resize-none bg-muted/30 border-none focus-visible:ring-primary/20 p-4"
                    />
                  </div>
                </div>
                <DialogFooter className="flex-row gap-3">
                  <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setIsProfileEditing(false)} disabled={isSavingProfile}>
                    Бас тарту
                  </Button>
                  <Button className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20" onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Сақтау"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="space-y-6 pb-24 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Рейтинг</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Ең үздік құлшылық иелері</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={fetchLeaderboard} disabled={isLoadingLeaderboard}>
                <RefreshCw className={cn("w-5 h-5", isLoadingLeaderboard && "animate-spin")} />
              </Button>
            </div>

            <div className="space-y-3">
              {isLoadingLeaderboard ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-3xl border bg-card animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-muted" />
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                    <div className="h-6 w-12 bg-muted rounded" />
                  </div>
                ))
              ) : leaderboardUsers.length > 0 ? (
                leaderboardUsers.map((u, i) => (
                  <motion.div 
                    key={u.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-3xl border bg-card transition-all",
                      u.uid === user?.uid && "border-primary ring-2 ring-primary/10 bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                      i === 0 ? "bg-amber-100 text-amber-600" : 
                      i === 1 ? "bg-slate-100 text-slate-600" :
                      i === 2 ? "bg-orange-100 text-orange-600" : "text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>
                    <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{u.displayName || "User"}</p>
                      <p className="text-[10px] text-indigo-500 font-mono font-bold">{u.username || "@anonymous"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {u.lastNI?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">NI</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  Рейтинг әлі бос
                </div>
              )}
            </div>
          </div>
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
                  await setDoc(doc(db, "users", user.uid), { gender: "male" }, { merge: true });
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
                  await setDoc(doc(db, "users", user.uid), { gender: "female" }, { merge: true });
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
