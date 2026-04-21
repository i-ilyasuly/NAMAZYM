import { useEffect, useState, useRef, useMemo, startTransition } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs, limit, orderBy, getDocFromServer } from "firebase/firestore";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { useTranslation } from "react-i18next";
import { auth, db } from "../firebase";
import { useStore, PrayerStatus, PrayerRecord } from "../store";
import { applyModifiers, prepareAggregationInput, aggregateDayScore, PrayerName } from "../lib/scoreEngine";
import { 
  Home, Briefcase, GraduationCap, Plane, Bed, Car, HeartPulse, 
  Users, UserPlus, Coffee, Gamepad2, Film, Tv, BookOpen, 
  Palette, Mic2, Trophy, UserCheck, Book, Dumbbell, 
  ShoppingBag, Utensils, Lock, BellRing, CloudRain, AlarmClock, 
  MoreHorizontal, Users2, User, Clock, Ban, Flame 
} from "lucide-react";

export function useAppController() {
  const { t, i18n } = useTranslation();

  const PRAYER_BLOCK_SCALE = 0.90; 

  const store = useStore();
  const {
    user, setUser, isAuthReady, setAuthReady, gender, setGender,
    currentRecord, setCurrentRecord, prayerTimes, setPrayerTimes,
    locationError, locationName, calculationMethod, setCalculationMethod,
    isDarkMode, setIsDarkMode, setUsername, setBio,
    isStarrySky, setIsStarrySky, backgroundType, backgroundUrl
  } = store;

  // Force refresh if method changed to 2 (ҚМДБ)
  useEffect(() => {
    if (calculationMethod !== 2) {
      setPrayerTimes(null, "");
      setCalculationMethod(2);
    }
  }, [calculationMethod, setPrayerTimes, setCalculationMethod]);

  const [activeTab, setActiveTab] = useState<"home" | "calendar" | "statistics" | "settings" | "analytics" | "leaderboard" | "quran">("home");
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
  const [showExtraPrayerSheet, setShowExtraPrayerSheet] = useState(false);
  const [hijriDate, setHijriDate] = useState("");
  const [statsData, setStatsData] = useState<any[]>([]);
  const [allStatsRecords, setAllStatsRecords] = useState<PrayerRecord[] | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<number>(() => parseInt(localStorage.getItem("statsPeriod") || "7"));
  const [activeChartType, setActiveChartType] = useState<string>(() => localStorage.getItem("activeChartType") || "donut");
  const [statisticsSubTab, setStatisticsSubTab] = useState<"stats" | "calendar">(() => (localStorage.getItem("statisticsSubTab") as "stats" | "calendar") || "stats");
  const [statsStatus, setStatsStatus] = useState<string>(() => localStorage.getItem("statsStatus") || "all");
  const [isGeneratingMock, setIsGeneratingMock] = useState(false);
  const [isCheckingGender, setIsCheckingGender] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isShareScreenOpen, setIsShareScreenOpen] = useState(false);
  const [isWallpaperGalleryOpen, setIsWallpaperGalleryOpen] = useState(false);
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);

  useEffect(() => { localStorage.setItem("statsPeriod", statsPeriod.toString()); }, [statsPeriod]);
  useEffect(() => { localStorage.setItem("activeChartType", activeChartType); }, [activeChartType]);
  useEffect(() => { localStorage.setItem("statisticsSubTab", statisticsSubTab); }, [statisticsSubTab]);
  useEffect(() => { setShowExtraPrayerSheet(false); }, [selectedDate]);
  useEffect(() => { localStorage.setItem("statsStatus", statsStatus); }, [statsStatus]);

  // Telegram WebApp Integration
  useEffect(() => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready(); tg.expand();
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

    const performScroll = (retryCount = 0) => {
      const c = horizontalCalendarRef.current;
      if (!c) return;
      if ((c.clientWidth === 0 || c.scrollWidth <= c.clientWidth) && retryCount < 10) {
        setTimeout(() => performScroll(retryCount + 1), 50 * (retryCount + 1));
        return;
      }

      const selectedBtn = c.querySelector('[data-selected="true"]') as HTMLElement;
      if (!selectedBtn) {
        c.scrollTo({ left: c.scrollWidth + 1000, behavior: "auto" });
        return;
      }

      const targetScrollLeft = selectedBtn.offsetLeft - (c.clientWidth - selectedBtn.offsetWidth) / 2;
      const isDateChanged = lastSelectedDate.current !== selectedDate;
      const isSettingsClosing = !showQuranSettings;
      const behavior: ScrollBehavior = (isDateChanged || isSettingsClosing) && !isFirstHomeRender.current ? "smooth" : "auto";

      c.scrollTo({ left: Math.max(0, targetScrollLeft), behavior });
      lastSelectedDate.current = selectedDate;
      isFirstHomeRender.current = false;
    };

    const rafId = requestAnimationFrame(() => performScroll());
    const timer1 = setTimeout(() => performScroll(), 100);
    const timer2 = setTimeout(() => performScroll(), 400);
    const timer3 = setTimeout(() => performScroll(), 1000);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3);
    };
  }, [activeTab, selectedDate, showQuranSettings]);

  const [calendarWeekStart, setCalendarWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [weeklyRecords, setWeeklyRecords] = useState<Record<string, PrayerRecord>>({});
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [streakAnimationTrigger, setStreakAnimationTrigger] = useState<number>(0);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 60 }).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(today.getDate() - 59 + i);
      return d;
    });
  }, []);

  const historyMap = useMemo(() => {
    const map: Record<string, Record<string, PrayerStatus[]>> = {};
    const baseDate = new Date(selectedDate);
    const dateRange = Array.from({ length: 7 }).map((_, i) => format(subDays(baseDate, 6 - i), "yyyy-MM-dd"));

    const prayerIds = ["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud", "duha"];
    prayerIds.forEach(pid => {
      const history: PrayerStatus[] = [];
      const isExtra = pid === "tahajjud" || pid === "duha";
      dateRange.forEach(dateStr => {
        const record = weeklyRecords[dateStr];
        const raw = record?.[pid as keyof PrayerRecord];
        history.push(isExtra ? (raw === true || raw === "prayed" ? "prayed" : "none") : (raw as PrayerStatus) || "none");
      });
      map[pid] = history as any;
    });
    return map;
  }, [selectedDate, weeklyRecords]);

  const prayers = useMemo(() => {
    const list = [
      { id: "fajr", name: t("fajr"), time: prayerTimes?.fajr, isExtra: false },
      { id: "sunrise", name: t("sunrise"), time: prayerTimes?.sunrise, isPseudo: true, isExtra: false },
      { id: "dhuhr", name: t("dhuhr"), time: prayerTimes?.dhuhr, isExtra: false },
      { id: "asr", name: t("asr"), time: prayerTimes?.asr, isExtra: false },
      { id: "maghrib", name: t("maghrib"), time: prayerTimes?.maghrib, isExtra: false },
      { id: "isha", name: t("isha"), time: prayerTimes?.isha, isExtra: false },
    ];
    if (currentRecord?.tahajjudActive || currentRecord?.tahajjud !== undefined) {
      list.push({ id: "tahajjud", name: t("tahajjud_name"), time: "", isPseudo: false, isExtra: true });
    }
    if (currentRecord?.duhaActive || currentRecord?.duha !== undefined) {
      list.push({ id: "duha", name: "Духа", time: "", isPseudo: false, isExtra: true });
    }
    return list;
  }, [t, prayerTimes, currentRecord?.tahajjud, currentRecord?.tahajjudActive, currentRecord?.duha, currentRecord?.duhaActive]);

  const statusStreaks = useMemo(() => {
    const prayerIds = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const streaks: Record<string, number> = { congregation: 0, prayed: 0, delayed: 0, missed: 0 };
    const statuses: PrayerStatus[] = ["congregation", "prayed", "delayed", "missed"];
    statuses.forEach(status => {
      let count = 0; let date = new Date();
      while (true) {
        const dateStr = format(date, "yyyy-MM-dd");
        const record = weeklyRecords[dateStr];
        if (!record) break;
        if (prayerIds.some(pid => record[pid as keyof PrayerRecord] === status)) {
          count++; date = subDays(date, 1);
        } else break;
      }
      streaks[status] = count;
    });
    return streaks;
  }, [weeklyRecords]);

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
        }
      } catch (error) {}
    };
    if (user && isAuthReady) fetchUserProfile();
  }, [user, isAuthReady, setUsername, setBio, setGender]);

  const calculateStreak = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "users", user.uid, "prayer_records"), orderBy("date", "desc"), limit(365));
      const querySnapshot = await getDocs(q);
      const recordsMap = new Map<string, PrayerRecord>();
      querySnapshot.docs.forEach(doc => recordsMap.set(doc.id, doc.data() as PrayerRecord));
      
      let streak = 0;
      let dateToCheck = new Date();
      const isPerfectDay = (record: PrayerRecord) => ["fajr", "dhuhr", "asr", "maghrib", "isha"].every(p => {
        const s = record[p as keyof PrayerRecord];
        return s === "prayed" || s === "congregation" || s === "delayed" || s === "menstruation";
      });

      const todayRecord = recordsMap.get(format(dateToCheck, "yyyy-MM-dd"));
      if (todayRecord && isPerfectDay(todayRecord)) streak++;

      dateToCheck = subDays(dateToCheck, 1);
      while (true) {
        const record = recordsMap.get(format(dateToCheck, "yyyy-MM-dd"));
        if (record && isPerfectDay(record)) { streak++; dateToCheck = subDays(dateToCheck, 1); } 
        else break;
      }
      setCurrentStreak(streak);
    } catch (error) {}
  };

  useEffect(() => {
    if (user && isAuthReady) {
      calculateStreak();
      const checkDecay = async () => {
        const lastLoginStr = localStorage.getItem(`last_login_${user.uid}`);
        const todayStr = format(new Date(), "yyyy-MM-dd");
        if (lastLoginStr && lastLoginStr !== todayStr) {
          const lastDate = new Date(lastLoginStr);
          const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays > 0) {
            try {
              const userRef = doc(db, "users", user.uid);
              const userSnap = await getDoc(userRef);
              let currentNI = 50.00;
              if (userSnap.exists() && userSnap.data().lastNI) { currentNI = userSnap.data().lastNI; }
              const decayRatePerDay = 1.0;
              const totalDecay = diffDays * decayRatePerDay;
              const newNI = Math.max(0, currentNI - totalDecay);
              await setDoc(userRef, { lastNI: newNI, updatedAt: serverTimestamp() }, { merge: true });
            } catch (err) {}
          }
        }
        localStorage.setItem(`last_login_${user.uid}`, todayStr);
      };
      checkDecay();
    }
  }, [user, isAuthReady]);

  const processStats = (records: PrayerRecord[] | null, period: number) => {
    if (!records) return;
    const today = new Date();
    const periodDays = Array.from({ length: period }).map((_, i) => format(subDays(today, period - 1 - i), "yyyy-MM-dd"));
    const recordsMap = new Map();
    records.forEach(r => recordsMap.set(r.date, r));

    const prayerIds = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    
    const newStatsData = prayerIds.map(pid => {
      const counts = { prayed: 0, congregation: 0, delayed: 0, missed: 0, menstruation: 0, none: 0 };
      periodDays.forEach(date => {
        const record = recordsMap.get(date);
        if (record) {
          const status = record[pid as keyof PrayerRecord] as string;
          if (status in counts) counts[status as keyof typeof counts]++;
          else counts.none++;
        } else {
          counts.none++;
        }
      });
      return { prayer: pid, ...counts };
    });

    setStatsData(newStatsData);
  };

  const fetchStats = async (force: boolean) => {
    if (!user) return;
    if (force || !allStatsRecords) {
      setIsLoadingStats(true);
      const q = query(collection(db, "users", user.uid, "prayer_records"), orderBy("date", "desc"), limit(365));
      try {
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => doc.data() as PrayerRecord);
        setAllStatsRecords(records);
        processStats(records, statsPeriod);
      } catch (error) {} finally { setIsLoadingStats(false); }
    } else processStats(allStatsRecords, statsPeriod);
  };

  const generateMockData = async () => {};

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
        const monthStart = startOfMonth(currentMonth);
        const viewStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const viewEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
        startDate = format(subDays(viewStart, 7), "yyyy-MM-dd");
        endDate = format(addDays(viewEnd, 7), "yyyy-MM-dd");
      }
      const q = query(collection(db, "users", user.uid, "prayer_records"), where("date", ">=", startDate), where("date", "<=", endDate));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setWeeklyRecords(prev => {
          const records = { ...prev };
          snapshot.docs.forEach(doc => records[doc.id] = doc.data() as PrayerRecord);
          return records;
        });
      });
      return () => unsubscribe();
    }
  }, [activeTab, user, currentMonth]);

  const handleCalendarCellClick = (date: string, prayerId: string) => {
    setSelectedDate(date); setSelectedPrayer(prayerId);
    const record = weeklyRecords[date];
    setTempStatus(record && record[prayerId as keyof PrayerRecord] ? record[prayerId as keyof PrayerRecord] as PrayerStatus : null);
    setIsStatusDrawerOpen(true);
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
    const statuses = ["fajr", "dhuhr", "asr", "maghrib", "isha"].map(p => record[p as keyof PrayerRecord] as PrayerStatus).filter(s => s && s !== "none");
    if (statuses.length === 0) return "bg-transparent";
    const counts: Record<string, number> = {};
    statuses.forEach(s => counts[s] = (counts[s] || 0) + 1);
    let highestCount = 0; Object.values(counts).forEach(c => { if (c > highestCount) highestCount = c; });
    const dominant = ["congregation", "prayed", "delayed", "missed", "menstruation"].find(p => counts[p] === highestCount) || "none";
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
    let score = 0; let hasMenstruation = false;
    ["fajr", "dhuhr", "asr", "maghrib", "isha"].map(p => record[p as keyof PrayerRecord] as PrayerStatus).filter(s => s && s !== "none").forEach(s => {
      if (s === "congregation") score += 20;
      else if (s === "prayed") score += (gender === "female" ? 20 : 15);
      else if (s === "delayed") score += 5;
      else if (s === "menstruation") hasMenstruation = true;
    });
    if (hasMenstruation) return { score: 100, colorClass: "bg-pink-500", sizePx: 24 };
    
    const dom = getDominantStatusColor(dateStr);
    let colorClass = dom ? `bg-${dom}-500` : "bg-transparent";
    const sizePx = score === 0 ? 8 : 10 + (score / 100) * 14;
    return { score, colorClass, sizePx };
  };

  const getStatusDotColor = (colorName: string | null) => {
    return colorName ? `bg-${colorName}-500` : "bg-transparent";
  };

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    const starryPref = localStorage.getItem("starrySky");
    setIsStarrySky(starryPref === null ? true : starryPref === "true");

    try {
      const hijri = new Intl.DateTimeFormat(i18n.language === "kk" ? "kk-KZ-u-ca-islamic" : "ru-RU-u-ca-islamic", { day: "numeric", month: "long", year: "numeric", }).format(new Date());
      setHijriDate(hijri.replace(/б\.з\.д\.|ж\.|г\./g, "").trim());
    } catch (e) { setHijriDate(""); }
  }, [i18n.language]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark", !isDarkMode);
    localStorage.setItem("theme", !isDarkMode ? "dark" : "light");
  };
  const toggleStarrySky = () => { setIsStarrySky(!isStarrySky); localStorage.setItem("starrySky", String(!isStarrySky)); };

  useEffect(() => {
    async function testConnection() {
      try { await getDocFromServer(doc(db, 'test', 'connection')); } catch (e) {}
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) {
        setIsCheckingGender(true);
        (async () => {
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists() && userDoc.data().gender) setGender(userDoc.data().gender);
          } catch (e) {} finally { setIsCheckingGender(false); }
        })();
      } else { setIsCheckingGender(false); setGender(null); }
    });
    return () => unsubscribe();
  }, [setUser, setAuthReady, setGender]);

  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(collection(db, "users", user.uid, "prayer_records"), where("date", "==", selectedDate));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) setCurrentRecord(snapshot.docs[0].data() as PrayerRecord);
        else setCurrentRecord(null);
      });
      return () => unsubscribe();
    }
  }, [user, selectedDate, isAuthReady, setCurrentRecord]);

  const handleExtraPrayerUpdate = async (prayerId: string, value: any) => {
    if (!user) return;
    const dateStr = selectedDate;
    const docRef = doc(db, "users", user.uid, "prayer_records", dateStr);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) await setDoc(docRef, { [prayerId]: value, updatedAt: serverTimestamp() }, { merge: true });
      else {
        const nr: any = { date: dateStr, defaultStatusChecked: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        nr[prayerId] = value;
        await setDoc(docRef, nr);
      }
      if (value === 'prayed' || value === true || value === 'congregation') {
        setStreakAnimationTrigger(prev => prev + 1);
      }
      statsNeedsRefresh.current = true;
    } catch (e) {}
  };

  const handleExtraPrayerUpdates = async (updates: Partial<PrayerRecord>) => {
    if (!user) return;
    const dateStr = selectedDate;
    const docRef = doc(db, "users", user.uid, "prayer_records", dateStr);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) await setDoc(docRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      else {
        await setDoc(docRef, { date: dateStr, defaultStatusChecked: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...updates });
      }
    } catch (e) {}
  };

  const handleStatusUpdate = async () => {
    if (!user || !selectedPrayer) return;
    const dateStr = selectedDate;
    const docRef = doc(db, "users", user.uid, "prayer_records", dateStr);
    
    try {
      const docSnap = await getDoc(docRef);
      let recordToUpdate = docSnap.exists() ? docSnap.data() as PrayerRecord : {
        date: dateStr, defaultStatusChecked: false,
        fajr: "none", dhuhr: "none", asr: "none", maghrib: "none", isha: "none",
        createdAt: serverTimestamp(),
      } as Partial<PrayerRecord>;

      let finalNP = recordToUpdate?.np_scores?.[selectedPrayer] || 0;
      let breakdown = recordToUpdate?.np_breakdown?.[selectedPrayer] || {};

      if (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(selectedPrayer)) {
        const baseNP = 100;
        let delayPercent = 0; let delayZone: "delayed" | "on_time" | "slight" | "very_late" | "auto_missed" = "on_time"; let windowMinutes = 120;
        const result = applyModifiers(baseNP, tempStatus, delayZone, delayPercent, windowMinutes, 3, 1.0, selectedPrayer as PrayerName, gender === "female");
        finalNP = result.finalNP; breakdown = result.breakdown;
      }

      const updatedRecord: any = {
        ...recordToUpdate,
        [selectedPrayer]: tempStatus,
        contexts: { ...(recordToUpdate?.contexts || {}), [selectedPrayer]: tempContext },
        np_scores: { ...(recordToUpdate?.np_scores || {}), [selectedPrayer]: finalNP },
        np_breakdown: { ...(recordToUpdate?.np_breakdown || {}), [selectedPrayer]: breakdown },
        updatedAt: serverTimestamp(),
      };

      if (selectedPrayer === 'isha') updatedRecord.witr = tempStatus === 'prayed' || tempStatus === 'congregation';
      await setDoc(docRef, updatedRecord, { merge: true });

      if (tempStatus === 'prayed' || tempStatus === 'congregation') {
        setStreakAnimationTrigger(prev => prev + 1);
      }

      try {
        const prevDateStr = format(subDays(new Date(dateStr), 1), "yyyy-MM-dd");
        const prevScoreSnap = await getDoc(doc(db, "users", user.uid, "daily_scores", prevDateStr));
        const prevClose = prevScoreSnap.exists() ? prevScoreSnap.data().candle?.close : 50.00;
        const aggregationInput = prepareAggregationInput(updatedRecord, gender || 'male');
        const dayScore = aggregateDayScore(aggregationInput, prevClose);
        
        await setDoc(doc(db, "users", user.uid, "daily_scores", dateStr), { date: dateStr, ...dayScore, updatedAt: serverTimestamp() }, { merge: true });
        if (dateStr === format(new Date(), "yyyy-MM-dd")) await setDoc(doc(db, "users", user.uid), { lastNI: dayScore.candle.close, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {}

      statsNeedsRefresh.current = true;
      setIsStatusDrawerOpen(false);
      setDrawerStep("status");
      setExpandedPrayerId(null);
      setExpansionStep("status");
    } catch (e) {}
  };

  const contexts = [
    { id: "home", icon: Home, label: t("ctx_home"), color: "text-emerald-500" },
    { id: "work", icon: Briefcase, label: t("ctx_work"), color: "text-blue-500" },
    { id: "education", icon: GraduationCap, label: t("ctx_education"), color: "text-indigo-500" },
    { id: "travel", icon: Plane, label: t("ctx_travel"), color: "text-sky-500" },
    { id: "sleep", icon: Bed, label: t("ctx_sleep"), color: "text-amber-700" },
    { id: "traffic", icon: Car, label: t("ctx_traffic"), color: "text-rose-500" },
    { id: "health", icon: HeartPulse, label: t("ctx_health"), color: "text-rose-400" },
    { id: "family", icon: Users, label: t("ctx_family"), color: "text-orange-500" },
    { id: "friends", icon: UserPlus, label: t("ctx_friends"), color: "text-cyan-500" },
    { id: "leisure", icon: Coffee, label: t("ctx_leisure"), color: "text-amber-500" },
    { id: "gaming", icon: Gamepad2, label: t("ctx_gaming"), color: "text-purple-500" },
    { id: "movies", icon: Film, label: t("ctx_movies"), color: "text-indigo-400" },
    { id: "tv", icon: Tv, label: t("ctx_tv"), color: "text-slate-600" },
    { id: "quran", icon: BookOpen, label: t("ctx_quran"), color: "text-emerald-600" },
    { id: "hobbies", icon: Palette, label: t("ctx_hobbies"), color: "text-pink-500" },
    { id: "dawah", icon: Mic2, label: t("ctx_dawah"), color: "text-amber-600" },
    { id: "sports", icon: Trophy, label: t("ctx_sports"), color: "text-yellow-600" },
    { id: "guests", icon: UserCheck, label: t("ctx_guests"), color: "text-teal-500" },
    { id: "reading", icon: Book, label: t("ctx_reading"), color: "text-blue-600" },
    { id: "exercise", icon: Dumbbell, label: t("ctx_exercise"), color: "text-red-500" },
    { id: "shopping", icon: ShoppingBag, label: t("ctx_shopping"), color: "text-violet-500" },
    { id: "food", icon: Utensils, label: t("ctx_food"), color: "text-orange-400" },
    { id: "lockdown", icon: Lock, label: t("ctx_lockdown"), color: "text-slate-700" },
    { id: "notifications", icon: BellRing, label: t("ctx_notifications"), color: "text-yellow-500" },
    { id: "weather", icon: CloudRain, label: t("ctx_weather"), color: "text-blue-400" },
    { id: "alarm", icon: AlarmClock, label: t("ctx_alarm"), color: "text-red-600" },
    { id: "other", icon: MoreHorizontal, label: t("ctx_other"), color: "text-slate-500" },
  ];

  return {
    t, store, user, setUser, isAuthReady, gender, setGender, currentRecord, prayerTimes,
    locationError, locationName, isDarkMode, isStarrySky, backgroundType, backgroundUrl,
    activeTab, setActiveTab, selectedPrayer, setSelectedPrayer, selectedDate, setSelectedDate,
    expandedPrayerId, setExpandedPrayerId, expansionStep, setExpansionStep,
    isStatusDrawerOpen, setIsStatusDrawerOpen, drawerStep, setDrawerStep,
    tempStatus, setTempStatus, tempContext, setTempContext, isLogoutDialogOpen, setIsLogoutDialogOpen,
    showQuranSettings, setShowQuranSettings, showExtraPrayerSheet, setShowExtraPrayerSheet,
    hijriDate, statsData, statsPeriod, setStatsPeriod, activeChartType, setActiveChartType,
    statisticsSubTab, setStatisticsSubTab, statsStatus, setStatsStatus, isGeneratingMock,
    isCheckingGender, isLoadingLocation, isLoadingStats, isShareScreenOpen, setIsShareScreenOpen,
    isWallpaperGalleryOpen, setIsWallpaperGalleryOpen, isLocationSearchOpen, setIsLocationSearchOpen,
    horizontalCalendarRef, calendarWeekStart, setCalendarWeekStart, currentMonth, setCurrentMonth,
    weeklyRecords, currentStreak, streakAnimationTrigger, days, historyMap, prayers, statusStreaks,
    toggleDarkMode, toggleStarrySky, generateMockData, handleCalendarCellClick,
    getStatusDotColorForCell, getStatusStreakConfig, getDominantStatusColor,
    getDynamicDayScore, getStatusDotColor, handleExtraPrayerUpdate, handleExtraPrayerUpdates,
    handleStatusUpdate, contexts, PRAYER_BLOCK_SCALE
  };
}
