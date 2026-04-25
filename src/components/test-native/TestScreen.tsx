import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { format, addDays } from 'date-fns';
import { useStore } from '../../store';
import { useQuran } from '../../context/QuranContext';

import { NativeQuranBlock } from './NativeQuranBlock';
import { HorizontalCalendar } from './HorizontalCalendar';
import { PrayerBlock } from './PrayerBlock';
import { QuranSettingsModals } from './QuranSettingsModals';
import { NativeBottomNav } from './NativeBottomNav';
import { NativeStatisticsScreen } from './NativeStatisticsScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function TestScreen({ onExit }: { onExit?: () => void }) {
  const { isDarkMode } = useStore();
  const { fontSizeLevel, setFontSizeLevel, level, setLevel, quranText, fetchSurah, surahNumber, isLoading } = useQuran('test');
  
  const [activeScreen, setActiveScreen] = useState<'namazym' | 'bagdar'>('namazym');
  
  useEffect(() => {
    // Ensure Quran text is loaded for the test scope if it's missing
    if (!quranText && !isLoading) {
      fetchSurah(surahNumber);
    }
  }, [quranText, isLoading, fetchSurah, surahNumber]);

  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showQuranSettings, setShowQuranSettings] = useState(false);
  const [activeModal, setActiveModal] = useState<'surah' | 'font' | 'reciter' | null>(null);
  
  const [records, setRecords] = useState<Record<string, Record<string, string>>>({});

  const days = useMemo(() => {
    const list = [];
    for (let i = -7; i <= 7; i++) {
      list.push(addDays(today, i));
    }
    return list;
  }, [today]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const currentDayRecord = records[dateStr] || {};

  const handleToggleExpand = (id: string, isStatic: boolean) => {
    if (isStatic) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSetStatus = (prayerId: string, status: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRecords(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || {}),
        [prayerId]: status
      }
    }));
    setExpandedId(null);
  };

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {activeScreen === 'namazym' ? (
          <ScrollView style={styles.mainScroll} contentContainerStyle={styles.container}>
            <View style={{ width: '100%', marginBottom: 0 }}>
              <NativeQuranBlock 
                isDarkMode={isDarkMode} 
                onToggleSettings={() => setShowQuranSettings(!showQuranSettings)} 
              />
            </View>

            <HorizontalCalendar 
              isDarkMode={isDarkMode}
              showQuranSettings={showQuranSettings}
              days={days}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setExpandedId(null);
              }}
              records={records}
              onOpenModal={(type) => setActiveModal(type)}
            />

            <PrayerBlock 
              isDarkMode={isDarkMode}
              expandedId={expandedId}
              currentDayRecord={currentDayRecord}
              onToggleExpand={handleToggleExpand}
              onSetStatus={handleSetStatus}
            />
          </ScrollView>
        ) : (
          <NativeStatisticsScreen isDarkMode={isDarkMode} records={records} />
        )}
      </View>

      <NativeBottomNav 
        isDarkMode={isDarkMode} 
        activeTab={activeScreen} 
        onTabChange={(tab) => setActiveScreen(tab)} 
        onExit={() => onExit?.()}
      />

      {/* Global Modals outside scaled wrapper */}
      <QuranSettingsModals 
        isDarkMode={isDarkMode}
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
  },
  mainScroll: {
    flex: 1,
  },
  container: {
    padding: 12,
    alignItems: 'stretch',
    paddingTop: 0,
    paddingBottom: 40,
  },
  blockDivider: {
    height: 12,
  },
});

