import { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar,
  ActivityIndicator, FlatList, Image, Modal, Switch, PanResponder,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchUsers, getAllUsers, getProfile } from '../services/userService';
import { getCurrentUid } from '../utils/session';
import { formatAmountIndian } from '../utils/format';
import {
  SORT_OPTIONS, hasVerifiedWork, ratingNum, hasCoords, haversineKm, compareForSort,
} from '../utils/ranking';
import { openProviderProfile } from '../utils/authGate';
import ProjectDetailModal from '../components/ProjectDetailModal';
import PhotoViewer from '../components/PhotoViewer';
import ProviderRow from '../components/ProviderRow';

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

const NEAR_ME_RE = /\bnear me\b/i;

// ─── Projects tab matching ──────────────────────────────────────────────────
function norm(s) {
  return (s || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

// Project-level match for the Projects tab: 2 = "Type of work" keyword match
// (the strongest signal — e.g. searching "island counter" finds a project
// tagged with that keyword), 1 = project name/category match (secondary),
// 0 = no match. Browsing with no query shows everything at the top tier.
function projectMatchInfo(project, q) {
  if (!q) return { tier: 2, keyword: null };
  const keywords = Array.isArray(project.keywords) ? project.keywords : [];
  const keyword = keywords.find(k => norm(k).includes(q));
  if (keyword) return { tier: 2, keyword };
  if (norm(project.name).includes(q) || norm(project.category).includes(q)) {
    return { tier: 1, keyword: null };
  }
  return { tier: 0, keyword: null };
}

// Most verified/completed project entries don't carry a real timestamp (the
// self-declared `projects` array predates that) — fall back gracefully
// through whatever date-like field is available instead of crashing/sorting
// randomly; ties with nothing at all just keep their fetch order.
function projectRecencyMs(project) {
  const raw = project.completedAt || project.plannedFinish || project.plannedStart;
  if (!raw) return 0;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

// ─── Project row (Projects tab) — plain list, no inline photos ─────────────
function ProjectRow({ item, onPress }) {
  const subline = [item.category, item.value ? formatAmountIndian(item.value) : null].filter(Boolean).join(' · ');
  return (
    <TouchableOpacity style={s.projectRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.projectName} numberOfLines={1}>{item.name || 'Untitled project'}</Text>
      {subline ? <Text style={s.projectSubline} numberOfLines={1}>{subline}</Text> : null}
      <View style={s.projectProviderRow}>
        <Text style={s.projectProviderName} numberOfLines={1}>{item.__providerName}</Text>
        {item.__providerVerified ? (
          <View style={s.verifiedBadge}><Text style={s.verifiedBadgeText}>✓</Text></View>
        ) : null}
      </View>
      {item.__keyword ? (
        <View style={s.projectKeywordChip}>
          <Text style={s.projectKeywordChipText}>{item.__keyword}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
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
  const insets = useSafeAreaInsets();
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
        <View style={[fs.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const [query, setQuery] = useState(route?.params?.query || '');
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState([]);
  const [myCity, setMyCity] = useState('');
  // 'accounts' | 'projects'
  const [resultTab, setResultTab] = useState('accounts');
  const [projectDetail, setProjectDetail] = useState(null);
  const [viewer, setViewer] = useState({ visible: false, photos: [], index: 0 });

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState('best');
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Searcher's own coordinates — resolved lazily (only once distance-based
  // ranking is actually needed) via expo-location, never on every screen load.
  const [myCoords, setMyCoords] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const fetchTimer = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const uid = await getCurrentUid();
        if (!uid) return;
        const profile = await getProfile(uid);
        if (profile?.city) setMyCity(profile.city);
      } catch (_) {}
    })();
  }, []);

  const nearMeMatch = NEAR_ME_RE.test(query);
  // "Near me" text or an active distance slider means the searcher explicitly
  // wants distance-aware results — this is what triggers requesting their GPS
  // location. Deliberately NOT tied to the "Nearest" sort default, since that's
  // selected on every screen open and would prompt for location unprompted.
  const distanceModeActive = nearMeMatch || filters.distanceKm < DISTANCE_MAX;

  // Resolve the searcher's GPS position once distance mode is actually needed.
  // Denial/failure is remembered so we fall back to their profile city instead
  // of re-prompting on every render.
  useEffect(() => {
    if (!distanceModeActive || myCoords || locationDenied) return;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { if (!cancelled) setLocationDenied(true); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) setMyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch (_) {
        if (!cancelled) setLocationDenied(true);
      }
    })();
    return () => { cancelled = true; };
  }, [distanceModeActive, myCoords, locationDenied]);

  // Only shown once we know we're using the city-text fallback (permission
  // denied/unavailable) rather than real GPS distance.
  const locationNote = (distanceModeActive && !myCoords && locationDenied && myCity)
    ? `Showing results in ${myCity}`
    : '';

  useEffect(() => {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    const run = async () => {
      setLoading(true);
      try {
        // "near me" is a location signal, not text to match against — strip it
        // before hitting the text search so e.g. "electrician near me" still
        // finds electricians; distance/city ranking is applied separately below.
        const textQuery = query.replace(NEAR_ME_RE, '').trim();
        let combined;
        if (textQuery) {
          const users = await searchUsers(textQuery);
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
    // Attach each provider's distance from the searcher once, up front, so
    // filtering and sorting both read the same precomputed __km value.
    const withDistance = allResults.map(u => ({
      ...u,
      __km: (myCoords && hasCoords(u)) ? haversineKm(myCoords.lat, myCoords.lng, u.lat, u.lng) : null,
    }));

    const list = withDistance.filter(u => {
      if (filters.availableNow && u.available !== true) return false;
      if (filters.minRating > 0 && ratingNum(u) < filters.minRating) return false;
      if (filters.verifiedWorkOnly && !hasVerifiedWork(u)) return false;

      if (distanceModeActive) {
        if (myCoords) {
          if (u.__km != null) return u.__km <= filters.distanceKm;
          // No coordinates on this provider — never let them silently vanish;
          // fall back to matching the searcher's own city as plain text.
          return myCity ? (u.city || '').toLowerCase() === myCity.toLowerCase() : true;
        }
        if (locationDenied && myCity) {
          return (u.city || '').toLowerCase() === myCity.toLowerCase();
        }
        // Still resolving location, or no reference city at all — don't
        // filter yet rather than returning an empty list.
      }
      return true;
    });

    // Distance takes over as the primary sort whenever the searcher explicitly
    // asked for it ("near me" / distance filter, on the default Best match
    // sort — or the Nearest sort picked directly) and their location is known.
    // Ties (equal/unknown distance) fall back to the shared bestMatchCompare.
    const useDistancePrimary = myCoords && (sortBy === 'nearest' || (sortBy === 'best' && distanceModeActive));
    const withinTierCompare = compareForSort(sortBy, { useDistancePrimary });

    const sorted = [...list];
    // A provider whose PRIMARY skill/category matched the search query always
    // ranks above one who only matched via extra skills/services/tools, which
    // in turn ranks above one who only matched via a verified project's
    // "Type of work" tags (__matchTier: 3 = primary/name/city, 2 = extra-only,
    // 1 = project-type-of-work-only) — the chosen sort (Best match, distance,
    // revenue, etc.) only decides order within a tier. No active text query
    // means every result carries the same tier (3), so this is a no-op and
    // behaves exactly as before.
    sorted.sort((a, b) => {
      const at = a.__matchTier ?? 3, bt = b.__matchTier ?? 3;
      if (at !== bt) return bt - at;
      return withinTierCompare(a, b);
    });
    return sorted;
  }, [allResults, filters, sortBy, distanceModeActive, myCoords, locationDenied, myCity]);

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

  // Projects tab — flattens every fetched provider's verified (non-ongoing)
  // projects, matches each individually against the query (Type-of-work
  // keyword first, then name/category as a secondary signal), and ranks
  // keyword matches above name/category matches, then by value, then by
  // whatever recency signal the project happens to carry.
  const projectResults = useMemo(() => {
    const q = norm(query.replace(NEAR_ME_RE, ''));
    const rows = [];
    allResults.forEach(u => {
      const projects = Array.isArray(u.projects) ? u.projects : [];
      projects.forEach((p, i) => {
        if (p.status === 'ongoing') return; // only verified/completed projects
        const { tier, keyword } = projectMatchInfo(p, q);
        if (tier === 0) return;
        rows.push({
          ...p,
          __key: `${u.uid || u.name || 'x'}_${i}`,
          __tier: tier,
          __keyword: keyword,
          __providerUid: u.uid,
          __providerName: u.name || u.companyName || 'Unnamed',
          __providerVerified: !!u.verified,
        });
      });
    });
    rows.sort((a, b) => {
      if (a.__tier !== b.__tier) return b.__tier - a.__tier;
      const av = Number(a.value) || 0, bv = Number(b.value) || 0;
      if (av !== bv) return bv - av;
      return projectRecencyMs(b) - projectRecencyMs(a);
    });
    return rows;
  }, [allResults, query]);

  const toggleAvailableNow = () => setFilters(f => ({ ...f, availableNow: !f.availableNow }));
  const toggleMinRating4 = () => setFilters(f => ({ ...f, minRating: f.minRating > 0 ? 0 : 4 }));
  const toggleVerifiedWork = () => setFilters(f => ({ ...f, verifiedWorkOnly: !f.verifiedWorkOnly }));

  const openProfile = (item) => {
    const screen = PROFILE_SCREEN[(item.profileType || '').toLowerCase()];
    if (item.uid && screen) openProviderProfile(navigation, screen, { uid: item.uid });
  };

  const closeViewer = () => setViewer(v => ({ ...v, visible: false }));
  const openViewer = (photos, index = 0) => setViewer({ visible: true, photos, index });

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Top bar ── */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
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

      {/* ── Tabs — single pill toggle ── */}
      <View style={s.tabsRow}>
        <View style={s.tabsPill}>
          <TouchableOpacity
            style={[s.tabSeg, resultTab === 'accounts' && s.tabSegActive]}
            onPress={() => setResultTab('accounts')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabSegText, resultTab === 'accounts' && s.tabSegTextActive]} numberOfLines={1}>
              Accounts {sortedFiltered.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tabSeg, resultTab === 'projects' && s.tabSegActive]}
            onPress={() => setResultTab('projects')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabSegText, resultTab === 'projects' && s.tabSegTextActive]} numberOfLines={1}>
              Projects {projectResults.length}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {resultTab === 'accounts' ? (
        <>
          {/* ── Results header ── */}
          <View style={s.resultsHeader}>
            <Text style={s.resultsHeaderText} numberOfLines={1}>{headerText}</Text>
            <TouchableOpacity onPress={() => setSortOpen(true)} activeOpacity={0.7}>
              <Text style={s.sortText}>Sort: {SORT_OPTIONS.find(o => o.key === sortBy)?.label} ⌄</Text>
            </TouchableOpacity>
          </View>
          {locationNote ? <Text style={s.locationNote}>{locationNote}</Text> : null}

          {/* ── Accounts body ── */}
          {loading && allResults.length === 0 ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={DARK} />
            </View>
          ) : visible.length === 0 ? (
            <View style={s.center}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyTitle}>No accounts found</Text>
            </View>
          ) : (
            <FlatList
              style={{ flex: 1 }}
              data={visible}
              keyExtractor={(item, i) => (item.uid || item.name || 'x') + i}
              renderItem={({ item }) => <ProviderRow item={item} onPress={() => openProfile(item)} />}
              ItemSeparatorComponent={() => <View style={s.rowSep} />}
              onEndReached={() => setVisibleCount(v => Math.min(v + PAGE_SIZE, sortedFiltered.length))}
              onEndReachedThreshold={0.4}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
            />
          )}
        </>
      ) : (
        // ── Projects body ──
        loading && allResults.length === 0 ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={DARK} />
          </View>
        ) : projectResults.length === 0 ? (
          <View style={s.center}>
            <Text style={s.emptyIcon}>📁</Text>
            <Text style={s.emptyTitle}>No projects found</Text>
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={projectResults}
            keyExtractor={(item) => item.__key}
            renderItem={({ item }) => (
              <ProjectRow item={item} onPress={() => setProjectDetail(item)} />
            )}
            ItemSeparatorComponent={() => <View style={s.rowSep} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          />
        )
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

      {/* ── Verified project detail (Projects tab row tap) ── */}
      <ProjectDetailModal
        visible={!!projectDetail}
        project={projectDetail}
        onClose={() => setProjectDetail(null)}
        onViewPhoto={(photos, index) => openViewer(photos, index)}
      />
      <PhotoViewer
        visible={viewer.visible}
        photos={viewer.photos}
        initialIndex={viewer.index}
        onClose={closeViewer}
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
    paddingBottom: 12, paddingHorizontal: 14,
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

  // ── Result tabs (Accounts / Projects) — single pill toggle, compact height
  tabsRow: {
    flexDirection: 'row', flexShrink: 0,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tabsPill: {
    flexDirection: 'row', backgroundColor: FILL, borderRadius: 20, padding: 3,
  },
  tabSeg: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 17 },
  tabSegActive: { backgroundColor: DARK },
  tabSegText: { fontSize: 13, lineHeight: 17, fontWeight: '600', color: MID },
  tabSegTextActive: { color: '#FFFFFF', fontWeight: '700' },

  // ── Results header — its own compact row, clear space above (tabs) and
  // below (first result) so it can never collide with either.
  resultsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0, flexWrap: 'nowrap',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  resultsHeaderText: { fontSize: 12, lineHeight: 16, color: MID, fontWeight: '500', flexShrink: 1, marginRight: 10 },
  sortText: { fontSize: 12, lineHeight: 16, color: DARK, fontWeight: '700', flexShrink: 0 },
  locationNote: { fontSize: 11, color: LIGHT, fontWeight: '500', paddingHorizontal: 16, marginTop: 6 },

  // ── Empty / loading
  emptyIcon: { fontSize: 40, marginBottom: 10, opacity: 0.5 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: MID },

  // ── Row separator — shared by the provider-row FlatList (ProviderRow, see
  // components/ProviderRow.js) and the project-row FlatList below.
  rowSep: { height: 1, backgroundColor: BORDER, marginLeft: 16 },
  verifiedBadge: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: LINK_BLUE,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  verifiedBadgeText: { fontSize: 8, color: '#FFFFFF', fontWeight: '900' },

  // ── Project row (Projects tab)
  projectRow: { paddingHorizontal: 16, paddingVertical: 13 },
  projectName: { fontSize: 14, fontWeight: '700', color: DARK },
  projectSubline: { fontSize: 12, color: GREEN, fontWeight: '600', marginTop: 3 },
  projectProviderRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  projectProviderName: { fontSize: 12, color: LIGHT, fontWeight: '500', flexShrink: 1 },
  projectKeywordChip: {
    alignSelf: 'flex-start', backgroundColor: FILL, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2, marginTop: 6,
  },
  projectKeywordChipText: { fontSize: 11, fontWeight: '600', color: MID },

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
    paddingHorizontal: 20, paddingTop: 10, maxHeight: '85%',
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
