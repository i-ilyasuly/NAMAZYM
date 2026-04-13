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
  contexts?: {
    fajr?: string[];
    dhuhr?: string[];
    asr?: string[];
    maghrib?: string[];
    isha?: string[];
  };
  updatedAt: Date;
}

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
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
    }),
    {
      name: "app-storage",
      partialize: (state) => ({ 
        gender: state.gender,
        prayerTimes: state.prayerTimes,
        prayerTimesDate: state.prayerTimesDate
      }), // Persist gender and prayer times
    },
  ),
);
