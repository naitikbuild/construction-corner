import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, useWindowDimensions, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../services/userService';
import { getTotalVerifiedAmount } from '../services/workService';
import { createChat } from '../services/chatService';
import { auth } from '../config/firebase';

// ─── Gradient Button ──────────────────────────────────────────────────────────
function GradBtn({ label, subLabel, onPress }) {
  return (
    <TouchableOpacity style={ss.gradWrap} onPress={onPress} activeOpacity={0.88}>
      <View style={ss.gradBg} pointerEvents="none">
        {['#833AB4', '#C13584', '#FD1D1D', '#F77737'].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <View style={ss.gradContent}>
        <Text style={ss.gradLabel}>{label}</Text>
        {subLabel ? <Text style={ss.gradSub}>{subLabel}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── CC Score Bar ─────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  return (
    <View style={ss.scorePad}>
      <View style={ss.scoreRow}>
        <Text style={ss.scoreLabel}>CC Trust Score</Text>
        <Text style={ss.scoreNum}>{score} / 100</Text>
      </View>
      <View style={ss.scoreTrack}>
        <View style={{ width: `${score}%`, height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden' }}>
          {['#F44336', '#FF9800', '#FFEB3B', '#8BC34A', '#4CAF50'].map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Sample data ─────────────────────────────────────────────────────────────
const PROFILE = {
  name: 'Mehta Construction Pvt Ltd',
  type: 'Civil & Structural Contractor',
  location: 'Navrangpura, Ahmedabad, Gujarat',
  logo: '🏢',
  score: 94,
  projectsValue: '₹120 Cr+',
  teamSize: 250,
  experience: '25 Yrs',
  verifiedAmt: '₹12,00,00,000',
  verifiedProjects: 85,
  about: 'Mehta Construction Pvt Ltd is an ISO 9001:2015 certified civil contractor specialising in residential complexes, commercial towers, and infrastructure projects. RERA registered, GST compliant, and trusted by 200+ clients across Gujarat.',
};

const HIGHLIGHTS = [
  { emoji: '🗂️', label: 'Portfolio', color: '#833AB4' },
  { emoji: '⭐', label: 'Reviews', color: '#FD1D1D' },
  { emoji: '👷', label: 'Team', color: '#F77737' },
  { emoji: '📜', label: 'Certs', color: '#4CAF50' },
  { emoji: '🏆', label: 'Awards', color: '#0EA5E9' },
];

const SERVICES = [
  { icon: '🏗️', name: 'RCC\nConstruction', price: '₹1800/sqft' },
  { icon: '🏢', name: 'Commercial\nBuilding', price: '₹2200/sqft' },
  { icon: '🏠', name: 'Residential\nComplex', price: '₹1600/sqft' },
  { icon: '🛣️', name: 'Infrastructure\nWork', price: 'On Quote' },
  { icon: '💧', name: 'Waterproofing', price: '₹120/sqft' },
  { icon: '🔩', name: 'Steel\nStructure', price: '₹180/kg' },
];

const TEAM = [
  { emoji: '👨‍💼', name: 'Rajesh Mehta', role: 'MD & Founder' },
  { emoji: '👷', name: 'Suresh Patel', role: 'Site Director' },
  { emoji: '📐', name: 'Priya Shah', role: 'Lead Architect' },
  { emoji: '📊', name: 'Amit Joshi', role: 'QS Manager' },
];

const PROJECTS = [
  { emoji: '🏢', name: 'Mehta Heights', location: 'Satellite, Ahmedabad', value: '₹45 Cr', year: '2023', status: 'Completed', bg: '#E3F2FD' },
  { emoji: '🏗️', name: 'SG Highway Mall', location: 'SG Highway, Ahmedabad', value: '₹32 Cr', year: '2022', status: 'Completed', bg: '#FFF3E0' },
  { emoji: '🏘️', name: 'Green Valley Residency', location: 'Bopal, Ahmedabad', value: '₹28 Cr', year: '2024', status: 'Ongoing', bg: '#E8F5E9' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function BusinessProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('Projects');
  const [loading, setLoading] = useState(true);
  const [liveProfile, setLiveProfile] = useState(null);
  const [verifiedAmt, setVerifiedAmt] = useState('');
  const [myUid, setMyUid] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const uid = viewUid || auth.currentUser?.uid;
      const me = await AsyncStorage.getItem('uid');
      setMyUid(me);
      if (!uid) { setLoading(false); return; }
      const [profile, totalAmt] = await Promise.all([getProfile(uid), getTotalVerifiedAmount(uid)]);
      if (profile) setLiveProfile(profile);
      setVerifiedAmt(totalAmt > 0 ? `₹${totalAmt.toLocaleString('en-IN')}` : '₹0');
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleChat = async () => {
    if (!viewUid || viewUid === myUid) return;
    try {
      const myName = await AsyncStorage.getItem('userName') || 'Me';
      const chatId = await createChat(
        { uid: myUid, name: myName },
        { uid: viewUid, name: liveProfile?.companyName || liveProfile?.name || 'Company' }
      );
      navigation.navigate('Chat', {
        conversation: {
          id: chatId,
          uid: viewUid,
          name: liveProfile?.companyName || liveProfile?.name || 'Company',
          role: liveProfile?.companyType || 'Construction Company',
          emoji: '🏢',
          avatarBg: '#E8F5E9',
          online: false,
        }
      });
    } catch (_) { Alert.alert('Error', 'Could not open chat.'); }
  };

  const display = {
    name: liveProfile?.companyName || liveProfile?.name || 'Add company name',
    type: liveProfile?.companyType || liveProfile?.designation || 'Add business type',
    location: [liveProfile?.city, liveProfile?.state].filter(Boolean).join(', ') || 'Add location',
    verified: verifiedAmt || '₹0',
  };

  if (loading) {
    return (
      <View style={[ss.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#C13584" />
        <Text style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Loading profile...</Text>
      </View>
    );
  }

  if (!liveProfile && !viewUid) {
    return (
      <View style={[ss.screen, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 52, marginBottom: 16 }}>🏢</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 8, textAlign: 'center' }}>Profile Incomplete</Text>
        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
          Please complete your company profile to appear in search results and attract clients.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#C13584', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 }}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Complete Profile →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={ss.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* HEADER */}
      <View style={ss.header}>
        <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()}>
          <Text style={ss.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={ss.headerTitle}>Company Profile</Text>
        <TouchableOpacity style={ss.moreBtn} onPress={() => Alert.alert('Options')}>
          <Text style={ss.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HERO CARD */}
        <View style={ss.heroCard}>
          <View style={ss.companyLogo}>
            <Text style={{ fontSize: 44 }}>{PROFILE.logo}</Text>
          </View>

          <Text style={ss.profileName}>{display.name}</Text>
          <View style={ss.typeBadgeWrap}>
            <View style={ss.typeBadge}>
              <Text style={ss.typeBadgeText}>{display.type}</Text>
            </View>
          </View>
          <Text style={ss.profileLoc}>📍 {display.location}</Text>

          <View style={ss.badgesRow}>
            <View style={[ss.badge, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
              <Text style={[ss.badgeText, { color: '#2E7D32' }]}>✓ GST Verified</Text>
            </View>
            <View style={[ss.badge, { backgroundColor: '#E3F2FD', borderColor: '#1E88E5' }]}>
              <Text style={[ss.badgeText, { color: '#1565C0' }]}>✓ RERA Registered</Text>
            </View>
            <View style={[ss.badge, { backgroundColor: '#FFF8E1', borderColor: '#F9A825' }]}>
              <Text style={[ss.badgeText, { color: '#F57F17' }]}>ISO 9001:2015</Text>
            </View>
          </View>
        </View>

        {/* STATS */}
        <View style={ss.statsCard}>
          {[
            { value: PROFILE.projectsValue, label: 'Projects Value' },
            { value: `${PROFILE.teamSize}+`, label: 'Team Size' },
            { value: PROFILE.experience, label: 'Experience' },
            { value: `${PROFILE.score}`, label: 'CC Score' },
          ].map((st, i) => (
            <View key={i} style={[ss.statItem, i < 3 && ss.statBorder]}>
              <Text style={ss.statVal}>{st.value}</Text>
              <Text style={ss.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* CC SCORE BAR */}
        <ScoreBar score={PROFILE.score} />

        {/* VERIFIED PROJECTS DONE */}
        <View style={ss.verifiedCard}>
          <View style={ss.verifiedHeader}>
            <Text style={ss.verifiedHeaderTxt}>✅  Verified Projects Done  ·  Cannot be edited</Text>
          </View>
          <View style={ss.verifiedBody}>
            <View style={ss.verifiedStat}>
              <Text style={ss.verifiedAmt}>{display.verified}</Text>
              <Text style={ss.verifiedLbl}>Total Project Value</Text>
            </View>
            <View style={ss.verifiedDivider} />
            <View style={ss.verifiedStat}>
              <Text style={ss.verifiedAmt}>{PROFILE.verifiedProjects}</Text>
              <Text style={ss.verifiedLbl}>Projects Done</Text>
            </View>
          </View>
          <TouchableOpacity style={ss.viewHistoryBtn} onPress={() => navigation.navigate('WorkHistory')}>
            <Text style={ss.viewHistoryText}>View Full History →</Text>
          </TouchableOpacity>
        </View>

        {/* LINKS */}
        <View style={ss.linksRow}>
          {[
            { icon: '🌐', label: 'Website' },
            { icon: '💼', label: 'LinkedIn' },
            { icon: '📸', label: 'Instagram' },
            { icon: '📍', label: 'Maps' },
            { icon: '💬', label: 'WhatsApp' },
          ].map((l, i) => (
            <TouchableOpacity key={i} style={ss.linkBtn} onPress={() => Alert.alert('Opening ' + l.label)}>
              <View style={ss.linkIconBox}><Text style={{ fontSize: 20 }}>{l.icon}</Text></View>
              <Text style={ss.linkLabel}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* HIGHLIGHTS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.highlightsContent}>
          {HIGHLIGHTS.map((h, i) => (
            <TouchableOpacity
              key={i}
              style={ss.highlight}
              onPress={() => {
                if (h.label === 'Reviews') {
                  navigation.navigate('ReviewsList', {
                    workerName: PROFILE.name,
                    workerEmoji: PROFILE.logo,
                    role: PROFILE.type,
                  });
                }
              }}
            >
              <View style={[ss.highlightRing, { borderColor: h.color }]}>
                <View style={ss.highlightCircle}>
                  <Text style={{ fontSize: 26 }}>{h.emoji}</Text>
                </View>
              </View>
              <Text style={ss.highlightLabel}>{h.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SERVICES */}
        <View style={ss.sectionHead}>
          <Text style={ss.sectionTitle}>Services Offered</Text>
        </View>
        <View style={[ss.servicesGrid, { paddingHorizontal: 14 }]}>
          {SERVICES.map((sv, i) => (
            <View key={i} style={[ss.serviceItem, { width: (width - 42) / 2 }]}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>{sv.icon}</Text>
              <Text style={ss.serviceName}>{sv.name}</Text>
              <Text style={ss.servicePrice}>{sv.price}</Text>
            </View>
          ))}
        </View>

        {/* TEAM */}
        <View style={ss.sectionHead}>
          <Text style={ss.sectionTitle}>Key Team Members</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 12, paddingBottom: 8 }}>
          {TEAM.map((m, i) => (
            <View key={i} style={ss.teamCard}>
              <View style={ss.teamAvatar}>
                <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
              </View>
              <Text style={ss.teamName}>{m.name}</Text>
              <Text style={ss.teamRole}>{m.role}</Text>
            </View>
          ))}
        </ScrollView>

        {/* TAB BAR */}
        <View style={ss.tabBar}>
          {['Projects', 'About', 'Reviews'].map(t => (
            <TouchableOpacity key={t} style={[ss.tab, activeTab === t && ss.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[ss.tabText, activeTab === t && ss.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PAST PROJECTS */}
        {activeTab === 'Projects' && (
          <View style={{ paddingHorizontal: 14, paddingTop: 12, gap: 10 }}>
            {PROJECTS.map((p, i) => (
              <TouchableOpacity key={i} style={[ss.projectCard, { backgroundColor: p.bg }]}>
                <View style={ss.projectLogoWrap}>
                  <Text style={{ fontSize: 32 }}>{p.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <Text style={ss.projectName}>{p.name}</Text>
                    <View style={[ss.statusBadge, { backgroundColor: p.status === 'Completed' ? '#C8E6C9' : '#FFF9C4' }]}>
                      <Text style={[ss.statusText, { color: p.status === 'Completed' ? '#2E7D32' : '#F57F17' }]}>{p.status}</Text>
                    </View>
                  </View>
                  <Text style={ss.projectLoc}>📍 {p.location}</Text>
                  <Text style={ss.projectYear}>{p.year}</Text>
                </View>
                <Text style={ss.projectValue}>{p.value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'About' && (
          <View style={ss.aboutCard}>
            <Text style={ss.aboutText}>{PROFILE.about}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ACTION BAR */}
      <View style={ss.bookBar}>
        <TouchableOpacity
          style={ss.markCompleteBtn}
          onPress={() => navigation.navigate('MarkWorkComplete', {
            workerName: display.name,
            workerRole: display.type,
            workerEmoji: '🏢',
            workerUid: viewUid,
          })}
        >
          <Text style={ss.markCompleteBtnText}>✅ Mark{'\n'}Complete</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <GradBtn
            label="Contact Now"
            subLabel="Send message"
            onPress={handleChat}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: '#111', fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111' },
  moreBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  moreIcon: { fontSize: 20, color: '#111', letterSpacing: 1 },

  heroCard: { backgroundColor: '#FFFFFF', margin: 14, borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E8E8E8', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  companyLogo: { width: 88, height: 88, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#BFDBFE', marginBottom: 12 },
  profileName: { fontSize: 19, fontWeight: '900', color: '#111', marginBottom: 6, textAlign: 'center' },
  typeBadgeWrap: { marginBottom: 6 },
  typeBadge: { backgroundColor: '#EDE7F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#CE93D8' },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: '#6A1B9A' },
  profileLoc: { fontSize: 13, color: '#888', marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E8E8E8', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderRightWidth: 1, borderRightColor: '#E8E8E8' },
  statVal: { fontSize: 13, fontWeight: '900', color: '#111', marginBottom: 2, textAlign: 'center' },
  statLbl: { fontSize: 10, color: '#888', fontWeight: '600', textAlign: 'center' },

  scorePad: { marginHorizontal: 14, marginTop: 12, marginBottom: 4 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  scoreLabel: { fontSize: 12, fontWeight: '700', color: '#555' },
  scoreNum: { fontSize: 12, fontWeight: '800', color: '#4CAF50' },
  scoreTrack: { height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden' },

  verifiedCard: { marginHorizontal: 14, marginTop: 14, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#A5D6A7' },
  verifiedHeader: { backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 14 },
  verifiedHeaderTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, textAlign: 'center' },
  verifiedBody: { backgroundColor: '#E8F5E9', flexDirection: 'row', paddingVertical: 14 },
  verifiedStat: { flex: 1, alignItems: 'center' },
  verifiedAmt: { fontSize: 17, fontWeight: '900', color: '#1B5E20' },
  verifiedLbl: { fontSize: 11, color: '#2E7D32', fontWeight: '600', marginTop: 2 },
  verifiedDivider: { width: 1, backgroundColor: '#A5D6A7' },

  linksRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 14, paddingVertical: 16, backgroundColor: '#FFFFFF', marginHorizontal: 14, marginTop: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E8E8E8' },
  linkBtn: { alignItems: 'center', gap: 4 },
  linkIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E8E8' },
  linkLabel: { fontSize: 10, color: '#555', fontWeight: '600' },

  highlightsContent: { paddingHorizontal: 14, paddingVertical: 16, gap: 14 },
  highlight: { alignItems: 'center', gap: 6 },
  highlightRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  highlightCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  highlightLabel: { fontSize: 10, fontWeight: '700', color: '#444' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#111', borderLeftWidth: 3, borderLeftColor: '#C13584', paddingLeft: 8 },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceItem: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E8E8E8', alignItems: 'center' },
  serviceName: { fontSize: 11, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 4 },
  servicePrice: { fontSize: 12, fontWeight: '900', color: '#E8A900' },

  teamCard: { alignItems: 'center', gap: 6, width: 90 },
  teamAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EDE7F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#CE93D8' },
  teamName: { fontSize: 11, fontWeight: '800', color: '#111', textAlign: 'center' },
  teamRole: { fontSize: 10, color: '#888', textAlign: 'center', fontWeight: '600' },

  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E8E8E8', backgroundColor: '#FFFFFF', marginTop: 14 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#C13584' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#C13584', fontWeight: '800' },

  projectCard: { flexDirection: 'row', borderRadius: 16, padding: 14, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E8E8E8' },
  projectLogoWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  projectName: { fontSize: 13, fontWeight: '800', color: '#111' },
  projectLoc: { fontSize: 11, color: '#666', marginTop: 2 },
  projectYear: { fontSize: 10, color: '#999', marginTop: 2 },
  projectValue: { fontSize: 15, fontWeight: '900', color: '#E8A900' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },

  aboutCard: { backgroundColor: '#FFFFFF', marginHorizontal: 14, marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E8E8E8' },
  aboutText: { fontSize: 13, color: '#555', lineHeight: 20 },

  gradWrap: { borderRadius: 14, overflow: 'hidden', height: 56 },
  gradBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  gradContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gradLabel: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  gradSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', marginTop: 2 },

  bookBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 28, paddingTop: 10, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#E8E8E8' },
  viewHistoryBtn: { backgroundColor: '#E8F5E9', paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#A5D6A7' },
  viewHistoryText: { fontSize: 12, fontWeight: '800', color: '#2E7D32' },
  markCompleteBtn: { width: 72, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: '#4CAF50' },
  markCompleteBtnText: { fontSize: 11, fontWeight: '900', color: '#2E7D32', textAlign: 'center', lineHeight: 16 },
});
