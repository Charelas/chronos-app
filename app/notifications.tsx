import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useRouter } from 'expo-router';

type Notification = {
  id: string;
  type: 'warning' | 'reminder' | 'system';
  icon: string;
  title: string;
  desc: string;
  time: string;
  actionLabel?: string;
  actionRoute?: string;
};

export default function NotificationsScreen() {
  const { totalBalance, weeklyHours, settings, entries, timer } = useApp();
  const router = useRouter();

  // ── Compute dynamic data ──────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];

  const { peakDayLabel, peakDayHours, streak, weeklyPct, hasEntryToday } = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Per-day hours this week
    const dayHours: Record<string, number> = {};
    entries
      .filter(e => new Date(e.date) >= weekStart)
      .forEach(e => { dayHours[e.date] = (dayHours[e.date] || 0) + e.durationMinutes / 60; });

    const peakEntry = Object.entries(dayHours).sort((a, b) => b[1] - a[1])[0];
    const peakDayLabel = peakEntry
      ? new Date(peakEntry[0]).toLocaleDateString('en-US', { weekday: 'long' })
      : null;
    const peakDayHours = peakEntry ? peakEntry[1] : 0;

    // Consecutive-day streak
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      if (entries.some(e => e.date === d.toISOString().split('T')[0])) {
        streak++;
      } else if (i > 0) break;
    }

    const weeklyPct = settings.weeklyCommitment > 0
      ? Math.round((weeklyHours / settings.weeklyCommitment) * 100)
      : 0;

    const hasEntryToday = entries.some(e => e.date === todayStr);

    return { peakDayLabel, peakDayHours, streak, weeklyPct, hasEntryToday };
  }, [entries, settings, weeklyHours, todayStr]);

  // ── Build notification list from state ────────────────────────────────
  const allNotifications: Notification[] = useMemo(() => {
    const notifs: Notification[] = [];

    // Active timer reminder
    if (timer.isRunning) {
      notifs.push({
        id: 'live1', type: 'reminder', icon: 'radio-button-checked',
        title: 'Timer Still Running',
        desc: `Active session: "${timer.currentTask}". Remember to stop it when you finish.`,
        time: 'NOW', actionLabel: 'Go to Dashboard', actionRoute: '/(tabs)',
      });
    }

    // Balance warnings
    if (totalBalance < -4) {
      notifs.push({
        id: 'w1', type: 'warning', icon: 'account-balance-wallet',
        title: 'Significant Balance Deficit',
        desc: `Your balance is at ${totalBalance.toFixed(1)}h. You've been investing heavily in personal time. Log more work sessions to restore equilibrium.`,
        time: 'NOW', actionLabel: 'Log Time', actionRoute: '/(tabs)/add',
      });
    } else if (totalBalance < 0) {
      notifs.push({
        id: 'w1b', type: 'warning', icon: 'trending-down',
        title: 'Balance Slightly Negative',
        desc: `Current balance: ${totalBalance.toFixed(1)}h. A small deficit is normal — your next session will bring it back.`,
        time: 'TODAY', actionLabel: 'Add Entry', actionRoute: '/(tabs)/add',
      });
    }

    // Overtime
    if (weeklyHours > settings.weeklyCommitment) {
      notifs.push({
        id: 'w2', type: 'warning', icon: 'timer-off',
        title: 'Overtime Threshold Reached',
        desc: `You've exceeded your ${settings.weeklyCommitment}h weekly target by ${(weeklyHours - settings.weeklyCommitment).toFixed(1)}h. Consider scheduling lighter tasks.`,
        time: 'TODAY',
      });
    }

    // Idle alert
    if (!hasEntryToday && !timer.isRunning && entries.length > 0) {
      notifs.push({
        id: 'r0', type: 'reminder', icon: 'hourglass-empty',
        title: 'No Sessions Logged Today',
        desc: "You haven't tracked any time yet today. Start a timer or add a manual entry to keep your balance accurate.",
        time: 'TODAY', actionLabel: 'Start Timer', actionRoute: '/(tabs)',
      });
    }

    // Weekly goal progress
    if (weeklyPct >= 100) {
      notifs.push({
        id: 'r1a', type: 'reminder', icon: 'check-circle',
        title: 'Weekly Target Achieved',
        desc: `You've hit ${weeklyPct}% of your ${settings.weeklyCommitment}h weekly goal. Balance is looking great — well done.`,
        time: 'THIS WEEK', actionLabel: 'View Analytics', actionRoute: '/analytics',
      });
    } else if (weeklyPct >= 75) {
      notifs.push({
        id: 'r1b', type: 'reminder', icon: 'flag',
        title: 'Almost at Weekly Goal',
        desc: `You're ${weeklyPct}% through your ${settings.weeklyCommitment}h commitment. ${(settings.weeklyCommitment - weeklyHours).toFixed(1)}h to go!`,
        time: 'THIS WEEK', actionLabel: 'View Progress', actionRoute: '/analytics',
      });
    }

    // Peak day insight
    if (peakDayLabel && peakDayHours > 0) {
      notifs.push({
        id: 'r2', type: 'reminder', icon: 'trending-up',
        title: `Peak Day: ${peakDayLabel}`,
        desc: `Most productive day this week was ${peakDayLabel} with ${peakDayHours.toFixed(1)}h logged. Schedule high-complexity tasks during this window.`,
        time: 'THIS WEEK', actionLabel: 'View Details', actionRoute: '/project_details',
      });
    }

    // Streak milestone
    if (streak >= 3) {
      notifs.push({
        id: 'r3', type: 'reminder', icon: 'local-fire-department',
        title: `${streak}-Day Tracking Streak`,
        desc: `You've logged time for ${streak} consecutive days. Consistent tracking leads to better balance awareness.`,
        time: `${streak}D STREAK`,
      });
    }

    // Monthly timesheet reminder
    notifs.push({
      id: 'r4', type: 'reminder', icon: 'history-edu',
      title: 'Monthly Timesheet Review',
      desc: 'Check your analytics for a full breakdown of this month\'s time allocation and balance status.',
      time: 'MONTHLY', actionLabel: 'Review', actionRoute: '/analytics',
    });

    // System notifications
    notifs.push({
      id: 's1', type: 'system', icon: 'auto-awesome',
      title: 'AI Insights Available',
      desc: 'The Balance Report now includes AI-powered insights that analyse your productivity patterns and generate personalised recommendations.',
      time: 'NEW', actionLabel: 'Try It', actionRoute: '/analytics',
    });

    notifs.push({
      id: 's2', type: 'system', icon: 'security',
      title: 'Your Data Stays Private',
      desc: 'All time entries are stored locally on your device. Nothing is sent to external servers.',
      time: '1W AGO',
    });

    return notifs;
  }, [totalBalance, weeklyHours, settings, timer, hasEntryToday, weeklyPct, peakDayLabel, peakDayHours, streak, entries]);

  const [dismissed, setDismissed] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'warning' | 'reminder' | 'system'>('all');

  const visibleNotifications = allNotifications
    .filter(n => !dismissed.includes(n.id))
    .filter(n => activeFilter === 'all' || n.type === activeFilter);

  const dismiss = (id: string) => setDismissed(prev => [...prev, id]);

  const counts = {
    all: allNotifications.filter(n => !dismissed.includes(n.id)).length,
    warning: allNotifications.filter(n => !dismissed.includes(n.id) && n.type === 'warning').length,
    reminder: allNotifications.filter(n => !dismissed.includes(n.id) && n.type === 'reminder').length,
    system: allNotifications.filter(n => !dismissed.includes(n.id) && n.type === 'system').length,
  };

  const handleAction = (notif: Notification) => {
    if (notif.actionRoute) {
      router.push(notif.actionRoute as any);
    } else {
      Alert.alert(notif.actionLabel || 'Action', 'This feature is coming soon!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => setDismissed(allNotifications.map(n => n.id))}>
          <Text style={styles.clearAll}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ── Filter categories ── */}
        <View style={styles.categoriesCard}>
          <Text style={styles.catLabel}>CATEGORIES</Text>
          {([
            { key: 'all', icon: 'all-inbox', label: 'All', color: Colors.primary },
            { key: 'warning', icon: 'warning', label: 'Warnings', color: Colors.error },
            { key: 'reminder', icon: 'schedule', label: 'Reminders', color: Colors.primary },
            { key: 'system', icon: 'system-update', label: 'System', color: Colors.secondary },
          ] as const).map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catItem, activeFilter === cat.key && styles.catItemActive]}
              onPress={() => setActiveFilter(cat.key)}
            >
              <View style={styles.catLeft}>
                <MaterialIcons name={cat.icon} size={20} color={activeFilter === cat.key ? Colors.primary : cat.color} />
                <Text style={[styles.catItemText, activeFilter === cat.key && styles.catItemActiveText]}>{cat.label}</Text>
              </View>
              <View style={[styles.catBadge, activeFilter === cat.key && { backgroundColor: Colors.primary }]}>
                <Text style={[styles.catBadgeText, activeFilter === cat.key && { color: Colors.onPrimary }]}>
                  {counts[cat.key]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Notification cards ── */}
        {visibleNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-none" size={40} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySub}>No notifications to show.</Text>
          </View>
        ) : (
          visibleNotifications.map(notif => (
            <View key={notif.id} style={styles.notifCard}>
              <View style={[styles.notifStripe, {
                backgroundColor: notif.type === 'warning' ? Colors.error : notif.type === 'reminder' ? Colors.primary : Colors.secondary,
              }]} />
              <View style={styles.notifBody}>
                <View style={styles.notifHeader}>
                  <View style={[styles.notifIconCircle, {
                    backgroundColor: (notif.type === 'warning' ? Colors.error : Colors.primary) + '15',
                  }]}>
                    <MaterialIcons
                      name={notif.icon as any}
                      size={22}
                      color={notif.type === 'warning' ? Colors.error : Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.notifTitleRow}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                    <Text style={styles.notifDesc}>{notif.desc}</Text>
                    <View style={styles.notifActions}>
                      {notif.actionLabel && (
                        <TouchableOpacity style={styles.actionPrimary} onPress={() => handleAction(notif)}>
                          <Text style={styles.actionPrimaryText}>{notif.actionLabel}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.actionSecondary} onPress={() => dismiss(notif.id)}>
                        <Text style={styles.actionSecondaryText}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))
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
  clearAll: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  categoriesCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 20, marginTop: 8 },
  catLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, marginBottom: 12 },
  catItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 2 },
  catItemActive: { backgroundColor: Colors.surfaceContainerHighest },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catItemText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },
  catItemActiveText: { fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  catBadge: { backgroundColor: Colors.surfaceContainerHigh, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  catBadgeText: { fontFamily: Fonts.labelBold, fontSize: 11, color: Colors.onSurfaceVariant },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface },
  emptySub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },
  notifCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden', marginTop: 12, flexDirection: 'row' },
  notifStripe: { width: 4 },
  notifBody: { flex: 1, padding: 18 },
  notifHeader: { flexDirection: 'row', gap: 14 },
  notifIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  notifTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notifTitle: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onSurface, flex: 1 },
  notifTime: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 1.5, color: Colors.onSurfaceVariant },
  notifDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20, marginTop: 6 },
  notifActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionPrimary: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  actionPrimaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onPrimary },
  actionSecondary: { backgroundColor: Colors.secondaryContainer, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  actionSecondaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onSecondaryContainer },
});
