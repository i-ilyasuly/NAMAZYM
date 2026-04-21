import React from 'react';
import {
  CloudMoon, Sunrise, Sun, Sunset, Moon, Clock,
  User, Users2, Ban, Flower2, AlertCircle, Plus,
} from 'lucide-react';
import { cn } from './utils';
import type { LucideIcon } from 'lucide-react';

/**
 * ─── Намаз уақыты иконкалары (PrayerCard стандарты) ───────────────────────────
 */
export function getPrayerTimeIcon(prayerId: string, className?: string): React.ReactNode {
  switch (prayerId) {
    case 'fajr':    return <CloudMoon className={cn("w-5 h-5 text-indigo-400/80", className)} />;
    case 'sunrise': return <Sunrise   className={cn("w-5 h-5 text-amber-500/80",  className)} />;
    case 'dhuhr':   return <Sun       className={cn("w-5 h-5 text-orange-500/80 stroke-[2.5px]", className)} />;
    case 'asr':     return <Sun       className={cn("w-5 h-5 text-amber-600/80 stroke-[1.5px]",  className)} />;
    case 'maghrib': return <Sunset    className={cn("w-5 h-5 text-indigo-400/80", className)} />;
    case 'isha':    return <Moon      className={cn("w-5 h-5 text-slate-500/80",  className)} />;
    case 'tahajjud': return <Moon     className={cn("w-5 h-5 text-indigo-500", className)} />;
    case 'duha':     return <Sun      className={cn("w-5 h-5 text-amber-500", className)} />;
    default:        return <Clock     className={cn("w-5 h-5", className)} />;
  }
}

/**
 * ─── Намаз мәртебесі иконкалары (chart config үшін — JSX емес, component ref) ──
 */
export const PRAYER_STATUS_ICONS: Record<string, LucideIcon> = {
  prayed:        User,
  congregation:  Users2,
  delayed:       Clock,
  missed:        Ban,
  menstruation:  Flower2,
  none:          Plus,
  attention:     AlertCircle,
};

/**
 * ─── Намаз мәртебесі толық конфиг ──────────────────────────
 */
export type PrayerStatusType = 'prayed' | 'congregation' | 'delayed' | 'missed' | 'menstruation' | 'none';

export interface StatusConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
}

export function getPrayerStatusConfig(
  status: PrayerStatusType,
  isPast = false,
  gender?: string
): StatusConfig {
  switch (status) {
    case 'prayed':
      return {
        icon: User,
        color: gender === 'female' ? 'text-emerald-500' : 'text-blue-500',
        bg: gender === 'female'
          ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/30'
          : 'bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10 dark:border-blue-500/30',
      };
    case 'congregation':
      return {
        icon: Users2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/30',
      };
    case 'delayed':
      return {
        icon: Clock,
        color: 'text-rose-500',
        bg: 'bg-rose-500/5 border-rose-500/20 dark:bg-rose-500/10 dark:border-rose-500/30',
      };
    case 'missed':
      return {
        icon: Ban,
        color: 'text-zinc-900 dark:text-zinc-100',
        bg: 'bg-zinc-900/5 border-zinc-900/20 dark:bg-zinc-100/5 dark:border-zinc-100/20',
      };
    case 'menstruation':
      return {
        icon: Flower2,
        color: 'text-pink-500',
        bg: 'bg-pink-500/5 border-pink-500/20 dark:bg-pink-500/10 dark:border-pink-500/30',
      };
    default:
      if (isPast) {
        return {
          icon: AlertCircle,
          color: 'text-amber-500',
          bg: 'bg-amber-500/5 border-amber-500/20 animate-pulse',
        };
      }
      return {
        icon: Plus,
        color: 'text-muted-foreground/40',
        bg: 'bg-muted/5 border-transparent',
      };
  }
}
