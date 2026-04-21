import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Search, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { Chapter } from './types';

interface QuranListProps {
  chapters: Chapter[];
  isLoadingChapters: boolean;
  loadChapter: (chapter: Chapter, verseToScroll?: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function QuranList({ chapters, isLoadingChapters, loadChapter, searchQuery, setSearchQuery }: QuranListProps) {
  const { isStarrySky, quranBookmark } = useStore();

  const filteredChapters = chapters.filter(c => 
    c.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.translated_name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toString().includes(searchQuery)
  );

  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className={cn("px-6 pt-6 pb-4 z-10 sticky top-0 transition-colors", isStarrySky ? "bg-transparent" : "bg-background")}>
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
                className={cn(
                  "bg-white dark:bg-[#111] border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-colors text-left active:scale-[0.98] transform-gpu",
                  isStarrySky && "bg-card/40 backdrop-blur-md"
                )}
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
  );
}
