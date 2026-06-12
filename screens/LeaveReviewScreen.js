import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const GREEN      = '#4CAF50';
const GREEN_LIGHT = '#F0FDF4';
const BORDER     = '#E2E8F0';
const TEXT       = '#0F172A';
const MUTED      = '#64748B';
const CARD       = '#F8FAFC';

// Instagram-style gradient button
function GradBtn({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[ss.gradWrap, disabled && { opacity: 0.45 }]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={disabled}
    >
      <View style={ss.gradBg} pointerEvents="none">
        {['#FF6B2B', '#FF7A35', '#FF8840', '#FF8C00'].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <Text style={ss.gradLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Star picker
function StarPicker({ value, onChange }) {
  return (
    <View style={ss.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange(s)} activeOpacity={0.7}>
          <Text style={[ss.star, s <= value && ss.starActive]}>{s <= value ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const QUALITY_TAGS = [
  'On Time',
  'Clean Work',
  'Professional',
  'Good Communication',
  'Value for Money',
  'Would Recommend',
  'Skilled',
  'Honest',
];

const ISSUE_TAGS = [
  'Delay',
  'Poor Finish',
  'Extra Charges',
  'Unresponsive',
  'Waste Left',
];

// Passed via route.params: workerName, workerEmoji, role, workType, amount
const DEFAULTS = {
  workerName: 'Ramesh Vishwakarma',
  workerEmoji: '👷',
  role: 'Expert Mason',
  workType: 'RCC Slab Work',
  amount: '₹20,000',
};

export default function LeaveReviewScreen({ navigation, route }) {
  const worker = route?.params ?? DEFAULTS;

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isGoodRating = rating >= 3;
  const tags = isGoodRating ? QUALITY_TAGS : ISSUE_TAGS;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleRatingChange = (val) => {
    setRating(val);
    setSelectedTags([]); // reset tags when rating tier changes
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rate the Work', 'Please give a star rating before submitting.');
      return;
    }
    try {
      const reviewerUid = await AsyncStorage.getItem('uid');
      await addDoc(collection(db, 'reviews'), {
        reviewerUid: reviewerUid || null,
        workerUid: worker.workerUid || null,
        workerName: worker.workerName,
        workType: worker.workType,
        amount: worker.amount,
        rating,
        tags: selectedTags,
        text: reviewText.trim(),
        createdAt: serverTimestamp(),
      });
    } catch (_) {
      // Optimistically show success even if save fails
    }
    setSubmitted(true);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Review?',
      'You can still leave a review later from Work History.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: () => navigation.navigate('WorkHistory') },
      ]
    );
  };

  // ─── Success state ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={ss.successScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text style={ss.successEmoji}>🎉</Text>
        <Text style={ss.successTitle}>Review Submitted!</Text>
        <Text style={ss.successSub}>
          Thank you for your feedback. It helps the community find great workers.
        </Text>
        <View style={ss.successStars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Text key={s} style={[ss.successStar, s <= rating && ss.successStarActive]}>
              {s <= rating ? '★' : '☆'}
            </Text>
          ))}
        </View>
        {selectedTags.length > 0 && (
          <View style={ss.successTags}>
            {selectedTags.map((tag) => (
              <View key={tag} style={ss.successTag}>
                <Text style={ss.successTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={ss.doneBtn}
          onPress={() => navigation.navigate('WorkHistory')}
          activeOpacity={0.85}
        >
          <Text style={ss.doneBtnText}>View Work History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.7}>
          <Text style={ss.homeLink}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────────
  return (
    <View style={ss.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={ss.header}>
        <TouchableOpacity style={ss.backBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={ss.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={ss.headerTitle}>Leave a Review</Text>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={ss.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={ss.scroll}
        contentContainerStyle={ss.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* WORKER CARD */}
        <View style={ss.workerCard}>
          <View style={ss.workerAvatar}>
            <Text style={ss.workerEmoji}>{worker.workerEmoji}</Text>
          </View>
          <View style={ss.workerInfo}>
            <Text style={ss.workerName}>{worker.workerName}</Text>
            <Text style={ss.workerRole}>{worker.role}</Text>
            <View style={ss.workTypePill}>
              <Text style={ss.workTypeText}>📋 {worker.workType}</Text>
              <Text style={ss.workAmt}> · {worker.amount}</Text>
            </View>
          </View>
          <View style={ss.verifiedBadge}>
            <Text style={ss.verifiedText}>✓ Verified</Text>
          </View>
        </View>

        {/* STAR RATING */}
        <View style={ss.section}>
          <Text style={ss.sectionTitle}>How was the work quality?</Text>
          <StarPicker value={rating} onChange={handleRatingChange} />
          {rating > 0 && (
            <Text style={ss.starLabel}>{STAR_LABELS[rating]}</Text>
          )}
        </View>

        {/* TAGS */}
        {rating > 0 && (
          <View style={ss.section}>
            <Text style={ss.sectionTitle}>
              {isGoodRating ? 'What went well?' : 'What was the issue?'}
            </Text>
            <Text style={ss.sectionSub}>Select all that apply</Text>
            <View style={ss.tagsWrap}>
              {tags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[ss.tag, active && (isGoodRating ? ss.tagGoodActive : ss.tagBadActive)]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.75}
                  >
                    <Text style={[ss.tagText, active && ss.tagTextActive]}>
                      {isGoodRating && active ? '✓ ' : ''}{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* TEXT REVIEW */}
        {rating > 0 && (
          <View style={ss.section}>
            <Text style={ss.sectionTitle}>Write a review <Text style={ss.optional}>(optional)</Text></Text>
            <TextInput
              style={ss.textInput}
              placeholder={
                isGoodRating
                  ? 'Tell others what you liked about the work...'
                  : 'Describe the issue in detail...'
              }
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              maxLength={300}
            />
            <Text style={ss.charCount}>{reviewText.length}/300</Text>
          </View>
        )}

        {/* TIPS */}
        <View style={ss.tipBox}>
          <Text style={ss.tipTitle}>💡 Why reviews matter</Text>
          <Text style={ss.tipText}>
            Your honest review helps other customers choose the right professional and motivates
            workers to deliver quality every time.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={ss.footer}>
        <GradBtn
          label={rating === 0 ? 'Select a Rating First' : `Submit Review  ★${rating}.0`}
          onPress={handleSubmit}
          disabled={rating === 0}
        />
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: TEXT },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },
  skipText: { fontSize: 14, fontWeight: '600', color: MUTED },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Worker card
  workerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderRadius: 16,
    padding: 16, gap: 12, marginBottom: 24,
    borderWidth: 1, borderColor: BORDER,
  },
  workerAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  workerEmoji: { fontSize: 28 },
  workerInfo: { flex: 1, gap: 3 },
  workerName: { fontSize: 16, fontWeight: '800', color: TEXT },
  workerRole: { fontSize: 13, color: MUTED, fontWeight: '500' },
  workTypePill: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  workTypeText: { fontSize: 12, color: '#FF6B2B', fontWeight: '600' },
  workAmt: { fontSize: 12, color: MUTED, fontWeight: '500' },
  verifiedBadge: {
    backgroundColor: GREEN_LIGHT, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  verifiedText: { fontSize: 11, color: GREEN, fontWeight: '700' },

  // Star rating
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 10 },
  sectionSub: { fontSize: 12, color: MUTED, marginBottom: 10, marginTop: -6 },
  starRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  star: { fontSize: 42, color: '#D1D5DB' },
  starActive: { color: '#E8A900' },
  starLabel: {
    fontSize: 15, fontWeight: '700', color: '#E8A900', marginTop: 6,
  },

  // Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: '#fff',
  },
  tagGoodActive: { backgroundColor: GREEN_LIGHT, borderColor: GREEN },
  tagBadActive: { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
  tagText: { fontSize: 13, fontWeight: '600', color: MUTED },
  tagTextActive: { color: TEXT },

  // Text input
  textInput: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    padding: 14, fontSize: 14, color: TEXT, lineHeight: 22,
    backgroundColor: CARD, minHeight: 100, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: MUTED, textAlign: 'right', marginTop: 4 },
  optional: { color: MUTED, fontWeight: '400' },

  // Tip
  tipBox: {
    backgroundColor: '#FFFBEB', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#FDE68A',
    marginBottom: 8,
  },
  tipTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  tipText: { fontSize: 12, color: '#78350F', lineHeight: 18 },

  // Footer
  footer: {
    padding: 20, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: '#fff',
  },

  // Gradient button
  gradWrap: {
    height: 52, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  gradBg: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  gradLabel: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  // Success
  successScreen: {
    flex: 1, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: TEXT, marginBottom: 8 },
  successSub: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  successStars: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  successStar: { fontSize: 32, color: '#D1D5DB' },
  successStarActive: { color: '#E8A900' },
  successTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 28 },
  successTag: { backgroundColor: GREEN_LIGHT, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  successTagText: { fontSize: 12, fontWeight: '700', color: GREEN },
  doneBtn: {
    backgroundColor: TEXT, borderRadius: 14,
    paddingHorizontal: 40, paddingVertical: 14, marginBottom: 14,
  },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  homeLink: { fontSize: 14, color: MUTED, fontWeight: '600' },
});
