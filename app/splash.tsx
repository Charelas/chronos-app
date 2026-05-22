import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

const BRAND_PRIMARY = '#006684'; // primaryContainer - matches splash design
const BRAND_TEXT = '#ffffff';
const BRAND_TEXT_DIM = 'rgba(255,255,255,0.4)';
const BRAND_TEXT_MID = 'rgba(255,255,255,0.6)';
const BRAND_LINE = 'rgba(255,255,255,0.2)';

export default function SplashScreen() {
  const { isOnboarded, loading } = useApp();
  const router = useRouter();

  // Animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(16)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation — always plays regardless of loading state
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(footerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(lineWidth, { toValue: 48, duration: 500, useNativeDriver: false }),
      ]),
    ]).start();
  }, []); // run once on mount

  // R-UX-001: guard ref prevents double-navigation if useEffect re-fires
  const hasNavigated = useRef(false);

  // BUG-001 fix: navigation only triggers AFTER loading is done.
  // Minimum display time = 2400ms, but if loading takes longer we wait for it.
  useEffect(() => {
    if (loading || isOnboarded === null) return; // still loading — wait
    if (hasNavigated.current) return; // already navigated, prevent double-fire

    const timer = setTimeout(() => {
      hasNavigated.current = true;
      if (isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [loading, isOnboarded]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_PRIMARY} />

      {/* Tonal depth overlay — matches the border overlay from the HTML */}
      <View style={styles.tonalOverlay} pointerEvents="none" />

      {/* ── Center branding ── */}
      <View style={styles.centerContent}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          // Invert to white (tint trick on the logo)
          // tintColor={BRAND_TEXT}
          />
        </Animated.View>

        {/* Brand typography */}
        <Animated.View
          style={[
            styles.brandTextContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>CHRONOS BALANCE</Text>
          <Animated.Text style={[styles.brandSubtitle, { opacity: subtitleOpacity }]}>
            Architectural Time Management
          </Animated.Text>
        </Animated.View>
      </View>

      {/* ── Footer ── */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <Animated.View style={[styles.footerLine, { width: lineWidth }]} />
        <Text style={styles.footerText}>V. 1.0.0 — EST. 2024</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_PRIMARY,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 64,
    paddingBottom: 64,
  },
  // Subtle border-based tonal overlay (matches mix-blend-overlay in HTML)
  tonalOverlay: {
    position: 'absolute',
    inset: 0,
    top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 24,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  logoContainer: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 74,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    padding: 16,
  },
  logo: {
    width: 108,
    height: 108,
  },
  brandTextContainer: {
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    letterSpacing: 6,
    color: BRAND_TEXT,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    letterSpacing: 3.5,
    color: BRAND_TEXT_MID,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  footerLine: {
    height: 1,
    backgroundColor: BRAND_LINE,
  },
  footerText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 10,
    letterSpacing: 2.5,
    color: BRAND_TEXT_DIM,
    textTransform: 'uppercase',
  },
});
