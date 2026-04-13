import React, { useEffect, useState, useRef, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs, limit, orderBy, writeBatch } from "firebase/firestore";
import { format, subDays, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import { auth, db } from "./firebase";
import { useStore, PrayerStatus, PrayerRecord } from "./store";
import { fetchPrayerTimes } from "./lib/aladhan";
import { AuthScreen } from "./components/AuthScreen";
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
import { motion, AnimatePresence } from "framer-motion";
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
  Loader2
} from "lucide-react";
import { cn } from "./lib/utils";
import "./i18n";

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
    setPrayerTimes,
    locationError,
    setLocationError,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    "home" | "calendar" | "statistics" | "settings"
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hijriDate, setHijriDate] = useState("");
  const [statsData, setStatsData] = useState<any[]>([]);
  const [allStatsRecords, setAllStatsRecords] = useState<PrayerRecord[] | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<number>(7);
  const [activeChartType, setActiveChartType] = useState<string>("donut");
  const [statsStatus, setStatsStatus] = useState<string>("all");
  const [isGeneratingMock, setIsGeneratingMock] = useState(false);
  const [isCheckingGender, setIsCheckingGender] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isShareScreenOpen, setIsShareScreenOpen] = useState(false);
  const statsNeedsRefresh = useRef(false);
  const lastFetchedPeriod = useRef<number | null>(null);

  const [calendarWeekStart, setCalendarWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [calendarView, setCalendarView] = useState<"weekly" | "monthly">("weekly");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [weeklyRecords, setWeeklyRecords] = useState<Record<string, PrayerRecord>>({});
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  const prayers = [
    { id: "fajr", name: t("fajr"), time: prayerTimes?.fajr },
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
    }
  }, [user, isAuthReady, currentRecord]);

  // Generate Mock Data for Testing
  const generateMockData = async () => {
    if (!user) return;
    setIsGeneratingMock(true);
    const batch = writeBatch(db);
    const statuses: PrayerStatus[] = ["prayed", "congregation", "delayed", "missed"];
    
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const docRef = doc(db, "users", user.uid, "prayer_records", dateStr);
      
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
      batch.set(docRef, record, { merge: true });
    }
    
    try {
      await batch.commit();
      alert("Mock data generated successfully!");
      fetchStats(true);
    } catch (error) {
      console.error("Error generating mock data:", error);
    } finally {
      setIsGeneratingMock(false);
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
    if (activeTab === "calendar" && user) {
      // Fetch last 4 weeks of data for the calendar
      const startDate = format(subDays(calendarWeekStart, 21), "yyyy-MM-dd");
      const endDate = format(endOfWeek(calendarWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");
      
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
  }, [activeTab, user, calendarWeekStart]);

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
    if (!record) return { score: 0, colorClass: "bg-transparent", sizeClass: "w-1.5 h-1.5" };

    const statuses: PrayerStatus[] = [
      record.fajr as PrayerStatus,
      record.dhuhr as PrayerStatus,
      record.asr as PrayerStatus,
      record.maghrib as PrayerStatus,
      record.isha as PrayerStatus
    ].filter(s => s && s !== "none");

    if (statuses.length === 0) return { score: 0, colorClass: "bg-transparent", sizeClass: "w-1.5 h-1.5" };

    let score = 0;
    let hasMenstruation = false;

    statuses.forEach(s => {
      if (s === "congregation") score += 20;
      else if (s === "prayed") score += (gender === "female" ? 20 : 15);
      else if (s === "delayed") score += 5;
      else if (s === "menstruation") hasMenstruation = true;
    });

    if (hasMenstruation) {
      return { score: 100, colorClass: "bg-pink-500", sizeClass: "w-6 h-6" };
    }

    let colorClass = "bg-transparent";
    let sizeClass = "w-1.5 h-1.5";

    if (score >= 80) {
      colorClass = "bg-emerald-500";
      sizeClass = "w-6 h-6";
    } else if (score >= 55) {
      colorClass = "bg-blue-500";
      sizeClass = "w-5 h-5";
    } else if (score >= 30) {
      colorClass = "bg-amber-500";
      sizeClass = "w-3.5 h-3.5";
    } else if (score >= 10) {
      colorClass = "bg-rose-500";
      sizeClass = "w-2.5 h-2.5";
    } else if (score > 0) {
      colorClass = "bg-zinc-500";
      sizeClass = "w-1.5 h-1.5";
    } else {
      // 0 score (all missed)
      colorClass = "bg-zinc-500/20";
      sizeClass = "w-1.5 h-1.5";
    }

    return { score, colorClass, sizeClass };
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
    if (isDark) {
      document.documentElement.classList.add("dark");
    }

    try {
      const hijri = new Intl.DateTimeFormat("kk-KZ-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
      // Remove "б.з.д.", "ж." and other common suffixes
      setHijriDate(hijri.replace(/б\.з\.д\.|ж\.|г\./g, "").trim());
    } catch (e) {
      setHijriDate("");
    }
  }, []);

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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true); // Unblock UI immediately
      
      if (currentUser) {
        // Run Firestore operations in background
        (async () => {
          try {
            const userRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.gender) {
                setGender(data.gender);
              } else if (!data.createdAt) {
                // Old user from before this update -> default to male
                await setDoc(userRef, { gender: "male" }, { merge: true });
                setGender("male");
              } else {
                // New user who hasn't selected gender yet
                setGender(null);
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
              setGender(null); // Clear persisted gender from previous sessions
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
    if (!force && useStore.getState().prayerTimesDate === todayStr && useStore.getState().prayerTimes) {
      return; // Skip fetching if we already have today's times
    }

    setIsLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const times = await fetchPrayerTimes(latitude, longitude, new Date());
          if (times) {
            setPrayerTimes(times, todayStr);
            setLocationError(null);
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
  }, [user, t, setPrayerTimes, setLocationError]);

  // Firestore Listener for Today's Record
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const docRef = doc(db, "users", user.uid, "prayer_records", todayStr);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setCurrentRecord(snapshot.data() as PrayerRecord);
        } else {
          // Initialize empty record
          setCurrentRecord({
            uid: user.uid,
            date: todayStr,
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
  }, [user, isAuthReady, setCurrentRecord]);

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

      await setDoc(
        docRef,
        {
          ...recordToUpdate,
          [selectedPrayer]: tempStatus,
          contexts: {
            ...(recordToUpdate?.contexts || {}),
            [selectedPrayer]: tempContext,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      statsNeedsRefresh.current = true;
      setIsStatusDrawerOpen(false);
      setDrawerStep("status");
      setExpandedPrayerId(null);
      setExpansionStep("status");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        {t("loading")}
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

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
      activeTab === "home" && isDarkMode ? "bg-transparent" : "bg-background"
    )}>
      {activeTab === "home" && isDarkMode && <NightSky />}
      <main className="flex-1 flex flex-col max-w-md mx-auto w-full p-4 pt-6 overflow-y-auto custom-scrollbar">
        {activeTab === "home" && (
          <div className="flex flex-col flex-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {hijriDate}
                  </p>
                  <h1 className="text-3xl font-black tracking-tighter text-foreground leading-none">
                    {format(new Date(), "d MMMM")}
                  </h1>
                  <p className="text-xs font-medium text-muted-foreground/80">
                    {format(new Date(), "EEEE")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={() => fetchLocationAndTimes(true)}
                    disabled={isLoadingLocation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-muted/50 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isLoadingLocation ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <MapPin className="w-3 h-3" /> 
                    )}
                    {locationError ? <span className="text-rose-500">Error</span> : isLoadingLocation ? "..." : "AUTO"}
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

            <div className="flex-1 flex flex-col justify-center px-[15%] pt-4 pb-32">
              <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
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
                                          { id: "delayed", icon: Clock, color: "text-amber-500" },
                                          { id: "missed", icon: Ban, color: "text-zinc-900 dark:text-zinc-100" },
                                          ...(gender === "female" ? [{ id: "menstruation", icon: Flower2, color: "text-pink-500" }] : []),
                                          { id: "none", icon: Plus, color: "text-muted-foreground/40" },
                                        ].map((s) => (
                                          <button
                                            key={s.id}
                                            onClick={() => {
                                              setTempStatus(s.id as PrayerStatus);
                                              if (s.id === "none" || s.id === "menstruation") {
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
                                                  "absolute inset-0 rounded-full blur-xl opacity-10 -z-0 scale-75",
                                                  s.id === "prayed" ? (gender === "female" ? "bg-emerald-500" : "bg-blue-500") :
                                                  s.id === "congregation" ? "bg-emerald-500" :
                                                  s.id === "delayed" ? "bg-amber-500" :
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
          </div>
        )}

        {activeTab === "calendar" && (
          <div 
            className="space-y-6"
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
              <div className="bg-card rounded-2xl border border-muted/40 shadow-sm p-4 flex flex-col items-center w-full max-w-md mx-auto">
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
                        
                        const { score, colorClass, sizeClass } = getDynamicDayScore(dateStr);

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
                                <div className={cn(
                                  "rounded-full transition-all duration-300", 
                                  sizeClass,
                                  colorClass
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
            </div>
            )}

          </div>
        )}

        {activeTab === "statistics" && (
          <div className="space-y-6">
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
              <div className="space-y-6">
                <div className="p-4 bg-card rounded-2xl border border-muted/40 shadow-sm">
                  <Skeleton className="h-[300px] w-full rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              </div>
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

        {activeTab === "settings" && (
          <div className="space-y-6 pb-20">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {t("settings")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("preferences_desc")}
              </p>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={user.photoURL || ""}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                    <User className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
              {user?.email === "ilyasuly.isakhan@gmail.com" && (
                <div className="flex items-center justify-between p-4 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">
                        {t("gender", { defaultValue: "Жынысы" })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("gender_desc", { defaultValue: "Жынысты таңдау (Тест)" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex bg-muted p-1 rounded-lg">
                    <Button 
                      variant={gender === "male" ? "default" : "ghost"} 
                      size="sm" 
                      className="h-7 text-[10px] px-2"
                      onClick={() => setGender("male")}
                    >
                      {t("male", { defaultValue: "Ер" })}
                    </Button>
                    <Button 
                      variant={gender === "female" ? "default" : "ghost"} 
                      size="sm" 
                      className="h-7 text-[10px] px-2"
                      onClick={() => setGender("female")}
                    >
                      {t("female", { defaultValue: "Әйел" })}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      {t("calculation_method")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("calc_desc")}
                    </p>
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  Auto
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      {t("notifications")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("notif_desc")}
                    </p>
                  </div>
                </div>
                <Switch checked={true} />
              </div>

              <div className="flex items-center justify-between p-4 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {isDarkMode ? (
                      <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      {t("dark_mode")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("dark_mode_desc")}
                    </p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>

              <div className="flex items-center justify-between p-4 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      {t("language")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("lang_desc")}
                    </p>
                  </div>
                </div>
                <div className="flex bg-muted p-1 rounded-lg">
                  <button 
                    className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", i18n.language === 'kk' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")} 
                    onClick={() => i18n.changeLanguage('kk')}
                  >
                    Қаз
                  </button>
                  <button 
                    className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", i18n.language === 'ru' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")} 
                    onClick={() => i18n.changeLanguage('ru')}
                  >
                    Рус
                  </button>
                </div>
              </div>
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
    </div>
  );
}
