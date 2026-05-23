import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { formatDuration } from '../../utils/storage';

export default function DashboardScreen() {
  const { entries, settings, timer, elapsed, totalBalance, weeklyHours, monthlyHours, startTimer, stopTimer } = useApp();
  const router = useRouter();
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskCategory, setTaskCategory] = useState('Work');

  // ── Animated balance counter ─────────────────────────────────────────
  const animatedBalance = useRef(new Animated.Value(totalBalance)).current;
  const prevBalance = useRef(totalBalance);
  const [displayBalance, setDisplayBalance] = useState(totalBalance);
  const [displaySign, setDisplaySign] = useState(totalBalance >= 0 ? '+' : '');

  // Sync listener → state (drives the displayed number during animation)
  useEffect(() => {
    const listenerId = animatedBalance.addListener(({ value }) => {
      setDisplayBalance(value);
    });
    return () => animatedBalance.removeListener(listenerId);
  }, []);

  useEffect(() => {
    const from = prevBalance.current;
    const to = totalBalance;
    if (Math.abs(from - to) < 0.001) return; // no meaningful change

    // Set sign early when going positive (feels more responsive)
    if (to >= 0) setDisplaySign('+');

    animatedBalance.setValue(from);
    Animated.timing(animatedBalance, {
      toValue: to,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setDisplaySign(to >= 0 ? '+' : '');
      setDisplayBalance(to);
      prevBalance.current = to;
    });
  }, [totalBalance]);

  // ── Pulse animation on the active timer dot ──────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!timer.isRunning) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [timer.isRunning]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!taskName.trim()) {
      Alert.alert('Task Required', 'Please enter what you\'re working on.');
      return;
    }
    await startTimer(taskName.trim(), taskCategory);
    setShowTimerModal(false);
    setTaskName('');
  };

  const handleStopTimer = async () => {
    const entry = await stopTimer();
    if (entry) {
      Alert.alert('Session Saved', `Logged ${formatDuration(entry.durationMinutes)} for "${entry.description}"`);
    }
  };

  // R-CS-002: wrap weekly chart data in useMemo — only recompute when entries change
  const { weeklyData, maxHeight } = useMemo(() => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyData = days.map((day, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dayStr = dayDate.toISOString().split('T')[0];
      const dayEntries = entries.filter(e => e.date === dayStr);
      const hours = dayEntries.reduce((sum, e) => sum + e.durationMinutes / 60, 0);
      const isToday = i === now.getDay();
      return { day, hours, height: Math.max(hours * 10, 4), active: isToday };
    });

    const maxHeight = Math.max(...weeklyData.map(d => d.height), 1);
    return { weeklyData, maxHeight };
  }, [entries]);

  const days = weeklyData.map(d => d.day); // keep days accessible for chart labels

  const recentEntries = entries.slice(0, 3);
  const monthlyGoal = Math.min((monthlyHours / settings.monthlyCap) * 100, 100);

  const categoryColors: Record<string, { bg: string; text: string }> = {
    Work: { bg: Colors.secondaryFixed, text: Colors.onSurfaceVariant },
    Meeting: { bg: Colors.tertiaryFixed, text: '#2d1600' },
    Education: { bg: Colors.primaryFixed, text: '#001f2a' },
    Personal: { bg: Colors.errorContainer, text: Colors.error },
    Overtime: { bg: Colors.primaryContainer + '40', text: Colors.primary },
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/analytics')}>
            <MaterialIcons name="bar-chart" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View>
            {settings.userName ? (
              <>
                <Text style={styles.headerGreeting}>
                  {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
                </Text>
                <Text style={styles.headerTitle}>{settings.userName}</Text>
              </>
            ) : (
              <Text style={styles.headerTitle}>Balanced Chronograph</Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => router.push('/team_balance')}>
          <Image
            source={require('../../assets/images/avatar.png')}
            style={styles.avatarImg}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Balance Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>AVAILABLE TIME CREDIT</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroNumberWrap}>
              <Text style={[styles.heroSign, displayBalance < 0 && { color: Colors.error }]}>
                {displayBalance >= 0 ? '+' : '−'}
              </Text>
              <Text
                style={[
                  styles.heroNumber,
                  displayBalance < 0 && { color: Colors.error },
                ]}
              >
                {Math.abs(displayBalance).toFixed(1)}
              </Text>
            </View>
            <Text style={styles.heroUnit}>HOURS</Text>
          </View>
          <Text style={styles.heroDescription}>
            {totalBalance >= 0
              ? "Your work-life equilibrium is currently positive. You've accrued enough time for a half-day break this week."
              : "Your balance is in deficit. Consider logging more focused work sessions to equalize."}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => timer.isRunning ? handleStopTimer() : setShowTimerModal(true)}
          >
            <MaterialIcons
              name={timer.isRunning ? 'stop-circle' : 'play-circle-filled'}
              size={36}
              color={Colors.onPrimary}
            />
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionLabel}>{timer.isRunning ? 'ACTIVE' : 'SESSION'}</Text>
              <Text style={styles.actionTitle}>{timer.isRunning ? 'Stop Timer' : 'Start Timer'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push('/(tabs)/add')}
          >
            <MaterialIcons name="edit-calendar" size={36} color={Colors.primary} />
            <View style={styles.actionTextBlock}>
              <Text style={[styles.actionLabel, { color: Colors.secondary }]}>RECORD</Text>
              <Text style={[styles.actionTitle, { color: Colors.onSurface }]}>Manual Entry</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Weekly Trend Chart */}
        <TouchableOpacity style={styles.chartCard} onPress={() => router.push('/analytics')}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weekly Trend</Text>
            <MaterialIcons name="more-horiz" size={24} color={Colors.secondary} />
          </View>
          <View style={styles.chartBars}>
            {weeklyData.map((item, i) => (
              <View key={i} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(item.height / maxHeight) * 100}%`,
                      backgroundColor: item.active ? Colors.primary : Colors.secondaryContainer,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.chartLabels}>
            {weeklyData.map((item, i) => (
              <Text key={i} style={styles.chartLabel}>{item.day}</Text>
            ))}
          </View>
        </TouchableOpacity>

        {/* Current Focus (shows when timer running) */}
        {timer.isRunning && (
          <View style={styles.focusCard}>
            <View style={styles.focusLeft}>
              <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
              <View>
                <Text style={styles.focusLabel}>CURRENT FOCUS</Text>
                <Text style={styles.focusTitle} numberOfLines={1}>{timer.currentTask}</Text>
              </View>
            </View>
            <Text style={styles.focusTime}>{formatElapsed(elapsed)}</Text>
          </View>
        )}

        {/* Monthly Goal */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Monthly Goal</Text>
            <Text style={styles.goalPercent}>{Math.round(monthlyGoal)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${monthlyGoal}%` as any }]} />
          </View>
          <Text style={styles.goalSub}>{Math.round(monthlyHours)} of {settings.monthlyCap} hours completed</Text>
        </View>

        {/* Recent History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="hourglass-empty" size={32} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>No entries yet. Start a timer or add a manual entry!</Text>
          </View>
        ) : (
          recentEntries.map((item, i) => {
            const catStyle = categoryColors[item.category] || categoryColors.Work;
            return (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</Text>
                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.historySub}>{item.category} • {formatDuration(item.durationMinutes)}</Text>
                </View>
                <View style={styles.historyRight}>
                  <View style={[styles.historyTag, { backgroundColor: catStyle.bg }]}>
                    <Text style={[styles.historyTagText, { color: catStyle.text }]}>{item.category.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.historyTime, { color: item.balanceHours >= 0 ? Colors.primary : Colors.error }]}>
                    {item.balanceHours >= 0 ? '+' : ''}{item.balanceHours.toFixed(1)}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Active Tracker */}
      {timer.isRunning && (
        <View style={styles.floatingBar}>
          <View style={styles.floatingIcon}>
            <MaterialIcons name="timer" size={24} color={Colors.primary} />
          </View>
          <View style={styles.floatingContent}>
            <Text style={styles.floatingLabel}>ACTIVE TRACKER</Text>
            <Text style={styles.floatingTitle} numberOfLines={1}>{timer.currentTask}</Text>
          </View>
          <View style={styles.floatingRight}>
            <Text style={styles.floatingTime}>{formatElapsed(elapsed).substring(0, 5)}</Text>
            <TouchableOpacity onPress={handleStopTimer}>
              <Text style={styles.floatingStop}>STOP</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Start Timer Modal */}
      <Modal visible={showTimerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start a Focus Session</Text>
            <Text style={styles.modalLabel}>WHAT ARE YOU WORKING ON?</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. System Architecture Review"
              placeholderTextColor={Colors.outline}
              value={taskName}
              onChangeText={setTaskName}
            />
            <Text style={styles.modalLabel}>CATEGORY</Text>
            <View style={styles.modalCategories}>
              {['Work', 'Meeting', 'Personal', 'Education'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.modalCat, taskCategory === cat && styles.modalCatActive]}
                  onPress={() => setTaskCategory(cat)}
                >
                  <Text style={[styles.modalCatText, taskCategory === cat && styles.modalCatTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowTimerModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalStart} onPress={handleStartTimer}>
                <MaterialIcons name="play-arrow" size={20} color={Colors.onPrimary} />
                <Text style={styles.modalStartText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 56, backgroundColor: Colors.surfaceContainerLowest },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerGreeting: { fontFamily: Fonts.body, fontSize: 10, letterSpacing: 0.5, color: Colors.onSurfaceVariant },
  headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 16, color: Colors.primary, letterSpacing: -0.3 },
  avatar: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surfaceContainerHigh },
  avatarImg: { width: '100%', height: '100%' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  heroCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 28, marginTop: 16, borderWidth: 0.5, borderColor: Colors.outlineVariant + '25' },
  heroLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 1.5, color: Colors.onSurfaceVariant },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  heroNumberWrap: { flexDirection: 'row', alignItems: 'baseline' },
  heroSign: { fontFamily: Fonts.headlineExtraBold, fontSize: 36, color: Colors.primary, letterSpacing: -1, lineHeight: 76, marginRight: 2 },
  heroNumber: { fontFamily: Fonts.headlineExtraBold, fontSize: 72, color: Colors.primary, letterSpacing: -3, lineHeight: 76 },
  heroUnit: { fontFamily: Fonts.headline, fontSize: 20, color: Colors.secondary, alignSelf: 'flex-end', marginBottom: 8 },
  heroDescription: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22, marginTop: 12, maxWidth: 300 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  primaryAction: { flex: 1, backgroundColor: Colors.primary, borderRadius: 16, padding: 20, justifyContent: 'space-between', minHeight: 140 },
  secondaryAction: { flex: 1, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 16, padding: 20, justifyContent: 'space-between', minHeight: 140 },
  actionTextBlock: { marginTop: 40 },
  actionLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, letterSpacing: 2, color: Colors.onPrimary + 'cc', textTransform: 'uppercase' },
  actionTitle: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onPrimary, marginTop: 2 },
  chartCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 24, marginTop: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  chartTitle: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, gap: 8 },
  barWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 8 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  chartLabel: { flex: 1, textAlign: 'center', fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 2, color: Colors.outline, textTransform: 'uppercase' },
  focusCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 20, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 0.5, borderColor: Colors.outlineVariant + '25' },
  focusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4caf50' },
  focusLabel: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 2, color: Colors.secondary, textTransform: 'uppercase' },
  focusTitle: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface, marginTop: 2, maxWidth: 160 },
  focusTime: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.primary, letterSpacing: 1 },
  goalCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 20, marginTop: 12 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalTitle: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface },
  goalPercent: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.primary },
  progressBar: { height: 6, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  goalSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 22, color: Colors.onSurface },
  seeAll: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center' },
  historyItem: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: Colors.outlineVariant + '25' },
  historyDate: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.secondary, width: 50 },
  historyContent: { flex: 1, marginLeft: 8 },
  historyTitle: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface },
  historySub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 4 },
  historyRight: { alignItems: 'flex-end', gap: 6 },
  historyTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  historyTagText: { fontFamily: Fonts.labelBold, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase' },
  historyTime: { fontFamily: Fonts.headline, fontSize: 15 },
  floatingBar: { position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#191c1e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 8, borderWidth: 0.5, borderColor: Colors.outlineVariant + '25' },
  floatingIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primaryFixed, justifyContent: 'center', alignItems: 'center' },
  floatingContent: { flex: 1 },
  floatingLabel: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 2, color: Colors.secondary, textTransform: 'uppercase' },
  floatingTitle: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface, marginTop: 2 },
  floatingRight: { alignItems: 'flex-end' },
  floatingTime: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.primary, letterSpacing: 1 },
  floatingStop: { fontFamily: Fonts.labelBold, fontSize: 11, color: Colors.error, letterSpacing: -0.5, marginTop: 2 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surfaceContainerLowest, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  modalTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 22, color: Colors.onSurface, marginBottom: 20 },
  modalLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, marginBottom: 8, marginTop: 16 },
  modalInput: { fontFamily: Fonts.body, fontSize: 16, color: Colors.onSurface, backgroundColor: Colors.surfaceContainerLow, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 0.5, borderColor: Colors.outlineVariant + '40' },
  modalCategories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalCat: { backgroundColor: Colors.surfaceContainerHigh, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 10 },
  modalCatActive: { backgroundColor: Colors.primary },
  modalCatText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onSurface },
  modalCatTextActive: { color: Colors.onPrimary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  modalCancel: { flex: 1, borderRadius: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: Colors.surfaceContainerHigh },
  modalCancelText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
  modalStart: { flex: 2, borderRadius: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  modalStartText: { fontFamily: Fonts.headlineExtraBold, fontSize: 14, color: Colors.onPrimary },
});
