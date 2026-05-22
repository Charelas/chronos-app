import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, DimensionValue } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useRouter } from 'expo-router';

export default function TeamBalanceScreen() {
  const { entries, weeklyHours, settings, monthlyHours } = useApp();
  const router = useRouter();

  const burnRate = Math.min(100, Math.round((weeklyHours / settings.weeklyCommitment) * 100));

  // Simulated team members with status based on data
  const members = [
    {
      name: 'Alex Sterling', role: 'Lead Architect',
      status: burnRate >= 80 ? 'IN FLOW' : 'WARMING UP',
      statusColor: burnRate >= 80 ? Colors.primary : Colors.secondary,
      statusBg: burnRate >= 80 ? Colors.primaryFixed + '40' : Colors.secondaryFixed + '40',
      dotColor: '#4caf50',
    },
    {
      name: 'Jordan Kim', role: 'UX Strategist',
      status: 'ON BREAK',
      statusColor: Colors.tertiary,
      statusBg: Colors.tertiaryFixed + '40',
      dotColor: '#ff9800',
    },
    {
      name: 'Maya Rao', role: 'Senior Dev',
      status: weeklyHours > settings.weeklyCommitment ? 'OVER CAP' : 'BALANCED',
      statusColor: weeklyHours > settings.weeklyCommitment ? Colors.error : Colors.primary,
      statusBg: weeklyHours > settings.weeklyCommitment ? Colors.errorContainer : Colors.primaryFixed + '40',
      dotColor: weeklyHours > settings.weeklyCommitment ? Colors.error : '#4caf50',
    },
  ];

  // Projects with real progress
  const totalEntries = entries.length;
  const projects: { name: string; sub: string; pct: number; color: string }[] = [
    { name: 'Project Chronos', sub: `${totalEntries} entries logged`, pct: Math.min(100, Math.round(monthlyHours / settings.monthlyCap * 100)), color: Colors.primary },
    { name: 'Weekly Target', sub: `${settings.weeklyCommitment}h commitment`, pct: Math.min(100, Math.round(weeklyHours / settings.weeklyCommitment * 100)), color: Colors.tertiary },
    { name: 'Balance Health', sub: burnRate >= 70 ? 'Healthy pace' : 'Needs attention', pct: burnRate, color: Colors.primary },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Balance</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <MaterialIcons name="notifications" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>OPERATIONAL HEALTH</Text>
        <Text style={styles.pageTitle}>Team Balance{'\n'}Overview</Text>
        <Text style={styles.pageDesc}>
          A synchronized view of collective focus, capacity, and architectural milestones. No borders, just breathing room.
        </Text>

        {/* Aggregate Burn Rate */}
        <View style={styles.card}>
          <Text style={styles.metricLabel}>AGGREGATE BURN RATE</Text>
          <Text style={styles.metricBig}>{burnRate}%</Text>
          <View style={styles.optimalRow}>
            <MaterialIcons
              name={burnRate >= 70 ? 'trending-up' : 'trending-down'}
              size={16}
              color={burnRate >= 70 ? Colors.primary : Colors.error}
            />
            <Text style={[styles.optimalText, { color: burnRate >= 70 ? Colors.primary : Colors.error }]}>
              {burnRate >= 80 ? 'Optimal Flow State' : burnRate >= 50 ? 'Building Momentum' : 'Needs Attention'}
            </Text>
          </View>
        </View>

        {/* Synchronized Flow */}
        <View style={styles.flowSection}>
          <View style={styles.flowHeader}>
            <Text style={styles.flowTitle}>Synchronized{'\n'}Flow</Text>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All{'\n'}Members</Text>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {members.map((member, i) => (
            <View key={i} style={styles.memberCard}>
              <View style={styles.memberLeft}>
                <View style={styles.memberAvatarWrap}>
                  <Image
                    source={require('../assets/images/avatar.png')}
                    style={styles.memberAvatar}
                  />
                  <View style={[styles.memberDot, { backgroundColor: member.dotColor }]} />
                </View>
                <View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: member.statusBg }]}>
                {member.status === 'OVER CAP' && <MaterialIcons name="warning" size={12} color={member.statusColor} />}
                {member.status === 'IN FLOW' && <MaterialIcons name="bolt" size={12} color={member.statusColor} />}
                <Text style={[styles.statusText, { color: member.statusColor }]}>{member.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Shared Velocity */}
        <View style={styles.velocityCard}>
          <Text style={styles.velocityTitle}>Shared Velocity</Text>
          {projects.map((proj, i) => (
            <View key={i} style={styles.projectRow}>
              <View style={styles.projectTop}>
                <View>
                  <Text style={styles.projectName}>{proj.name}</Text>
                  <Text style={styles.projectSub}>{proj.sub}</Text>
                </View>
                <Text style={styles.projectPct}>{proj.pct}%</Text>
              </View>
              <View style={styles.projectBar}>
                <View style={[styles.projectBarFill, { width: `${proj.pct}%` as DimensionValue, backgroundColor: proj.color }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Footer tagline */}
        <View style={styles.footerTag}>
          <Text style={styles.footerTagText}>ARCHITECTURE / PRECISION / BALANCE</Text>
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
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 20 },
  metricLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  metricBig: { fontFamily: Fonts.headlineExtraBold, fontSize: 40, color: Colors.primary, letterSpacing: -2, marginTop: 4 },
  optimalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  optimalText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  flowSection: { marginTop: 28 },
  flowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flowTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 24, color: Colors.onSurface, letterSpacing: -0.5, lineHeight: 28 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewAllText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.onSurface, textAlign: 'right', lineHeight: 16 },
  memberCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 18, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  memberAvatarWrap: { position: 'relative' },
  memberAvatar: { width: 48, height: 48, borderRadius: 24 },
  memberDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.surfaceContainerLowest },
  memberName: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onSurface },
  memberRole: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 1.5 },
  velocityCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 20 },
  velocityTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: 20 },
  projectRow: { marginBottom: 20 },
  projectTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  projectName: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface },
  projectSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  projectPct: { fontFamily: Fonts.headline, fontSize: 20, color: Colors.onSurface },
  projectBar: { height: 6, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  projectBarFill: { height: '100%', borderRadius: 3 },
  footerTag: { marginTop: 28, marginBottom: 12 },
  footerTagText: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2.5, color: Colors.primary + '80' },
});
