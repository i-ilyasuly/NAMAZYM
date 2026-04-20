// Import statements at the top
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search, Loader2, Bookmark, BookmarkCheck, Minus, Plus, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useStore, MUSHAFS } from '../store';

function QuranPage({ page, quranMushaf, nightMode, quranBookmark, toggleBookmark, hasLongPressed, touchStartPos, pressTimer, ayahBoxes }: any) {
  if (page < 1 || page > quranMushaf.totalPages) return <div className="absolute inset-0" />;

  // For android.quran.com format: /page001.png
  // For QuranHub format: /1.png
  const pageStr = String(page).padStart(3, '0');
  const isGithub = quranMushaf.baseUrl.includes('githubusercontent');
  const imageUrl = isGithub ? `${quranMushaf.baseUrl}/${page}.png` : `${quranMushaf.baseUrl}/page${pageStr}.png`;

  const pageAyahs: { key: string; boxes: any[] }[] = [];
  Object.keys(ayahBoxes).forEach(key => {
    const boxes = ayahBoxes[key].filter((b: any) => b.page === page);
    if (boxes.length > 0) pageAyahs.push({ key, boxes });
  });

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col justify-center">
      <div 
        className="relative w-full mx-auto my-auto"
        style={{ 
          maxWidth: `${quranMushaf.width}px`,
          aspectRatio: `${quranMushaf.width}/${quranMushaf.height}` 
        }}
      >
        <img 
          src={imageUrl} 
          alt={`Page ${page}`} 
          className={cn("w-full h-full block pointer-events-none transition-all duration-500", nightMode && "invert hue-rotate-180 brightness-90")} 
          referrerPolicy="no-referrer"
          onError={(e) => {
            const img = e.currentTarget;
            const src = img.src;
            const tried = parseInt(img.dataset.triedFallback || '0');
            if (tried >= 2) return;

            if (tried === 0) {
              img.src = src.replace('android.quran.com/data', 'everyayah.com/data/quran_android_images');
            } else if (tried === 1) {
              if (src.includes('1260')) img.src = src.replace('1260', '1024');
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
                      onMouseUp={() => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } }}
                      onMouseLeave={() => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } }}
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
  );
}

function ImageOverlay({ activePage, setActivePage, selectedChapter, toggleBookmark, quranBookmark, setIsQuranImmersive, isQuranImmersive, nightMode }: any) {
  const { quranMushaf } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ayahBoxes, setAyahBoxes] = useState<Record<string, any[]>>({});
  const pressTimer = useRef<any>(null);
  const touchStartPos = useRef<{ x: number, y: number, time: number } | null>(null);
  const hasLongPressed = useRef(false);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const infoUrl = quranMushaf.ayahInfo || '/ayahinfo.json';
    fetch(infoUrl)
      .then(r => r.json())
      .then(setAyahBoxes)
      .catch(() => {
        if (infoUrl !== '/ayahinfo.json') fetch('/ayahinfo.json').then(r => r.json()).then(setAyahBoxes).catch(console.error);
      });
  }, [quranMushaf]);

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 50;
    const { offset, velocity } = info;

    if (offset.x > threshold || (velocity.x > 500 && offset.x > 0)) {
      if (activePage < quranMushaf.totalPages) setActivePage(activePage + 1);
    } else if (offset.x < -threshold || (velocity.x < -500 && offset.x < 0)) {
      if (activePage > 1) setActivePage(activePage - 1);
    }
    setIsSwiping(false);
  };

  const commonProps = {
    quranMushaf,
    nightMode,
    quranBookmark,
    toggleBookmark,
    hasLongPressed,
    touchStartPos,
    pressTimer,
    ayahBoxes
  };

  return (
    <div className={cn("flex flex-col items-center w-full relative h-full overflow-hidden transition-colors duration-300", nightMode ? "bg-zinc-950" : "bg-white")}>
      <div 
        ref={containerRef} 
        className={cn("relative w-full h-full max-w-[1260px] mx-auto select-none overflow-hidden touch-pan-y transition-colors", nightMode ? "bg-zinc-950" : "bg-white")}
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (!isSwiping && !hasLongPressed.current) {
            setIsQuranImmersive(!isQuranImmersive);
          }
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full h-full"
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragStart={() => setIsSwiping(true)}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 w-full h-full flex flex-row items-center"
              style={{ width: '100%', left: '0%' }}
            >
              {/* Previous Page (RTL: to the right) */}
              <div className="absolute left-[100%] w-full h-full pointer-events-none opacity-50">
                <QuranPage page={activePage - 1} {...commonProps} />
              </div>

              {/* Current Page */}
              <div className="absolute left-0 w-full h-full">
                <QuranPage page={activePage} {...commonProps} />
              </div>

              {/* Next Page (RTL: to the left) */}
              <div className="absolute left-[-100%] w-full h-full pointer-events-none opacity-50">
                <QuranPage page={activePage + 1} {...commonProps} />
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Page Number Overlay Indicator */}
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
interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  line_number: number;
  page_number: number;
  char_type_name: string;
}

interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  page_number: number;
  words: Word[];
  translations: {
    id: number;
    resource_id: number;
    text: string;
  }[];
}

export function QuranScreen() {
  const { quranFontSize, setQuranFontSize, quranBookmark, setQuranBookmark, quranReadingMode, setQuranReadingMode, isQuranImmersive, setIsQuranImmersive, quranNightMode, setQuranNightMode, quranMushaf, setQuranMushaf } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  // General migration for any stale baseUrl in localStorage
  useEffect(() => {
    const official = MUSHAFS.find(m => m.id === quranMushaf.id);
    if (official && quranMushaf.baseUrl !== official.baseUrl) {
      setQuranMushaf(official);
    }
  }, [quranMushaf, setQuranMushaf, quranMushaf.id]);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const [pageVerses, setPageVerses] = useState<Verse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [activePage, setActivePage] = useState<number>(1);
  
  const toArabicNumber = (n: number) => n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch('https://api.quran.com/api/v4/chapters?language=kk');
        const data = await response.json();
        setChapters(data.chapters);
      } catch (error) {
        console.error('Error fetching chapters:', error);
      } finally {
        setIsLoadingChapters(false);
      }
    };
    fetchChapters();
  }, []);

  // Use effect to fetch reading content gracefully whenever mode/chapter changes.
  useEffect(() => {
    if (!selectedChapter) return;
    const controller = new AbortController();

    const fetchContent = async () => {
      if (quranReadingMode === 'page') {
        // No fetch dependencies for page mode anymore. We use the background image.
        setIsLoadingVerses(false);
      } else {
        setIsLoadingVerses(true);
        try {
          // Verse mode: load the entire chapter with translations
          const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${selectedChapter.id}?language=kk&words=false&translations=222&fields=text_uthmani&per_page=300`, { signal: controller.signal });
          const data = await res.json();
          setChapterVerses(data.verses);
        } catch (err: any) {
          if (err.name !== 'AbortError') console.error('Error fetching data:', err);
        } finally {
          setIsLoadingVerses(false);
        }
      }
    };

    fetchContent();
    return () => controller.abort();
  }, [selectedChapter, quranReadingMode]);

  const loadChapter = async (chapter: Chapter, verseToScroll?: number) => {
    setSelectedChapter(chapter);
    setShowSettings(false);
    
    // Always start with chapter's first page if not verse specified
    let targetPage = chapter.pages[0]; 

    // If mushaf is not standard Madani, we need to find the correct page number
    // Even for Madani, it's safer to fetch based on mushafId
    try {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${chapter.id}?mushaf=${quranMushaf.mushafId}&fields=page_number,verse_number&per_page=1`);
      const data = await res.json();
      if (data.verses && data.verses[0]) {
        targetPage = data.verses[0].page_number;
      }
    } catch (e) {}

    if (verseToScroll) {
      // If we need to scroll to a specific verse, find out what page it is on in the CURRENT mushaf
      try {
        const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${chapter.id}?mushaf=${quranMushaf.mushafId}&fields=page_number,verse_number&per_page=300`);
        const data = await res.json();
        const vInfo = data.verses.find((v: any) => v.verse_number === verseToScroll);
        if (vInfo && vInfo.page_number) {
          targetPage = vInfo.page_number;
        }
      } catch (e) {}
    }

    setActivePage(targetPage);

    // Scroll automatically if in verse mode
    if (quranReadingMode === 'verse' && verseToScroll) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${verseToScroll}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500); // give the fetch effect time to render
    }
  };

  const toggleBookmark = (chapter: Chapter, verse: Verse) => {
    if (quranBookmark?.chapterId === chapter.id && quranBookmark?.verseId === verse.verse_number) {
      setQuranBookmark(null); // Remove bookmark if clicked again
    } else {
      setQuranBookmark({
        chapterId: chapter.id,
        verseId: verse.verse_number,
        chapterName: chapter.name_simple
      });
    }
  };

  const filteredChapters = chapters.filter(c => 
    c.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.translated_name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toString().includes(searchQuery)
  );

  return (
    <div className={cn("flex flex-col h-full overflow-hidden relative", quranNightMode ? "bg-zinc-950" : "bg-zinc-50/50 dark:bg-black")}>
      <AnimatePresence mode="wait">
        {!selectedChapter ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 bg-background z-10 sticky top-0">
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">Қасиетті Құран</h1>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-zinc-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Сүрені іздеу (аты немесе саны)..."
                  className="pl-10 h-12 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto px-6 pb-32">
              {quranBookmark && !searchQuery && (
                <div className="mb-6">
                  <button
                    onClick={() => {
                      const chapter = chapters.find(c => c.id === quranBookmark.chapterId);
                      if (chapter) loadChapter(chapter, quranBookmark.verseId);
                    }}
                    className="w-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between text-left hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 block">Жалғастыру</span>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                        {quranBookmark.chapterName}, {quranBookmark.verseId}-аят
                      </h4>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400 rotate-180" />
                  </button>
                </div>
              )}

              {isLoadingChapters ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredChapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => loadChapter(chapter)}
                      className="bg-white dark:bg-[#111] border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-colors text-left active:scale-[0.98] transform-gpu"
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Сүре</span>
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">{chapter.id}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{chapter.name_simple}</h3>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{chapter.translated_name.name} • {chapter.verses_count} аят</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="font-quran-amiri text-xl text-emerald-600 dark:text-emerald-400">{chapter.name_arabic}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reader"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn("flex flex-col h-full transition-colors duration-300", quranNightMode ? "bg-zinc-950" : "bg-white dark:bg-[#050505]")}
          >
            {/* Reading Header */}
            <AnimatePresence>
              {!(quranReadingMode === 'page' && isQuranImmersive) && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "flex items-center px-4 pt-6 pb-2 backdrop-blur-xl border-b z-20 sticky top-0 transition-all duration-300", 
                    quranReadingMode === 'page' && "absolute top-0 left-0 w-full",
                    quranNightMode ? "bg-zinc-950/80 border-zinc-800" : "bg-white/80 dark:bg-[#050505]/80 border-zinc-100 dark:border-zinc-800/50"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedChapter(null)}
                    className="w-10 h-10 rounded-full mr-2"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <div className="flex-1 text-center">
                    <h2 className={cn("text-lg font-bold", quranNightMode && "text-zinc-100")}>{selectedChapter.name_simple}</h2>
                    <p className="text-xs text-zinc-500">{selectedChapter.translated_name.name}</p>
                  </div>
                  <Button
                    variant={showSettings ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn("w-10 h-10 rounded-full ml-2 transition-colors", showSettings && "bg-emerald-500 hover:bg-emerald-600")}
                  >
                    <Type className={cn("w-5 h-5", showSettings ? "text-white" : (quranNightMode ? "text-zinc-400" : "text-zinc-600 dark:text-zinc-400"))} />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Font Settings Drawer/Dropdown (Fixed below header) */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={cn(
                    "border-b overflow-hidden z-20 transition-colors", 
                    quranReadingMode === 'page' && "absolute top-[88px] left-0 w-full shadow-lg",
                    quranNightMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  )}
                >
                  <div className="p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-bold", quranNightMode ? "text-zinc-100" : "text-zinc-900 dark:text-zinc-100")}>Мұсхаф түрі</span>
                      <select 
                        value={quranMushaf.id}
                        onChange={(e) => {
                          const m = MUSHAFS.find(m => m.id === e.target.value);
                          if (m) {
                            setQuranMushaf(m);
                            // If we have a selected chapter, we should reload it to get correct pagination for that mushaf
                            if (selectedChapter) {
                              loadChapter(selectedChapter);
                            }
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none transition-colors",
                          quranNightMode ? "bg-zinc-950 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                        )}
                      >
                        {MUSHAFS.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-bold", quranNightMode ? "text-zinc-100" : "text-zinc-900 dark:text-zinc-100")}>Оқу режимі</span>
                      <div className={cn("flex p-1 rounded-xl border shadow-sm transition-colors", quranNightMode ? "bg-zinc-950 border-zinc-800" : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-800")}>
                        <button 
                          onClick={() => setQuranReadingMode('verse')} 
                          className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", quranReadingMode === 'verse' ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100")}
                        >
                          Аяттап
                        </button>
                        <button 
                          onClick={() => setQuranReadingMode('page')} 
                          className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", quranReadingMode === 'page' ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100")}
                        >
                          Парақтап
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-bold", quranNightMode ? "text-zinc-100" : "text-zinc-900 dark:text-zinc-100")}>Шрифт өлшемі</span>
                      <div className={cn("flex items-center gap-4 rounded-full p-1 border transition-colors", quranNightMode ? "bg-zinc-950 border-zinc-800" : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-800")}>
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setQuranFontSize(Math.max(16, quranFontSize - 2))}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-lg font-black w-8 text-center text-emerald-600 dark:text-emerald-400">{quranFontSize}</span>
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setQuranFontSize(Math.min(60, quranFontSize + 2))}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-bold", quranNightMode ? "text-zinc-100" : "text-zinc-900 dark:text-zinc-100")}>Түнгі режим</span>
                      <button 
                        onClick={() => setQuranNightMode(!quranNightMode)}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none",
                          quranNightMode ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200",
                          quranNightMode ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reading Content */}
            <div className={cn("flex-1 overflow-y-auto scrollbar-hide", quranReadingMode === 'page' ? "px-0 h-full w-full" : "px-4 sm:px-6 pb-8")}>
              {/* Bismillah for surahs except 1 and 9 (Only show in Verse mode since pages have it built-in) */}
              {selectedChapter.bismillah_pre && selectedChapter.id !== 1 && selectedChapter.id !== 9 && quranReadingMode !== 'page' && (
                <div className={cn("py-6 text-center border-b transition-colors", quranNightMode ? "border-zinc-800" : "border-zinc-100 dark:border-zinc-800/50")}>
                  <span className={cn("font-quran-amiri text-3xl leading-loose transition-colors", quranNightMode ? "text-zinc-100" : "text-zinc-900 dark:text-zinc-100")}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰнِ ٱلرَّحِيمِ
                  </span>
                </div>
              )}

              {isLoadingVerses ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : quranReadingMode === 'page' ? (
                // PAGE MODE RENDERING
                <div className="flex flex-col h-full animate-in fade-in duration-500">
                  {/* Android Quran Overlay View */}
                  <div className="flex justify-center relative max-w-[1260px] mx-auto w-full h-full mb-0">
                    <ImageOverlay 
                      activePage={activePage} 
                      setActivePage={setActivePage} 
                      selectedChapter={selectedChapter} 
                      toggleBookmark={toggleBookmark} 
                      quranBookmark={quranBookmark} 
                      setIsQuranImmersive={setIsQuranImmersive} 
                      isQuranImmersive={isQuranImmersive}
                      nightMode={quranNightMode}
                    />
                  </div>
                </div>
              ) : (
                // VERSE MODE RENDERING
                <div className="flex flex-col animate-in fade-in duration-500">
                  {chapterVerses.map((verse) => {
                    const isBookmarked = quranBookmark?.chapterId === selectedChapter.id && quranBookmark?.verseId === verse.verse_number;
                    
                    return (
                      <div 
                        id={`verse-${verse.verse_number}`}
                        key={verse.id} 
                        className={cn(
                          "py-8 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors duration-500",
                          isBookmarked && "bg-emerald-50/50 dark:bg-emerald-500/5 mx-[-16px] px-[16px] sm:mx-[-24px] sm:px-[24px]"
                        )}
                      >
                        <div className="flex justify-between items-start gap-4 mb-6">
                          <div className="flex flex-col items-center gap-3 shrink-0 mt-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-bold text-zinc-500">
                              {verse.verse_number}
                            </span>
                            <button 
                              onClick={() => toggleBookmark(selectedChapter, verse)}
                              className="text-zinc-400 hover:text-emerald-500 transition-colors"
                            >
                              {isBookmarked ? (
                                <BookmarkCheck className="w-5 h-5 text-emerald-500" fill="currentColor" />
                              ) : (
                                <Bookmark className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          <p 
                            className="flex-1 text-right font-quran-amiri leading-[2.2] text-zinc-900 dark:text-zinc-100 transition-all duration-300" 
                            dir="rtl"
                            style={{ fontSize: `${quranFontSize}px` }}
                          >
                            {verse.text_uthmani}
                          </p>
                        </div>
                        
                        {verse.translations && verse.translations[0] && (
                          <div className="pl-12">
                            <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                              {verse.translations[0].text}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
