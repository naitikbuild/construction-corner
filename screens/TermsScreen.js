import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using the Construction Corner mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our App.

Construction Corner India Pvt. Ltd. ("Company", "we", "us") operates the Construction Corner platform connecting construction professionals, workers, businesses, and material suppliers across India.`,
  },
  {
    title: '2. Eligibility',
    body: `You must be at least 18 years of age to use Construction Corner. By using the App, you represent and warrant that:

• You are at least 18 years old
• You have the legal capacity to enter into these Terms
• Your use of the App does not violate any applicable law or regulation
• All information you provide is accurate and truthful`,
  },
  {
    title: '3. User Accounts',
    body: `When you create an account, you agree to:

• Provide accurate, current, and complete information
• Maintain the security of your account credentials
• Promptly update any information that becomes outdated
• Not share your account with any third party
• Immediately notify us of any unauthorised use of your account

We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: '4. Verified Work System & CC Score',
    body: `The Construction Corner Verified Work system allows users to record and verify completed construction work. Key terms:

• Both parties (customer and service provider) must agree to the work record
• Work amounts must be accurate and reflect actual work performed
• False or fraudulent work records will result in immediate account termination
• The CC Score is calculated based on verified work, ratings, and platform activity
• CC Score is for informational purposes and does not constitute a financial rating

The 1% platform commission on verified work is paid by the service provider after work confirmation.`,
  },
  {
    title: '5. Prohibited Conduct',
    body: `You agree not to:

• Post false, misleading, or fraudulent information
• Impersonate another person or entity
• Use the platform for spam, harassment, or hate speech
• Post content that infringes intellectual property rights
• Attempt to hack, scrape, or disrupt our services
• Use the App for any illegal activity
• Solicit payments outside the platform to avoid commissions
• Create multiple accounts to manipulate the CC Score system

Violation of these terms may result in immediate account termination and legal action.`,
  },
  {
    title: '6. Content & Intellectual Property',
    body: `Construction Corner and its original content, features, and functionality are owned by Construction Corner India Pvt. Ltd. and are protected by Indian intellectual property laws.

By posting content on our platform (profile info, photos, reviews), you grant us a non-exclusive, royalty-free license to use, display, and distribute that content within the platform.

You retain ownership of your content but are responsible for ensuring you have the rights to post it.`,
  },
  {
    title: '7. Disclaimer of Warranties',
    body: `Construction Corner provides the platform as a marketplace to connect construction professionals. We do not:

• Verify the quality or accuracy of work performed
• Guarantee the professional qualifications of any user
• Provide any warranty on materials or services listed
• Act as an employer or contractor for any work done

All transactions and agreements between users are independent of Construction Corner. We are not liable for any disputes between users.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by Indian law, Construction Corner India Pvt. Ltd. shall not be liable for:

• Any indirect, incidental, or consequential damages
• Loss of profits or revenue arising from use of the platform
• Disputes between users of the platform
• Any construction defects or quality issues
• Unauthorised access to your account

Our maximum liability for any claim shall not exceed the amount paid by you to us in the 12 months preceding the claim.`,
  },
  {
    title: '9. Governing Law & Dispute Resolution',
    body: `These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Ahmedabad, Gujarat.

For disputes under ₹1,00,000, parties agree to first attempt resolution through our internal mediation process. Contact legal@constructioncorner.in to initiate mediation.`,
  },
  {
    title: '10. Changes to Terms',
    body: `We reserve the right to modify these Terms at any time. We will notify users of significant changes through in-app notifications at least 15 days before changes take effect.

Your continued use of the App after changes become effective constitutes your acceptance of the revised Terms.`,
  },
  {
    title: '11. Contact Information',
    body: `For questions about these Terms:

Email: legal@constructioncorner.in
WhatsApp: +91 98765 43210
Address: Construction Corner India Pvt. Ltd.
Ahmedabad, Gujarat - 380001, India

Grievance Officer (IT Act): Naitik Rathod
Email: grievance@constructioncorner.in`,
  },
];

export default function TermsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBand}>
          <Text style={styles.heroIcon}>📜</Text>
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <Text style={styles.heroSub}>Last updated: June 2026  ·  Effective: June 1, 2026</Text>
          <Text style={styles.heroBody}>
            Please read these Terms of Service carefully before using Construction Corner.
            These terms constitute a legally binding agreement between you and Construction Corner India Pvt. Ltd.
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
            By using Construction Corner, you agree to these Terms.{'\n'}
            Construction Corner India Pvt. Ltd. · Made in India 🇮🇳
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
    backgroundColor: '#F5F5F0', borderRadius: 12, alignItems: 'center',
  },
  footerText: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 20 },
});
