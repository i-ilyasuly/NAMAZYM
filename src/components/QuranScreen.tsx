import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useStore, MUSHAFS } from '../store';
import { Chapter, Verse } from './quran/types';
import { QuranList } from './quran/QuranList';
import { QuranReader } from './quran/QuranReader';

export function QuranScreen() {
  const { 
    quranBookmark, setQuranBookmark, 
    quranReadingMode, quranNightMode, 
    quranMushaf, setQuranMushaf, 
    isStarrySky 
  } = useStore();

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
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [activePage, setActivePage] = useState<number>(1);
  
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

  useEffect(() => {
    if (!selectedChapter) return;
    const controller = new AbortController();

    const fetchContent = async () => {
      if (quranReadingMode === 'page') {
        setIsLoadingVerses(false);
      } else {
        setIsLoadingVerses(true);
        try {
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
    
    let targetPage = chapter.pages[0]; 

    try {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${chapter.id}?mushaf=${quranMushaf.mushafId}&fields=page_number,verse_number&per_page=1`);
      const data = await res.json();
      if (data.verses && data.verses[0]) {
        targetPage = data.verses[0].page_number;
      }
    } catch (e) {}

    if (verseToScroll) {
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

    if (quranReadingMode === 'verse' && verseToScroll) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${verseToScroll}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500); 
    }
  };

  const toggleBookmark = (chapter: Chapter, verse: Verse) => {
    if (quranBookmark?.chapterId === chapter.id && quranBookmark?.verseId === verse.verse_number) {
      setQuranBookmark(null); 
    } else {
      setQuranBookmark({
        chapterId: chapter.id,
        verseId: verse.verse_number,
        chapterName: chapter.name_simple
      });
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden relative transition-colors",
      isStarrySky ? "bg-transparent" : (quranNightMode ? "bg-zinc-950" : "bg-zinc-50")
    )}>
      <AnimatePresence mode="wait">
        {!selectedChapter ? (
          <QuranList 
            chapters={chapters} 
            isLoadingChapters={isLoadingChapters} 
            loadChapter={loadChapter} 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />
        ) : (
          <QuranReader
            selectedChapter={selectedChapter}
            setSelectedChapter={setSelectedChapter}
            chapterVerses={chapterVerses}
            isLoadingVerses={isLoadingVerses}
            activePage={activePage}
            setActivePage={setActivePage}
            toggleBookmark={toggleBookmark}
            loadChapter={loadChapter}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
