import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import { getProfile, recordProfileView } from '../services/userService';
import {
  getPartyWorkRecords, workRecordToProject, workRecordToVerifiedWork, WORK_RECORD_STATUS,
} from '../services/workRecordService';
import ProjectDetailModal from '../components/ProjectDetailModal';
import AllProjectsModal from '../components/AllProjectsModal';
import PhotoViewer from '../components/PhotoViewer';
import ProfileCard from '../components/ProfileCard';
import ProfileScreenHeader from '../components/ProfileScreenHeader';
import { formatAmountIndian, formatJoinedDate } from '../utils/format';
import { getCurrentUid } from '../utils/session';
import { checkMutualBlock, confirmBlockUser } from '../utils/blocking';
import BlockedProfileNotice from '../components/BlockedProfileNotice';

const GREEN       = '#22A559';
const DEEP_GREEN   = '#1E874B';
const DARK          = '#262626';
const SCREEN_BG     = '#F2F2F2';
const FILL          = '#F2F2F2';
const BORDER        = '#E5E5E5';
const MID            = '#737373';
const LIGHT          = '#8E8E8E';
const FAINT          = '#B5B5B5';
const STAR           = '#FFB830';
const LINK_BLUE      = '#1877F2';

// ─── PROJECTS list — same preview pattern as Worker/Contractor/Professional ──
function projectSubline(p) {
  return [p.category, p.value ? formatAmountIndian(p.value) : null, p.isPartnership ? '🤝 Partnership' : null]
    .filter(Boolean).join(' · ');
}

const PROJECTS_PREVIEW_COUNT = 3;

function ProjectsList({ projects = [], onOpenProject }) {
  if (projects.length === 0) {
    return <Text style={s.placeholder}>No projects yet</Text>;
  }
  const visible = projects.slice(0, PROJECTS_PREVIEW_COUNT);
  return (
    <View>
      {visible.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={[pj.row, i > 0 && pj.rowBorder]}
          activeOpacity={0.7}
          onPress={() => onOpenProject(p)}
        >
          <View style={pj.thumb}>
            {p.photoUri ? (
              <Image source={{ uri: p.photoUri }} style={pj.thumbImg} resizeMode="cover" />
            ) : (
              <Text style={pj.thumbIcon}>🏗️</Text>
            )}
          </View>
          <View style={pj.info}>
            <Text style={pj.name} numberOfLines={1}>{p.name || 'Untitled project'}</Text>
            {projectSubline(p) ? <Text style={pj.meta} numberOfLines={1}>{projectSubline(p)}</Text> : null}
          </View>
          <View style={[pj.badge, p.status === 'ongoing' ? pj.badgeOngoing : pj.badgeDone]}>
            <Text style={[pj.badgeText, p.status === 'ongoing' ? pj.badgeTextOngoing : pj.badgeTextDone]}>
              {p.status === 'ongoing' ? 'ONGOING' : 'DONE'}
            </Text>
          </View>
          <Text style={pj.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const pj = injectFonts({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  thumb: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: FILL, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbIcon: { fontSize: 18, opacity: 0.5 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 2 },
  meta: { fontSize: 12, color: LIGHT, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeOngoing: { backgroundColor: '#FFF3E0' },
  badgeDone: { backgroundColor: '#EAF7EF' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextOngoing: { color: '#B26A00' },
  badgeTextDone: { color: '#1E874B' },
  chevron: { fontSize: 18, color: '#B5B5B5', marginLeft: 2 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function BusinessProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;
  const [loading, setLoading] = useState(true);
  const [liveProfile, setLiveProfile] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [verifiedAmt, setVerifiedAmt] = useState(0);
  const [verifiedWork, setVerifiedWork] = useState([]);
  const [realProjects, setRealProjects] = useState([]);
  const [projectDetail, setProjectDetail] = useState(null);
  const [allProjectsOpen, setAllProjectsOpen] = useState(false);
  const [viewer, setViewer] = useState({ visible: false, photos: [], index: 0 });
  const [myUid, setMyUid] = useState(null);

  const openViewer = (photos, index = 0) => setViewer({ visible: true, photos, index });
  const closeViewer = () => setViewer(v => ({ ...v, visible: false }));

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

      // Verified totals + projects come from work_records, same system
      // Worker/Contractor/Professional use. getPartyWorkRecords (not
      // getProviderWorkRecords) — includes records where `uid` is an
      // APPROVED partner, so a partner sees their share of a partnered
      // record on their own profile too.
      if (uid && !uid.startsWith('guest_')) {
        try {
          const records = await getPartyWorkRecords(uid);
          const confirmed = records.filter(r => r.status === WORK_RECORD_STATUS.VERIFIED || r.status === WORK_RECORD_STATUS.COMPLETED_PAID);
          const work = confirmed.map(r => workRecordToVerifiedWork(r, uid));
          setVerifiedAmt(work.reduce((sum, w) => sum + (w.amount || 0), 0));
          setVerifiedWork(work);
          setRealProjects(records.map(r => workRecordToProject(r, uid)));
        } catch (_) {}
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadProfile();
  }, []);

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
        name: liveProfile?.companyName || liveProfile?.name || 'Company',
        role: liveProfile?.companyType || 'Construction Company',
        emoji: '🏢',
        avatarBg: '#E8F5E9',
        online: false,
      }
    });
  };

  const handleOpenSettings = () => navigation.navigate('Settings');
  const handleEditProfile = () => navigation.navigate('EditProfile', { profileType: 'business' });

  const handleOpenLink = () => {
    const url = liveProfile?.businessWebsite;
    if (!url) return;
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.openURL(withScheme).catch(() => Alert.alert('Could not open link.'));
  };

  const isOwn = !viewUid || viewUid === myUid;

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={DARK} />
      </View>
    );
  }

  if (blocked) {
    return <BlockedProfileNotice onBack={() => navigation.goBack()} />;
  }

  if (!liveProfile && !viewUid) {
    return (
      <View style={[s.center, { paddingHorizontal: 32 }]}>
        <Text style={{ fontSize: 52, marginBottom: 16 }}>🏢</Text>
        <Text style={s.incompleteTitle}>Profile Incomplete</Text>
        <Text style={s.incompleteText}>
          Please complete your company profile to appear in search results and attract clients.
        </Text>
        <TouchableOpacity style={s.incompleteBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={s.incompleteBtnText}>Complete Profile →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────
  const name       = liveProfile?.companyName || liveProfile?.name || 'Add company name';
  const type       = liveProfile?.companyType || 'Add business type';
  const city       = liveProfile?.city || '';
  const state      = liveProfile?.state || '';
  const location   = [city, state].filter(Boolean).join(', ');
  const website    = liveProfile?.businessWebsite || '';
  const about      = liveProfile?.companyAbout || '';
  const joinedText = formatJoinedDate(liveProfile?.createdAt);
  const isVerified = !!liveProfile?.verified;
  const projects   = realProjects;

  const ratedWork = verifiedWork.filter(w => w.rating && w.rating > 0);
  const ratingCount = ratedWork.length;
  const ratingAvg = ratingCount > 0
    ? (ratedWork.reduce((sum, w) => sum + w.rating, 0) / ratingCount).toFixed(1)
    : null;

  const amtStr = formatAmountIndian(verifiedAmt);
  const jobsCount = verifiedWork.length;
  const onTimeRate = jobsCount > 0 ? (liveProfile?.onTimeRate || '—') : '—';

  const reviews = ratedWork
    .slice()
    .sort((a, b) => {
      const at = a.verifiedAt?.toMillis?.() ?? 0;
      const bt = b.verifiedAt?.toMillis?.() ?? 0;
      return bt - at;
    });

  return (
    <View style={s.screen}>
      <ProfileScreenHeader
        title="Company"
        onBack={() => navigation.goBack()}
        rightIcon={isOwn ? '⚙️' : '⋮'}
        onRightPress={isOwn ? handleOpenSettings : () => confirmBlockUser(myUid, viewUid, name, () => navigation.goBack())}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* ── HERO CARD ─────────────────────────────────────────────────── */}
        <ProfileCard>
          <View style={s.heroRow}>
            <TouchableOpacity
              style={s.logoBox}
              activeOpacity={0.8}
              onPress={() => liveProfile?.photoUri && openViewer([liveProfile.photoUri])}
            >
              {liveProfile?.photoUri ? (
                <Image source={{ uri: liveProfile.photoUri }} style={s.logoImg} />
              ) : (
                <Text style={{ fontSize: 34 }}>🏢</Text>
              )}
            </TouchableOpacity>
            <View style={s.heroInfo}>
              <View style={s.nameRow}>
                <Text style={s.heroName} numberOfLines={2}>{name}</Text>
                {isVerified && (
                  <View style={s.verifiedBadge}>
                    <Text style={s.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={s.typeAvailRow}>
            <Text style={s.heroType} numberOfLines={1}>{type}</Text>
          </View>

          {/* Location rows with green icons */}
          <Text style={s.heroLoc} numberOfLines={1}>
            {location ? `📍 ${location}` : '📍 Add your location'}
          </Text>
          {website ? (
            <TouchableOpacity onPress={handleOpenLink} activeOpacity={0.7}>
              <Text style={s.linkText} numberOfLines={1}>🔗 {website.replace(/^https?:\/\//i, '')}</Text>
            </TouchableOpacity>
          ) : null}

          {joinedText ? <Text style={s.joinedText}>{joinedText}</Text> : null}
        </ProfileCard>

        {/* ── COMPLETED WORK CARD ──────────────────────────────────────── */}
        <ProfileCard>
          <View style={s.verHeader}>
            <Text style={s.verLabel}>COMPLETED WORK</Text>
            {joinedText ? <Text style={s.verNote}>{joinedText}</Text> : null}
          </View>
          {isOwn && <Text style={s.verOwnerNote}>Verified from completed jobs — cannot be edited</Text>}
          <View style={s.verStats}>
            <View style={s.verStat}>
              <Text style={s.verStatAmt}>{amtStr}</Text>
              <Text style={s.verStatLbl}>Revenue</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{jobsCount}</Text>
              <Text style={s.verStatLbl}>Projects</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{onTimeRate}</Text>
              <Text style={s.verStatLbl}>On-time</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>
                {jobsCount === 0 ? 'New' : ratingCount > 0 ? (<><Text style={s.ratingStar}>★</Text> {ratingAvg}</>) : '—'}
              </Text>
              <Text style={s.verStatLbl}>Rating</Text>
            </View>
          </View>
        </ProfileCard>

        {/* ── ACTIONS ───────────────────────────────────────────────────── */}
        <View style={s.actionRow}>
          {isOwn ? (
            <>
              <TouchableOpacity style={s.pillBtnOutline} onPress={handleEditProfile} activeOpacity={0.85}>
                <Text style={s.pillBtnOutlineText}>✏️  Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.pillBtnPrimary}
                onPress={() => navigation.push('CreateWorkRecord')}
                activeOpacity={0.85}
              >
                <Text style={s.pillBtnPrimaryText}>🧾  New Work Record</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={s.pillBtnOutline} onPress={handleChat} activeOpacity={0.85}>
              <Text style={s.pillBtnOutlineText}>💬 Chat</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── PROJECTS CARD ─────────────────────────────────────────────── */}
        <ProfileCard>
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>
              PROJECTS{jobsCount > 0 ? ` (${jobsCount})` : ''}
            </Text>
            <View style={s.sectionHeadRight}>
              {projects.length > 0 && (
                <TouchableOpacity onPress={() => setAllProjectsOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.viewAllLink}>View all</Text>
                </TouchableOpacity>
              )}
              {isOwn && (
                <TouchableOpacity onPress={() => navigation.navigate('MyWorkRecords')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.viewAllLink}>My Work Records</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ProjectsList projects={projects} onOpenProject={setProjectDetail} />
        </ProfileCard>

        {/* ── ABOUT CARD ────────────────────────────────────────────────── */}
        <ProfileCard>
          <Text style={[s.sLabel, { marginBottom: 12 }]}>ABOUT</Text>
          <Text style={about ? s.aboutText : s.placeholder}>
            {about || 'Add a short description to attract more clients'}
          </Text>
        </ProfileCard>

        {/* ── REVIEWS CARD ──────────────────────────────────────────────── */}
        <ProfileCard>
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>REVIEWS</Text>
            {ratingCount > 0 && (
              <Text style={s.reviewsSummary}>★ {ratingAvg} · {ratingCount} review{ratingCount === 1 ? '' : 's'}</Text>
            )}
          </View>
          {reviews.length === 0 ? (
            <Text style={s.placeholder}>No reviews yet</Text>
          ) : (
            reviews.map((r, i) => (
              <View key={r.id || i} style={[s.reviewRow, i > 0 && s.reviewRowBorder]}>
                <View style={s.reviewTop}>
                  <Text style={s.reviewName} numberOfLines={2}>{r.customerName || 'Customer'}</Text>
                  <Text style={s.reviewDate}>{r.date || ''}</Text>
                </View>
                <View style={s.reviewStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Text key={star} style={[s.reviewStarIcon, star <= r.rating && s.reviewStarActive]}>
                      {star <= r.rating ? '★' : '☆'}
                    </Text>
                  ))}
                </View>
                {r.review ? <Text style={s.reviewComment}>"{r.review}"</Text> : null}
              </View>
            ))
          )}
        </ProfileCard>

      </ScrollView>

      <ProjectDetailModal
        visible={!!projectDetail}
        project={projectDetail}
        onClose={() => setProjectDetail(null)}
        onViewPhoto={(photos, index) => openViewer(photos, index)}
      />

      <AllProjectsModal
        visible={allProjectsOpen}
        projects={projects}
        verifiedCount={jobsCount}
        onClose={() => setAllProjectsOpen(false)}
        onOpenProject={setProjectDetail}
      />

      <PhotoViewer
        visible={viewer.visible}
        photos={viewer.photos}
        initialIndex={viewer.index}
        onClose={closeViewer}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = injectFonts({
  screen: { flex: 1, backgroundColor: SCREEN_BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: SCREEN_BG },

  incompleteTitle: { fontSize: 20, fontWeight: '700', color: DARK, marginBottom: 8, textAlign: 'center' },
  incompleteText: { fontSize: 14, color: LIGHT, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  incompleteBtn: { backgroundColor: DARK, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 24 },
  incompleteBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // ── HERO
  heroRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  logoBox: {
    width: 72, height: 72, borderRadius: 14,
    backgroundColor: FILL, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  logoImg: { width: 72, height: 72, borderRadius: 14 },
  heroInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  heroName: { fontSize: 18, fontWeight: '700', color: DARK, flexShrink: 1, lineHeight: 22 },
  verifiedBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: LINK_BLUE, alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { fontSize: 10, color: '#fff', fontWeight: '900' },
  typeAvailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  heroType: { flex: 1, fontSize: 13, fontWeight: '600', color: DARK },

  // ── LOCATION
  heroLoc:    { fontSize: 12, color: GREEN, fontWeight: '500', marginTop: 4 },
  linkText: { fontSize: 13, fontWeight: '600', color: LINK_BLUE, marginTop: 10 },
  joinedText: { fontSize: 11, fontWeight: '400', color: LIGHT, marginTop: 6 },

  // ── COMPLETED WORK
  verHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  verLabel: { fontSize: 11, fontWeight: '600', color: MID, letterSpacing: 0.8 },
  verNote:  { fontSize: 10, color: LIGHT, fontWeight: '500' },
  verOwnerNote: { fontSize: 10, color: LIGHT, fontWeight: '500', marginBottom: 10 },
  verStats: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  verStat:  { flex: 1, alignItems: 'center' },
  verStatAmt: { fontSize: 16, fontWeight: '700', color: GREEN, marginBottom: 2 },
  verStatVal: { fontSize: 16, fontWeight: '700', color: DEEP_GREEN, marginBottom: 2 },
  verStatLbl: { fontSize: 10, fontWeight: '500', color: LIGHT },
  verStatSep: { width: 1, height: 28, backgroundColor: BORDER },
  ratingStar: { color: STAR },

  // ── ACTIONS — outlined pill buttons in a row, floating between cards
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 4, paddingHorizontal: 14 },
  pillBtnOutline: {
    flex: 1, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  pillBtnOutlineText: { color: DARK, fontWeight: '600', fontSize: 13 },
  pillBtnPrimary: {
    flex: 1, height: 48, borderRadius: 24,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  pillBtnPrimaryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },

  // ── SECTION LABEL (shared)
  sLabel: { fontSize: 11, fontWeight: '600', color: LIGHT, letterSpacing: 1, marginBottom: 12 },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  viewAllLink: { fontSize: 12, fontWeight: '700', color: GREEN },
  placeholder: { fontSize: 13, color: FAINT, fontStyle: 'italic' },

  // ── ABOUT
  aboutText: { fontSize: 14, color: MID, lineHeight: 22 },

  // ── REVIEWS
  reviewsSummary: { fontSize: 12, fontWeight: '700', color: MID },
  reviewRow: { paddingVertical: 12 },
  reviewRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reviewName: { fontSize: 13, fontWeight: '700', color: DARK, flex: 1, flexShrink: 1, lineHeight: 16 },
  reviewDate: { fontSize: 11, color: LIGHT, fontWeight: '500', flexShrink: 0, marginLeft: 8 },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 6 },
  reviewStarIcon: { fontSize: 14, color: BORDER },
  reviewStarActive: { color: STAR },
  reviewComment: { fontSize: 13, color: MID, lineHeight: 20, fontStyle: 'italic' },
});
