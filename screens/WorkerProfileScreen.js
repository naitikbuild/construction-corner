import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, useWindowDimensions, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, recordProfileView } from '../services/userService';
import { getTotalVerifiedAmount, getVerifiedWork } from '../services/workService';
import { createChat } from '../services/chatService';
import { toggleBookmark, isBookmarked } from '../services/bookmarkService';
import { auth } from '../config/firebase';

// ─── Section Label ────────────────────────────────────────────────────────────
function SLabel({ text }) {
  return <Text style={ss.sLabel}>{text.toUpperCase()}</Text>;
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function Divider() {
  return <View style={ss.divider} />;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const WORKER = {
  name: 'Ramesh Patel',
  designation: 'Electrician',
  location: 'Ahmedabad, Gujarat',
  avatar: '👷',
  rating: '4.7',
  reviews: 38,
  years: 7,
  verifiedAmt: '₹2.4L',
  jobs: 38,
  repeatClients: 12,
  onTime: '96%',
  trustScore: 88,
  dailyRate: '₹900',
};

const SKILLS = [
  'House Wiring', 'Panel Installation', 'Industrial Wiring',
  'Switchboard Setup', 'Fault Repair', 'Generator Work',
  'CCTV Installation', 'Solar Panel',
];

const PHOTOS = [
  { emoji: '⚡', bg: '#FFF8E1' }, { emoji: '🔌', bg: '#E8F5E9' }, { emoji: '🏠', bg: '#E3F2FD' },
  { emoji: '🔧', bg: '#FCE4EC' }, { emoji: '🏭', bg: '#EDE7F6' }, { emoji: '☀️', bg: '#FFF3E0' },
];

const VERIFIED_JOBS = [
  { type: 'House Wiring – 3BHK', amount: '₹22,000', location: 'Navrangpura, Ahmedabad', date: '12 Jan 2024' },
  { type: 'Industrial Panel Upgrade', amount: '₹45,000', location: 'Naroda GIDC, Ahmedabad', date: '03 Dec 2023' },
  { type: 'CCTV + Electrical Setup', amount: '₹18,500', location: 'Gandhinagar Sec-7', date: '18 Nov 2023' },
];

const REVIEWS = [
  {
    text: 'Ramesh completed the full wiring of our 3BHK on time and within budget. Very clean work — no exposed wires, proper labeling. Will hire again!',
    name: 'Suresh Mehta',
    company: 'Home Owner',
    stars: 5,
  },
  {
    text: 'Came on time, fixed the panel issue in 2 hours. Diagnosed the problem immediately. Honest about pricing and skilled at work.',
    name: 'Kiran Industries',
    company: 'Factory Manager',
    stars: 5,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function WorkerProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;
  const { width } = useWindowDimensions();
  const photoSize = (width - 4) / 3;
  const [loading, setLoading] = useState(true);
  const [liveWorker, setLiveWorker] = useState(null);
  const [verifiedAmt, setVerifiedAmt] = useState('₹0');
  const [verifiedJobs, setVerifiedJobs] = useState([]);
  const [myUid, setMyUid] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const uid = viewUid || auth.currentUser?.uid;
      const me = await AsyncStorage.getItem('uid');
      setMyUid(me);
      if (!uid) { setLoading(false); return; }
      if (uid !== me) {
        recordProfileView(uid, me);
        isBookmarked(me, uid).then(saved => setBookmarked(saved)).catch(() => {});
      }
      const [profile, totalAmt, jobs] = await Promise.all([
        getProfile(uid),
        getTotalVerifiedAmount(uid),
        getVerifiedWork(uid),
      ]);
      if (profile) setLiveWorker(profile);
      setVerifiedAmt(totalAmt > 0 ? `₹${totalAmt.toLocaleString('en-IN')}` : '₹0');
      setVerifiedJobs(jobs.slice(0, 3));
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleChat = async () => {
    if (!viewUid || viewUid === myUid) return;
    try {
      const myName = await AsyncStorage.getItem('userName') || 'Me';
      const chatId = await createChat(
        { uid: myUid, name: myName },
        { uid: viewUid, name: liveWorker?.name || 'Worker' }
      );
      navigation.navigate('Chat', {
        conversation: {
          id: chatId,
          uid: viewUid,
          name: liveWorker?.name || 'Worker',
          role: liveWorker?.workerSkill || 'Worker',
          emoji: '👷',
          avatarBg: '#FFF3E0',
          online: false,
        }
      });
    } catch (_) { Alert.alert('Error', 'Could not open chat.'); }
  };

  const displayWorker = {
    name: liveWorker?.name || 'Add your name',
    designation: liveWorker?.workerSkill || 'Add your skill',
    location: [liveWorker?.city, liveWorker?.state].filter(Boolean).join(', ') || 'Add location',
    avatar: '👷',
    rating: liveWorker?.rating || '—',
    reviews: liveWorker?.reviews || 0,
    years: liveWorker?.workerExperience || liveWorker?.experience || '—',
    verifiedAmt,
    jobs: liveWorker?.jobsCompleted || 0,
    repeatClients: liveWorker?.repeatClients || 0,
    onTime: liveWorker?.onTimeRate || '—',
    trustScore: liveWorker?.trustScore || 0,
    dailyRate: liveWorker?.dailyRate || 'Not set',
  };

  const isIncomplete = !liveWorker;

  if (loading) {
    return (
      <View style={[ss.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1A1A1A" />
        <Text style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Loading profile...</Text>
      </View>
    );
  }

  if (isIncomplete && !viewUid) {
    return (
      <View style={[ss.screen, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 52, marginBottom: 16 }}>👷</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' }}>Profile Incomplete</Text>
        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
          Please complete your profile to appear in search results and attract clients.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#1A1A1A', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 }}
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
          <Text style={ss.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={ss.navTitle}>Worker Profile</Text>
        {viewUid && viewUid !== myUid && (
          <TouchableOpacity
            style={ss.navBtn}
            onPress={async () => {
              if (!myUid) return;
              const lp = liveWorker || {};
              const saved = await toggleBookmark(myUid, {
                uid: viewUid,
                name: lp.name || lp.companyName || 'Worker',
                profileType: 'worker',
                category: lp.workerSkill || lp.category || '',
                city: lp.city || '',
                state: lp.state || '',
              });
              setBookmarked(saved);
              Alert.alert(saved ? 'Bookmarked! 🔖' : 'Removed', saved ? 'Profile saved to bookmarks.' : 'Removed from bookmarks.');
            }}
          >
            <Text style={ss.navShare}>{bookmarked ? '🔖' : '☆'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── 2. HERO SECTION ───────────────────────────────────────────────── */}
        <View style={ss.heroCard}>
          {/* Photo row */}
          <View style={ss.heroTop}>
            <View style={ss.avatarCircle}>
              <Text style={{ fontSize: 36 }}>{WORKER.avatar}</Text>
            </View>
            <View style={ss.heroInfo}>
              <Text style={ss.heroName}>{displayWorker.name}</Text>
              <Text style={ss.heroDesig}>{displayWorker.designation}</Text>
              <Text style={ss.heroLoc}>📍 {displayWorker.location}</Text>
            </View>
          </View>

          <Divider />

          {/* Quick stats strip */}
          <View style={ss.heroStrip}>
            <Text style={ss.heroStripStar}>⭐ {WORKER.rating}</Text>
            <Text style={ss.heroStripMuted}> ({WORKER.reviews} Reviews)</Text>
            <Text style={ss.heroStripSep}>  ·  </Text>
            <Text style={ss.heroStripVerified}>✅ Verified</Text>
            <Text style={ss.heroStripSep}>  ·  </Text>
            <Text style={ss.heroStripItem}>{WORKER.years} Yrs Exp</Text>
            <Text style={ss.heroStripSep}>  ·  </Text>
            <View style={ss.availRow}>
              <View style={ss.availDot} />
              <Text style={ss.availText}> Available Today</Text>
            </View>
          </View>

          <Divider />

          {/* Action buttons */}
          <View style={ss.heroActions}>
            <TouchableOpacity
              style={ss.hireBtn}
              onPress={handleChat}
              activeOpacity={0.85}
            >
              <Text style={ss.hireBtnText}>Hire Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={ss.outlineBtn}
              onPress={handleChat}
              activeOpacity={0.85}
            >
              <Text style={ss.outlineBtnText}>💬 Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={ss.outlineBtn}
              onPress={() => navigation.navigate('MarkWorkComplete', {
                workerName: displayWorker.name,
                workerRole: displayWorker.designation,
                workerEmoji: '👷',
                workerUid: viewUid,
              })}
              activeOpacity={0.85}
            >
              <Text style={ss.outlineBtnText}>✅ Work Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 3. TRUST SCORE CARD ───────────────────────────────────────────── */}
        <View style={ss.trustCard}>
          {/* Score header */}
          <View style={ss.trustTopRow}>
            <View>
              <Text style={ss.trustCardLabel}>Trust Score</Text>
              <Text style={ss.trustCardScore}>{WORKER.trustScore} / 100</Text>
            </View>
            <View style={ss.trustScoreBadge}>
              <Text style={ss.trustScoreBadgeText}>Excellent</Text>
            </View>
          </View>

          {/* Score bar */}
          <View style={ss.trustBarTrack}>
            <View style={[ss.trustBarFill, { width: `${WORKER.trustScore}%` }]} />
          </View>

          {/* Verified earnings — prominent */}
          <View style={ss.verEarningsBox}>
            <Text style={ss.verEarningsLabel}>✓  Verified Earnings</Text>
            <Text style={ss.verEarningsAmt}>{displayWorker.verifiedAmt}</Text>
            <Text style={ss.verEarningsSub}>Confirmed by clients · Cannot be edited</Text>
          </View>

          {/* 3 stats */}
          <View style={ss.trustStats}>
            <View style={ss.trustStat}>
              <Text style={ss.trustStatVal}>{WORKER.jobs}</Text>
              <Text style={ss.trustStatLbl}>Jobs{'\n'}Completed</Text>
            </View>
            <View style={ss.trustStatSep} />
            <View style={ss.trustStat}>
              <Text style={ss.trustStatVal}>{WORKER.repeatClients}</Text>
              <Text style={ss.trustStatLbl}>Repeat{'\n'}Clients</Text>
            </View>
            <View style={ss.trustStatSep} />
            <View style={ss.trustStat}>
              <Text style={[ss.trustStatVal, { color: '#4CAF50' }]}>{WORKER.onTime}</Text>
              <Text style={ss.trustStatLbl}>On-Time{'\n'}Rate</Text>
            </View>
          </View>
        </View>

        {/* ── 4. SKILLS ─────────────────────────────────────────────────────── */}
        <View style={ss.card}>
          <SLabel text="Skills" />
          <View style={ss.chipsWrap}>
            {SKILLS.map((sk, i) => (
              <View key={i} style={ss.chip}>
                <Text style={ss.chipText}>{sk}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 5. WORK GALLERY ───────────────────────────────────────────────── */}
        <View style={[ss.card, { paddingHorizontal: 0, paddingBottom: 0, overflow: 'hidden' }]}>
          <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
            <SLabel text="Work Gallery" />
            <Text style={ss.galleryNote}>📷  Photos verified by clients</Text>
          </View>
          <View style={ss.photoGrid}>
            {PHOTOS.map((ph, i) => (
              <TouchableOpacity
                key={i}
                style={{ width: photoSize, height: photoSize, padding: 1 }}
                activeOpacity={0.8}
              >
                <View style={[ss.photoCell, { backgroundColor: ph.bg }]}>
                  <Text style={{ fontSize: 36 }}>{ph.emoji}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 6. VERIFIED WORK HISTORY ──────────────────────────────────────── */}
        <View style={ss.card}>
          <SLabel text="Verified Work History" />
          {verifiedJobs.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#888', paddingVertical: 8 }}>No verified work yet</Text>
          ) : verifiedJobs.map((job, i) => (
            <View key={i} style={[ss.jobRow, i < verifiedJobs.length - 1 && ss.jobRowBorder]}>
              <View style={{ flex: 1 }}>
                <View style={ss.jobTopLine}>
                  <Text style={ss.jobType}>{job.workType || job.description?.split(' ').slice(0, 4).join(' ') || 'Construction Work'}</Text>
                  <View style={ss.verBadge}>
                    <Text style={ss.verBadgeText}>✓ Verified</Text>
                  </View>
                </View>
                <Text style={ss.jobMeta}>📍 India  ·  {job.date || ''}</Text>
              </View>
              <Text style={ss.jobAmt}>₹{Number(job.amount || 0).toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={ss.viewAllBtn}
            onPress={() => navigation.navigate('WorkHistory')}
            activeOpacity={0.8}
          >
            <Text style={ss.viewAllText}>View Full Work History →</Text>
          </TouchableOpacity>
        </View>

        {/* ── 7. EXPERIENCE ─────────────────────────────────────────────────── */}
        <View style={ss.card}>
          <SLabel text="Experience" />
          <View style={ss.expRow}>
            <Text style={ss.expYears}>{WORKER.years} Years</Text>
            <Text style={ss.expIn}> in Electrical Work</Text>
          </View>
          <Text style={ss.expSub}>Residential  ·  Commercial  ·  Industrial Sites</Text>
        </View>

        {/* ── 8. PRICING ────────────────────────────────────────────────────── */}
        <View style={ss.card}>
          <SLabel text="Pricing" />
          <View style={ss.priceRow}>
            <View style={{ flex: 1 }}>
              <Text style={ss.priceLabel}>Daily Wage</Text>
              <Text style={ss.priceAmt}>
                {WORKER.dailyRate}
                <Text style={ss.priceUnit}>/day</Text>
              </Text>
            </View>
            <View style={ss.priceSep} />
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text style={ss.priceLabel}>Monthly Contract</Text>
              <Text style={ss.priceAvail}>Available on request</Text>
            </View>
          </View>
        </View>

        {/* ── 9. REVIEWS ────────────────────────────────────────────────────── */}
        <View style={ss.card}>
          <View style={ss.reviewsHeader}>
            <SLabel text={`Reviews (${WORKER.reviews})`} />
            <View style={ss.overallStars}>
              <Text style={ss.overallNum}>{WORKER.rating}</Text>
              <Text style={ss.overallStar}>★</Text>
            </View>
          </View>
          {REVIEWS.map((rv, i) => (
            <View key={i} style={[ss.reviewCard, i > 0 && { marginTop: 10 }]}>
              <Text style={ss.reviewQuote}>"{rv.text}"</Text>
              <View style={ss.reviewBottom}>
                <View>
                  <Text style={ss.reviewName}>{rv.name}</Text>
                  <Text style={ss.reviewCompany}>{rv.company}</Text>
                </View>
                <Text style={ss.reviewStars}>{'★'.repeat(rv.stars)}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={ss.viewAllBtn}
            onPress={() =>
              navigation.navigate('ReviewsList', {
                workerName: WORKER.name,
                workerEmoji: '👷',
                role: WORKER.designation,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={ss.viewAllText}>See all {WORKER.reviews} reviews →</Text>
          </TouchableOpacity>
        </View>

        {/* ── 10. LOCATION & AVAILABILITY ───────────────────────────────────── */}
        <View style={ss.card}>
          <SLabel text="Location & Availability" />
          <View style={ss.locRow}>
            <Text style={ss.locPin}>📍</Text>
            <Text style={ss.locCity}>Ahmedabad</Text>
          </View>
          <Text style={ss.locAreas}>Available in:  Ahmedabad · Gandhinagar · Anand</Text>
          <View style={ss.availStatusRow}>
            <View style={ss.availDot} />
            <Text style={ss.availStatusText}> Available Immediately</Text>
          </View>
        </View>

        {/* ── 11. BADGES ────────────────────────────────────────────────────── */}
        <View style={ss.card}>
          <SLabel text="Achievements" />
          <View style={ss.badgesWrap}>
            {[
              { icon: '🏆', label: 'Top Rated Worker' },
              { icon: '✓', label: 'Verified Electrician' },
              { icon: '✅', label: '50+ Jobs Done' },
            ].map((b, i) => (
              <View key={i} style={ss.achieveBadge}>
                <Text style={ss.achieveIcon}>{b.icon}</Text>
                <Text style={ss.achieveLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── 12. STICKY BOTTOM BAR ─────────────────────────────────────────── */}
      <View style={ss.bottomBar}>
        <TouchableOpacity style={ss.bottomHireBtn} onPress={handleChat} activeOpacity={0.85}>
          <Text style={ss.bottomHireBtnText}>Hire Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ss.bottomOutlineBtn} onPress={handleChat} activeOpacity={0.85}>
          <Text style={ss.bottomOutlineBtnText}>💬 Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={ss.bottomOutlineBtn}
          onPress={() => navigation.navigate('MarkWorkComplete', {
            workerName: displayWorker.name,
            workerRole: displayWorker.designation,
            workerEmoji: '👷',
            workerUid: viewUid,
          })}
          activeOpacity={0.85}
        >
          <Text style={ss.bottomOutlineBtnText}>✅ Work Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F0' },

  // ── 1. TOP NAV
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center',
  },
  navBack: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  navShare: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },

  // ── Shared card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14, marginTop: 12,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  sLabel: {
    fontSize: 9, color: '#888888', fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
  },
  divider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 12 },

  // ── 2. HERO
  heroCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#FFF3E0', borderWidth: 1.5, borderColor: '#FFE0C4',
    alignItems: 'center', justifyContent: 'center',
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  heroDesig: { fontSize: 13, fontWeight: '500', color: '#666666', marginBottom: 3 },
  heroLoc: { fontSize: 12, color: '#888888' },
  heroStrip: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  heroStripStar: { fontSize: 12, color: '#FFB830', fontWeight: '700' },
  heroStripMuted: { fontSize: 12, color: '#888888' },
  heroStripSep: { fontSize: 12, color: '#CCCCCC' },
  heroStripVerified: { fontSize: 12, color: '#2ECC71', fontWeight: '600' },
  heroStripItem: { fontSize: 12, color: '#333', fontWeight: '600' },
  availRow: { flexDirection: 'row', alignItems: 'center' },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ECC71' },
  availText: { fontSize: 12, color: '#2ECC71', fontWeight: '600' },
  heroActions: { flexDirection: 'row', gap: 8 },
  hireBtn: {
    flex: 1.5, height: 44, borderRadius: 14,
    backgroundColor: '#FF6B2B', alignItems: 'center', justifyContent: 'center',
  },
  hireBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  outlineBtn: {
    flex: 1, height: 44, borderRadius: 14,
    borderWidth: 2, borderColor: '#1A1A2E',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineBtnText: { color: '#1A1A2E', fontWeight: '700', fontSize: 13 },

  // ── 3. VERIFIED WORK CARD (dark navy)
  trustCard: {
    marginHorizontal: 14, marginTop: 12,
    borderRadius: 14, padding: 14,
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
  },
  trustTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  trustCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 2 },
  trustCardScore: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  trustScoreBadge: {
    backgroundColor: 'rgba(46,204,113,0.2)', borderRadius: 20,
    borderWidth: 1, borderColor: '#2ECC71',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  trustScoreBadgeText: { fontSize: 11, fontWeight: '800', color: '#2ECC71' },
  trustBarTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4,
    overflow: 'hidden', marginBottom: 14,
  },
  trustBarFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 4 },
  verEarningsBox: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    padding: 12, alignItems: 'center', marginBottom: 14,
  },
  verEarningsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginBottom: 4 },
  verEarningsAmt: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  verEarningsSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  trustStats: { flexDirection: 'row', alignItems: 'center' },
  trustStat: { flex: 1, alignItems: 'center' },
  trustStatVal: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 3 },
  trustStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  trustStatSep: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },

  // ── 4. SKILLS
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#F5F5F0', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  chipText: { fontSize: 12, color: '#1A1A1A', fontWeight: '600' },

  // ── 5. GALLERY
  galleryNote: { fontSize: 11, color: '#888888', marginTop: -4, marginBottom: 6 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  photoCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── 6. VERIFIED WORK HISTORY
  jobRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 10,
  },
  jobRowBorder: { borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  jobTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
  jobType: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  verBadge: {
    backgroundColor: '#F0FFF4', borderRadius: 20, borderWidth: 1,
    borderColor: '#2ECC71', paddingHorizontal: 7, paddingVertical: 2,
  },
  verBadgeText: { fontSize: 10, fontWeight: '800', color: '#2ECC71' },
  jobMeta: { fontSize: 11, color: '#888888' },
  jobAmt: { fontSize: 15, fontWeight: '800', color: '#2ECC71', minWidth: 64, textAlign: 'right' },
  viewAllBtn: {
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#EFEFEF',
    alignItems: 'center',
  },
  viewAllText: { fontSize: 13, fontWeight: '700', color: '#FF6B2B' },

  // ── 7. EXPERIENCE
  expRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  expYears: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  expIn: { fontSize: 15, fontWeight: '600', color: '#333' },
  expSub: { fontSize: 13, color: '#888888' },

  // ── 8. PRICING
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceLabel: { fontSize: 9, color: '#888888', fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1.5 },
  priceAmt: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  priceUnit: { fontSize: 14, fontWeight: '600', color: '#888888' },
  priceSep: { width: 1, height: 40, backgroundColor: '#EFEFEF' },
  priceAvail: { fontSize: 13, color: '#2ECC71', fontWeight: '600' },

  // ── 9. REVIEWS
  reviewsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallStars: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginBottom: 10 },
  overallNum: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  overallStar: { fontSize: 20, color: '#FFB830' },
  reviewCard: {
    backgroundColor: '#F5F5F0', borderRadius: 10,
    borderWidth: 1, borderColor: '#EFEFEF', padding: 12,
  },
  reviewQuote: { fontSize: 13, color: '#444', lineHeight: 19, fontStyle: 'italic', marginBottom: 10 },
  reviewBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  reviewName: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  reviewCompany: { fontSize: 11, color: '#888888' },
  reviewStars: { fontSize: 13, color: '#FFB830' },

  // ── 10. LOCATION
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  locPin: { fontSize: 16 },
  locCity: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  locAreas: { fontSize: 12, color: '#666666', marginBottom: 8 },
  availStatusRow: { flexDirection: 'row', alignItems: 'center' },
  availStatusText: { fontSize: 13, color: '#2ECC71', fontWeight: '700' },

  // ── 11. BADGES
  badgesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achieveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F5F5F0', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  achieveIcon: { fontSize: 14 },
  achieveLabel: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },

  // ── 12. STICKY BOTTOM BAR
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 14, paddingBottom: 28, paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#EFEFEF',
  },
  bottomHireBtn: {
    flex: 1.5, height: 48, borderRadius: 14,
    backgroundColor: '#FF6B2B', alignItems: 'center', justifyContent: 'center',
  },
  bottomHireBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  bottomOutlineBtn: {
    flex: 1, height: 48, borderRadius: 14,
    borderWidth: 2, borderColor: '#1A1A2E',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  bottomOutlineBtnText: { color: '#1A1A2E', fontWeight: '700', fontSize: 14 },
});
