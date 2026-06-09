import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, BackHandler, Alert, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { signInWithPhoneNumber, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from '../config/firebase';
import { getProfile } from '../services/userService';
import { BLUE, BLUE_LIGHT, BLUE_DIM } from '../constants/colors';

// Works with Firebase test phone numbers configured in Firebase console.
// For production builds, replace with expo-firebase-recaptcha.
const dummyRecaptcha = { type: 'recaptcha', verify: () => Promise.resolve('test') };

export default function LoginScreen({ navigation, route }) {
  const accountTypeParam = route?.params?.accountType ?? null;
  const roleParam = route?.params?.role ?? null;
  const profileTypeParam = route?.params?.profileType ?? null;
  const [screen, setScreen] = useState((accountTypeParam || roleParam) ? 'login' : 'splash');
  const [accountType, setAccountType] = useState(accountTypeParam);

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const confirmationRef = useRef(null);
  const timerRef = useRef(null);

  // Auth tab state
  const [authTab, setAuthTab] = useState('phone'); // 'phone' | 'email'

  // Email auth state
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Shared loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onBack = () => {
      if (screen === 'login' && accountTypeParam) { navigation.goBack(); return true; }
      if (screen === 'login') { setScreen('accountType'); setOtpSent(false); setOtp(''); setPhone(''); return true; }
      if (screen === 'accountType') { setScreen('splash'); return true; }
      Alert.alert(
        'Exit App?',
        'Are you sure you want to exit Construction Corner?',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() }],
        { cancelable: true }
      );
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [screen]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startResendTimer = () => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // ─── After auth: route based on profile state ─────────────────────────────
  const routeAfterAuth = async (uid, phoneNum = null) => {
    if (phoneNum) await AsyncStorage.setItem('phone', phoneNum);
    await AsyncStorage.setItem('uid', uid);
    const profile = await getProfile(uid);
    if (profile && profile.role) {
      navigation.replace('Home');
    } else if (roleParam) {
      navigation.replace('EditProfile', { role: roleParam, profileType: profileTypeParam, phone: phoneNum });
    } else {
      setScreen('accountType');
    }
  };

  // ─── Phone OTP handlers ───────────────────────────────────────────────────
  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, dummyRecaptcha);
      confirmationRef.current = confirmation;
      setOtpSent(true);
      startResendTimer();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send OTP. Check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmationRef.current) {
      Alert.alert('Error', 'Please request OTP first.');
      return;
    }
    setLoading(true);
    try {
      const result = await confirmationRef.current.confirm(otp);
      await routeAfterAuth(result.user.uid, phone);
    } catch (err) {
      Alert.alert('Invalid OTP', 'The code you entered is incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setOtp('');
    await handleSendOTP();
  };

  // ─── Email auth handler ───────────────────────────────────────────────────
  const handleEmailAuth = async (mode) => {
    if (!email.trim() || !emailPassword) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      let result;
      if (mode === 'signup') {
        result = await createUserWithEmailAndPassword(auth, email.trim(), emailPassword);
      } else {
        result = await signInWithEmailAndPassword(auth, email.trim(), emailPassword);
      }
      await routeAfterAuth(result.user.uid);
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use' ? 'This email is already registered. Try signing in.' :
        err.code === 'auth/user-not-found' ? 'No account found. Use Sign Up to create one.' :
        err.code === 'auth/wrong-password' ? 'Incorrect password. Please try again.' :
        err.code === 'auth/invalid-email' ? 'Invalid email address.' :
        err.code === 'auth/weak-password' ? 'Password must be at least 6 characters.' :
        err.message || 'Authentication failed.';
      Alert.alert('Auth Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Test mode handler ────────────────────────────────────────────────────
  const handleTestLogin = async () => {
    const fakeUid = 'test_user_' + Date.now();
    await AsyncStorage.setItem('uid', fakeUid);
    setScreen('accountType');
  };

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
    { key: 'onboard1', emoji: '👷', title: 'Find Contractors\n& Professionals', sub: 'Connect with verified architects, engineers, contractors and 50+ construction professionals across India.', dot: 0, next: 'onboard2', nextLabel: 'Next →' },
    { key: 'onboard2', emoji: '🏭', title: 'Source Materials\nat Best Price', sub: 'Compare prices from 1000+ verified suppliers for cement, steel, tiles, RMC and all construction materials.', dot: 1, next: 'onboard3', nextLabel: 'Next →' },
    { key: 'onboard3', emoji: '📈', title: 'Grow Your Business\n& Network', sub: 'Post tenders, find jobs, take courses and be part of India\'s construction revolution.', dot: 2, next: 'accountType', nextLabel: "Let's Go! 🚀" },
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
          <TouchableOpacity
            style={[styles.accountCard, styles.accountCardPersonal, accountType === 'personal' && styles.accountCardPersonalSelected]}
            onPress={() => setAccountType('personal')}
            activeOpacity={0.85}
          >
            <Text style={styles.accountCardEmoji}>🏠</Text>
            <Text style={[styles.accountCardTitle, { color: '#111' }]}>Personal</Text>
            <Text style={[styles.accountCardSub, { color: '#6B6560' }]}>Find professionals for all your construction needs</Text>
            {accountType === 'personal' && <View style={styles.checkBadge}><Text style={styles.checkBadgeText}>✓</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountCard, styles.accountCardBusiness]}
            onPress={() => setAccountType('business')}
            activeOpacity={0.85}
          >
            <Text style={styles.accountCardEmoji}>🏢</Text>
            <Text style={[styles.accountCardTitle, { color: '#fff' }]}>Business</Text>
            <Text style={[styles.accountCardSub, { color: 'rgba(255,255,255,0.8)' }]}>Grow your business and expand your network</Text>
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

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableOpacity style={styles.backBtn} onPress={() => { setScreen('accountType'); setOtpSent(false); setOtp(''); setPhone(''); }}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.loginTop}>
        <Text style={styles.loginLogoEmoji}>🏗️</Text>
        <Text style={styles.pageTitle}>Sign In</Text>
        <Text style={styles.pageSub}>Choose your preferred sign-in method</Text>
      </View>

      {/* Auth Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, authTab === 'phone' && styles.tabActive]}
          onPress={() => { setAuthTab('phone'); setOtpSent(false); setOtp(''); setPhone(''); }}
        >
          <Text style={[styles.tabText, authTab === 'phone' && styles.tabTextActive]}>📱 Phone OTP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, authTab === 'email' && styles.tabActive]}
          onPress={() => setAuthTab('email')}
        >
          <Text style={[styles.tabText, authTab === 'email' && styles.tabTextActive]}>✉️ Email</Text>
        </TouchableOpacity>
      </View>

      {/* ── Phone OTP Tab ── */}
      {authTab === 'phone' && (
        <>
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
                onChangeText={t => { setPhone(t); if (otpSent) { setOtpSent(false); setOtp(''); confirmationRef.current = null; } }}
                editable={!loading}
              />
            </View>
          </View>

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
                editable={!loading}
              />
              <TouchableOpacity onPress={handleResendOTP} disabled={resendTimer > 0}>
                <Text style={[styles.resendText, resendTimer > 0 && { color: '#aaa' }]}>
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!otpSent ? (
            <TouchableOpacity
              style={[styles.primaryBtn, (phone.length !== 10 || loading) && styles.primaryBtnDisabled]}
              disabled={phone.length !== 10 || loading}
              onPress={handleSendOTP}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send OTP</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, (otp.length !== 6 || loading) && styles.primaryBtnDisabled]}
              disabled={otp.length !== 6 || loading}
              onPress={handleVerifyOTP}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify & Continue ✓</Text>}
            </TouchableOpacity>
          )}
        </>
      )}

      {/* ── Email Tab ── */}
      {authTab === 'email' && (
        <>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.textInput}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.textInput}
              placeholder="Password (min 6 characters)"
              secureTextEntry
              value={emailPassword}
              onChangeText={setEmailPassword}
              editable={!loading}
            />
          </View>
          <View style={styles.emailBtnRow}>
            <TouchableOpacity
              style={[styles.emailBtn, styles.emailBtnOutline, loading && styles.primaryBtnDisabled]}
              disabled={loading}
              onPress={() => handleEmailAuth('signup')}
            >
              {loading ? <ActivityIndicator color={BLUE} /> : <Text style={styles.emailBtnOutlineText}>Sign Up</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emailBtn, styles.emailBtnFill, loading && styles.primaryBtnDisabled]}
              disabled={loading}
              onPress={() => handleEmailAuth('signin')}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.termsText}>
        By continuing you agree to our{' '}
        <Text style={styles.termsLink}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>

      {/* Test Mode */}
      <TouchableOpacity style={styles.testModeBtn} onPress={handleTestLogin}>
        <Text style={styles.testModeBtnText}>Skip Login (Test Mode)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  primaryBtn: { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginHorizontal: 24, marginTop: 12 },
  primaryBtnDisabled: { backgroundColor: BLUE_DIM },
  primaryBtnBottom: { marginTop: 'auto', marginBottom: 16 },
  primaryBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },

  splash: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  splashLogoBox: { width: 96, height: 96, borderRadius: 28, backgroundColor: BLUE_LIGHT, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: BLUE },
  splashLogoEmoji: { fontSize: 48 },
  splashTitle: { fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 8, textAlign: 'center' },
  splashTagline: { fontSize: 14, color: '#6B6560', fontWeight: '600', marginBottom: 48, textAlign: 'center' },
  splashVersion: { fontSize: 11, color: '#ccc', fontWeight: '600', marginTop: 24 },

  onboard: { flex: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center' },
  skipBtn: { alignSelf: 'flex-end', marginTop: 8, padding: 4 },
  skipText: { fontSize: 14, fontWeight: '700', color: '#aaa' },
  onboardIllustration: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  onboardEmoji: { fontSize: 110 },
  onboardTitle: { fontSize: 28, fontWeight: '900', color: '#111', textAlign: 'center', lineHeight: 36, marginBottom: 14 },
  onboardSub: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 8 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  dotActive: { width: 24, backgroundColor: BLUE },

  page: { flex: 1, backgroundColor: '#fff' },
  pageHeader: { paddingHorizontal: 24, paddingTop: 40, marginBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 8, lineHeight: 36 },
  pageSub: { fontSize: 14, color: '#6B6560', lineHeight: 21 },

  accountCards: { paddingHorizontal: 24, gap: 16 },
  accountCard: { borderRadius: 20, padding: 28, alignItems: 'center', position: 'relative' },
  accountCardPersonal: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#E0E0E0' },
  accountCardPersonalSelected: { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  accountCardBusiness: { backgroundColor: BLUE },
  accountCardEmoji: { fontSize: 52, marginBottom: 12 },
  accountCardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  accountCardSub: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  checkBadge: { position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: 11, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  checkBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },

  backBtn: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: BLUE },
  loginTop: { paddingHorizontal: 24, paddingTop: 16, marginBottom: 20 },
  loginLogoEmoji: { fontSize: 36, marginBottom: 16 },

  tabRow: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 20, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '700', color: '#aaa' },
  tabTextActive: { color: BLUE },

  inputGroup: { paddingHorizontal: 24, marginBottom: 12 },
  phoneRow: { flexDirection: 'row', gap: 10 },
  countryCode: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1.5, borderColor: '#E0E0E0' },
  countryCodeText: { fontSize: 14, fontWeight: '700', color: '#111' },
  phoneInput: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '700', borderWidth: 1.5, borderColor: '#E0E0E0', color: '#111' },
  textInput: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: '600', borderWidth: 1.5, borderColor: '#E0E0E0', color: '#111' },
  otpHint: { fontSize: 12, color: '#6B6560', marginBottom: 10 },
  otpInput: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 26, fontWeight: '900', borderWidth: 2, borderColor: BLUE, color: '#111', letterSpacing: 10 },
  resendText: { fontSize: 12, color: BLUE, fontWeight: '700', marginTop: 8, textAlign: 'right' },

  emailBtnRow: { flexDirection: 'row', marginHorizontal: 24, gap: 12, marginTop: 12 },
  emailBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  emailBtnOutline: { borderWidth: 2, borderColor: BLUE, backgroundColor: '#fff' },
  emailBtnFill: { backgroundColor: BLUE },
  emailBtnOutlineText: { fontSize: 16, fontWeight: '900', color: BLUE },

  termsText: { fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 18, marginTop: 20, paddingHorizontal: 24 },
  termsLink: { color: BLUE, fontWeight: '700' },

  testModeBtn: { alignSelf: 'center', marginTop: 16, marginBottom: 8, paddingVertical: 8, paddingHorizontal: 16 },
  testModeBtnText: { fontSize: 12, color: '#bbb', fontWeight: '600', textDecorationLine: 'underline' },
});
