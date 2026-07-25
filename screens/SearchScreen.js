import { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar,
  ActivityIndicator, FlatList, Image, Modal, Switch, PanResponder,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { searchUsers, getAllUsers, getProfile } from '../services/userService';
import { formatAmountIndian } from '../utils/format';

const GREEN       = '#22A559';
const GREEN_LIGHT  = '#EAF7EF';
const DARK          = '#262626';
const BG            = '#FAF9F5';
const FILL          = '#F2F2F2';
const BORDER        = '#E5E5E5';
const MID            = '#737373';
const LIGHT          = '#8E8E8E';
const LINK_BLUE      = '#1877F2';

// This screen only searches the provider types we support — Personal (client)
// accounts are not providers and are never returned here.
const PROVIDER_TYPES = ['worker', 'contractor', 'professional'];

const PROFILE_SCREEN = {
  worker: 'WorkerProfile',
  contractor: 'ContractorProfile',
  professional: 'ProfessionalProfile',
};

const SORT_OPTIONS = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'rating', label: 'Highest rated' },
  { key: 'verified', label: 'Most verified work' },
  { key: 'jobs', label: 'Most jobs' },
];

const PAGE_SIZE = 20;

const DISTANCE_MIN = 1;
const DISTANCE_MAX = 50;

// minRating: 0 = Any, 4 = 4.0+, 4.5 = 4.5+. distanceKm defaults to the max
// (effectively "no limit") — see the DistanceSlider note on why it's UI-only.
const DEFAULT_FILTERS = {
  distanceKm: DISTANCE_MAX,
  availableNow: false,
  verifiedWorkOnly: false,
  minRating: 0,
};

const RATING_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 4, label: '★ 4.0+' },
  { value: 4.5, label: '★ 4.5+' },
];

// No real "next available day" scheduling data exists anywhere in this app —
// the only availability signal is the boolean `available` flag. Rather than
// fabricate a fake day, busy providers just show a plain "Busy" label.
const BUSY_LABEL = 'Busy';

function tradeLine(u) {
  const trade = u.category || u.designation || u.workerSkill || u.contractorType || u.primarySkill || '';
  const years = u.workerExperience || u.contractorExperience || u.experience || '';
  return [trade, years ? `${years} yrs` : ''].filter(Boolean).join(' · ');
}

function verifiedAmountNum(u) {
  return Number(u.totalVerifiedAmount ?? u.demoVerifiedAmount ?? 0) || 0;
}

function jobsCountNum(u) {
  return Number(u.jobsCompleted ?? 0) || 0;
}

function hasVerifiedWork(u) {
  return jobsCountNum(u) > 0 || verifiedAmountNum(u) > 0;
}

function ratingNum(u) {
  const r = Number(u.rating);
  return Number.isFinite(r) ? r : 0;
}

function ratingDisplay(u) {
  const r = ratingNum(u);
  return r > 0 ? r.toFixed(1) : '—';
}

// ─── Result row ───────────────────────────────────────────────────────────────
function ResultRow({ item, onPress }) {
  // A provider with zero completed jobs can't have a real on-time % or star
  // rating yet — always show "—"/"New" for those rather than a stray value
  // that contradicts the "0 jobs" count next to it.
  const jobs = jobsCountNum(item);
  const hasJobs = jobs > 0;

  return (
    <View style={s.row}>
      <View style={s.thumbWrap}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={s.thumbImg} resizeMode="cover" />
        ) : (
          <View style={s.thumbPlaceholder}>
            <Text style={s.thumbPlaceholderIcon}>👤</Text>
          </View>
        )}
      </View>

      <View style={s.rowInfo}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{item.name || item.companyName || 'Unnamed'}</Text>
          {item.verified ? (
            <View style={s.verifiedBadge}><Text style={s.verifiedBadgeText}>✓</Text></View>
          ) : null}
        </View>
        <Text style={s.tradeLine} numberOfLines={1}>{tradeLine(item) || '—'}</Text>
        <Text style={s.statsRow} numberOfLines={1}>
          <Text style={s.statsGreen}>{formatAmountIndian(verifiedAmountNum(item))}</Text>
          <Text style={s.statsDot}> · </Text>
          <Text style={s.statsGreen}>{jobs} jobs</Text>
          <Text style={s.statsDot}> · </Text>
          <Text style={s.statsGreen}>{hasJobs ? (item.onTimeRate || '—') : '—'}</Text>
          <Text style={s.statsDot}> · </Text>
          <Text style={s.statsGreen}>{hasJobs ? `★${ratingDisplay(item)}` : 'New'}</Text>
        </Text>
      </View>

      <View style={s.rightCol}>
        {item.available === true ? (
          <View style={s.availNowRow}>
            <View style={s.availDot} />
            <Text style={s.availNowText}>Now</Text>
          </View>
        ) : (
          <Text style={s.availNextText}>{BUSY_LABEL}</Text>
        )}
        <TouchableOpacity style={s.viewBtn} onPress={onPress} activeOpacity={0.85}>
          <Text style={s.viewBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Quick-toggle filter chip ───────────────────────────────────────────────
function QuickChip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[s.chip, active && s.chipActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Distance slider ─────────────────────────────────────────────────────────
// No slider library exists in this codebase, so this is a small self-contained
// PanResponder-driven track+thumb, matching the app's existing convention of
// building lightweight custom controls (e.g. the calendar picker) rather than
// adding a dependency for one control.
function DistanceSlider({ value, min, max, onChange, disabled }) {
  const [trackWidth, setTrackWidth] = useState(0);

  const updateFromX = (x) => {
    if (trackWidth <= 0) return;
    const clampedX = Math.max(0, Math.min(trackWidth, x));
    const pct = clampedX / trackWidth;
    onChange(Math.round(min + pct * (max - min)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => updateFromX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => updateFromX(evt.nativeEvent.locationX),
    })
  ).current;

  const pct = trackWidth > 0 ? (value - min) / (max - min) : 0;

  return (
    <View
      style={[fs.sliderTrack, disabled && fs.sliderTrackDisabled]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...(disabled ? {} : panResponder.panHandlers)}
    >
      <View style={[fs.sliderFill, { width: `${pct * 100}%` }]} />
      <View style={[fs.sliderThumb, { left: `${pct * 100}%` }, disabled && fs.sliderThumbDisabled]} />
    </View>
  );
}

// ─── Filters bottom sheet ────────────────────────────────────────────────────
function FilterSheet({ visible, filters, setFilters, resultCount, onClose }) {
  const [locationStatus, setLocationStatus] = useState('unknown'); // 'unknown' | 'granted' | 'denied'

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationStatus(status === 'granted' ? 'granted' : 'denied');
      } catch (_) {
        setLocationStatus('denied');
      }
    })();
  }, [visible]);

  const distanceDisabled = locationStatus !== 'granted';

  const reset = () => setFilters(DEFAULT_FILTERS);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={fs.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={fs.sheet}>
          <View style={fs.dragHandle} />

          <View style={fs.header}>
            <Text style={fs.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={reset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={fs.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* ── Distance ── */}
            <View style={fs.section}>
              <View style={fs.sectionHeadRow}>
                <Text style={fs.sectionLabel}>DISTANCE</Text>
                <Text style={fs.sectionValue}>
                  {distanceDisabled ? '—' : `Within ${filters.distanceKm} km`}
                </Text>
              </View>
              <DistanceSlider
                value={filters.distanceKm}
                min={DISTANCE_MIN}
                max={DISTANCE_MAX}
                disabled={distanceDisabled}
                onChange={(v) => setFilters(f => ({ ...f, distanceKm: v }))}
              />
              {distanceDisabled && (
                <Text style={fs.distanceNote}>Enable location access to filter by distance.</Text>
              )}
            </View>

            <View style={fs.divider} />

            {/* ── Available now ── */}
            <View style={[fs.section, fs.toggleRow]}>
              <View style={{ flex: 1 }}>
                <Text style={fs.toggleTitle}>AVAILABLE NOW</Text>
                <Text style={fs.toggleSub}>Show only workers free today</Text>
              </View>
              <Switch
                value={filters.availableNow}
                onValueChange={(v) => setFilters(f => ({ ...f, availableNow: v }))}
                trackColor={{ false: BORDER, true: GREEN_LIGHT }}
                thumbColor={filters.availableNow ? GREEN : '#FFFFFF'}
              />
            </View>

            <View style={fs.divider} />

            {/* ── Verified work only ── */}
            <View style={[fs.section, fs.toggleRow]}>
              <View style={{ flex: 1 }}>
                <Text style={fs.toggleTitle}>VERIFIED WORK ONLY</Text>
                <Text style={fs.toggleSub}>Has app-verified jobs & earnings</Text>
              </View>
              <Switch
                value={filters.verifiedWorkOnly}
                onValueChange={(v) => setFilters(f => ({ ...f, verifiedWorkOnly: v }))}
                trackColor={{ false: BORDER, true: GREEN_LIGHT }}
                thumbColor={filters.verifiedWorkOnly ? GREEN : '#FFFFFF'}
              />
            </View>

            <View style={fs.divider} />

            {/* ── Minimum rating ── */}
            <View style={fs.section}>
              <Text style={fs.sectionLabel}>MINIMUM RATING</Text>
              <View style={fs.ratingPillsRow}>
                {RATING_OPTIONS.map(opt => {
                  const active = filters.minRating === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[fs.ratingPill, active && fs.ratingPillActive]}
                      onPress={() => setFilters(f => ({ ...f, minRating: opt.value }))}
                      activeOpacity={0.8}
                    >
                      <Text style={[fs.ratingPillText, active && fs.ratingPillTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 8 }} />
          </ScrollView>

          <TouchableOpacity style={fs.showBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={fs.showBtnText}>Show {resultCount} result{resultCount === 1 ? '' : 's'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function SearchScreen({ navigation, route }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState(route?.params?.query || '');
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState([]);
  const [myCity, setMyCity] = useState('');

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState('nearest');
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchTimer = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        if (!uid) return;
        const profile = await getProfile(uid);
        if (profile?.city) setMyCity(profile.city);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    const run = async () => {
      setLoading(true);
      try {
        let combined;
        if (query.trim()) {
          const users = await searchUsers(query.trim());
          combined = (users || []).filter(u => PROVIDER_TYPES.includes((u.profileType || '').toLowerCase()));
        } else {
          const lists = await Promise.all(PROVIDER_TYPES.map(pt => getAllUsers(pt)));
          combined = lists.flat();
        }
        const seen = new Set();
        const deduped = combined.filter(u => u.uid && !seen.has(u.uid) && seen.add(u.uid));
        setAllResults(deduped);
      } catch (_) {
        setAllResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTimer.current = setTimeout(run, query.trim() ? 400 : 0);
    return () => { if (fetchTimer.current) clearTimeout(fetchTimer.current); };
  }, [query]);

  const sortedFiltered = useMemo(() => {
    const list = allResults.filter(u => {
      if (filters.availableNow && u.available !== true) return false;
      if (filters.minRating > 0 && ratingNum(u) < filters.minRating) return false;
      if (filters.verifiedWorkOnly && !hasVerifiedWork(u)) return false;
      // distanceKm is intentionally not applied — see DistanceSlider note: no
      // provider carries lat/lng anywhere in this data model to filter against.
      return true;
    });
    const sorted = [...list];
    if (sortBy === 'rating') sorted.sort((a, b) => ratingNum(b) - ratingNum(a));
    else if (sortBy === 'verified') sorted.sort((a, b) => verifiedAmountNum(b) - verifiedAmountNum(a));
    else if (sortBy === 'jobs') sorted.sort((a, b) => jobsCountNum(b) - jobsCountNum(a));
    // 'nearest' — no distance data available, keep fetch order
    return sorted;
  }, [allResults, filters, sortBy]);

  // Any change to the underlying set re-pages from the top rather than lazily
  // loading more of a now-stale list.
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [allResults, filters, sortBy]);

  const visible = sortedFiltered.slice(0, visibleCount);
  const activeFilterCount =
    (filters.availableNow ? 1 : 0) +
    (filters.verifiedWorkOnly ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.distanceKm < DISTANCE_MAX ? 1 : 0);

  const headerText = useMemo(() => {
    const n = sortedFiltered.length;
    if (query.trim()) return `${n} result${n === 1 ? '' : 's'} for "${query.trim()}"`;
    return `${n} provider${n === 1 ? '' : 's'}${myCity ? ` in ${myCity}` : ''}`;
  }, [sortedFiltered.length, query, myCity]);

  const toggleAvailableNow = () => setFilters(f => ({ ...f, availableNow: !f.availableNow }));
  const toggleMinRating4 = () => setFilters(f => ({ ...f, minRating: f.minRating > 0 ? 0 : 4 }));
  const toggleVerifiedWork = () => setFilters(f => ({ ...f, verifiedWorkOnly: !f.verifiedWorkOnly }));

  const openProfile = (item) => {
    const screen = PROFILE_SCREEN[(item.profileType || '').toLowerCase()];
    if (item.uid && screen) navigation.navigate(screen, { uid: item.uid });
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Search workers, contractors…"
            placeholderTextColor={LIGHT}
            numberOfLines={1}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={s.clearBtn}><Text style={s.clearBtnText}>✕</Text></View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter row ── */}
      <ScrollView
        horizontal
        style={s.filterRowWrap}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={[s.filtersPill, activeFilterCount > 0 && s.filtersPillActive]}
          onPress={() => setFilterSheetOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={[s.filtersPillText, activeFilterCount > 0 && s.filtersPillTextActive]}>⚙ Filters</Text>
          {activeFilterCount > 0 && (
            <View style={s.filtersBadge}>
              <Text style={s.filtersBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <QuickChip label="Available now" active={filters.availableNow} onPress={toggleAvailableNow} />
        <QuickChip label="★ 4.0+" active={filters.minRating > 0} onPress={toggleMinRating4} />
        <QuickChip label="Verified" active={filters.verifiedWorkOnly} onPress={toggleVerifiedWork} />
      </ScrollView>

      {/* ── Results header ── */}
      <View style={s.resultsHeader}>
        <Text style={s.resultsHeaderText} numberOfLines={1}>{headerText}</Text>
        <TouchableOpacity onPress={() => setSortOpen(true)} activeOpacity={0.7}>
          <Text style={s.sortText}>Sort: {SORT_OPTIONS.find(o => o.key === sortBy)?.label} ⌄</Text>
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      {loading && allResults.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={DARK} />
        </View>
      ) : visible.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>🔍</Text>
          <Text style={s.emptyTitle}>No results found</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={visible}
          keyExtractor={(item, i) => (item.uid || item.name || 'x') + i}
          renderItem={({ item }) => <ResultRow item={item} onPress={() => openProfile(item)} />}
          ItemSeparatorComponent={() => <View style={s.rowSep} />}
          onEndReached={() => setVisibleCount(v => Math.min(v + PAGE_SIZE, sortedFiltered.length))}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* ── Sort sheet ── */}
      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} onPress={() => setSortOpen(false)} activeOpacity={1}>
          <TouchableOpacity style={s.sortSheet} activeOpacity={1} onPress={() => {}}>
            <Text style={s.modalTitle}>Sort by</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={s.sortOption}
                onPress={() => { setSortBy(opt.key); setSortOpen(false); }}
              >
                <Text style={[s.sortOptionText, sortBy === opt.key && s.sortOptionTextActive]}>{opt.label}</Text>
                {sortBy === opt.key && <Text style={s.sortOptionCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Filters bottom sheet ── */}
      <FilterSheet
        visible={filterSheetOpen}
        filters={filters}
        setFilters={setFilters}
        resultCount={sortedFiltered.length}
        onClose={() => setFilterSheetOpen(false)}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  backIcon: { fontSize: 20, lineHeight: 24, fontWeight: '700', color: DARK },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: FILL, borderRadius: 14,
    paddingHorizontal: 13, paddingVertical: 10,
  },
  // Explicit lineHeight caps the box the 🔍 glyph reserves — without it, the
  // emoji's fallback-font metrics can inflate this Text's height well past
  // its fontSize on Android, pushing the whole top bar (and everything below
  // it) down.
  searchIcon: { fontSize: 15, lineHeight: 18 },
  searchInput: { flex: 1, fontSize: 14, color: DARK, fontWeight: '500', paddingVertical: 0 },
  clearBtn: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 9, fontWeight: '900', color: MID },

  // ── Filter row — fixed height on the ScrollView itself (not just its
  // content) so it can never grow/shrink, including when the keyboard opens
  // and Android resizes the screen.
  filterRowWrap: { height: 56, flexGrow: 0, flexShrink: 0 },
  filterRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 8, alignItems: 'center' },
  filtersPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BORDER,
  },
  filtersPillActive: { backgroundColor: DARK, borderColor: DARK },
  filtersPillText: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: DARK },
  filtersPillTextActive: { color: '#FFFFFF' },
  filtersBadge: {
    minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  filtersBadgeText: { fontSize: 9, lineHeight: 12, fontWeight: '800', color: DARK },

  chip: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BORDER,
  },
  chipActive: { backgroundColor: GREEN_LIGHT, borderColor: GREEN },
  chipText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: MID },
  chipTextActive: { color: GREEN, fontWeight: '700' },

  // ── Results header
  resultsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  resultsHeaderText: { fontSize: 12, lineHeight: 16, color: MID, fontWeight: '500', flexShrink: 1, marginRight: 10 },
  sortText: { fontSize: 12, lineHeight: 16, color: DARK, fontWeight: '700' },

  // ── Empty / loading
  emptyIcon: { fontSize: 40, marginBottom: 10, opacity: 0.5 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: MID },

  // ── Result row
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  rowSep: { height: 1, backgroundColor: BORDER, marginLeft: 16 },
  thumbWrap: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%', height: '100%', backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbPlaceholderIcon: { fontSize: 22, opacity: 0.4 },

  rowInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 14, fontWeight: '700', color: DARK, flexShrink: 1 },
  verifiedBadge: {
    width: 15, height: 15, borderRadius: 8, backgroundColor: LINK_BLUE,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  verifiedBadgeText: { fontSize: 9, color: '#FFFFFF', fontWeight: '900' },
  tradeLine: { fontSize: 12, color: LIGHT, fontWeight: '500', marginTop: 2 },
  statsRow: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  statsGreen: { color: GREEN },
  statsDot: { color: LIGHT, fontWeight: '500' },

  rightCol: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  availNowRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  availNowText: { fontSize: 11, fontWeight: '700', color: GREEN },
  availNextText: { fontSize: 11, fontWeight: '600', color: LIGHT },
  viewBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1.5, borderColor: DARK,
  },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: DARK },

  // ── Sort sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 },
  sortSheet: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 8 },
  sortOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderTopWidth: 1, borderTopColor: BORDER,
  },
  sortOptionText: { fontSize: 14, color: DARK, fontWeight: '500' },
  sortOptionTextActive: { color: GREEN, fontWeight: '700' },
  sortOptionCheck: { fontSize: 14, color: GREEN, fontWeight: '900' },
});

// ─── Filters bottom sheet styles ─────────────────────────────────────────────
const fs = injectFonts({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, maxHeight: '85%',
  },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER,
    alignSelf: 'center', marginBottom: 14,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: DARK },
  resetText: { fontSize: 13, fontWeight: '600', color: MID },

  section: { paddingVertical: 16 },
  divider: { height: 1, backgroundColor: BORDER },

  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: LIGHT, letterSpacing: 0.8 },
  sectionValue: { fontSize: 12, fontWeight: '700', color: DARK },

  sliderTrack: {
    height: 4, borderRadius: 2, backgroundColor: BORDER,
    justifyContent: 'center', marginTop: 4,
  },
  sliderTrackDisabled: { opacity: 0.4 },
  sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 2, backgroundColor: GREEN },
  sliderThumb: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: GREEN,
    marginLeft: -10, top: -8,
  },
  sliderThumbDisabled: { borderColor: LIGHT },
  distanceNote: { fontSize: 11, color: LIGHT, fontWeight: '500', marginTop: 10 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTitle: { fontSize: 13, fontWeight: '700', color: DARK, letterSpacing: 0.4 },
  toggleSub: { fontSize: 12, color: LIGHT, fontWeight: '500', marginTop: 3 },

  ratingPillsRow: { flexDirection: 'row', gap: 8 },
  ratingPill: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BORDER,
  },
  ratingPillActive: { backgroundColor: FILL, borderColor: DARK },
  ratingPillText: { fontSize: 13, fontWeight: '600', color: MID },
  ratingPillTextActive: { color: DARK, fontWeight: '700' },

  showBtn: {
    height: 52, borderRadius: 14, backgroundColor: DARK,
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  showBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
