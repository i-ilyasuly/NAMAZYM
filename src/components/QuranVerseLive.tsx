import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Plus, Minus, Loader2, ChevronLeft, ChevronRight, AlertCircle, Type, Palette, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useQuran } from '@/context/QuranContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export const QuranVerseLive: React.FC = () => {
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
  
  const [showControls, setShowControls] = useState(false);
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
        className="w-full h-16 flex items-center justify-center relative overflow-hidden group cursor-pointer select-none"
      >
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div 
              key="error" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="flex items-center gap-2 text-red-500 font-medium text-xs"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Қате орын алды</span>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); fetchSurah(surahNumber); }} className="h-6 px-2">Қайталау</Button>
            </motion.div>
          ) : isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-primary/30" />
            </motion.div>
          ) : quranText ? (
            <motion.div
              key={`${surahNumber}-${quranText.length}`} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center"
            >
              <PersistentScroller
                text={isTajweedEnabled ? quranTajweedText : quranText}
                isHtml={isTajweedEnabled}
                onComplete={nextSurah}
                onTap={(clientX) => {
                  // Eliminate reflow cost by using fast innerWidth
                  if (clientX > window.innerWidth / 2) {
                    togglePause();
                    setShowControls(false); // Hide settings if open
                  } else {
                    setShowControls(prev => !prev);
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

      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -5 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: -5 }} 
            className="mt-1 flex items-center gap-2 z-50 w-full overflow-x-auto no-scrollbar touch-pan-x snap-x snap-mandatory"
          >
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border border-zinc-100 dark:border-zinc-800/50 shadow-sm backdrop-blur-md min-w-max snap-start">
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
              <div className="flex items-center bg-white/50 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-800 shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon-xs" 
                  title="Тәджуид"
                  onClick={(e) => { e.stopPropagation(); setIsTajweedEnabled(!isTajweedEnabled); }} 
                  className={cn(
                    "rounded-md h-7 w-7 transition-colors",
                    isTajweedEnabled ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground"
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
              <div className="flex items-center bg-white/50 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-800">
                <Button 
                  variant="ghost" 
                  size="icon-xs" 
                  disabled={isPlayingAudio}
                  onClick={(e) => { e.stopPropagation(); setLevel(Math.max(level - 1, 1)); }} 
                  className="rounded-md h-7 w-7 disabled:opacity-30 disabled:cursor-not-allowed"
                ><Minus className="w-3.5 h-3.5" /></Button>
                <div className={cn("min-w-[32px] text-center font-mono font-bold text-xs", isPlayingAudio && "opacity-50")}>{level}</div>
                <Button 
                  variant="ghost" 
                  size="icon-xs" 
                  disabled={isPlayingAudio}
                  onClick={(e) => { e.stopPropagation(); setLevel(Math.min(level + 1, 10)); }} 
                  className="rounded-md h-7 w-7 disabled:opacity-30 disabled:cursor-not-allowed"
                ><Plus className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HeavyTajweedText = React.memo<{ text: string, isHtml?: boolean }>(({ text, isHtml }) => {
  if (!text) return null;
  return isHtml ? <span dangerouslySetInnerHTML={{ __html: text }} /> : <span dangerouslySetInnerHTML={{ __html: text }} />; // actually it is safer to just output text normally if not html
});

// Since we know text is huge, we ONLY update it when strictly necessary
const PureTajweed = React.memo<{ text: string, isHtml?: boolean }>(({ text, isHtml }) => {
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
});

const PersistentScroller: React.FC<{
  text: string;
  isHtml?: boolean;
  onComplete?: () => void;
  onTap?: (clientX: number) => void;
}> = ({ text, isHtml, onComplete, onTap }) => {
  const { getPos, setPos, setIsDragging, setTextWidth, textWidth: globalTextWidth, togglePause } = useQuran();
  const textRef = useRef<HTMLDivElement>(null);
  const viewRef1 = useRef<HTMLDivElement>(null);
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
  }, [text, setTextWidth]);

  // Apply position to physical DOM refs locally (bypassing React render at 60fps)
  useEffect(() => {
    let rAF: number;
    const loop = () => {
      const pos = getPos();
      if (viewRef1.current) viewRef1.current.style.transform = `translateX(${pos}px)`;
      if (viewRef2.current) viewRef2.current.style.transform = `translateX(${pos}px)`;
      rAF = requestAnimationFrame(loop);
    };
    rAF = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rAF);
  }, [getPos]);

  return (
    <div 
      className="relative w-full h-full flex items-center overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing" 
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
        className="absolute opacity-0 pointer-events-none whitespace-nowrap font-arabic text-4xl md:text-5xl leading-loose py-4"
        ref={textRef}
      >
        <PureTajweed text={text} isHtml={isHtml} />
      </div>

      {/* 
        LAYER 1: Gray Backdrop (Moving) 
        anchored right-0. Since it's RTL, anchoring right-0 puts the start of text on the right edge.
        px-[50vw] pushes the text exactly to the center of the screen at pos=0.
      */}
      <div 
        className={cn(
          "absolute right-0 flex flex-nowrap items-center h-full will-change-transform z-10 pointer-events-none",
          isHtml && "grayscale opacity-40 transition-opacity duration-300 tajweed-mute"
        )}
        ref={viewRef1}
      >
        <span className="whitespace-nowrap font-arabic text-4xl md:text-5xl leading-loose py-4 text-zinc-400 dark:text-zinc-600/50 px-[50vw]">
          <PureTajweed text={text} isHtml={isHtml} />
        </span>
      </div>

      {/* 
        LAYER 2: Black Highlight (Moving, but Masked heavily)
        Masked so ONLY the center is visible.
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
             isHtml && "tajweed-active"
           )}
           ref={viewRef2}
        >
          <span className="whitespace-nowrap font-arabic text-4xl md:text-5xl leading-loose py-4 text-zinc-900 dark:text-zinc-100 px-[50vw]">
            <PureTajweed text={text} isHtml={isHtml} />
          </span>
        </div>
      </div>
    </div>
  );
};
