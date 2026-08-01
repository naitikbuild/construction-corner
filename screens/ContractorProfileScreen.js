import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Linking,
  Image, Animated, Switch,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PhotoViewer from '../components/PhotoViewer';
import ProjectDetailModal from '../components/ProjectDetailModal';
import AllProjectsModal from '../components/AllProjectsModal';
import { useAutoHideHeader } from '../hooks/useAutoHideHeader';
import { useToast } from '../hooks/useToast';
import { getProfile, recordProfileView, updateProfile } from '../services/userService';
import { getVerifiedWork, getTotalVerifiedAmount } from '../services/workService';
import { getProviderWorkRecords, workRecordToProject, workRecordToVerifiedWork, getClientReviews, WORK_RECORD_STATUS } from '../services/workRecordService';
import ClientReviewsSection from '../components/ClientReviewsSection';
import { formatAmountIndian, formatJoinedDate } from '../utils/format';
import { auth } from '../config/firebase';


// ─── Status pill (Taking new projects / Not taking projects) ───────────────
function StatusPill({ available }) {
  return available ? (
    <View style={s.chipAvail}>
      <View style={s.chipDot} />
      <Text style={s.chipAvailText}>Taking new projects</Text>
    </View>
  ) : (
    <View style={s.chipBusy}>
      <Text style={s.chipBusyText}>Not taking projects</Text>
    </View>
  );
}

// ─── CREW: stacked avatars + count bubble ──────────────────────────────────
function CrewRow({ teamSize, trades }) {
  const n = Number(teamSize) || 0;
  if (n <= 0) {
    return <Text style={s.placeholder}>Add your crew details</Text>;
  }
  const shown = Math.min(n, 3);
  const extra = n - shown;
  const tradesText = trades.length > 0 ? trades.slice(0, 2).join(', ') : 'General crew';
  return (
    <View>
      <View style={cw.stack}>
        {Array.from({ length: shown }).map((_, i) => (
          <View key={i} style={[cw.avatar, i > 0 && { marginLeft: -12 }]}>
            <Text style={cw.avatarIcon}>👷</Text>
          </View>
        ))}
        {extra > 0 && (
          <View style={[cw.avatar, cw.avatarBubble, { marginLeft: -12 }]}>
            <Text style={cw.bubbleText}>+{extra}</Text>
          </View>
        )}
      </View>
      <Text style={cw.crewText}>{n} worker{n === 1 ? '' : 's'} · {tradesText}</Text>
    </View>
  );
}

const cw = injectFonts({
  stack: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F2F2F2', borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 17 },
  avatarBubble: { backgroundColor: '#262626' },
  bubbleText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  crewText: { fontSize: 13, fontWeight: '500', color: '#737373', marginTop: 10 },
});

// ─── SERVICES chips ─────────────────────────────────────────────────────────
function ServicesChips({ services = [] }) {
  if (services.length === 0) {
    return <Text style={s.placeholder}>Add services</Text>;
  }
  return (
    <View style={s.chipsWrap}>
      {services.map((sv, i) => (
        <View key={i} style={s.hashChip}>
          <Text style={s.hashChipText}>{sv}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── PROJECTS list ──────────────────────────────────────────────────────────
// Category + amount reads better than location for scanning a list —
// "Residential · ₹18.5L" tells a client type + scale at a glance.
function projectSubline(p) {
  return [p.category, p.value ? formatAmountIndian(p.value) : null].filter(Boolean).join(' · ');
}

const PROJECTS_PREVIEW_COUNT = 3;

function ProjectsList({ projects = [], onOpenProject }) {
  if (projects.length === 0) {
    return <Text style={s.placeholder}>Add your projects</Text>;
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
  rowBorder: { borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  thumb: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbIcon: { fontSize: 18, opacity: 0.5 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: '#262626', marginBottom: 2 },
  meta: { fontSize: 12, color: '#8E8E8E', fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeOngoing: { backgroundColor: '#FFF3E0' },
  badgeDone: { backgroundColor: '#EAF7EF' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextOngoing: { color: '#B26A00' },
  badgeTextDone: { color: '#1E874B' },
  chevron: { fontSize: 18, color: '#B5B5B5', marginLeft: 2 },
});

// ─── GALLERY grid ───────────────────────────────────────────────────────────
// Slot size is measured from the grid container's ACTUAL laid-out width via
// onLayout, not guessed from useWindowDimensions() minus assumed padding —
// the guessed chrome (sheet marginHorizontal/padding) can be wrong relative
// to the real rendered content box, which is what was still causing the 3rd
// tile to wrap. Measuring the real container removes the guesswork entirely.
const GRID_GAP = 8;

function GalleryGrid({ items = [], isOwn, onAdd, onReplace, onRemove, onView }) {
  const [gridWidth, setGridWidth] = useState(0);
  const slotSize = gridWidth > 0 ? Math.floor((gridWidth - GRID_GAP * 2) / 3) - 1 : 0;
  const slotBox = { width: slotSize, height: slotSize };

  const filled = items.slice(0, 6);
  const slots = [...filled, ...Array(Math.max(0, 6 - filled.length)).fill(null)];
  return (
    <View style={gl.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
      {gridWidth === 0 ? null : slots.map((item, i) => (
        <View key={i} style={[gl.tile, { width: slotSize }]}>
          {item?.uri ? (
            <TouchableOpacity style={[gl.imgWrap, slotBox]} activeOpacity={0.85} onPress={() => onView(i)}>
              <Image source={{ uri: item.uri }} style={[gl.thumb, slotBox]} resizeMode="cover" />
              {!isOwn && item.caption ? (
                <Text style={gl.caption} numberOfLines={1}>{item.caption}</Text>
              ) : null}
              {isOwn && (
                <>
                  <TouchableOpacity style={gl.replaceBtn} onPress={() => onReplace(i)}>
                    <Text style={gl.replaceBtnText}>🔄</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={gl.removeBtn} onPress={() => onRemove(i)}>
                    <Text style={gl.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          ) : isOwn ? (
            <TouchableOpacity style={[gl.addTile, slotBox]} onPress={onAdd} activeOpacity={0.7}>
              <Text style={gl.addTileIcon}>+</Text>
            </TouchableOpacity>
          ) : (
            <View style={[gl.placeholder, slotBox]}>
              <Text style={gl.placeholderIcon}>🖼️</Text>
              <Text style={gl.placeholderText}>browse</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const gl = injectFonts({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {},
  imgWrap: {},
  thumb: { borderRadius: 10 },
  caption: { fontSize: 10, color: '#8E8E8E', fontWeight: '500', marginTop: 4 },
  placeholder: {
    borderRadius: 10,
    backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 18, opacity: 0.35, marginBottom: 2 },
  placeholderText: { fontSize: 10, color: '#B5B5B5', fontWeight: '600' },
  addTile: {
    borderRadius: 10,
    backgroundColor: '#F2F2F2', borderWidth: 1.5, borderColor: '#E5E5E5', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addTileIcon: { fontSize: 26, fontWeight: '300', color: '#8E8E8E' },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  replaceBtn: {
    position: 'absolute', top: 4, left: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  replaceBtnText: { fontSize: 9 },
});

// ─── LICENSE & REGISTRATION rows ────────────────────────────────────────────
function LicenseRows({ rows = [] }) {
  if (rows.length === 0) {
    return <Text style={s.placeholder}>Not added yet</Text>;
  }
  return (
    <View>
      {rows.map((r, i) => (
        <View key={r.key} style={[lc.row, i > 0 && lc.rowBorder]}>
          <Text style={lc.label}>{r.label}</Text>
          <View style={lc.valueRow}>
            <Text style={lc.value} numberOfLines={1}>{r.value}</Text>
            {r.verified && <Text style={lc.tick}>✓</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const lc = injectFonts({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  label: { fontSize: 13, fontWeight: '600', color: '#262626' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  value: { fontSize: 13, fontWeight: '500', color: '#737373' },
  tick: { fontSize: 13, fontWeight: '900', color: '#1877F2' },
});

export default function ContractorProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;

  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState(null);
  const [verifiedAmt, setVerifiedAmt] = useState(0);
  const [verifiedWork, setVerifiedWork] = useState([]);
  const [realProjects, setRealProjects] = useState([]);
  const [clientReviews, setClientReviews] = useState([]);
  const [myUid, setMyUid] = useState(null);
  const [viewer, setViewer] = useState({ visible: false, photos: [], index: 0 });
  const [projectDetail, setProjectDetail] = useState(null);
  const [allProjectsOpen, setAllProjectsOpen] = useState(false);
  const { headerAnimatedStyle, headerHeight, onHeaderLayout, onScroll } = useAutoHideHeader();
  const insets = useSafeAreaInsets();
  const { toastMessage, toastOpacity, showToast } = useToast();

  const openViewer = (photos, index = 0) => setViewer({ visible: true, photos, index });
  const closeViewer = () => setViewer(v => ({ ...v, visible: false }));

  const load = useCallback(async () => {
    try {
      // Prefer the live Firebase Auth uid over the cached AsyncStorage copy —
      // the two can drift (e.g. a stale 'uid' left from an earlier session),
      // and comparing viewUid against a stale "me" silently breaks owner
      // detection even when this really is the signed-in user's own profile.
      // Guests have no auth.currentUser, so they fall back to the cache.
      const cachedUid = await AsyncStorage.getItem('uid');
      const me = auth.currentUser?.uid || cachedUid;
      const uid = viewUid || me;
      setMyUid(me);

      if (!uid) { setLoading(false); return; }

      if (uid !== me) {
        recordProfileView(uid, me).catch(() => {});
      }

      // Try Firestore first
      let profile = null;
      try { profile = await getProfile(uid); } catch (_) {}

      // Fallback to AsyncStorage for guest/own profile
      if (!profile && uid === me) {
        try {
          const local = await AsyncStorage.getItem('localProfile');
          if (local) profile = JSON.parse(local);
        } catch (_) {}
      }

      setContractor(profile);

      // Verified totals — only meaningful for real Firebase users (and demo profiles).
      // Demo profiles keep reading their fixture data via the legacy workService
      // calls (already special-cased for demo uids). Real accounts read their
      // own `work_records` — only 'confirmed' records count toward verified
      // totals; 'locked_pending_confirmation' ones still show in VERIFIED
      // PROJECTS (as ONGOING) but don't count yet.
      if (uid && !uid.startsWith('guest_')) {
        try {
          if (profile?.isDemo) {
            const [amt, works] = await Promise.all([
              getTotalVerifiedAmount(uid),
              getVerifiedWork(uid),
            ]);
            setVerifiedAmt(amt || 0);
            setVerifiedWork(works || []);
            setRealProjects([]);
          } else {
            const records = await getProviderWorkRecords(uid);
            const confirmed = records.filter(r => r.status === WORK_RECORD_STATUS.CONFIRMED);
            setVerifiedAmt(confirmed.reduce((sum, r) => sum + (r.contractValue || 0), 0));
            setVerifiedWork(confirmed.map(workRecordToVerifiedWork));
            setRealProjects(records.map(workRecordToProject));
          }
        } catch (_) {}
        try { setClientReviews(await getClientReviews(uid)); } catch (_) {}
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, [viewUid]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCall = () => {
    if (contractor?.available === false) {
      Alert.alert('Not taking projects', 'This contractor is marked Busy and is not taking calls right now. Send a message instead.');
      return;
    }
    const phone = contractor?.phone;
    if (!phone) { Alert.alert('No phone number', 'This contractor has not added a phone number yet.'); return; }
    Linking.openURL(`tel:+91${phone}`).catch(() => Alert.alert('Could not open dialler.'));
  };

  const handleMessage = () => {
    if (!viewUid || viewUid === myUid) { Alert.alert('This is your own profile'); return; }
    if (!myUid || myUid.startsWith('guest_')) {
      Alert.alert(
        'Sign in to chat',
        'Create a free account or sign in to start chatting with providers.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    // ChatScreen creates the chat itself from conversation.uid — no need to
    // pre-create it here (that redundant call was the thing failing silently).
    navigation.navigate('Chat', {
      conversation: {
        uid: viewUid,
        name: contractor?.companyName || contractor?.name || 'Sub Contractor',
        role: contractor?.contractorType || 'Sub Contractor',
        emoji: '👷‍♂️',
        avatarBg: '#F2F2F2',
        online: false,
      },
    });
  };

  const handleEnquiry = () => {
    if (!viewUid || viewUid === myUid) { Alert.alert('This is your own profile'); return; }
    navigation.navigate('Enquiry', {
      providerId: viewUid,
      providerName: contractor?.companyName || contractor?.name || 'Sub Contractor',
      providerRole: contractor?.contractorType || '',
      providerEmoji: '👷‍♂️',
      services,
      profileType: 'contractor',
    });
  };

  const handleOpenLink = () => {
    const url = contractor?.contractorWebsite;
    if (!url) return;
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.openURL(withScheme).catch(() => Alert.alert('Could not open link.'));
  };

  const handleOpenSettings = () => navigation.navigate('Settings');

  const handleEditProfile = () => navigation.navigate('EditProfile', { profileType: 'contractor' });

  const handleEditSection = (section) => {
    navigation.navigate('EditProfile', { profileType: 'contractor', focusSection: section });
  };

  // ── Own-profile mutations — patch local state immediately, persist to Firestore
  // (or AsyncStorage for guest sessions) in the background. ──────────────────────
  const persistOwnProfileChange = async (patch) => {
    if (!myUid) return;
    const merged = { ...(contractor || {}), ...patch };
    setContractor(merged);
    try {
      if (myUid.startsWith('guest_')) {
        await AsyncStorage.setItem('localProfile', JSON.stringify(merged));
      } else {
        await updateProfile(myUid, patch);
      }
    } catch (_) {
      Alert.alert('Could not save', 'Your change could not be saved. Please try again.');
    }
  };

  const handleToggleAvailability = (nextAvailable) => {
    persistOwnProfileChange({ available: nextAvailable });
    showToast(nextAvailable ? "You're now taking new projects" : "You're now marked busy");
  };

  const handleChangeLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to change your logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      persistOwnProfileChange({ photoUri: result.assets[0].uri });
    }
  };

  const pickGalleryImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  };

  const handleAddGalleryPhoto = async () => {
    const photos = contractor?.workPhotos || [];
    if (photos.length >= 6) return;
    const uri = await pickGalleryImage();
    if (uri) persistOwnProfileChange({ workPhotos: [...photos, uri] });
  };

  const handleReplaceGalleryPhoto = async (index) => {
    const uri = await pickGalleryImage();
    if (!uri) return;
    const photos = [...(contractor?.workPhotos || [])];
    photos[index] = uri;
    persistOwnProfileChange({ workPhotos: photos });
  };

  const handleRemoveGalleryPhoto = (index) => {
    Alert.alert('Remove this photo?', 'This will permanently remove it from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const photos = (contractor?.workPhotos || []).filter((_, i) => i !== index);
          persistOwnProfileChange({ workPhotos: photos });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#262626" />
      </View>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────
  const isOwn = !viewUid || viewUid === myUid;

  const name          = contractor?.companyName || contractor?.name || 'Add your name';
  const contractorType = contractor?.contractorType || contractor?.category || 'Add your trade';

  const area        = contractor?.area || '';
  const city         = contractor?.city || '';
  const nativePlace  = [contractor?.nativePlaceCity, contractor?.nativePlaceState].filter(Boolean).join(', ');
  const currentLoc   = [area, city].filter(Boolean).join(', ');

  const available    = contractor?.available !== false;
  const website       = contractor?.contractorWebsite || '';
  const joinedText    = formatJoinedDate(contractor?.createdAt);
  const verificationType = contractor?.verificationType || '';
  const isVerified    = !!(contractor?.verificationNumber || contractor?.verified);

  const about        = contractor?.contractorBio || '';
  const teamSize     = contractor?.contractorTeamSize || '';
  const services     = contractor?.services?.length > 0
    ? contractor.services
    : (contractor?.otherSkills?.length > 0 ? contractor.otherSkills : (contractor?.skillTags || []));

  const projects     = contractor?.isDemo ? (contractor?.projects || []) : realProjects;
  const galleryItems = contractor?.gallery?.length > 0
    ? contractor.gallery
    : (contractor?.workPhotos || []).map(uri => ({ uri, caption: '' }));

  const licenseRows = [
    {
      key: 'aadhaar', label: 'Aadhaar',
      value: contractor?.aadhaar || (verificationType === 'aadhaar' ? contractor?.verificationNumber : ''),
      verified: isVerified && verificationType === 'aadhaar',
    },
    {
      key: 'gst', label: 'GST',
      value: contractor?.gst || (verificationType === 'gst' ? contractor?.verificationNumber : ''),
      verified: isVerified && verificationType === 'gst',
    },
    { key: 'pan', label: 'PAN', value: contractor?.pan || '', verified: false },
    { key: 'labour', label: 'Labour Licence', value: contractor?.labourLicence || '', verified: false },
  ].filter(r => !!r.value);

  const ratedWork = verifiedWork.filter(w => w.rating && w.rating > 0);
  const ratingCount = ratedWork.length;
  const ratingAvg = ratingCount > 0
    ? (ratedWork.reduce((sum, w) => sum + w.rating, 0) / ratingCount).toFixed(1)
    : null;

  const amtStr = formatAmountIndian(verifiedAmt);
  const jobsCount = verifiedWork.length;
  // A provider with zero completed jobs can't have a real on-time % or star
  // rating yet — always show "—"/"New" for those rather than a stray value.
  const onTimeRate = jobsCount > 0 ? (contractor?.onTimeRate || '—') : '—';
  const ratingDisplay = jobsCount === 0 ? 'New' : (ratingCount > 0 ? `★ ${ratingAvg}` : '—');

  const reviews = ratedWork
    .slice()
    .sort((a, b) => {
      const at = a.verifiedAt?.toMillis?.() ?? 0;
      const bt = b.verifiedAt?.toMillis?.() ?? 0;
      return bt - at;
    });

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. HEADER (auto-hides on scroll) ───────────────────────────────── */}
      <Animated.View style={[s.nav, s.navFloating, { paddingTop: insets.top + 8 }, headerAnimatedStyle]} onLayout={onHeaderLayout}>
        <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
          <Text style={s.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Sub Contractor</Text>
        {isOwn ? (
          <TouchableOpacity style={s.navBtn} onPress={handleOpenSettings} activeOpacity={0.7}>
            <Text style={s.navShare}>⚙️</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.navBtn, { backgroundColor: 'transparent' }]} />
        )}
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 24 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >

        <View style={s.sheet}>

          {/* ── 2. LOGO + IDENTITY ─────────────────────────────────────── */}
          <View style={s.heroRow}>
            <TouchableOpacity
              style={s.logoBox}
              activeOpacity={0.8}
              onPress={() => contractor?.photoUri && openViewer([contractor.photoUri])}
            >
              {contractor?.photoUri ? (
                <Image source={{ uri: contractor.photoUri }} style={s.logoImg} />
              ) : (
                <Text style={s.logoPlaceholder}>Logo</Text>
              )}
              {isOwn && (
                <TouchableOpacity style={s.logoEditBadge} onPress={handleChangeLogo} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={s.logoEditIcon}>📷</Text>
                </TouchableOpacity>
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
              <View style={s.contractorPill}>
                <Text style={s.contractorPillText}>SUB CONTRACTOR</Text>
              </View>
              <Text style={s.heroType} numberOfLines={1}>{contractorType}</Text>
            </View>
          </View>

          {/* ── 3. LOCATION LINES ───────────────────────────────────────── */}
          <Text style={s.heroLoc} numberOfLines={1}>
            {currentLoc ? `📍 ${currentLoc}` : '📍 Add your location'}
          </Text>
          {nativePlace ? (
            <Text style={s.heroNative} numberOfLines={1}>🏠 {nativePlace}</Text>
          ) : null}

          {/* ── 4. STATUS PILL + LINK ───────────────────────────────────── */}
          <View style={s.availRow}>
            {isOwn ? (
              <View style={s.availToggleRow}>
                <Text style={[s.availToggleLabel, !available && s.availToggleLabelMuted]}>
                  {available ? 'Taking new projects' : 'Not taking projects'}
                </Text>
                <Switch
                  value={available}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: '#E5E5E5', true: GREEN_LIGHT }}
                  thumbColor={available ? GREEN : '#FFFFFF'}
                />
              </View>
            ) : (
              <StatusPill available={available} />
            )}
          </View>
          {website ? (
            <TouchableOpacity onPress={handleOpenLink} activeOpacity={0.7}>
              <Text style={s.linkText} numberOfLines={1}>🔗 {website}</Text>
            </TouchableOpacity>
          ) : null}

          {joinedText ? <Text style={s.joinedText}>{joinedText}</Text> : null}

          <View style={s.divider} />

          {/* ── 5. VERIFIED WORK ────────────────────────────────────────── */}
          <View style={s.verHeader}>
            <Text style={s.verLabel}>✓ {isOwn ? 'COMPLETED JOBS' : 'VERIFIED WORK'}</Text>
          </View>
          {isOwn && <Text style={s.verOwnerNote}>Verified from completed jobs — cannot be edited</Text>}
          <View style={s.verStats}>
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{amtStr}</Text>
              <Text style={s.verStatLbl}>Value</Text>
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
              <Text style={s.verStatVal}>{ratingDisplay}</Text>
              <Text style={s.verStatLbl}>Rating</Text>
            </View>
          </View>

          {/* ── 6. ACTION BUTTONS ───────────────────────────────────────── */}
          <View style={s.actionRow}>
            {isOwn ? (
              <>
                <TouchableOpacity style={s.editProfileBtn} onPress={handleEditProfile} activeOpacity={0.85}>
                  <Text style={s.editProfileBtnText}>✏️  Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.newWorkRecordBtn}
                  onPress={() => navigation.navigate('CreateWorkRecord')}
                  activeOpacity={0.85}
                >
                  <Text style={s.newWorkRecordBtnText}>🧾  New Work Record</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[s.actionCallBtn, !available && s.actionCallBtnLocked]}
                  onPress={handleCall}
                  disabled={!available}
                  activeOpacity={0.85}
                >
                  <Text style={[s.actionCallText, !available && s.actionCallTextLocked]} numberOfLines={1}>
                    {available ? '📞 Call' : '🔒 Call'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionMsgBtn} onPress={handleMessage} activeOpacity={0.85}>
                  <Text style={s.actionMsgText} numberOfLines={1}>💬 Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionEnquiryBtn} onPress={handleEnquiry} activeOpacity={0.85}>
                  <Text style={s.actionEnquiryText} numberOfLines={1}>📋 Enquiry</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={s.divider} />

          {/* ── 7. VERIFIED PROJECTS ─────────────────────────────────────── */}
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
              {isOwn && (
                <TouchableOpacity onPress={() => handleEditSection('projects')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.editPencil}>✏️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ProjectsList projects={projects} onOpenProject={setProjectDetail} />

          <View style={s.divider} />

          {/* ── 8. GALLERY ───────────────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>GALLERY</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('gallery')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <GalleryGrid
            items={galleryItems}
            isOwn={isOwn}
            onAdd={handleAddGalleryPhoto}
            onReplace={handleReplaceGalleryPhoto}
            onRemove={handleRemoveGalleryPhoto}
            onView={(i) => openViewer(galleryItems, i)}
          />

          <View style={s.divider} />

          {/* ── 9. ABOUT ─────────────────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>ABOUT</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('about')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={about ? s.aboutText : s.placeholder}>
            {about || 'Add a short bio to attract more clients'}
          </Text>

          <View style={s.divider} />

          {/* ── 10. CREW ─────────────────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>CREW</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('crew')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <CrewRow teamSize={teamSize} trades={services} />

          <View style={s.divider} />

          {/* ── 11. SERVICES ─────────────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>SERVICES</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('services')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <ServicesChips services={services} />

          <View style={s.divider} />

          {/* ── 12. LICENSE & REGISTRATION ───────────────────────────────── */}
          <View style={s.verHeader}>
            <View style={s.sectionHeadLeft}>
              <Text style={[s.sLabel, { marginBottom: 0 }]}>LICENSE & REGISTRATION</Text>
              {isOwn && (
                <TouchableOpacity onPress={() => handleEditSection('license')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.editPencil}>✏️</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={s.verNote}>Optional</Text>
          </View>
          <LicenseRows rows={licenseRows} />

          <View style={s.divider} />

          {/* ── 13. REVIEWS ──────────────────────────────────────────────── */}
          <Text style={s.sLabel}>REVIEWS</Text>
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

          <View style={s.divider} />

          {/* ── 14. REVIEWS AS A CLIENT ─────────────────────────────────── */}
          <Text style={s.sLabel}>REVIEWS AS A CLIENT</Text>
          <ClientReviewsSection reviews={clientReviews} />

        </View>

      </ScrollView>

      <PhotoViewer
        visible={viewer.visible}
        photos={viewer.photos}
        initialIndex={viewer.index}
        onClose={closeViewer}
      />

      <AllProjectsModal
        visible={allProjectsOpen}
        projects={projects}
        verifiedCount={jobsCount}
        onClose={() => setAllProjectsOpen(false)}
        onOpenProject={setProjectDetail}
      />

      <ProjectDetailModal
        visible={!!projectDetail}
        project={projectDetail}
        onClose={() => setProjectDetail(null)}
        onViewPhoto={(photos, index) => openViewer(photos, index)}
      />

      {toastMessage ? (
        <Animated.View style={[s.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={s.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const GREEN        = '#22A559';
const DEEP_GREEN    = '#1E874B';
const GREEN_LIGHT   = '#EAF7EF';
const DARK           = '#262626';
const BG             = '#FAF9F5';
const FILL           = '#F2F2F2';
const BORDER         = '#E5E5E5';
const MID             = '#737373';
const LIGHT           = '#8E8E8E';
const FAINT           = '#B5B5B5';
const STAR            = '#FFB830';
const LINK_BLUE       = '#1877F2';

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  // ── 1. HEADER
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  navFloating: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: FILL, alignItems: 'center', justifyContent: 'center',
  },
  navBack:  { fontSize: 20, fontWeight: '700', color: DARK },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: DARK },
  navShare: { fontSize: 18, color: DARK },

  // ── SHEET
  sheet: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 16 },

  // ── 2. LOGO + IDENTITY
  heroRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  logoBox: {
    width: 72, height: 72, borderRadius: 14,
    backgroundColor: FILL, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  logoImg: { width: 72, height: 72, borderRadius: 14 },
  logoPlaceholder: { fontSize: 12, fontWeight: '600', color: LIGHT },
  logoEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: DARK, borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  logoEditIcon: { fontSize: 10 },
  heroInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  heroName: { fontSize: 18, fontWeight: '700', color: DARK, flexShrink: 1, lineHeight: 22 },
  verifiedBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: LINK_BLUE, alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { fontSize: 10, color: '#fff', fontWeight: '900' },
  contractorPill: {
    alignSelf: 'flex-start', backgroundColor: DARK, borderRadius: 5,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6,
  },
  contractorPillText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.6 },
  heroType: { fontSize: 13, fontWeight: '500', color: MID },

  // ── 3. LOCATION
  heroLoc:    { fontSize: 12, color: LIGHT },
  heroNative: { fontSize: 12, color: LIGHT, marginTop: 4 },

  // ── 4. STATUS
  availRow: { marginTop: 12 },
  chipAvail: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GREEN_LIGHT, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  chipAvailText: { fontSize: 13, fontWeight: '600', color: GREEN },
  chipBusy: {
    alignSelf: 'flex-start', backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  chipBusyText: { fontSize: 13, fontWeight: '600', color: LIGHT },
  availToggleRow: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  availToggleLabel: { fontSize: 13, fontWeight: '600', color: GREEN },
  availToggleLabelMuted: { color: LIGHT },
  linkText: { fontSize: 13, fontWeight: '600', color: LINK_BLUE, marginTop: 10 },
  joinedText: { fontSize: 11, fontWeight: '400', color: LIGHT, marginTop: 6 },

  // ── 5. VERIFIED WORK
  verHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  verLabel: { fontSize: 11, fontWeight: '600', color: GREEN, letterSpacing: 0.8 },
  verNote:  { fontSize: 10, color: LIGHT, fontWeight: '500' },
  verOwnerNote: { fontSize: 10, color: LIGHT, fontWeight: '500', marginBottom: 10 },
  verStats: { flexDirection: 'row', alignItems: 'center' },
  verStat:  { flex: 1, alignItems: 'center' },
  verStatVal: { fontSize: 16, fontWeight: '700', color: DEEP_GREEN, marginBottom: 2 },
  verStatLbl: { fontSize: 10, fontWeight: '500', color: LIGHT },
  verStatSep: { width: 1, height: 28, backgroundColor: BORDER },

  // ── SECTION LABEL (shared)
  sLabel: {
    fontSize: 11, fontWeight: '600', color: LIGHT,
    letterSpacing: 1, marginBottom: 12,
  },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  viewAllLink: { fontSize: 12, fontWeight: '700', color: GREEN },
  editPencil: { fontSize: 13 },
  placeholder: { fontSize: 13, color: FAINT, fontStyle: 'italic' },
  aboutText: { fontSize: 14, color: MID, lineHeight: 22 },

  // ── 6. ACTIONS (inline)
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 16 },
  actionCallBtn: {
    flex: 1.3, height: 46, borderRadius: 12,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  actionCallText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  actionCallBtnLocked: { backgroundColor: FILL },
  actionCallTextLocked: { color: LIGHT },
  actionMsgBtn: {
    flex: 1, height: 46, borderRadius: 12,
    borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  actionMsgText: { color: DARK, fontWeight: '600', fontSize: 11 },
  actionEnquiryBtn: {
    flex: 1.2, height: 46, borderRadius: 12,
    borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  actionEnquiryText: { color: DARK, fontWeight: '600', fontSize: 11 },
  editProfileBtn: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  editProfileBtnText: { color: DARK, fontWeight: '600', fontSize: 15 },
  newWorkRecordBtn: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  newWorkRecordBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },

  // ── 8. SERVICES chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hashChip: {
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  hashChipText: { fontSize: 12, fontWeight: '500', color: MID },

  // ── 12. REVIEWS
  reviewRow: { paddingVertical: 12 },
  reviewRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reviewName: { fontSize: 13, fontWeight: '700', color: DARK, flex: 1, flexShrink: 1, lineHeight: 16 },
  reviewDate: { fontSize: 11, color: LIGHT, fontWeight: '500', flexShrink: 0, marginLeft: 8 },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 6 },
  reviewStarIcon: { fontSize: 14, color: BORDER },
  reviewStarActive: { color: STAR },
  reviewComment: { fontSize: 13, color: MID, lineHeight: 20, fontStyle: 'italic' },

  // ── TOAST (brief confirmation, e.g. availability toggled)
  toast: {
    position: 'absolute', left: 24, right: 24, bottom: 40,
    backgroundColor: DARK, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
