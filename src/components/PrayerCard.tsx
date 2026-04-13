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
}

export function PrayerCard({
  id,
  name,
  time,
  status,
  gender,
  onClick,
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
          color: gender === "female" ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400",
          bg: gender === "female" 
            ? "bg-emerald-500/10 border-emerald-200/30"
            : "bg-blue-500/10 border-blue-200/30",
          label: t("status_prayed"),
        };
      case "congregation":
        return {
          icon: Users2,
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-200/30",
          label: t("status_congregation"),
        };
      case "delayed":
        return {
          icon: Clock,
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-500/10 border-amber-200/30",
          label: t("status_delayed"),
        };
      case "missed":
        return {
          icon: Ban,
          color: "text-rose-600 dark:text-rose-400",
          bg: "bg-rose-500/10 border-rose-200/30",
          label: t("status_missed"),
        };
      case "menstruation":
        return {
          icon: Flower2,
          color: "text-pink-600 dark:text-pink-400",
          bg: "bg-pink-500/10 border-pink-200/30",
          label: t("status_menstruation"),
        };
      default:
        if (needsAttention) {
          return {
            icon: AlertCircle,
            color: "text-amber-500",
            bg: "bg-amber-500/10 border-amber-500/20 animate-pulse",
            label: t("forgot_to_mark"),
          };
        }
        return {
          icon: Plus,
          color: "text-muted-foreground/40",
          bg: "bg-muted/10 border-transparent",
          label: t("status_none"),
        };
    }
  };

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  const getPrayerIcon = (id: string) => {
    switch (id) {
      case "fajr":
        return <Sunrise className="w-4 h-4 text-amber-500/80" />;
      case "dhuhr":
        return <Sun className="w-4 h-4 text-orange-500/80" />;
      case "asr":
        return <CloudSun className="w-4 h-4 text-amber-600/80" />;
      case "maghrib":
        return <Sunset className="w-4 h-4 text-indigo-400/80" />;
      case "isha":
        return <Moon className="w-4 h-4 text-slate-500/80" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card
      className={cn(
        "w-full cursor-pointer transition-all duration-200 border-muted/40 hover:border-muted-foreground/30 rounded-2xl overflow-hidden group",
        status === "none" && !needsAttention ? "bg-card" : config.bg,
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-row items-center justify-between py-2.5 px-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-background/80 shadow-sm border border-muted/20 shrink-0",
            )}
          >
            {getPrayerIcon(id)}
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-base font-bold tracking-tight text-foreground leading-tight">
              {name}
            </span>
            <span className="text-xs font-semibold text-muted-foreground leading-tight">
              {time}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status !== "none" && (
            <span className={cn("text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block", config.color)}>
              {config.label}
            </span>
          )}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center bg-background/80 shadow-sm border border-muted/20 shrink-0 transition-colors", 
            config.color
          )}>
            <StatusIcon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
