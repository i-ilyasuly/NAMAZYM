import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

type QuranScope = 'home' | 'test';

interface QuranState {
  surahNumber: number;
  level: number;
  isTajweedEnabled: boolean;
  fontFamily: string;
  fontSizeLevel: number;
  isPaused: boolean;
  pos: number;
  textWidth: number;
  quranText: string;
  quranTajweedText: string;
  surahInfo: { id: number; name: string } | null;
  isLoading: boolean;
  error: boolean;
  audioTimestamps: any[];
  audioSegments: any[];
  audioData: any | null;
  reciterId: number;
  savedAudioTime?: number;
}

interface QuranContextType {
  // Scoped access
  getScopeState: (scope: QuranScope) => QuranState;
  
  setSurahNumber: (id: number, scope?: QuranScope) => void;
  setLevel: (l: number, scope?: QuranScope) => void;
  setIsTajweedEnabled: (v: boolean, scope?: QuranScope) => void;
  setFontFamily: (v: string, scope?: QuranScope) => void;
  setFontSizeLevel: (v: number, scope?: QuranScope) => void;
  togglePause: (scope?: QuranScope) => void;
  setPos: (pos: number, scope?: QuranScope) => void;
  getPos: (scope?: QuranScope) => number;
  setIsDragging: (dragging: boolean, scope?: QuranScope) => void;
  setTextWidth: (w: number, scope?: QuranScope) => void;
  
  nextSurah: (scope?: QuranScope) => void;
  prevSurah: (scope?: QuranScope) => void;
  fetchSurah: (id: number, scope?: QuranScope, forcedReciterId?: number) => Promise<void>;
  
  // Shared audio engine
  audioPlayerRef: React.MutableRefObject<HTMLAudioElement | null>;
  isPlayingAudio: boolean;
  activeAudioScope: QuranScope | null;
  toggleAudio: (scope?: QuranScope) => void;
  reciters: any[];
  setReciterId: (id: number, scope?: QuranScope) => void;
  reciterId: number;
  surahList: any[];

  // Helpers
  toArabicNumber: (n: number) => string;

  // Compatibility (maps to Home scope)
  surahNumber: number;
  level: number;
  quranText: string;
  quranTajweedText: string;
  isTajweedEnabled: boolean;
  fontFamily: string;
  fontSizeLevel: number;
  isPaused: boolean;
  surahInfo: { id: number; name: string } | null;
  isLoading: boolean;
  error: boolean;
  textWidth: number;
  audioTimestamps: any[];
}

const QuranContext = createContext<QuranContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'namazym_quran_v3_';

const createDefaultState = (scope: QuranScope): QuranState => ({
  surahNumber: 1,
  level: 3,
  isTajweedEnabled: false,
  fontFamily: 'font-quran-amiri',
  fontSizeLevel: 5,
  isPaused: false,
  pos: 0,
  textWidth: 0,
  quranText: "",
  quranTajweedText: "",
  surahInfo: null,
  isLoading: true,
  error: false,
  audioTimestamps: [],
  audioSegments: [],
  audioData: null,
  reciterId: parseInt(localStorage.getItem(`quran_reciter_id_${scope}`) || '7', 10)
});

export const QuranProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scopes, setScopes] = useState<Record<QuranScope, QuranState>>({
    home: createDefaultState('home'),
    test: createDefaultState('test')
  });

  const scopesRef = useRef(scopes);
  useEffect(() => {
    scopesRef.current = scopes;
  }, [scopes]);

  const posRefs = useRef<Record<QuranScope, number>>({ home: 0, test: 0 });
  const textWidthRefs = useRef<Record<QuranScope, number>>({ home: 0, test: 0 });
  const isPausedRefs = useRef<Record<QuranScope, boolean>>({ home: false, test: false });
  const isDraggingRefs = useRef<Record<QuranScope, boolean>>({ home: false, test: false });
  const audioTimestampsRefs = useRef<Record<QuranScope, any[]>>({ home: [], test: [] });
  const audioSegmentsRefs = useRef<Record<QuranScope, any[]>>({ home: [], test: [] });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioScopeRef = useRef<QuranScope | null>(null);
  const [activeAudioScope, setActiveAudioScope] = useState<QuranScope | null>(null);
  
  const [reciters, setReciters] = useState<any[]>([]);
  const [surahList, setSurahList] = useState<any[]>([]);
  
  const updateScopeState = useCallback((scope: QuranScope, updates: Partial<QuranState>) => {
    setScopes(prev => ({
      ...prev,
      [scope]: { ...prev[scope], ...updates }
    }));
    
    if (updates.isPaused !== undefined) isPausedRefs.current[scope] = updates.isPaused;
    if (updates.textWidth !== undefined) textWidthRefs.current[scope] = updates.textWidth;
    if (updates.audioTimestamps !== undefined) audioTimestampsRefs.current[scope] = updates.audioTimestamps;
    if (updates.audioSegments !== undefined) audioSegmentsRefs.current[scope] = updates.audioSegments;
    
    if (updates.fontSizeLevel !== undefined || updates.isTajweedEnabled !== undefined || updates.fontFamily !== undefined) {
       layerRef.current = null;
       verseElRef.current = null;
       lastVerseRef.current = null;
    }
  }, []);

  const toArabicNumber = useCallback((n: number) => {
    return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
  }, []);

  const fetchSurah = useCallback(async (id: number, scope: QuranScope = 'home', forcedReciterId?: number) => {
    updateScopeState(scope, { isLoading: true, error: false, surahNumber: id });
    try {
      const activeReciterId = forcedReciterId || scopesRef.current[scope].reciterId;
      
      // We fetch primary surah data in parallel
      const [infoRes, versesRes, tajweedRes] = await Promise.all([
        fetch(`https://api.quran.com/api/v4/chapters/${id}`).then(r => r.ok ? r.json() : Promise.reject(`Chapters API Error: ${r.status}`)),
        fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}&per_page=300`).then(r => r.ok ? r.json() : Promise.reject(`Verses API Error: ${r.status}`)),
        fetch(`https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=${id}&per_page=300`).then(r => r.ok ? r.json() : Promise.reject(`Tajweed API Error: ${r.status}`))
      ]);

      // Then we try to fetch audio, but don't let it block or break the surah data state
      let audioRes = null;
      try {
        const audioFetchWithSegments = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${activeReciterId}/${id}?segments=true`);
        if (audioFetchWithSegments.ok) {
          audioRes = await audioFetchWithSegments.json();
        } else {
          // If 404 or other error, fallback to without segments
          const audioFetchNoSegments = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${activeReciterId}/${id}`);
          if (audioFetchNoSegments.ok) {
            audioRes = await audioFetchNoSegments.json();
          } else {
            console.warn(`Could not load audio for reciter ${activeReciterId} and chapter ${id}`);
          }
        }
      } catch (audioErr) {
        console.error("Audio fetch error:", audioErr);
      }
      
      if (versesRes.verses && infoRes.chapter && tajweedRes.verses) {
        const audioUrl = audioRes?.audio_file?.audio_url;
        const timestamps = audioRes?.audio_file?.timestamps || [];
        const segments: any[] = [];
        
        timestamps.forEach((t: any, idx: number) => {
          if (t.segments) {
            t.segments.forEach((s: any) => {
              // Flatten to: [verseId, wordIdx, timeStart, timeEnd]
              segments.push([idx + 1, s[0], s[1], s[2]]);
            });
          }
        });
        
        if (activeAudioScopeRef.current === scope && audioPlayerRef.current) {
          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.load();
        }

        const fullTajweedText = tajweedRes.verses.map((v: any, i: number) => {
          const cleanTajweed = v.text_uthmani_tajweed.replace(/<span class=["']?end["']?>.*?<\/span>/g, '').trim();
          return `<span data-verse="${i + 1}">${cleanTajweed} ﴿${toArabicNumber(v.verse_number || i + 1)}﴾</span>`;
        }).join("  ");

        const fullPlainText = versesRes.verses.map((v: any, i: number) => {
          return `<span data-verse="${i + 1}">${v.text_uthmani} ﴿${toArabicNumber(v.verse_number || i + 1)}﴾</span>`;
        }).join("  ");

        updateScopeState(scope, {
          quranText: fullPlainText,
          quranTajweedText: fullTajweedText,
          surahInfo: { id: infoRes.chapter.id, name: infoRes.chapter.name_arabic },
          isLoading: false,
          audioTimestamps: timestamps,
          audioSegments: segments,
          audioData: audioRes,
          ...(forcedReciterId ? { reciterId: forcedReciterId } : {})
        });
      }
    } catch (err) {
      console.error(err);
      updateScopeState(scope, { isLoading: false, error: true });
    }
  }, [scopes, toArabicNumber, updateScopeState]);

  // LOAD ON MOUNT & STATIC DATA
  useEffect(() => {
    // 1. Static resources
    fetch('https://api.quran.com/api/v4/resources/recitations').then(r => r.ok ? r.json() : Promise.reject('Invalid')).then(d => d.recitations && setReciters(d.recitations)).catch(() => {});
    fetch('https://api.quran.com/api/v4/chapters?language=en').then(r => r.ok ? r.json() : Promise.reject('Invalid')).then(d => d.chapters && setSurahList(d.chapters)).catch(() => {});

    // 2. Audio element creation
    const audio = new Audio();
    audio.onplay = () => setIsPlayingAudio(true);
    audio.onpause = () => setIsPlayingAudio(false);
    audio.onended = () => {
      setIsPlayingAudio(false);
      const scope = activeAudioScopeRef.current;
      if (scope) {
        // This is tricky because we need the latest scopes state. 
        // We'll use a functional state update or another ref if needed.
        // For now, nextSurah is safer if it's aware of the scope.
      }
    };
    audioPlayerRef.current = audio;

    // 3. Rehydrate and initial fetch
    const hydrate = async () => {
      const scopesToLoad = ['home' as QuranScope, 'test' as QuranScope];
      for (const scope of scopesToLoad) {
        let currentSurah = 1;
        try {
          const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${scope}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            currentSurah = parsed.surahNumber || 1;
            posRefs.current[scope] = parsed.pos || 0;
            updateScopeState(scope, { ...parsed, isLoading: true, isPaused: true });
          }
        } catch (e) {}
        await fetchSurah(currentSurah, scope);
      }
    };
    hydrate();

    return () => { audio.pause(); audio.src = ""; };
  }, []); // Run ONCE on mount

  // Periodically persist the current state (surah, position, preferences) to localStorage
  useEffect(() => {
    const timer = setInterval(() => {
      (['home', 'test'] as QuranScope[]).forEach(scope => {
         const st = scopes[scope];
         if (st.quranText) { // only save if loaded
           localStorage.setItem(`${STORAGE_KEY_PREFIX}${scope}`, JSON.stringify({
              surahNumber: st.surahNumber,
              level: st.level,
              isTajweedEnabled: st.isTajweedEnabled,
              fontFamily: st.fontFamily,
              fontSizeLevel: st.fontSizeLevel,
              isPaused: isPausedRefs.current[scope],
              pos: posRefs.current[scope],
              reciterId: st.reciterId,
           }));
         }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [scopes, STORAGE_KEY_PREFIX]);

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const lastAudioTimeRefs = useRef<Record<string, number>>({ home: -1, test: -1 });
  const smoothAudioTimeRefs = useRef<Record<string, number>>({ home: 0, test: 0 });

  // 🔴 CRITICAL ALGORITHM: DO NOT MODIFY! AUDIO SYNC LOGIC 🔴
  // Smooth predictive interpolation ensures 60fps scrolling while syncing with audio.
  // Modify ONLY if user explicitly requests changes to the audio sync engine.
  const layerRef = useRef<HTMLElement | null>(null);
  const lastVerseRef = useRef<string | null>(null);
  const verseElRef = useRef<HTMLElement | null>(null);

  const animate = useCallback((time: number) => {
    const deltaTime = (time - lastTimeRef.current) / 1000;
    
    (Object.keys(scopesRef.current) as QuranScope[]).forEach(scope => {
      // Direct visual update
      const visualId = scope === 'test' ? 'quran-visual-native' : 'quran-visual-layer';
      const visualEl = document.getElementById(visualId);
      if (visualEl) {
        visualEl.style.transform = `translateX(${posRefs.current[scope]}px)`;
      }

      if (isDraggingRefs.current[scope] || isPausedRefs.current[scope]) {
        // No auto-scroll
      } else {
        const audioIsActive = audioPlayerRef.current && !audioPlayerRef.current.paused && activeAudioScopeRef.current === scope;
        const currentLevel = scopesRef.current[scope].level;
        const pixelsPerSecond = 30 + (currentLevel - 1) * 15;
        const currentTextWidth = textWidthRefs.current[scope];

        if (audioIsActive && currentTextWidth > 0) {
          const rawMs = audioPlayerRef.current!.currentTime * 1000;
          
          if (lastAudioTimeRefs.current[scope] !== rawMs) {
            lastAudioTimeRefs.current[scope] = rawMs;
            if (Math.abs(smoothAudioTimeRefs.current[scope] - rawMs) > 500) {
              smoothAudioTimeRefs.current[scope] = rawMs;
            }
          } else {
            smoothAudioTimeRefs.current[scope] += deltaTime * 1000;
          }
          
          const deltaSync = (rawMs - smoothAudioTimeRefs.current[scope]);
          if (deltaSync < 0 && Math.abs(deltaSync) < 100) {
             // Stay
          } else if (Math.abs(deltaSync) > 5) {
             smoothAudioTimeRefs.current[scope] += deltaSync * 0.08;
          }
          
          const currentMs = smoothAudioTimeRefs.current[scope];
          const currentStamps = audioTimestampsRefs.current[scope];
          const currentSegs = audioSegmentsRefs.current[scope];

          if (currentStamps.length > 0) {
            let verseIdx = currentStamps.findIndex((t: any) => currentMs >= t.timestamp_from && currentMs <= t.timestamp_to);
             if (verseIdx === -1) {
                const nextIdx = currentStamps.findIndex((t: any) => t.timestamp_from > currentMs);
                verseIdx = nextIdx === -1 ? currentStamps.length - 1 : Math.max(0, nextIdx - 1);
            }

            const queryId = scope === 'test' ? 'quran-measurement-native' : 'quran-measurement-layer';
            if (!layerRef.current || (layerRef.current as any).queryId !== queryId) {
               layerRef.current = document.getElementById(queryId);
               if (layerRef.current) (layerRef.current as any).queryId = queryId;
               verseElRef.current = null;
            }

            const verseIdStr = (verseIdx + 1).toString();
            if (lastVerseRef.current !== verseIdStr || !verseElRef.current || !layerRef.current) {
               lastVerseRef.current = verseIdStr;
               verseElRef.current = layerRef.current?.querySelector(`[data-verse="${verseIdStr}"]`) as HTMLElement;
            }

            const verseEl = verseElRef.current;
            const verseObj = currentStamps[verseIdx];

            if (verseEl && verseObj && currentTextWidth > 0) {
              let progress = 0;
              const vSegs = currentSegs.filter((s: any) => s[0].toString() === verseIdStr);
              
              if (vSegs.length > 0) {
                const cur = vSegs.find((s: any) => currentMs >= s[2] && currentMs <= s[3]);
                if (cur) {
                  progress = (cur[1] - 1 + ((currentMs - cur[2]) / (cur[3] - cur[2] || 1))) / vSegs.length;
                } else {
                  const last = vSegs[vSegs.length - 1];
                  if (currentMs > last[3]) progress = 1;
                }
              } else {
                progress = (currentMs - verseObj.timestamp_from) / (verseObj.timestamp_to - verseObj.timestamp_from || 1);
              }

              const dRight = currentTextWidth - (verseEl.offsetLeft + verseEl.offsetWidth);
              const target = dRight + Math.min(1.02, Math.max(-0.02, progress)) * verseEl.offsetWidth;
              
              const diff = target - posRefs.current[scope];
              if (Math.abs(diff) > 300) {
                 posRefs.current[scope] = target;
              } else {
                 posRefs.current[scope] += diff * 0.15; 
              }
            }
          }
        } else {
          posRefs.current[scope] += pixelsPerSecond * deltaTime;
        }

        if (currentTextWidth > 0 && posRefs.current[scope] >= currentTextWidth) {
          const next = scopesRef.current[scope].surahNumber < 114 ? scopesRef.current[scope].surahNumber + 1 : 1;
          fetchSurah(next, scope);
          posRefs.current[scope] = 0;
        }
      }
    });

    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [fetchSurah]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  const value: QuranContextType = {
    getScopeState: (s) => scopes[s],
    setSurahNumber: (id, s = 'home') => { posRefs.current[s] = 0; fetchSurah(id, s); },
    setLevel: (l, s = 'home') => updateScopeState(s, { level: l }),
    setIsTajweedEnabled: (v, s = 'home') => updateScopeState(s, { isTajweedEnabled: v }),
    setFontFamily: (v, s = 'home') => updateScopeState(s, { fontFamily: v }),
    setFontSizeLevel: (v, s = 'home') => updateScopeState(s, { fontSizeLevel: v }),
    togglePause: (s = 'home') => updateScopeState(s, { isPaused: !scopes[s].isPaused }),
    setPos: (v, s = 'home') => { posRefs.current[s] = v; },
    getPos: (s = 'home') => posRefs.current[s],
    setIsDragging: (d, s = 'home') => { isDraggingRefs.current[s] = d; },
    setTextWidth: (w, s = 'home') => { textWidthRefs.current[s] = w; updateScopeState(s, { textWidth: w }); },
    nextSurah: (s = 'home') => { const next = scopes[s].surahNumber < 114 ? scopes[s].surahNumber + 1 : 1; posRefs.current[s] = 0; fetchSurah(next, s); },
    prevSurah: (s = 'home') => { const prev = scopes[s].surahNumber > 1 ? scopes[s].surahNumber - 1 : 114; posRefs.current[s] = 0; fetchSurah(prev, s); },
    fetchSurah,
    audioPlayerRef,
    isPlayingAudio,
    activeAudioScope,
    toggleAudio: (scope = 'home') => {
      if (!audioPlayerRef.current) return;
      
      const player = audioPlayerRef.current;
      
      // If we are already playing in this scope, pause it
      if (activeAudioScopeRef.current === scope && !player.paused) {
        player.pause();
        return;
      }
      
      const sData = scopes[scope];
      if (!sData.audioTimestamps || sData.audioTimestamps.length === 0) {
        console.warn('Audio data not ready for scope', scope);
      }

      // If we are switching scopes or starting fresh, ensure the src is correct
      const targetUrl = sData.audioData?.audio_file?.audio_url;
      if (targetUrl) {
         const currentSrc = player.src || '';
         const targetPath = targetUrl.startsWith('//') ? targetUrl.substring(2) : targetUrl;
         if (!currentSrc.includes(targetPath)) {
            player.pause(); // Ensure we are paused before changing src
            player.src = targetUrl;
            player.load();
         }
      }

      activeAudioScopeRef.current = scope;
      setActiveAudioScope(scope);
      
      const queryId = scope === 'test' ? 'quran-measurement-native' : 'quran-measurement-layer';
      const l = document.getElementById(queryId);
      const pos = posRefs.current[scope];
      const tw = textWidthRefs.current[scope];
      const stamps = audioTimestampsRefs.current[scope];
      
      if (l && tw > 0 && stamps.length > 0) {
        const verses = l.querySelectorAll('[data-verse]');
        for (let i = 0; i < verses.length; i++) {
          const el = verses[i] as HTMLElement;
          const dS = tw - (el.offsetLeft + el.offsetWidth);
          const dE = dS + el.offsetWidth;
          if (pos >= dS && pos <= dE) {
             const vIdx = parseInt(el.getAttribute('data-verse') || "1", 10) - 1;
             const vObj = stamps[vIdx];
             if (vObj) {
               const progress = (pos - dS) / (el.offsetWidth || 1);
               const targetTime = (vObj.timestamp_from + progress * (vObj.timestamp_to - vObj.timestamp_from)) / 1000;
               
               const setTimeSafe = () => {
                 try {
                   player.currentTime = targetTime;
                 } catch (e) {
                   console.warn("Retrying currentTime set...");
                 }
               };

               if (player.readyState >= 1) {
                 setTimeSafe();
               } else {
                 player.onloadedmetadata = () => {
                   setTimeSafe();
                   player.onloadedmetadata = null;
                 };
               }
             }
             break;
          }
        }
      }
      
      // Fix: Wrap play() in a promise check to prevent interruption errors
      const playPromise = player.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name === 'AbortError') {
            console.log('Playback was interrupted, this is expected if toggle is fast.');
          } else {
            console.error('Playback error:', error);
          }
        });
      }
      
      updateScopeState(scope, { isPaused: false });
    },
    reciters,
    reciterId: scopes.home.reciterId, 
    setReciterId: (id, s = 'home') => {
       updateScopeState(s, { reciterId: id });
       localStorage.setItem(`quran_reciter_id_${s}`, id.toString());
       fetchSurah(scopes[s].surahNumber, s, id);
    },
    surahList,
    toArabicNumber,
    // Compatibilities mapping to Home
    surahNumber: scopes.home.surahNumber,
    level: scopes.home.level,
    quranText: scopes.home.quranText,
    quranTajweedText: scopes.home.quranTajweedText,
    isTajweedEnabled: scopes.home.isTajweedEnabled,
    fontFamily: scopes.home.fontFamily,
    fontSizeLevel: scopes.home.fontSizeLevel,
    isPaused: scopes.home.isPaused,
    surahInfo: scopes.home.surahInfo,
    isLoading: scopes.home.isLoading,
    error: scopes.home.error,
    textWidth: scopes.home.textWidth,
    audioTimestamps: scopes.home.audioTimestamps
  };

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
};

export const useQuran = (scope: QuranScope = 'home') => {
  const context = useContext(QuranContext);
  if (!context) throw new Error('useQuran must be used within a QuranProvider');
  
  // Use a ref so the bound functions can be completely stable and always access the latest context
  const contextRef = useRef(context);
  contextRef.current = context;
  
  const boundActions = useMemo(() => ({
    setSurahNumber: (id: number) => contextRef.current.setSurahNumber(id, scope),
    setLevel: (l: number) => contextRef.current.setLevel(l, scope),
    setIsTajweedEnabled: (v: boolean) => contextRef.current.setIsTajweedEnabled(v, scope),
    setFontFamily: (v: string) => contextRef.current.setFontFamily(v, scope),
    setFontSizeLevel: (v: number) => contextRef.current.setFontSizeLevel(v, scope),
    togglePause: () => contextRef.current.togglePause(scope),
    setPos: (v: number) => contextRef.current.setPos(v, scope),
    getPos: () => contextRef.current.getPos(scope),
    setIsDragging: (d: boolean) => contextRef.current.setIsDragging(d, scope),
    setTextWidth: (w: number) => contextRef.current.setTextWidth(w, scope),
    nextSurah: () => contextRef.current.nextSurah(scope),
    prevSurah: () => contextRef.current.prevSurah(scope),
    fetchSurah: (id: number, forcedReciterId?: number) => contextRef.current.fetchSurah(id, scope, forcedReciterId),
    toggleAudio: () => contextRef.current.toggleAudio(scope),
    setReciterId: (id: number) => contextRef.current.setReciterId(id, scope)
  }), [scope]);

  // Create a proxy/wrapper for the selected scope to make it feel like the standard hook
  const scopeState = context.getScopeState(scope);
  
  return {
    ...context,
    ...scopeState,
    ...boundActions
  };
};
