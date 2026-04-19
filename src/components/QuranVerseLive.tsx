import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Plus, Minus, Loader2, ChevronLeft, ChevronRight, AlertCircle, Type, Palette, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useQuran } from '@/context/QuranContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface QuranVerseLiveProps {
  onSettingsToggle?: (isOpen: boolean) => void;
  showSettingsManaged?: boolean;
  isSettingsOpen?: boolean;
}

export const QuranVerseLive: React.FC<QuranVerseLiveProps> = ({ 
  onSettingsToggle,
  showSettingsManaged = false,
  isSettingsOpen = false
}) => {
  const { 
    surahNumber, setSurahNumber, 
    level, setLevel, 
    quranText, quranTajweedText, 
    isTajweedEnabled, setIsTajweedEnabled,
    isPaused, togglePause,
    surahInfo, 
    isLoading, error,
    nextSurah, prevSurah,
    fetchSurah,
    isPlayingAudio, toggleAudio,
    reciters, reciterId, setReciterId
  } = useQuran();
  
  const [internalShowControls, setInternalShowControls] = useState(false);
  const showControls = showSettingsManaged ? false : internalShowControls;
  
  const handleToggleSettings = useCallback(() => {
    if (onSettingsToggle) {
      onSettingsToggle(!isSettingsOpen);
    } else {
      setInternalShowControls(prev => !prev);
    }
  }, [onSettingsToggle, isSettingsOpen]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(300); // Default fallback

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      if (w > 0) setContainerWidth(w);
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full mb-2 mt-1 px-4 flex flex-col items-end" ref={containerRef}>
      <div 
        className="w-full h-[64px] flex items-center justify-center relative overflow-hidden group cursor-pointer select-none"
      >
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div 
              key="error" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="flex items-center gap-2 text-red-500 font-medium text-xs h-full"
            >
              <span>Қате орын алды</span>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); fetchSurah(surahNumber); }} className="h-6 px-2">Қайталау</Button>
            </motion.div>
          ) : isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-primary/30" />
            </motion.div>
          ) : quranText ? (
          <motion.div
            key={`scroller-${surahNumber}`} // ONLY change key when surah changes!
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center"
          >
            <PersistentScroller
              text={isTajweedEnabled ? quranTajweedText : quranText}
              measureText={quranText}
              isHtml={true} // Now both are HTML spans
              onComplete={nextSurah}
              onTap={(clientX) => {
                  // Eliminate reflow cost by using fast innerWidth
                  if (clientX > window.innerWidth / 2) {
                    togglePause();
                    setInternalShowControls(false); // Hide internal settings if open
                  } else {
                    handleToggleSettings();
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-zinc-400 text-xs italic">
               Аяттар жүктелуде...
             </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPaused && quranText && !isLoading && !error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute left-0 bottom-0 pointer-events-none z-30 m-2 flex items-center gap-1.5 bg-black/60 dark:bg-white/10 text-white rounded-md px-2 py-1 shadow-md backdrop-blur-sm"
            >
              <Pause className="w-3 h-3 fill-white" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Тоқтатылды</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showSettingsManaged && (
        <AnimatePresence>
          {internalShowControls && (
            <div className="w-full mt-1">
              <QuranSettings />
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export const QuranSettings: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { 
    surahNumber, setSurahNumber, 
    level, setLevel, 
    isTajweedEnabled, setIsTajweedEnabled,
    fontFamily, setFontFamily,
    fontSizeLevel, setFontSizeLevel,
    surahInfo, 
    nextSurah, prevSurah,
    isPlayingAudio, toggleAudio,
    reciters, reciterId, setReciterId
  } = useQuran();

  const fonts = [
    { id: 'font-quran-uthmanic', name: 'Uthmanic (Official)' },
    { id: 'font-quran-indopak', name: 'IndoPak (Official)' },
    { id: 'font-quran-kfgqpc', name: 'KFGQPC (Authentic)' },
    { id: 'font-quran-amiri', name: 'Amiri (Classic)' },
    { id: 'font-quran-scheherazade', name: 'Scheherazade (Modern)' },
    { id: 'font-quran-lateef', name: 'Lateef (Elegant)' },
    { id: 'font-quran-noto', name: 'Noto Naskh (Standard)' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -5 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.95, y: -5 }} 
      className="flex items-center gap-2 z-50 w-full overflow-x-auto no-scrollbar touch-pan-x snap-x snap-mandatory relative h-[44px]"
    >
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/50 shadow-sm backdrop-blur-md min-w-max snap-start h-full">
        <div className="flex items-center bg-white/50 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-800">
          <Button 
            variant="ghost" 
            size="icon-xs" 
            title="Дауыстап оқу"
            onClick={(e) => { e.stopPropagation(); toggleAudio(); }} 
            className={cn(
              "rounded-md h-7 w-7 transition-colors shrink-0 mr-1",
              isPlayingAudio ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-1.5 ml-0.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase shrink-0">Қари:</span>
            <Select value={reciterId.toString()} onValueChange={(val) => setReciterId(parseInt(val, 10))}>
              <SelectTrigger className="h-8 border-0 bg-transparent text-[11px] font-bold px-2 shadow-none focus:ring-0 max-w-[150px] truncate hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors flex items-center gap-1">
                <SelectValue placeholder="Таңдау" />
              </SelectTrigger>
              <SelectContent align="start" className="min-w-[220px] p-1 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-zinc-950/95">
                {reciters && reciters.length > 0 ? (
                  reciters.map(r => (
                    <SelectItem key={r.id} value={r.id.toString()} className="py-3 px-4 text-sm cursor-pointer rounded-xl focus:bg-primary transition-all focus:text-primary-foreground mb-1 last:mb-0">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm tracking-tight">{r.translated_name?.name || r.reciter_name}</span>
                        <div className="flex items-center gap-1.5">
                          {r.style && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 opacity-70 uppercase font-black tracking-widest">
                              {r.style}
                            </span>
                          )}
                          <span className="text-[9px] opacity-40 uppercase font-bold">Орындаушы</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="7" className="py-4 px-5 text-sm font-bold">Mishary Rashid Alafasy</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Font Family Control */}
        <div className="flex items-center bg-white/50 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-800">
          <Type className="w-3 h-3 text-muted-foreground ml-1.5" />
          <Select value={fontFamily} onValueChange={(val) => setFontFamily(val)}>
            <SelectTrigger className="h-8 border-0 bg-transparent text-[10px] font-bold px-2 shadow-none focus:ring-0 w-[120px] truncate hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors flex items-center gap-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" className="min-w-[180px] p-1 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-zinc-950/95">
              {fonts.map(f => (
                <SelectItem key={f.id} value={f.id} className="py-2.5 px-4 text-xs cursor-pointer rounded-xl focus:bg-primary transition-all focus:text-primary-foreground mb-1 last:mb-0">
                  <span className={cn(f.id, "text-base")}>{f.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center bg-white/50 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-800 shrink-0">
          <Button 
            variant="ghost" 
            size="icon-xs" 
            title="Тәджуид"
            disabled={isPlayingAudio}
            onClick={(e) => { e.stopPropagation(); setIsTajweedEnabled(!isTajweedEnabled); }} 
            className={cn(
              "rounded-md h-7 w-7 transition-colors",
              isTajweedEnabled ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground",
              isPlayingAudio && "opacity-20 cursor-not-allowed grayscale"
            )}
          >
            <Palette className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex items-center bg-white/50 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-800">
          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); prevSurah(); }} className="rounded-md h-7 w-7"><ChevronLeft className="w-3.5 h-3.5" /></Button>
          <div className="min-w-[80px] px-2 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-0.5">Сүре {surahNumber}</span>
            <span className="text-[10px] font-arabic font-bold leading-none truncate max-w-[70px] text-center">{surahInfo?.name}</span>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); nextSurah(); }} className="rounded-md h-7 w-7"><ChevronRight className="w-3.5 h-3.5" /></Button>
        </div>
        
        {/* Speed Control */}
        <div className="flex items-center bg-white/50 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-800">
          <Button 
            variant="ghost" 
            size="icon-xs" 
            disabled={isPlayingAudio}
            onClick={(e) => { e.stopPropagation(); setLevel(Math.max(level - 1, 1)); }} 
            className="rounded-md h-7 w-7 disabled:opacity-30 disabled:cursor-not-allowed"
          ><Minus className="w-3.5 h-3.5" /></Button>
          <div className="flex flex-col items-center justify-center min-w-[32px]">
            <span className="text-[7px] font-black uppercase text-muted-foreground leading-none mb-0.5">Speed</span>
            <div className={cn("text-center font-mono font-bold text-[10px] leading-none", isPlayingAudio && "opacity-50")}>{level}</div>
          </div>
          <Button 
            variant="ghost" 
            size="icon-xs" 
            disabled={isPlayingAudio}
            onClick={(e) => { e.stopPropagation(); setLevel(Math.min(level + 1, 10)); }} 
            className="rounded-md h-7 w-7 disabled:opacity-30 disabled:cursor-not-allowed"
          ><Plus className="w-3.5 h-3.5" /></Button>
        </div>

        {/* Font Size Control */}
        <div className="flex items-center bg-white/50 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-800">
          <Button 
            variant="ghost" 
            size="icon-xs" 
            onClick={(e) => { e.stopPropagation(); setFontSizeLevel(Math.max(fontSizeLevel - 1, 1)); }} 
            className="rounded-md h-7 w-7"
          ><Minus className="w-3.5 h-3.5" /></Button>
          <div className="flex flex-col items-center justify-center min-w-[32px]">
            <span className="text-[7px] font-black uppercase text-muted-foreground leading-none mb-0.5 flex flex-nowrap whitespace-nowrap">Font Size</span>
            <div className="text-center font-mono font-bold text-[10px] leading-none">{fontSizeLevel}</div>
          </div>
          <Button 
            variant="ghost" 
            size="icon-xs" 
            onClick={(e) => { e.stopPropagation(); setFontSizeLevel(Math.min(fontSizeLevel + 1, 5)); }} 
            className="rounded-md h-7 w-7"
          ><Plus className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    </motion.div>
  );
};

const HeavyTajweedText = React.memo<{ text: string, isHtml?: boolean }>(({ text, isHtml }) => {
  if (!text) return null;
  return isHtml ? <span dangerouslySetInnerHTML={{ __html: text }} /> : <span dangerouslySetInnerHTML={{ __html: text }} />; // actually it is safer to just output text normally if not html
});

// Since we know text is huge, we ONLY update it when strictly necessary
const PureTajweed = React.memo<{ text: string, isHtml?: boolean }>(({ text, isHtml }) => {
  // Use a simple span to avoid any extra block-level layout shifts
  return <span dangerouslySetInnerHTML={{ __html: text }} className="inline-block" />;
});

const PersistentScroller: React.FC<{
  text: string;
  measureText?: string;
  isHtml?: boolean;
  onComplete?: () => void;
  onTap?: (clientX: number) => void;
}> = ({ text, measureText, isHtml, onComplete, onTap }) => {
  const { 
    getPos, setPos, setIsDragging, setTextWidth, textWidth: globalTextWidth, togglePause,
    fontSizeLevel, fontFamily
  } = useQuran();

  // Mapping level 1-5 to size classes
  // Level 5: text-4xl md:text-5xl
  // Level 4: text-3xl md:text-4xl
  // Level 3: text-2xl md:text-3xl
  // Level 2: text-xl md:text-2xl
  // Level 1: text-lg md:text-xl
  const sizeClass = useMemo(() => {
    switch (fontSizeLevel) {
      case 1: return "text-lg md:text-xl";
      case 2: return "text-xl md:text-2xl";
      case 3: return "text-2xl md:text-3xl";
      case 4: return "text-3xl md:text-4xl";
      case 5: default: return "text-4xl md:text-5xl";
    }
  }, [fontSizeLevel]);

  const textRef = useRef<HTMLDivElement>(null);
  const viewRef2 = useRef<HTMLDivElement>(null);
  
  const dragState = useRef({ isDragging: false, startX: 0, startPos: 0, hasMoved: false });

  const handleStart = useCallback((clientX: number) => {
    dragState.current = { isDragging: true, startX: clientX, startPos: getPos(), hasMoved: false };
    // DO NOT call setIsDragging(true) here! It triggers massive React renders for Tajweed.
    // We defer to handleMove when actual drag > 5px occurs.
  }, [getPos]);

  const handleMove = useCallback((clientX: number) => {
    if (!dragState.current.isDragging) return;
    const deltaX = clientX - dragState.current.startX;
    
    // Only flag as a drag if physically moved enough
    if (Math.abs(deltaX) > 5) {
      if (!dragState.current.hasMoved) {
        dragState.current.hasMoved = true;
        setIsDragging(true); // Trigger React state ONLY when dragging confirmed
      }
    }

    if (dragState.current.hasMoved) {
      setPos(dragState.current.startPos + deltaX);
    }
  }, [setPos, setIsDragging]);

  const handleEnd = useCallback(() => {
    if (dragState.current.isDragging) {
      dragState.current.isDragging = false;
      if (dragState.current.hasMoved) {
        setIsDragging(false);
      }
    }
  }, [setIsDragging]);

  // Measure text raw width without padding using ResizeObserver for immediate reaction
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
         const w = (entry.target as HTMLElement).offsetWidth;
         if (w > 0) setTextWidth(w);
      }
    });
    ro.observe(el);
    
    // Initial sync
    if (el.offsetWidth > 0) setTextWidth(el.offsetWidth);
    
    return () => ro.disconnect();
  }, [measureText, text, setTextWidth]);

  // Apply position to physical DOM refs locally (bypassing React render at 60fps)
  useEffect(() => {
    let rAF: number;
    const loop = () => {
      const pos = getPos();
      if (viewRef2.current) viewRef2.current.style.transform = `translateX(${pos}px)`;
      rAF = requestAnimationFrame(loop);
    };
    rAF = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rAF);
  }, [getPos]);

  return (
    <div 
      className="relative w-full h-full flex items-center pt-4 pb-4 overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing" 
      dir="rtl"
      onPointerDown={e => handleStart(e.clientX)}
      onPointerMove={e => handleMove(e.clientX)}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      onPointerLeave={handleEnd}
      onClickCapture={e => {
        if (dragState.current.hasMoved) {
          e.stopPropagation();
          e.preventDefault();
        } else {
          if (onTap) onTap(e.clientX);
        }
      }}
    >
      {/*  
        Ref for strict measurement perfectly matching the real text. 
        NO padding here so we get ONLY the pure text width.
      */}
      <div 
        id="quran-measurement-layer"
        className={cn(
          "absolute opacity-0 pointer-events-none whitespace-nowrap leading-none pt-4 pb-4",
          fontFamily,
          sizeClass
        )}
        ref={textRef}
      >
        <PureTajweed text={measureText ?? text} isHtml={true} />
      </div>

      {/* 
        MAIN VISIBLE LAYER
      */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 45%, black 55%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 45%, black 55%, transparent)'
        }}
      >
        <div 
           className={cn(
             "absolute right-0 flex flex-nowrap items-center h-full will-change-transform pointer-events-none",
             useQuran().isTajweedEnabled && "tajweed-active"
           )}
           ref={viewRef2}
        >
          <div className={cn(
            "whitespace-nowrap leading-none pt-4 pb-4 text-zinc-900 dark:text-zinc-100 px-[50vw]",
            fontFamily,
            sizeClass
          )}>
            <PureTajweed text={text} isHtml={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
