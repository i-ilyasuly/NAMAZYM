import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Share2, Download, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useTranslation } from "react-i18next";
import { format, subDays } from "date-fns";
import { cn } from "../lib/utils";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, LineChart, Line, ResponsiveContainer } from "recharts";

interface ShareScreenProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  statsData: any[];
  currentStreak: number;
  weeklyRecords: any;
}

export const ShareScreen: React.FC<ShareScreenProps> = ({
  isOpen,
  onClose,
  user,
  statsData,
  currentStreak,
  weeklyRecords,
}) => {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Customization state
  const [showName, setShowName] = useState(true);
  const [customName, setCustomName] = useState(user?.displayName || "Менің статистикам");
  const [showQaza, setShowQaza] = useState(false);
  const [showStreak, setShowStreak] = useState(true);

  if (!isOpen) return null;

  // Calculate percentages based ONLY on marked prayers
  const prayed = statsData.reduce((acc, curr) => acc + curr.prayed, 0);
  const congregation = statsData.reduce((acc, curr) => acc + curr.congregation, 0);
  const delayed = statsData.reduce((acc, curr) => acc + curr.delayed, 0);
  const missed = statsData.reduce((acc, curr) => acc + curr.missed, 0);

  const totalMarked = prayed + congregation + delayed + missed;
  const prayedPct = totalMarked > 0 ? Math.round((prayed / totalMarked) * 100) : 0;
  const congregationPct = totalMarked > 0 ? Math.round((congregation / totalMarked) * 100) : 0;
  const delayedPct = totalMarked > 0 ? Math.round((delayed / totalMarked) * 100) : 0;
  const missedPct = totalMarked > 0 ? Math.round((missed / totalMarked) * 100) : 0;

  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      // Small delay to ensure charts are rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 3, // High resolution
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `iman-stats-${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "iman-stats.png", { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          title: "Менің намаз статистикам",
          text: "Iman App арқылы жасалған",
          files: [file],
        });
      } else {
        alert("Бөлісу функциясы бұл браузерде қолдау таппайды. Жүктеп алуды қолданыңыз.");
      }
    } catch (err) {
      console.error("Error sharing image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Prepare data for Recharts
  const chartData = statsData.map(d => ({
    prayer: t(`prayer_${d.prayer}`),
    prayed: d.prayed,
    congregation: d.congregation,
    delayed: d.delayed,
    missed: d.missed,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Бөлісуді баптау</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col lg:flex-row gap-8">
        {/* Preview Area */}
        <div className="flex-1 flex justify-center items-start">
          <div className="relative w-full max-w-[400px] aspect-[9/16] shadow-2xl rounded-lg overflow-hidden ring-1 ring-border">
            {/* The actual element to be captured */}
            <div
              ref={printRef}
              className="absolute inset-0 bg-background text-foreground p-6 flex flex-col gap-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold">{showName ? customName : "Статистика"}</div>
                <div className="text-sm text-muted-foreground font-medium">Iman App</div>
              </div>

              {/* Hero: Streak */}
              {showStreak && (
                <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-center items-center flex-1">
                  <div className="text-[5rem] font-bold leading-none tracking-tighter text-emerald-500">{currentStreak}</div>
                  <div className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-widest">Күн қатарынан</div>
                </div>
              )}

              {/* Middle Row */}
              <div className="flex gap-4 h-[30%]">
                {/* Radar */}
                <div className="bg-card border border-border rounded-lg p-2 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-3 left-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider z-10">Баланс</div>
                  <div className="w-full h-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <PolarGrid stroke="currentColor" className="opacity-20" />
                        <PolarAngleAxis dataKey="prayer" tick={{ fill: "currentColor", fontSize: 8, opacity: 0.7 }} />
                        <Radar name="Уақытында" dataKey="prayed" stroke="#10b981" fill="#10b981" fillOpacity={0.3} isAnimationActive={false} />
                        <Radar name="Жамағат" dataKey="congregation" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} isAnimationActive={false} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Percentages */}
                <div className="bg-card border border-border rounded-lg p-4 flex-1 flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <div>
                      <div className="text-lg font-bold leading-none">{prayedPct}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Уақытында</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                    <div>
                      <div className="text-lg font-bold leading-none">{congregationPct}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Жамағат</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div>
                      <div className="text-lg font-bold leading-none">{delayedPct}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Кешіктірілді</div>
                    </div>
                  </div>
                  {showQaza && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div>
                        <div className="text-lg font-bold leading-none">{missedPct}%</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Қаза</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="flex gap-4 h-[25%]">
                {/* Line Chart */}
                <div className="bg-card border border-border rounded-lg p-2 flex-1 flex flex-col relative overflow-hidden">
                  <div className="absolute top-3 left-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider z-10">Динамика</div>
                  <div className="w-full h-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <Line type="monotone" dataKey="prayed" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="congregation" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Calendar Mini */}
                <div className="bg-emerald-500 rounded-lg p-4 flex-1 flex flex-col text-white">
                  <div className="text-xs font-bold uppercase tracking-wider mb-auto opacity-90">Соңғы 7 күн</div>
                  <div className="flex justify-between items-end mt-2">
                    {[6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
                      const dateStr = format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
                      const record = weeklyRecords[dateStr];
                      const isPerfect = record && ["fajr", "dhuhr", "asr", "maghrib", "isha"].every(p => 
                        record[p] === "prayed" || record[p] === "congregation"
                      );
                      return (
                        <div key={daysAgo} className="flex flex-col items-center gap-1">
                          <div className={cn("w-2 h-2 rounded-full", isPerfect ? "bg-white" : "bg-white/30")} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-2xl font-bold mt-2 leading-none">
                    {[6, 5, 4, 3, 2, 1, 0].filter(daysAgo => {
                      const dateStr = format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
                      const record = weeklyRecords[dateStr];
                      return record && ["fajr", "dhuhr", "asr", "maghrib", "isha"].every(p => 
                        record[p] === "prayed" || record[p] === "congregation"
                      );
                    }).length}/7
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Controls Area */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-card rounded-xl p-4 border border-border flex flex-col gap-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Көрсетілетін ақпарат</h3>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-name" className="cursor-pointer">Есімді көрсету</Label>
                <Switch id="show-name" checked={showName} onCheckedChange={setShowName} />
              </div>
              {showName && (
                <Input 
                  value={customName} 
                  onChange={(e) => setCustomName(e.target.value)} 
                  className="mt-2"
                  placeholder="Есіміңіз"
                />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-streak" className="cursor-pointer">Үздіксіздікті көрсету</Label>
              <Switch id="show-streak" checked={showStreak} onCheckedChange={setShowStreak} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-qaza" className="cursor-pointer">Қазаларды көрсету</Label>
              <Switch id="show-qaza" checked={showQaza} onCheckedChange={setShowQaza} />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <Button onClick={handleShare} disabled={isGenerating} className="w-full h-12 text-base">
              {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Share2 className="w-5 h-5 mr-2" />}
              {isGenerating ? "Жүктелуде..." : "Бөлісу"}
            </Button>
            <Button onClick={handleDownload} disabled={isGenerating} variant="outline" className="w-full h-12 text-base">
              {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
              {isGenerating ? "Жүктелуде..." : "Жүктеп алу"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
