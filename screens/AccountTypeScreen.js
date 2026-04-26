import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView,
} from 'react-native';
import { BLUE, CONCRETE_BORDER, CONCRETE_TEXT } from '../constants/colors';

export default function AccountTypeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.logoEmoji}>🏗️</Text>
        <Text style={styles.title}>Welcome to{'\n'}Construction Corner</Text>
        <Text style={styles.sub}>India's #1 Construction Network</Text>
      </View>

      <View style={styles.cards}>
        {/* Personal */}
        <TouchableOpacity
          style={[styles.card, styles.cardPersonal]}
          onPress={() => navigation.navigate('Login', { accountType: 'personal' })}
          activeOpacity={0.82}
        >
          <Text style={styles.cardEmoji}>🏠</Text>
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: '#111' }]}>Personal</Text>
            <Text style={[styles.cardSub, { color: CONCRETE_TEXT }]}>
              Find professionals, book services, buy materials
            </Text>
          </View>
          <Text style={[styles.cardArrow, { color: BLUE }]}>›</Text>
        </TouchableOpacity>

        {/* Business */}
        <TouchableOpacity
          style={[styles.card, styles.cardBusiness]}
          onPress={() => navigation.navigate('BusinessType')}
          activeOpacity={0.82}
        >
          <Text style={styles.cardEmoji}>🏢</Text>
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Business</Text>
            <Text style={[styles.cardSub, { color: 'rgba(255,255,255,0.85)' }]}>
              Grow your business on India's #1 construction network
            </Text>
          </View>
          <Text style={[styles.cardArrow, { color: 'rgba(255,255,255,0.9)' }]}>›</Text>
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },

  header: { paddingTop: 32, marginBottom: 36, alignItems: 'center' },
  logoEmoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '900', color: '#111', lineHeight: 34, marginBottom: 6, textAlign: 'center' },
  sub: { fontSize: 13, color: CONCRETE_TEXT, fontWeight: '600', textAlign: 'center' },

  cards: { gap: 16, flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  cardPersonal: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: CONCRETE_BORDER,
  },
  cardBusiness: {
    backgroundColor: BLUE,
  },
  cardEmoji: { fontSize: 44 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  cardSub: { fontSize: 13, lineHeight: 19 },
  cardArrow: { fontSize: 28, fontWeight: '300', lineHeight: 32 },

  termsText: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 18,
    paddingBottom: 24,
    marginTop: 'auto',
  },
  termsLink: { color: BLUE, fontWeight: '700' },
});
