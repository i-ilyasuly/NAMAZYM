import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface QuranContextType {
  surahNumber: number;
  setSurahNumber: (id: number) => void;
  level: number;
  setLevel: (l: number) => void;
  quranText: string;
  quranTajweedText: string;
  isTajweedEnabled: boolean;
  setIsTajweedEnabled: (v: boolean) => void;
  fontFamily: string;
  setFontFamily: (v: string) => void;
  fontSizeLevel: number;
  setFontSizeLevel: (v: number) => void;
  isPaused: boolean;
  togglePause: () => void;
  surahInfo: { id: number; name: string } | null;
  isLoading: boolean;
  error: boolean;
  getPos: () => number;
  setPos: (pos: number) => void;
  setIsDragging: (dragging: boolean) => void;
  textWidth: number;
  setTextWidth: (w: number) => void;
  pixelsPerSecond: number;
  nextSurah: () => void;
  prevSurah: () => void;
  fetchSurah: (id: number) => Promise<void>;
  
  // Audio
  audioPlayerRef: React.MutableRefObject<HTMLAudioElement | null>;
  isPlayingAudio: boolean;
  toggleAudio: () => void;
  audioTimestamps: any[];
  reciters: any[];
  reciterId: number;
  setReciterId: (id: number) => void;
  surahList: any[];
}

const QuranContext = createContext<QuranContextType | undefined>(undefined);

const STORAGE_KEY = 'namazym_quran_state';
const getInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) { return null; }
};
const initialState = getInitialState();

export const QuranProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [surahNumber, setSurahNumberState] = useState(initialState?.surahNumber || 1);
  const [level, setLevel] = useState(initialState?.level || 3);
  const [quranText, setQuranText] = useState("");
  const [quranTajweedText, setQuranTajweedText] = useState("");
  const [isTajweedEnabled, setIsTajweedEnabled] = useState(initialState?.isTajweedEnabled || false);
  const [fontFamily, setFontFamily] = useState(initialState?.fontFamily || 'font-quran-amiri');
  const [fontSizeLevel, setFontSizeLevel] = useState(initialState?.fontSizeLevel || 5);
  const [isPaused, setIsPaused] = useState(initialState?.isPaused || false);
  const isPausedRef = useRef(isPaused);
  const [surahInfo, setSurahInfo] = useState<{ id: number; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [textWidth, setTextWidth] = useState(0);
  const posRef = useRef(0);
  const textWidthRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Audio setup
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [audioTimestamps, setAudioTimestampsState] = useState<any[]>([]);
  const audioTimestampsRef = useRef<any[]>([]);
  const [reciters, setReciters] = useState<any[]>([]);
  const [surahList, setSurahList] = useState<any[]>([]);
  const [reciterId, setReciterIdState] = useState<number>(() => {
    return parseInt(localStorage.getItem('quran_reciter_id') || '7', 10);
  });

  const setReciterId = useCallback((id: number) => {
    setReciterIdState(id);
    localStorage.setItem('quran_reciter_id', id.toString());
  }, []);

  const setAudioTimestamps = useCallback((data: any[]) => {
    audioTimestampsRef.current = data;
    setAudioTimestampsState(data);
  }, []);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.onplay = () => setIsPlayingAudio(true);
    audio.onpause = () => setIsPlayingAudio(false);
    audio.onended = () => {
      setIsPlayingAudio(false);
      nextSurah();
    };
    audioPlayerRef.current = audio;
    
    // Fetch available reciters
    fetch('https://api.quran.com/api/v4/resources/recitations')
      .then(res => res.json())
      .then(data => {
        if (data.recitations) {
          setReciters(data.recitations);
        }
      })
      .catch(console.error);
      
    // Fetch chapters list
    const lng = localStorage.getItem('i18nextLng') || 'kk';
    const apiLng = lng === 'ru' ? 'ru' : 'en'; // default to en if not ru for Kazakh for now
    fetch(`https://api.quran.com/api/v4/chapters?language=${apiLng}`)
      .then(res => res.json())
      .then(data => {
        if (data.chapters) {
          setSurahList(data.chapters);
        }
      })
      .catch(console.error);
      
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toArabicNumber = useCallback((n: number) => {
    return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
  }, []);
  const containerWidthRef = useRef(0);
  const lastTimeRef = useRef(0);
  const requestRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const initialPosRef = useRef<number | null>(initialState?.pos !== undefined ? initialState.pos : null);

  // Update refs when state changes for animation loop
  useEffect(() => {
    textWidthRef.current = textWidth;
    if (textWidth > 0 && !isInitializedRef.current) {
      if (initialPosRef.current !== null) {
        posRef.current = initialPosRef.current;
        initialPosRef.current = null;
      } else {
        posRef.current = 0; 
      }
      isInitializedRef.current = true;
    }
  }, [textWidth]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const saveState = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        surahNumber,
        isPaused,
        level,
        fontSizeLevel,
        fontFamily,
        isTajweedEnabled,
        pos: posRef.current
      }));
    };
    const interval = setInterval(saveState, 2000);
    window.addEventListener('beforeunload', saveState);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', saveState);
    };
  }, [surahNumber, isPaused, level, fontSizeLevel, fontFamily, isTajweedEnabled]);

  const handleSetTextWidth = useCallback((w: number) => {
    setTextWidth(prev => (prev === w ? prev : w));
  }, []);

  const handleSetIsDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging;
  }, []);

  useEffect(() => {
    const updateContainerWidth = () => {
      containerWidthRef.current = window.innerWidth;
    };
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  const pixelsPerSecond = React.useMemo(() => {
    // Current requirement: Max speed (level 10) should equal previous level 5 speed (165px).
    // Start at a base speed of 30px/s, up to 165px/s at level 10.
    return 30 + (level - 1) * 15;
  }, [level]);

  const fetchSurah = useCallback(async (id: number, activeReciterId: number = reciterId) => {
    setIsLoading(true);
    setError(false);
    try {
      const infoResPromise = fetch(`https://api.quran.com/api/v4/chapters/${id}`).then(r => r.json());
      const versesResPromise = fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}&per_page=300`).then(r => r.json());
      const tajweedResPromise = fetch(`https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=${id}&per_page=300`).then(r => r.json());
      // Dynamic Recitation based on reciterId
      const audioResPromise = fetch(`https://api.quran.com/api/v4/chapter_recitations/${activeReciterId}/${id}?segments=true`).then(r => r.json());
      
      const [infoData, versesData, tajweedData, audioData] = await Promise.all([infoResPromise, versesResPromise, tajweedResPromise, audioResPromise]);
      
      if (versesData.verses && infoData.chapter && tajweedData.verses) {
        if (audioData?.audio_file?.audio_url && audioPlayerRef.current) {
          const wasPlaying = !audioPlayerRef.current.paused;
          audioPlayerRef.current.src = audioData.audio_file.audio_url;
          audioPlayerRef.current.load();
          
          if (audioData?.audio_file?.timestamps) {
            setAudioTimestamps(audioData.audio_file.timestamps);
          } else {
            setAudioTimestamps([]);
          }
          
          // MAGIC SYNC: Sync audio to current visual position when reciter changes
          const currentPos = posRef.current;
          const layer = document.getElementById('quran-measurement-layer');
          const tw = textWidthRef.current;
          
          let targetSeekMs = 0;
          if (layer && tw > 0 && audioData?.audio_file?.timestamps) {
            const verses = layer.querySelectorAll('[data-verse]');
            for (let i = 0; i < verses.length; i++) {
              const el = verses[i] as HTMLElement;
              const dStart = tw - (el.offsetLeft + el.offsetWidth);
              const dEnd = dStart + el.offsetWidth;
              
              if (currentPos >= dStart && currentPos <= dEnd) {
                const verseIndex = parseInt(el.getAttribute('data-verse') || "1", 10) - 1;
                const timestamps = audioData.audio_file.timestamps;
                
                if (timestamps && timestamps[verseIndex]) {
                  const vObj = timestamps[verseIndex];
                  const progress = (currentPos - dStart) / el.offsetWidth;
                  const verseDuration = vObj.timestamp_to - vObj.timestamp_from;
                  targetSeekMs = vObj.timestamp_from + (progress * verseDuration);
                }
                break;
              }
            }
          }

          const onMetadata = () => {
             if (targetSeekMs > 0) {
               audioPlayerRef.current!.currentTime = targetSeekMs / 1000;
             }
             if (wasPlaying) {
               audioPlayerRef.current!.play().catch(console.error);
             }
             audioPlayerRef.current!.removeEventListener('loadedmetadata', onMetadata);
          };

          audioPlayerRef.current.addEventListener('loadedmetadata', onMetadata);
        }

        // Generate Tajweed Text
        const fullTajweedText = tajweedData.verses.map((v: any, i: number) => {
          const cleanTajweed = v.text_uthmani_tajweed.replace(/<span class=["']?end["']?>.*?<\/span>/g, '').trim();
          return `<span data-verse="${i + 1}">${cleanTajweed} ﴿${toArabicNumber(v.verse_number || i + 1)}﴾</span>`;
        }).join("  ");

        // RESTORE ORIGINAL CLEAN UTHMANI
        // This is what the reciters follow perfectly in their segments.
        const fullPlainText = versesData.verses.map((v: any, i: number) => {
          return `<span data-verse="${i + 1}">${v.text_uthmani} ﴿${toArabicNumber(v.verse_number || i + 1)}﴾</span>`;
        }).join("  ");

        setQuranText(fullPlainText);
        setQuranTajweedText(fullTajweedText);
        setSurahInfo({ id: infoData.chapter.id, name: infoData.chapter.name_arabic });
        // Initial Pos Reset
        if (initialPosRef.current === null) {
          posRef.current = 0;
        }
        // DO NOT reset textWidth to 0 here, let the ResizeObserver update it.
        // This prevents the "disappearing text" act during surah transitions.
        isInitializedRef.current = false;
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [reciterId]);

  const nextSurah = useCallback(() => {
    initialPosRef.current = null;
    posRef.current = 0;
    setSurahNumberState(prev => (prev < 114 ? prev + 1 : 1));
  }, []);
  
  const prevSurah = useCallback(() => {
    initialPosRef.current = null;
    posRef.current = 0;
    setSurahNumberState(prev => (prev > 1 ? prev - 1 : 114));
  }, []);

  useEffect(() => {
    fetchSurah(surahNumber);
  }, [surahNumber, fetchSurah]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const next = !prev;
      // Audio stops if paused, but doesn't auto-start when playing unless explicitly requested
      if (next && audioPlayerRef.current && !audioPlayerRef.current.paused) {
        audioPlayerRef.current.pause();
      }
      return next;
    });
  }, []);

  const toggleAudio = useCallback(() => {
    if (!audioPlayerRef.current?.src) return;
    if (audioPlayerRef.current.paused) {
      
      // MAGIC SYNC: Find where the scroll (posRef.current) is visually 
      // and seek the audio to that exact verse/moment!
      const currentPos = posRef.current;
      const layer = document.getElementById('quran-measurement-layer');
      const textWidth = textWidthRef.current;
      
      if (layer && textWidth > 0 && audioTimestampsRef.current.length > 0) {
        const verses = layer.querySelectorAll('[data-verse]');
        for (let i = 0; i < verses.length; i++) {
          const el = verses[i] as HTMLElement;
          const dStart = textWidth - (el.offsetLeft + el.offsetWidth);
          const dEnd = dStart + el.offsetWidth;
          
          if (currentPos >= dStart && currentPos <= dEnd) {
            const verseIndex = parseInt(el.getAttribute('data-verse') || "1", 10) - 1;
            const timestamps = audioTimestampsRef.current;
            
            if (timestamps && timestamps[verseIndex]) {
              const vObj = timestamps[verseIndex];
              const progress = (currentPos - dStart) / el.offsetWidth;
              const verseDuration = vObj.timestamp_to - vObj.timestamp_from;
              
              const seekMs = vObj.timestamp_from + (progress * verseDuration);
              audioPlayerRef.current.currentTime = seekMs / 1000;
            }
            break;
          }
        }
      }

      audioPlayerRef.current.play().catch(console.error);
      setIsPaused(false); // Make sure scrolling resumes when audio plays
    } else {
      audioPlayerRef.current.pause();
    }
  }, []);

  // Global Background Animation Loop
  const animate = useCallback((time: number) => {
    if (isDraggingRef.current || isPausedRef.current) {
      lastTimeRef.current = time; // stay updated, prevent jump
    } else if (lastTimeRef.current !== 0) {
      // If audio is active we sync to timestamps strictly
      const timestamps = audioTimestampsRef.current;
      const audioIsActive = audioPlayerRef.current && !audioPlayerRef.current.paused && timestamps.length > 0 && textWidthRef.current > 0;

      if (audioIsActive && textWidthRef.current > 0) {
        const currentMs = audioPlayerRef.current!.currentTime * 1000;
        let currentVerseIndex = 0;
        let found = false;
        
        for (let i = 0; i < timestamps.length; i++) {
          if (currentMs >= timestamps[i].timestamp_from && currentMs <= timestamps[i].timestamp_to) {
            currentVerseIndex = i;
            found = true;
            break;
          }
        }
        
        if (!found) {
           currentVerseIndex = timestamps.findIndex((t: any) => t.timestamp_from > currentMs);
           if (currentVerseIndex === -1) currentVerseIndex = timestamps.length - 1;
           else if (currentVerseIndex > 0) currentVerseIndex -= 1;
        }

        const currentVerseObj = timestamps[currentVerseIndex];
        const verseEl = document.querySelector(`#quran-measurement-layer [data-verse="${currentVerseIndex + 1}"]`) as HTMLElement;
        
        if (verseEl && currentVerseObj) {
          let progress = 0;
          if (currentMs >= currentVerseObj.timestamp_from && currentMs <= currentVerseObj.timestamp_to) {
            const duration = currentVerseObj.timestamp_to - currentVerseObj.timestamp_from;
            if (duration > 0) {
              progress = (currentMs - currentVerseObj.timestamp_from) / duration;
            }
          } else if (currentMs > currentVerseObj.timestamp_to) {
            progress = 1;
          }

          // Offset the progress so that the middle of the currently spoken word tends to be in the center
          // In RTL, the text starts exactly at right edge of container and padding makes "0" center.
          // By adding a small visually pleasing offset (like shifting center slightly so we read comfortably)
          // We can just calculate the precise pixel distance from right edge
          // Target visual position: distance from right edge
          const dFromRight = textWidthRef.current - (verseEl.offsetLeft + verseEl.offsetWidth);
          const verseVisualPosition = dFromRight + progress * verseEl.offsetWidth;
          
          const diff = verseVisualPosition - posRef.current;
          // SNAP SENSITIVITY: 10px instead of 20px. 
          // If misalignment is more than 10px, jump immediately instead of sliding.
          if (Math.abs(diff) > 10) {
            posRef.current = verseVisualPosition;
          } else {
            // INCREASED CORRECTION SPEED
            posRef.current += diff * 0.3; 
          }
        }
      } else {
        // Normal constant speed scrolling
        const deltaTime = (time - lastTimeRef.current) / 1000;
        posRef.current += pixelsPerSecond * deltaTime;
      }

      // Cycle surah if finished
      if (textWidthRef.current > 0 && posRef.current >= textWidthRef.current) {
        nextSurah();
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [pixelsPerSecond, nextSurah]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  return (
    <QuranContext.Provider value={{
      surahNumber, setSurahNumber: setSurahNumberState, level, setLevel, 
      quranText, quranTajweedText, isTajweedEnabled, setIsTajweedEnabled, 
      fontFamily, setFontFamily,
      fontSizeLevel, setFontSizeLevel,
      isPaused, togglePause,
      surahInfo,
      isLoading, error, getPos: useCallback(() => posRef.current, []), setPos: useCallback((v: number) => { posRef.current = v; }, []), setIsDragging: handleSetIsDragging,
      textWidth, setTextWidth: handleSetTextWidth,
      pixelsPerSecond, nextSurah, prevSurah, fetchSurah,
      audioPlayerRef, isPlayingAudio, toggleAudio, audioTimestamps,
      reciters, reciterId, setReciterId, surahList
    }}>
      {children}
    </QuranContext.Provider>
  );
};

export const useQuran = () => {
  const context = useContext(QuranContext);
  if (!context) throw new Error('useQuran must be used within a QuranProvider');
  return context;
};
