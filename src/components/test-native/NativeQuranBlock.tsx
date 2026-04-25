import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, PanResponder } from 'react-native';
import { Pause, Volume2, VolumeX } from 'lucide-react';
import { useQuran } from '../../context/QuranContext';

const MemoizedQuranText = React.memo(({ 
  htmlContent, webFontClass, calculatedFontSize, isTajweedEnabled, isDarkMode, textRef, viewRef
}: any) => {
  const commonStyles: any = {
    fontSize: `${calculatedFontSize}px`,
    lineHeight: '1',
    letterSpacing: '0px',
    whiteSpace: 'nowrap',
    fontFamily: `var(--${webFontClass}), serif`,
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }} dir="rtl">
      {/* Invisible Measurement Layer */}
      <div
        id="quran-measurement-native"
        ref={textRef}
        className={`quran-text ${webFontClass} ${isTajweedEnabled ? 'tajweed-active' : ''}`}
        style={{
          ...commonStyles,
          position: 'absolute', 
          opacity: 0, 
          pointerEvents: 'none',
          top: -9999,
          right: 0,
          width: 'max-content',
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
      />

      {/* Visible Stream Layer */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', overflow: 'visible' }}>
        <div
          id="quran-visual-native"
          ref={viewRef}
          className={`quran-text ${webFontClass} ${isTajweedEnabled ? 'tajweed-active' : ''}`}
          style={{
            ...commonStyles,
            display: 'flex', 
            alignItems: 'center',
            color: isDarkMode ? '#ffffff' : '#000000',
            paddingLeft: '50vw', 
            paddingRight: '50vw',
            willChange: 'transform',
            flexShrink: 0,
            minWidth: 'max-content',
            zIndex: 1,
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
        />
      </div>
    </div>
  );
});

export const NativeQuranBlock = ({ 
  isDarkMode, 
  onToggleSettings 
}: { 
  isDarkMode: boolean; 
  onToggleSettings: () => void;
}) => {
  const {
    quranText, quranTajweedText, isTajweedEnabled, isLoading, error, fetchSurah, surahNumber, 
    isPaused, togglePause, fontFamily, fontSizeLevel, 
    getPos, setPos, setIsDragging, setTextWidth,
    isPlayingAudio, toggleAudio, surahInfo, reciterId, reciters, surahList
  } = useQuran('test');

  const currentReciter = reciters.find(r => r.id === reciterId);

  const [containerWidth, setContainerWidth] = useState(0);
  const [activeVerse, setActiveVerse] = useState(1);
  const containerRef = useRef<any>(null); 
  const textRef = useRef<any>(null); 
  const viewRef = useRef<any>(null); 

  // Removed internal updateLoop. 
  // The QuranContext.tsx now drives the #quran-visual-native and #quran-visual-layer DOM elements directly 
  // 60 times per second for zero-lag, jitter-free movement.
  
  // Watermark verse tracking (throttled)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    let isMounted = true;
    const checkVerse = () => {
      if (!isMounted) return;
      const currentPos = getPos();
      const tw = textRef.current?.scrollWidth || 0;
      const layer = document.getElementById('quran-measurement-native');
      if (layer && tw > 0) {
        const verses = layer.querySelectorAll('[data-verse]');
        for (let i = 0; i < verses.length; i++) {
          const el = verses[i] as HTMLElement;
          const vStart = tw - (el.offsetLeft + el.offsetWidth);
          const vEnd = vStart + el.offsetWidth;
          if (currentPos >= vStart && currentPos <= vEnd) {
            const vNum = parseInt(el.getAttribute('data-verse') || "1", 10);
            setActiveVerse(vNum);
            break;
          }
        }
      }
      setTimeout(checkVerse, 200); // 5fps for watermark is plenty
    };
    checkVerse();
    return () => { isMounted = false; };
  }, [getPos]);

  // Update text width for bounds in QuranContext
  useEffect(() => {
    if (Platform.OS !== 'web' || !textRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setTextWidth((entry.target as HTMLElement).offsetWidth);
      }
    });
    observer.observe(textRef.current);
    return () => observer.disconnect();
  }, [setTextWidth, quranText, containerWidth]);

  // Handle touch interactions
  const gestureStartPos = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 5,
      onPanResponderGrant: () => {
        setIsDragging(true);
        gestureStartPos.current = getPos();
      },
      onPanResponderMove: (evt, gestureState) => {
        // dx is positive when swiping right. 
        // Swiping right should move the text rightward (increase pos).
        let newPos = gestureStartPos.current + gestureState.dx; 
        if (newPos < 0) newPos = 0;
        setPos(newPos);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      }
    })
  ).current;

  // Ensure surah is loaded
  useEffect(() => {
    if (!quranText && !isLoading && !error) {
      fetchSurah(surahNumber);
    }
  }, [quranText, isLoading, error, fetchSurah, surahNumber]);

  // 🔴 CRITICAL ALGORITHM: DO NOT MODIFY! FONT SCALING LOGIC 🔴
  // Match Home screen font size levels smoothly (1-10)
  // Maps level 10 to old max of 36px. DO NOT change unless requested.
  const getFontSize = (level: number) => {
    return 16 + (level * 2); 
  };

  const calculatedFontSize = getFontSize(fontSizeLevel);
  const styles = getQuranStyles(isDarkMode, fontFamily, calculatedFontSize);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Қате орын алды</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSurah(surahNumber)}>
          <Text style={styles.retryText}>Қайталау</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || (!quranText && !quranTajweedText)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
      </View>
    );
  }

  const htmlContent = isTajweedEnabled ? quranTajweedText : quranText;
  
  // Since we use the same CSS classes as web, mapping is easier.
  // Note: the original 'font-quran-uthmanic' and 'font-quran-indopak' etc. 
  // must be present in index.css as Tailwind classes.
  const webFontClass = fontFamily || 'font-quran-hafs';

  return (
    <View 
      style={styles.container} 
      onLayout={e => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerWidth(w);
      }}
      {...panResponder.panHandlers}
    >
      {Platform.OS === 'web' ? (
        <View style={styles.webContainer}>
          <MemoizedQuranText
            key={`${webFontClass}-${isTajweedEnabled}`}
            htmlContent={htmlContent}
            webFontClass={webFontClass}
            calculatedFontSize={calculatedFontSize}
            isTajweedEnabled={isTajweedEnabled}
            isDarkMode={isDarkMode}
            textRef={textRef}
            viewRef={viewRef}
          />
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Бұл блок үшін веб-платформа қажет</Text>
        </View>
      )}

      <View style={styles.leftFog} pointerEvents="none" />
      <View style={styles.rightFog} pointerEvents="none" />
      
      {/* WATERMARK OVERLAY (TOP-LEFT) */}
      <View style={styles.watermarkOverlay} pointerEvents="none">
        <Text style={styles.surahInfoText}>
          {surahNumber}. {surahList?.find(s => s.id === surahNumber)?.name_simple || surahInfo?.name || ''} 
          <Text style={styles.activeVerseNum}>  {activeVerse}</Text>
        </Text>
      </View>

      {/* RECITER WATERMARK (TOP-RIGHT) */}
      <View style={styles.reciterWatermark} pointerEvents="none">
        <Text style={styles.reciterNameText}>{currentReciter?.reciter_name || ''}</Text>
      </View>

      <View style={styles.clickAreas}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => onToggleSettings()} activeOpacity={1} />
        <TouchableOpacity style={{ flex: 1 }} onPress={() => togglePause()} activeOpacity={1} />
      </View>

      <View style={[styles.centeredPause, { opacity: isPaused ? 1 : 0 }]} pointerEvents="none">
        <View style={styles.pauseIconBg}>
          <Pause size={16} color="#fff" fill="#fff" />
        </View>
      </View>
    </View>
  );
};

const getQuranStyles = (isDarkMode: boolean, customFontFamily: string, fontSize: number) => {
  return StyleSheet.create({
    container: {
      width: '100%',
      alignSelf: 'stretch',
      height: 110, 
      marginBottom: 0,
      marginTop: 0,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      position: 'relative',
    },
    webContainer: {
      position: 'absolute',
      top: 0, bottom: 0, left: 0, right: 0,
      overflow: 'hidden',
      zIndex: 1,
    },
    centerContainer: {
      width: '100%',
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    leftFog: {
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 60,
      // @ts-ignore
      backgroundImage: isDarkMode ? 'linear-gradient(to right, #000000 0%, transparent 100%)' : 'linear-gradient(to right, #f8fafc 0%, transparent 100%)',
      zIndex: 5
    },
    rightFog: {
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 60,
      // @ts-ignore
      backgroundImage: isDarkMode ? 'linear-gradient(to left, #000000 0%, transparent 100%)' : 'linear-gradient(to left, #f8fafc 0%, transparent 100%)',
      zIndex: 5
    },
    clickAreas: {
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', zIndex: 10
    },
    centeredPause: {
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      justifyContent: 'center', alignItems: 'center', zIndex: 15
    },
    watermarkOverlay: {
      position: 'absolute', top: 0, left: 6, zIndex: 6,
    },
    surahInfoText: {
      fontSize: 12, fontWeight: '700', color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
      fontFamily: 'font-quran-amiri',
    },
    activeVerseNum: {
      fontSize: 14, fontWeight: '900', color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)',
    },
    reciterWatermark: {
      position: 'absolute', top: 2, right: 10, zIndex: 6,
    },
    reciterNameText: {
      fontSize: 10, fontWeight: '600', color: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
    },
    leftControls: {
      position: 'absolute', bottom: -5, left: 10, flexDirection: 'row', zIndex: 20,
    },
    miniControl: {
      width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center', alignItems: 'center',
    },
    pauseIconBg: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center', alignItems: 'center',
    },
    errorText: {
      color: '#ef4444',
      fontSize: 12,
      fontWeight: '500',
    },
    retryBtn: {
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    retryText: {
      color: '#ef4444',
      fontSize: 12,
      fontWeight: '700',
    }
  });
};
