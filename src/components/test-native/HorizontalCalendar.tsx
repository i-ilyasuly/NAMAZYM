import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { format, isSameDay } from 'date-fns';
import { kk } from 'date-fns/locale';
import { Plus, Minus, ChevronLeft, ChevronRight, Type, Volume2, Mic } from 'lucide-react';
import { useQuran } from '../../context/QuranContext';

interface HorizontalCalendarProps {
  isDarkMode: boolean;
  showQuranSettings: boolean;
  days: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  records: Record<string, Record<string, string>>;
  onOpenModal?: (type: 'surah' | 'font' | 'reciter') => void;
}

const fonts = [
  { id: 'font-quran-hafs', name: 'Hafs (V1)' },
  { id: 'font-quran-amiri', name: 'Amiri' },
  { id: 'font-quran-uthmanic', name: 'Uthmanic' },
  { id: 'font-quran-indopak', name: 'IndoPak' },
  { id: 'font-quran-scheherazade', name: 'Scheherazade' },
  { id: 'font-quran-lateef', name: 'Lateef' },
];

export const HorizontalCalendar = ({
  isDarkMode,
  showQuranSettings,
  days,
  selectedDate,
  onSelectDate,
  records,
  onOpenModal,
}: HorizontalCalendarProps) => {
  const { fontSizeLevel, setFontSizeLevel, level, setLevel, surahNumber, fetchSurah, isTajweedEnabled, setIsTajweedEnabled, surahList, fontFamily, setFontFamily, reciters, reciterId, setReciterId, toggleAudio, isPlayingAudio } = useQuran('test');
  const scrollViewRef = useRef<ScrollView>(null);
  const settingsScrollRef = useRef<ScrollView>(null);
  const surahPickerRef = useRef<ScrollView>(null);
  const SURAH_ITEM_HEIGHT = 20;

  useEffect(() => {
    if (!showQuranSettings) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 7 * 36, animated: true });
      }, 100);
    } else {
      setTimeout(() => {
        surahPickerRef.current?.scrollTo({ y: (surahNumber - 1) * SURAH_ITEM_HEIGHT, animated: true });
      }, 300);
    }
  }, [showQuranSettings, surahNumber]);

  const styles = getStyles(isDarkMode);

  if (showQuranSettings) {
    return (
      <View style={[styles.calendarWrapper, styles.settingsWrapperFull]}>
        <ScrollView 
          ref={settingsScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.settingsWrapper}
        >
          {/* AUDIO TOGGLE */}
          <View style={[styles.settingCol, { paddingLeft: 16 }]}>
            <Text style={styles.settingsLabel}>Дыбыс</Text>
            <TouchableOpacity 
              onPress={() => toggleAudio()} 
              style={[styles.settingsBtnCal, { width: 40, backgroundColor: isPlayingAudio ? '#ef4444' : (isDarkMode ? '#27272a' : '#f1f5f9') }]}
            >
              <Volume2 size={16} color={isPlayingAudio ? '#fff' : (isDarkMode ? '#e2e8f0' : '#475569')} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingsDivider} />

          {/* RECITER SELECTION */}
          <View style={styles.settingCol}>
            <Text style={styles.settingsLabel}>Қари</Text>
            <TouchableOpacity 
              onPress={() => onOpenModal?.('reciter')}
              style={[styles.settingsBtnCal, { width: 'auto', paddingHorizontal: 10 }]}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? '#f8fafc' : '#0f172a' }} numberOfLines={1}>
                {reciters.find(r => r.id === reciterId)?.reciter_name || 'Қари'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsDivider} />

          {/* SURAH SELECTION */}
          <View style={styles.settingCol}>
            <Text style={styles.settingsLabel}>Сүре</Text>
            <TouchableOpacity 
              onPress={() => onOpenModal?.('surah')}
              style={[styles.settingsBtnCal, { width: 'auto', paddingHorizontal: 12, minWidth: 140 }]}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? '#f8fafc' : '#0f172a' }} numberOfLines={1}>
                {surahList.find(s => s.id === surahNumber)?.name_simple || surahNumber}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsDivider} />

          {/* FONT SELECTION */}
          <View style={styles.settingCol}>
            <Text style={styles.settingsLabel}>Шрифт</Text>
            <TouchableOpacity 
              onPress={() => onOpenModal?.('font')}
              style={[styles.settingsBtnCal, { width: 'auto', paddingHorizontal: 10 }]}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                {fonts.find(f => f.id === fontFamily)?.name || 'Hafs'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsDivider} />

          {/* FONT SIZE */}
          <View style={styles.settingCol}>
            <Text style={styles.settingsLabel}>Мәтін</Text>
            <View style={styles.settingsControls}>
              <TouchableOpacity onPress={() => setFontSizeLevel(Math.max(1, fontSizeLevel - 1))} style={styles.settingsBtnCal}>
                <Minus size={16} color={isDarkMode ? '#e2e8f0' : '#475569'} />
              </TouchableOpacity>
              <Text style={styles.settingsValue}>{fontSizeLevel}</Text>
              <TouchableOpacity onPress={() => setFontSizeLevel(Math.min(10, fontSizeLevel + 1))} style={styles.settingsBtnCal}>
                <Plus size={16} color={isDarkMode ? '#e2e8f0' : '#475569'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingsDivider} />

          {/* SPEED */}
          <View style={styles.settingCol}>
            <Text style={styles.settingsLabel}>Жылд.</Text>
            <View style={styles.settingsControls}>
              <TouchableOpacity onPress={() => setLevel(Math.max(1, level - 1))} style={styles.settingsBtnCal}>
                <Minus size={16} color={isDarkMode ? '#e2e8f0' : '#475569'} />
              </TouchableOpacity>
              <Text style={styles.settingsValue}>{level}</Text>
              <TouchableOpacity onPress={() => setLevel(Math.min(10, level + 1))} style={styles.settingsBtnCal}>
                <Plus size={16} color={isDarkMode ? '#e2e8f0' : '#475569'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingsDivider} />

          {/* TAJWEED */}
          <View style={[styles.settingCol, { paddingRight: 16 }]}>
            <Text style={styles.settingsLabel}>Тәжуид</Text>
            <TouchableOpacity 
              onPress={() => setIsTajweedEnabled(!isTajweedEnabled)} 
              style={[styles.settingsBtnCal, { width: 'auto', paddingHorizontal: 12, backgroundColor: isTajweedEnabled ? '#3b82f6' : (isDarkMode ? '#27272a' : '#f1f5f9') }]}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: isTajweedEnabled ? '#fff' : (isDarkMode ? '#a1a1aa' : '#64748b') }}>
                {isTajweedEnabled ? 'ҚОСУЛЫ' : 'ӨШІК'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.calendarWrapper, styles.calendarOnlyWrapper]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarContainer}
      >
        {days.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const dayStr = format(date, 'yyyy-MM-dd');
          const dayData = records[dayStr] || {};
          const hasData = Object.keys(dayData).length > 0 && Object.values(dayData).some(s => s !== 'none');
          
          const isFuture = date > new Date();

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              disabled={isFuture}
              style={[styles.dateCell]}
              onPress={() => {
                if (!isFuture) onSelectDate(date);
              }}
            >
              <Text style={[styles.dayText, isSelected && styles.dateTextSelected, isFuture && styles.dateTextDisabled]}>
                {format(date, 'eeeeee', { locale: kk }).toUpperCase()}
              </Text>
              <Text style={[styles.dateText, isSelected && styles.dateTextSelected, isFuture && styles.dateTextDisabled]}>
                {format(date, 'd')}
              </Text>
              <View style={styles.dateDotContainer}>
                <View style={[
                  styles.dateDot,
                  hasData && styles.dateDotActive,
                  isSelected && hasData && styles.dateDotSelected,
                  (!hasData || isFuture) && styles.dateDotHidden
                ]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  calendarWrapper: {
    width: '100%',
    height: 56, // Fixed height for both calendar and settings
    marginBottom: 8,
    backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#27272a' : '#f4f4f5',
    overflow: 'hidden',
  },
  settingsWrapperFull: {
    maxWidth: '100%', // Allow settings to stretch further than calendar
  },
  calendarOnlyWrapper: {
    maxWidth: 360, // Increase max width for better mobile experience
    alignSelf: 'center', // Center it explicitly
  },
  settingsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
    minHeight: 56, // Must fill vertical space of ScrollView
  },
  settingCol: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  settingsDivider: {
    width: 1,
    height: 34,
    backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', // Made slightly darker in light mode so it's more visible
    marginHorizontal: 0, 
  },
  settingsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: isDarkMode ? '#a1a1aa' : '#64748b',
    marginRight: 4,
    width: 38,
  },
  settingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsBtnCal: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsValue: {
    width: 22,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: isDarkMode ? '#f8fafc' : '#0f172a',
  },
  calendarContainer: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  dateCell: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    paddingVertical: 4,
    marginHorizontal: 0,
  },
  dayText: {
    fontSize: 9,
    fontWeight: '500',
    color: isDarkMode ? '#a1a1aa' : '#71717a',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '500',
    color: isDarkMode ? '#a1a1aa' : '#71717a',
    marginBottom: 4,
  },
  dateTextSelected: {
    color: isDarkMode ? '#ffffff' : '#09090b',
    fontWeight: '900',
    transform: [{ scale: 1.1 }],
  },
  dateTextDisabled: {
    color: isDarkMode ? '#a1a1aa' : '#71717a',
  },
  dateDotContainer: {
    height: 4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: isDarkMode ? '#a1a1aa' : '#71717a',
  },
  dateDotActive: {
    opacity: 0.4,
  },
  dateDotSelected: {
    opacity: 1,
  },
  dateDotHidden: {
    backgroundColor: 'transparent',
  },
});
