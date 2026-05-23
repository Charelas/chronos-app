import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, DimensionValue } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useRouter } from 'expo-router';
import { formatDuration } from '../utils/storage';

const CATEGORY_COLORS: Record<string, string> = {
  Work: Colors.primary,
  Meeting: Colors.secondary,
  Education: Colors.primaryFixedDim,
  Personal: Colors.tertiary,
  Overtime: Colors.tertiaryFixed,
};

export default function ProjectDetailsScreen() {
  const { entries, monthlyHours, settings, weeklyHours, totalBalance } = useApp();
  const router = useRouter();

  const stats = useMemo(() => {
    const totalHours = entries.reduce((s, e) => s + e.durationMinutes / 60, 0);
    const progressPct = Math.min(100, Math.round((monthlyHours / settings.monthlyCap) * 100));

    // Category breakdown — drives allocation bars
    const categories: Record<string, number> = {};
    entries.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.durationMinutes / 60;
    });
    const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(...catEntries.map(c => c[1]), 1);

    // Active days — days where at least one entry was logged
    const activeDaySet = new Set(entries.map(e => e.date));
    const activeDays = activeDaySet.size;

    // Average session length
    const avgSessionMin = entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.durationMinutes, 0) / entries.length)
      : 0;

    // Entries per week velocity
    const velocityPerWeek = entries.length > 0
      ? (entries.length / Math.max(1, Math.ceil(
          (Date.now() - new Date(entries[entries.length - 1].date).getTime()) / (7 * 86400000)
        ))).toFixed(1)
      : '0';

    // Top 5 most recent entries as backlog
    const recentTasks = entries.slice(0, 5);

    // Top category
    const topCategory = catEntries[0]?.[0] ?? 'Work';
    const topCategoryHours = catEntries[0]?.[1] ?? 0;

    return {
      totalHours, progressPct, catEntries, maxCat,
      activeDays, avgSessionMin, velocityPerWeek,
      recentTasks, topCategory, topCategoryHours,
    };
  }, [entries, monthlyHours, settings]);

  // Dynamic project name based on top category
  const projectName = stats.topCategory === 'Work' || stats.topCategory === 'Overtime'
    ? 'Deep Work\nFocus'
    : stats.topCategory === 'Meeting'
    ? 'Collaboration\nSessions'
    : stats.topCategory === 'Education'
    ? 'Learning\nJourney'
    : 'Personal\nBalance';

  const healthLabel = totalBalance >= 4
    ? 'Positive Surplus'
    : totalBalance >= 0
    ? 'Balanced'
    : totalBalance >= -4
    ? 'Slight Deficit'
    : 'Deficit — Rebalance';

  const healthColor = totalBalance >= 0 ? Colors.primary : Colors.error;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <MaterialIcons name="notifications" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tag row */}
        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: Colors.primary }]}>
            <Text style={[styles.tagText, { color: Colors.onPrimary }]}>ACTIVE PROJECT</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: Colors.surfaceContainerHigh }]}>
            <Text style={[styles.tagText, { color: Colors.onSurface }]}>{entries.length} ENTRIES</Text>
          </View>
        </View>

        <Text style={styles.projectTitle}>{projectName}</Text>
        <Text style={styles.projectDesc}>
          {stats.totalHours.toFixed(1)} hours tracked across {Object.keys(Object.fromEntries(stats.catEntries)).length} categories over {stats.activeDays} active days.
          Primary focus: <Text style={{ color: Colors.primary, fontFamily: Fonts.bodySemiBold }}>{stats.topCategory}</Text> ({stats.topCategoryHours.toFixed(1)}h).
        </Text>

        {/* ── Hero metric: Balance ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.metricLabel}>TIME BALANCE STATUS</Text>
            <View style={styles.heroValueRow}>
              <Text style={[styles.heroBig, { color: healthColor }]}>
                {totalBalance >= 0 ? '+' : ''}{totalBalance.toFixed(1)}
              </Text>
              <Text style={styles.metricUnit}>hrs</Text>
            </View>
            <View style={[styles.healthBadge, { backgroundColor: healthColor + '18' }]}>
              <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
              <Text style={[styles.healthLabel, { color: healthColor }]}>{healthLabel}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/analytics')} style={styles.analyticsBtn}>
            <MaterialIcons name="analytics" size={22} color={Colors.primary} />
            <Text style={styles.analyticsBtnText}>Deep{'\n'}Dive</Text>
          </TouchableOpacity>
        </View>

        {/* ── Monthly Goal Progress ── */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.metricLabel}>MONTHLY GOAL PROGRESS</Text>
            <Text style={styles.metricPct}>{stats.progressPct}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${stats.progressPct}%` as DimensionValue }]} />
          </View>
          <Text style={styles.progressSub}>{monthlyHours.toFixed(1)}h of {settings.monthlyCap}h monthly cap</Text>
        </View>

        {/* ── Resource Allocation bars ── */}
        <View style={styles.card}>
          <View style={styles.allocHeader}>
            <MaterialIcons name="pie-chart" size={16} color={Colors.onSurfaceVariant} />
            <Text style={styles.allocLabel}>TIME ALLOCATION BY CATEGORY</Text>
          </View>
          {stats.catEntries.length === 0 ? (
            <Text style={styles.noDataText}>No entries logged yet</Text>
          ) : (
            <View style={styles.allocBars}>
              {stats.catEntries.slice(0, 5).map(([cat, hours], i) => (
                <View key={cat} style={styles.allocBarGroup}>
                  <View style={[styles.allocBar, {
                    height: `${(hours / stats.maxCat) * 100}%` as DimensionValue,
                    backgroundColor: CATEGORY_COLORS[cat] ?? Colors.primaryFixed,
                  }]} />
                  <Text style={styles.allocBarLabel}>{cat.substring(0, 3).toUpperCase()}</Text>
                  <Text style={styles.allocBarHours}>{hours.toFixed(0)}h</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Velocity & Weekly metrics ── */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: Colors.tertiaryFixed + '40', flex: 1 }]}>
            <View style={styles.metricCardHeader}>
              <MaterialIcons name="speed" size={16} color={Colors.tertiary} />
              <Text style={[styles.metricLabel, { color: Colors.tertiary }]}>VELOCITY</Text>
            </View>
            <Text style={styles.metricBig}>{stats.velocityPerWeek}</Text>
            <Text style={styles.metricSub}>entries / week</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: Colors.primaryFixed + '30', flex: 1 }]}>
            <View style={styles.metricCardHeader}>
              <MaterialIcons name="timer" size={16} color={Colors.primary} />
              <Text style={[styles.metricLabel, { color: Colors.primary }]}>AVG SESSION</Text>
            </View>
            <Text style={styles.metricBig}>{formatDuration(stats.avgSessionMin)}</Text>
            <Text style={styles.metricSub}>per log entry</Text>
          </View>
        </View>

        {/* ── Weekly Load ── */}
        <View style={[styles.metricCard, { backgroundColor: Colors.secondaryFixed + '40', marginTop: 0 }]}>
          <View style={styles.metricCardHeader}>
            <MaterialIcons name="date-range" size={16} color={Colors.secondary} />
            <Text style={[styles.metricLabel, { color: Colors.secondary }]}>WEEKLY LOAD</Text>
          </View>
          <View style={styles.weeklyRow}>
            <Text style={[styles.metricBig, { color: weeklyHours > settings.weeklyCommitment ? Colors.error : Colors.onSurface }]}>
              {weeklyHours.toFixed(1)}h
            </Text>
            <Text style={styles.weeklyTarget}>/ {settings.weeklyCommitment}h target</Text>
          </View>
          <View style={styles.weeklyBar}>
            <View style={[styles.weeklyFill, {
              width: `${Math.min(100, (weeklyHours / settings.weeklyCommitment) * 100)}%` as DimensionValue,
              backgroundColor: weeklyHours > settings.weeklyCommitment ? Colors.error : Colors.secondary,
            }]} />
          </View>
        </View>

        {/* ── Backlog: Recent logged tasks ── */}
        <View style={styles.backlogSection}>
          <View style={styles.backlogHeader}>
            <View>
              <Text style={styles.backlogTitle}>Recent{'\n'}Activity Log</Text>
              <Text style={styles.backlogDesc}>Last {stats.recentTasks.length} logged sessions</Text>
            </View>
            <TouchableOpacity style={styles.addTaskBtn} onPress={() => router.push('/(tabs)/add')}>
              <MaterialIcons name="add" size={18} color={Colors.onPrimary} />
              <Text style={styles.addTaskBtnText}>Log{'\n'}Time</Text>
            </TouchableOpacity>
          </View>

          {stats.recentTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="hourglass-empty" size={28} color={Colors.outlineVariant} />
              <Text style={styles.emptyText}>No sessions logged yet.</Text>
            </View>
          ) : (
            stats.recentTasks.map((task) => {
              const catColor = CATEGORY_COLORS[task.category] ?? Colors.primary;
              return (
                <View key={task.id} style={styles.taskItem}>
                  <View style={[styles.taskCatLine, { backgroundColor: catColor }]} />
                  <View style={styles.taskLeft}>
                    <Text style={styles.taskStatus}>{task.date}</Text>
                    <Text style={styles.taskTime}>{task.startTime} – {task.endTime}</Text>
                  </View>
                  <View style={styles.taskMiddle}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.description}</Text>
                    <View style={styles.taskTagRow}>
                      <View style={[styles.taskTag, { backgroundColor: catColor + '18' }]}>
                        <Text style={[styles.taskTagText, { color: catColor }]}>{task.category.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.taskDur}>{formatDuration(task.durationMinutes)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.taskBalance, { color: task.balanceHours >= 0 ? Colors.primary : Colors.error }]}>
                    {task.balanceHours >= 0 ? '+' : ''}{task.balanceHours.toFixed(1)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

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
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tag: { borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 1.5 },
  projectTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 38, color: Colors.onSurface, letterSpacing: -2, marginTop: 12, lineHeight: 42 },
  projectDesc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22, marginTop: 10 },
  // Hero Balance Card
  heroCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderWidth: 0.5, borderColor: Colors.outlineVariant + '25' },
  heroLeft: { flex: 1 },
  heroValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  heroBig: { fontFamily: Fonts.headlineExtraBold, fontSize: 44, letterSpacing: -2 },
  metricUnit: { fontFamily: Fonts.body, fontSize: 16, color: Colors.onSurfaceVariant },
  healthBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 10 },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  healthLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 1 },
  analyticsBtn: { alignItems: 'center', gap: 4, backgroundColor: Colors.primaryFixed + '30', borderRadius: 12, padding: 14 },
  analyticsBtnText: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 1, color: Colors.primary, textAlign: 'center', lineHeight: 14 },
  // Progress card
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  metricPct: { fontFamily: Fonts.headline, fontSize: 20, color: Colors.primary },
  progressBar: { height: 6, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 8 },
  // Allocation bars
  allocHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  allocLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  noDataText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.outline, textAlign: 'center', paddingVertical: 20 },
  allocBars: { flexDirection: 'row', justifyContent: 'space-between', height: 120, gap: 8 },
  allocBarGroup: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  allocBar: { width: '80%', borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 8 },
  allocBarLabel: { fontFamily: Fonts.labelBold, fontSize: 8, letterSpacing: 1, color: Colors.outline, marginTop: 4 },
  allocBarHours: { fontFamily: Fonts.body, fontSize: 9, color: Colors.onSurfaceVariant },
  // Metric cards
  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  metricCard: { borderRadius: 16, padding: 20, marginTop: 12 },
  metricCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metricBig: { fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: Colors.onSurface, letterSpacing: -1 },
  metricSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  weeklyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  weeklyTarget: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },
  weeklyBar: { height: 4, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 2, overflow: 'hidden', marginTop: 10 },
  weeklyFill: { height: '100%', borderRadius: 2 },
  // Backlog
  backlogSection: { marginTop: 28 },
  backlogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  backlogTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 26, color: Colors.onSurface, letterSpacing: -1, lineHeight: 30 },
  backlogDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 4 },
  addTaskBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', gap: 6 },
  addTaskBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.onPrimary, textAlign: 'center', lineHeight: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.outlineVariant + '25', gap: 12 },
  taskCatLine: { width: 3, height: 40, borderRadius: 2 },
  taskLeft: { width: 72 },
  taskStatus: { fontFamily: Fonts.labelBold, fontSize: 8, letterSpacing: 1.5, color: Colors.onSurfaceVariant },
  taskTime: { fontFamily: Fonts.headline, fontSize: 12, color: Colors.onSurface, marginTop: 2 },
  taskMiddle: { flex: 1 },
  taskTitle: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface },
  taskTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  taskTag: { borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3 },
  taskTagText: { fontFamily: Fonts.labelBold, fontSize: 8, letterSpacing: 1 },
  taskDur: { fontFamily: Fonts.body, fontSize: 11, color: Colors.onSurfaceVariant },
  taskBalance: { fontFamily: Fonts.headline, fontSize: 14, minWidth: 36, textAlign: 'right' },
});
