import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, SectionList, ActivityIndicator,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import { useState, useRef, useMemo, useEffect } from 'react';
import { searchUsers } from '../services/userService';

// ─── Theme ────────────────────────────────────────────────────────────────────

const ORANGE = '#262626';
const BG      = '#FFFFFF';
const SURFACE = '#F6F7FB';
const DARK    = '#262626';
const MID     = '#4A4A68';
const LIGHT   = '#9FA3B0';
const BORDER  = '#EDEDF2';

// This screen only searches the provider types we support — Personal (client)
// accounts are not providers and are never returned here.
const PROVIDER_TYPES = ['worker', 'contractor', 'professional'];

// ─── Static Data ──────────────────────────────────────────────────────────────

const INITIAL_RECENT = [
  'Civil Engineer Ahmedabad',
  'Electrician contractor',
  'Interior designer Surat',
  'Mason',
];

const TRENDING = [
  'Site Engineer',
  'RCC Contractor',
  'Electrician',
  'Civil Engineer',
  'Interior Designer',
  'Plumber Ahmedabad',
];

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'worker', label: 'Solo Workers' },
  { key: 'contractor', label: 'Contractors' },
  { key: 'professional', label: 'Professionals' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROFILE_SCREEN = {
  worker: 'WorkerProfile',
  contractor: 'ContractorProfile',
  professional: 'ProfessionalProfile',
};

const TYPE_LABEL = {
  worker: 'Solo Workers',
  contractor: 'Contractors',
  professional: 'Professionals',
};

const TYPE_EMOJI = {
  worker: '👷',
  contractor: '👷‍♂️',
  professional: '🏛️',
};

const TYPE_BG = {
  worker: '#E5E5E5',
  contractor: '#E5E5E5',
  professional: '#EDE7F6',
};

function firestoreUserToResult(user) {
  const pt = (user.profileType || '').toLowerCase();
  const name = user.name || 'Unknown';
  const cat = user.designation || user.category || user.workerSkill || '';
  const city = user.city || '';
  return {
    uid: user.uid,
    profileScreen: PROFILE_SCREEN[pt] || null,
    type: TYPE_LABEL[pt] || 'Providers',
    emoji: TYPE_EMOJI[pt] || '👤',
    bg: TYPE_BG[pt] || '#F5F5F5',
    name,
    sub: [cat, city].filter(Boolean).join('  ·  '),
    rating: user.rating ? String(user.rating) : null,
    reviews: user.reviewCount || 0,
  };
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

function FilterTabs({ active, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterTabsRow}
      keyboardShouldPersistTaps="handled"
    >
      {FILTER_TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function ResultCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.resultAvatar, { backgroundColor: item.bg }]}>
        <Text style={styles.resultEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.resultSub} numberOfLines={1}>{item.sub}</Text>
        <View style={styles.resultRatingRow}>
          {item.rating ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeStar}>★</Text>
              <Text style={styles.ratingBadgeVal}>{item.rating}</Text>
            </View>
          ) : (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New</Text>
            </View>
          )}
          {item.reviews > 0 && <Text style={styles.resultReviews}>{item.reviews} reviews</Text>}
        </View>
      </View>
      <View style={styles.ctaBtn}>
        <Text style={styles.ctaBtnText}>View</Text>
      </View>
    </TouchableOpacity>
  );
}

function NoResults({ query, onChipPress }) {
  const suggestions = ['Electrician', 'Civil Contractor', 'Site Engineer', 'Mason'];
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

// ─── Empty State (no query yet) ────────────────────────────────────────────────

function EmptyState({ recent, onRecentPress, onRecentRemove, onClearRecent, onTrendingPress }) {
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
  const [rawResults, setRawResults] = useState(null); // null = no query submitted yet
  const [activeFilter, setActiveFilter] = useState('all');
  const debounceRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setRawResults(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(query);
        // Only Solo Workers / Contractors / Professionals are searchable providers.
        const providers = (users || []).filter(u =>
          PROVIDER_TYPES.includes((u.profileType || '').toLowerCase())
        );
        setRawResults(providers);
      } catch (_) {
        setRawResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const sections = useMemo(() => {
    if (!rawResults) return null;
    const filtered = activeFilter === 'all'
      ? rawResults
      : rawResults.filter(u => (u.profileType || '').toLowerCase() === activeFilter);
    const items = filtered.map(firestoreUserToResult);
    const groups = {};
    items.forEach(item => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [rawResults, activeFilter]);

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
            placeholder="Search workers, contractors, professionals..."
            placeholderTextColor={LIGHT}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.headerDivider} />

      {/* ── Filter Tabs (once a search is active) ── */}
      {!showEmpty && (
        <FilterTabs active={activeFilter} onChange={setActiveFilter} />
      )}

      {/* ── Body ── */}
      {showEmpty && (
        <EmptyState
          recent={recent}
          onRecentPress={handleChipPress}
          onRecentRemove={removeRecent}
          onClearRecent={clearRecent}
          onTrendingPress={handleChipPress}
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
              onPress={() => {
                addToRecent(query);
                if (item.uid && item.profileScreen) {
                  navigation.navigate(item.profileScreen, { uid: item.uid });
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

const styles = injectFonts({
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
  headerDivider: { height: 1, backgroundColor: BORDER },

  // ── Filter tabs
  filterTabsRow: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
  },
  filterTabActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  filterTabText: { fontSize: 13, fontWeight: '700', color: MID },
  filterTabTextActive: { color: '#FFFFFF' },

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
  resultName: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 2, lineHeight: 17 },
  resultSub: { fontSize: 12, color: LIGHT, marginBottom: 5 },
  resultRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#FFF7ED', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  ratingBadgeStar: { fontSize: 11, color: '#F59E0B' },
  ratingBadgeVal: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  newBadge: {
    backgroundColor: '#F5F5F0', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  newBadgeText: { fontSize: 11, fontWeight: '800', color: LIGHT },
  resultReviews: { fontSize: 11, color: LIGHT, fontWeight: '500' },
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
