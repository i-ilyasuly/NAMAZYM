import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers, BaselineSeries } from 'lightweight-charts';
import { useStore } from '../store';
import { collection, query, orderBy, limit, onSnapshot, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { format, subDays } from 'date-fns';
import { Loader2, TrendingUp, TrendingDown, Activity, Target, Award, Flame, AlertCircle, Settings2, X, HelpCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { calculateBaseNP, applyModifiers, aggregateDayScore, DayAggregationInput, PrayerStatus, prepareAggregationInput } from '../lib/scoreEngine';

interface AnalyticsScreenProps {
  currentStreak?: number;
}

export function AnalyticsScreen({ currentStreak = 0 }: AnalyticsScreenProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Baseline" | "Candlestick"> | null>(null);
  const markersRef = useRef<any>(null);
  const maSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const communitySeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [prayerRecordsMap, setPrayerRecordsMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalQaza, setTotalQaza] = useState(0);
  const { 
    isDarkMode, 
    gender, 
    showChartMarkers, 
    setShowChartMarkers,
    showChartPriceLine, 
    setShowChartPriceLine,
    showChartCommunity, 
    setShowChartCommunity,
    showChartMA, 
    setShowChartMA,
    showChartVolume,
    setShowChartVolume,
    chartType,
    setChartType
  } = useStore();

  // Settings & Legend State
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [legendData, setLegendData] = useState<any>(null);

  // 1. Fetch Data
  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch prayer records directly to guarantee sync with calendar
    const q = query(
      collection(db, "users", auth.currentUser.uid, "prayer_records"),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => doc.data() as any);
      
      let prevClose = 50.00;
      let totalMissed = 0;
      const map: Record<string, any> = {};
      
      const data = records.map(record => {
        map[record.date] = record;
        
        // Calculate missed count for this day
        let missedCount = 0;
        ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(p => {
          if (record[p] === 'missed') {
            missedCount++;
            totalMissed++;
          }
        });

        // Calculate score on the fly
        const aggregationInput = prepareAggregationInput(record, gender || 'male');
        const dayScore = aggregateDayScore(aggregationInput, prevClose);
        prevClose = dayScore.candle.close;

        return {
          time: record.date,
          open: dayScore.candle.open,
          high: dayScore.candle.high,
          low: dayScore.candle.low,
          close: dayScore.candle.close,
          value: dayScore.candle.close, // For BaselineSeries
          missedCount: missedCount, // For Volume
          volumeColor: missedCount > 0 ? '#ef5350' : 'transparent'
        };
      });

      // Take only the last 30 days for the chart to keep it clean, but we calculated all to get correct prevClose
      const chartDataSubset = data.slice(-30);

      setTotalQaza(totalMissed);
      setPrayerRecordsMap(map);
      setChartData(chartDataSubset);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [gender]);

  // 2. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true, // Бұл автоматты түрде өлшемді реттейді (v5)
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDarkMode ? '#A1A1AA' : '#52525B', // zinc-400 : zinc-600
      },
      grid: {
        vertLines: { color: isDarkMode ? '#27272A' : '#E4E4E7' }, // zinc-800 : zinc-200
        horzLines: { color: isDarkMode ? '#27272A' : '#E4E4E7' },
      },
      timeScale: {
        borderColor: isDarkMode ? '#27272A' : '#E4E4E7',
        timeVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#27272A' : '#E4E4E7',
      },
      leftPriceScale: {
        visible: showChartVolume,
        borderColor: isDarkMode ? '#27272A' : '#E4E4E7',
      },
    } as any);

    // Apply watermark separately to avoid type issues in some versions
    chart.applyOptions({
      watermark: {
        color: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
        visible: true,
        text: 'NAMAZ TRACKER',
        fontSize: 32,
        horzAlign: 'center',
        vertAlign: 'center',
      },
    } as any);

    chartRef.current = chart;

    const mainSeries = chartType === 'baseline' 
      ? chart.addSeries(BaselineSeries, {
          baseValue: { type: 'price', price: 50 },
          topFillColor1: 'rgba(38, 166, 154, 0.28)',
          topFillColor2: 'rgba(38, 166, 154, 0.05)',
          topLineColor: '#26a69a',
          bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
          bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
          bottomLineColor: '#ef5350',
          lineWidth: 2,
        })
      : chartType === 'candlestick'
      ? chart.addSeries(CandlestickSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        })
      : chart.addSeries(LineSeries, {
          color: '#26a69a',
          lineWidth: 2,
          crosshairMarkerVisible: true,
        });

    seriesRef.current = mainSeries as any;
    markersRef.current = createSeriesMarkers(mainSeries);

    if (showChartPriceLine) {
      mainSeries.createPriceLine({
        price: 80,
        color: '#26a69a',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Жақсы деңгей',
      });
    }

    const maSeries = chart.addSeries(LineSeries, {
      color: '#2962FF', // TradingView Blue
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
    });
    maSeriesRef.current = maSeries;

    const communitySeries = chart.addSeries(LineSeries, {
      color: '#9C27B0', // Purple
      lineWidth: 2,
      lineStyle: 2, // Dashed
      crosshairMarkerVisible: false,
      priceLineVisible: false,
    });
    communitySeriesRef.current = communitySeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#ef5350',
      priceFormat: { type: 'volume' },
      priceScaleId: 'left', // Attach to left scale
    });
    // Adjust left scale to not overlap with baseline too much
    chart.priceScale('left').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Crosshair subscription for dynamic legend and tooltip
    chart.subscribeCrosshairMove((param) => {
      // Handle Legend
      if (param.time && param.seriesData.size > 0 && seriesRef.current) {
        const candleData = param.seriesData.get(seriesRef.current) as any;
        if (candleData) {
          setLegendData({ ...candleData, time: param.time });
        }
      } else {
        setLegendData(null); // Will fallback to latest in render
      }

      // Handle Tooltip
      if (!tooltipRef.current || !chartContainerRef.current) return;

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current.clientHeight
      ) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      const data = param.seriesData.get(seriesRef.current) as any;
      const volData = volumeSeriesRef.current ? param.seriesData.get(volumeSeriesRef.current) as any : null;
      
      if (!data) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      const dateStr = param.time as string;
      const score = data.value.toFixed(1);
      const qaza = volData ? volData.value : 0;

      tooltipRef.current.style.display = 'block';
      tooltipRef.current.innerHTML = `
        <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px; color: ${isDarkMode ? '#fff' : '#000'}">${dateStr}</div>
        <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 11px;">
          <span style="color: #71717a">Ұпай:</span>
          <span style="font-weight: 500; color: ${data.value >= 50 ? '#10b981' : '#f43f5e'}">${score}</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 11px; margin-top: 2px;">
          <span style="color: #71717a">Қаза:</span>
          <span style="font-weight: 500; color: ${qaza > 0 ? '#f43f5e' : '#10b981'}">${qaza}</span>
        </div>
      `;

      // Position tooltip
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;
      let left = param.point.x + 15;
      let top = param.point.y + 15;

      if (left + tooltipWidth > chartContainerRef.current.clientWidth) {
        left = param.point.x - tooltipWidth - 15;
      }
      if (top + tooltipHeight > chartContainerRef.current.clientHeight) {
        top = param.point.y - tooltipHeight - 15;
      }

      tooltipRef.current.style.left = left + 'px';
      tooltipRef.current.style.top = top + 'px';
    });

    // ResizeObserver - контейнер өлшемі өзгергенде графикті бейімдеу үшін
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ width: newRect.width, height: newRect.height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [isDarkMode, showChartPriceLine, chartType]);

  // 3. Update Data
  useEffect(() => {
    if (seriesRef.current && chartData.length > 0) {
      if (chartType === 'baseline' || chartType === 'realtime') {
        const baselineData = chartData.map(d => ({
          time: d.time,
          value: d.value ?? d.close ?? 0
        }));
        seriesRef.current.setData(baselineData);
      } else {
        const candleData = chartData.map(d => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close
        }));
        seriesRef.current.setData(candleData);
      }
      
      // Set Volume Data
      if (volumeSeriesRef.current) {
        const volumeData = showChartVolume ? chartData.map(d => ({
          time: d.time,
          value: d.value,
          color: d.volumeColor
        })) : [];
        volumeSeriesRef.current.setData(volumeData);
      }

      // Calculate 7-day Simple Moving Average (SMA)
      if (maSeriesRef.current) {
        const maData = [];
        if (showChartMA) {
          for (let i = 0; i < chartData.length; i++) {
            if (i < 6) continue; // Need at least 7 days to calculate
            let sum = 0;
            for (let j = 0; j < 7; j++) {
              sum += chartData[i - j].close;
            }
            maData.push({ time: chartData[i].time, value: sum / 7 });
          }
        }
        maSeriesRef.current.setData(maData);
      }

      // Set Community Data
      if (communitySeriesRef.current) {
        const commData = showChartCommunity ? chartData.map(d => ({ time: d.time, value: 65 })) : [];
        communitySeriesRef.current.setData(commData);
      }

      // Calculate Markers
      const markers: any[] = [];
      if (showChartMarkers) {
        chartData.forEach(d => {
          if (d.close >= 90) {
            markers.push({ time: d.time, position: 'aboveBar', color: '#26a69a', shape: 'arrowDown' });
          } else if (d.close <= 40) {
            markers.push({ time: d.time, position: 'belowBar', color: '#ef5350', shape: 'arrowUp' });
          }
        });
      }
      if (markersRef.current) {
        markersRef.current.setMarkers(markers);
      }

      chartRef.current?.timeScale().fitContent();
    }
  }, [chartData, showChartMarkers, showChartCommunity, showChartMA, showChartVolume, chartType]);

  // Realtime updates are handled by the main snapshot listener.

  // 4. Generate Mock Data (For Testing)
  const handleGenerateMockData = async () => {
    if (!auth.currentUser) return;
    setIsGenerating(true);
    try {
      const batch = writeBatch(db);
      const statuses: PrayerStatus[] = ["prayed", "congregation", "delayed", "missed"];
      
      let prevClose = 50.00; // Бастапқы индекс

      for (let i = 14; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Кездейсоқ намаз статустарын жасау (жақсырақ оқу ықтималдығы жоғары)
        const getRandomStatus = () => {
          const rand = Math.random();
          if (rand > 0.4) return "prayed";
          if (rand > 0.2) return "congregation";
          if (rand > 0.1) return "delayed";
          return "missed";
        };

        const fajrStatus = getRandomStatus();
        const dhuhrStatus = getRandomStatus();
        const asrStatus = getRandomStatus();
        const maghribStatus = getRandomStatus();
        const ishaStatus = getRandomStatus();

        const record = {
          uid: auth.currentUser.uid,
          date: dateStr,
          fajr: fajrStatus,
          dhuhr: dhuhrStatus,
          asr: asrStatus,
          maghrib: maghribStatus,
          isha: ishaStatus,
          witr: ishaStatus === 'prayed' || ishaStatus === 'congregation',
          tahajjud: Math.random() > 0.7,
          tahajjudRakats: 2,
          duha: Math.random() > 0.8,
          duhaRakats: 2,
          juma: date.getDay() === 5 && Math.random() > 0.2,
          updatedAt: new Date()
        };

        // 1. Save to prayer_records
        const recordRef = doc(db, "users", auth.currentUser.uid, "prayer_records", dateStr);
        batch.set(recordRef, record);
      }
      await batch.commit();
    } catch (error) {
      console.error("Error generating mock data:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-16 flex flex-col h-[100dvh] w-full bg-card max-w-full mx-auto"
    >
      <div className="flex-1 flex flex-col relative w-full h-full border-x border-muted/20">
        {/* Tooltip Container */}
        <div 
          ref={tooltipRef} 
          className="absolute z-50 hidden p-3 rounded-lg shadow-lg bg-background/95 border border-border backdrop-blur-sm pointer-events-none transition-opacity"
        ></div>

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-card">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Әлі деректер жоқ</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Графикті көру үшін басты бетке өтіп, бүгінгі намаздарыңызды белгілеңіз немесе тест деректерін генерациялаңыз.
            </p>
            <Button 
              onClick={handleGenerateMockData} 
              disabled={isGenerating}
              className="w-full max-w-xs"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isGenerating ? "Жүктелуде..." : "Тест деректерін қосу (14 күн)"}
            </Button>
          </div>
        ) : null}
        
        {/* Chart Container */}
        <div ref={chartContainerRef} className="w-full flex-1 [&_a]:hidden relative">
          {/* TradingView Style Legend */}
          <div className="absolute top-2 left-3 z-10 flex flex-col pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Namaz Points</span>
              <span className="text-xs text-muted-foreground">1D</span>
            </div>
            {(() => {
              const dataToShow = legendData || (chartData.length > 0 ? chartData[chartData.length - 1] : null);
              if (!dataToShow) return null;

              const currentIndex = chartData.findIndex(d => d.time === dataToShow.time);
              const prevClose = currentIndex > 0 ? chartData[currentIndex - 1].close : dataToShow.open;
              const diff = dataToShow.close - prevClose;
              const percent = prevClose !== 0 ? (diff / prevClose) * 100 : 0;
              const isPositive = diff >= 0;

              return (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-lg font-bold", isPositive ? "text-emerald-500" : "text-red-500")}>
                      {dataToShow.close.toFixed(2)}
                    </span>
                    <span className={cn("text-sm", isPositive ? "text-emerald-500" : "text-red-500")}>
                      {isPositive ? "+" : ""}{diff.toFixed(2)} ({isPositive ? "+" : ""}{percent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>O<span className={dataToShow.open >= prevClose ? "text-emerald-500" : "text-red-500"}>{dataToShow.open.toFixed(2)}</span></span>
                    <span>H<span className={dataToShow.high >= prevClose ? "text-emerald-500" : "text-red-500"}>{dataToShow.high.toFixed(2)}</span></span>
                    <span>L<span className={dataToShow.low >= prevClose ? "text-emerald-500" : "text-red-500"}>{dataToShow.low.toFixed(2)}</span></span>
                    <span>C<span className={dataToShow.close >= prevClose ? "text-emerald-500" : "text-red-500"}>{dataToShow.close.toFixed(2)}</span></span>
                  </div>
                  {prayerRecordsMap[dataToShow.time] && (
                    <div className="flex flex-wrap gap-1 text-[9px] mt-1">
                      {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(p => {
                        const status = prayerRecordsMap[dataToShow.time][p];
                        const statusColors: Record<string, string> = {
                          prayed: "text-emerald-500",
                          congregation: "text-emerald-500 font-bold",
                          delayed: "text-amber-500",
                          missed: "text-red-500",
                          none: "text-muted-foreground"
                        };
                        const statusLabels: Record<string, string> = {
                          prayed: "Уақытында",
                          congregation: "Жамағат",
                          delayed: "Кешіктіріп",
                          missed: "Қаза",
                          none: "Оқылмады"
                        };
                        const pNames: Record<string, string> = {
                          fajr: "Таң", dhuhr: "Бесін", asr: "Екінті", maghrib: "Ақшам", isha: "Құптан"
                        };
                        return (
                          <span key={p} className={cn("bg-muted/50 px-1 py-0.5 rounded", statusColors[status] || "text-muted-foreground")}>
                            {pNames[p]}: {statusLabels[status] || "Оқылмады"}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
            {showChartMA && (
              <div className="flex items-center gap-2 text-[10px] font-medium mt-1">
                <span className="text-blue-500">MA (7)</span>
                <span className="text-purple-500 ml-2">Орташа (Қауымдастық)</span>
              </div>
            )}
            {showChartVolume && (
              <div className="flex items-center gap-2 text-[10px] font-medium mt-0.5">
                <span className="text-teal-500">Vol (Qaza)</span>
              </div>
            )}
          </div>

          {/* Settings & Info Buttons */}
          <div className="absolute top-2 right-2 z-20 flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("w-8 h-8 rounded-full bg-background/50 backdrop-blur-sm border", showSettings && "text-primary border-primary")}
              onClick={() => {
                setShowSettings(!showSettings);
                setShowInfo(false);
              }}
            >
              <Settings2 className="w-4 h-4" />
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("w-8 h-8 rounded-full bg-background/50 backdrop-blur-sm border", showInfo && "text-primary border-primary")}
              onClick={() => {
                setShowInfo(!showInfo);
                setShowSettings(false);
              }}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-10 right-0 bg-card border rounded-2xl shadow-xl p-5 w-72 flex flex-col gap-5 z-50"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">График баптаулары</h4>
                    <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => setShowSettings(false)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">График түрі</Label>
                      <Tabs value={chartType} onValueChange={(v: any) => setChartType(v)} className="w-full">
                        <TabsList className="grid grid-cols-3 w-full h-8 p-1">
                          <TabsTrigger value="baseline" className="text-[10px] h-6">Baseline</TabsTrigger>
                          <TabsTrigger value="candlestick" className="text-[10px] h-6">Шамдар</TabsTrigger>
                          <TabsTrigger value="realtime" className="text-[10px] h-6">Realtime</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Көрсеткіштер</Label>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Жылжымалы орташа (MA 7)</span>
                        <Switch checked={showChartMA} onCheckedChange={setShowChartMA} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs">Қауымдастық орташасы</span>
                        <Switch checked={showChartCommunity} onCheckedChange={setShowChartCommunity} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs">Маркерлер (Стриктер)</span>
                        <Switch checked={showChartMarkers} onCheckedChange={setShowChartMarkers} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs">Қаза намаздар (Көлем)</span>
                        <Switch checked={showChartVolume} onCheckedChange={setShowChartVolume} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs">Мақсатты сызық (80)</span>
                        <Switch checked={showChartPriceLine} onCheckedChange={setShowChartPriceLine} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {showInfo && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-10 right-0 bg-card border rounded-2xl shadow-xl p-5 w-72 flex flex-col gap-4 z-50"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <Info className="w-5 h-5" />
                    <h4 className="font-bold uppercase tracking-wider text-xs">Namaz Index (NI)</h4>
                  </div>
                  <div className="space-y-3 text-[11px] leading-relaxed text-muted-foreground">
                    <p>
                      <span className="font-bold text-foreground">Namaz Index</span> — бұл сіздің құлшылық деңгейіңіздің нақты уақыттағы көрсеткіші. Ол Apple акциясы сияқты жұмыс істейді.
                    </p>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                        <p><span className="font-bold text-emerald-500">Өсуі:</span> Намазды уақытында оқу, мешітке бару, тахаджуд және духа амалдары индексті жоғарылатады.</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                        <p><span className="font-bold text-red-500">Төмендеуі:</span> Намазды қаза қылу немесе кешіктіру индексті бірден төмендетеді.</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                        <p><span className="font-bold text-amber-500">Айыппұл:</span> Егер бірнеше күн белсенді болмасаңыз, индекс автоматты түрде төмендей бастайды.</p>
                      </div>
                    </div>
                    <p className="italic border-t pt-2">
                      Мақсат — индексті 100-ден асырып, тұрақтылықты сақтау.
                    </p>
                  </div>
                  <Button size="sm" className="w-full rounded-xl" onClick={() => setShowInfo(false)}>Түсінікті</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
