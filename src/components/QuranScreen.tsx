import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Loader2, Bookmark, BookmarkCheck, Minus, Plus, Type } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

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
  const { quranFontSize, setQuranFontSize, quranBookmark, setQuranBookmark, quranReadingMode, setQuranReadingMode } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  
  const [activePage, setActivePage] = useState<number>(0);
  const pagesInChapter = Array.from(new Set(verses.map(v => v.page_number))).sort((a, b) => Number(a) - Number(b));
  const pageVerses = verses.filter(v => v.page_number === activePage);

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

  const loadChapter = async (chapter: Chapter, verseToScroll?: number) => {
    setSelectedChapter(chapter);
    setIsLoadingVerses(true);
    setShowSettings(false);
    setVerses([]);
    try {
      // Use per_page=300 to fetch full chapters (longest is 286 verses)
      const response = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${chapter.id}?language=kk&words=true&word_fields=text_uthmani,line_number,page_number&translations=222&fields=text_uthmani&per_page=300`);
      const data = await response.json();
      setVerses(data.verses);
      
      const chapterPages = Array.from(new Set((data.verses as Verse[]).map(v => v.page_number))).sort((a, b) => Number(a) - Number(b));

      if (verseToScroll) {
        const targetVerse = data.verses.find((v: Verse) => v.verse_number === verseToScroll);
        if (targetVerse) {
          setActivePage(targetVerse.page_number);
        }
        
        if (quranReadingMode === 'verse') {
          setTimeout(() => {
            const el = document.getElementById(`verse-${verseToScroll}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
      } else if (chapterPages.length > 0) {
        setActivePage(chapterPages[0]);
      }
    } catch (error) {
      console.error('Error fetching verses:', error);
    } finally {
      setIsLoadingVerses(false);
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
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-black overflow-hidden relative">
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
            <div className="px-6 pt-12 pb-4 bg-background z-10 sticky top-0">
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
            className="flex flex-col h-full bg-white dark:bg-[#050505]"
          >
            {/* Reading Header */}
            <div className="flex items-center px-4 pt-12 pb-4 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/50 z-20 sticky top-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedChapter(null)}
                className="w-10 h-10 rounded-full mr-2"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div className="flex-1 text-center">
                <h2 className="text-lg font-bold">{selectedChapter.name_simple}</h2>
                <p className="text-xs text-zinc-500">{selectedChapter.translated_name.name}</p>
              </div>
              <Button
                variant={showSettings ? "default" : "ghost"}
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className={cn("w-10 h-10 rounded-full ml-2 transition-colors", showSettings && "bg-emerald-500 hover:bg-emerald-600")}
              >
                <Type className={cn("w-5 h-5", showSettings ? "text-white" : "text-zinc-600 dark:text-zinc-400")} />
              </Button>
            </div>

            {/* Font Settings Drawer/Dropdown (Fixed below header) */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden z-10"
                >
                  <div className="p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Оқу режимі</span>
                      <div className="flex bg-white dark:bg-black p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Шрифт өлшемі</span>
                      <div className="flex items-center gap-4 bg-white dark:bg-black rounded-full p-1 border border-zinc-200 dark:border-zinc-800">
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setQuranFontSize(Math.max(16, quranFontSize - 2))}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-lg font-black w-8 text-center text-emerald-600 dark:text-emerald-400">{quranFontSize}</span>
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setQuranFontSize(Math.min(60, quranFontSize + 2))}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reading Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-32">
              {/* Bismillah for surahs except 1 and 9 */}
              {selectedChapter.bismillah_pre && selectedChapter.id !== 1 && selectedChapter.id !== 9 && (
                <div className="py-10 text-center border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-quran-amiri text-3xl leading-loose text-zinc-900 dark:text-zinc-100">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </span>
                </div>
              )}

              {isLoadingVerses ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : quranReadingMode === 'page' ? (
                // PAGE MODE RENDERING
                <div className="flex flex-col animate-in fade-in duration-500">
                  {/* Page Navigation Top */}
                  <div className="flex items-center justify-between py-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        const idx = pagesInChapter.indexOf(activePage);
                        if (idx > 0) setActivePage(pagesInChapter[idx - 1]);
                      }}
                      disabled={pagesInChapter.indexOf(activePage) === 0}
                      className="text-xs"
                    >
                      Кескі бет
                      <ChevronLeft className="w-4 h-4 mr-1" />
                    </Button>
                    <span className="text-sm font-bold text-zinc-500">{activePage}-бет</span>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        const idx = pagesInChapter.indexOf(activePage);
                        if (idx < pagesInChapter.length - 1) setActivePage(pagesInChapter[idx + 1]);
                      }}
                      disabled={pagesInChapter.indexOf(activePage) === pagesInChapter.length - 1}
                      className="text-xs"
                    >
                      <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
                      Алдыңғы
                    </Button>
                  </div>

                  {/* Arabic Text Block */}
                  <div className="bg-[#fffdf7] dark:bg-black rounded-sm p-4 sm:p-8 shadow-md border border-zinc-200 dark:border-zinc-800 mb-8 max-w-[600px] w-full mx-auto flex flex-col justify-between min-h-[60vh]">
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((lineNum) => {
                      const allWords = verses.flatMap(v => (v.words || []).map(w => ({ ...w, verse: v })));
                      const wordsInLine = allWords.filter(w => w.page_number === activePage && w.line_number === lineNum);

                      if (wordsInLine.length === 0) return <div key={lineNum} className="h-0" />;

                      const isBismillah = wordsInLine.some(w => w.text_uthmani.includes('بِسْمِ'));
                      const isHeader = wordsInLine.some(w => w.char_type_name === 'surah_name');

                      const isShortLine = wordsInLine.length < 5;
                      const justifyClass = isBismillah || isHeader ? "justify-center gap-2" : isShortLine ? "justify-start gap-4" : "justify-between";

                      return (
                        <div key={lineNum} className={cn("flex flex-row-reverse items-center w-full min-h-[3em] leading-none", justifyClass)} dir="rtl">
                          {wordsInLine.map(word => {
                            const isEnd = word.char_type_name === 'end';
                            const isBookmarked = quranBookmark?.chapterId === selectedChapter.id && quranBookmark?.verseId === word.verse.verse_number;
                            
                            return (
                              <button 
                                key={word.id} 
                                onClick={() => toggleBookmark(selectedChapter, word.verse)}
                                className={cn(
                                  "font-quran-amiri transition-colors outline-none",
                                  isEnd ? "text-emerald-700 dark:text-emerald-500 font-normal" : "text-zinc-900 dark:text-zinc-100 font-bold hover:text-emerald-600 dark:hover:text-emerald-400",
                                  isBookmarked && "bg-emerald-100 dark:bg-emerald-900/40 rounded-sm"
                                )} 
                                style={{ fontSize: `clamp(18px, 5vw, 28px)` }}
                                dangerouslySetInnerHTML={{ __html: isEnd ? `&#xFD3F;${word.text_uthmani}&#xFD3E;` : word.text_uthmani }}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Page Navigation Bottom */}
                  <div className="flex items-center justify-between py-6 mt-8 border-t border-zinc-100 dark:border-zinc-800">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const idx = pagesInChapter.indexOf(activePage);
                        if (idx > 0) {
                          setActivePage(pagesInChapter[idx - 1]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={pagesInChapter.indexOf(activePage) === 0}
                      className="rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Келесі бет
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const idx = pagesInChapter.indexOf(activePage);
                        if (idx < pagesInChapter.length - 1) {
                          setActivePage(pagesInChapter[idx + 1]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={pagesInChapter.indexOf(activePage) === pagesInChapter.length - 1}
                      className="rounded-xl"
                    >
                      Алдыңғы бет
                      <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </div>
              ) : (
                // VERSE MODE RENDERING
                <div className="flex flex-col animate-in fade-in duration-500">
                  {verses.map((verse) => {
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
