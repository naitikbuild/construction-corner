import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, BackHandler, Alert,
} from 'react-native';

import { BLUE, BLUE_DIM } from '../constants/colors';

const SLIDES = [
  {
    emoji: '👷',
    title: 'Find Contractors\n& Professionals',
    sub: 'Connect with verified architects, engineers, contractors and 50+ construction professionals across India.',
  },
  {
    emoji: '🏭',
    title: 'Source Materials\nat Best Price',
    sub: 'Compare prices from 1000+ verified suppliers for cement, steel, tiles, RMC and all construction materials.',
  },
  {
    emoji: '📈',
    title: 'Grow Your Business\n& Network',
    sub: "Post tenders, find jobs, take courses and be part of India's construction revolution.",
  },
];

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 0) { setStep(s => s - 1); return true; }
      Alert.alert('Exit?', 'Exit Construction Corner?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    });
    return () => sub.remove();
  }, [step]);

  function next() {
    if (step < SLIDES.length - 1) setStep(s => s + 1);
    else navigation.replace('AccountType');
  }

  const slide = SLIDES[step];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('AccountType')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.illustration}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
      </View>

      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.sub}>{slide.sub}</Text>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={next}>
        <Text style={styles.nextBtnText}>
          {step < SLIDES.length - 1 ? 'Next →' : "Let's Go! 🚀"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center' },
  skipBtn: { alignSelf: 'flex-end', marginTop: 8, padding: 4 },
  skipText: { fontSize: 14, fontWeight: '700', color: '#aaa' },
  illustration: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 110 },
  title: { fontSize: 28, fontWeight: '900', color: '#111', textAlign: 'center', lineHeight: 36, marginBottom: 14 },
  sub: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 8 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  dotActive: { width: 24, backgroundColor: BLUE },
  nextBtn: { width: '100%', backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  nextBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },
});
