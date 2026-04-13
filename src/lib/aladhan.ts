import { format } from 'date-fns';
import { PrayerTimes } from '../store';

export async function fetchPrayerTimes(lat: number, lng: number, date: Date): Promise<PrayerTimes | null> {
  try {
    const dateStr = format(date, 'dd-MM-yyyy');
    const response = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`);
    const data = await response.json();
    
    if (data && data.data && data.data.timings) {
      const timings = data.data.timings;
      return {
        fajr: timings.Fajr,
        dhuhr: timings.Dhuhr,
        asr: timings.Asr,
        maghrib: timings.Maghrib,
        isha: timings.Isha,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    return null;
  }
}
