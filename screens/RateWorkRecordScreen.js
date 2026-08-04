import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StatusBar, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { injectFonts } from '../theme/typography';
import { getCurrentUid } from '../utils/session';
import { getProfile } from '../services/userService';
import { getWorkRecord, confirmWorkRecord, WORK_RECORD_STATUS } from '../services/workRecordService';
import { sendNotification } from '../services/notificationService';

const DARK   = '#262626';
const GREEN  = '#22A559';
const GREEN_LIGHT = '#EAF7EF';
const BG     = '#FAF9F5';
const FILL   = '#F2F2F2';
const BORDER = '#E5E5E5';
const MID    = '#737373';
const LIGHT  = '#8E8E8E';

const MAX_REVIEW_PHOTOS = 6;

const OVERALL_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const CATEGORIES = [
  { key: 'quality', label: 'Quality of work' },
  { key: 'timeliness', label: 'Timeliness' },
  { key: 'behaviour', label: 'Behaviour' },
  { key: 'value', label: 'Value for money' },
];

function OverallStars({ value, onChange }) {
  return (
    <View style={s.overallStarsRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
          <Text style={[s.overallStar, n <= value && s.overallStarActive]}>{n <= value ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CategoryStarRow({ label, value, onChange }) {
  return (
    <View style={s.catRow}>
      <Text style={s.catLabel}>{label}</Text>
      <View style={s.catStars}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
            <Text style={[s.catStar, n <= value && s.catStarActive]}>{n <= value ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Part 2 of the client confirm+rate flow — reached from
// ClientWorkRecordReviewScreen's "Confirm & Rate" button. Posting here is
// what flips the work record to 'confirmed', the only status that counts
// toward the provider's verified totals (see workRecordService.js).
export default function RateWorkRecordScreen({ navigation, route }) {
  const recordId = route?.params?.recordId ?? null;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [provider, setProvider] = useState(null);
  const [myUid, setMyUid] = useState(null);

  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({ quality: 0, timeliness: 0, behaviour: 0, value: 0 });
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!recordId) { setLoading(false); return; }
    try {
      // Prefer the live Firebase Auth uid over the cached AsyncStorage copy —
      // a stale cache here would misidentify the client and write the wrong
      // uid into confirmedBy.
      const me = await getCurrentUid();
      setMyUid(me);
      const rec = await getWorkRecord(recordId);
      setRecord(rec);
      if (rec?.providerId) {
        try { setProvider(await getProfile(rec.providerId)); } catch (_) {}
      }
    } catch (_) {
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => { load(); }, [load]);

  const isClient = !!myUid && !!record && record.clientId === myUid;
  const providerName = provider?.name || provider?.companyName || record?.lockedByName || 'the provider';

  const setCategoryRating = (key, val) => {
    setCategoryRatings(prev => ({ ...prev, [key]: val }));
  };

  const handleAddPhoto = async () => {
    if (photos.length >= MAX_REVIEW_PHOTOS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostReview = async () => {
    if (overallRating === 0) {
      Alert.alert('Add a rating', 'Please give an overall star rating before posting.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmWorkRecord(recordId, {
        rating: overallRating,
        categoryRatings,
        review: reviewText,
        reviewPhotos: photos,
        confirmedBy: myUid,
      });
      await sendNotification(
        record.providerId,
        'work_confirmed',
        `${record.clientName || 'The client'} confirmed and rated your work — ${overallRating}★. Tap to rate them back.`,
        { recordId }
      );
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not post your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <ActivityIndicator size="large" color={DARK} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={s.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Rate the work</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyText}>This work record could not be found.</Text>
        </View>
      </View>
    );
  }

  if (!isClient) {
    return (
      <View style={s.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Rate the work</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyText}>Only {record.clientName || 'the client'} can rate this work.</Text>
        </View>
      </View>
    );
  }

  if (record.status === WORK_RECORD_STATUS.CONFIRMED && !submitted) {
    return (
      <View style={s.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Rate the work</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyText}>You already rated this work{record.rating ? ` — ${record.rating}★` : ''}.</Text>
        </View>
      </View>
    );
  }

  if (record.status === WORK_RECORD_STATUS.DISPUTED) {
    return (
      <View style={s.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Rate the work</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyText}>You raised an issue with this work record instead of rating it.</Text>
        </View>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={s.successScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Text style={s.successIcon}>🎉</Text>
        <Text style={s.successTitle}>Review Posted!</Text>
        <Text style={s.successSub}>Thanks for confirming — this now counts toward {providerName}'s verified work.</Text>
        <View style={s.successStars}>
          {[1, 2, 3, 4, 5].map(n => (
            <Text key={n} style={[s.successStar, n <= overallRating && s.successStarActive]}>
              {n <= overallRating ? '★' : '☆'}
            </Text>
          ))}
        </View>
        <TouchableOpacity style={s.doneBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Rate the work</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">

        <View style={s.introWrap}>
          <View style={s.providerAvatar}>
            {provider?.photoUri ? (
              <Image source={{ uri: provider.photoUri }} style={s.providerAvatarImg} />
            ) : (
              <Text style={{ fontSize: 26 }}>👤</Text>
            )}
          </View>
          <Text style={s.introQuestion}>How was {providerName}'s work?</Text>
          <Text style={s.introProject} numberOfLines={2}>{record.projectName || 'Untitled project'}</Text>
        </View>

        <OverallStars value={overallRating} onChange={setOverallRating} />
        <Text style={s.overallLabel}>{overallRating === 0 ? 'Tap to rate' : OVERALL_LABELS[overallRating]}</Text>

        <View style={s.divider} />

        <Text style={s.sectionLabel}>RATE BY CATEGORY</Text>
        <View style={s.catCard}>
          {CATEGORIES.map((c, i) => (
            <View key={c.key} style={[s.catRowWrap, i > 0 && s.catRowBorder]}>
              <CategoryStarRow
                label={c.label}
                value={categoryRatings[c.key]}
                onChange={(v) => setCategoryRating(c.key, v)}
              />
            </View>
          ))}
        </View>

        <View style={s.divider} />

        <Text style={s.sectionLabel}>WRITE A REVIEW</Text>
        <View style={s.fieldWrap}>
          <TextInput
            style={s.textArea}
            placeholder={`Share your experience working with ${providerName}...`}
            placeholderTextColor={LIGHT}
            multiline
            numberOfLines={4}
            value={reviewText}
            onChangeText={setReviewText}
            textAlignVertical="top"
          />
        </View>

        <View style={s.fieldWrap}>
          <View style={s.sectionHeadRow}>
            <Text style={s.fieldLabel}>Add photos <Text style={s.optionalText}>(optional)</Text></Text>
            <Text style={s.photoCounter}>{photos.length} / {MAX_REVIEW_PHOTOS}</Text>
          </View>
          <View style={s.photoGrid}>
            {photos.map((uri, i) => (
              <View key={i} style={s.photoSlot}>
                <Image source={{ uri }} style={s.photoThumb} />
                <TouchableOpacity style={s.photoXBtn} onPress={() => handleRemovePhoto(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={s.photoXBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < MAX_REVIEW_PHOTOS && (
              <TouchableOpacity style={s.photoAddBtn} onPress={handleAddPhoto} activeOpacity={0.8}>
                <Text style={s.photoAddIcon}>📷</Text>
                <Text style={s.photoAddText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[s.postBtn, (submitting || overallRating === 0) && s.btnDisabled]}
          onPress={handlePostReview}
          activeOpacity={0.85}
          disabled={submitting || overallRating === 0}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.postBtnText}>Post review</Text>}
        </TouchableOpacity>

        <View style={{ height: Math.max(insets.bottom, 12) }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: LIGHT, fontWeight: '600', textAlign: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, fontWeight: '700', color: DARK },
  headerTitle: { fontSize: 15, fontWeight: '600', color: DARK },

  introWrap: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 22, paddingBottom: 6 },
  providerAvatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12,
  },
  providerAvatarImg: { width: 64, height: 64, borderRadius: 32 },
  introQuestion: { fontSize: 16, fontWeight: '700', color: DARK, textAlign: 'center' },
  introProject: { fontSize: 13, color: MID, fontWeight: '500', textAlign: 'center', marginTop: 4 },

  overallStarsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 18 },
  overallStar: { fontSize: 40, color: '#D9D9D9' },
  overallStarActive: { color: GREEN },
  overallLabel: { fontSize: 13, color: MID, fontWeight: '600', textAlign: 'center', marginTop: 8 },

  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14, marginTop: 20, marginBottom: 4 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: LIGHT, letterSpacing: 0.8,
    paddingHorizontal: 14, marginTop: 14, marginBottom: 8,
  },

  catCard: {
    marginHorizontal: 14, borderRadius: 12, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  catRowWrap: { paddingHorizontal: 14, paddingVertical: 12 },
  catRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catLabel: { fontSize: 13, color: DARK, fontWeight: '600', flex: 1 },
  catStars: { flexDirection: 'row', gap: 3 },
  catStar: { fontSize: 20, color: '#D9D9D9' },
  catStarActive: { color: GREEN },

  fieldWrap: { paddingHorizontal: 14, marginTop: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: DARK },
  optionalText: { fontSize: 12, fontWeight: '500', color: LIGHT },
  textArea: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    backgroundColor: '#FFFFFF', padding: 14,
    fontSize: 14, color: DARK, lineHeight: 22, minHeight: 100,
  },

  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  photoCounter: { fontSize: 12, color: LIGHT, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoSlot: { width: 84, height: 84, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', height: '100%' },
  photoXBtn: {
    position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  photoXBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  photoAddBtn: {
    width: 84, height: 84, borderRadius: 10,
    borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  photoAddIcon: { fontSize: 18, marginBottom: 3 },
  photoAddText: { fontSize: 11, fontWeight: '700', color: MID },

  postBtn: {
    marginHorizontal: 14, marginTop: 22, height: 52, borderRadius: 14,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  postBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  btnDisabled: { opacity: 0.6 },

  // ── Success state
  successScreen: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  successIcon: { fontSize: 60 },
  successTitle: { fontSize: 22, fontWeight: '800', color: DARK },
  successSub: { fontSize: 13, color: MID, textAlign: 'center', lineHeight: 20 },
  successStars: { flexDirection: 'row', gap: 6 },
  successStar: { fontSize: 26, color: '#D9D9D9' },
  successStarActive: { color: GREEN },
  doneBtn: {
    marginTop: 8, backgroundColor: DARK, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
