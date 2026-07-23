import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Linking,
  Image, Dimensions,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, recordProfileView, updateProfile } from '../services/userService';
import { getTotalVerifiedAmount, getVerifiedWork } from '../services/workService';
import { createChat } from '../services/chatService';
import { toggleBookmark, isBookmarked } from '../services/bookmarkService';
import { auth } from '../config/firebase';
import { formatAmountK } from '../utils/format';

const SLOT_SIZE = Math.floor((Dimensions.get('window').width - 28 - 16) / 3);

function AvailabilityChip({ available }) {
  return available ? (
    <View style={s.chipAvail}>
      <View style={s.chipDot} />
      <Text style={s.chipAvailText}>Available now</Text>
    </View>
  ) : (
    <View style={s.chipUnavail}>
      <Text style={s.chipUnavailText}>Unavailable</Text>
    </View>
  );
}

function WorkPhotoGrid({ photos = [], isOwn, onAdd, onReplace, onRemove, onEditSection }) {
  const filled = Array.isArray(photos) ? photos.slice(0, 6) : [];
  const slots  = [...filled, ...Array(Math.max(0, 6 - filled.length)).fill(null)];
  return (
    <View>
      <View style={wp.labelRow}>
        <View style={wp.labelLeft}>
          <Text style={wp.label}>WORK</Text>
          {isOwn && (
            <TouchableOpacity onPress={onEditSection} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={wp.editPencil}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        {isOwn && <Text style={wp.labelHint}>Tap to replace · ✕ to remove</Text>}
      </View>
      <View style={wp.grid}>
        {slots.map((uri, i) => (
          <View key={i} style={wp.slot}>
            {uri ? (
              isOwn ? (
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => onReplace(i)}>
                  <Image source={{ uri }} style={wp.thumb} resizeMode="cover" />
                  <TouchableOpacity style={wp.removeBtn} onPress={() => onRemove(i)}>
                    <Text style={wp.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <Image source={{ uri }} style={wp.thumb} resizeMode="cover" />
              )
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
    width: SLOT_SIZE, height: SLOT_SIZE,
    borderRadius: 10, overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
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
    position: 'absolute', top: 5, right: 5,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontSize: 10, fontWeight: '900', color: '#fff' },
});

export default function WorkerProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [verifiedAmt, setVerifiedAmt] = useState(0);
  const [verifiedWork, setVerifiedWork] = useState([]);
  const [myUid, setMyUid] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const me = await AsyncStorage.getItem('uid');
      const uid = viewUid || me;
      setMyUid(me);

      if (!uid) { setLoading(false); return; }

      if (uid !== me) {
        recordProfileView(uid, me).catch(() => {});
        isBookmarked(me, uid).then(v => setBookmarked(v)).catch(() => {});
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

      // Verified totals — only meaningful for real Firebase users (and demo profiles)
      if (uid && !uid.startsWith('guest_')) {
        try {
          const [amt, works] = await Promise.all([
            getTotalVerifiedAmount(uid),
            getVerifiedWork(uid),
          ]);
          setVerifiedAmt(amt || 0);
          setVerifiedWork(works || []);
        } catch (_) {}
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

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
    try {
      const myName = await AsyncStorage.getItem('userName') || 'Me';
      const chatId = await createChat(
        { uid: myUid, name: myName },
        { uid: viewUid, name: worker?.name || 'Worker' }
      );
      navigation.navigate('Chat', {
        conversation: {
          id: chatId,
          uid: viewUid,
          name: worker?.name || 'Worker',
          role: worker?.workerSkill || 'Worker',
          emoji: '👤',
          avatarBg: '#F2F2F2',
          online: false,
        },
      });
    } catch (_) { Alert.alert('Error', 'Could not open chat.'); }
  };

  const handleBookmark = async () => {
    if (!myUid || !viewUid || viewUid === myUid) return;
    try {
      const saved = await toggleBookmark(myUid, {
        uid: viewUid,
        name: worker?.name || 'Worker',
        profileType: 'worker',
        category: worker?.workerSkill || '',
        city: worker?.city || '',
      });
      setBookmarked(saved);
    } catch (_) {}
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

  const handleToggleAvailability = () => {
    persistOwnProfileChange({ available: !(worker?.available !== false) });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  };

  const handleChangeAvatar = async () => {
    const uri = await pickImage();
    if (uri) persistOwnProfileChange({ photoUri: uri });
  };

  const handleAddPhoto = async () => {
    const photos = worker?.workPhotos || [];
    if (photos.length >= 6) return;
    const uri = await pickImage();
    if (uri) persistOwnProfileChange({ workPhotos: [...photos, uri] });
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

  // ── Derived display values ────────────────────────────────────────────────
  const isOwn = !viewUid || viewUid === myUid;

  const name       = worker?.name || 'Add your name';
  const skills     = worker?.workerSkills?.length > 0
                       ? worker.workerSkills
                       : worker?.workerSkill ? [worker.workerSkill] : [];
  const primarySkill = worker?.primarySkill || skills[0] || 'Add your skill';
  const skillTags  = worker?.skillTags?.length > 0 ? worker.skillTags : skills.slice(1);
  const experience = worker?.workerExperience || worker?.experience || null;
  const area       = worker?.area   || '';
  const city       = worker?.city   || '';
  const pincode    = worker?.pincode || '';
  const about      = worker?.workerAbout || worker?.bio || '';
  const available  = worker?.available !== false;
  const nativePlace = [worker?.nativePlaceCity, worker?.nativePlaceState].filter(Boolean).join(', ');
  const link       = worker?.link || '';

  // Rating, job count and reviews come only from real completed (verified) work.
  const ratedWork  = verifiedWork.filter(w => w.rating && w.rating > 0);
  const hasRating  = ratedWork.length > 0;
  const rating     = hasRating
    ? (ratedWork.reduce((sum, w) => sum + w.rating, 0) / ratedWork.length).toFixed(1)
    : null;
  const jobsCount  = verifiedWork.length;
  const reviews    = ratedWork.slice().sort((a, b) => {
    const at = a.verifiedAt?.toMillis?.() ?? 0;
    const bt = b.verifiedAt?.toMillis?.() ?? 0;
    return bt - at;
  });

  const locationShort = [area, city].filter(Boolean).join(', ') + (pincode ? ` · ${pincode}` : '');
  const locationFull  = [area, city].filter(Boolean).join(', ') + (pincode ? ` — ${pincode}` : '');
  const amtStr = formatAmountK(verifiedAmt);

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. TOP NAV ──────────────────────────────────────────────────────── */}
      <View style={s.nav}>
        <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
          <Text style={s.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Profile</Text>
        <TouchableOpacity
          style={s.navBtn}
          onPress={isOwn ? handleOpenSettings : handleBookmark}
          activeOpacity={0.7}
        >
          <Text style={s.navShare}>{isOwn ? '⚙️' : (bookmarked ? '🔖' : '☆')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        <View style={s.sheet}>

          {/* ── 2. HERO ─────────────────────────────────────────────────── */}
          <View style={s.heroRow}>
            {isOwn ? (
              <TouchableOpacity style={s.avatar} onPress={handleChangeAvatar} activeOpacity={0.8}>
                {worker?.photoUri ? (
                  <Image source={{ uri: worker.photoUri }} style={s.avatarImg} />
                ) : (
                  <Text style={s.avatarIcon}>👤</Text>
                )}
                <View style={s.avatarEditBadge}>
                  <Text style={s.avatarEditIcon}>📷</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={s.avatar}>
                {worker?.photoUri ? (
                  <Image source={{ uri: worker.photoUri }} style={s.avatarImg} />
                ) : (
                  <Text style={s.avatarIcon}>👤</Text>
                )}
              </View>
            )}
            <View style={s.heroInfo}>
              <View style={s.nameRow}>
                <Text style={s.heroName} numberOfLines={1}>{name}</Text>
                <View style={s.verifiedBadge}>
                  <Text style={s.verifiedText}>✓</Text>
                </View>
              </View>
              <Text style={s.heroSkill} numberOfLines={1}>
                {primarySkill}{experience ? `  ·  ${experience} yrs exp` : ''}
              </Text>
            </View>
          </View>

          {/* ── 2.5 LOCATION LINES ──────────────────────────────────────── */}
          <Text style={s.heroLoc} numberOfLines={1}>
            {locationShort ? `📍 ${locationShort}` : '📍 Add your area'}
          </Text>
          <Text style={s.heroNative} numberOfLines={1}>
            {nativePlace ? `🏠 ${nativePlace}` : '🏠 Add native place'}
          </Text>

          {/* ── 3. STATUS CHIPS ─────────────────────────────────────────── */}
          <View style={s.chipsRow}>
            {isOwn ? (
              <TouchableOpacity onPress={handleToggleAvailability} activeOpacity={0.75}>
                <AvailabilityChip available={available} />
              </TouchableOpacity>
            ) : (
              <AvailabilityChip available={available} />
            )}
          </View>

          {link ? (
            <TouchableOpacity onPress={handleOpenLink} activeOpacity={0.7}>
              <Text style={s.linkText} numberOfLines={1}>🔗 {link}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={s.divider} />

          {/* ── 4. VERIFIED WORK ────────────────────────────────────────── */}
          <View style={s.verHeader}>
            <Text style={s.verLabel}>✓ VERIFIED WORK</Text>
            {isOwn && <Text style={s.verNote}>Verified from completed jobs — cannot be edited</Text>}
          </View>
          <View style={s.verStats}>
            <View style={s.verStat}>
              <Text style={s.verStatAmt}>{amtStr}</Text>
              <Text style={s.verStatLbl}>Earned</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{jobsCount}</Text>
              <Text style={s.verStatLbl}>Jobs</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{worker?.onTimeRate || '—'}</Text>
              <Text style={s.verStatLbl}>On-time</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{hasRating ? `★ ${rating}` : '—'}</Text>
              <Text style={s.verStatLbl}>Rating</Text>
            </View>
          </View>

          {/* ── 4.5 ACTION BUTTONS ───────────────────────────────────────── */}
          <View style={s.actionRow}>
            {isOwn ? (
              <TouchableOpacity style={s.editProfileBtn} onPress={handleEditProfile} activeOpacity={0.85}>
                <Text style={s.editProfileBtnText}>✏️  Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[s.callBtn, !available && s.callBtnLocked]}
                  onPress={handleCall}
                  disabled={!available}
                  activeOpacity={0.85}
                >
                  <Text style={[s.callBtnText, !available && s.callBtnTextLocked]}>
                    {available ? '📞  Call' : '🔒  Call'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.chatBtn} onPress={handleChat} activeOpacity={0.85}>
                  <Text style={s.chatBtnText}>💬  Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.bookmarkBtn} onPress={handleBookmark} activeOpacity={0.85}>
                  <Text style={s.bookmarkIcon}>{bookmarked ? '🔖' : '☆'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={s.divider} />

          {/* ── 5. SKILLS ───────────────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>SKILLS</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('skills')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          {(primarySkill && primarySkill !== 'Add your skill') || skillTags.length > 0 || skills.length > 0 ? (
            <>
              {primarySkill && primarySkill !== 'Add your skill' && (
                <View style={s.primarySkillChip}>
                  <Text style={s.primarySkillText}>{primarySkill}</Text>
                  <Text style={s.primarySkillBadge}>Designation</Text>
                </View>
              )}
              {skillTags.length > 0 && (
                <View style={[s.chipsWrap, { marginTop: 10 }]}>
                  {skillTags.map((sk, i) => (
                    <View key={i} style={s.hashChip}>
                      <Text style={s.hashChipText}>#{sk.toLowerCase()}</Text>
                    </View>
                  ))}
                </View>
              )}
              {/* Fallback: old profiles with only workerSkills, no primarySkill/skillTags */}
              {!worker?.primarySkill && skillTags.length === 0 && skills.length > 1 && (
                <View style={[s.chipsWrap, { marginTop: 10 }]}>
                  {skills.slice(1).map((sk, i) => (
                    <View key={i} style={s.hashChip}>
                      <Text style={s.hashChipText}>#{sk.toLowerCase()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={s.placeholder}>No skills added yet</Text>
          )}

          <View style={s.divider} />

          {/* ── 6. ABOUT ────────────────────────────────────────────────── */}
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

          {/* ── 6.5 WORK PHOTOS ─────────────────────────────────────────── */}
          <WorkPhotoGrid
            photos={worker?.workPhotos}
            isOwn={isOwn}
            onAdd={handleAddPhoto}
            onReplace={handleReplacePhoto}
            onRemove={handleRemovePhoto}
            onEditSection={() => handleEditSection('work')}
          />

          <View style={s.divider} />

          {/* ── 7.5 REVIEWS ─────────────────────────────────────────────── */}
          <Text style={s.sLabel}>REVIEWS</Text>
          {reviews.length === 0 ? (
            <Text style={s.placeholder}>No reviews yet</Text>
          ) : (
            reviews.map((r, i) => (
              <View key={r.id || i} style={[s.reviewRow, i > 0 && s.reviewRowBorder]}>
                <View style={s.reviewTop}>
                  <Text style={s.reviewName}>{r.customerName || 'Customer'}</Text>
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

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  // ── TOP NAV
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: BORDER,
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  heroName: { fontSize: 18, fontWeight: '700', color: DARK, flexShrink: 1 },
  verifiedBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { fontSize: 10, color: '#fff', fontWeight: '900' },
  heroSkill: { fontSize: 13, fontWeight: '500', color: MID, marginBottom: 3 },
  heroLoc:   { fontSize: 12, color: LIGHT },
  heroNative: { fontSize: 12, color: LIGHT, marginTop: 3 },

  // ── STATUS CHIPS
  chipsRow: { flexDirection: 'row', gap: 8 },
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
  linkText: { fontSize: 12, fontWeight: '600', color: '#1877F2', marginTop: 8 },

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
  editPencil: { fontSize: 13 },

  // ── SKILLS
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  skillChipText: { fontSize: 12, fontWeight: '500', color: DARK },
  primarySkillChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: FILL, borderRadius: 12, padding: 12,
  },
  primarySkillText: { fontSize: 15, fontWeight: '700', color: DARK, flex: 1 },
  primarySkillBadge: {
    fontSize: 9, fontWeight: '700', color: GREEN,
    backgroundColor: GREEN_LIGHT, paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, letterSpacing: 0.5, textTransform: 'uppercase',
  },
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
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewName: { fontSize: 13, fontWeight: '700', color: DARK },
  reviewDate: { fontSize: 11, color: LIGHT, fontWeight: '500' },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 6 },
  reviewStarIcon: { fontSize: 14, color: BORDER },
  reviewStarActive: { color: STAR },
  reviewComment: { fontSize: 13, color: MID, lineHeight: 20, fontStyle: 'italic' },

  // ── ACTION BUTTONS
  actionRow: {
    flexDirection: 'row', gap: 8, marginTop: 16,
  },
  callBtn: {
    flex: 2, height: 50, borderRadius: 14,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  callBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  callBtnLocked: { backgroundColor: FILL },
  callBtnTextLocked: { color: LIGHT },
  chatBtn: {
    flex: 1.5, height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  chatBtnText: { color: DARK, fontWeight: '600', fontSize: 14 },
  bookmarkBtn: {
    width: 50, height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  bookmarkIcon: { fontSize: 20 },
  editProfileBtn: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  editProfileBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});
