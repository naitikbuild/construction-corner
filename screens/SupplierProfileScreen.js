import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile, recordProfileView } from '../services/userService';
import {
  getPartyWorkRecords, workRecordToProject, getWorkRecordShareAmount, getClientReviews, WORK_RECORD_STATUS,
} from '../services/workRecordService';
import ClientReviewsSection from '../components/ClientReviewsSection';
import ProjectDetailModal from '../components/ProjectDetailModal';
import PhotoViewer from '../components/PhotoViewer';
import { formatAmountIndian } from '../utils/format';
import { getCurrentUid } from '../utils/session';
import { checkMutualBlock, confirmBlockUser } from '../utils/blocking';
import BlockedProfileNotice from '../components/BlockedProfileNotice';

// ─── Orange Gradient Button ───────────────────────────────────────────────────
function GradBtn({ label, subLabel, onPress }) {
  return (
    <TouchableOpacity style={ss.gradWrap} onPress={onPress} activeOpacity={0.88}>
      <View style={ss.gradBg} pointerEvents="none">
        {['#FF6B2B', '#FF7A35', '#FF8840', '#FF8C00'].map((c, i) => (
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
  name: 'Shree Cement Agency',
  category: 'Cement & Building Materials',
  location: 'Odhav, Ahmedabad, Gujarat',
  logo: '🏗️',
  score: 91,
  orders: 280,
  deliveryRadius: '25 km',
  experience: '15 Yrs',
  about: 'Authorised dealer of ACC, UltraTech & Shree Cement brands. Serving construction professionals and self-builders across Ahmedabad for 15+ years. Same-day delivery available.',
};

const HIGHLIGHTS = [
  { emoji: '📋', label: 'Catalogue', color: '#833AB4' },
  { emoji: '⭐', label: 'Reviews', color: '#FD1D1D' },
  { emoji: '🚛', label: 'Delivery', color: '#F77737' },
  { emoji: '📦', label: 'Orders', color: '#4CAF50' },
  { emoji: '🏷️', label: 'Brands', color: '#0EA5E9' },
];

const MATERIALS = [
  { name: 'OPC 53 Grade Cement', brand: 'UltraTech', price: '₹340', unit: '/bag (50 kg)' },
  { name: 'PPC Cement', brand: 'ACC', price: '₹320', unit: '/bag (50 kg)' },
  { name: 'PSC Cement (Slag)', brand: 'Shree', price: '₹295', unit: '/bag (50 kg)' },
  { name: 'White Cement', brand: 'JK White', price: '₹520', unit: '/bag (50 kg)' },
  { name: 'AAC Blocks (6")', brand: 'Siporex', price: '₹45', unit: '/piece' },
  { name: 'Solid Concrete Block', brand: 'Local', price: '₹28', unit: '/piece' },
  { name: 'River Sand (M-Sand)', brand: '—', price: '₹1,800', unit: '/tonne' },
  { name: 'Coarse Aggregate (20mm)', brand: '—', price: '₹1,500', unit: '/tonne' },
  { name: 'Fine Aggregate (10mm)', brand: '—', price: '₹1,400', unit: '/tonne' },
  { name: 'Fly Ash Bricks', brand: 'Local', price: '₹6', unit: '/piece' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SupplierProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const viewUid = route?.params?.uid ?? null;
  const [activeTab, setActiveTab] = useState('Price List');
  const [loading, setLoading] = useState(true);
  const [liveProfile, setLiveProfile] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [verifiedAmt, setVerifiedAmt] = useState('');
  const [verifiedJobsCount, setVerifiedJobsCount] = useState(0);
  const [realProjects, setRealProjects] = useState([]);
  const [projectDetail, setProjectDetail] = useState(null);
  const [viewer, setViewer] = useState({ visible: false, photos: [], index: 0 });
  const [clientReviews, setClientReviews] = useState([]);
  const [myUid, setMyUid] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Prefer the live Firebase Auth uid over the cached AsyncStorage copy —
      // the two can drift (e.g. a stale 'uid' left from an earlier session),
      // which broke owner detection and made this provider's own saved work
      // records invisible to their own profile. Guests have no
      // auth.currentUser, so they fall back to the cache (see utils/session.js's
      // getCurrentUid — the one shared resolver).
      const me = await getCurrentUid();
      const uid = viewUid || me;
      setMyUid(me);
      if (!uid) { setLoading(false); return; }
      if (uid !== me) recordProfileView(uid, me);
      const profile = await getProfile(uid);
      if (profile) setLiveProfile(profile);

      if (uid !== me) {
        try { setBlocked(await checkMutualBlock(me, uid, profile?.blockedUsers)); } catch (_) {}
      }

      // Verified totals + projects now come from work_records, same system
      // Worker/Contractor/Professional use — no demo Business/Supplier
      // profiles exist today, so this is always the real-data path.
      if (uid && !uid.startsWith('guest_')) {
        try {
          // getPartyWorkRecords (not getProviderWorkRecords) — includes
          // records where `uid` is an APPROVED partner, so a partner sees
          // their share of a partnered record on their own profile too.
          const records = await getPartyWorkRecords(uid);
          const confirmed = records.filter(r => r.status === WORK_RECORD_STATUS.VERIFIED || r.status === WORK_RECORD_STATUS.COMPLETED_PAID);
          const total = confirmed.reduce((sum, r) => sum + getWorkRecordShareAmount(r, uid), 0);
          setVerifiedAmt(total > 0 ? `₹${total.toLocaleString('en-IN')}` : '₹0');
          setVerifiedJobsCount(confirmed.length);
          setRealProjects(records.map(r => workRecordToProject(r, uid)));
        } catch (_) {}
        try { setClientReviews(await getClientReviews(uid)); } catch (_) { setClientReviews([]); }
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  const openPhotoViewer = (photos, index = 0) => setViewer({ visible: true, photos, index });

  const handleChat = () => {
    if (!viewUid || viewUid === myUid) return;
    if (!myUid || myUid.startsWith('guest_')) {
      Alert.alert(
        'Sign in to chat',
        'Create a free account or sign in to start chatting with providers.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login', { initialScreen: 'login' }) },
        ]
      );
      return;
    }
    // ChatScreen creates the chat itself from conversation.uid — no need to
    // pre-create it here (that redundant call was the thing failing silently).
    // push, not navigate — guarantees a fresh ChatScreen mount for this
    // conversation instead of reusing a stale instance already on the stack.
    navigation.push('Chat', {
      conversation: {
        uid: viewUid,
        name: liveProfile?.companyName || liveProfile?.name || 'Supplier',
        role: liveProfile?.supplierCategory || 'Supplier',
        emoji: '🏭',
        avatarBg: '#E3F2FD',
        online: false,
      }
    });
  };

  const display = {
    name: liveProfile?.companyName || liveProfile?.name || 'Add business name',
    category: liveProfile?.supplierCategory || liveProfile?.designation || 'Add category',
    location: [liveProfile?.city, liveProfile?.state].filter(Boolean).join(', ') || 'Add location',
    verified: verifiedAmt || '₹0',
  };

  const isOwn = !viewUid || viewUid === myUid;

  if (loading) {
    return (
      <View style={[ss.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B2B" />
        <Text style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Loading profile...</Text>
      </View>
    );
  }

  if (blocked) {
    return <BlockedProfileNotice onBack={() => navigation.goBack()} />;
  }

  if (!liveProfile && !viewUid) {
    return (
      <View style={[ss.screen, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 52, marginBottom: 16 }}>🏭</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 8, textAlign: 'center' }}>Profile Incomplete</Text>
        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
          Please complete your supplier profile to appear in search results and attract buyers.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#FF6B2B', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 }}
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
        <Text style={ss.headerTitle}>Supplier Profile</Text>
        {isOwn ? (
          <TouchableOpacity style={ss.moreBtn} onPress={() => Alert.alert('Options')}>
            <Text style={ss.moreIcon}>⋯</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={ss.moreBtn}
            onPress={() => confirmBlockUser(myUid, viewUid, liveProfile?.companyName || liveProfile?.name, () => navigation.goBack())}
          >
            <Text style={ss.moreIcon}>⋯</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HERO CARD */}
        <View style={ss.heroCard}>
          <View style={ss.companyLogoWrap}>
            <Text style={{ fontSize: 46 }}>{PROFILE.logo}</Text>
          </View>

          <Text style={ss.profileName}>{display.name}</Text>
          <Text style={ss.profileDesig}>{display.category}</Text>
          <Text style={ss.profileLoc}>📍 {display.location}</Text>

          <View style={ss.badgesRow}>
            <View style={[ss.badge, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
              <Text style={[ss.badgeText, { color: '#2E7D32' }]}>✓ GST Verified</Text>
            </View>
            <View style={[ss.badge, { backgroundColor: '#E3F2FD', borderColor: '#1E88E5' }]}>
              <Text style={[ss.badgeText, { color: '#1565C0' }]}>🏪 Authorised Dealer</Text>
            </View>
          </View>
        </View>

        {/* STATS */}
        <View style={ss.statsCard}>
          {[
            { value: `${PROFILE.orders}+`, label: 'Orders' },
            { value: PROFILE.deliveryRadius, label: 'Delivery' },
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

        {/* VERIFIED ORDERS DONE */}
        <View style={ss.verifiedCard}>
          <View style={ss.verifiedHeader}>
            <Text style={ss.verifiedHeaderTxt}>✅  Verified Orders Done  ·  Cannot be edited</Text>
          </View>
          <View style={ss.verifiedBody}>
            <View style={ss.verifiedStat}>
              <Text style={ss.verifiedAmt}>{display.verified}</Text>
              <Text style={ss.verifiedLbl}>Total Orders Value</Text>
            </View>
            <View style={ss.verifiedDivider} />
            <View style={ss.verifiedStat}>
              <Text style={ss.verifiedAmt}>{verifiedJobsCount}</Text>
              <Text style={ss.verifiedLbl}>Orders Completed</Text>
            </View>
          </View>
          <TouchableOpacity style={ss.viewHistoryBtn} onPress={() => setActiveTab('Projects')}>
            <Text style={ss.viewHistoryText}>View Full History →</Text>
          </TouchableOpacity>
          {isOwn && (
            <TouchableOpacity style={ss.viewHistoryBtn} onPress={() => navigation.navigate('MyWorkRecords')}>
              <Text style={ss.viewHistoryText}>My Work Records →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LINKS */}
        <View style={ss.linksSection}>
          <Text style={ss.sectionTitle}>Contact & Links</Text>
          <View style={ss.linksGrid}>
            {[
              { icon: '🌐', label: 'Website', color: '#E3F2FD', border: '#90CAF9' },
              { icon: '📍', label: 'Google Maps', color: '#FCE4EC', border: '#F48FB1' },
              { icon: '💬', label: 'WhatsApp\nBusiness', color: '#E8F5E9', border: '#A5D6A7' },
            ].map((l, i) => (
              <TouchableOpacity key={i} style={[ss.bigLinkBtn, { backgroundColor: l.color, borderColor: l.border }]} onPress={() => Alert.alert('Opening ' + l.label)}>
                <Text style={{ fontSize: 26, marginBottom: 4 }}>{l.icon}</Text>
                <Text style={ss.bigLinkLabel}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
                    role: PROFILE.category,
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

        {/* TAB BAR */}
        <View style={ss.tabBar}>
          {['Price List', 'Projects', 'About', 'Reviews'].map(t => (
            <TouchableOpacity key={t} style={[ss.tab, activeTab === t && ss.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[ss.tabText, activeTab === t && ss.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MATERIALS PRICE LIST */}
        {activeTab === 'Price List' && (
          <View style={ss.priceListWrap}>
            {/* Header row */}
            <View style={ss.priceRowHead}>
              <Text style={[ss.priceColMat, { color: '#555', fontSize: 11 }]}>Material</Text>
              <Text style={[ss.priceColBrand, { color: '#555', fontSize: 11 }]}>Brand</Text>
              <Text style={[ss.priceColPrice, { color: '#555', fontSize: 11 }]}>Price</Text>
            </View>
            {MATERIALS.map((m, i) => (
              <View key={i} style={[ss.priceRow, i % 2 === 0 && { backgroundColor: '#FAFAFA' }]}>
                <View style={ss.priceColMat}>
                  <Text style={ss.matName}>{m.name}</Text>
                  <Text style={ss.matUnit}>{m.unit}</Text>
                </View>
                <Text style={ss.priceColBrand}>{m.brand}</Text>
                <Text style={ss.priceColPrice}>{m.price}</Text>
              </View>
            ))}
            <Text style={ss.priceNote}>* Prices subject to market rates. Call to confirm.</Text>
          </View>
        )}

        {/* PAST PROJECTS — from work_records, same system Worker/Contractor/
            Professional use. Only 'confirmed' records read as Completed;
            locked-but-unconfirmed ones still show, as Ongoing. */}
        {activeTab === 'Projects' && (
          <View style={{ paddingHorizontal: 14, paddingTop: 12, gap: 10 }}>
            {realProjects.length === 0 ? (
              <Text style={ss.projectsEmptyText}>No verified projects yet</Text>
            ) : (
              realProjects.map((p, i) => {
                const isDone = p.status === 'done';
                return (
                  <TouchableOpacity
                    key={p.id || i}
                    style={[ss.projectCard, { backgroundColor: isDone ? '#E8F5E9' : '#FFF3E0' }]}
                    activeOpacity={0.85}
                    onPress={() => setProjectDetail(p)}
                  >
                    <View style={ss.projectLogoWrap}>
                      <Text style={{ fontSize: 32 }}>🏗️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <Text style={ss.projectName} numberOfLines={1}>{p.name || 'Untitled project'}</Text>
                        <View style={[ss.statusBadge, { backgroundColor: isDone ? '#C8E6C9' : '#FFF9C4' }]}>
                          <Text style={[ss.statusText, { color: isDone ? '#2E7D32' : '#F57F17' }]}>{isDone ? 'Completed' : 'Ongoing'}</Text>
                        </View>
                      </View>
                      {p.location ? <Text style={ss.projectLoc}>📍 {p.location}</Text> : null}
                      {p.isPartnership ? <Text style={ss.projectPartnership}>🤝 Partnership</Text> : null}
                    </View>
                    <Text style={ss.projectValue}>{p.value ? formatAmountIndian(p.value) : '—'}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'About' && (
          <View style={ss.aboutCard}>
            <Text style={ss.aboutText}>{PROFILE.about}</Text>
          </View>
        )}

        {activeTab === 'Reviews' && (
          <View style={ss.reviewsCard}>
            <ClientReviewsSection reviews={clientReviews} />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ACTION BAR */}
      <View style={[ss.bookBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {isOwn && (
          <TouchableOpacity
            style={ss.newRecordBtn}
            onPress={() => navigation.push('CreateWorkRecord')}
            activeOpacity={0.85}
          >
            <Text style={ss.newRecordBtnText}>🧾 New{'\n'}Work Record</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <GradBtn
            label="Contact Now"
            subLabel="Send message"
            onPress={handleChat}
          />
        </View>
      </View>

      <ProjectDetailModal
        visible={!!projectDetail}
        project={projectDetail}
        onClose={() => setProjectDetail(null)}
        onViewPhoto={openPhotoViewer}
      />
      <PhotoViewer
        visible={viewer.visible}
        photos={viewer.photos}
        initialIndex={viewer.index}
        onClose={() => setViewer(v => ({ ...v, visible: false }))}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = injectFonts({
  screen: { flex: 1, backgroundColor: '#F5F5F0' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: '#F5F5F0', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: '#1A1A1A', fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  moreBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  moreIcon: { fontSize: 20, color: '#1A1A1A', letterSpacing: 1 },

  heroCard: { backgroundColor: '#FFFFFF', margin: 14, borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#EFEFEF', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  companyLogoWrap: { width: 90, height: 90, borderRadius: 18, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#EFEFEF', marginBottom: 12 },
  profileName: { fontSize: 19, fontWeight: '800', color: '#1A1A1A', marginBottom: 4, textAlign: 'center' },
  profileDesig: { fontSize: 13, fontWeight: '600', color: '#666666', marginBottom: 4 },
  profileLoc: { fontSize: 13, color: '#888888', marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#EFEFEF', overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderRightWidth: 1, borderRightColor: '#EFEFEF' },
  statVal: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  statLbl: { fontSize: 10, color: '#888888', fontWeight: '600' },

  scorePad: { marginHorizontal: 14, marginTop: 12, marginBottom: 4 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  scoreLabel: { fontSize: 12, fontWeight: '700', color: '#666666' },
  scoreNum: { fontSize: 12, fontWeight: '800', color: '#2ECC71' },
  scoreTrack: { height: 10, backgroundColor: '#EFEFEF', borderRadius: 5, overflow: 'hidden' },

  verifiedCard: { marginHorizontal: 14, marginTop: 14, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1A1A2E' },
  verifiedHeader: { paddingVertical: 8, paddingHorizontal: 14 },
  verifiedHeaderTxt: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 11, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  verifiedBody: { flexDirection: 'row', paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.04)' },
  verifiedStat: { flex: 1, alignItems: 'center' },
  verifiedAmt: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  verifiedLbl: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 2 },
  verifiedDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  linksSection: { marginHorizontal: 14, marginTop: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', borderLeftWidth: 3, borderLeftColor: '#FF6B2B', paddingLeft: 8, marginBottom: 12 },
  linksGrid: { flexDirection: 'row', gap: 10 },
  bigLinkBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5 },
  bigLinkLabel: { fontSize: 11, fontWeight: '700', color: '#333', textAlign: 'center', lineHeight: 15 },

  highlightsContent: { paddingHorizontal: 14, paddingVertical: 16, gap: 14 },
  highlight: { alignItems: 'center', gap: 6 },
  highlightRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  highlightCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center' },
  highlightLabel: { fontSize: 10, fontWeight: '700', color: '#666666' },

  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EFEFEF', backgroundColor: '#FFFFFF', marginTop: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FF6B2B' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888888' },
  tabTextActive: { color: '#FF6B2B', fontWeight: '800' },

  priceListWrap: { backgroundColor: '#FFFFFF', marginHorizontal: 14, marginTop: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EFEFEF' },
  priceRowHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F5F5F0', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  priceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  priceColMat: { flex: 2 },
  priceColBrand: { flex: 1, fontSize: 11, color: '#888888', fontWeight: '600', textAlign: 'center' },
  priceColPrice: { flex: 1, fontSize: 14, fontWeight: '800', color: '#FFB830', textAlign: 'right' },
  matName: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', lineHeight: 16 },
  matUnit: { fontSize: 10, color: '#888888', marginTop: 1 },
  priceNote: { fontSize: 10, color: '#AAAAAA', padding: 12, fontStyle: 'italic' },

  aboutCard: { backgroundColor: '#FFFFFF', marginHorizontal: 14, marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EFEFEF' },
  aboutText: { fontSize: 13, color: '#666666', lineHeight: 20 },
  reviewsCard: { backgroundColor: '#FFFFFF', marginHorizontal: 14, marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EFEFEF' },

  gradWrap: { borderRadius: 14, overflow: 'hidden', height: 56 },
  gradBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  gradContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gradLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 17 },
  gradSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', marginTop: 2 },

  bookBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EFEFEF' },
  viewHistoryBtn: { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  viewHistoryText: { fontSize: 12, fontWeight: '800', color: '#FF6B2B' },
  newRecordBtn: { width: 84, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FFF4', borderWidth: 2, borderColor: '#2ECC71' },
  newRecordBtnText: { fontSize: 11, fontWeight: '800', color: '#2ECC71', textAlign: 'center', lineHeight: 16 },

  projectCard: { flexDirection: 'row', borderRadius: 16, padding: 14, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#EFEFEF' },
  projectLogoWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  projectName: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', flexShrink: 1 },
  projectLoc: { fontSize: 11, color: '#666666', marginTop: 2 },
  projectPartnership: { fontSize: 11, color: '#22A559', fontWeight: '700', marginTop: 2 },
  projectValue: { fontSize: 15, fontWeight: '800', color: '#FFB830' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  projectsEmptyText: { fontSize: 13, color: '#888888', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
});
