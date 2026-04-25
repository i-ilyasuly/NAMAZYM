import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, BarChart3, LogOut } from 'lucide-react';

interface NativeBottomNavProps {
  isDarkMode: boolean;
  activeTab: 'namazym' | 'bagdar';
  onTabChange: (tab: 'namazym' | 'bagdar') => void;
  onExit: () => void;
}

export const NativeBottomNav = ({ isDarkMode, activeTab, onTabChange, onExit }: NativeBottomNavProps) => {
  const bgColor = isDarkMode ? '#111' : '#fff';
  const borderColor = isDarkMode ? '#222' : '#eee';
  const activeColor = '#3b82f6';
  const inactiveColor = isDarkMode ? '#666' : '#999';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabChange('namazym')}
      >
        <Home size={22} color={activeTab === 'namazym' ? activeColor : inactiveColor} />
        <Text style={[styles.label, { color: activeTab === 'namazym' ? activeColor : inactiveColor }]}>
          Намазым
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabChange('bagdar')}
      >
        <BarChart3 size={22} color={activeTab === 'bagdar' ? activeColor : inactiveColor} />
        <Text style={[styles.label, { color: activeTab === 'bagdar' ? activeColor : inactiveColor }]}>
          Бағдар
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab} 
        onPress={onExit}
      >
        <LogOut size={22} color={inactiveColor} />
        <Text style={[styles.label, { color: inactiveColor }]}>
          Шығу
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 85 : 65,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});
