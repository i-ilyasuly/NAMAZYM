import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "./ui/card";
import { PrayerStatus } from "../store";
import {
  User,
  Clock,
  Ban,
  AlertCircle,
  Users2,
  Flower2,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  CloudMoon,
  Plus,
} from "lucide-react";
import { cn } from "../lib/utils";

interface PrayerCardProps {
  key?: React.Key;
  id: string;
  name: string;
  time: string;
  status: PrayerStatus;
  gender?: string;
  onClick: () => void;
  noCard?: boolean;
}

export function PrayerCard({
  id,
  name,
  time,
  status,
  gender,
  onClick,
  noCard = false,
}: PrayerCardProps) {
  const { t } = useTranslation();

  const isPast = () => {
    if (!time || time === "--:--") return false;
    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(hours, minutes, 0, 0);
    return now > prayerDate;
  };

  const needsAttention = status === "none" && isPast();

  const getStatusConfig = (status: PrayerStatus) => {
    switch (status) {
      case "prayed":
        return {
          icon: User,
          color: gender === "female" ? "text-emerald-500" : "text-blue-500",
          bg: gender === "female" 
            ? "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/30"
            : "bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10 dark:border-blue-500/30",
          label: t("status_prayed"),
        };
      case "congregation":
        return {
          icon: Users2,
          color: "text-emerald-500",
          bg: "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/30",
          label: t("status_congregation"),
        };
      case "delayed":
        return {
          icon: Clock,
          color: "text-amber-500",
          bg: "bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10 dark:border-amber-500/30",
          label: t("status_delayed"),
        };
      case "missed":
        return {
          icon: Ban,
          color: "text-zinc-900 dark:text-zinc-100",
          bg: "bg-zinc-900/5 border-zinc-900/20 dark:bg-zinc-100/5 dark:border-zinc-100/20",
          label: t("status_missed"),
        };
      case "menstruation":
        return {
          icon: Flower2,
          color: "text-pink-500",
          bg: "bg-pink-500/5 border-pink-500/20 dark:bg-pink-500/10 dark:border-pink-500/30",
          label: t("status_menstruation"),
        };
      default:
        if (needsAttention) {
          return {
            icon: AlertCircle,
            color: "text-amber-500",
            bg: "bg-amber-500/5 border-amber-500/20 animate-pulse",
            label: t("forgot_to_mark"),
          };
        }
        return {
          icon: Plus,
          color: "text-muted-foreground/40",
          bg: "bg-muted/5 border-transparent",
          label: t("status_none"),
        };
    }
  };

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  const getPrayerIcon = (id: string) => {
    switch (id) {
      case "fajr":
        return <CloudMoon className="w-5 h-5 text-indigo-400/80" />;
      case "sunrise":
        return <Sunrise className="w-5 h-5 text-amber-500/80" />;
      case "dhuhr":
        return <Sun className="w-5 h-5 text-orange-500/80 stroke-[2.5px]" />;
      case "asr":
        return <Sun className="w-5 h-5 text-amber-600/80 stroke-[1.5px]" />;
      case "maghrib":
        return <Sunset className="w-5 h-5 text-indigo-400/80" />;
      case "isha":
        return <Moon className="w-5 h-5 text-slate-500/80" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const content = (
    <div className="flex flex-row items-center justify-between py-3 px-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 flex items-center justify-center transition-all duration-300 shrink-0 group-hover:scale-110",
          )}
        >
          {getPrayerIcon(id)}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            {name}
          </span>
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 leading-tight tracking-wide">
            {time}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {id !== "sunrise" && status !== "none" && (
          <span className={cn("text-[10px] font-black uppercase tracking-[0.15em] hidden sm:inline-block opacity-80", config.color)}>
            {config.label}
          </span>
        )}
        {id !== "sunrise" && (
          <div className={cn(
            "w-9 h-9 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110", 
            config.color
          )}>
            <StatusIcon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );

  if (noCard) {
    return (
      <div 
        onClick={id === "sunrise" ? undefined : onClick}
        className={cn(
          "w-full transition-all duration-300 group",
          id !== "sunrise" && "cursor-pointer",
          status !== "none" && config.bg.split(' ').filter(c => c.startsWith('bg-')).join(' ')
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "w-full transition-all duration-300 border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 rounded-2xl overflow-hidden group shadow-sm hover:shadow-md",
        id !== "sunrise" && "cursor-pointer",
        status === "none" && !needsAttention ? "bg-white dark:bg-zinc-900/40" : config.bg,
      )}
      onClick={id === "sunrise" ? undefined : onClick}
    >
      {content}
    </Card>
  );
}
