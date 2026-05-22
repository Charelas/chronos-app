import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { completeOnboarding } = useApp();
  const router = useRouter();

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>Chronos Balance</Text>
        </View>

        {/* Illustration Area */}
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

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.tagline}>INTRODUCING A NEW CADENCE</Text>
          <Text style={styles.headline}>
            Time is not just measured;{'\n'}
            <Text style={styles.headlineItalic}>it is orchestrated.</Text>
          </Text>
          <Text style={styles.description}>
            Move beyond the rigid grids of data entry. Experience a high-end editorial approach to productivity that prioritizes architectural calm and intentional asymmetry.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGetStarted}>
            <Text style={styles.primaryBtnText}>Set Your Targets</Text>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.secondaryBtnText}>THE BALANCED CHRONOGRAPH · V. 1.0.0</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>V. 1.0.0 — EST. 2024</Text>
          <View style={styles.footerLine} />
        </View>
      </SafeAreaView>

      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  safeArea: { flex: 1, alignItems: 'center', paddingHorizontal: 28 },
  header: { marginTop: 16, alignItems: 'center' },
  brandName: { fontFamily: Fonts.headlineExtraBold, fontSize: 22, color: Colors.primaryFixed, letterSpacing: -0.5 },
  illustrationContainer: {
    width: '100%', marginTop: 28,
    backgroundColor: Colors.primaryContainer + '50',
    borderRadius: 100, paddingVertical: 32, paddingHorizontal: 24,
    borderWidth: 0.5, borderColor: Colors.primaryFixed + '15',
  },
  illustrationInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  hourglassOuter: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 3, borderStyle: 'dashed', borderColor: Colors.primaryFixed + '40',
    justifyContent: 'center', alignItems: 'center',
  },
  hourglassInner: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  verticalRule: { width: 1, height: 80, backgroundColor: Colors.primaryFixed + '20' },
  statusCards: { gap: 10 },
  statusCard: {
    backgroundColor: Colors.primaryFixed + '15', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 0.5, borderColor: Colors.primaryFixed + '20',
  },
  statusLabel: { fontFamily: Fonts.labelBold, fontSize: 9, letterSpacing: 2.5, color: Colors.primaryFixed },
  statusValue: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onPrimary, marginTop: 3 },
  content: { alignItems: 'center', marginTop: 32 },
  tagline: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 3.5, color: Colors.primaryFixed + 'cc' },
  headline: {
    fontFamily: Fonts.headlineExtraBold, fontSize: 32, color: Colors.onPrimary,
    textAlign: 'center', lineHeight: 38, letterSpacing: -1.5, marginTop: 16,
  },
  headlineItalic: { fontFamily: Fonts.headlineRegular, fontStyle: 'italic', color: Colors.primaryFixedDim },
  description: { fontFamily: Fonts.body, fontSize: 15, color: Colors.primaryFixed + 'cc', textAlign: 'center', lineHeight: 24, marginTop: 16 },
  ctaSection: { width: '100%', alignItems: 'center', marginTop: 32, gap: 16 },
  primaryBtn: {
    width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, paddingVertical: 18,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  primaryBtnText: { fontFamily: Fonts.headlineExtraBold, fontSize: 16, color: Colors.primary },
  secondaryBtnText: { fontFamily: Fonts.labelBold, fontSize: 11, letterSpacing: 2.5, color: Colors.primaryFixed + '90' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 'auto', marginBottom: 16, opacity: 0.3 },
  footerLine: { width: 28, height: 1, backgroundColor: Colors.primaryFixed },
  footerText: { fontFamily: Fonts.label, fontSize: 9, letterSpacing: 2, color: Colors.primaryFixed },
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
});
