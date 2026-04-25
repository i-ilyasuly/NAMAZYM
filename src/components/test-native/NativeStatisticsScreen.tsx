import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { LayoutGrid, Calendar as CalendarIcon, PieChart as PieIcon, BarChart3, LineChart, Users2, User, Clock, Ban } from 'lucide-react';

interface NativeStatisticsScreenProps {
  isDarkMode: boolean;
  records: Record<string, Record<string, string>>;
}

const periods = [
  { label: 'Бүгін', value: 1 },
  { label: '7 күн', value: 7 },
  { label: '14 күн', value: 14 },
  { label: '1 ай', value: 30 },
  { label: '3 ай', value: 90 },
  { label: '6 ай', value: 180 },
  { label: '1 жыл', value: 365 },
];

const statuses = [
  { label: 'Барлығы', value: 'all', color: '#64748b', icon: LayoutGrid },
  { label: 'Жамағат', value: 'congregation', color: '#10b981', icon: Users2 },
  { label: 'Жалғыз', value: 'prayed', color: '#3b82f6', icon: User },
  { label: 'Кешікті', value: 'delayed', color: '#f43f5e', icon: Clock },
  { label: 'Қаза', value: 'missed', color: '#71717a', icon: Ban },
];

export const NativeStatisticsScreen = ({ isDarkMode, records }: NativeStatisticsScreenProps) => {
  const [subTab, setSubTab] = useState<'stats' | 'calendar'>('stats');
  const [period, setPeriod] = useState(7);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const statsData = useMemo(() => {
    const today = new Date();
    const prayerIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const counts = { congregation: 0, prayed: 0, delayed: 0, missed: 0, none: 0 };
    
    for (let i = 0; i < period; i++) {
      const d = format(subDays(today, i), 'yyyy-MM-dd');
      const dayRecord = records[d] || {};
      prayerIds.forEach(p => {
        const s = dayRecord[p];
        if (s === 'congregation') counts.congregation++;
        else if (s === 'prayed') counts.prayed++;
        else if (s === 'delayed') counts.delayed++;
        else if (s === 'missed') counts.missed++;
        else counts.none++;
      });
    }
    
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { counts, total };
  }, [records, period]);

  const renderStats = () => {
    const { counts, total } = statsData;
    const hasData = total > 0;

    const chartData = [
      { name: 'Жамағат', key: 'congregation', color: '#10b981', value: counts.congregation },
      { name: 'Жалғыз', key: 'prayed', color: '#3b82f6', value: counts.prayed },
      { name: 'Кешікті', key: 'delayed', color: '#f43f5e', value: counts.delayed },
      { name: 'Қаза', key: 'missed', color: '#71717a', value: counts.missed },
    ].filter(d => d.value > 0);

    return (
      <View style={styles.tabContent}>
        {hasData ? (
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Намаз үлесі</Text>
            
            {/* Standard SVG Donut Chart */}
            <View style={{ height: 220, marginBottom: 12, alignItems: 'center' }}>
              <svg width="200" height="200" viewBox="0 0 200 200" style={{ width: 200, height: 200 }}>
                <g transform="rotate(-90 100 100)">
                  {chartData.map((item, index) => {
                    const totalVal = chartData.reduce((acc, curr) => acc + curr.value, 0);
                    const percentage = item.value / totalVal;
                    const circumference = 2 * Math.PI * 85; // radius 85
                    const strokeDasharray = `${percentage * circumference - 5} ${circumference}`;
                    
                    const offset = chartData.slice(0, index).reduce((acc, curr) => 
                      acc + (curr.value / totalVal) * circumference, 0);

                    return (
                      <path
                        key={index}
                        d="M 100 100 m -85 0 a 85 85 0 1 0 170 0 a 85 85 0 1 0 -170 0"
                        stroke={item.color}
                        strokeWidth="25"
                        fill="none"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                        style={{
                          transition: 'stroke-dasharray 1.5s ease-out, stroke-dashoffset 1.5s ease-out'
                        }}
                      />
                    );
                  })}
                </g>
                <text x="100" y="110" textAnchor="middle" fontSize="32" fontWeight="900" fill={isDarkMode ? '#fff' : '#000'}>{total}</text>
                <text x="100" y="85" textAnchor="middle" fontSize="12" fontWeight="600" fill={isDarkMode ? '#666' : '#999'} style={{ textTransform: 'uppercase' }}>ЖАЛПЫ</text>
              </svg>
            </View>

            {/* Custom Legend */}
            <View style={styles.legendGrid}>
              {[
                { label: 'Жамағат', key: 'congregation', color: '#10b981' },
                { label: 'Жалғыз', key: 'prayed', color: '#3b82f6' },
                { label: 'Кешікті', key: 'delayed', color: '#f43f5e' },
                { label: 'Қаза', key: 'missed', color: '#71717a' },
              ].map(item => {
                const count = (counts as any)[item.key];
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                  <View key={item.key} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.legendLabel, { color: isDarkMode ? '#ccc' : '#444' }]}>{item.label}</Text>
                      <Text style={[styles.legendValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                        {Math.round(percent)}% ({count})
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Day Score Dynamics */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000', marginTop: 24 }]}>Күнделікті ұпай</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dynamicsScroll}>
              {Array.from({ length: Math.min(period, 30) }).map((_, i) => {
                const date = subDays(new Date(), Math.min(period, 30) - 1 - i);
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayRecord = records[dateStr] || {};
                
                // Calculate simple score
                let score = 0;
                ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(p => {
                  const s = dayRecord[p];
                  if (s === 'congregation') score += 20;
                  else if (s === 'prayed') score += 15;
                  else if (s === 'delayed') score += 5;
                });

                const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : score > 0 ? '#f43f5e' : (isDarkMode ? '#333' : '#eee');

                return (
                  <View key={dateStr} style={styles.dynamicItem}>
                    <View style={[styles.dynamicBar, { height: Math.max(10, score * 0.8), backgroundColor: color }]} />
                    <Text style={[styles.dynamicLabel, { color: isDarkMode ? '#666' : '#999' }]}>{format(date, 'dd.MM')}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <BarChart3 size={48} color={isDarkMode ? '#333' : '#ddd'} />
            <Text style={[styles.emptyText, { color: isDarkMode ? '#666' : '#999' }]}>Бұл кезеңде мәлімет жоқ</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCalendar = () => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <View style={styles.tabContent}>
        <Text style={[styles.monthTitle, { color: isDarkMode ? '#fff' : '#000' }]}>{format(today, 'MMMM yyyy')}</Text>
        <View style={styles.calendarGrid}>
            {['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жк'].map(d => (
                <View key={d} style={styles.calendarDayHead}>
                    <Text style={[styles.calendarDayHeadText, { color: isDarkMode ? '#666' : '#999' }]}>{d}</Text>
                </View>
            ))}
            {days.map(d => {
                const dateStr = format(d, 'yyyy-MM-dd');
                const dayRecord = records[dateStr] || {};
                const isCurrentMonth = d >= monthStart && d <= monthEnd;
                
                // Dominant color logic
                const statuses = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(p => dayRecord[p]).filter(s => s && s !== 'none');
                let color = 'transparent';
                if (statuses.length > 0) {
                    if (statuses.every(s => s === 'congregation' || s === 'prayed')) color = '#10b981';
                    else if (statuses.some(s => s === 'missed')) color = '#71717a';
                    else if (statuses.some(s => s === 'delayed')) color = '#f59e0b';
                    else color = '#3b82f6';
                }

                return (
                    <View key={dateStr} style={styles.calendarCell}>
                        <View style={[
                            styles.calendarCircle, 
                            { 
                                backgroundColor: color, 
                                opacity: isCurrentMonth ? 1 : 0.3,
                                borderColor: isSameDay(d, today) ? '#3b82f6' : 'transparent',
                                borderWidth: isSameDay(d, today) ? 2 : 0
                            }
                        ]}>
                            <Text style={[
                                styles.calendarDayText, 
                                { color: color !== 'transparent' ? '#fff' : (isDarkMode ? '#fff' : '#000') }
                            ]}>
                                {format(d, 'd')}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#f8fafc' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>Бағдар</Text>
        
        {/* Row 1: Stats vs Calendar */}
        <View style={[styles.tabSwitcher, { backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9', marginBottom: 12 }]}>
          <TouchableOpacity 
            onPress={() => setSubTab('stats')}
            style={[styles.subTabBtn, subTab === 'stats' && [styles.subTabBtnActive, { backgroundColor: isDarkMode ? '#3f3f46' : '#fff' }]]}
          >
            <BarChart3 size={16} color={subTab === 'stats' ? (isDarkMode ? '#fff' : '#000') : '#666'} />
            <Text style={[styles.subTabText, { color: subTab === 'stats' ? (isDarkMode ? '#fff' : '#000') : '#666' }]}>Статистика</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setSubTab('calendar')}
            style={[styles.subTabBtn, subTab === 'calendar' && [styles.subTabBtnActive, { backgroundColor: isDarkMode ? '#3f3f46' : '#fff' }]]}
          >
            <CalendarIcon size={16} color={subTab === 'calendar' ? (isDarkMode ? '#fff' : '#000') : '#666'} />
            <Text style={[styles.subTabText, { color: subTab === 'calendar' ? (isDarkMode ? '#fff' : '#000') : '#666' }]}>Күнтізбе</Text>
          </TouchableOpacity>
        </View>

        {subTab === 'stats' && (
          <>
            {/* Row 2: Periods (Switch style scroll) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nestedFilterScroll} contentContainerStyle={{ paddingRight: 20 }}>
              <View style={[styles.rowSwitcher, { backgroundColor: isDarkMode ? '#1e1e1e' : '#f1f5f9' }]}>
                {periods.map(p => (
                  <TouchableOpacity 
                    key={p.value} 
                    onPress={() => setPeriod(p.value)}
                    style={[
                      styles.rowBtn, 
                      period === p.value && [styles.rowBtnActive, { backgroundColor: isDarkMode ? '#3f3f46' : '#fff' }]
                    ]}
                  >
                    <Text style={[styles.rowBtnText, { color: period === p.value ? (isDarkMode ? '#fff' : '#000') : (isDarkMode ? '#666' : '#999') }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Row 3: Modes (Switch style scroll) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nestedFilterScroll} contentContainerStyle={{ paddingRight: 20 }}>
              <View style={[styles.rowSwitcher, { backgroundColor: isDarkMode ? '#1e1e1e' : '#f1f5f9' }]}>
                {statuses.map(s => {
                  const isActive = statusFilter === s.value;
                  const activeBg = isDarkMode ? s.color + '44' : s.color + '22'; // subtle transparent bg
                  const activeBorder = s.color;
                  const activeIconAndText = isDarkMode ? '#fff' : s.color;
                  
                  return (
                    <TouchableOpacity 
                      key={s.value} 
                      onPress={() => setStatusFilter(s.value)}
                      style={[
                        styles.rowBtn, 
                        isActive && { 
                          backgroundColor: activeBg, 
                          borderColor: activeBorder, 
                          borderWidth: 1,
                          shadowColor: s.color,
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                        }
                      ]}
                    >
                      <s.icon size={13} color={isActive ? activeIconAndText : (isDarkMode ? '#666' : '#999')} />
                      <Text style={[styles.rowBtnText, { color: isActive ? activeIconAndText : (isDarkMode ? '#666' : '#999') }]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {subTab === 'stats' ? renderStats() : renderCalendar()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  tabSwitcher: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  subTabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nestedFilterScroll: {
    marginBottom: 8,
  },
  rowSwitcher: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  rowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rowBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 0,
    paddingBottom: 100,
  },
  tabContent: {
    flex: 1,
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  centerInfoContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  centerInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  centerInfoValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '47%',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  dynamicsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  dynamicItem: {
    alignItems: 'center',
    gap: 8,
    width: 30,
  },
  dynamicBar: {
    width: 8,
    minHeight: 10,
    borderRadius: 10,
  },
  dynamicLabel: {
    fontSize: 8,
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayHead: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarDayHeadText: {
    fontSize: 12,
    fontWeight: '700',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calendarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  }
});
