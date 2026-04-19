import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "./ui/card";
import { PrayerStatus } from "../store";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { getPrayerTimeIcon, getPrayerStatusConfig } from "../lib/prayerIcons";
import type { PrayerStatusType } from "../lib/prayerIcons";

interface PrayerCardProps {
  key?: React.Key;
  id: string;
  name: string;
  time: string;
  status: PrayerStatus;
  gender?: string;
  onClick: (e?: React.MouseEvent) => void;
  noCard?: boolean;
  history?: PrayerStatus[];
}

export const PrayerCard = React.memo(function PrayerCard({
  id,
  name,
  time,
  status,
  gender,
  onClick,
  noCard = false,
  history = [],
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

  const config = getPrayerStatusConfig(status as PrayerStatusType, needsAttention, gender);
  const StatusIcon = config.icon;

  const getStatusRank = (s: PrayerStatus | "none"): number => {
    switch (s) {
      case "congregation": return 4;
      case "prayed": return 3;
      case "delayed": return 2;
      case "missed": return 1;
      case "menstruation": return 1;
      default: return 0;
    }
  };

  const getDotColor = (s: PrayerStatus | "none", g?: string) => {
    switch (s) {
      case "prayed": return g === "female" ? "bg-emerald-500" : "bg-blue-500";
      case "congregation": return "bg-emerald-500";
      case "delayed": return "bg-rose-500";
      case "missed": return "bg-zinc-900 dark:bg-zinc-100";
      case "menstruation": return "bg-pink-500";
      default: return "bg-zinc-200 dark:bg-zinc-800";
    }
  };

  const getLineColor = (s: PrayerStatus | "none", g?: string) => {
    switch (s) {
      case "prayed": return g === "female" ? "bg-emerald-500/60" : "bg-blue-500/60";
      case "congregation": return "bg-emerald-500/60";
      case "delayed": return "bg-rose-500/60";
      case "missed": return "bg-zinc-900/40 dark:bg-zinc-100/40";
      case "menstruation": return "bg-pink-500/60";
      default: return "bg-zinc-200/50 dark:bg-zinc-800/50";
    }
  };

  const content = (
    <div className="flex flex-row items-center justify-between py-3 px-3 sm:px-4 gap-2">
      <div className="flex items-center gap-2.5 sm:gap-3 w-[100px] sm:w-[130px] shrink-0">
        <div
          className={cn(
            "w-9 h-9 flex items-center justify-center transition-all duration-300 shrink-0 group-hover:scale-110 relative",
          )}
        >
          {getPrayerTimeIcon(id)}
          {(status === "prayed" || status === "congregation" || status === "delayed") && (
            <div className={cn(
              "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center",
              status === "delayed" ? "bg-rose-500" : "bg-emerald-500"
            )}>
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
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

      {id !== "sunrise" && history.length > 0 && (
        <div className="flex flex-1 items-center justify-center max-w-[120px] sm:max-w-[160px] opacity-90 transition-opacity">
          <div className="flex items-center w-full">
             {history.map((s, idx) => {
                const nextStatus = idx < history.length - 1 ? history[idx + 1] : "none";
                
                const checkConnection = (curr: string, next: string) => {
                  const c = curr === "menstruation" ? "prayed" : curr;
                  const n = next === "menstruation" ? "prayed" : next;
                  
                  if (c === "none" || n === "none") return false;
                  
                  if (c === "congregation") return n === "congregation" || n === "prayed";
                  if (c === "prayed") return n === "congregation" || n === "prayed";
                  if (c === "delayed") return n === "delayed" || n === "prayed" || n === "congregation";
                  if (c === "missed") return n === "missed" || n === "delayed";
                  
                  return false;
                };

                const isConnectedHorizontally = checkConnection(s, nextStatus);
                
                return (
                  <React.Fragment key={idx}>
                    <div className="relative flex items-center justify-center z-10 w-1.5 sm:w-2">
                      <div 
                        className={cn(
                          "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 shadow-sm transition-transform duration-300 relative z-10", 
                          isConnectedHorizontally && "scale-110",
                          s === "none" && isPast() && idx === history.length - 1 ? "bg-amber-400 animate-pulse" : getDotColor(s, gender)
                        )} 
                      />
                    </div>
                    {idx < history.length - 1 && (
                      <div className={cn(
                        "flex-1 h-[2px] mx-[-2px] sm:mx-[-1px] shrink-0 z-0", 
                        isConnectedHorizontally ? getLineColor(nextStatus, gender) : "opacity-0"
                      )} />
                    )}
                  </React.Fragment>
                );
             })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 sm:w-[130px]">
        {id !== "sunrise" && (status !== "none" || needsAttention) && (
          <span className={cn("text-[10px] font-black uppercase tracking-[0.15em] hidden sm:inline-block opacity-80", config.color)}>
            {status === "none" ? t("forgot_to_mark") : t(`status_${status}`)}
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
          id !== "sunrise" && status === "none" && needsAttention ? "bg-amber-500/5 animate-pulse" : (status !== "none" ? config.bg.split(' ').filter(c => c.startsWith('bg-')).join(' ') : "")
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
        id !== "sunrise" && needsAttention ? "bg-amber-500/5 animate-pulse" : (status === "none" ? "bg-white dark:bg-zinc-900/40" : config.bg),
      )}
      onClick={id === "sunrise" ? undefined : onClick}
    >
      {content}
    </Card>
  );
});
