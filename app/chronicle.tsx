import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { getWeeklyChronicle } from '../utils/chronicle';
import {
  ChronicleInput, WeeklyChronicle, getChronicles,
  getWeekId, getWeekLabel,
  saveChronicle,
} from '../utils/storage';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeChronicleInput(
  entries: ReturnType<typeof useApp>['entries'],
  settings: ReturnType<typeof useApp>['settings'],
  weekStart: Date,
): ChronicleInput {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekEntries = entries.filter(e => {
    const d = new Date(e.date);
    return d >= weekStart && d <= weekEnd;
  });

  const dayHours: Record<string, number> = {};
  weekEntries.forEach(e => {
    dayHours[e.date] = (dayHours[e.date] || 0) + e.durationMinutes / 60;
  });

  const peakEntry = Object.entries(dayHours).sort((a, b) => b[1] - a[1])[0];
  const peakDay = peakEntry
    ? new Date(peakEntry[0]).toLocaleDateString('en-US', { weekday: 'long' })
    : 'No peak day';
  const peakDayHours = peakEntry ? peakEntry[1] : 0;

  const totalHours = weekEntries.reduce((s, e) => s + e.durationMinutes / 60, 0);
  const finalBalance = weekEntries.reduce((s, e) => s + e.balanceHours, 0);
  const activeDays = Object.keys(dayHours).length;

  // Category breakdown
  const catHours: Record<string, number> = {};
  weekEntries.forEach(e => { catHours[e.category] = (catHours[e.category] || 0) + e.durationMinutes / 60; });
  const topCategory = Object.entries(catHours).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Work';
  const categoryBreakdown = Object.entries(catHours).map(([name, h]) => ({
    name, pct: totalHours > 0 ? Math.round((h / totalHours) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  return {
    weekId: getWeekId(weekStart),
    weekLabel: getWeekLabel(weekStart),
    totalHours,
    activeDays,
    totalEntries: weekEntries.length,
    peakDay,
    peakDayHours,
    weeklyTarget: settings.weeklyCommitment,
    finalBalance,
    topCategory,
    categoryBreakdown,
  };
}

// ─── Category colour system ───────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Work: Colors.primary,
  Overtime: Colors.secondary,
  Meeting: '#e67e22',
  Education: '#8e44ad',
  Personal: Colors.error,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChronicleScreen() {
  const { entries, settings, totalBalance } = useApp();
  const router = useRouter();

  const [chronicles, setChronicles] = useState<WeeklyChronicle[]>([]);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Current week bounds
  const now = new Date();
  const weekStart = useMemo(() => {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentWeekId = getWeekId(weekStart);
  const currentInput = useMemo(
    () => computeChronicleInput(entries, settings, weekStart),
    [entries, settings, weekStart],
  );

  const existingThisWeek = useMemo(
    () => chronicles.find(c => c.weekId === currentWeekId),
    [chronicles, currentWeekId],
  );

  useEffect(() => {
    getChronicles().then(setChronicles);
  }, []);

  const handleGenerate = async () => {
    if (currentInput.totalEntries === 0) {
      Alert.alert('No Data Yet', 'Log at least one time entry this week to generate a Chronicle.');
      return;
    }
    setGenerating(true);
    try {
      const result = await getWeeklyChronicle(currentInput);
      const chronicle: WeeklyChronicle = {
        weekId: currentInput.weekId,
        weekLabel: currentInput.weekLabel,
        narrative: result.narrative,
        generatedAt: new Date().toISOString(),
        stats: {
          totalHours: currentInput.totalHours,
          activeDays: currentInput.activeDays,
          totalEntries: currentInput.totalEntries,
          peakDay: currentInput.peakDay,
          peakDayHours: currentInput.peakDayHours,
          finalBalance: currentInput.finalBalance,
          topCategory: currentInput.topCategory,
          weeklyTarget: currentInput.weeklyTarget,
        },
        source: result.source,
      };
      const updated = await saveChronicle(chronicle);
      setChronicles(updated);
      setExpandedId(currentWeekId);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate chronicle. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async (c: WeeklyChronicle) => {
    const pct = c.stats.weeklyTarget > 0
      ? Math.round((c.stats.totalHours / c.stats.weeklyTarget) * 100)
      : 0;
    const text = `📖 Weekly Chronicle — ${c.weekLabel}\n\n${c.narrative}\n\n` +
      `─────────────────\n` +
      `${c.stats.totalHours.toFixed(1)}h logged · ${pct}% of ${c.stats.weeklyTarget}h target\n` +
      `Balance: ${c.stats.finalBalance >= 0 ? '+' : ''}${c.stats.finalBalance.toFixed(1)}h\n\n` +
      `Tracked with Chronos Balance`;
    await Share.share({ message: text });
  };

  const balancePct = currentInput.weeklyTarget > 0
    ? Math.min((currentInput.totalHours / currentInput.weeklyTarget) * 100, 100)
    : 0;

  const pastChronicles = chronicles.filter(c => c.weekId !== currentWeekId);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Chronicle</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero intro ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>EDITORIAL RECORD</Text>
          <Text style={styles.heroTitle}>Your week,{'\n'}in words.</Text>
          <Text style={styles.heroBody}>
            Each week distilled into a single editorial paragraph — precise numbers,
            calm tone, a permanent record of how your time was spent.
          </Text>
        </View>

        {/* ── This Week card ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <Text style={styles.sectionSub}>{currentInput.weekLabel}</Text>
        </View>

        <View style={styles.thisWeekCard}>
          {/* Stats row */}
          <View style={styles.statRow}>
            {[
              { label: 'HOURS', value: currentInput.totalHours.toFixed(1) + 'h' },
              { label: 'SESSIONS', value: `${currentInput.totalEntries}` },
              { label: 'BALANCE', value: `${currentInput.finalBalance >= 0 ? '+' : ''}${currentInput.finalBalance.toFixed(1)}h` },
            ].map(s => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={[styles.statValue, s.label === 'BALANCE' && {
                  color: currentInput.finalBalance >= 0 ? Colors.primary : Colors.error,
                }]}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Progress bar */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${balancePct}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>{Math.round(balancePct)}% of {currentInput.weeklyTarget}h goal</Text>
          </View>

          {/* Category breakdown pills */}
          {currentInput.categoryBreakdown.length > 0 && (
            <View style={styles.catRow}>
              {currentInput.categoryBreakdown.slice(0, 4).map((c: { name: string; pct: number }) => (
                <View key={c.name} style={[styles.catPill, { backgroundColor: (CAT_COLORS[c.name] || Colors.primary) + '20' }]}>
                  <View style={[styles.catDot, { backgroundColor: CAT_COLORS[c.name] || Colors.primary }]} />
                  <Text style={[styles.catText, { color: CAT_COLORS[c.name] || Colors.primary }]}>
                    {c.name} {c.pct}%
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Chronicle narrative or generate button */}
          {existingThisWeek ? (
            <View style={styles.narrativeBox}>
              <View style={styles.narrativeHeader}>
                <MaterialIcons
                  name={existingThisWeek.source === 'ai' ? 'auto-awesome' : 'edit-note'}
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.narrativeBadge}>
                  {existingThisWeek.source === 'ai' ? 'AI CHRONICLE' : 'CHRONICLE'}
                </Text>
              </View>
              <Text style={styles.narrativeText}>{existingThisWeek.narrative}</Text>
              <View style={styles.narrativeActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleGenerate} disabled={generating}>
                  <MaterialIcons name="refresh" size={16} color={Colors.onSurfaceVariant} />
                  <Text style={styles.actionBtnText}>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(existingThisWeek)}>
                  <MaterialIcons name="share" size={16} color={Colors.onSurfaceVariant} />
                  <Text style={styles.actionBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.generateBtn, generating && { opacity: 0.6 }]}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <ActivityIndicator size="small" color={Colors.onPrimary} />
                  <Text style={styles.generateBtnText}>Writing chronicle…</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="auto-awesome" size={20} color={Colors.onPrimary} />
                  <Text style={styles.generateBtnText}>Generate This Week's Chronicle</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Past Chronicles ── */}
        {pastChronicles.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>ARCHIVE</Text>
              <Text style={styles.sectionSub}>{pastChronicles.length} past weeks</Text>
            </View>

            {pastChronicles.map(c => {
              const isExpanded = expandedId === c.weekId;
              const pct = c.stats.weeklyTarget > 0
                ? Math.round((c.stats.totalHours / c.stats.weeklyTarget) * 100) : 0;

              return (
                <TouchableOpacity
                  key={c.weekId}
                  style={styles.archiveCard}
                  onPress={() => setExpandedId(isExpanded ? null : c.weekId)}
                  activeOpacity={0.85}
                >
                  <View style={styles.archiveTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.archiveWeek}>{c.weekLabel}</Text>
                      <Text style={styles.archiveStats}>
                        {c.stats.totalHours.toFixed(1)}h · {c.stats.totalEntries} sessions · {pct}% of goal
                      </Text>
                    </View>
                    <View style={styles.archiveBalancePill}>
                      <Text style={[styles.archiveBalance, {
                        color: c.stats.finalBalance >= 0 ? Colors.primary : Colors.error,
                      }]}>
                        {c.stats.finalBalance >= 0 ? '+' : ''}{c.stats.finalBalance.toFixed(1)}h
                      </Text>
                    </View>
                    <MaterialIcons
                      name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={20}
                      color={Colors.onSurfaceVariant}
                    />
                  </View>

                  {isExpanded && (
                    <View style={styles.archiveExpanded}>
                      <View style={styles.archiveDivider} />
                      <View style={styles.narrativeHeader}>
                        <MaterialIcons
                          name={c.source === 'ai' ? 'auto-awesome' : 'edit-note'}
                          size={14}
                          color={Colors.primary}
                        />
                        <Text style={styles.narrativeBadge}>
                          {c.source === 'ai' ? 'AI CHRONICLE' : 'CHRONICLE'}
                        </Text>
                      </View>
                      <Text style={styles.archiveNarrative}>{c.narrative}</Text>
                      <TouchableOpacity
                        style={[styles.actionBtn, { marginTop: 12 }]}
                        onPress={() => handleShare(c)}
                      >
                        <MaterialIcons name="share" size={16} color={Colors.onSurfaceVariant} />
                        <Text style={styles.actionBtnText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, height: 56,
  },
  headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSurface },
  scroll: { flex: 1, paddingHorizontal: 20 },

  // Hero
  heroCard: {
    backgroundColor: Colors.primaryContainer, borderRadius: 20,
    padding: 28, marginTop: 8,
  },
  heroEyebrow: {
    fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2,
    color: Colors.primary, marginBottom: 10,
  },
  heroTitle: {
    fontFamily: Fonts.headlineExtraBold, fontSize: 34, color: Colors.onPrimaryContainer,
    letterSpacing: -1.2, lineHeight: 40,
  },
  heroBody: {
    fontFamily: Fonts.body, fontSize: 14, color: Colors.onPrimaryContainer,
    lineHeight: 22, marginTop: 12, opacity: 0.8,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginTop: 28, marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2,
    color: Colors.onSurfaceVariant,
  },
  sectionSub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },

  // This week card
  thisWeekCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: 20,
    padding: 24,
  },

  // Stats
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: {
    fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 1.5,
    color: Colors.onSurfaceVariant, marginBottom: 4,
  },
  statValue: {
    fontFamily: Fonts.headlineExtraBold, fontSize: 22, color: Colors.onSurface,
    letterSpacing: -0.5,
  },

  // Progress
  progressWrap: { marginBottom: 16 },
  progressTrack: {
    height: 4, backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  progressLabel: {
    fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 6,
  },

  // Category pills
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6,
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },

  // Narrative
  narrativeBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14, padding: 18,
  },
  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  narrativeBadge: {
    fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 1.5,
    color: Colors.primary,
  },
  narrativeText: {
    fontFamily: Fonts.body, fontSize: 15, color: Colors.onSurface,
    lineHeight: 26, letterSpacing: 0.1,
  },
  narrativeActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  actionBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onSurfaceVariant },

  // Generate button
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, marginTop: 8,
  },
  generateBtnText: { fontFamily: Fonts.headlineExtraBold, fontSize: 15, color: Colors.onPrimary },

  // Archive
  archiveCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16,
    padding: 18, marginBottom: 10,
  },
  archiveTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  archiveWeek: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onSurface },
  archiveStats: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3 },
  archiveBalancePill: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  archiveBalance: { fontFamily: Fonts.headline, fontSize: 14 },
  archiveExpanded: { marginTop: 12 },
  archiveDivider: {
    height: 1, backgroundColor: Colors.outlineVariant + '30', marginBottom: 14,
  },
  archiveNarrative: {
    fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurface,
    lineHeight: 24, letterSpacing: 0.1,
  },
});
