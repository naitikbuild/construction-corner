import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, FlatList, SectionList, Dimensions, ActivityIndicator,
} from 'react-native';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { searchUsers } from '../services/userService';

// ─── Theme ────────────────────────────────────────────────────────────────────

import { BLUE } from '../constants/colors';

const ORANGE = '#FF6B35';
const BG      = '#FFFFFF';
const SURFACE = '#F6F7FB';
const DARK    = '#1A1A2E';
const MID     = '#4A4A68';
const LIGHT   = '#9FA3B0';
const BORDER  = '#EDEDF2';
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48) / 2;

// ─── Static Data ──────────────────────────────────────────────────────────────

const INITIAL_RECENT = [
  'Civil Engineer Ahmedabad',
  'Cement price per bag',
  'Electrician contractor',
  'Interior designer Surat',
];

const TRENDING = [
  'Site Engineer',
  'RCC Contractor',
  'TMT Steel Rates',
  'Plumber Ahmedabad',
  'AutoCAD Jobs',
  'Waterproofing Work',
];

const CATEGORIES = [
  { label: 'Contractors',   emoji: '🏗️', count: '840+',   bg: '#FFF1EB', accent: ORANGE,     screen: 'ProfessionalCategory' },
  { label: 'Professionals', emoji: '🏛️', count: '2,400+', bg: '#E0F5FE', accent: BLUE,       screen: 'ProfessionalCategory' },
  { label: 'Materials',     emoji: '📦', count: '5,200+', bg: '#EDFBF0', accent: '#16A34A',  screen: 'MaterialMarketplace' },
  { label: 'Jobs',          emoji: '💼', count: '1,800+', bg: '#F3EFFE', accent: '#7C3AED',  screen: 'Jobs' },
  { label: 'Courses',       emoji: '📚', count: '120+',   bg: '#FFF0F0', accent: '#DC2626',  screen: 'Courses' },
  { label: 'Tenders',       emoji: '📋', count: '340+',   bg: '#FFFBEB', accent: '#D97706',  screen: null },
];

const MASTER = [
  // Contractors
  { type: 'Contractors', emoji: '🏗️', bg: '#EFF6FF', name: 'Rahul Civil Works',        sub: 'Civil Contractor · Ahmedabad',          rating: '4.8', reviews: 124, cta: 'Contact' },
  { type: 'Contractors', emoji: '⚡', bg: '#FEFCE8', name: 'Mehta Electrical',           sub: 'Electrical Contractor · Gandhinagar',   rating: '4.6', reviews: 87,  cta: 'Contact' },
  { type: 'Contractors', emoji: '🔧', bg: '#F0F9FF', name: 'BuildRight Plumbing',        sub: 'Plumbing Contractor · Vadodara',        rating: '4.7', reviews: 63,  cta: 'Contact' },
  { type: 'Contractors', emoji: '🎨', bg: '#FDF4FF', name: 'Colours Pro Painting',       sub: 'Painting Contractor · Surat',           rating: '4.5', reviews: 48,  cta: 'Contact' },
  { type: 'Contractors', emoji: '💧', bg: '#EFF6FF', name: 'AquaShield Waterproofing',   sub: 'Waterproofing · Ahmedabad',             rating: '4.9', reviews: 210, cta: 'Contact' },
  // Professionals
  { type: 'Professionals', emoji: '🏛️', bg: '#F0FDF4', name: 'Priya Agarwal',           sub: 'Architect · 6 yrs exp · Ahmedabad',    rating: '4.9', reviews: 89,  cta: 'Book' },
  { type: 'Professionals', emoji: '📐', bg: '#EFF6FF', name: 'Ankit Shah',               sub: 'Civil Engineer · 8 yrs · Ahmedabad',   rating: '4.7', reviews: 103, cta: 'Book' },
  { type: 'Professionals', emoji: '🛋️', bg: '#FDF2F8', name: 'Riya Mehta',              sub: 'Interior Designer · 5 yrs · Surat',    rating: '4.8', reviews: 72,  cta: 'Book' },
  { type: 'Professionals', emoji: '🔩', bg: '#F8FAFC', name: 'Ketan Patel',              sub: 'Structural Engineer · 10 yrs · Vadodara', rating: '4.6', reviews: 56, cta: 'Book' },
  // Materials
  { type: 'Materials', emoji: '🏗️', bg: '#FFF7ED', name: 'Gujarat Cement Traders',      sub: 'OPC 53 Grade · ₹340/bag',              rating: '4.8', reviews: 320, cta: 'Quote' },
  { type: 'Materials', emoji: '⚙️', bg: '#F1F5F9', name: 'Raj Steel & TMT',             sub: 'Fe 500D TMT Bars · ₹58/kg',            rating: '4.7', reviews: 198, cta: 'Quote' },
  { type: 'Materials', emoji: '🟫', bg: '#FFFBEB', name: 'Morbi Tiles Hub',              sub: 'Vitrified Tiles · ₹45/sqft',           rating: '4.9', reviews: 445, cta: 'Quote' },
  { type: 'Materials', emoji: '🎨', bg: '#FDF4FF', name: 'Asian Paints Dealer',          sub: 'Exterior & Interior · ₹280/ltr',       rating: '4.8', reviews: 267, cta: 'Quote' },
  // Jobs
  { type: 'Jobs', emoji: '💼', bg: '#EFF6FF', name: 'Site Engineer',                     sub: 'Shapoorji Pallonji · Ahmedabad · ₹45K/mo', rating: null, reviews: 34, cta: 'Apply' },
  { type: 'Jobs', emoji: '⚡', bg: '#FEFCE8', name: 'Electrical Supervisor',              sub: 'L&T Construction · Gandhinagar · ₹55K/mo', rating: null, reviews: 12, cta: 'Apply' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROFILE_SCREEN = {
  professional: 'ProfessionalProfile',
  worker: 'WorkerProfile',
  supplier: 'SupplierProfile',
  business: 'BusinessProfile',
};

const TYPE_LABEL = {
  professional: 'Professionals',
  worker: 'Contractors',
  supplier: 'Suppliers',
  business: 'Companies',
};

const TYPE_EMOJI = {
  professional: '🏛️',
  worker: '👷',
  supplier: '🏭',
  business: '🏢',
};

const TYPE_BG = {
  professional: '#EDE7F6',
  worker: '#FFF3E0',
  supplier: '#E3F2FD',
  business: '#E8F5E9',
};

function firestoreUserToResult(user) {
  const pt = (user.profileType || '').toLowerCase();
  const name = user.name || user.companyName || 'Unknown';
  const cat = user.designation || user.category || user.workerSkill || user.supplierCategory || '';
  const city = user.city || '';
  return {
    uid: user.uid,
    profileScreen: PROFILE_SCREEN[pt] || null,
    type: TYPE_LABEL[pt] || 'Users',
    emoji: TYPE_EMOJI[pt] || '👤',
    bg: TYPE_BG[pt] || '#F5F5F5',
    name,
    sub: [cat, city].filter(Boolean).join('  ·  '),
    rating: user.rating ? String(user.rating) : '4.5',
    reviews: user.reviewCount || 0,
    cta: 'View',
  };
}

function groupResults(query) {
  const q = query.toLowerCase().trim();
  const matched = MASTER.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.sub.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
  );
  const groups = {};
  matched.forEach((item) => {
    if (!groups[item.type]) groups[item.type] = [];
    groups[item.type].push(item);
  });
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ title, action, onAction }) {
  return (
    <View style={styles.secHead}>
      <Text style={styles.secTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.secAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function RecentRow({ label, onPress, onRemove }) {
  return (
    <TouchableOpacity style={styles.recentRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.recentIconWrap}>
        <Text style={styles.recentIcon}>🕐</Text>
      </View>
      <Text style={styles.recentText} numberOfLines={1}>{label}</Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.recentRemoveBtn}
      >
        <Text style={styles.recentRemoveX}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function TrendingChip({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.trendChip} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.trendFlame}>🔥</Text>
      <Text style={styles.trendChipText}>{label}</Text>
    </TouchableOpacity>
  );
}

function CategoryCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.catCard, { backgroundColor: item.bg }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.catIconBg, { backgroundColor: item.accent + '22' }]}>
        <Text style={styles.catEmoji}>{item.emoji}</Text>
      </View>
      <Text style={[styles.catLabel, { color: item.accent }]}>{item.label}</Text>
      <View style={[styles.catBadge, { backgroundColor: item.accent + '18' }]}>
        <Text style={[styles.catBadgeText, { color: item.accent }]}>{item.count} listed</Text>
      </View>
    </TouchableOpacity>
  );
}

function ResultCard({ item, onCta }) {
  return (
    <View style={styles.resultCard}>
      <View style={[styles.resultAvatar, { backgroundColor: item.bg }]}>
        <Text style={styles.resultEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.resultSub} numberOfLines={1}>{item.sub}</Text>
        {item.rating ? (
          <View style={styles.resultRatingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeStar}>★</Text>
              <Text style={styles.ratingBadgeVal}>{item.rating}</Text>
            </View>
            <Text style={styles.resultReviews}>{item.reviews} reviews</Text>
          </View>
        ) : (
          <View style={styles.resultRatingRow}>
            <Text style={styles.appliedText}>👥 {item.reviews} applied</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.ctaBtn} onPress={onCta} activeOpacity={0.85}>
        <Text style={styles.ctaBtnText}>{item.cta}</Text>
      </TouchableOpacity>
    </View>
  );
}

function NoResults({ query, onChipPress }) {
  const suggestions = ['Site Engineer', 'Civil Contractor', 'Cement', 'AutoCAD'];
  return (
    <View style={styles.noResults}>
      <Text style={styles.noResultsEmoji}>🔍</Text>
      <Text style={styles.noResultsTitle}>No results found</Text>
      <Text style={styles.noResultsSub}>
        Nothing matched{' '}
        <Text style={{ color: ORANGE, fontWeight: '700' }}>"{query}"</Text>
      </Text>
      <Text style={styles.noResultsTip}>Try these instead</Text>
      <View style={styles.noResultsChips}>
        {suggestions.map((s) => (
          <TouchableOpacity key={s} style={styles.noResultsChip} onPress={() => onChipPress(s)}>
            <Text style={styles.noResultsChipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ recent, onRecentPress, onRecentRemove, onClearRecent, onTrendingPress, navigation }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.emptyScroll}
      keyboardShouldPersistTaps="handled"
    >
      {/* Recent Searches */}
      {recent.length > 0 && (
        <View style={styles.section}>
          <SectionHeading title="Recent Searches" action="Clear all" onAction={onClearRecent} />
          <View style={styles.recentList}>
            {recent.map((r) => (
              <RecentRow
                key={r}
                label={r}
                onPress={() => onRecentPress(r)}
                onRemove={() => onRecentRemove(r)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Trending */}
      <View style={styles.section}>
        <SectionHeading title="Trending Now" />
        <View style={styles.trendList}>
          {TRENDING.map((t) => (
            <TrendingChip key={t} label={t} onPress={() => onTrendingPress(t)} />
          ))}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <SectionHeading title="Browse by Category" />
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.label}
              item={cat}
              onPress={() => cat.screen && navigation.navigate(cat.screen)}
            />
          ))}
        </View>
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SearchScreen({ navigation, route }) {
  const inputRef = useRef(null);
  const [query, setQuery]         = useState(route?.params?.query || '');
  const [recent, setRecent]       = useState(INITIAL_RECENT);
  const [searching, setSearching] = useState(false);
  const [liveResults, setLiveResults] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setLiveResults(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(query);
        if (users.length > 0) {
          const items = users.map(firestoreUserToResult);
          const groups = {};
          items.forEach(item => {
            if (!groups[item.type]) groups[item.type] = [];
            groups[item.type].push(item);
          });
          setLiveResults(Object.entries(groups).map(([title, data]) => ({ title, data })));
        } else {
          setLiveResults([]);
        }
      } catch (_) {
        setLiveResults(null);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const staticSections = useMemo(() => {
    if (!query.trim()) return null;
    return groupResults(query);
  }, [query]);

  const sections = liveResults !== null
    ? (liveResults.length > 0 ? liveResults : staticSections)
    : staticSections;

  const addToRecent = (text) => {
    if (!text.trim()) return;
    setRecent((prev) => [text, ...prev.filter((r) => r !== text)].slice(0, 8));
  };

  const handleSubmit = () => {
    if (query.trim()) addToRecent(query.trim());
  };

  const handleChipPress = (text) => {
    setQuery(text);
    addToRecent(text);
    inputRef.current?.blur();
  };

  const removeRecent = (item) => setRecent((prev) => prev.filter((r) => r !== item));
  const clearRecent  = () => setRecent([]);

  const showEmpty   = !query.trim();
  const showResults = !showEmpty && !searching && sections && sections.length > 0;
  const showNoRes   = !showEmpty && !searching && (!sections || sections.length === 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Text style={styles.searchMagIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search professionals, materials, jobs..."
            placeholderTextColor={LIGHT}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.headerDivider} />

      {/* ── Body ── */}
      {showEmpty && (
        <EmptyState
          recent={recent}
          onRecentPress={handleChipPress}
          onRecentRemove={removeRecent}
          onClearRecent={clearRecent}
          onTrendingPress={handleChipPress}
          navigation={navigation}
        />
      )}

      {!showEmpty && searching && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={{ marginTop: 12, color: MID, fontSize: 13, fontWeight: '600' }}>Searching...</Text>
        </View>
      )}

      {showResults && (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => (item.uid || item.name) + index}
          renderSectionHeader={({ section: { title, data } }) => (
            <View style={styles.resultSectionHead}>
              <Text style={styles.resultSectionTitle}>{title}</Text>
              <View style={styles.resultCountBadge}>
                <Text style={styles.resultCountText}>{data.length} found</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <ResultCard
              item={item}
              onCta={() => {
                addToRecent(query);
                if (item.uid && item.profileScreen) {
                  navigation.navigate(item.profileScreen, { uid: item.uid });
                } else if (item.type === 'Materials') {
                  navigation.navigate('MaterialMarketplace');
                } else if (item.type === 'Jobs') {
                  navigation.navigate('Jobs');
                } else {
                  navigation.navigate('CategoryList', { category: item.type, profileType: 'professional' });
                }
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.resultSep} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled
        />
      )}

      {showNoRes && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <NoResults query={query} onChipPress={handleChipPress} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ── Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: BG,
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 4, zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  backIcon: { fontSize: 26, color: DARK, lineHeight: 30, marginTop: -2 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 13, paddingVertical: 11,
  },
  searchMagIcon: { fontSize: 16 },
  searchInput: {
    flex: 1, fontSize: 15, color: DARK, fontWeight: '500',
    paddingVertical: 0,
  },
  clearBtn: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 9, fontWeight: '900', color: MID },
  micIcon: { fontSize: 16 },
  headerDivider: { height: 1, backgroundColor: BORDER },

  // ── Empty scroll
  emptyScroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  section: { marginTop: 4 },

  // ── Section heading
  secHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 24, paddingBottom: 14,
  },
  secTitle: { fontSize: 16, fontWeight: '800', color: DARK, letterSpacing: -0.2 },
  secAction: { fontSize: 13, fontWeight: '700', color: ORANGE },

  // ── Recent rows
  recentList: {
    backgroundColor: SURFACE, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    backgroundColor: BG,
  },
  recentIconWrap: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  recentIcon: { fontSize: 15 },
  recentText: { flex: 1, fontSize: 14, color: MID, fontWeight: '500' },
  recentRemoveBtn: { padding: 4 },
  recentRemoveX: { fontSize: 12, color: LIGHT, fontWeight: '700' },

  // ── Trending
  trendList: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  trendChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, backgroundColor: ORANGE,
    shadowColor: ORANGE, shadowOpacity: 0.28, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  trendFlame: { fontSize: 12 },
  trendChipText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // ── Categories
  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12,
  },
  catCard: {
    width: CARD_W, borderRadius: 18, padding: 16,
    alignItems: 'flex-start', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  catIconBg: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  catEmoji: { fontSize: 28 },
  catLabel: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  catBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  catBadgeText: { fontSize: 11, fontWeight: '600' },

  // ── Results
  resultsList: { paddingBottom: 40 },
  resultSectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: SURFACE, paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER,
  },
  resultSectionTitle: {
    fontSize: 11, fontWeight: '800', color: MID,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  resultCountBadge: {
    backgroundColor: ORANGE + '18', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8,
  },
  resultCountText: { fontSize: 11, fontWeight: '700', color: ORANGE },

  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: BG, paddingHorizontal: 16, paddingVertical: 14,
  },
  resultAvatar: {
    width: 52, height: 52, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  resultEmoji: { fontSize: 24 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 2 },
  resultSub: { fontSize: 12, color: LIGHT, marginBottom: 5 },
  resultRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#FFF7ED', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  ratingBadgeStar: { fontSize: 11, color: '#F59E0B' },
  ratingBadgeVal: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  resultReviews: { fontSize: 11, color: LIGHT, fontWeight: '500' },
  appliedText: { fontSize: 12, color: LIGHT, fontWeight: '500' },
  ctaBtn: {
    backgroundColor: ORANGE, paddingHorizontal: 15, paddingVertical: 9,
    borderRadius: 12, flexShrink: 0,
    shadowColor: ORANGE, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ctaBtnText: { fontSize: 12, fontWeight: '800', color: 'white' },
  resultSep: { height: 1, backgroundColor: BORDER, marginLeft: 80 },

  // ── No results
  noResults: {
    alignItems: 'center', paddingTop: 80, paddingHorizontal: 30, gap: 10,
  },
  noResultsEmoji: { fontSize: 56, marginBottom: 4 },
  noResultsTitle: { fontSize: 22, fontWeight: '900', color: DARK },
  noResultsSub: { fontSize: 14, color: MID, textAlign: 'center', lineHeight: 22 },
  noResultsTip: {
    fontSize: 12, fontWeight: '700', color: LIGHT,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 22,
  },
  noResultsChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  noResultsChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22,
    backgroundColor: ORANGE, elevation: 2,
    shadowColor: ORANGE, shadowOpacity: 0.25, shadowRadius: 5,
  },
  noResultsChipText: { fontSize: 13, fontWeight: '700', color: 'white' },
});
