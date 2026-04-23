import { format } from 'date-fns';
import { PrayerTimes } from '../store';

export async function fetchPrayerTimes(lat: number, lng: number, date: Date, method: number = 2): Promise<PrayerTimes | null> {
  try {
    const dateStr = format(date, 'dd-MM-yyyy');
    // ҚМДБ (Мүфтият) стандарты:
    // 1. Фаджр мен Иша үшін 15 градус қолданылады (method=2 осыған сәйкес келеді).
    // 2. Ханафи мәзһабы (school=1).
    // 3. Сақтық минуттары (tune): Күн шығу -3 мин, Бесін +3 мин, Екінті +3 мин, Шам +3 мин.
    // tune параметрінің реті: Imsak,Fajr,Sunrise,Dhuhr,Asr,Sunset,Maghrib,Isha,Midnight
    const tune = "0,0,-3,3,3,3,3,0,0"; 
    const response = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}&school=1&tune=${tune}`);
    if (!response.ok) throw new Error(`Prayer Times API Error: ${response.status}`);
    const data = await response.json();
    
    if (data && data.data && data.data.timings) {
      const timings = data.data.timings;
      return {
        fajr: timings.Fajr,
        sunrise: timings.Sunrise,
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
