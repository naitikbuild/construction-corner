import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';

const GREEN       = '#4CAF50';
const GREEN_LIGHT = '#F0FDF4';
const YELLOW      = '#E8A900';
const BORDER      = '#E2E8F0';
const TEXT        = '#0F172A';
const MUTED       = '#64748B';
const CARD        = '#F8FAFC';

const FILTERS = ['All', '5 ★', '4 ★', '3 ★', '2 ★', '1 ★'];

const REVIEWS = [
  {
    id: 1, rating: 5,
    author: 'Naitik Rathod', authorEmoji: '🏠', role: 'Property Owner',
    workType: 'RCC Slab Work', amount: '₹20,000',
    date: '04 Apr 2026', verified: true,
    tags: ['On Time', 'Clean Work', 'Professional'],
    text: 'Excellent work! Ramesh and his team completed the RCC slab on time without any defects. Very professional attitude and clean site. Will definitely hire again.',
  },
  {
    id: 2, rating: 5,
    author: 'Kavya Shah', authorEmoji: '🏠', role: 'Property Owner',
    workType: 'Tile Flooring', amount: '₹12,000',
    date: '12 Feb 2026', verified: true,
    tags: ['Skilled', 'Value for Money', 'Would Recommend'],
    text: 'Perfect tile laying. No lippage, all joints perfectly aligned. Highly recommend for premium tile work.',
  },
  {
    id: 3, rating: 4,
    author: 'Suresh Patel', authorEmoji: '👷', role: 'Site Supervisor',
    workType: 'Brickwork & Plaster', amount: '₹15,000',
    date: '18 Mar 2026', verified: true,
    tags: ['Good Communication', 'Honest'],
    text: 'Good brickwork overall. Minor delay due to material shortage but communicated well. Final finish was very good.',
  },
  {
    id: 4, rating: 5,
    author: 'Rahul Mehta', authorEmoji: '🏢', role: 'Builder',
    workType: 'Foundation Work', amount: '₹45,000',
    date: '10 Dec 2025', verified: true,
    tags: ['Professional', 'On Time', 'Skilled', 'Would Recommend'],
    text: 'Ramesh handled the foundation work for our G+3 building project. Very experienced team, followed all specifications. One of the best masons we\'ve worked with.',
  },
  {
    id: 5, rating: 4,
    author: 'Priya Agarwal', authorEmoji: '🏠', role: 'Homeowner',
    workType: 'Waterproofing', amount: '₹9,500',
    date: '28 Jan 2026', verified: true,
    tags: ['Clean Work', 'Value for Money'],
    text: 'Waterproofing done well. No leaks in the terrace after the last 3 monsoon cycles. Recommended.',
  },
  {
    id: 6, rating: 3,
    author: 'Ankit Verma', authorEmoji: '🏠', role: 'Property Owner',
    workType: 'Plastering', amount: '₹8,000',
    date: '05 Mar 2026', verified: true,
    tags: ['Good Communication'],
    text: 'Work was decent but took 2 extra days. Finish quality was acceptable. Price was fair.',
  },
  {
    id: 7, rating: 5,
    author: 'Dimple Singh', authorEmoji: '🏠', role: 'Interior Designer',
    workType: 'RCC Beam Work', amount: '₹22,000',
    date: '08 Nov 2025', verified: true,
    tags: ['Professional', 'Skilled', 'On Time'],
    text: 'Excellent beam casting. Perfect shuttering alignment, no honeycombing. This is the third project we\'ve given Ramesh and he has never disappointed.',
  },
];

const STATS = {
  avg: 4.6,
  total: 47,
  dist: { 5: 32, 4: 9, 3: 4, 2: 1, 1: 1 },
};

function StarDisplay({ value, size = 14 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ fontSize: size, color: s <= value ? YELLOW : '#D1D5DB' }}>
          {s <= value ? '★' : '☆'}
        </Text>
      ))}
    </View>
  );
}

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={ss.barRow}>
      <Text style={ss.barLabel}>{star}★</Text>
      <View style={ss.barTrack}>
        <View style={[ss.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={ss.barCount}>{count}</Text>
    </View>
  );
}

export default function ReviewsListScreen({ navigation, route }) {
  const { workerName = 'Ramesh Vishwakarma', workerEmoji = '👷', role = 'Expert Mason' } =
    route?.params ?? {};

  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All'
    ? REVIEWS
    : REVIEWS.filter((r) => r.rating === parseInt(filter[0]));

  return (
    <View style={ss.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={ss.header}>
        <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()}>
          <Text style={ss.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={ss.headerCenter}>
          <Text style={ss.headerTitle}>Reviews</Text>
          <Text style={ss.headerSub}>{workerName}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={ss.scroll} showsVerticalScrollIndicator={false}>

        {/* SUMMARY CARD */}
        <View style={ss.summaryCard}>
          <View style={ss.summaryLeft}>
            <Text style={ss.bigScore}>{STATS.avg}</Text>
            <StarDisplay value={Math.round(STATS.avg)} size={20} />
            <Text style={ss.totalReviews}>{STATS.total} verified reviews</Text>
            <View style={ss.verifiedPill}>
              <Text style={ss.verifiedText}>✓ CC Verified Work</Text>
            </View>
          </View>
          <View style={ss.summaryRight}>
            {[5, 4, 3, 2, 1].map((s) => (
              <RatingBar key={s} star={s} count={STATS.dist[s]} total={STATS.total} />
            ))}
          </View>
        </View>

        {/* HIGHLIGHT TAGS */}
        <View style={ss.highlightRow}>
          {['On Time', 'Professional', 'Skilled', 'Clean Work', 'Honest'].map((tag) => (
            <View key={tag} style={ss.hlTag}>
              <Text style={ss.hlTagText}>✓ {tag}</Text>
            </View>
          ))}
        </View>

        {/* FILTER TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={ss.filterScroll}
          contentContainerStyle={ss.filterContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[ss.filterTab, filter === f && ss.filterTabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[ss.filterText, filter === f && ss.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* COUNT */}
        <View style={ss.countRow}>
          <Text style={ss.countText}>
            {filtered.length} review{filtered.length !== 1 ? 's' : ''}
            {filter !== 'All' ? ` for ${filter}` : ''}
          </Text>
        </View>

        {/* REVIEW CARDS */}
        <View style={ss.listPad}>
          {filtered.map((review) => (
            <View key={review.id} style={ss.reviewCard}>
              {/* Card header */}
              <View style={ss.reviewHeader}>
                <View style={ss.reviewAvatar}>
                  <Text style={ss.reviewEmoji}>{review.authorEmoji}</Text>
                </View>
                <View style={ss.reviewMeta}>
                  <Text style={ss.reviewAuthor}>{review.author}</Text>
                  <Text style={ss.reviewRole}>{review.role}</Text>
                </View>
                <View style={ss.reviewRight}>
                  <StarDisplay value={review.rating} size={13} />
                  <Text style={ss.reviewDate}>{review.date}</Text>
                </View>
              </View>

              {/* Work pill */}
              <View style={ss.workPill}>
                <Text style={ss.workPillText}>📋 {review.workType}</Text>
                <Text style={ss.workPillAmt}> · {review.amount}</Text>
                {review.verified && (
                  <View style={ss.verifiedMini}>
                    <Text style={ss.verifiedMiniText}>✓ Verified</Text>
                  </View>
                )}
              </View>

              {/* Tags */}
              {review.tags.length > 0 && (
                <View style={ss.tagsRow}>
                  {review.tags.map((tag) => (
                    <View key={tag} style={ss.tagChip}>
                      <Text style={ss.tagChipText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Review text */}
              {review.text ? (
                <Text style={ss.reviewText}>{review.text}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <View style={ss.empty}>
            <Text style={ss.emptyEmoji}>📭</Text>
            <Text style={ss.emptyTitle}>No {filter} reviews yet</Text>
            <Text style={ss.emptySub}>Be the first to leave a review for this rating.</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  backBtn: { width: 36, padding: 4 },
  backArrow: { fontSize: 22, color: TEXT },
  headerCenter: { alignItems: 'center', gap: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },
  headerSub: { fontSize: 12, color: MUTED, fontWeight: '500' },

  scroll: { flex: 1 },

  // Summary card
  summaryCard: {
    flexDirection: 'row', gap: 16,
    margin: 16, padding: 18,
    backgroundColor: CARD, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', width: 100, gap: 4 },
  bigScore: { fontSize: 48, fontWeight: '900', color: TEXT, lineHeight: 54 },
  totalReviews: { fontSize: 11, color: MUTED, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  verifiedPill: {
    backgroundColor: GREEN_LIGHT, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  verifiedText: { fontSize: 10, color: GREEN, fontWeight: '700' },
  summaryRight: { flex: 1, gap: 4, justifyContent: 'center' },

  // Rating bars
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { fontSize: 12, color: MUTED, fontWeight: '600', width: 20 },
  barTrack: {
    flex: 1, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: YELLOW },
  barCount: { fontSize: 11, color: MUTED, width: 22, textAlign: 'right' },

  // Highlight tags
  highlightRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, marginBottom: 4,
  },
  hlTag: {
    backgroundColor: GREEN_LIGHT, borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  hlTagText: { fontSize: 12, color: GREEN, fontWeight: '700' },

  // Filters
  filterScroll: { marginTop: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: '#fff',
  },
  filterTabActive: { backgroundColor: TEXT, borderColor: TEXT },
  filterText: { fontSize: 13, fontWeight: '600', color: MUTED },
  filterTextActive: { color: '#fff' },

  // Count
  countRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  countText: { fontSize: 13, color: MUTED, fontWeight: '600' },

  // Review cards
  listPad: { paddingHorizontal: 16, gap: 12 },
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    padding: 16, gap: 10,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reviewAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  reviewEmoji: { fontSize: 20 },
  reviewMeta: { flex: 1, gap: 2 },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: TEXT },
  reviewRole: { fontSize: 12, color: MUTED },
  reviewRight: { alignItems: 'flex-end', gap: 3 },
  reviewDate: { fontSize: 11, color: MUTED },

  // Work pill
  workPill: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  workPillText: { fontSize: 12, color: '#0EA5E9', fontWeight: '600' },
  workPillAmt: { fontSize: 12, color: MUTED },
  verifiedMini: {
    backgroundColor: GREEN_LIGHT, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  verifiedMiniText: { fontSize: 10, color: GREEN, fontWeight: '700' },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: {
    backgroundColor: '#F1F5F9', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tagChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },

  // Text
  reviewText: { fontSize: 13, color: '#334155', lineHeight: 20 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 6 },
  emptySub: { fontSize: 13, color: MUTED, textAlign: 'center' },
});
