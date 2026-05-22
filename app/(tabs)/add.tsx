import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { formatDuration, formatBalance, getCategoryBalanceSign } from '../../utils/storage';

type Category = 'Work' | 'Overtime' | 'Personal' | 'Meeting' | 'Education';

export default function AddEntryScreen() {
  const { addEntry, totalBalance, weeklyHours, settings, timer } = useApp();
  const router = useRouter();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('17');
  const [endMin, setEndMin] = useState('30');
  const [category, setCategory] = useState<Category>('Work');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const startTimeStr = `${startHour.padStart(2, '0')}:${startMin.padStart(2, '0')}`;
  const endTimeStr = `${endHour.padStart(2, '0')}:${endMin.padStart(2, '0')}`;

  const durationMinutes = (() => {
    const s = parseInt(startHour || '0') * 60 + parseInt(startMin || '0');
    const e = parseInt(endHour || '0') * 60 + parseInt(endMin || '0');
    return Math.max(0, e - s);
  })();

  // BUG-005 fix: use canonical getCategoryBalanceSign
  const balanceHours = (() => {
    const hours = durationMinutes / 60;
    return getCategoryBalanceSign(category) * hours;
  })();

  const categories: { name: Category; icon: string }[] = [
    { name: 'Work', icon: 'code' },
    { name: 'Overtime', icon: 'trending-up' },
    { name: 'Personal', icon: 'coffee' },
    { name: 'Meeting', icon: 'groups' },
    { name: 'Education', icon: 'school' },
  ];

  const handleSave = async () => {
    // UX-002: warn if timer is currently running
    if (timer.isRunning) {
      Alert.alert(
        'Timer is Active',
        `You have an active session for "${timer.currentTask}". Stop the timer first, or continue to add a separate manual entry.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Anyway', onPress: () => doSave() },
        ]
      );
      return;
    }
    doSave();
  };

  const doSave = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe what you were focused on.');
      return;
    }
    if (durationMinutes <= 0) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    setSaving(true);
    try {
      await addEntry({
        date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        category,
        description: description.trim(),
        durationMinutes,
        balanceHours,
      });
      Alert.alert(
        'Entry Saved',
        `Logged ${formatDuration(durationMinutes)} of "${description.trim()}" (${formatBalance(balanceHours)} hrs)`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)') }]
      );
      setDescription('');
    } catch (err) {
      Alert.alert('Error', 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  const setToday = () => setDate(new Date().toISOString().split('T')[0]);

  const formatDisplayDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  // UX-004: block future dates
  const shiftDate = (days: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    if (d > new Date()) return; // do not allow future dates
    setDate(d.toISOString().split('T')[0]);
  };

  // UX-001: auto-pad time inputs on blur
  const padTime = (val: string, max: number, setter: (v: string) => void) => {
    const n = parseInt(val || '0');
    const clamped = Math.min(Math.max(0, n), max);
    setter(clamped.toString().padStart(2, '0'));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color={Colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Entry</Text>
        </View>
        <View style={styles.avatar}>
          <Image
            source={require('../../assets/images/avatar.png')}
            style={styles.avatarImg}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>SESSION CONCEPT</Text>
          <Text style={styles.heroTitle}>Capture your{'\n'}flow.</Text>
          <Text style={styles.heroDesc}>
            Precision in tracking leads to architectural calm. Log your hours to maintain the perfect balance.
          </Text>

          {/* Current Balance Chip */}
          <View style={styles.balanceChip}>
            <MaterialIcons name="schedule" size={20} color={Colors.primary} />
            <View>
              <Text style={styles.balanceChipLabel}>CURRENT BALANCE</Text>
              <Text style={styles.balanceChipValue}>{formatBalance(totalBalance)} hrs</Text>
            </View>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formCard}>
          {/* Entry Date */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>ENTRY DATE</Text>
            <TouchableOpacity onPress={setToday}>
              <Text style={styles.formAction}>Today</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateRow}>
            <TouchableOpacity onPress={() => shiftDate(-1)}>
              <MaterialIcons name="chevron-left" size={28} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
            <Text style={styles.formValue}>{formatDisplayDate(date)}</Text>
            <TouchableOpacity onPress={() => shiftDate(1)}>
              <MaterialIcons name="chevron-right" size={28} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <View style={styles.formDivider} />

          {/* Category */}
          <Text style={[styles.formLabel, { marginTop: 16 }]}>CATEGORY</Text>
          <View style={styles.categoryRow}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.name}
                style={[styles.categoryChip, category === cat.name && styles.categoryActive]}
                onPress={() => setCategory(cat.name)}
              >
                <MaterialIcons
                  name={cat.icon as any}
                  size={16}
                  color={category === cat.name ? Colors.onPrimary : Colors.onSurface}
                />
                <Text style={[styles.categoryText, category === cat.name && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Live Preview */}
          <View style={styles.previewCard}>
            <View>
              <Text style={styles.previewLabel}>DURATION PREVIEW</Text>
              <Text style={styles.previewValue}>{formatDuration(durationMinutes)}</Text>
            </View>
            <View style={styles.previewRight}>
              <Text style={styles.previewLabel}>BALANCE IMPACT</Text>
              <Text style={[styles.previewBalance, { color: balanceHours >= 0 ? Colors.primary : Colors.error }]}>
                {formatBalance(balanceHours)} hrs
              </Text>
            </View>
          </View>

          {/* Start Time */}
          <Text style={[styles.formLabel, { marginTop: 16 }]}>START TIME</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={styles.timeInput}
              value={startHour}
              onChangeText={t => { if (/^\d{0,2}$/.test(t) && Number(t) < 24) setStartHour(t); }}
              onBlur={() => padTime(startHour, 23, setStartHour)}
              keyboardType="numeric"
              maxLength={2}
              placeholder="09"
              placeholderTextColor={Colors.outline}
            />
            <Text style={styles.timeSep}>:</Text>
            <TextInput
              style={styles.timeInput}
              value={startMin}
              onChangeText={t => { if (/^\d{0,2}$/.test(t) && Number(t) < 60) setStartMin(t); }}
              onBlur={() => padTime(startMin, 59, setStartMin)}
              keyboardType="numeric"
              maxLength={2}
              placeholder="00"
              placeholderTextColor={Colors.outline}
            />
            <MaterialIcons name="schedule" size={20} color={Colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
          </View>
          <View style={styles.formDivider} />

          {/* End Time */}
          <Text style={[styles.formLabel, { marginTop: 16 }]}>END TIME</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={styles.timeInput}
              value={endHour}
              onChangeText={t => { if (/^\d{0,2}$/.test(t) && Number(t) < 24) setEndHour(t); }}
              onBlur={() => padTime(endHour, 23, setEndHour)}
              keyboardType="numeric"
              maxLength={2}
              placeholder="17"
              placeholderTextColor={Colors.outline}
            />
            <Text style={styles.timeSep}>:</Text>
            <TextInput
              style={styles.timeInput}
              value={endMin}
              onChangeText={t => { if (/^\d{0,2}$/.test(t) && Number(t) < 60) setEndMin(t); }}
              onBlur={() => padTime(endMin, 59, setEndMin)}
              keyboardType="numeric"
              maxLength={2}
              placeholder="30"
              placeholderTextColor={Colors.outline}
            />
            <MaterialIcons name="schedule" size={20} color={Colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
          </View>
          <View style={styles.formDivider} />

          {/* Task Description */}
          <Text style={[styles.formLabel, { marginTop: 16 }]}>TASK DESCRIPTION</Text>
          <TextInput
            style={styles.descInput}
            placeholder="What were you focused on?"
            placeholderTextColor={Colors.outline}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <View style={styles.formDivider} />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Entry'}</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimary} />
        </TouchableOpacity>

        {/* Weekly Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>THIS WEEK SO FAR</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weeklyHours.toFixed(1)}h</Text>
              <Text style={styles.summarySub}>Logged</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{settings.weeklyCommitment}h</Text>
              <Text style={styles.summarySub}>Target</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: (weeklyHours - settings.weeklyCommitment) >= 0 ? Colors.primary : Colors.error }]}>
                {formatBalance(weeklyHours - settings.weeklyCommitment)}
              </Text>
              <Text style={styles.summarySub}>Delta</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 56 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface },
  avatar: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surfaceContainerHigh },
  avatarImg: { width: '100%', height: '100%' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  heroCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 28, marginTop: 12 },
  heroLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  heroTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 32, color: Colors.primary, marginTop: 8, letterSpacing: -1, lineHeight: 38 },
  heroDesc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22, marginTop: 12 },
  balanceChip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surfaceContainerLowest, borderRadius: 50, paddingHorizontal: 20, paddingVertical: 14, marginTop: 20, borderWidth: 0.5, borderColor: Colors.outlineVariant + '25' },
  balanceChipLabel: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 2, color: Colors.onSurfaceVariant },
  balanceChipValue: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.onSurface, marginTop: 1 },
  formCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 24, marginTop: 16 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant },
  formAction: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  formValue: { fontFamily: Fonts.body, fontSize: 20, color: Colors.onSurface },
  formDivider: { height: 1, backgroundColor: Colors.outlineVariant + '40' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 16 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 10 },
  categoryActive: { backgroundColor: Colors.primary },
  categoryText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.onSurface },
  categoryTextActive: { color: Colors.onPrimary },
  previewCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surfaceContainerLow, borderRadius: 12, padding: 16, marginBottom: 4 },
  previewLabel: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 2, color: Colors.onSurfaceVariant },
  previewValue: { fontFamily: Fonts.headline, fontSize: 20, color: Colors.primary, marginTop: 2 },
  previewRight: { alignItems: 'flex-end' },
  previewBalance: { fontFamily: Fonts.headline, fontSize: 20, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  timeInput: { fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: Colors.onSurface, width: 50, textAlign: 'center', padding: 4, backgroundColor: Colors.surfaceContainerLow, borderRadius: 8 },
  timeSep: { fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: Colors.onSurfaceVariant, marginHorizontal: 4 },
  descInput: { fontFamily: Fonts.body, fontSize: 16, color: Colors.onSurface, paddingVertical: 14, minHeight: 60, textAlignVertical: 'top' },
  saveBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18, marginTop: 24 },
  saveBtnText: { fontFamily: Fonts.headlineExtraBold, fontSize: 16, color: Colors.onPrimary },
  summaryCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 20, marginTop: 16 },
  summaryLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 22, color: Colors.onSurface },
  summarySub: { fontFamily: Fonts.body, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: Colors.outlineVariant + '40' },
});
