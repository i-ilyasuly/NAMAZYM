import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { Chapter, Verse } from './types';

interface ImageOverlayProps {
  activePage: number;
  setActivePage: React.Dispatch<React.SetStateAction<number>>;
  selectedChapter: Chapter | null;
  toggleBookmark: (chapter: any, verse: any) => void;
  quranBookmark: any;
  setIsQuranImmersive: React.Dispatch<React.SetStateAction<boolean>>;
  isQuranImmersive: boolean;
  nightMode: boolean;
}

export function ImageOverlay({ 
  activePage, setActivePage, selectedChapter, toggleBookmark, 
  quranBookmark, setIsQuranImmersive, isQuranImmersive, nightMode 
}: ImageOverlayProps) {
  const { quranMushaf, isStarrySky } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ayahBoxes, setAyahBoxes] = useState<Record<string, any[]>>({});
  const pressTimer = useRef<any>(null);
  const touchStartPos = useRef<{ x: number, y: number, time: number } | null>(null);
  const hasLongPressed = useRef(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const infoUrl = quranMushaf.ayahInfo || '/ayahinfo.json';
    fetch(infoUrl)
      .then(r => r.json())
      .then(setAyahBoxes)
      .catch(() => {
        if (infoUrl !== '/ayahinfo.json') {
          fetch('/ayahinfo.json').then(r => r.json()).then(setAyahBoxes).catch(console.error);
        }
      });
  }, [quranMushaf]);

  const handlePageChange = (newDir: number) => {
    if (newDir > 0 && activePage < quranMushaf.totalPages) {
      setDirection(1);
      setActivePage(activePage + 1);
    } else if (newDir < 0 && activePage > 1) {
      setDirection(-1);
      setActivePage(activePage - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    hasLongPressed.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const dt = Date.now() - touchStartPos.current.time;
    
    if (Math.abs(dx) > 50 && Math.abs(dy) < 100 && dt < 300) {
      if (dx > 0) handlePageChange(1); 
      else handlePageChange(-1);       
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 200) {
      if (!hasLongPressed.current) {
        setIsQuranImmersive(!isQuranImmersive);
      }
    }
    
    touchStartPos.current = null;
  };

  const pageStr = String(activePage).padStart(3, '0');
  const imageUrl = `${quranMushaf.baseUrl}/page${pageStr}.png`;

  const pageAyahs: { key: string; boxes: any[] }[] = [];
  Object.keys(ayahBoxes).forEach(key => {
    const boxes = ayahBoxes[key].filter((b: any) => b.page === activePage);
    if (boxes.length > 0) pageAyahs.push({ key, boxes });
  });

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <div className={cn(
      "flex flex-col items-center w-full relative h-full overflow-hidden transition-colors duration-300", 
      isStarrySky ? "bg-transparent" : (nightMode ? "bg-zinc-950" : "bg-white")
    )}>
      <div 
        ref={containerRef} 
        className={cn(
          "relative w-full h-full max-w-[1260px] mx-auto select-none overflow-hidden touch-pan-y transition-colors", 
          isStarrySky ? "bg-transparent" : (nightMode ? "bg-zinc-950" : "bg-white")
        )}
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activePage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 w-full h-full"
          >
            <div className="relative w-full h-full overflow-y-auto scrollbar-hide flex flex-col justify-center">
              <div 
                className="relative w-full mx-auto my-auto"
                style={{ 
                  maxWidth: `${quranMushaf.width}px`,
                  aspectRatio: `${quranMushaf.width}/${quranMushaf.height}` 
                }}
              >
                <img 
                  src={imageUrl} 
                  alt={`Page ${activePage}`} 
                  className={cn("w-full h-full block pointer-events-none transition-all duration-500", nightMode && "invert hue-rotate-180 brightness-90")} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    const src = img.src;
                    const tried = parseInt(img.dataset.triedFallback || '0');
                    if (tried >= 3) return;

                    if (tried === 0) {
                      if (src.includes('tajweed_width_1260')) {
                        img.src = src.replace('tajweed_width_1260', 'width_tajweed');
                      } else if (src.includes('width_tajweed')) {
                        img.src = src.replace('width_tajweed', 'tajweed_width_1260');
                      } else {
                        img.src = src.replace('android.quran.com/data', 'everyayah.com/data/quran_android_images');
                      }
                    } else if (tried === 1) {
                      img.src = src.replace('android.quran.com/data', 'everyayah.com/data/quran_android_images');
                    } else if (tried === 2) {
                      if (src.includes('1260')) {
                        img.src = src.replace('1260', '1024');
                      }
                    }
                    img.dataset.triedFallback = String(tried + 1);
                  }}
                />
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <div className="relative w-full h-full">
                    {pageAyahs.map(ayah => {
                      const [cIdStr, vIdStr] = ayah.key.split(':');
                      const cId = parseInt(cIdStr);
                      const vId = parseInt(vIdStr);
                      const isBookmarked = quranBookmark?.chapterId === cId && quranBookmark?.verseId === vId;
                      
                      return (
                        <div key={ayah.key} className="group/ayah">
                          {ayah.boxes.map((box, idx) => (
                            <button
                              key={`${ayah.key}-${idx}`}
                              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              onTouchStart={(e) => {
                                hasLongPressed.current = false;
                                const touch = e.targetTouches[0];
                                touchStartPos.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
                                pressTimer.current = setTimeout(() => {
                                  hasLongPressed.current = true;
                                  toggleBookmark({ id: cId, name_simple: `Chapter ${cId}` }, { verse_number: vId });
                                  pressTimer.current = null;
                                }, 400);
                              }}
                              onTouchEnd={() => {
                                if (pressTimer.current) {
                                  clearTimeout(pressTimer.current);
                                  pressTimer.current = null;
                                }
                              }}
                              onTouchMove={(e) => {
                                if (pressTimer.current && touchStartPos.current) {
                                  const touch = e.targetTouches[0];
                                  const dx = touch.clientX - touchStartPos.current.x;
                                  const dy = touch.clientY - touchStartPos.current.y;
                                  if (Math.sqrt(dx*dx + dy*dy) > 10) {
                                    clearTimeout(pressTimer.current);
                                    pressTimer.current = null;
                                  }
                                }
                              }}
                              onMouseDown={(e) => {
                                if (e.button !== 0) return;
                                hasLongPressed.current = false;
                                pressTimer.current = setTimeout(() => {
                                  hasLongPressed.current = true;
                                  toggleBookmark({ id: cId, name_simple: `Chapter ${cId}` }, { verse_number: vId });
                                  pressTimer.current = null;
                                }, 400);
                              }}
                              onMouseUp={() => {
                                if (pressTimer.current) {
                                  clearTimeout(pressTimer.current);
                                  pressTimer.current = null;
                                }
                              }}
                              onMouseLeave={() => {
                                if (pressTimer.current) {
                                  clearTimeout(pressTimer.current);
                                  pressTimer.current = null;
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "absolute cursor-pointer transition-colors select-none outline-none pointer-events-auto",
                                isBookmarked ? (nightMode ? "bg-sky-400/35" : "bg-sky-500/25") : "bg-transparent group-hover/ayah:bg-sky-500/10"
                              )}
                              style={{
                                left: `${(box.x1 / quranMushaf.width) * 100}%`,
                                top: `${((box.y1 - 15) / quranMushaf.height) * 100}%`,
                                width: `${((box.x2 - box.x1) / quranMushaf.width) * 100}%`,
                                height: `${((box.y2 - box.y1 + 30) / quranMushaf.height) * 100}%`,
                                WebkitTapHighlightColor: 'transparent',
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {!isQuranImmersive && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={cn("absolute bottom-0 left-0 py-2 text-center bg-white/80 backdrop-blur w-full border-t z-10 transition-colors", nightMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-100")}
            >
              <span className={cn("font-bold", nightMode ? "text-zinc-400" : "text-zinc-500")}>{activePage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
