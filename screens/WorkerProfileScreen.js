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
import { checkMutualBlock, confirmBlockUser } from '../utils/blocking';
import BlockedProfileNotice from '../components/BlockedProfileNotice';
import { getTotalVerifiedAmount, getVerifiedWork } from '../services/workService';
import { getPartyWorkRecords, workRecordToProject, workRecordToVerifiedWork, WORK_RECORD_STATUS } from '../services/workRecordService';
import { getCurrentUid } from '../utils/session';
import { auth } from '../config/firebase'; // TEMP DEBUG — for CHAT GATE DEBUG / MYUID SET logging below, remove with the logs
import { formatAmountIndian, formatJoinedDate } from '../utils/format';

function AvailabilityChip({ available }) {
  return available ? (
    <View style={s.chipAvail}>
      <View style={s.chipDot} />
      <Text style={s.chipAvailText}>Available now</Text>
    </View>
  ) : (
    <View style={s.chipUnavail}>
      <Text style={s.chipUnavailText}>Not available</Text>
    </View>
  );
}

// ─── VERIFIED PROJECTS list ─────────────────────────────────────────────────
// Category + amount reads better than location for scanning a list —
// "Residential · ₹18.5L" tells a client type + scale at a glance.
function projectSubline(p) {
  return [p.category, p.value ? formatAmountIndian(p.value) : null, p.isPartnership ? '🤝 Partnership' : null]
    .filter(Boolean).join(' · ');
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

// Slot size is measured from the grid container's ACTUAL laid-out width via
// onLayout, not guessed from useWindowDimensions() minus assumed padding —
// the guessed chrome (sheet marginHorizontal/padding) can be wrong relative
// to the real rendered content box, which is what was still causing the 3rd
// tile to wrap. Measuring the real container removes the guesswork entirely.
const GRID_GAP = 8;

function WorkPhotoGrid({ photos = [], savingUris = [], isOwn, onAdd, onReplace, onRemove, onEditSection, onView }) {
  const [gridWidth, setGridWidth] = useState(0);
  const slotSize = gridWidth > 0 ? Math.floor((gridWidth - GRID_GAP * 2) / 3) - 1 : 0;

  const filled = Array.isArray(photos) ? photos.slice(0, 6) : [];
  const slots  = [...filled, ...Array(Math.max(0, 6 - filled.length)).fill(null)];
  return (
    <View>
      <View style={wp.labelRow}>
        <View style={wp.labelLeft}>
          <Text style={wp.label}>GALLERY</Text>
          {isOwn && (
            <TouchableOpacity onPress={onEditSection} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={wp.editPencil}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        {isOwn && <Text style={wp.labelHint}>Tap to view · 🔄 replace · ✕ remove</Text>}
      </View>
      <View style={wp.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
        {gridWidth === 0 ? null : slots.map((uri, i) => (
          <View key={i} style={[wp.slot, { width: slotSize, height: slotSize }]}>
            {uri ? (
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => onView(i)}>
                <Image source={{ uri }} style={wp.thumb} resizeMode="cover" />
                {savingUris.includes(uri) && (
                  <View style={wp.savingOverlay}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  </View>
                )}
                {isOwn && (
                  <>
                    <TouchableOpacity style={wp.replaceBtn} onPress={() => onReplace(i)}>
                      <Text style={wp.replaceBtnText}>🔄</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={wp.removeBtn} onPress={() => onRemove(i)}>
                      <Text style={wp.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>
            ) : isOwn ? (
              <TouchableOpacity style={wp.addSlot} onPress={onAdd} activeOpacity={0.7}>
                <Text style={wp.addSlotIcon}>+</Text>
              </TouchableOpacity>
            ) : (
              <View style={wp.placeholder}>
                <Text style={wp.placeholderIcon}>🖼️</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const wp = injectFonts({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  labelLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontSize: 11, fontWeight: '600', color: '#8E8E8E',
    letterSpacing: 1,
  },
  editPencil: { fontSize: 13 },
  labelHint: { fontSize: 10, color: '#B5B5B5', fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    borderRadius: 10, overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  savingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  placeholder: {
    flex: 1, backgroundColor: '#F2F2F2',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  placeholderIcon: { fontSize: 20, opacity: 0.3 },
  addSlot: {
    flex: 1, backgroundColor: '#F2F2F2', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E5E5', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addSlotIcon: { fontSize: 26, fontWeight: '300', color: '#8E8E8E' },
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

export default function WorkerProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [verifiedAmt, setVerifiedAmt] = useState(0);
  const [verifiedWork, setVerifiedWork] = useState([]);
  const [realProjects, setRealProjects] = useState([]);
  const [myUid, setMyUid] = useState(null);
  const [viewer, setViewer] = useState({ visible: false, photos: [], index: 0 });
  const [savingPhotoUris, setSavingPhotoUris] = useState([]);
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
      // Guests have no auth.currentUser, so they fall back to the cache
      // (see utils/session.js's getCurrentUid — the one shared resolver).
      const me = await getCurrentUid();
      const uid = viewUid || me;
      setMyUid(me);

      // TEMP DEBUG — remove once "Sign in to chat" false-positive is diagnosed
      console.log('MYUID SET', {
        authUid: auth.currentUser?.uid ?? 'NULL',
        cached: await AsyncStorage.getItem('uid'),
        resolved: me,
      });

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

      setWorker(profile);

      if (uid !== me) {
        try { setBlocked(await checkMutualBlock(me, uid, profile?.blockedUsers)); } catch (_) {}
      }

      // Verified totals — only meaningful for real Firebase users (and demo profiles).
      // Demo profiles keep reading their fixture data (demoVerifiedAmount/
      // demoVerifiedWork/projects in demoData.js) via the legacy workService
      // calls, which already special-case demo uids. Real accounts instead
      // read their own `work_records` — only 'confirmed'/'completed_paid' ones
      // count toward verified totals; 'sent_to_client' ones still show up in
      // VERIFIED PROJECTS (as ONGOING) but don't count yet.
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
            // getPartyWorkRecords (not getProviderWorkRecords) — includes
            // records where `uid` is an APPROVED partner, not just where
            // they're the lead provider, so a partner sees their share of a
            // partnered record on their own profile too. Both amount (split
            // by percentage) and project count naturally come out right per
            // party since a record can only ever appear once in any single
            // uid's own list (see getWorkRecordShareAmount).
            const records = await getPartyWorkRecords(uid);
            const confirmed = records.filter(r => r.status === WORK_RECORD_STATUS.VERIFIED || r.status === WORK_RECORD_STATUS.COMPLETED_PAID);
            const work = confirmed.map(r => workRecordToVerifiedWork(r, uid));
            setVerifiedAmt(work.reduce((sum, w) => sum + (w.amount || 0), 0));
            setVerifiedWork(work);
            setRealProjects(records.map(r => workRecordToProject(r, uid)));
          }
        } catch (_) {}
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, [viewUid]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleOpenLink = () => {
    const url = worker?.link;
    if (!url) return;
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.openURL(withScheme).catch(() => Alert.alert('Could not open link.'));
  };

  const handleCall = () => {
    if (worker?.available === false) {
      Alert.alert('Currently Unavailable', 'This worker is marked unavailable and is not taking calls right now. Send a chat instead.');
      return;
    }
    const phone = worker?.phone;
    if (!phone) { Alert.alert('No phone number', 'This worker has not added a phone number yet.'); return; }
    Linking.openURL(`tel:+91${phone}`).catch(() => Alert.alert('Could not open dialler.'));
  };

  const handleChat = async () => {
    if (!viewUid || viewUid === myUid) { Alert.alert('This is your own profile'); return; }

    // TEMP DEBUG — remove once "Sign in to chat" false-positive is diagnosed
    console.log('CHAT GATE DEBUG', {
      authCurrentUser: auth.currentUser?.uid ?? 'NULL',
      cachedUid: await AsyncStorage.getItem('uid'),
      myUid: myUid,
      viewUid: viewUid,
    });

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
        name: worker?.name || 'Worker',
        role: worker?.workerSkill || 'Worker',
        emoji: '👤',
        avatarBg: '#F2F2F2',
        online: false,
      },
    });
  };

  const handleEnquiry = () => {
    if (!viewUid || viewUid === myUid) { Alert.alert('This is your own profile'); return; }
    navigation.navigate('Enquiry', {
      providerId: viewUid,
      providerName: worker?.name || 'Worker',
      providerRole: primarySkill !== 'Add your skill' ? primarySkill : '',
      providerEmoji: '👤',
      services: skills,
      profileType: 'worker',
    });
  };

  const handleOpenSettings = () => navigation.navigate('Settings');

  const handleEditProfile = () => navigation.navigate('EditProfile', { profileType: 'worker' });

  const handleEditSection = (section) => {
    navigation.navigate('EditProfile', { profileType: 'worker', focusSection: section });
  };

  // ── Own-profile mutations — patch local state immediately, persist to Firestore
  // (or AsyncStorage for guest sessions) in the background. ──────────────────────
  const persistOwnProfileChange = async (patch) => {
    if (!myUid) return;
    const merged = { ...(worker || {}), ...patch };
    setWorker(merged);
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
    showToast(nextAvailable ? "You're now available" : "You're now marked busy");
  };

  const pickImage = async () => {
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

  // Grid adds allow picking several photos at once — allowsMultipleSelection
  // and allowsEditing/crop can't coexist in expo-image-picker, so this path
  // (unlike pickImage above, still used for the avatar and single replace)
  // trades per-image cropping for bulk add.
  const pickMultipleImages = async (limit) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return [];
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: limit,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return [];
    return result.assets.map(a => a.uri);
  };

  const handleChangeAvatar = async () => {
    const uri = await pickImage();
    if (uri) persistOwnProfileChange({ photoUri: uri });
  };

  const handleAddPhoto = async () => {
    const photos = worker?.workPhotos || [];
    const remaining = 6 - photos.length;
    if (remaining <= 0) return;
    const picked = await pickMultipleImages(remaining);
    if (!picked.length) return;
    const toAdd = picked.slice(0, remaining);
    setSavingPhotoUris(toAdd);
    await persistOwnProfileChange({ workPhotos: [...photos, ...toAdd] });
    setSavingPhotoUris([]);
    if (picked.length > remaining) {
      Alert.alert('Photo limit', 'You can add up to 6 photos.');
    }
  };

  const handleReplacePhoto = async (index) => {
    const uri = await pickImage();
    if (!uri) return;
    const photos = [...(worker?.workPhotos || [])];
    photos[index] = uri;
    persistOwnProfileChange({ workPhotos: photos });
  };

  const handleRemovePhoto = (index) => {
    Alert.alert('Remove this photo?', 'This will permanently remove it from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const photos = (worker?.workPhotos || []).filter((_, i) => i !== index);
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

  if (blocked) {
    return <BlockedProfileNotice onBack={() => navigation.goBack()} />;
  }

  // ── Derived display values ────────────────────────────────────────────────
  const isOwn = !viewUid || viewUid === myUid;

  const name       = worker?.name || 'Add your name';
  const skills     = worker?.workerSkills?.length > 0
                       ? worker.workerSkills
                       : worker?.workerSkill ? [worker.workerSkill] : [];
  const primarySkill = worker?.primarySkill || skills[0] || 'Add your skill';
  const skillTags  = worker?.skillTags?.length > 0 ? worker.skillTags : skills.slice(1);
  const experience = worker?.workerExperience || worker?.experience || null;
  const heroTypeTradeParts = [primarySkill, experience ? `${experience} yrs exp` : null].filter(Boolean);
  const area       = worker?.area   || '';
  const city       = worker?.city   || '';
  const pincode    = worker?.pincode || '';
  const about      = worker?.workerAbout || worker?.bio || '';
  const available  = worker?.available !== false;
  const nativePlace = [worker?.nativePlaceCity, worker?.nativePlaceState].filter(Boolean).join(', ');
  const link       = worker?.link || '';
  const joinedText = formatJoinedDate(worker?.createdAt);
  const projects   = worker?.isDemo ? (worker?.projects || []) : realProjects;

  // Rating, job count and reviews come only from real completed (verified) work.
  const ratedWork  = verifiedWork.filter(w => w.rating && w.rating > 0);
  const hasRating  = ratedWork.length > 0;
  const rating     = hasRating
    ? (ratedWork.reduce((sum, w) => sum + w.rating, 0) / ratedWork.length).toFixed(1)
    : null;
  const jobsCount  = verifiedWork.length;
  // A provider with zero completed jobs can't have a real on-time % or star
  // rating yet — always show "—"/"New" for those rather than a stray value.
  const onTimeDisplay = jobsCount > 0 ? (worker?.onTimeRate || '—') : '—';
  const ratingDisplay = jobsCount === 0 ? 'New' : (hasRating ? `★ ${rating}` : '—');
  const reviews    = ratedWork.slice().sort((a, b) => {
    const at = a.verifiedAt?.toMillis?.() ?? 0;
    const bt = b.verifiedAt?.toMillis?.() ?? 0;
    return bt - at;
  });

  const locationShort = [area, city].filter(Boolean).join(', ') + (pincode ? ` · ${pincode}` : '');
  const locationFull  = [area, city].filter(Boolean).join(', ') + (pincode ? ` — ${pincode}` : '');
  const amtStr = formatAmountIndian(verifiedAmt);

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. TOP NAV (auto-hides on scroll) ─────────────────────────────── */}
      <Animated.View style={[s.nav, s.navFloating, { paddingTop: insets.top + 8 }, headerAnimatedStyle]} onLayout={onHeaderLayout}>
        <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
          <Text style={s.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Profile</Text>
        {isOwn ? (
          <TouchableOpacity style={s.navBtn} onPress={handleOpenSettings} activeOpacity={0.7}>
            <Text style={s.navShare}>⚙️</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => confirmBlockUser(myUid, viewUid, worker?.name, () => navigation.goBack())}
            activeOpacity={0.7}
          >
            <Text style={s.navShare}>⋮</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 24 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >

        <View style={s.sheet}>

          {/* ── 2. HERO ─────────────────────────────────────────────────── */}
          <View style={s.heroRow}>
            <TouchableOpacity
              style={s.avatar}
              activeOpacity={0.8}
              onPress={() => worker?.photoUri && openViewer([worker.photoUri])}
            >
              {worker?.photoUri ? (
                <Image source={{ uri: worker.photoUri }} style={s.avatarImg} />
              ) : (
                <Text style={s.avatarIcon}>👤</Text>
              )}
              {isOwn && (
                <TouchableOpacity style={s.avatarEditBadge} onPress={handleChangeAvatar} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={s.avatarEditIcon}>📷</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <View style={s.heroInfo}>
              <View style={s.nameRow}>
                <Text style={s.heroName} numberOfLines={2}>{name}</Text>
                <View style={s.verifiedBadge}>
                  <Text style={s.verifiedText}>✓</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 2.25 TRADE + EXPERIENCE ──────────────────────────────────── */}
          {heroTypeTradeParts.length > 0 && (
            <Text style={s.heroTypeTradeLine} numberOfLines={1}>
              {heroTypeTradeParts.map((part, i) => (
                <Text key={i}>
                  {i > 0 && <Text style={s.heroTypeTradeSep}> · </Text>}
                  {part}
                </Text>
              ))}
            </Text>
          )}

          {/* ── 2.5 LOCATION LINES ──────────────────────────────────────── */}
          <Text style={s.heroLoc} numberOfLines={1}>
            {locationShort ? `📍 ${locationShort}` : '📍 Add your area'}
          </Text>
          {nativePlace ? (
            <Text style={s.heroNative} numberOfLines={1}>🏠 {nativePlace}</Text>
          ) : null}

          {/* ── 3. STATUS CHIPS ─────────────────────────────────────────── */}
          <View style={s.chipsRow}>
            {isOwn ? (
              <View style={s.availToggleRow}>
                <Text style={[s.availToggleLabel, !available && s.availToggleLabelMuted]}>
                  {available ? 'Available now' : 'Not available'}
                </Text>
                <Switch
                  value={available}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: '#E5E5E5', true: GREEN_LIGHT }}
                  thumbColor={available ? GREEN : '#FFFFFF'}
                />
              </View>
            ) : (
              <AvailabilityChip available={available} />
            )}
          </View>

          {/* Self-stated daily rate — deliberately plain text, never a pill/badge,
              so it can never be mistaken for verified data. */}
          {worker?.dailyCharge ? (
            <Text style={s.dailyChargeText}>₹{worker.dailyCharge} / day</Text>
          ) : isOwn ? (
            <TouchableOpacity onPress={() => handleEditSection('rate')} activeOpacity={0.7}>
              <Text style={s.dailyChargeAdd}>Add daily charge</Text>
            </TouchableOpacity>
          ) : null}

          {link ? (
            <TouchableOpacity onPress={handleOpenLink} activeOpacity={0.7}>
              <Text style={s.linkText} numberOfLines={1}>🔗 {link}</Text>
            </TouchableOpacity>
          ) : null}

          {joinedText ? <Text style={s.joinedText}>{joinedText}</Text> : null}

          <View style={s.divider} />

          {/* ── 4. VERIFIED WORK ────────────────────────────────────────── */}
          <View style={s.verHeader}>
            <Text style={s.verLabel}>✓ {isOwn ? 'COMPLETED JOBS' : 'VERIFIED WORK'}</Text>
            {isOwn && <Text style={s.verNote}>Verified from completed jobs — cannot be edited</Text>}
          </View>
          <View style={s.verStats}>
            <View style={s.verStat}>
              <Text style={s.verStatAmt}>{amtStr}</Text>
              <Text style={s.verStatLbl}>Revenue</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{jobsCount}</Text>
              <Text style={s.verStatLbl}>Jobs</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{onTimeDisplay}</Text>
              <Text style={s.verStatLbl}>On-time</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{ratingDisplay}</Text>
              <Text style={s.verStatLbl}>Rating</Text>
            </View>
          </View>

          {/* ── 4.5 ACTION BUTTONS ───────────────────────────────────────── */}
          <View style={s.actionRow}>
            {isOwn ? (
              <>
                <TouchableOpacity style={s.editProfileBtn} onPress={handleEditProfile} activeOpacity={0.85}>
                  <Text style={s.editProfileBtnText}>✏️  Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.newWorkRecordBtn}
                  onPress={() => navigation.push('CreateWorkRecord')}
                  activeOpacity={0.85}
                >
                  <Text style={s.newWorkRecordBtnText}>🧾  New Work Record</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[s.callBtn, !available && s.callBtnLocked]}
                  onPress={handleCall}
                  disabled={!available}
                  activeOpacity={0.85}
                >
                  <Text style={[s.callBtnText, !available && s.callBtnTextLocked]} numberOfLines={1}>
                    {available ? '📞 Call' : '🔒 Call'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.chatBtn} onPress={handleChat} activeOpacity={0.85}>
                  <Text style={s.chatBtnText} numberOfLines={1}>💬 Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.enquiryBtn} onPress={handleEnquiry} activeOpacity={0.85}>
                  <Text style={s.enquiryBtnText} numberOfLines={1}>📋 Enquiry</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={s.divider} />

          {/* ── 5. VERIFIED PROJECTS ─────────────────────────────────────── */}
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

          {/* ── 6. GALLERY ───────────────────────────────────────────────── */}
          <WorkPhotoGrid
            photos={worker?.workPhotos}
            savingUris={savingPhotoUris}
            isOwn={isOwn}
            onAdd={handleAddPhoto}
            onReplace={handleReplacePhoto}
            onRemove={handleRemovePhoto}
            onEditSection={() => handleEditSection('work')}
            onView={(i) => openViewer(worker?.workPhotos || [], i)}
          />

          <View style={s.divider} />

          {/* ── 7. ABOUT ────────────────────────────────────────────────── */}
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

          {/* ── 8. ADDITIONAL SKILLS ─────────────────────────────────────
              The primary skill already shows in the hero line above (see
              heroTypeTradeParts) — this section is ONLY for skills beyond
              that, so it's hidden entirely rather than repeating the
              primary skill when there's nothing extra to show. */}
          {(skillTags.length > 0 || (!worker?.primarySkill && skills.length > 1)) && (
            <>
              <View style={s.divider} />
              <View style={s.sectionHeadRow}>
                <Text style={[s.sLabel, { marginBottom: 0 }]}>ADDITIONAL SKILLS</Text>
                {isOwn && (
                  <TouchableOpacity onPress={() => handleEditSection('skills')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={s.editPencil}>✏️</Text>
                  </TouchableOpacity>
                )}
              </View>
              {skillTags.length > 0 ? (
                <View style={s.chipsWrap}>
                  {skillTags.map((sk, i) => (
                    <View key={i} style={s.hashChip}>
                      <Text style={s.hashChipText}>#{sk.toLowerCase()}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                // Fallback: old profiles with only workerSkills, no primarySkill/skillTags
                <View style={s.chipsWrap}>
                  {skills.slice(1).map((sk, i) => (
                    <View key={i} style={s.hashChip}>
                      <Text style={s.hashChipText}>#{sk.toLowerCase()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={s.divider} />

          {/* ── 9. REVIEWS ───────────────────────────────────────────────── */}
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

const GREEN       = '#22A559';
const DEEP_GREEN   = '#1E874B';
const GREEN_LIGHT  = '#EAF7EF';
const DARK          = '#262626';
const BG            = '#FAF9F5';
const FILL          = '#F2F2F2';
const BORDER        = '#E5E5E5';
const MID            = '#737373';
const LIGHT          = '#8E8E8E';
const FAINT          = '#B5B5B5';
const STAR           = '#FFB830';
const LINK_BLUE      = '#1877F2';

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  // ── TOP NAV
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

  // ── SHEET (single continuous card, sections separated by hairline dividers)
  sheet: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 16 },

  // ── HERO
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: FILL, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarIcon: { fontSize: 34 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: DARK, borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditIcon: { fontSize: 10 },
  heroInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 3 },
  heroName: { fontSize: 18, fontWeight: '700', color: DARK, flexShrink: 1, lineHeight: 22 },
  verifiedBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: LINK_BLUE, alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { fontSize: 10, color: '#fff', fontWeight: '900' },
  heroTypeTradeLine: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 8 },
  heroTypeTradeSep: { fontWeight: '400', color: LIGHT },
  heroLoc:   { fontSize: 12, color: LIGHT },
  heroNative: { fontSize: 12, color: LIGHT, marginTop: 3 },

  // ── STATUS CHIPS
  chipsRow: { flexDirection: 'row', gap: 8 },
  // Self-stated daily rate — plain muted text only, never styled like verified data.
  dailyChargeText: { fontSize: 12, color: LIGHT, fontWeight: '400', marginTop: 5 },
  dailyChargeAdd: { fontSize: 12, color: FAINT, fontWeight: '400', marginTop: 5 },
  chipAvail: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GREEN_LIGHT, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  chipAvailText: { fontSize: 12, fontWeight: '600', color: GREEN },
  chipUnavail: {
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipUnavailText: { fontSize: 12, fontWeight: '600', color: LIGHT },
  availToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  availToggleLabel: { fontSize: 13, fontWeight: '600', color: GREEN },
  availToggleLabelMuted: { color: LIGHT },
  linkText: { fontSize: 12, fontWeight: '600', color: '#1877F2', marginTop: 8 },
  joinedText: { fontSize: 11, fontWeight: '400', color: LIGHT, marginTop: 6 },

  // ── VERIFIED WORK
  verHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  verLabel: { fontSize: 11, fontWeight: '600', color: GREEN, letterSpacing: 0.8 },
  verNote: { fontSize: 10, color: LIGHT, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  verStats: { flexDirection: 'row', alignItems: 'center' },
  verStat:  { flex: 1, alignItems: 'center' },
  verStatAmt: { fontSize: 16, fontWeight: '700', color: DEEP_GREEN, marginBottom: 2 },
  verStatVal: { fontSize: 16, fontWeight: '700', color: DEEP_GREEN, marginBottom: 2 },
  verStatLbl: { fontSize: 10, fontWeight: '500', color: LIGHT },
  verStatSep: { width: 1, height: 28, backgroundColor: BORDER },

  // ── SECTION LABEL (shared)
  sLabel: {
    fontSize: 11, fontWeight: '600', color: LIGHT,
    letterSpacing: 1, marginBottom: 12,
  },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  viewAllLink: { fontSize: 12, fontWeight: '700', color: GREEN },
  editPencil: { fontSize: 13 },

  // ── SKILLS
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  skillChipText: { fontSize: 12, fontWeight: '500', color: DARK },
  hashChip: {
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  hashChipText: { fontSize: 12, fontWeight: '500', color: MID },

  // ── ABOUT
  aboutText: { fontSize: 14, color: MID, lineHeight: 22 },
  placeholder: { fontSize: 13, color: FAINT, fontStyle: 'italic' },

  // ── LOCATION
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 14, marginTop: 1 },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', color: MID, lineHeight: 20 },

  // ── REVIEWS
  reviewRow: { paddingVertical: 12 },
  reviewRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reviewName: { fontSize: 13, fontWeight: '700', color: DARK, flex: 1, flexShrink: 1, lineHeight: 16 },
  reviewDate: { fontSize: 11, color: LIGHT, fontWeight: '500', flexShrink: 0, marginLeft: 8 },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 6 },
  reviewStarIcon: { fontSize: 14, color: BORDER },
  reviewStarActive: { color: STAR },
  reviewComment: { fontSize: 13, color: MID, lineHeight: 20, fontStyle: 'italic' },

  // ── ACTION BUTTONS
  actionRow: {
    flexDirection: 'row', gap: 6, marginTop: 16,
  },
  callBtn: {
    flex: 1.5, height: 50, borderRadius: 14,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  callBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  callBtnLocked: { backgroundColor: FILL },
  callBtnTextLocked: { color: LIGHT },
  chatBtn: {
    flex: 1.2, height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  chatBtnText: { color: DARK, fontWeight: '600', fontSize: 12 },
  enquiryBtn: {
    flex: 1.4, height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  enquiryBtnText: { color: DARK, fontWeight: '600', fontSize: 12 },
  editProfileBtn: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  editProfileBtnText: { color: DARK, fontWeight: '600', fontSize: 15 },
  newWorkRecordBtn: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  newWorkRecordBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },

  // ── TOAST (brief confirmation, e.g. availability toggled)
  toast: {
    position: 'absolute', left: 24, right: 24, bottom: 40,
    backgroundColor: DARK, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
