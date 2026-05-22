import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, DimensionValue } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useRouter } from 'expo-router';
import { formatDuration } from '../utils/storage';

export default function ProjectDetailsScreen() {
  const { entries, monthlyHours, settings, weeklyHours } = useApp();
  const router = useRouter();

  const totalHours = entries.reduce((s, e) => s + e.durationMinutes / 60, 0);
  const progressPct = Math.min(100, Math.round((monthlyHours / settings.monthlyCap) * 100));

  // Category distribution for allocation bars
  const categories: Record<string, number> = {};
  entries.forEach(e => { categories[e.category] = (categories[e.category] || 0) + e.durationMinutes / 60; });
  const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = Math.max(...catEntries.map(c => c[1]), 1);

  // Recent entries as backlog tasks
  const recentTasks = entries.slice(0, 5);

  const velocityPerWeek = entries.length > 0
    ? (entries.length / Math.max(1, Math.ceil((Date.now() - new Date(entries[entries.length - 1].date).getTime()) / (7 * 86400000)))).toFixed(1)
    : '0';

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
        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: Colors.primary }]}>
            <Text style={[styles.tagText, { color: Colors.onPrimary }]}>ACTIVE PROJECT</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: Colors.surfaceContainerHigh }]}>
            <Text style={[styles.tagText, { color: Colors.onSurface }]}>PHASE {Math.ceil(monthlyHours / 40).toString().padStart(2, '0')}</Text>
          </View>
        </View>
        <Text style={styles.projectTitle}>System{'\n'}Architecture</Text>
        <Text style={styles.projectDesc}>
          Structural definition and scaling strategies for the core transaction engine. {entries.length} entries tracked across {Object.keys(categories).length} categories.
        </Text>

        {/* Total Time Balance */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.metricLabel}>TOTAL TIME BALANCE</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricBig}>{totalHours.toFixed(1)}</Text>
                <Text style={styles.metricUnit}>hrs</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/analytics')}>
              <MaterialIcons name="analytics" size={28} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as DimensionValue }]} />
          </View>
          <Text style={styles.progressLabel}>{progressPct}%</Text>
        </View>

        {/* Resource Allocation  */}
        <View style={styles.card}>
          <View style={styles.allocHeader}>
            <MaterialIcons name="auto-awesome" size={16} color={Colors.onSurfaceVariant} />
            <Text style={styles.allocLabel}>RESOURCE ALLOCATION</Text>
          </View>
          <View style={styles.allocBars}>
            {catEntries.map(([cat, hours], i) => (
              <View key={cat} style={styles.allocBarGroup}>
                <View style={[styles.allocBar, {
                  height: `${(hours / maxCat) * 100}%` as DimensionValue,
                  backgroundColor: i === 0 ? Colors.primary : Colors.primaryFixed,
                }]} />
                <Text style={styles.allocBarLabel}>{cat.substring(0, 3).toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sprint Velocity */}
        <View style={[styles.metricCard, { backgroundColor: Colors.tertiaryFixed + '40' }]}>
          <View style={styles.metricCardHeader}>
            <MaterialIcons name="speed" size={18} color={Colors.tertiary} />
            <Text style={[styles.metricLabel, { color: Colors.tertiary }]}>SPRINT VELOCITY</Text>
          </View>
          <Text style={[styles.metricBig, { color: Colors.onSurface }]}>{velocityPerWeek}</Text>
          <Text style={styles.metricSub}>entries / week</Text>
        </View>

        {/* Team Load */}
        <View style={[styles.metricCard, { backgroundColor: Colors.primaryFixed + '30' }]}>
          <View style={styles.metricCardHeader}>
            <MaterialIcons name="groups" size={18} color={Colors.primary} />
            <Text style={[styles.metricLabel, { color: Colors.primary }]}>WEEKLY LOAD</Text>
          </View>
          <Text style={[styles.metricBig, { color: Colors.onSurface }]}>{weeklyHours.toFixed(1)}h</Text>
          <Text style={styles.metricSub}>of {settings.weeklyCommitment}h target</Text>
        </View>

        {/* Project Backlog */}
        <View style={styles.backlogSection}>
          <View style={styles.backlogHeader}>
            <View>
              <Text style={styles.backlogTitle}>Project{'\n'}Backlog</Text>
              <Text style={styles.backlogDesc}>Recent logged tasks</Text>
            </View>
            <TouchableOpacity style={styles.addTaskBtn} onPress={() => router.push('/(tabs)/add')}>
              <MaterialIcons name="add" size={20} color={Colors.onPrimary} />
              <Text style={styles.addTaskBtnText}>Add{'\n'}Task</Text>
            </TouchableOpacity>
          </View>

          {recentTasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View>
                <Text style={styles.taskStatus}>LOGGED</Text>
                <Text style={styles.taskTime}>{task.startTime}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.taskTitle} numberOfLines={1}>{task.description}</Text>
                <View style={styles.taskTags}>
                  <View style={styles.taskTag}>
                    <MaterialIcons name="label" size={12} color={Colors.primary} />
                    <Text style={styles.taskTagText}>{task.category}</Text>
                  </View>
                  <Text style={styles.taskTagText}>{formatDuration(task.durationMinutes)}</Text>
                </View>
              </View>
            </View>
          ))}
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
  projectTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 40, color: Colors.onSurface, letterSpacing: -2, marginTop: 12, lineHeight: 44 },
  projectDesc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22, marginTop: 12 },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metricLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  metricBig: { fontFamily: Fonts.headlineExtraBold, fontSize: 36, color: Colors.onSurface, letterSpacing: -2 },
  metricUnit: { fontFamily: Fonts.body, fontSize: 16, color: Colors.onSurfaceVariant },
  progressBar: { height: 6, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden', marginTop: 16 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.onSurfaceVariant, textAlign: 'right', marginTop: 6 },
  allocHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  allocLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  allocBars: { flexDirection: 'row', justifyContent: 'space-between', height: 120, marginTop: 16, gap: 8 },
  allocBarGroup: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  allocBar: { width: '80%', borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 8 },
  allocBarLabel: { fontFamily: Fonts.labelBold, fontSize: 8, letterSpacing: 1, color: Colors.outline, marginTop: 6 },
  metricCard: { borderRadius: 16, padding: 24, marginTop: 12 },
  metricCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  metricSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  backlogSection: { marginTop: 28 },
  backlogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  backlogTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: Colors.onSurface, letterSpacing: -1, lineHeight: 32 },
  backlogDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 6 },
  addTaskBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', gap: 6 },
  addTaskBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.onPrimary, textAlign: 'center', lineHeight: 16 },
  taskItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: Colors.outlineVariant + '25' },
  taskStatus: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 1.5, color: Colors.onSurfaceVariant },
  taskTime: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface, marginTop: 2 },
  taskTitle: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.onSurface },
  taskTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  taskTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskTagText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.onSurfaceVariant },
});
