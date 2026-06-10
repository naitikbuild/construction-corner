import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Linking, Alert,
} from 'react-native';

const BLUE = '#FF6B2B';
const ORANGE = '#FF6B2B';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '100';

const features = [
  { icon: '🔍', text: 'Find verified contractors, professionals & suppliers' },
  { icon: '✅', text: 'Verified Work System with CC Score' },
  { icon: '💬', text: 'Real-time messaging with construction network' },
  { icon: '📋', text: 'Post and find construction jobs' },
  { icon: '🏗️', text: 'Material marketplace with live pricing' },
  { icon: '📚', text: 'Construction courses and certifications' },
];

const stats = [
  { value: '50,000+', label: 'Registered Users' },
  { value: '15,000+', label: 'Verified Professionals' },
  { value: '₹10 Cr+', label: 'Work Verified' },
  { value: '25+', label: 'Cities Covered' },
];

export default function AboutScreen({ navigation }) {
  const openLink = (url) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open the link. Please try again.')
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.appIcon}>
            <Text style={{ fontSize: 52 }}>🏗️</Text>
          </View>
          <Text style={styles.appName}>Construction Corner</Text>
          <Text style={styles.appTagline}>India's #1 Construction Network</Text>
          <View style={styles.versionRow}>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>Version {APP_VERSION}</Text>
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>Build {BUILD_NUMBER}</Text>
            </View>
          </View>
          <Text style={styles.madeInIndia}>Made with ❤️ in India 🇮🇳</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Mission */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardBody}>
            Construction Corner was built to digitize and empower India's ₹15 lakh crore construction
            industry. We connect 50+ million construction workers, professionals, businesses, and material
            suppliers on one trusted platform — creating transparent, verified, and fair opportunities for everyone.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What We Offer</Text>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Get in Touch</Text>

          <TouchableOpacity style={styles.contactRow} onPress={() => openLink('mailto:support@constructioncorner.in')}>
            <View style={styles.contactIcon}><Text style={{ fontSize: 20 }}>📧</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactValue}>support@constructioncorner.in</Text>
            </View>
            <Text style={styles.contactArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} onPress={() => openLink('https://wa.me/919876543210')}>
            <View style={styles.contactIcon}><Text style={{ fontSize: 20 }}>💬</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>WhatsApp Support</Text>
              <Text style={styles.contactValue}>+91 98765 43210</Text>
            </View>
            <Text style={styles.contactArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} onPress={() => openLink('https://constructioncorner.in')}>
            <View style={styles.contactIcon}><Text style={{ fontSize: 20 }}>🌐</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>constructioncorner.in</Text>
            </View>
            <Text style={styles.contactArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal</Text>
          <TouchableOpacity style={styles.legalRow} onPress={() => navigation.navigate('Privacy')}>
            <Text style={styles.legalIcon}>🛡️</Text>
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Text style={styles.legalArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalRow} onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.legalIcon}>📜</Text>
            <Text style={styles.legalText}>Terms of Service</Text>
            <Text style={styles.legalArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 Construction Corner India Pvt. Ltd.{'\n'}
            All rights reserved.{'\n'}
            CIN: U45400GJ2026PTC000001
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, fontWeight: '700', color: '#FF6B2B' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  scroll: { flex: 1 },

  hero: {
    backgroundColor: '#FFFFFF', alignItems: 'center',
    paddingVertical: 32, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  appIcon: {
    width: 100, height: 100, borderRadius: 24,
    backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, shadowColor: '#FF6B2B', shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  appTagline: { fontSize: 14, color: '#666666', fontWeight: '600', marginBottom: 14 },
  versionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  versionBadge: {
    backgroundColor: '#FFF3E0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FFE0C4',
  },
  versionText: { fontSize: 12, fontWeight: '700', color: BLUE },
  madeInIndia: { fontSize: 13, color: '#888', fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: ORANGE, marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '600', textAlign: 'center' },

  card: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EFEFEF',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  cardBody: { fontSize: 13, color: '#555', lineHeight: 21 },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureIcon: { fontSize: 18, width: 28 },
  featureText: { flex: 1, fontSize: 13, color: '#444', fontWeight: '500' },

  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  contactIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 2 },
  contactValue: { fontSize: 13, color: BLUE, fontWeight: '700' },
  contactArrow: { fontSize: 20, color: '#CCC' },

  legalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  legalIcon: { fontSize: 18 },
  legalText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  legalArrow: { fontSize: 20, color: '#CCC' },

  footer: { marginHorizontal: 16, marginTop: 20, alignItems: 'center', paddingVertical: 16 },
  footerText: { fontSize: 11, color: '#999', textAlign: 'center', lineHeight: 18 },
});
