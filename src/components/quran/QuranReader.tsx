import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Loader2, Bookmark, BookmarkCheck, Minus, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useStore, MUSHAFS } from '../../store';
import { Chapter, Verse } from './types';
import { ImageOverlay } from './ImageOverlay';

interface QuranReaderProps {
  selectedChapter: Chapter;
  setSelectedChapter: (chapter: Chapter | null) => void;
  chapterVerses: Verse[];
  isLoadingVerses: boolean;
  activePage: number;
  setActivePage: React.Dispatch<React.SetStateAction<number>>;
  toggleBookmark: (chapter: Chapter, verse: Verse) => void;
  loadChapter: (chapter: Chapter, verseToScroll?: number) => void;
}

export function QuranReader({
  selectedChapter,
  setSelectedChapter,
  chapterVerses,
  isLoadingVerses,
  activePage,
  setActivePage,
  toggleBookmark,
  loadChapter
}: QuranReaderProps) {
  const { 
    quranFontSize, setQuranFontSize, 
    quranBookmark, 
    quranReadingMode, setQuranReadingMode, 
    isQuranImmersive, setIsQuranImmersive, 
    quranNightMode, setQuranNightMode, 
    quranMushaf, setQuranMushaf, 
    isStarrySky 
  } = useStore();
  
  const [showSettings, setShowSettings] = useState(false);

  return (
    <motion.div
      key="reader"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "flex flex-col h-full transition-colors duration-300", 
        isStarrySky ? "bg-transparent" : (quranNightMode ? "bg-zinc-950" : "bg-white")
      )}
    >
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
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50"
            >
              <div className="flex flex-col gap-1">
                <span className="w-4 h-0.5 bg-zinc-600 dark:bg-zinc-400 rounded-full" />
                <span className="w-4 h-0.5 bg-zinc-600 dark:bg-zinc-400 rounded-full" />
                <span className="w-4 h-0.5 bg-zinc-600 dark:bg-zinc-400 rounded-full" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "overflow-hidden border-b z-10 transition-colors",
              quranReadingMode === 'page' && "absolute top-[72px] left-0 w-full",
              quranNightMode ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800/50"
            )}
          >
            <div className="p-4 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-bold", quranNightMode ? "text-zinc-100" : "text-zinc-900 dark:text-zinc-100")}>Мұсхаф түрі</span>
                <select 
                  value={quranMushaf.id}
                  onChange={(e) => {
                    const m = MUSHAFS.find(m => m.id === e.target.value);
                    if (m) {
                      setQuranMushaf(m);
                      if (selectedChapter) loadChapter(selectedChapter);
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

      <div className={cn("flex-1 overflow-y-auto scrollbar-hide", quranReadingMode === 'page' ? "px-0 h-full w-full" : "px-4 sm:px-6 pb-8")}>
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
          <div className="flex flex-col h-full animate-in fade-in duration-500">
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
  );
}
