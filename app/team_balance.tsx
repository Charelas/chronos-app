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

const CATEGORY_BG: Record<string, string> = {
  Work: Colors.primaryFixed + '40',
  Meeting: Colors.secondaryFixed + '40',
  Education: Colors.primaryFixed + '25',
  Personal: Colors.tertiaryFixed + '40',
  Overtime: Colors.tertiaryFixed + '30',
};

export default function WorkspaceBalanceScreen() {
  const { entries, weeklyHours, settings, monthlyHours, totalBalance, timer } = useApp();
  const router = useRouter();

  const stats = useMemo(() => {
    const burnRate = Math.min(100, Math.round((weeklyHours / settings.weeklyCommitment) * 100));

    // Category breakdown — all-time
    const categories: Record<string, { hours: number; count: number }> = {};
    entries.forEach(e => {
      if (!categories[e.category]) categories[e.category] = { hours: 0, count: 0 };
      categories[e.category].hours += e.durationMinutes / 60;
      categories[e.category].count += 1;
    });

    const catList = Object.entries(categories)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.hours - a.hours);

    const totalHours = catList.reduce((s, c) => s + c.hours, 0) || 1;

    const catListWithPct = catList.map(c => ({
      ...c,
      pct: Math.round((c.hours / totalHours) * 100),
    }));

    // Monthly & weekly metrics
    const monthlyPct = Math.min(100, Math.round((monthlyHours / settings.monthlyCap) * 100));
    const weeklyPct = Math.min(100, Math.round((weeklyHours / settings.weeklyCommitment) * 100));

    // All-time logged days
    const activeDays = new Set(entries.map(e => e.date)).size;

    // Current streak (consecutive days with entries, counting backwards from today)
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      if (entries.some(e => e.date === dStr)) {
        streak++;
      } else if (i > 0) {
        break; // allow today to be empty (might log later)
      }
    }

    // Status text
    const statusText = timer.isRunning
      ? 'IN SESSION'
      : burnRate >= 80
      ? 'IN FLOW'
      : burnRate >= 50
      ? 'ON TRACK'
      : weeklyHours === 0
      ? 'IDLE'
      : 'WARMING UP';

    const statusColor = timer.isRunning
      ? Colors.primary
      : burnRate >= 80
      ? Colors.primary
      : burnRate >= 50
      ? Colors.secondary
      : Colors.tertiary;

    const statusBg = timer.isRunning
      ? Colors.primaryFixed + '40'
      : burnRate >= 80
      ? Colors.primaryFixed + '40'
      : burnRate >= 50
      ? Colors.secondaryFixed + '40'
      : Colors.tertiaryFixed + '40';

    return {
      burnRate, catListWithPct, monthlyPct, weeklyPct,
      activeDays, streak, statusText, statusColor, statusBg,
    };
  }, [entries, weeklyHours, settings, monthlyHours, timer]);

  const balanceColor = totalBalance >= 0 ? Colors.primary : Colors.error;
  const userName = settings.userName || 'You';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workspace</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <MaterialIcons name="notifications" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>PERSONAL WORKSPACE</Text>
        <Text style={styles.pageTitle}>Balance{'\n'}Overview</Text>
        <Text style={styles.pageDesc}>
          A unified view of your time allocation, focus quality, and productivity rhythm.
        </Text>

        {/* ── Profile Status Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {userName.charAt(0).toUpperCase()}
              </Text>
              <View style={[styles.onlineDot, {
                backgroundColor: timer.isRunning ? '#4caf50' : stats.burnRate >= 50 ? '#ff9800' : Colors.outlineVariant,
              }]} />
            </View>
            <View>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileRole}>Chronos Balance User</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: stats.statusBg }]}>
            {timer.isRunning && <MaterialIcons name="radio-button-checked" size={11} color={stats.statusColor} />}
            {stats.statusText === 'IN FLOW' && <MaterialIcons name="bolt" size={11} color={stats.statusColor} />}
            <Text style={[styles.statusText, { color: stats.statusColor }]}>{stats.statusText}</Text>
          </View>
        </View>

        {/* ── Aggregate Burn Rate ── */}
        <View style={styles.card}>
          <Text style={styles.metricLabel}>WEEKLY BURN RATE</Text>
          <Text style={[styles.metricBig, { color: stats.burnRate >= 80 ? Colors.primary : stats.burnRate >= 50 ? Colors.secondary : Colors.onSurface }]}>
            {stats.burnRate}%
          </Text>
          <View style={styles.burnBar}>
            <View style={[styles.burnFill, {
              width: `${stats.burnRate}%` as DimensionValue,
              backgroundColor: stats.burnRate >= 100 ? Colors.error : stats.burnRate >= 80 ? Colors.primary : Colors.secondary,
            }]} />
          </View>
          <View style={styles.optimalRow}>
            <MaterialIcons
              name={stats.burnRate >= 70 ? 'trending-up' : 'trending-down'}
              size={14}
              color={stats.burnRate >= 70 ? Colors.primary : Colors.error}
            />
            <Text style={[styles.optimalText, { color: stats.burnRate >= 70 ? Colors.primary : Colors.error }]}>
              {stats.burnRate >= 100 ? 'Over weekly capacity' : stats.burnRate >= 80 ? 'Optimal flow state' : stats.burnRate >= 50 ? 'Building momentum' : 'Needs attention'}
            </Text>
          </View>
        </View>

        {/* ── Stat Pills ── */}
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillValue}>{stats.activeDays}</Text>
            <Text style={styles.pillLabel}>Active Days</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillValue}>{entries.length}</Text>
            <Text style={styles.pillLabel}>Total Entries</Text>
          </View>
          <View style={styles.pill}>
            <Text style={[styles.pillValue, { color: balanceColor }]}>
              {totalBalance >= 0 ? '+' : ''}{totalBalance.toFixed(1)}h
            </Text>
            <Text style={styles.pillLabel}>Balance</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillValue}>{stats.streak}d</Text>
            <Text style={styles.pillLabel}>Streak</Text>
          </View>
        </View>

        {/* ── Category Focus Breakdown ── */}
        <View style={styles.flowSection}>
          <View style={styles.flowHeader}>
            <Text style={styles.flowTitle}>Focus{'\n'}Breakdown</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/analytics')}>
              <Text style={styles.viewAllText}>Full{'\n'}Analytics</Text>
              <MaterialIcons name="arrow-forward" size={16} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {stats.catListWithPct.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="category" size={28} color={Colors.outlineVariant} />
              <Text style={styles.emptyText}>No entries logged yet</Text>
            </View>
          ) : (
            stats.catListWithPct.map((cat) => (
              <View key={cat.name} style={styles.catCard}>
                <View style={styles.catLeft}>
                  <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[cat.name] ?? Colors.primary }]} />
                  <View>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catSub}>{cat.count} sessions · {formatDuration(Math.round(cat.hours * 60))}</Text>
                  </View>
                </View>
                <View style={styles.catRight}>
                  <Text style={[styles.catPct, { color: CATEGORY_COLORS[cat.name] ?? Colors.primary }]}>{cat.pct}%</Text>
                  <View style={[styles.catBadge, { backgroundColor: CATEGORY_BG[cat.name] ?? Colors.primaryFixed + '40' }]}>
                    <Text style={[styles.catBadgeText, { color: CATEGORY_COLORS[cat.name] ?? Colors.primary }]}>
                      {cat.hours.toFixed(1)}h
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Shared Velocity / Goals ── */}
        <View style={styles.velocityCard}>
          <Text style={styles.velocityTitle}>Progress Metrics</Text>
          {[
            {
              name: 'Monthly Goal',
              sub: `${monthlyHours.toFixed(1)}h of ${settings.monthlyCap}h cap`,
              pct: stats.monthlyPct,
              color: Colors.primary,
            },
            {
              name: 'Weekly Commitment',
              sub: `${weeklyHours.toFixed(1)}h of ${settings.weeklyCommitment}h target`,
              pct: stats.weeklyPct,
              color: stats.weeklyPct > 100 ? Colors.error : Colors.tertiary,
            },
            {
              name: 'Balance Health',
              sub: totalBalance >= 0 ? `+${totalBalance.toFixed(1)}h surplus` : `${totalBalance.toFixed(1)}h deficit`,
              pct: Math.min(100, Math.max(0, 50 + totalBalance * 5)),
              color: balanceColor,
            },
          ].map((proj, i) => (
            <View key={i} style={styles.projectRow}>
              <View style={styles.projectTop}>
                <View>
                  <Text style={styles.projectName}>{proj.name}</Text>
                  <Text style={styles.projectSub}>{proj.sub}</Text>
                </View>
                <Text style={[styles.projectPct, { color: proj.color }]}>{proj.pct}%</Text>
              </View>
              <View style={styles.projectBar}>
                <View style={[styles.projectBarFill, {
                  width: `${proj.pct}%` as DimensionValue,
                  backgroundColor: proj.color,
                }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerTag}>
          <Text style={styles.footerTagText}>ARCHITECTURE · PRECISION · BALANCE</Text>
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
  sectionLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.primary, marginTop: 12 },
  pageTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 32, color: Colors.onSurface, letterSpacing: -1, marginTop: 4, lineHeight: 38 },
  pageDesc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22, marginTop: 10 },
  // Profile card
  profileCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 18, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.5, borderColor: Colors.outlineVariant + '25' },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryFixed, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarInitial: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.primary },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.surfaceContainerLowest },
  profileName: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.onSurface },
  profileRole: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 1.5 },
  // Burn rate card
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 12 },
  metricLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  metricBig: { fontFamily: Fonts.headlineExtraBold, fontSize: 40, letterSpacing: -2, marginTop: 4 },
  burnBar: { height: 6, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden', marginTop: 14 },
  burnFill: { height: '100%', borderRadius: 3 },
  optimalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  optimalText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  // Stat pills
  pillRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pill: { flex: 1, backgroundColor: Colors.surfaceContainerLow, borderRadius: 14, padding: 14, alignItems: 'center' },
  pillValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, letterSpacing: -1 },
  pillLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant, marginTop: 2, textAlign: 'center' },
  // Focus breakdown
  flowSection: { marginTop: 28 },
  flowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  flowTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 24, color: Colors.onSurface, letterSpacing: -0.5, lineHeight: 28 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewAllText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.onSurface, textAlign: 'right', lineHeight: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },
  catCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface },
  catSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catPct: { fontFamily: Fonts.headline, fontSize: 16 },
  catBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  catBadgeText: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 0.5 },
  // Progress metrics
  velocityCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 20 },
  velocityTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: 20 },
  projectRow: { marginBottom: 20 },
  projectTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  projectName: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface },
  projectSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  projectPct: { fontFamily: Fonts.headline, fontSize: 20 },
  projectBar: { height: 5, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  projectBarFill: { height: '100%', borderRadius: 3 },
  footerTag: { marginTop: 28, marginBottom: 12 },
  footerTagText: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2.5, color: Colors.primary + '80' },
});
