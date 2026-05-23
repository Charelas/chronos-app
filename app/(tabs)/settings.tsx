import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { settings, updateSettings, entries, clearEntries, signOut } = useApp();
  const router = useRouter();

  const handleToggle = async (key: string, value: boolean) => {
    await updateSettings({ [key]: value } as any);
  };

  const adjustWeekly = async (delta: number) => {
    const newVal = Math.max(10, Math.min(80, settings.weeklyCommitment + delta));
    await updateSettings({ weeklyCommitment: newVal });
  };

  const adjustMonthly = async (delta: number) => {
    const newVal = Math.max(40, Math.min(320, settings.monthlyCap + delta));
    await updateSettings({ monthlyCap: newVal });
  };

  const cycleTimeFormat = async () => {
    await updateSettings({ timeFormat: settings.timeFormat === '24H' ? '12H' : '24H' });
  };

  const cyclePrecision = async () => {
    await updateSettings({ precision: settings.precision === 'HH:MM' ? 'Decimal' : 'HH:MM' });
  };

  const handlePurge = () => {
    Alert.alert(
      'Purge All Logs',
      `This will permanently delete all ${entries.length} time entries. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge', style: 'destructive',
          onPress: async () => {
            await clearEntries(); // BUG-002 fix: syncs state immediately, no restart needed
            Alert.alert('Done', 'All time logs have been cleared.');
          }
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Reset onboarding and sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await signOut(); // R-CS-003: uses context abstraction, no direct AsyncStorage
          router.replace('/splash');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="menu" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>Balanced Chronograph</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <MaterialIcons name="notifications" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Image
              source={require('../../assets/images/avatar.png')}
              style={styles.profileImg}
            />
            <TouchableOpacity style={styles.editBadge}>
              <MaterialIcons name="edit" size={14} color={Colors.onPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileRole}>CHRONOS BALANCE USER</Text>
          <Text style={styles.profileName}>{settings.userName || 'My Profile'}</Text>
          <Text style={styles.profileBio}>
            Optimizing daily productivity through precise temporal balancing and intentional work-life equilibrium.
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(entries.reduce((s, e) => s + e.durationMinutes, 0) / 60)}h</Text>
              <Text style={styles.statLabel}>Total Logged</Text>
            </View>
          </View>
        </View>

        {/* Temporal Targets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Temporal Targets</Text>

          <Text style={styles.targetLabel}>WEEKLY COMMITMENT</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustWeekly(-5)}>
              <MaterialIcons name="remove" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={styles.stepperNum}>{settings.weeklyCommitment}</Text>
              <Text style={styles.stepperUnit}>hrs</Text>
            </View>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustWeekly(5)}>
              <MaterialIcons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.targetLabel, { marginTop: 20 }]}>MONTHLY CAP</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustMonthly(-10)}>
              <MaterialIcons name="remove" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={styles.stepperNum}>{settings.monthlyCap}</Text>
              <Text style={styles.stepperUnit}>hrs</Text>
            </View>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustMonthly(10)}>
              <MaterialIcons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              Adjusting these will recalibrate your balance dashboard metrics immediately.
            </Text>
          </View>
        </View>

        {/* Display Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Display</Text>

          <TouchableOpacity style={styles.settingRow} onPress={cycleTimeFormat}>
            <View>
              <Text style={styles.settingName}>Time Format</Text>
              <Text style={styles.settingSub}>24-hour vs 12-hour</Text>
            </View>
            <View style={styles.settingToggle}>
              <Text style={styles.settingValue}>{settings.timeFormat}</Text>
              <MaterialIcons name="chevron-right" size={18} color={Colors.onSurfaceVariant} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={cyclePrecision}>
            <View>
              <Text style={styles.settingName}>Precision</Text>
              <Text style={styles.settingSub}>Decimal vs HH:MM</Text>
            </View>
            <View style={styles.settingToggle}>
              <Text style={styles.settingValue}>{settings.precision}</Text>
              <MaterialIcons name="chevron-right" size={18} color={Colors.onSurfaceVariant} />
            </View>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingName}>Currency</Text>
              <Text style={styles.settingSub}>For billable tracking</Text>
            </View>
            <Text style={styles.settingValue}>{settings.currency}</Text>
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingName}>Dark Mode</Text>
            <Switch
              value={settings.darkMode}
              onValueChange={(v) => handleToggle('darkMode', v)}
              trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
              thumbColor={Colors.surfaceContainerLowest}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>

          <View style={styles.notifRow}>
            <View style={styles.notifLeft}>
              <MaterialIcons name="wb-sunny" size={22} color={Colors.tertiary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingName}>Daily Summary</Text>
                <Text style={styles.settingSub}>Get a digest of your hours every evening at 6:00 PM.</Text>
              </View>
            </View>
            <Switch
              value={settings.dailySummary}
              onValueChange={(v) => handleToggle('dailySummary', v)}
              trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
              thumbColor={Colors.surfaceContainerLowest}
            />
          </View>

          <View style={styles.notifRow}>
            <View style={styles.notifLeft}>
              <MaterialIcons name="hourglass-empty" size={22} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingName}>Idle Alerts</Text>
                <Text style={styles.settingSub}>Remind me to start my timer after 15 mins of activity.</Text>
              </View>
            </View>
            <Switch
              value={settings.idleAlerts}
              onValueChange={(v) => handleToggle('idleAlerts', v)}
              trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
              thumbColor={Colors.surfaceContainerLowest}
            />
          </View>
        </View>

        {/* Quick Navigation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Navigation</Text>
          <TouchableOpacity style={styles.navRow} onPress={() => router.push('/analytics')}>
            <MaterialIcons name="analytics" size={22} color={Colors.primary} />
            <Text style={styles.navText}>Analytics Deep Dive</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navRow} onPress={() => router.push('/project_details')}>
            <MaterialIcons name="folder-special" size={22} color={Colors.primary} />
            <Text style={styles.navText}>Project Details</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navRow} onPress={() => router.push('/team_balance')}>
            <MaterialIcons name="groups" size={22} color={Colors.primary} />
            <Text style={styles.navText}>Team Balance</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navRow} onPress={() => router.push('/notifications')}>
            <MaterialIcons name="notifications" size={22} color={Colors.primary} />
            <Text style={styles.navText}>Notification Center</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Critical Actions */}
        <Text style={styles.criticalLabel}>CRITICAL ACTIONS</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handlePurge}>
          <MaterialIcons name="delete-forever" size={20} color={Colors.error} />
          <Text style={styles.dangerText}>Purge All Time Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color={Colors.onSurface} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 56 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.primary, letterSpacing: -0.3 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  profileSection: { marginTop: 12 },
  profileAvatar: { width: 80, height: 80, position: 'relative' },
  profileImg: { width: 80, height: 80, borderRadius: 40 },
  editBadge: { position: 'absolute', bottom: 0, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.surface },
  profileRole: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, marginTop: 16 },
  profileName: { fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: Colors.onSurface, letterSpacing: -1, marginTop: 4 },
  profileBio: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22, marginTop: 6 },
  statsRow: { flexDirection: 'row', marginTop: 16, backgroundColor: Colors.surfaceContainerLow, borderRadius: 12, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 22, color: Colors.primary },
  statLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.outlineVariant + '40' },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 20 },
  cardTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: 16 },
  targetLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 8 },
  stepperBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  stepperValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4, minWidth: 80, justifyContent: 'center' },
  stepperNum: { fontFamily: Fonts.headlineExtraBold, fontSize: 36, color: Colors.onSurface, letterSpacing: -2 },
  stepperUnit: { fontFamily: Fonts.body, fontSize: 16, color: Colors.onSurfaceVariant },
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: Colors.surfaceContainerLow, borderRadius: 12, padding: 14, marginTop: 20 },
  infoText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, flex: 1, lineHeight: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.outlineVariant + '25' },
  settingName: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface },
  settingSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  settingToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.primary },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  notifLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1, marginRight: 12 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.outlineVariant + '15' },
  navText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface, flex: 1 },
  criticalLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, marginTop: 28, marginBottom: 12 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.errorContainer, borderRadius: 12, padding: 16, marginBottom: 8 },
  dangerText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.error },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 12, padding: 16 },
  logoutText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
});
