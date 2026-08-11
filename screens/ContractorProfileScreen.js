import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Linking,
  Image, Animated, Switch,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import PhotoViewer from '../components/PhotoViewer';
import ProjectDetailModal from '../components/ProjectDetailModal';
import AllProjectsModal from '../components/AllProjectsModal';
import ProfileCard from '../components/ProfileCard';
import ProfileScreenHeader from '../components/ProfileScreenHeader';
import { useToast } from '../hooks/useToast';
import { getProfile, recordProfileView, updateProfile } from '../services/userService';
import { getVerifiedWork, getTotalVerifiedAmount } from '../services/workService';
import { getPartyWorkRecords, workRecordToProject, workRecordToVerifiedWork, WORK_RECORD_STATUS } from '../services/workRecordService';
import { formatAmountIndian, formatJoinedDate } from '../utils/format';
import { getCurrentUid } from '../utils/session';
import { checkMutualBlock, confirmBlockUser } from '../utils/blocking';
import BlockedProfileNotice from '../components/BlockedProfileNotice';


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

// ─── GALLERY grid ───────────────────────────────────────────────────────────
// Slot size is measured from the grid container's ACTUAL laid-out width via
// onLayout, not guessed from useWindowDimensions() minus assumed padding —
// the guessed chrome (sheet marginHorizontal/padding) can be wrong relative
// to the real rendered content box, which is what was still causing the 3rd
// tile to wrap. Measuring the real container removes the guesswork entirely.
const GRID_GAP = 8;

function GalleryGrid({ items = [], savingUris = [], isOwn, onAdd, onReplace, onRemove, onView }) {
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
              {savingUris.includes(item.uri) && (
                <View style={[gl.savingOverlay, slotBox]}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                </View>
              )}
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
  savingOverlay: {
    position: 'absolute', top: 0, left: 0, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
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

export default function ContractorProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;

  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [verifiedAmt, setVerifiedAmt] = useState(0);
  const [verifiedWork, setVerifiedWork] = useState([]);
  const [realProjects, setRealProjects] = useState([]);
  const [myUid, setMyUid] = useState(null);
  const [viewer, setViewer] = useState({ visible: false, photos: [], index: 0 });
  const [savingPhotoUris, setSavingPhotoUris] = useState([]);
  const [projectDetail, setProjectDetail] = useState(null);
  const [allProjectsOpen, setAllProjectsOpen] = useState(false);
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

      if (uid !== me) {
        try { setBlocked(await checkMutualBlock(me, uid, profile?.blockedUsers)); } catch (_) {}
      }

      // Verified totals — only meaningful for real Firebase users (and demo profiles).
      // Demo profiles keep reading their fixture data via the legacy workService
      // calls (already special-cased for demo uids). Real accounts read their
      // own `work_records` — only 'confirmed'/'completed_paid' records count
      // toward verified totals; 'sent_to_client' ones still show in VERIFIED
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
            // getPartyWorkRecords (not getProviderWorkRecords) — includes
            // records where `uid` is an APPROVED partner, so a partner sees
            // their share of a partnered record on their own profile too.
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
        name: contractor?.companyName || contractor?.name || 'Contractors',
        role: contractor?.contractorType || 'Contractors',
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
      providerName: contractor?.companyName || contractor?.name || 'Contractors',
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

  // Grid adds allow picking several photos at once — allowsMultipleSelection
  // and allowsEditing/crop can't coexist in expo-image-picker, so this path
  // (unlike pickGalleryImage above, still used for single replace) trades
  // per-image cropping for bulk add.
  const pickMultipleGalleryImages = async (limit) => {
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

  const handleAddGalleryPhoto = async () => {
    const photos = contractor?.workPhotos || [];
    const remaining = 6 - photos.length;
    if (remaining <= 0) return;
    const picked = await pickMultipleGalleryImages(remaining);
    if (!picked.length) return;
    const toAdd = picked.slice(0, remaining);
    setSavingPhotoUris(toAdd);
    await persistOwnProfileChange({ workPhotos: [...photos, ...toAdd] });
    setSavingPhotoUris([]);
    if (picked.length > remaining) {
      Alert.alert('Photo limit', 'You can add up to 6 photos.');
    }
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

  if (blocked) {
    return <BlockedProfileNotice onBack={() => navigation.goBack()} />;
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
      <ProfileScreenHeader
        title="Contractor"
        onBack={() => navigation.goBack()}
        rightIcon={isOwn ? '⚙️' : '⋮'}
        onRightPress={isOwn ? handleOpenSettings : () => confirmBlockUser(myUid, viewUid, contractor?.name || contractor?.companyName, () => navigation.goBack())}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* ── HERO CARD ─────────────────────────────────────────────────── */}
        <ProfileCard>
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
                <Text style={s.contractorPillText}>CONTRACTOR</Text>
              </View>
            </View>
          </View>

          <View style={s.typeAvailRow}>
            <Text style={s.heroType} numberOfLines={1}>{contractorType}</Text>
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

          {/* Location rows with green icons */}
          <Text style={s.heroLoc} numberOfLines={1}>
            {currentLoc ? `📍 ${currentLoc}` : '📍 Add your location'}
          </Text>
          {nativePlace ? (
            <Text style={s.heroNative} numberOfLines={1}>🏠 {nativePlace}</Text>
          ) : null}
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
            <>
              <TouchableOpacity
                style={[s.pillBtnOutline, !available && s.pillBtnLocked]}
                onPress={handleCall}
                disabled={!available}
                activeOpacity={0.85}
              >
                <Text style={[s.pillBtnOutlineText, !available && s.pillBtnTextLocked]} numberOfLines={1}>
                  {available ? '📞 Call' : '🔒 Call'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.pillBtnOutline} onPress={handleMessage} activeOpacity={0.85}>
                <Text style={s.pillBtnOutlineText} numberOfLines={1}>💬 Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.pillBtnOutline} onPress={handleEnquiry} activeOpacity={0.85}>
                <Text style={s.pillBtnOutlineText} numberOfLines={1}>📋 Enquiry</Text>
              </TouchableOpacity>
            </>
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
              {isOwn && (
                <TouchableOpacity onPress={() => handleEditSection('projects')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.editPencil}>✏️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ProjectsList projects={projects} onOpenProject={setProjectDetail} />
        </ProfileCard>

        {/* ── GALLERY CARD ──────────────────────────────────────────────── */}
        <ProfileCard>
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
            savingUris={savingPhotoUris}
            isOwn={isOwn}
            onAdd={handleAddGalleryPhoto}
            onReplace={handleReplaceGalleryPhoto}
            onRemove={handleRemoveGalleryPhoto}
            onView={(i) => openViewer(galleryItems, i)}
          />
        </ProfileCard>

        {/* ── ABOUT CARD ────────────────────────────────────────────────── */}
        <ProfileCard>
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
        </ProfileCard>

        {/* ── CREW CARD ─────────────────────────────────────────────────── */}
        <ProfileCard>
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>CREW</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('crew')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <CrewRow teamSize={teamSize} trades={services} />
        </ProfileCard>

        {/* ── SERVICES CARD ─────────────────────────────────────────────── */}
        <ProfileCard>
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>SERVICES</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('services')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <ServicesChips services={services} />
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
const SCREEN_BG      = '#F2F2F2';
const FILL           = '#F2F2F2';
const BORDER         = '#E5E5E5';
const MID             = '#737373';
const LIGHT           = '#8E8E8E';
const FAINT           = '#B5B5B5';
const STAR            = '#FFB830';
const LINK_BLUE       = '#1877F2';

const s = injectFonts({
  screen: { flex: 1, backgroundColor: SCREEN_BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: SCREEN_BG },

  // ── LOGO + IDENTITY
  heroRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
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
  heroType: { flex: 1, fontSize: 13, fontWeight: '600', color: DARK },
  typeAvailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },

  // ── LOCATION
  heroLoc:    { fontSize: 12, color: GREEN, fontWeight: '500', marginTop: 8 },
  heroNative: { fontSize: 12, color: GREEN, fontWeight: '500', marginTop: 4 },

  // ── STATUS
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

  // ── COMPLETED WORK
  verHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 4,
  },
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

  // ── SECTION LABEL (shared)
  sLabel: {
    fontSize: 11, fontWeight: '600', color: LIGHT,
    letterSpacing: 1, marginBottom: 12,
  },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  viewAllLink: { fontSize: 12, fontWeight: '700', color: GREEN },
  editPencil: { fontSize: 13 },
  placeholder: { fontSize: 13, color: FAINT, fontStyle: 'italic' },
  aboutText: { fontSize: 14, color: MID, lineHeight: 22 },

  // ── ACTIONS — outlined pill buttons in a row, floating between cards
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 4, paddingHorizontal: 14 },
  pillBtnOutline: {
    flex: 1, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  pillBtnOutlineText: { color: DARK, fontWeight: '600', fontSize: 13 },
  pillBtnLocked: { borderColor: BORDER },
  pillBtnTextLocked: { color: LIGHT },
  pillBtnPrimary: {
    flex: 1, height: 48, borderRadius: 24,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  pillBtnPrimaryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },

  // ── SERVICES chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hashChip: {
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  hashChipText: { fontSize: 12, fontWeight: '500', color: MID },

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

  // ── TOAST (brief confirmation, e.g. availability toggled)
  toast: {
    position: 'absolute', left: 24, right: 24, bottom: 40,
    backgroundColor: DARK, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
