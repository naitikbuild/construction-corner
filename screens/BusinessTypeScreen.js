import { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { injectFonts } from '../theme/typography';
import { BLUE, CONCRETE_BORDER, CONCRETE_TEXT } from '../constants/colors';

const BUSINESS_TYPES = [
  {
    key: 'solo_worker',
    profileType: 'worker',
    emoji: '👷',
    label: 'Solo Worker',
    sub: 'Individual skilled worker - Mason, Electrician, Plumber etc',
  },
  {
    key: 'freelancer',
    profileType: 'professional',
    emoji: '🏛️',
    label: 'Freelancer',
    sub: 'Solo professional - Architect, Engineer, Interior Designer',
  },
  {
    key: 'contractor',
    profileType: 'contractor',
    emoji: '👷‍♂️',
    label: 'Sub Contractor',
    sub: 'Individual contractor with a small crew - Civil, Electrical, Plumbing',
  },
];

export default function BusinessTypeScreen({ navigation, route }) {
  const redirectTo = route?.params?.redirectTo ?? null;
  // Scoped to when this screen is actually focused (not just mounted) so it
  // can't be intercepted by — or itself linger and intercept for — another
  // screen's hardware-back listener left over deeper in the stack.
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        navigation.goBack();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [navigation])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>What's your{'\n'}business type?</Text>
          <Text style={styles.sub}>Select your role to personalize your experience</Text>
        </View>

        {BUSINESS_TYPES.map(type => (
          <TouchableOpacity
            key={type.key}
            style={styles.card}
            onPress={() => navigation.push('Login', { role: type.key, profileType: type.profileType, redirectTo })}
            activeOpacity={0.82}
          >
            <Text style={styles.cardEmoji}>{type.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{type.label}</Text>
              <Text style={styles.cardSub}>{type.sub}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.termsText}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = injectFonts({
  container: { flex: 1, backgroundColor: '#fff' },

  backBtn: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: BLUE },

  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  header: { marginBottom: 36, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: '900', color: '#111', lineHeight: 34, marginBottom: 6 },
  sub: { fontSize: 13, color: CONCRETE_TEXT, lineHeight: 20 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: CONCRETE_BORDER,
    padding: 24,
    marginBottom: 16,
    gap: 16,
  },
  cardEmoji: { fontSize: 44, width: 54, textAlign: 'center' },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 4 },
  cardSub: { fontSize: 13, color: CONCRETE_TEXT, lineHeight: 19 },
  arrow: { fontSize: 28, color: BLUE, fontWeight: '300', lineHeight: 32 },

  termsText: { fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 18, marginTop: 8 },
  termsLink: { color: BLUE, fontWeight: '700' },
});
