import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "firebase/auth";

export type PrayerStatus =
  | "none"
  | "prayed"
  | "congregation"
  | "delayed"
  | "missed"
  | "menstruation";

export interface PrayerRecord {
  uid: string;
  date: string; // YYYY-MM-DD
  fajr: PrayerStatus;
  dhuhr: PrayerStatus;
  asr: PrayerStatus;
  maghrib: PrayerStatus;
  isha: PrayerStatus;
  
  // Extra Prayers
  witr?: boolean;
  tahajjud?: boolean;
  tahajjudRakats?: number;
  duha?: boolean;
  duhaRakats?: number;
  juma?: boolean; // Only relevant on Fridays

  contexts?: {
    fajr?: string[];
    dhuhr?: string[];
    asr?: string[];
    maghrib?: string[];
    isha?: string[];
  };
  // NP Engine fields
  np_scores?: {
    fajr?: number;
    dhuhr?: number;
    asr?: number;
    maghrib?: number;
    isha?: number;
  };
  np_breakdown?: {
    fajr?: any;
    dhuhr?: any;
    asr?: any;
    maghrib?: any;
    isha?: any;
  };
  updatedAt: Date;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface LocationInfo {
  name: string;
  lat: number;
  lng: number;
}

interface AppState {
  user: User | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;

  gender: "male" | "female" | null;
  setGender: (gender: "male" | "female" | null) => void;

  currentRecord: PrayerRecord | null;
  setCurrentRecord: (record: PrayerRecord | null) => void;

  prayerTimes: PrayerTimes | null;
  prayerTimesDate: string | null;
  setPrayerTimes: (times: PrayerTimes | null, dateStr?: string) => void;

  locationError: string | null;
  setLocationError: (error: string | null) => void;

  locationName: string | null;
  setLocationName: (name: string | null) => void;

  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (coords: { lat: number; lng: number } | null) => void;

  searchHistory: LocationInfo[];
  addSearchHistory: (location: LocationInfo) => void;
  removeSearchHistory: (index: number) => void;

  calculationMethod: number;
  setCalculationMethod: (method: number) => void;

  showChartMarkers: boolean;
  setShowChartMarkers: (show: boolean) => void;
  showChartPriceLine: boolean;
  setShowChartPriceLine: (show: boolean) => void;
  showChartCommunity: boolean;
  setShowChartCommunity: (show: boolean) => void;
  showChartMA: boolean;
  setShowChartMA: (show: boolean) => void;
  showChartVolume: boolean;
  setShowChartVolume: (show: boolean) => void;

  chartType: "baseline" | "candlestick" | "realtime";
  setChartType: (type: "baseline" | "candlestick" | "realtime") => void;

  chartTimeframe: "1M" | "15M" | "1H" | "1D";
  setChartTimeframe: (tf: "1M" | "15M" | "1H" | "1D") => void;

  // NP Engine / Analytics Data
  dailyScores: Record<string, any>; // { [date]: DayAggregationOutput }
  setDailyScore: (date: string, score: any) => void;
  statsSummary: any | null;
  setStatsSummary: (summary: any) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;

  username: string | null;
  setUsername: (username: string | null) => void;
  bio: string | null;
  setBio: (bio: string | null) => void;
  isPrivate: boolean;
  setIsPrivate: (isPrivate: boolean) => void;
  clearUserData: () => void;

  quranFontSize: number;
  setQuranFontSize: (size: number) => void;
  quranBookmark: { chapterId: number; verseId: number; chapterName: string; } | null;
  setQuranBookmark: (bookmark: { chapterId: number; verseId: number; chapterName: string; } | null) => void;
  quranReadingMode: "verse" | "page";
  setQuranReadingMode: (mode: "verse" | "page") => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthReady: false,
      setUser: (user) => set({ user }),
      setAuthReady: (isAuthReady) => set({ isAuthReady }),

      gender: null,
      setGender: (gender) => set({ gender }),

      currentRecord: null,
      setCurrentRecord: (currentRecord) => set({ currentRecord }),

      prayerTimes: null,
      prayerTimesDate: null,
      setPrayerTimes: (prayerTimes, dateStr) => set({ prayerTimes, prayerTimesDate: dateStr || null }),

      locationError: null,
      setLocationError: (locationError) => set({ locationError }),

      locationName: null,
      setLocationName: (locationName) => set({ locationName }),

      coordinates: null,
      setCoordinates: (coordinates) => set({ coordinates }),

      searchHistory: [],
      addSearchHistory: (location) => set((state) => {
        const newHistory = [location, ...state.searchHistory.filter(l => l.name !== location.name)].slice(0, 10);
        return { searchHistory: newHistory };
      }),
      removeSearchHistory: (index) => set((state) => ({
        searchHistory: state.searchHistory.filter((_, i) => i !== index)
      })),

      calculationMethod: 2,
      setCalculationMethod: (calculationMethod) => set({ calculationMethod }),

      showChartMarkers: true,
      setShowChartMarkers: (showChartMarkers) => set({ showChartMarkers }),
      showChartPriceLine: true,
      setShowChartPriceLine: (showChartPriceLine) => set({ showChartPriceLine }),
      showChartCommunity: true,
      setShowChartCommunity: (showChartCommunity) => set({ showChartCommunity }),
      showChartMA: true,
      setShowChartMA: (showChartMA) => set({ showChartMA }),
      showChartVolume: false,
      setShowChartVolume: (showChartVolume) => set({ showChartVolume }),

      chartType: "baseline",
      setChartType: (chartType) => set({ chartType }),

      chartTimeframe: "1D",
      setChartTimeframe: (chartTimeframe) => set({ chartTimeframe }),

      dailyScores: {},
      setDailyScore: (date, score) => set((state) => ({
        dailyScores: { ...state.dailyScores, [date]: score }
      })),
      statsSummary: null,
      setStatsSummary: (statsSummary) => set({ statsSummary }),
      isDarkMode: false,
      setIsDarkMode: (isDarkMode) => set({ isDarkMode }),

      username: null,
      setUsername: (username) => set({ username }),
      bio: null,
      setBio: (bio) => set({ bio }),
      isPrivate: false,
      setIsPrivate: (isPrivate) => set({ isPrivate }),
      clearUserData: () => set({ 
        username: null, 
        bio: null, 
        dailyScores: {}, 
        currentRecord: null, 
        statsSummary: null 
      }),

      quranFontSize: 28,
      setQuranFontSize: (quranFontSize) => set({ quranFontSize }),
      quranBookmark: null,
      setQuranBookmark: (quranBookmark) => set({ quranBookmark }),
      quranReadingMode: "verse",
      setQuranReadingMode: (quranReadingMode) => set({ quranReadingMode }),
    }),
    {
      name: "app-storage",
      partialize: (state) => ({ 
        gender: state.gender,
        prayerTimes: state.prayerTimes,
        prayerTimesDate: state.prayerTimesDate,
        locationName: state.locationName,
        coordinates: state.coordinates,
        searchHistory: state.searchHistory,
        calculationMethod: state.calculationMethod,
        isDarkMode: state.isDarkMode,
        chartType: state.chartType,
        quranFontSize: state.quranFontSize,
        quranBookmark: state.quranBookmark,
        quranReadingMode: state.quranReadingMode,
      }), // Persist gender, prayer times, location, and quran states
    },
  ),
);
