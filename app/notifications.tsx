import React, { useState } from 'react';
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
  const { totalBalance, weeklyHours, settings } = useApp();
  const router = useRouter();

  const allNotifications: Notification[] = [
    ...(totalBalance < 0 ? [{
      id: 'w1', type: 'warning' as const, icon: 'account-balance-wallet',
      title: 'Weekly Balance Deficit',
      desc: `Your current time balance is at ${totalBalance.toFixed(1)} hours for the week. Consider logging your sessions to equalize.`,
      time: 'NOW', actionLabel: 'Log Time', actionRoute: '/(tabs)/add',
    }] : []),
    ...(weeklyHours > settings.weeklyCommitment ? [{
      id: 'w2', type: 'warning' as const, icon: 'timer-off',
      title: 'Overtime Threshold Reached',
      desc: `You've exceeded your weekly ${settings.weeklyCommitment}h target. Your "Rest & Recovery" score may be dropping.`,
      time: 'TODAY', actionLabel: 'Take Break',
    }] : []),
    {
      id: 'r1', type: 'reminder' as const, icon: 'event-repeat',
      title: 'Team Sync: Project Zenith',
      desc: 'Starts in 15 minutes. Ensure your daily logs are updated for the export.',
      time: 'UPCOMING', actionLabel: 'View Details', actionRoute: '/project_details',
    },
    {
      id: 'r2', type: 'reminder' as const, icon: 'history-edu',
      title: 'Monthly Timesheet Review',
      desc: 'Your balance summary requires review. Check your analytics for the full breakdown.',
      time: 'DUE SOON', actionLabel: 'Review', actionRoute: '/analytics',
    },
    {
      id: 's1', type: 'system' as const, icon: 'code',
      title: 'V2.4 Architecture Patch',
      desc: 'Enhanced the "Teams" visualization engine. Smoother transitions.',
      time: '3D AGO',
    },
    {
      id: 's2', type: 'system' as const, icon: 'security',
      title: 'Privacy Policy Update',
      desc: "We've clarified how team-level data is anonymized.",
      time: '1W AGO',
    },
  ];

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
        {/* Categories */}
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

        {/* Notifications */}
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
