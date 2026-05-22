import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, DimensionValue } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useRouter } from 'expo-router';

export default function AnalyticsScreen() {
  const { entries, settings, weeklyHours, totalBalance } = useApp();
  const router = useRouter();

  const weekData = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEntries = entries.filter(e => new Date(e.date) >= weekStart);

    // Category breakdown
    const categories: Record<string, number> = {};
    weekEntries.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.durationMinutes / 60;
    });

    const totalHours = Object.values(categories).reduce((s, v) => s + v, 0) || 1;

    const allocation = [
      { label: 'Work', hours: categories['Work'] || 0, color: Colors.primary },
      { label: 'Personal', hours: categories['Personal'] || 0, color: Colors.tertiary },
      { label: 'Meeting', hours: categories['Meeting'] || 0, color: Colors.secondary },
      { label: 'Education', hours: categories['Education'] || 0, color: Colors.primaryFixedDim },
      { label: 'Overtime', hours: categories['Overtime'] || 0, color: Colors.primaryContainer },
    ].filter(a => a.hours > 0);

    const allocationWithPct = allocation.map(a => ({
      ...a,
      pct: Math.round((a.hours / totalHours) * 100),
      width: `${Math.max(5, Math.round((a.hours / totalHours) * 100))}%` as DimensionValue,
    }));

    // Per-day breakdown
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d >= prevWeekStart && d < weekStart;
    });

    const dayData = days.map((day, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dayStr = dayDate.toISOString().split('T')[0];

      const prevDayDate = new Date(prevWeekStart);
      prevDayDate.setDate(prevWeekStart.getDate() + i);
      const prevDayStr = prevDayDate.toISOString().split('T')[0];

      const current = weekEntries.filter(e => e.date === dayStr).reduce((s, e) => s + e.durationMinutes / 60, 0);
      const prev = prevWeekEntries.filter(e => e.date === prevDayStr).reduce((s, e) => s + e.durationMinutes / 60, 0);

      return { day, current, prev };
    });

    const maxDayHours = Math.max(...dayData.flatMap(d => [d.current, d.prev]), 1);

    // Productivity score
    const score = Math.min(100, Math.round((weeklyHours / settings.weeklyCommitment) * 100));

    return { allocation: allocationWithPct, dayData, maxDayHours, score, totalHours };
  }, [entries, settings, weeklyHours]);

  // Find peak day
  const peakDay = weekData.dayData.reduce((best, d) => d.current > best.current ? d : best, weekData.dayData[0]);

  const formatHours = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>DETAILED ANALYTICS</Text>
        <Text style={styles.pageTitle}>The Balance{'\n'}Report</Text>
        <View style={styles.chipRow}>
          <View style={styles.chip}><Text style={styles.chipText}>This Week</Text></View>
        </View>

        {/* Productivity Score */}
        <View style={styles.card}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>PRODUCTIVITY SCORE</Text>
            <MaterialIcons name="auto-awesome" size={18} color={Colors.primary} />
          </View>
          <View style={styles.scoreCircle}>
            <View style={styles.scoreRing}>
              <Text style={styles.scoreValue}>{weekData.score}</Text>
              <Text style={styles.scoreUnit}>{weekData.score >= 80 ? 'OPTIMAL' : weekData.score >= 50 ? 'FAIR' : 'LOW'}</Text>
            </View>
          </View>
          <Text style={styles.scoreDesc}>
            You've logged <Text style={{ color: Colors.primary, fontFamily: Fonts.bodySemiBold }}>{formatHours(weeklyHours)}</Text> this week against your {settings.weeklyCommitment}h target.
            {peakDay.current > 0 && ` Peak day: ${peakDay.day} (${formatHours(peakDay.current)}).`}
          </Text>
        </View>

        {/* Time Distribution */}
        <View style={styles.card}>
          <Text style={styles.distLabel}>TIME DISTRIBUTION</Text>
          <Text style={styles.distTitle}>Weekly Allocation</Text>
          {weekData.allocation.length === 0 ? (
            <Text style={styles.noData}>No entries logged this week</Text>
          ) : (
            <>
              {weekData.allocation.map((item, i) => (
                <View key={i} style={styles.allocRow}>
                  <View style={[styles.allocDot, { backgroundColor: item.color }]} />
                  <Text style={styles.allocName}>{item.label}</Text>
                  <Text style={styles.allocHours}>{formatHours(item.hours)}</Text>
                  <Text style={[styles.allocPct, { color: item.color }]}>{item.pct}%</Text>
                </View>
              ))}
              <View style={styles.barChart}>
                {weekData.allocation.map((item, i) => (
                  <View key={i} style={[styles.barSegment, { width: item.width, backgroundColor: item.color }]} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Time Variance */}
        <View style={styles.card}>
          <Text style={styles.distLabel}>WEEKLY COMPARISON</Text>
          <Text style={styles.distTitle}>Time Variance</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primaryFixed }]} />
              <Text style={styles.legendText}>PREV WEEK</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>CURRENT</Text>
            </View>
          </View>
          <View style={styles.varianceBars}>
            {weekData.dayData.map((d, i) => (
              <View key={i} style={styles.varianceGroup}>
                <View style={styles.varianceBarWrap}>
                  <View style={[styles.varianceBar, {
                    height: `${Math.max(5, (d.prev / weekData.maxDayHours) * 100)}%` as DimensionValue,
                    backgroundColor: Colors.primaryFixed,
                  }]} />
                  <View style={[styles.varianceBar, {
                    height: `${Math.max(5, (d.current / weekData.maxDayHours) * 100)}%` as DimensionValue,
                    backgroundColor: Colors.primary,
                  }]} />
                </View>
                <Text style={styles.varianceLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Insight Cards */}
        {peakDay.current > 0 && (
          <View style={[styles.insightCard, { backgroundColor: Colors.primaryFixed + '30' }]}>
            <MaterialIcons name="trending-up" size={28} color={Colors.primary} />
            <Text style={styles.insightTitle}>Focus Peak</Text>
            <Text style={styles.insightDesc}>
              Your peak productivity is on {peakDay.day}s at {formatHours(peakDay.current)}. Consider scheduling high-complexity tasks during this window.
            </Text>
            <TouchableOpacity style={styles.insightLink} onPress={() => router.push('/project_details')}>
              <Text style={styles.insightLinkText}>VIEW DETAILS</Text>
              <MaterialIcons name="chevron-right" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {totalBalance < 0 && (
          <View style={[styles.insightCard, { backgroundColor: Colors.errorContainer + '50' }]}>
            <MaterialIcons name="warning" size={28} color={Colors.error} />
            <Text style={styles.insightTitle}>Balance Warning</Text>
            <Text style={styles.insightDesc}>
              Your balance is at {totalBalance.toFixed(1)}h. Risk of burnout detected. Consider adjusting your schedule.
            </Text>
            <TouchableOpacity style={styles.insightLink} onPress={() => router.push('/(tabs)/add')}>
              <Text style={[styles.insightLinkText, { color: Colors.error }]}>LOG MORE TIME</Text>
              <MaterialIcons name="chevron-right" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 56 },
  headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSurface },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  sectionLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, marginTop: 12 },
  pageTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 32, color: Colors.onSurface, letterSpacing: -1, marginTop: 4, lineHeight: 38 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  chip: { backgroundColor: Colors.surfaceContainerHigh, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 },
  chipText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onSurface },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 16 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  scoreCircle: { alignItems: 'center', marginVertical: 24 },
  scoreRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 8, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 40, color: Colors.onSurface, letterSpacing: -2 },
  scoreUnit: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, marginTop: -4 },
  scoreDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20, textAlign: 'center' },
  noData: { fontFamily: Fonts.body, fontSize: 14, color: Colors.outline, textAlign: 'center', paddingVertical: 20 },
  distLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  distTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginTop: 4, marginBottom: 16 },
  allocRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  allocDot: { width: 8, height: 8, borderRadius: 4 },
  allocName: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onSurface, width: 70 },
  allocHours: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, flex: 1 },
  allocPct: { fontFamily: Fonts.headline, fontSize: 14 },
  barChart: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  barSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 2 },
  legendText: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 1.5, color: Colors.onSurfaceVariant },
  varianceBars: { flexDirection: 'row', justifyContent: 'space-between', height: 120, marginTop: 8 },
  varianceGroup: { flex: 1, alignItems: 'center' },
  varianceBarWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2, width: '100%', paddingHorizontal: 4 },
  varianceBar: { flex: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  varianceLabel: { fontFamily: Fonts.labelBold, fontSize: 8, letterSpacing: 1, color: Colors.outline, marginTop: 6 },
  insightCard: { borderRadius: 16, padding: 24, marginTop: 16 },
  insightTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSurface, marginTop: 12 },
  insightDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20, marginTop: 8 },
  insightLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14 },
  insightLinkText: { fontFamily: Fonts.labelBold, fontSize: 11, letterSpacing: 1.5, color: Colors.primary },
});
