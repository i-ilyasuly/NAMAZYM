import { SCORE_CONSTANTS } from "./scoreConstants";

export type PrayerStatus = "prayed" | "delayed" | "missed" | "none" | "menstruation" | "congregation";
export type PrayerLocation = "mosque" | "work_mosque" | "travel" | "hospital" | "home" | "unknown";
export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export type KhushuLevel = 1 | 2 | 3 | 4 | 5;

// ============================================================================
// 1. КЕШІКТІРУ ПАЙЫЗЫН ЕСЕПТЕУ (Delay Calculator)
// ============================================================================
export function calculateDelayPercent(
  markedAt: Date,
  prayerStart: Date,
  prayerEnd: Date
): { percent: number; zone: "on_time" | "slight" | "delayed" | "very_late" | "auto_missed"; minutesApprox: number } {
  const windowMs = prayerEnd.getTime() - prayerStart.getTime();
  const elapsedMs = markedAt.getTime() - prayerStart.getTime();

  // Егер намаз уақытынан бұрын белгіленсе (қателік)
  if (elapsedMs < 0) {
    return { percent: 0, zone: "on_time", minutesApprox: 0 };
  }

  const percent = (elapsedMs / windowMs) * 100;
  const minutesApprox = Math.round(elapsedMs / 60000);

  if (percent >= 100) return { percent: 100, zone: "auto_missed", minutesApprox };
  if (percent < SCORE_CONSTANTS.DELAY.ON_TIME_MAX_PERCENT) return { percent, zone: "on_time", minutesApprox };
  if (percent < SCORE_CONSTANTS.DELAY.SLIGHT_MAX_PERCENT) return { percent, zone: "slight", minutesApprox };
  if (percent < SCORE_CONSTANTS.DELAY.DELAYED_MAX_PERCENT) return { percent, zone: "delayed", minutesApprox };
  
  return { percent, zone: "very_late", minutesApprox };
}

// ============================================================================
// 2. БАЗАЛЫҚ ҰПАЙДЫ ЕСЕПТЕУ (Base NP)
// ============================================================================
export function calculateBaseNP(
  status: PrayerStatus,
  location: PrayerLocation,
  congregation: boolean,
  aloneAtMosque: boolean
): number {
  if (status === "missed") return SCORE_CONSTANTS.MODIFIERS.MISSED_PENALTY;
  if (status === "none" || status === "menstruation") return 0;

  // Мешітке жалғыз барса да ерлік бонусы
  if (aloneAtMosque) return SCORE_CONSTANTS.MODIFIERS.ALONE_AT_MOSQUE_BONUS;

  // Жамағатпен оқылса
  if (congregation) {
    switch (location) {
      case "mosque": return SCORE_CONSTANTS.BASE_NP.MOSQUE;
      case "work_mosque": return SCORE_CONSTANTS.BASE_NP.WORK_MOSQUE;
      case "travel": return SCORE_CONSTANTS.BASE_NP.TRAVEL;
      case "hospital": return SCORE_CONSTANTS.BASE_NP.HOSPITAL;
      case "home": return SCORE_CONSTANTS.BASE_NP.HOME;
      default: return SCORE_CONSTANTS.BASE_NP.UNKNOWN;
    }
  }

  // Жалғыз оқылса
  switch (location) {
    case "mosque": return SCORE_CONSTANTS.MODIFIERS.ALONE_AT_MOSQUE_BONUS; // Мешітте жалғыз
    case "work_mosque": return 15.50;
    case "travel": return 14.50;
    case "hospital": return 15.20;
    case "home": return SCORE_CONSTANTS.BASE_NP.HOME_ALONE;
    default: return 14.00;
  }
}

// ============================================================================
// 3. МОДИФИКАТОРЛАРДЫ ҚОЛДАНУ (Decay, Khushu, Sunnah)
// ============================================================================
export function applyModifiers(
  baseNP: number,
  status: PrayerStatus,
  delayZone: "on_time" | "slight" | "delayed" | "very_late" | "auto_missed" | null,
  delayPercent: number | null,
  prayerWindowMinutes: number | null,
  khushuRating: KhushuLevel,
  rawatibMultiplier: number,
  prayerName: PrayerName,
  isFemale: boolean = false
): { finalNP: number; breakdown: any } {
  
  const breakdown = {
    base: baseNP,
    afterDecay: baseNP,
    afterPenalty: baseNP,
    afterRawatib: baseNP,
    afterKhushu: baseNP,
    final: baseNP
  };

  if (status === "missed") {
    breakdown.final = SCORE_CONSTANTS.MODIFIERS.MISSED_PENALTY;
    return { finalNP: breakdown.final, breakdown };
  }

  // 1. Әйелдерге арналған бонус (Үйде оқыса да толық ұпай)
  if (isFemale && baseNP === SCORE_CONSTANTS.BASE_NP.HOME_ALONE) {
    baseNP = SCORE_CONSTANTS.BASE_NP.MOSQUE; // 20.00
    breakdown.base = baseNP;
    breakdown.afterDecay = baseNP;
    breakdown.afterPenalty = baseNP;
    breakdown.afterRawatib = baseNP;
    breakdown.afterKhushu = baseNP;
    breakdown.final = baseNP;
  }

  // 2. Decay (Кешіктіруді есептеу)
  if (status === "delayed" && delayPercent !== null && prayerWindowMinutes !== null) {
    const t = (delayPercent / 100) * prayerWindowMinutes;
    const decayFactor = Math.exp(SCORE_CONSTANTS.DELAY.DECAY_RATE * t);
    breakdown.afterDecay = baseNP * decayFactor;

    // Айыппұлдар (Penalty)
    let penalty = 0;
    if (delayZone === "delayed") penalty = -1.50;
    if (delayZone === "very_late") penalty = SCORE_CONSTANTS.DELAY.VERY_LATE_PENALTY * -1; // -3.00

    breakdown.afterPenalty = breakdown.afterDecay + penalty;
  } else {
    breakdown.afterDecay = baseNP;
    breakdown.afterPenalty = baseNP;
  }

  // 3. Рауатиб (Сүннет) мультипликаторы
  breakdown.afterRawatib = breakdown.afterPenalty * rawatibMultiplier;

  // 4. Ықылас (Khushu) мультипликаторы
  let khushuMultiplier = SCORE_CONSTANTS.KHUSHU.LEVEL_3; // 1.00
  switch (khushuRating) {
    case 1: khushuMultiplier = SCORE_CONSTANTS.KHUSHU.LEVEL_1; break;
    case 2: khushuMultiplier = SCORE_CONSTANTS.KHUSHU.LEVEL_2; break;
    case 4: khushuMultiplier = SCORE_CONSTANTS.KHUSHU.LEVEL_4; break;
    case 5: khushuMultiplier = SCORE_CONSTANTS.KHUSHU.LEVEL_5; break;
  }
  breakdown.afterKhushu = breakdown.afterRawatib * khushuMultiplier;

  // 5. Шектеу (Ceiling) - Бір намаз 20.00-ден аспауы керек (Егер бекітілмеген сүннет оқылмаса)
  // Біздің келісім бойынша: Парыз + Рауатиб = 20.00. Ал бекітілмеген сүннеттер (Аср, Иша алдындағы) 20-дан асыра алады.
  let maxAllowed = SCORE_CONSTANTS.BASE_NP.MOSQUE; // 20.00
  if (prayerName === "asr" && rawatibMultiplier > 1) maxAllowed += SCORE_CONSTANTS.SUNNAH_MULTIPLIERS.ASR_BONUS;
  if (prayerName === "isha" && rawatibMultiplier > SCORE_CONSTANTS.SUNNAH_MULTIPLIERS.ISHA) maxAllowed += SCORE_CONSTANTS.SUNNAH_MULTIPLIERS.ISHA_ASR_BONUS;

  breakdown.final = Math.min(breakdown.afterKhushu, maxAllowed);

  // 6. Минимум тексеру (Қазадан төмен түспеуі керек)
  breakdown.final = Math.max(breakdown.final, SCORE_CONSTANTS.MODIFIERS.MISSED_PENALTY);

  // Дөңгелектеу (2 орынға дейін)
  breakdown.final = Math.round(breakdown.final * 100) / 100;

  return { finalNP: breakdown.final, breakdown };
}

// ============================================================================
// 4. КҮНДІК ЖИЫНТЫҚТЫ ЕСЕПТЕУ (Day Aggregator)
// ============================================================================
export interface DayAggregationInput {
  prayers: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  witr: { performed: boolean; ishaFinalNP: number };
  tahajjud: { performed: boolean; rakats: number };
  duha: { performed: boolean; rakats: number };
  juma: { isFriday: boolean; attended: boolean };
  isHayzDay: boolean;
  hayzTotalNP: number | null;
  fardCount: number;
  missedCount: number;
  delayedCount: number;
}

export interface DayAggregationOutput {
  candle: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  namaz5: number;
  sunnah: {
    witrBonus: number;
    tahajjudNP: number;
    duhaNP: number;
    jumaMultiplier: number;
  };
  daily_summary: {
    total_np: number;
    fard_count: number;
    missed_count: number;
    delayed_count: number;
    streak_eligible: boolean;
  };
}

export function aggregateDayScore(input: DayAggregationInput, prevClose?: number): DayAggregationOutput {
  let { fajr, dhuhr, asr, maghrib, isha } = input.prayers;
  let namaz5 = 0;
  let witrBonus = 0;
  let tahajjudNP = 0;
  let duhaNP = 0;
  let jumaMultiplier = 1.0;
  let jumaPenalty = 0;

  // 1. Хайз (Menstruation) күні болса
  if (input.isHayzDay && input.hayzTotalNP !== null) {
    const hayzNP = input.hayzTotalNP;
    return {
      candle: { open: prevClose ?? hayzNP, high: hayzNP, low: hayzNP, close: hayzNP },
      namaz5: hayzNP,
      sunnah: { witrBonus: 0, tahajjudNP: 0, duhaNP: 0, jumaMultiplier: 1 },
      daily_summary: {
        total_np: hayzNP,
        fard_count: 0,
        missed_count: 0,
        delayed_count: 0,
        streak_eligible: true // Хайз күндері стрик үзілмейді
      }
    };
  }

  // 2. Уитр логикасы (Иша ұпайын өзгертеді)
  const originalIsha = isha;
  if (input.witr.performed) {
    isha = originalIsha * SCORE_CONSTANTS.WITR.PERFORMED;
    witrBonus = isha - originalIsha;
  } else {
    isha = originalIsha * SCORE_CONSTANTS.WITR.MISSED;
    witrBonus = isha - originalIsha; // Бұл теріс мән (айыппұл) болады
  }

  // 3. Жұма логикасы (Бесін ұпайын өзгертеді немесе жалпы айыппұл береді)
  if (input.juma.isFriday) {
    if (input.juma.attended) {
      jumaMultiplier = 1.50; // Жұмаға барса, Бесін (Жұма) ұпайы 1.5 есе өседі
      dhuhr = dhuhr * jumaMultiplier;
    } else {
      jumaPenalty = -10.00; // Жұмаға бармаса, жалпы ұпайдан -10 шегеріледі
    }
  }

  // 4. Тахаджуд логикасы
  if (input.tahajjud.performed) {
    if (input.tahajjud.rakats >= 8) tahajjudNP = 30.00;
    else if (input.tahajjud.rakats >= 4) tahajjudNP = 20.00;
    else if (input.tahajjud.rakats >= 2) tahajjudNP = 10.00;
  }

  // 5. Духа логикасы
  if (input.duha.performed) {
    if (input.duha.rakats >= 8) duhaNP = 15.00;
    else if (input.duha.rakats >= 4) duhaNP = 10.00;
    else if (input.duha.rakats >= 2) duhaNP = 5.00;
  }

  // 6. NAMAZ-5 (Негізгі 5 уақыт намаздың қосындысы)
  // 6. Жалпы ұпайды есептеу (Күндік индекс)
  namaz5 = fajr + dhuhr + asr + maghrib + isha;
  
  // Күндік базалық индекс (максимум ~100)
  let dailyIndex = namaz5 + tahajjudNP + duhaNP + jumaPenalty;

  // 7. Стрик логикасы (Барлық 5 парыз оқылса ғана стрик сақталады)
  const streak_eligible = input.fardCount === 5;

  // 8. Candle (Шам) мәліметтерін қалыптастыру
  const open = prevClose ?? 50.00; // Егер алдыңғы күн болмаса, 50-ден бастаймыз
  const close = Number(dailyIndex.toFixed(2));
  
  // High/Low логикасы:
  const high = Number(Math.max(open, close, close + (tahajjudNP + duhaNP) * 0.5).toFixed(2));
  const low = Number(Math.min(open, close, close - (input.missedCount * 10)).toFixed(2));

  return {
    candle: { open, high, low, close },
    namaz5: Number(namaz5.toFixed(2)),
    sunnah: {
      witrBonus: Number(witrBonus.toFixed(2)),
      tahajjudNP: Number(tahajjudNP.toFixed(2)),
      duhaNP: Number(duhaNP.toFixed(2)),
      jumaMultiplier
    },
    daily_summary: {
      total_np: close,
      fard_count: input.fardCount,
      missed_count: input.missedCount,
      delayed_count: input.delayedCount,
      streak_eligible
    }
  };
}

/**
 * Calculates inactivity decay for missed days.
 * Drops the index by a certain percentage for each day of inactivity.
 */
export function calculateInactivityDecay(lastClose: number, missedDays: number): number {
  const DECAY_PER_DAY = 0.05; // 5% drop per day
  let current = lastClose;
  for (let i = 0; i < missedDays; i++) {
    current = current * (1 - DECAY_PER_DAY);
  }
  return Number(current.toFixed(2));
}

/**
 * Prepares the input for day aggregation from a prayer record.
 * Handles legacy data by calculating missing scores.
 */
export function prepareAggregationInput(record: any, gender: 'male' | 'female'): DayAggregationInput {
  const prayers = {
    fajr: record.np_scores?.fajr || 0,
    dhuhr: record.np_scores?.dhuhr || 0,
    asr: record.np_scores?.asr || 0,
    maghrib: record.np_scores?.maghrib || 0,
    isha: record.np_scores?.isha || 0,
  };

  const prayerNames: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  
  // Fallback for missing scores in legacy data
  prayerNames.forEach(name => {
    if (prayers[name] === 0 && record[name] && record[name] !== 'none' && record[name] !== 'menstruation') {
       const status = record[name] as PrayerStatus;
       const isCongregation = status === 'congregation';
       const isDelayed = status === 'delayed';
       const base = calculateBaseNP(status, 'unknown', isCongregation, false);
       prayers[name] = applyModifiers(base, status, isDelayed ? 'delayed' : 'on_time', 0, 120, 3, 1, name, gender === 'female').finalNP;
    }
  });

  let fardCount = 0;
  let missedCount = 0;
  let delayedCount = 0;
  let isHayzDay = false;

  prayerNames.forEach(name => {
    const s = record[name];
    if (s === "prayed" || s === "congregation") fardCount++;
    if (s === "missed") missedCount++;
    if (s === "delayed") delayedCount++;
    if (s === "menstruation") isHayzDay = true;
  });

  return {
    prayers,
    witr: { 
      performed: record.witr || (record.isha === 'prayed' || record.isha === 'congregation'), 
      ishaFinalNP: prayers.isha 
    },
    tahajjud: { performed: record.tahajjud || false, rakats: record.tahajjudRakats || 0 },
    duha: { performed: record.duha || false, rakats: record.duhaRakats || 0 },
    juma: { isFriday: new Date(record.date).getDay() === 5, attended: record.juma || false },
    isHayzDay,
    hayzTotalNP: isHayzDay ? 72.00 : null,
    fardCount,
    missedCount,
    delayedCount
  };
}
