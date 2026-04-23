import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Moon, Sunrise, Sun, Sunset, Plus, ChevronDown, User, Users2, Clock, Ban, Check } from 'lucide-react';

export const PRAYERS = [
  { id: 'fajr', name: 'Таң', time: '04:23', icon: Moon, iconColor: '#8b5cf6', isStatic: false },
  { id: 'sunrise', name: 'Күн шығу', time: '06:05', icon: Sunrise, iconColor: '#f59e0b', isStatic: true },
  { id: 'dhuhr', name: 'Бесін', time: '13:17', icon: Sun, iconColor: '#f97316', isStatic: false },
  { id: 'asr', name: 'Екінті', time: '17:21', icon: Sun, iconColor: '#f59e0b', isStatic: false },
  { id: 'maghrib', name: 'Ақшам', time: '20:25', icon: Sunset, iconColor: '#8b5cf6', isStatic: false },
  { id: 'isha', name: 'Құптан', time: '22:01', icon: Moon, iconColor: '#64748b', isStatic: false },
];

export const STATUS_OPTIONS = [
  { id: 'prayed', icon: User, lightColor: '#3b82f6', darkColor: '#3b82f6' }, // Көк
  { id: 'congregation', icon: Users2, lightColor: '#10b981', darkColor: '#10b981' }, // Жасыл
  { id: 'delayed', icon: Clock, lightColor: '#f43f5e', darkColor: '#f43f5e' }, // Қызыл
  { id: 'missed', icon: Ban, lightColor: '#18181b', darkColor: '#f4f4f5' }, // Қара / Ақ
  { id: 'none', icon: Plus, lightColor: '#cbd5e1', darkColor: '#3f3f46' }, // Сұр
];

export const getStatusColor = (status: string, isDarkMode: boolean) => {
  const opt = STATUS_OPTIONS.find(o => o.id === status);
  if (!opt) return isDarkMode ? '#3f3f46' : '#e2e8f0';
  return isDarkMode ? opt.darkColor : opt.lightColor;
};

interface PrayerBlockProps {
  isDarkMode: boolean;
  expandedId: string | null;
  currentDayRecord: Record<string, string>;
  onToggleExpand: (id: string, isStatic: boolean) => void;
  onSetStatus: (prayerId: string, status: string) => void;
}

export const PrayerBlock = ({
  isDarkMode,
  expandedId,
  currentDayRecord,
  onToggleExpand,
  onSetStatus,
}: PrayerBlockProps) => {
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.card}>
      {PRAYERS.map((prayer, idx) => {
        const Icon = prayer.icon;
        const isExpanded = expandedId === prayer.id;
        const status = currentDayRecord[prayer.id] || 'none';
        const hasStatus = status !== 'none';
        const statusColor = getStatusColor(status, isDarkMode);
        const isLast = idx === PRAYERS.length - 1;

        // Басты беттегі тарих конфигурациясы (Жасыл/Көк/Сары)
        const mockHistory = [status, 'prayed', 'missed', 'congregation', 'none', 'none', 'none'];

        return (
          <View key={prayer.id} style={[styles.rowContainer, isLast && { borderBottomWidth: 0 }, isExpanded && styles.rowExpandedContainer]}>
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={() => onToggleExpand(prayer.id, prayer.isStatic)}
              style={styles.row}
            >
              {/* Сол жақ: Иконка (w-9 h-9) + Атауы (15px) + Уақыты (11px) */}
              <View style={styles.leftSection}>
                <View style={styles.iconContainer}>
                  <Icon size={24} color={prayer.isStatic ? (isDarkMode ? '#52525b' : '#a1a1aa') : prayer.iconColor} strokeWidth={2} />
                </View>
                <View style={styles.textStack}>
                  <Text style={[styles.prayerName, prayer.isStatic && styles.textMuted]}>{prayer.name}</Text>
                  <Text style={[styles.prayerTime, prayer.isStatic && styles.textMuted]}>{prayer.time}</Text>
                </View>
              </View>

              {/* Ортасы: Нүктелер (тарих) - max-w-85px */}
              {!prayer.isStatic && !isExpanded ? (
                <View style={styles.middleSection}>
                  <View style={styles.dotsLine} />
                  <View style={styles.dotsContainer}>
                    {mockHistory.map((hStatus, i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: getStatusColor(hStatus, isDarkMode) }]} />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.middleSection} />
              )}

              {/* Оң жақ: Плюс батырмасы немесе Статус нүктесі */}
              <View style={styles.rightSection}>
                {!prayer.isStatic && (
                  <View style={[styles.actionBtn, hasStatus && { backgroundColor: statusColor, borderColor: statusColor }]}>
                    {hasStatus ? (
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    ) : (
                      <Plus size={16} color={isDarkMode ? '#52525b' : '#94a3b8'} />
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Ашылған кеңейтілген статус беті */}
            {isExpanded && !prayer.isStatic && (
              <View style={styles.expandedPanel}>
                {STATUS_OPTIONS.map((opt) => {
                  const StatusIcon = opt.icon;
                  const isSelected = status === opt.id;
                  return (
                    <TouchableOpacity 
                      key={opt.id}
                      activeOpacity={0.6}
                      style={[styles.statusOptionBtn, isSelected && { transform: [{ scale: 1.2 }] }]}
                      onPress={() => onSetStatus(prayer.id, opt.id)}
                    >
                      <StatusIcon 
                        size={24} 
                        color={isSelected ? (isDarkMode ? opt.darkColor : opt.lightColor) : (isDarkMode ? '#52525b' : '#a1a1aa')} 
                        strokeWidth={isSelected ? 2 : 1.5} 
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* Нәпіл намаздар */}
      <View style={styles.extraSection}>
        <View style={styles.divider} />
        <TouchableOpacity activeOpacity={0.7} style={styles.extraHeader}>
          <Text style={styles.extraTitle}>НӘПІЛ НАМАЗДАР</Text>
          <View style={styles.extraAddBtn}>
            <Text style={styles.extraAddText}>Қосу</Text>
            <ChevronDown size={14} color={isDarkMode ? '#52525b' : '#94a3b8'} style={{marginLeft: 2}} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: isDarkMode ? 'rgba(24, 24, 27, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(39, 39, 42, 0.5)' : 'rgba(244, 244, 245, 0.5)',
  },
  rowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? 'rgba(39, 39, 42, 0.5)' : 'rgba(244, 244, 245, 0.5)', 
  },
  rowExpandedContainer: {
    backgroundColor: isDarkMode ? 'rgba(39, 39, 42, 0.2)' : 'rgba(250, 250, 250, 0.5)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  textMuted: {
    color: isDarkMode ? '#71717a' : '#a1a1aa',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100, 
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  textStack: {
    flexDirection: 'column',
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '700',
    color: isDarkMode ? '#f4f4f5' : '#18181b', // zinc-100 : zinc-900
    marginBottom: 2,
  },
  // text-[10px] font-semibold text-zinc-400
  prayerTime: {
    fontSize: 10,
    fontWeight: '600',
    color: isDarkMode ? '#71717a' : '#a1a1aa', 
  },
  
  // Тарих нүктелері (max-w-[85px])
  middleSection: {
    flex: 1,
    maxWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dotsLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0',
    left: 4,
    right: 4,
    top: '50%',
    zIndex: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 1,
  },
  // w-1.5 h-1.5
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Оң жақ
  rightSection: {
    width: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  // w-7 h-7
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0', // zinc-700 : zinc-200
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
  },

  // Ашылған кездегі мәртебелер (h-[48px] px-2)
  expandedPanel: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  statusOptionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Төменгі Нәпіл Намаздар
  extraSection: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: isDarkMode ? 'rgba(39, 39, 42, 0.5)' : '#f1f5f9',
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  // px-4
  extraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  extraTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: isDarkMode ? '#71717a' : '#94a3b8',
    letterSpacing: 0.5,
  },
  extraAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extraAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? '#a1a1aa' : '#64748b',
  }
});
