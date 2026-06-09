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

// ─── Instagram Gradient Helper ────────────────────────────────────────────────
function IGGrad({ style, children }) {
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {['#833AB4', '#BF2E6E', '#FD1D1D', '#F77737'].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      {children}
    </View>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <Text style={ss.sectionLabel}>{text.toUpperCase()}</Text>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const SPECIALIZATIONS = ['Residential', 'Commercial', 'Vastu', 'Sustainable', 'Interior'];
const SKILLS = ['AutoCAD', 'Revit', 'SketchUp', 'Lumion', '3ds Max', 'Photoshop'];

const SERVICES = [
  { icon: '🏛️', name: 'Residential Design', desc: 'Bungalows, villas, row houses', price: '₹25', unit: '/sqft' },
  { icon: '🏢', name: 'Commercial Design', desc: 'Offices, retail, showrooms', price: '₹35', unit: '/sqft' },
  { icon: '📐', name: 'AutoCAD Drawings', desc: 'Working drawings, sections', price: '₹8,000', unit: '/set' },
  { icon: '🧭', name: 'Vastu Consultation', desc: 'Home & office Vastu analysis', price: '₹5,000', unit: '/visit' },
];

const EXPERIENCE = [
  { company: 'Self Employed', role: 'Senior Architect', years: '2019 – Present', desc: 'Independent practice handling residential and commercial projects across Gujarat.', current: true },
  { company: 'Studio Forma', role: 'Project Architect', years: '2015 – 2019', desc: 'Led a team of 4 on large commercial and mixed-use projects in Ahmedabad.', current: false },
  { company: 'Vaastu Design Lab', role: 'Junior Architect', years: '2012 – 2015', desc: 'Vastu-compliant residential designs and AutoCAD documentation.', current: false },
];

const COURSES = [
  { icon: '🎓', name: 'Advanced Revit Architecture', institute: 'Autodesk Certified', year: '2021' },
  { icon: '🏅', name: 'LEED Green Associate', institute: 'USGBC', year: '2020' },
];

const PHOTOS = [
  { emoji: '🏢', bg: '#EDE7F6' }, { emoji: '🏛️', bg: '#FCE4EC' }, { emoji: '🏠', bg: '#E3F2FD' },
  { emoji: '🏗️', bg: '#E8F5E9' }, { emoji: '🏢', bg: '#FFF3E0' }, { emoji: '🏛️', bg: '#F3E5F5' },
];

const REVIEWS = [
  { name: 'Rohan Mehta', rating: 5, date: 'Jan 2024', text: 'Vikram delivered stunning plans on time. His attention to detail is exceptional. Highly recommended!' },
  { name: 'Priya Shah', rating: 5, date: 'Nov 2023', text: 'Very professional. The Vastu consultation was thorough and the 3D renders were beautiful.' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfessionalProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('Grid');
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
        { uid: viewUid, name: liveProfile?.name || 'Professional' }
      );
      navigation.navigate('Chat', {
        conversation: {
          id: chatId,
          uid: viewUid,
          name: liveProfile?.name || 'Professional',
          role: liveProfile?.designation || 'Professional',
          emoji: '🏛️',
          avatarBg: '#EDE7F6',
          online: false,
        }
      });
    } catch (_) { Alert.alert('Error', 'Could not open chat.'); }
  };

  const photoSize = (width - 4) / 3;

  const display = {
    name: liveProfile?.name || 'Add your name',
    designation: liveProfile?.designation || 'Add your designation',
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
        <Text style={{ fontSize: 52, marginBottom: 16 }}>🏛️</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 8, textAlign: 'center' }}>Profile Incomplete</Text>
        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
          Please complete your profile to appear in search results and attract clients.
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. TOP NAV ─────────────────────────────────────────────────────── */}
      <View style={ss.nav}>
        <TouchableOpacity style={ss.navBtn} onPress={() => navigation.goBack()}>
          <Text style={ss.navBackArrow}>←</Text>
        </TouchableOpacity>
        <Text style={ss.navTitle}>@{display.name.toLowerCase().replace(/\s+/g, '.')}</Text>
        <TouchableOpacity style={ss.navBtn} onPress={() => Alert.alert('Options')}>
          <Text style={ss.navDots}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── 2. INSTAGRAM HEADER ROW ────────────────────────────────────────── */}
        <View style={ss.igHeader}>
          {/* Left: avatar with gradient ring */}
          <IGGrad style={ss.avatarRing}>
            <View style={ss.avatarInner}>
              <Text style={{ fontSize: 36 }}>👨‍💼</Text>
            </View>
          </IGGrad>

          {/* Right: 3 stats */}
          <View style={ss.igStats}>
            <View style={ss.igStat}>
              <Text style={ss.igStatVal}>{verifiedAmt || '₹0'}</Text>
              <Text style={ss.igStatLbl}>Verified</Text>
            </View>
            <View style={ss.igStatDivider} />
            <View style={ss.igStat}>
              <Text style={ss.igStatVal}>{liveProfile?.experience || '—'}</Text>
              <Text style={ss.igStatLbl}>Yrs Exp</Text>
            </View>
            <View style={ss.igStatDivider} />
            <View style={ss.igStat}>
              <Text style={[ss.igStatVal, { color: '#E8A900' }]}>{liveProfile?.rating ? `${liveProfile.rating} ★` : '—'}</Text>
              <Text style={ss.igStatLbl}>Rating</Text>
            </View>
          </View>
        </View>

        {/* ── 3. NAME ROW ───────────────────────────────────────────────────── */}
        <View style={ss.namePad}>
          <View style={ss.nameRow}>
            <Text style={ss.name}>{display.name}</Text>
            <View style={ss.verifiedBadge}>
              <Text style={ss.verifiedBadgeText}>✓ Verified</Text>
            </View>
          </View>

          {/* ── 4. DESIGNATION ─────────────────────────────────────────────── */}
          <Text style={ss.designation}>{display.designation}</Text>

          {/* ── 5. LOCATION ────────────────────────────────────────────────── */}
          <View style={ss.locationRow}>
            <Text style={ss.locationText}>📍 {display.location}</Text>
            <Text style={ss.locationDot}> · </Text>
            <View style={ss.availDot} />
            <Text style={ss.availText}> Available</Text>
          </View>
        </View>

        {/* ── 6. TRUST BADGES ───────────────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.trustRow}>
          {[
            { label: 'COA Reg ✓', bg: '#E8F5E9', color: '#2E7D32' },
            { label: 'Aadhaar ✓', bg: '#E3F2FD', color: '#1565C0' },
            { label: 'GST ✓', bg: '#FFF8E1', color: '#F57F17' },
            { label: 'B.Arch CEPT', bg: '#F3E5F5', color: '#6A1B9A' },
            { label: '12 Yrs Exp', bg: '#FCE4EC', color: '#880E4F' },
          ].map((b, i) => (
            <View key={i} style={[ss.trustPill, { backgroundColor: b.bg }]}>
              <Text style={[ss.trustPillText, { color: b.color }]}>{b.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── 7. ACTION BUTTONS ─────────────────────────────────────────────── */}
        <View style={ss.actionRow}>
          <IGGrad style={ss.callBtn}>
            <TouchableOpacity
              style={ss.callBtnInner}
              onPress={handleChat}
              activeOpacity={0.85}
            >
              <Text style={ss.callBtnText}>💬  Message</Text>
            </TouchableOpacity>
          </IGGrad>

          <TouchableOpacity
            style={ss.msgBtn}
            onPress={() => navigation.navigate('MarkWorkComplete', {
              workerName: display.name,
              workerRole: display.designation,
              workerEmoji: '🏛️',
              workerUid: viewUid,
            })}
            activeOpacity={0.85}
          >
            <Text style={ss.msgBtnText}>✅  Work Done</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={ss.bookmarkBtn}
            onPress={() => Alert.alert('Saved!')}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 18 }}>🔖</Text>
          </TouchableOpacity>
        </View>

        {/* ── 8. VERIFIED WORK CARD ─────────────────────────────────────────── */}
        <View style={ss.verCard}>
          <View style={ss.verHeader}>
            <Text style={ss.verHeaderText}>✓  Verified Work Done  |  Cannot be edited</Text>
          </View>
          <View style={ss.verBody}>
            <View style={ss.verStat}>
              <Text style={ss.verAmt}>{display.verified}</Text>
              <Text style={ss.verStatLbl}>Total Earned</Text>
            </View>
            <View style={ss.verDivider} />
            <View style={ss.verStat}>
              <Text style={ss.verCount}>34</Text>
              <Text style={ss.verStatLbl}>Jobs Done</Text>
            </View>
            <View style={ss.verDivider} />
            <View style={ss.verStat}>
              <Text style={ss.verCount}>127</Text>
              <Text style={ss.verStatLbl}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* ── 9. ABOUT ──────────────────────────────────────────────────────── */}
        <View style={ss.section}>
          <SectionLabel text="About" />
          <Text style={ss.aboutText}>
            COA-registered Senior Architect with 12+ years in residential, commercial & industrial projects across Gujarat. Expert in sustainable design and Vastu-compliant layouts.
          </Text>
        </View>

        {/* ── 10. SPECIALIZATION ────────────────────────────────────────────── */}
        <View style={ss.section}>
          <SectionLabel text="Specialization" />
          <View style={ss.tagsWrap}>
            {SPECIALIZATIONS.map((s, i) => (
              <View key={i} style={ss.specTag}>
                <Text style={ss.specTagText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 11. SKILLS ────────────────────────────────────────────────────── */}
        <View style={ss.section}>
          <SectionLabel text="Skills" />
          <View style={ss.tagsWrap}>
            {SKILLS.map((s, i) => (
              <View key={i} style={ss.skillTag}>
                <Text style={ss.skillTagText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 12. WORK PHOTOS ───────────────────────────────────────────────── */}
        <View style={{ marginTop: 18 }}>
          {/* Instagram-style tab bar */}
          <View style={ss.igTabBar}>
            {['Grid', 'Reels', 'Tagged'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[ss.igTab, activeTab === t && ss.igTabActive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[ss.igTabText, activeTab === t && ss.igTabTextActive]}>
                  {t === 'Grid' ? '⊞' : t === 'Reels' ? '▶' : '🏷'} {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 3×2 photo grid */}
          <View style={ss.photoGrid}>
            {PHOTOS.map((ph, i) => (
              <TouchableOpacity
                key={i}
                style={{ width: photoSize, height: photoSize, padding: 1 }}
                activeOpacity={0.85}
              >
                <View style={[ss.photoCell, { backgroundColor: ph.bg }]}>
                  <Text style={{ fontSize: 36 }}>{ph.emoji}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 13. SERVICES & PRICING ────────────────────────────────────────── */}
        <View style={ss.section}>
          <SectionLabel text="Services & Pricing" />
          <View style={ss.servicesList}>
            {SERVICES.map((sv, i) => (
              <View key={i} style={[ss.serviceRow, i < SERVICES.length - 1 && ss.serviceRowBorder]}>
                <View style={ss.serviceIconBox}>
                  <Text style={{ fontSize: 22 }}>{sv.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ss.serviceName}>{sv.name}</Text>
                  <Text style={ss.serviceDesc}>{sv.desc}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={ss.servicePrice}>{sv.price}</Text>
                  <Text style={ss.serviceUnit}>{sv.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── 14. EXPERIENCE TIMELINE ───────────────────────────────────────── */}
        <View style={ss.section}>
          <SectionLabel text="Experience" />
          <View style={ss.timeline}>
            {EXPERIENCE.map((ex, i) => (
              <View key={i} style={ss.timelineEntry}>
                {/* vertical line + dot */}
                <View style={ss.timelineLeft}>
                  <View style={[ss.timelineDot, { backgroundColor: ex.current ? '#4CAF50' : '#BDBDBD' }]} />
                  {i < EXPERIENCE.length - 1 && <View style={ss.timelineLine} />}
                </View>
                {/* content */}
                <View style={ss.timelineContent}>
                  <Text style={ss.timelineCompany}>{ex.company}</Text>
                  <Text style={ss.timelineRole}>{ex.role}</Text>
                  <Text style={ss.timelineYears}>{ex.years}</Text>
                  <Text style={ss.timelineDesc}>{ex.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── 15. COURSES COMPLETED ─────────────────────────────────────────── */}
        <View style={ss.section}>
          <SectionLabel text="Courses Completed" />
          {COURSES.map((c, i) => (
            <View key={i} style={[ss.courseCard, i > 0 && { marginTop: 10 }]}>
              <View style={ss.courseIconBox}>
                <Text style={{ fontSize: 24 }}>{c.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ss.courseName}>{c.name}</Text>
                <Text style={ss.courseInstitute}>{c.institute} · {c.year}</Text>
              </View>
              <View style={ss.courseDoneBadge}>
                <Text style={ss.courseDoneText}>✓ Done</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── 16. LINKS ─────────────────────────────────────────────────────── */}
        <View style={ss.section}>
          <SectionLabel text="Links" />
          <View style={ss.linksRow}>
            {[
              { icon: '🌐', label: 'Website' },
              { icon: '💼', label: 'LinkedIn' },
              { icon: '📸', label: 'Instagram' },
              { icon: '🎨', label: 'Behance' },
              { icon: '📍', label: 'Maps' },
            ].map((l, i) => (
              <TouchableOpacity
                key={i}
                style={ss.linkBtn}
                onPress={() => Alert.alert('Opening ' + l.label)}
                activeOpacity={0.8}
              >
                <View style={ss.linkIconBox}>
                  <Text style={{ fontSize: 20 }}>{l.icon}</Text>
                </View>
                <Text style={ss.linkLabel}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 17. CC TRUST SCORE ────────────────────────────────────────────── */}
        <View style={ss.section}>
          <View style={ss.trustScoreHeader}>
            <SectionLabel text="CC Trust Score" />
            <Text style={ss.trustScoreNum}>87 / 100</Text>
          </View>

          {/* Gradient bar */}
          <View style={ss.trustBarTrack}>
            <View style={{ width: '87%', height: '100%', flexDirection: 'row', overflow: 'hidden', borderRadius: 6 }}>
              {['#F44336', '#FF9800', '#FFEB3B', '#8BC34A', '#4CAF50'].map((c, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: c }} />
              ))}
            </View>
          </View>

          {/* 4 metric boxes */}
          <View style={ss.trustMetrics}>
            {[
              { label: 'On-time', value: '98%', icon: '⏱' },
              { label: 'Repeat clients', value: '68%', icon: '🔁' },
              { label: 'Satisfaction', value: '4.9 ★', icon: '😊' },
              { label: 'Profile', value: '92%', icon: '✅' },
            ].map((m, i) => (
              <View key={i} style={ss.trustMetricBox}>
                <Text style={ss.trustMetricIcon}>{m.icon}</Text>
                <Text style={ss.trustMetricVal}>{m.value}</Text>
                <Text style={ss.trustMetricLbl}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 18. REVIEWS ───────────────────────────────────────────────────── */}
        <View style={ss.section}>
          <View style={ss.reviewsHeader}>
            <SectionLabel text="Reviews" />
            <View style={ss.reviewsOverall}>
              <Text style={ss.reviewsOverallNum}>4.9</Text>
              <View>
                <Text style={ss.reviewsStars}>★★★★★</Text>
                <Text style={ss.reviewsCount}>127 reviews</Text>
              </View>
            </View>
          </View>

          {/* Star breakdown bars */}
          {[
            { stars: 5, pct: 86 },
            { stars: 4, pct: 10 },
            { stars: 3, pct: 3 },
            { stars: 2, pct: 1 },
            { stars: 1, pct: 0 },
          ].map((r) => (
            <View key={r.stars} style={ss.ratingBarRow}>
              <Text style={ss.ratingBarLabel}>{r.stars}★</Text>
              <View style={ss.ratingBarTrack}>
                <View style={[ss.ratingBarFill, { width: `${r.pct}%` }]} />
              </View>
              <Text style={ss.ratingBarPct}>{r.pct}%</Text>
            </View>
          ))}

          {/* Review cards */}
          {REVIEWS.map((rv, i) => (
            <View key={i} style={[ss.reviewCard, i > 0 && { marginTop: 10 }]}>
              <View style={ss.reviewCardTop}>
                <View style={ss.reviewAvatar}>
                  <Text style={{ fontSize: 18 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ss.reviewName}>{rv.name}</Text>
                  <Text style={ss.reviewDate}>{rv.date}</Text>
                </View>
                <Text style={ss.reviewStars}>{'★'.repeat(rv.rating)}</Text>
              </View>
              <Text style={ss.reviewText}>{rv.text}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={ss.seeAllBtn}
            onPress={() =>
              navigation.navigate('ReviewsList', {
                workerName: 'Vikram Desai',
                workerEmoji: '📐',
                role: 'Senior Architect',
              })
            }
            activeOpacity={0.8}
          >
            <Text style={ss.seeAllText}>See all 127 reviews →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── BOTTOM ACTION BAR ──────────────────────────────────────────────── */}
      <View style={ss.bottomBar}>
        <IGGrad style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
          <TouchableOpacity
            style={ss.bottomBarBtn}
            onPress={() => Alert.alert('Booking', 'Request sent to Vikram Desai!')}
            activeOpacity={0.88}
          >
            <Text style={ss.bottomBarBtnText}>Book Now</Text>
            <Text style={ss.bottomBarBtnSub}>Usually responds within 1 hr</Text>
          </TouchableOpacity>
        </IGGrad>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },

  // ── 1. TOP NAV
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E8E8E8',
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  navBackArrow: { fontSize: 20, color: '#111', fontWeight: '700' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: '#111' },
  navDots: { fontSize: 22, color: '#111', letterSpacing: 1 },

  // ── 2. INSTAGRAM HEADER ROW
  igHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  avatarRing: {
    width: 80, height: 80, borderRadius: 40,
    padding: 3, marginRight: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F5F0FF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  igStats: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  igStat: { flex: 1, alignItems: 'center' },
  igStatVal: { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 2 },
  igStatLbl: { fontSize: 11, color: '#888', fontWeight: '500' },
  igStatDivider: { width: 1, height: 28, backgroundColor: '#E8E8E8' },

  // ── 3–5. NAME / DESIGNATION / LOCATION
  namePad: { paddingHorizontal: 16, paddingBottom: 10, backgroundColor: '#FFFFFF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  name: { fontSize: 18, fontWeight: '900', color: '#111' },
  verifiedBadge: {
    backgroundColor: '#E8F5E9', borderRadius: 20, borderWidth: 1,
    borderColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 2,
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: '800', color: '#2E7D32' },
  designation: { fontSize: 13, color: '#777', fontWeight: '500', marginBottom: 5 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#555' },
  locationDot: { fontSize: 12, color: '#888' },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50', marginTop: 1 },
  availText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },

  // ── 6. TRUST BADGES
  trustRow: {
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  trustPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  trustPillText: { fontSize: 11, fontWeight: '700' },

  // ── 7. ACTION BUTTONS
  actionRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  callBtn: { flex: 1, borderRadius: 10, height: 42 },
  callBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  callBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  msgBtn: {
    flex: 1, height: 42, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#C13584', alignItems: 'center', justifyContent: 'center',
  },
  msgBtnText: { color: '#C13584', fontWeight: '800', fontSize: 14 },
  bookmarkBtn: {
    width: 42, height: 42, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },

  // ── 8. VERIFIED WORK CARD
  verCard: {
    marginHorizontal: 14, marginTop: 16, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: '#A5D6A7',
  },
  verHeader: { backgroundColor: '#4CAF50', paddingVertical: 9, paddingHorizontal: 14 },
  verHeaderText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, textAlign: 'center' },
  verBody: {
    backgroundColor: '#E8F5E9', flexDirection: 'row',
    paddingVertical: 16, alignItems: 'center',
  },
  verStat: { flex: 1, alignItems: 'center' },
  verAmt: { fontSize: 22, fontWeight: '900', color: '#1B5E20' },
  verCount: { fontSize: 22, fontWeight: '900', color: '#2E7D32' },
  verStatLbl: { fontSize: 11, color: '#388E3C', fontWeight: '600', marginTop: 2 },
  verDivider: { width: 1, height: 36, backgroundColor: '#A5D6A7' },

  // ── Section shared
  section: {
    marginHorizontal: 14, marginTop: 20,
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#E8E8E8',
  },
  sectionLabel: {
    fontSize: 9, color: '#888', fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },

  // ── 9. ABOUT
  aboutText: { fontSize: 13, color: '#555', lineHeight: 20 },

  // ── 10. SPECIALIZATION tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specTag: {
    backgroundColor: '#F0F4FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  specTagText: { fontSize: 12, color: '#3949AB', fontWeight: '600' },

  // ── 11. SKILLS tags
  skillTag: {
    backgroundColor: '#FFF3E0', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  skillTagText: { fontSize: 12, color: '#E65100', fontWeight: '600' },

  // ── 12. WORK PHOTOS
  igTabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E8E8E8',
  },
  igTab: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  igTabActive: { borderBottomWidth: 2, borderBottomColor: '#111' },
  igTabText: { fontSize: 12, fontWeight: '600', color: '#999' },
  igTabTextActive: { color: '#111', fontWeight: '800' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#FAFAFA' },
  photoCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── 13. SERVICES & PRICING
  servicesList: {},
  serviceRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 12,
  },
  serviceRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  serviceIconBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  serviceName: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 2 },
  serviceDesc: { fontSize: 11, color: '#888' },
  servicePrice: { fontSize: 15, fontWeight: '900', color: '#E8A900' },
  serviceUnit: { fontSize: 10, color: '#AAA', textAlign: 'right' },

  // ── 14. EXPERIENCE TIMELINE
  timeline: { paddingLeft: 4 },
  timelineEntry: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { width: 20, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3, zIndex: 1 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: 2, marginBottom: -4 },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 18 },
  timelineCompany: { fontSize: 13, fontWeight: '800', color: '#111' },
  timelineRole: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 1 },
  timelineYears: { fontSize: 11, color: '#E8A900', fontWeight: '700', marginTop: 2, marginBottom: 4 },
  timelineDesc: { fontSize: 12, color: '#777', lineHeight: 17 },

  // ── 15. COURSES
  courseCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FAFAFA', borderRadius: 10,
    padding: 12, gap: 12, borderWidth: 1, borderColor: '#F0F0F0',
  },
  courseIconBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center',
  },
  courseName: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 2 },
  courseInstitute: { fontSize: 11, color: '#888' },
  courseDoneBadge: {
    backgroundColor: '#E8F5E9', borderRadius: 20, borderWidth: 1,
    borderColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 3,
  },
  courseDoneText: { fontSize: 11, fontWeight: '800', color: '#2E7D32' },

  // ── 16. LINKS
  linksRow: { flexDirection: 'row', justifyContent: 'space-between' },
  linkBtn: { alignItems: 'center', gap: 5 },
  linkIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E8E8E8',
  },
  linkLabel: { fontSize: 10, color: '#555', fontWeight: '600' },

  // ── 17. CC TRUST SCORE
  trustScoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  trustScoreNum: { fontSize: 20, fontWeight: '900', color: '#4CAF50' },
  trustBarTrack: {
    height: 12, backgroundColor: '#F0F0F0', borderRadius: 6,
    overflow: 'hidden', marginBottom: 14,
  },
  trustMetrics: { flexDirection: 'row', gap: 8 },
  trustMetricBox: {
    flex: 1, backgroundColor: '#FAFAFA', borderRadius: 10,
    borderWidth: 1, borderColor: '#F0F0F0',
    paddingVertical: 10, alignItems: 'center', gap: 3,
  },
  trustMetricIcon: { fontSize: 16 },
  trustMetricVal: { fontSize: 13, fontWeight: '900', color: '#111' },
  trustMetricLbl: { fontSize: 9, color: '#888', fontWeight: '600', textAlign: 'center' },

  // ── 18. REVIEWS
  reviewsHeader: { marginBottom: 12 },
  reviewsOverall: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  reviewsOverallNum: { fontSize: 36, fontWeight: '900', color: '#111' },
  reviewsStars: { fontSize: 14, color: '#E8A900' },
  reviewsCount: { fontSize: 12, color: '#888', fontWeight: '500' },
  ratingBarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5,
  },
  ratingBarLabel: { fontSize: 11, color: '#888', width: 20, textAlign: 'right' },
  ratingBarTrack: {
    flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden',
  },
  ratingBarFill: { height: '100%', backgroundColor: '#E8A900', borderRadius: 3 },
  ratingBarPct: { fontSize: 10, color: '#AAA', width: 28, textAlign: 'right' },
  reviewCard: {
    backgroundColor: '#FAFAFA', borderRadius: 10,
    borderWidth: 1, borderColor: '#F0F0F0', padding: 12,
  },
  reviewCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDE7F6', alignItems: 'center', justifyContent: 'center',
  },
  reviewName: { fontSize: 13, fontWeight: '700', color: '#111' },
  reviewDate: { fontSize: 11, color: '#AAA' },
  reviewStars: { fontSize: 13, color: '#E8A900' },
  reviewText: { fontSize: 12, color: '#555', lineHeight: 18 },
  seeAllBtn: {
    marginTop: 12, paddingVertical: 10, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#C13584' },

  // ── BOTTOM ACTION BAR
  bottomBar: {
    paddingHorizontal: 16, paddingBottom: 28, paddingTop: 10,
    backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#E8E8E8',
  },
  bottomBarBtn: {
    height: 54, alignItems: 'center', justifyContent: 'center',
  },
  bottomBarBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  bottomBarBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginTop: 2 },
});
