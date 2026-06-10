import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVerifiedWork } from '../services/workService';

const GREEN       = '#4CAF50';
const GREEN_LIGHT = '#F0FDF4';
const YELLOW      = '#E8A900';
const BORDER      = '#E2E8F0';
const TEXT        = '#0F172A';
const MUTED       = '#64748B';
const CARD        = '#F8FAFC';

const FILTERS = ['All', '5 ★', '4 ★', '3 ★', '2 ★', '1 ★'];

function StarDisplay({ value }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={[styles.starIcon, s <= value && styles.starActive]}>
          {s <= value ? '★' : '☆'}
        </Text>
      ))}
      <Text style={styles.ratingLabel}>{value}.0 / 5.0</Text>
    </View>
  );
}

function ReviewCard({ review }) {
  return (
    <View style={styles.reviewCard}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={styles.authorAvatar}>
          <Text style={{ fontSize: 22 }}>🏠</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.authorNameRow}>
            <Text style={styles.authorName}>{review.author}</Text>
            {review.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.authorRole}>{review.role}</Text>
        </View>
        <Text style={styles.reviewDate}>{review.date}</Text>
      </View>

      {/* Stars */}
      <StarDisplay value={review.rating} />

      {/* Work type & amount */}
      <View style={styles.workBadgeRow}>
        <View style={styles.workTypeBadge}>
          <Text style={styles.workTypeText}>🏗️ {review.workType}</Text>
        </View>
        <Text style={styles.reviewAmount}>{review.amount}</Text>
      </View>

      {/* Review text */}
      {review.text ? (
        <Text style={styles.reviewText}>"{review.text}"</Text>
      ) : null}

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {review.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ReviewsListScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;
  const [activeFilter, setActiveFilter] = useState('All');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avg: 0, count: 0 });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const uid = viewUid || await AsyncStorage.getItem('uid');
      if (!uid) { setLoading(false); return; }

      const works = await getVerifiedWork(uid);
      const withReviews = works.filter(w => w.rating && w.rating > 0);

      const mapped = withReviews.map((w, i) => ({
        id: w.id || i,
        rating: w.rating || 5,
        author: w.customerName || 'Customer',
        role: 'Verified Client',
        workType: w.workType || w.description?.split(' ').slice(0, 3).join(' ') || 'Construction Work',
        amount: `₹${Number(w.amount || 0).toLocaleString('en-IN')}`,
        date: w.date || '',
        verified: true,
        text: w.review || '',
        tags: buildTags(w.rating),
      }));

      setReviews(mapped);

      if (mapped.length > 0) {
        const total = mapped.reduce((s, r) => s + r.rating, 0);
        setStats({
          total: mapped.length,
          avg: (total / mapped.length).toFixed(1),
          count: mapped.length,
        });
      }
    } catch (_) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const buildTags = (rating) => {
    if (rating >= 5) return ['Excellent Work', 'Would Recommend', 'On Time'];
    if (rating >= 4) return ['Good Work', 'Professional'];
    if (rating >= 3) return ['Satisfactory'];
    return [];
  };

  const filtered = activeFilter === 'All'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(activeFilter));

  const avgRating = stats.avg || 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={{ marginTop: 12, color: '#888' }}>Loading reviews...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Rating Summary */}
          {reviews.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryScore}>{avgRating}</Text>
                <View style={styles.summaryStars}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Text key={s} style={[styles.summaryStar, s <= Math.round(avgRating) && styles.summaryStarActive]}>
                      {s <= Math.round(avgRating) ? '★' : '☆'}
                    </Text>
                  ))}
                </View>
                <Text style={styles.summaryCount}>{stats.total} verified reviews</Text>
              </View>
              <View style={styles.summaryBars}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <View key={star} style={styles.barRow}>
                      <Text style={styles.barLabel}>{star}★</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.barCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
                onPress={() => setActiveFilter(activeFilter === f ? 'All' : f)}
              >
                <Text style={[styles.filterBtnText, activeFilter === f && styles.filterBtnTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Reviews */}
          {filtered.length === 0 ? (
            <View style={styles.centered}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySub}>
                Reviews appear here after clients verify completed work
              </Text>
            </View>
          ) : (
            filtered.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: '#333', fontWeight: '900' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: TEXT },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', paddingHorizontal: 32 },

  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, padding: 20, borderRadius: 16,
    backgroundColor: GREEN_LIGHT, borderWidth: 1, borderColor: '#86EFAC', gap: 20,
  },
  summaryLeft: { alignItems: 'center', minWidth: 80 },
  summaryScore: { fontSize: 48, fontWeight: '900', color: '#166534', lineHeight: 54 },
  summaryStars: { flexDirection: 'row', marginTop: 4 },
  summaryStar: { fontSize: 16, color: '#D1FAE5' },
  summaryStarActive: { color: YELLOW },
  summaryCount: { fontSize: 11, color: '#166534', fontWeight: '600', marginTop: 4, textAlign: 'center' },

  summaryBars: { flex: 1, gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { fontSize: 11, color: MUTED, fontWeight: '600', width: 22 },
  barTrack: { flex: 1, height: 6, backgroundColor: '#D1FAE5', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: YELLOW, borderRadius: 3 },
  barCount: { fontSize: 11, color: MUTED, width: 18, textAlign: 'right' },

  filtersRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F0F4F8', borderWidth: 1, borderColor: BORDER,
  },
  filterBtnActive: { backgroundColor: GREEN_LIGHT, borderColor: '#86EFAC' },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: MUTED },
  filterBtnTextActive: { color: '#166534', fontWeight: '700' },

  reviewCard: {
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  authorAvatar: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#E0F5FE', alignItems: 'center', justifyContent: 'center',
  },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  authorName: { fontSize: 14, fontWeight: '800', color: TEXT },
  verifiedBadge: {
    backgroundColor: GREEN_LIGHT, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: '700', color: GREEN },
  authorRole: { fontSize: 11, color: MUTED },
  reviewDate: { fontSize: 11, color: MUTED, fontWeight: '500' },

  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10 },
  starIcon: { fontSize: 18, color: '#E2E8F0' },
  starActive: { color: YELLOW },
  ratingLabel: { fontSize: 12, color: MUTED, fontWeight: '600', marginLeft: 4 },

  workBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  workTypeBadge: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  workTypeText: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },
  reviewAmount: { fontSize: 13, fontWeight: '800', color: GREEN },

  reviewText: {
    fontSize: 13, color: TEXT, lineHeight: 20, fontStyle: 'italic',
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: GREEN, marginBottom: 10,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: GREEN_LIGHT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  tagText: { fontSize: 11, fontWeight: '700', color: '#166534' },
});
