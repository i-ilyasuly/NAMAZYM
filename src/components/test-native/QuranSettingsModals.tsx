import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useQuran } from '../../context/QuranContext';

const fonts = [
  { id: 'font-quran-hafs', name: 'Hafs (V1)' },
  { id: 'font-quran-amiri', name: 'Amiri' },
  { id: 'font-quran-uthmanic', name: 'Uthmanic' },
  { id: 'font-quran-indopak', name: 'IndoPak' },
  { id: 'font-quran-scheherazade', name: 'Scheherazade' },
  { id: 'font-quran-lateef', name: 'Lateef' },
];

interface QuranSettingsModalsProps {
  isDarkMode: boolean;
  activeModal: 'surah' | 'font' | 'reciter' | null;
  onClose: () => void;
}

export const QuranSettingsModals = ({ isDarkMode, activeModal, onClose }: QuranSettingsModalsProps) => {
  const { 
    surahList, fetchSurah, fontFamily, setFontFamily, 
    reciters, reciterId, setReciterId, surahNumber 
  } = useQuran('test');

  if (!activeModal) return null;

  return (
    <View 
      style={[
        StyleSheet.absoluteFill, 
        { 
          position: 'fixed' as any, 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)', 
          zIndex: 99999, 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20 
        }
      ]} 
      pointerEvents="auto"
    >
      <View style={{ 
        width: '100%', 
        maxWidth: 400, 
        height: activeModal === 'font' ? 'auto' : '80%', 
        backgroundColor: isDarkMode ? '#18181b' : '#ffffff', 
        borderRadius: 16, 
        overflow: 'hidden', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 10 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: isDarkMode ? '#27272a' : '#e2e8f0'
      }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          padding: 16, 
          borderBottomWidth: 1, 
          borderBottomColor: isDarkMode ? '#27272a' : '#e2e8f0', 
          alignItems: 'center' 
        }}>
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: 'bold', fontSize: 16 }}>
            {activeModal === 'surah' ? 'Сүрелер тізімі' : activeModal === 'font' ? 'Шрифт таңдау' : 'Қари таңдау'}
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Жабу</Text>
          </TouchableOpacity>
        </View>

        {activeModal === 'surah' && (
          <ScrollView style={{ flex: 1 }}>
            {surahList?.map(s => (
               <TouchableOpacity 
                 key={s.id}
                 style={{ 
                   padding: 16, 
                   borderBottomWidth: 1, 
                   borderBottomColor: isDarkMode ? '#27272a' : '#f1f5f9', 
                   flexDirection: 'row', 
                   justifyContent: 'space-between', 
                   alignItems: 'center' 
                 }}
                 onPress={() => {
                   fetchSurah(s.id);
                   onClose();
                 }}
               >
                  <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 14, width: 30 }}>{s.id}.</Text>
                  <Text style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: '600', flex: 1, marginLeft: 8, fontSize: 15 }}>{s.name_simple}</Text>
                  <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 14 }}>{s.name_arabic}</Text>
               </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeModal === 'font' && (
          <View style={{ paddingVertical: 4 }}>
            {fonts.map(f => (
               <TouchableOpacity 
                 key={f.id}
                 style={{ 
                   padding: 16, 
                   borderBottomWidth: 1, 
                   borderBottomColor: isDarkMode ? '#27272a' : '#f1f5f9', 
                   flexDirection: 'row', 
                   justifyContent: 'space-between', 
                   alignItems: 'center' 
                 }}
                 onPress={() => {
                   setFontFamily(f.id);
                   onClose();
                 }}
               >
                  <Text style={{ 
                    color: isDarkMode ? '#f8fafc' : '#0f172a', 
                    fontWeight: '600', 
                    fontSize: 16, 
                    opacity: f.id === fontFamily ? 1 : 0.6 
                  }}>{f.name}</Text>
                  {f.id === fontFamily && (
                    <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>✓</Text>
                  )}
               </TouchableOpacity>
            ))}
          </View>
        )}

        {activeModal === 'reciter' && (
          <ScrollView style={{ flex: 1 }}>
            {reciters.map(r => (
               <TouchableOpacity 
                 key={r.id}
                 style={{ 
                   padding: 16, 
                   borderBottomWidth: 1, 
                   borderBottomColor: isDarkMode ? '#27272a' : '#f1f5f9', 
                   flexDirection: 'row', 
                   justifyContent: 'space-between', 
                   alignItems: 'center' 
                 }}
                 onPress={() => {
                   setReciterId(r.id);
                   onClose();
                   fetchSurah(surahNumber, r.id);
                 }}
               >
                  <Text style={{ 
                    color: isDarkMode ? '#f8fafc' : '#0f172a', 
                    fontWeight: '600', 
                    fontSize: 15, 
                    flex: 1, 
                    opacity: r.id === reciterId ? 1 : 0.7 
                  }}>{r.reciter_name}</Text>
                  <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 12, marginLeft: 8 }}>{r.style || ''}</Text>
                  {r.id === reciterId && (
                    <Text style={{ color: '#3b82f6', fontWeight: 'bold', marginLeft: 12 }}>✓</Text>
                  )}
               </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};
