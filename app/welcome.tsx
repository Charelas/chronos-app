import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  TextInput, Animated, Keyboard, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const STEP_COUNT = 3;

export default function WelcomeScreen() {
  const { completeOnboarding, updateSettings } = useApp();
  const router = useRouter();

  const [step, setStep] = useState(0); // 0=intro, 1=name, 2=target
  const [userName, setUserName] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(40);
  const [saving, setSaving] = useState(false);

  const slideX = useRef(new Animated.Value(0)).current;

  const animateToNext = (nextStep: number) => {
    Animated.sequence([
      Animated.timing(slideX, { toValue: -30, duration: 150, useNativeDriver: true }),
      Animated.timing(slideX, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    setStep(nextStep);
  };

  const adjustTarget = (delta: number) => {
    setWeeklyTarget(prev => Math.max(10, Math.min(80, prev + delta)));
  };

  const handleFinish = async () => {
    Keyboard.dismiss();
    setSaving(true);
    await updateSettings({
      userName: userName.trim() || 'Chronos User',
      weeklyCommitment: weeklyTarget,
      monthlyCap: weeklyTarget * 4,
    });
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Glow accents */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.topBar}>
          <Text style={styles.brandName}>Chronos Balance</Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Step indicators */}
        <View style={styles.stepRow}>
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[styles.stepDot, i <= step && styles.stepDotActive, i === step && styles.stepDotCurrent]}
            />
          ))}
        </View>

        {/* Step content */}
        <Animated.View style={[styles.stepContent, { transform: [{ translateX: slideX }] }]}>

          {/* ── Step 0: Intro ── */}
          {step === 0 && (
            <View style={styles.introStep}>
              <View style={styles.illustrationContainer}>
                <View style={styles.illustrationInner}>
                  <View style={styles.hourglassOuter}>
                    <View style={styles.hourglassInner}>
                      <MaterialIcons name="hourglass-empty" size={56} color={Colors.primary} />
                    </View>
                  </View>
                  <View style={styles.verticalRule} />
                  <View style={styles.statusCards}>
                    <View style={styles.statusCard}>
                      <Text style={styles.statusLabel}>STATUS</Text>
                      <Text style={styles.statusValue}>Equilibrium Reached</Text>
                    </View>
                    <View style={styles.statusCard}>
                      <Text style={styles.statusLabel}>PHILOSOPHY</Text>
                      <Text style={styles.statusValue}>The Balanced Chronograph</Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.tagline}>INTRODUCING A NEW CADENCE</Text>
              <Text style={styles.headline}>
                Time is not just measured;{'\n'}
                <Text style={styles.headlineItalic}>it is orchestrated.</Text>
              </Text>
              <Text style={styles.description}>
                Move beyond rigid data entry. Experience an editorial approach to productivity — architectural calm, intentional balance.
              </Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={() => animateToNext(1)}>
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 1: Name ── */}
          {step === 1 && (
            <View style={styles.formStep}>
              <View style={styles.stepIcon}>
                <MaterialIcons name="person" size={32} color={Colors.primaryFixed} />
              </View>
              <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
              <Text style={styles.stepTitle}>What should we{'\n'}call you?</Text>
              <Text style={styles.stepDesc}>
                Your name personalises your AI balance insights and dashboard greetings.
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>YOUR NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Julian Sterling"
                  placeholderTextColor={Colors.primaryFixed + '60'}
                  value={userName}
                  onChangeText={setUserName}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => animateToNext(2)}
                />
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => animateToNext(0)}>
                  <MaterialIcons name="arrow-back" size={20} color={Colors.primaryFixed} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => animateToNext(2)}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Step 2: Weekly Target ── */}
          {step === 2 && (
            <View style={styles.formStep}>
              <View style={styles.stepIcon}>
                <MaterialIcons name="schedule" size={32} color={Colors.primaryFixed} />
              </View>
              <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
              <Text style={styles.stepTitle}>Set your weekly{'\n'}commitment.</Text>
              <Text style={styles.stepDesc}>
                This calibrates your balance dashboard. You can always adjust it in Settings.
              </Text>

              <View style={styles.stepperWrapper}>
                <Text style={styles.stepperLabel}>WEEKLY HOURS TARGET</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustTarget(-5)}>
                    <MaterialIcons name="remove" size={24} color={Colors.primaryFixed} />
                  </TouchableOpacity>
                  <View style={styles.stepperValue}>
                    <Text style={styles.stepperNum}>{weeklyTarget}</Text>
                    <Text style={styles.stepperUnit}>hrs / week</Text>
                  </View>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustTarget(5)}>
                    <MaterialIcons name="add" size={24} color={Colors.primaryFixed} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.stepperHint}>
                  {weeklyTarget <= 20 ? 'Part-time' : weeklyTarget <= 35 ? 'Reduced hours' : weeklyTarget <= 45 ? 'Standard full-time' : 'Extended commitment'}
                </Text>
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => animateToNext(1)}>
                  <MaterialIcons name="arrow-back" size={20} color={Colors.primaryFixed} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
                  onPress={handleFinish}
                  disabled={saving}
                >
                  <Text style={styles.primaryBtnText}>{saving ? 'Setting up...' : 'Enter the Chronograph'}</Text>
                  <MaterialIcons name="check" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>V. 1.0.0 — EST. 2024</Text>
          <View style={styles.footerLine} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  safeArea: { flex: 1, paddingHorizontal: 28 },
  glowTopRight: {
    position: 'absolute', top: -80, right: -80,
    width: width * 0.6, height: width * 0.6,
    borderRadius: width * 0.3, backgroundColor: Colors.primaryContainer, opacity: 0.2,
  },
  glowBottomLeft: {
    position: 'absolute', bottom: -80, left: -80,
    width: width * 0.6, height: width * 0.6,
    borderRadius: width * 0.3, backgroundColor: Colors.primaryFixed, opacity: 0.1,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  brandName: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.primaryFixed, letterSpacing: -0.5 },
  skipText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primaryFixed + 'aa' },
  stepRow: { flexDirection: 'row', gap: 6, marginTop: 20, marginBottom: 8 },
  stepDot: { height: 4, flex: 1, borderRadius: 2, backgroundColor: Colors.primaryFixed + '30' },
  stepDotActive: { backgroundColor: Colors.primaryFixed + '60' },
  stepDotCurrent: { backgroundColor: Colors.primaryFixed },
  stepContent: { flex: 1 },
  // Intro step
  introStep: { flex: 1, justifyContent: 'center', gap: 16 },
  illustrationContainer: {
    backgroundColor: Colors.primaryContainer + '50',
    borderRadius: 100, paddingVertical: 28, paddingHorizontal: 20,
    borderWidth: 0.5, borderColor: Colors.primaryFixed + '15',
  },
  illustrationInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  hourglassOuter: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderStyle: 'dashed', borderColor: Colors.primaryFixed + '40',
    justifyContent: 'center', alignItems: 'center',
  },
  hourglassInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  verticalRule: { width: 1, height: 72, backgroundColor: Colors.primaryFixed + '20' },
  statusCards: { gap: 8 },
  statusCard: {
    backgroundColor: Colors.primaryFixed + '15', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 0.5, borderColor: Colors.primaryFixed + '20',
  },
  statusLabel: { fontFamily: Fonts.labelBold, fontSize: 8, letterSpacing: 2.5, color: Colors.primaryFixed },
  statusValue: { fontFamily: Fonts.headline, fontSize: 13, color: Colors.onPrimary, marginTop: 2 },
  tagline: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 3.5, color: Colors.primaryFixed + 'cc' },
  headline: {
    fontFamily: Fonts.headlineExtraBold, fontSize: 30, color: Colors.onPrimary,
    lineHeight: 36, letterSpacing: -1.5,
  },
  headlineItalic: { fontFamily: Fonts.headlineRegular, fontStyle: 'italic', color: Colors.primaryFixedDim },
  description: { fontFamily: Fonts.body, fontSize: 14, color: Colors.primaryFixed + 'cc', lineHeight: 22 },
  primaryBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontFamily: Fonts.headlineExtraBold, fontSize: 15, color: Colors.primary },
  // Form step
  formStep: { flex: 1, justifyContent: 'center', gap: 16 },
  stepIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryContainer + '50',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primaryFixed + '20',
  },
  stepLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.primaryFixed + 'aa' },
  stepTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 30, color: Colors.onPrimary, lineHeight: 36, letterSpacing: -1 },
  stepDesc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.primaryFixed + 'cc', lineHeight: 22 },
  // Name input
  inputWrapper: { gap: 8 },
  inputLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.primaryFixed + 'aa' },
  input: {
    fontFamily: Fonts.headline, fontSize: 20, color: Colors.onPrimary,
    backgroundColor: Colors.primaryContainer + '40',
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16,
    borderWidth: 1, borderColor: Colors.primaryFixed + '25',
  },
  // Stepper
  stepperWrapper: { gap: 10 },
  stepperLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.primaryFixed + 'aa' },
  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primaryContainer + '40',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.primaryFixed + '25',
  },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryFixed + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  stepperValue: { alignItems: 'center' },
  stepperNum: { fontFamily: Fonts.headlineExtraBold, fontSize: 48, color: Colors.onPrimary, letterSpacing: -3, lineHeight: 54 },
  stepperUnit: { fontFamily: Fonts.body, fontSize: 13, color: Colors.primaryFixed + 'cc', marginTop: -4 },
  stepperHint: { fontFamily: Fonts.body, fontSize: 12, color: Colors.primaryFixed + '90', textAlign: 'center' },
  // Navigation
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.primaryFixed + '18',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primaryFixed + '25',
  },
  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, opacity: 0.3 },
  footerLine: { flex: 1, height: 1, backgroundColor: Colors.primaryFixed },
  footerText: { fontFamily: Fonts.label, fontSize: 9, letterSpacing: 2, color: Colors.primaryFixed },
});
