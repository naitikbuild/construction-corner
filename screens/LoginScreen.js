import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, BackHandler, Alert, SafeAreaView,
} from 'react-native';
import { useState, useEffect } from 'react';

import { BLUE, BLUE_LIGHT, BLUE_DIM } from '../constants/colors';

export default function LoginScreen({ navigation, route }) {
  // If opened from AccountTypeScreen with params, go straight to OTP login
  const accountTypeParam = route?.params?.accountType ?? null;
  const roleParam = route?.params?.role ?? null;
  const profileTypeParam = route?.params?.profileType ?? null;
  const [screen, setScreen] = useState((accountTypeParam || roleParam) ? 'login' : 'splash');
  const [accountType, setAccountType] = useState(accountTypeParam);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const onBack = () => {
      if (screen === 'login' && accountTypeParam) {
        navigation.goBack(); // back to AccountTypeScreen
        return true;
      }
      if (screen === 'login') {
        setScreen('accountType');
        setOtpSent(false); setOtp(''); setPhone('');
        return true;
      }
      if (screen === 'accountType') { setScreen('splash'); return true; }
      Alert.alert(
        'Exit App?',
        'Are you sure you want to exit Construction Corner?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ],
        { cancelable: true }
      );
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [screen]);

  // ─── SPLASH ──────────────────────────────────────────────────────────────────
  if (screen === 'splash') {
    return (
      <SafeAreaView style={styles.splash}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.splashLogoBox}>
          <Text style={styles.splashLogoEmoji}>🏗️</Text>
        </View>
        <Text style={styles.splashTitle}>Construction Corner</Text>
        <Text style={styles.splashTagline}>India's #1 Construction Network</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Onboarding')}>
          <Text style={styles.primaryBtnText}>Get Started →</Text>
        </TouchableOpacity>
        <Text style={styles.splashVersion}>v1.0.0 · Made in India 🇮🇳</Text>
      </SafeAreaView>
    );
  }

  // ─── ONBOARDING ──────────────────────────────────────────────────────────────
  const SLIDES = [
    {
      key: 'onboard1',
      emoji: '👷',
      title: 'Find Contractors\n& Professionals',
      sub: 'Connect with verified architects, engineers, contractors and 50+ construction professionals across India.',
      dot: 0,
      next: 'onboard2',
      nextLabel: 'Next →',
    },
    {
      key: 'onboard2',
      emoji: '🏭',
      title: 'Source Materials\nat Best Price',
      sub: 'Compare prices from 1000+ verified suppliers for cement, steel, tiles, RMC and all construction materials.',
      dot: 1,
      next: 'onboard3',
      nextLabel: 'Next →',
    },
    {
      key: 'onboard3',
      emoji: '📈',
      title: 'Grow Your Business\n& Network',
      sub: 'Post tenders, find jobs, take courses and be part of India\'s construction revolution.',
      dot: 2,
      next: 'accountType',
      nextLabel: "Let's Go! 🚀",
    },
  ];

  const slide = SLIDES.find(s => s.key === screen);
  if (slide) {
    return (
      <SafeAreaView style={styles.onboard}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <TouchableOpacity style={styles.skipBtn} onPress={() => setScreen('accountType')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.onboardIllustration}>
          <Text style={styles.onboardEmoji}>{slide.emoji}</Text>
        </View>

        <Text style={styles.onboardTitle}>{slide.title}</Text>
        <Text style={styles.onboardSub}>{slide.sub}</Text>

        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === slide.dot && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => setScreen(slide.next)}>
          <Text style={styles.primaryBtnText}>{slide.nextLabel}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── ACCOUNT TYPE SELECTION ───────────────────────────────────────────────
  if (screen === 'accountType') {
    return (
      <SafeAreaView style={styles.page}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>What are you{'\n'}looking for?</Text>
          <Text style={styles.pageSub}>Choose how you'd like to use Construction Corner</Text>
        </View>

        <View style={styles.accountCards}>
          {/* Personal Card */}
          <TouchableOpacity
            style={[
              styles.accountCard,
              styles.accountCardPersonal,
              accountType === 'personal' && styles.accountCardPersonalSelected,
            ]}
            onPress={() => setAccountType('personal')}
            activeOpacity={0.85}
          >
            <Text style={styles.accountCardEmoji}>🏠</Text>
            <Text style={[styles.accountCardTitle, { color: '#111' }]}>Personal</Text>
            <Text style={[styles.accountCardSub, { color: '#6B6560' }]}>
              Find professionals for all your construction needs
            </Text>
            {accountType === 'personal' && (
              <View style={styles.checkBadge}><Text style={styles.checkBadgeText}>✓</Text></View>
            )}
          </TouchableOpacity>

          {/* Business Card */}
          <TouchableOpacity
            style={[styles.accountCard, styles.accountCardBusiness]}
            onPress={() => setAccountType('business')}
            activeOpacity={0.85}
          >
            <Text style={styles.accountCardEmoji}>🏢</Text>
            <Text style={[styles.accountCardTitle, { color: '#fff' }]}>Business</Text>
            <Text style={[styles.accountCardSub, { color: 'rgba(255,255,255,0.8)' }]}>
              Grow your business and expand your network
            </Text>
            {accountType === 'business' && (
              <View style={[styles.checkBadge, { backgroundColor: '#fff' }]}>
                <Text style={[styles.checkBadgeText, { color: BLUE }]}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !accountType && styles.primaryBtnDisabled, styles.primaryBtnBottom]}
          disabled={!accountType}
          onPress={() => setScreen('login')}
        >
          <Text style={styles.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── LOGIN (MOBILE OTP) ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TouchableOpacity style={styles.backBtn} onPress={() => { setScreen('accountType'); setOtpSent(false); setOtp(''); setPhone(''); }}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.loginTop}>
        <Text style={styles.loginLogoEmoji}>🏗️</Text>
        <Text style={styles.pageTitle}>Enter Mobile{'\n'}Number</Text>
        <Text style={styles.pageSub}>We'll send you a one-time password to verify your number</Text>
      </View>

      {/* Phone Input */}
      <View style={styles.inputGroup}>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="Enter 10-digit number"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={t => { setPhone(t); if (otpSent) { setOtpSent(false); setOtp(''); } }}
          />
        </View>
      </View>

      {/* OTP Input */}
      {otpSent && (
        <View style={styles.inputGroup}>
          <Text style={styles.otpHint}>Enter the 6-digit OTP sent to +91 {phone}</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="— — — — — —"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            textAlign="center"
          />
          <Text style={styles.resendText}>Resend OTP in 30s</Text>
        </View>
      )}

      {/* Action Button */}
      {!otpSent ? (
        <TouchableOpacity
          style={[styles.primaryBtn, phone.length !== 10 && styles.primaryBtnDisabled]}
          disabled={phone.length !== 10}
          onPress={() => setOtpSent(true)}
        >
          <Text style={styles.primaryBtnText}>Send OTP</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.primaryBtn, otp.length !== 6 && styles.primaryBtnDisabled]}
          disabled={otp.length !== 6}
          onPress={() => {
            if (accountType === 'personal') {
              navigation.replace('Home');
            } else if (roleParam) {
              navigation.replace('EditProfile', { role: roleParam, profileType: profileTypeParam });
            } else {
              navigation.replace('BusinessType');
            }
          }}
        >
          <Text style={styles.primaryBtnText}>Verify & Continue ✓</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.termsText}>
        By continuing you agree to our{' '}
        <Text style={styles.termsLink}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── SHARED ──
  primaryBtn: {
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 12,
  },
  primaryBtnDisabled: { backgroundColor: BLUE_DIM },
  primaryBtnBottom: { marginTop: 'auto', marginBottom: 16 },
  primaryBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },

  // ── SPLASH ──
  splash: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashLogoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: BLUE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: BLUE,
  },
  splashLogoEmoji: { fontSize: 48 },
  splashTitle: { fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 8, textAlign: 'center' },
  splashTagline: { fontSize: 14, color: '#6B6560', fontWeight: '600', marginBottom: 48, textAlign: 'center' },
  splashVersion: { fontSize: 11, color: '#ccc', fontWeight: '600', marginTop: 24 },

  // ── ONBOARDING ──
  onboard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },
  skipBtn: { alignSelf: 'flex-end', marginTop: 8, padding: 4 },
  skipText: { fontSize: 14, fontWeight: '700', color: '#aaa' },
  onboardIllustration: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  onboardEmoji: { fontSize: 110 },
  onboardTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
  },
  onboardSub: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  dotActive: { width: 24, backgroundColor: BLUE },

  // ── PAGE (accountType + login) ──
  page: { flex: 1, backgroundColor: '#fff' },
  pageHeader: { paddingHorizontal: 24, paddingTop: 40, marginBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 8, lineHeight: 36 },
  pageSub: { fontSize: 14, color: '#6B6560', lineHeight: 21 },

  // ── ACCOUNT TYPE ──
  accountCards: { paddingHorizontal: 24, gap: 16 },
  accountCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    position: 'relative',
  },
  accountCardPersonal: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  accountCardPersonalSelected: {
    borderColor: BLUE,
    backgroundColor: BLUE_LIGHT,
  },
  accountCardBusiness: {
    backgroundColor: BLUE,
  },
  accountCardEmoji: { fontSize: 52, marginBottom: 12 },
  accountCardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  accountCardSub: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  checkBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },

  // ── LOGIN ──
  backBtn: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: BLUE },
  loginTop: { paddingHorizontal: 24, paddingTop: 16, marginBottom: 32 },
  loginLogoEmoji: { fontSize: 36, marginBottom: 16 },
  inputGroup: { paddingHorizontal: 24, marginBottom: 16 },
  phoneRow: { flexDirection: 'row', gap: 10 },
  countryCode: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  countryCodeText: { fontSize: 14, fontWeight: '700', color: '#111' },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    color: '#111',
  },
  otpHint: { fontSize: 12, color: '#6B6560', marginBottom: 10 },
  otpInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 26,
    fontWeight: '900',
    borderWidth: 2,
    borderColor: BLUE,
    color: '#111',
    letterSpacing: 10,
  },
  resendText: { fontSize: 12, color: BLUE, fontWeight: '700', marginTop: 8, textAlign: 'right' },
  termsText: { fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 18, marginTop: 20, paddingHorizontal: 24 },
  termsLink: { color: BLUE, fontWeight: '700' },
});
