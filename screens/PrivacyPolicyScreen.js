import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';

const BLUE = '#FF6B2B';

const sections = [
  {
    title: '1. Information We Collect',
    body: `When you register on Construction Corner, we collect the following information:

• Name, phone number, and email address
• Professional details (designation, company, experience, skills)
• Location information (city, state)
• Profile photos and work photos you choose to upload
• Messages exchanged on the platform
• Verified work records and transaction information
• Device information and usage data

We collect this information to provide you with our services and improve your experience on the platform.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your personal information to:

• Create and manage your profile on Construction Corner
• Connect you with other construction professionals, workers, and businesses
• Process verified work records and maintain your CC Score
• Send you relevant job alerts and professional opportunities
• Improve our platform and develop new features
• Ensure platform safety and prevent fraud
• Comply with applicable laws and regulations

We will never sell your personal data to third parties.`,
  },
  {
    title: '3. Information Sharing',
    body: `Your profile information is visible to other registered users of Construction Corner as per your privacy settings.

We may share your information with:
• Other users as part of the core service (profile viewing, chat)
• Service providers who help us operate the platform (Firebase, Expo)
• Law enforcement when required by applicable Indian law

We do not share your private messages or transaction details with third parties.`,
  },
  {
    title: '4. Data Storage & Security',
    body: `Your data is stored securely on Google Firebase servers, which comply with international security standards.

We implement:
• Encrypted data transmission (HTTPS/TLS)
• Secure authentication via Firebase Auth
• Regular security reviews
• Access controls limiting who can view your data

While we take all reasonable precautions, no internet transmission is 100% secure. Please use strong passwords and do not share your OTP or credentials with anyone.`,
  },
  {
    title: '5. Your Rights (DPDP Act 2023)',
    body: `Under India's Digital Personal Data Protection Act 2023, you have the right to:

• Access the personal data we hold about you
• Correct inaccurate or incomplete data
• Erase your personal data ("Right to be Forgotten")
• Withdraw consent for data processing
• Nominate a representative for your data rights

To exercise any of these rights, contact us at: privacy@constructioncorner.in`,
  },
  {
    title: '6. Cookies & Tracking',
    body: `Construction Corner mobile app does not use browser cookies. We use Firebase Analytics to understand how users interact with our app. This data is anonymised and used only for improving our services.

You can opt out of analytics tracking in the app Settings under Privacy Settings.`,
  },
  {
    title: '7. Children\'s Privacy',
    body: `Construction Corner is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately at support@constructioncorner.in and we will delete the information.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes through:

• In-app notifications
• Email (if you have provided one)
• A notice on our app

Your continued use of Construction Corner after changes are posted constitutes acceptance of the revised policy.`,
  },
  {
    title: '9. Contact Us',
    body: `For privacy-related queries, complaints, or to exercise your data rights:

Email: privacy@constructioncorner.in
WhatsApp: +91 98765 43210
Address: Construction Corner India Pvt. Ltd.
Ahmedabad, Gujarat - 380001

We aim to respond to all privacy requests within 30 days.`,
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBand}>
          <Text style={styles.heroIcon}>🛡️</Text>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSub}>Last updated: June 2026  ·  Effective: June 1, 2026</Text>
          <Text style={styles.heroBody}>
            Construction Corner ("Company", "we", "our", or "us") is committed to protecting your personal
            information and your right to privacy. This Privacy Policy applies to all users of our mobile
            application and complies with India's Digital Personal Data Protection (DPDP) Act, 2023.
          </Text>
        </View>

        {sections.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Construction Corner India Pvt. Ltd.{'\n'}
            Ahmedabad, Gujarat · Made in India 🇮🇳
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
  scroll: { flex: 1, backgroundColor: '#F5F5F0' },
  heroBand: {
    backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#EFEFEF', alignItems: 'center',
  },
  heroIcon: { fontSize: 48, marginBottom: 10 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  heroSub: { fontSize: 11, color: '#888', marginBottom: 12 },
  heroBody: { fontSize: 13, color: '#555', lineHeight: 20, textAlign: 'center' },
  section: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#EFEFEF',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },
  sectionBody: { fontSize: 13, color: '#555', lineHeight: 21 },
  footer: {
    marginHorizontal: 16, marginTop: 8, padding: 16,
    backgroundColor: '#F5F5F0', borderRadius: 12,
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 20 },
});
