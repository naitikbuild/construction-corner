import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import * as Location from 'expo-location';
import { getAllUsers } from '../services/userService';
import { SORT_OPTIONS, hasCoords, haversineKm, compareForSort } from '../utils/ranking';
import { openProviderProfile } from '../utils/authGate';
import ProviderRow, { tradeLine } from '../components/ProviderRow';

const PROFILE_SCREEN = {
  professional: 'ProfessionalProfile',
  worker:       'WorkerProfile',
  contractor:   'ContractorProfile',
  supplier:     'SupplierProfile',
  business:     'BusinessProfile',
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CategoryListScreen({ navigation, route }) {
  const { category = 'Professionals', profileType = 'professional' } = route?.params || {};
  const destScreen = PROFILE_SCREEN[profileType] || 'ProfessionalProfile';
  const [loading, setLoading] = useState(true);
  const [rawUsers, setRawUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('best');
  const [sortOpen, setSortOpen] = useState(false);

  // Viewer's own GPS position for "Nearest" — resolved lazily (only once that
  // sort is actually picked, never on screen open). Denial/failure is
  // remembered so the list falls back to Best match (with a note) instead of
  // re-prompting for permission on every render.
  const [myCoords, setMyCoords] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [category, profileType]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers(profileType, category);
      setRawUsers(users);
    } catch (_) {
      setRawUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sortBy !== 'nearest' || myCoords || locationDenied) return;
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
  }, [sortBy, myCoords, locationDenied]);

  // Same ranking used everywhere else (Search, every other category listing —
  // see utils/ranking.js): primary-category matches (__categoryTier 2) always
  // rank above providers who only match via extra skills/services/tools
  // (tier 1); within each tier, the chosen sort decides order. "Nearest"
  // needs myCoords — until/unless that resolves, it quietly behaves like
  // Best match (see the locationNote below the search bar for that case).
  // Sorted raw user records are handed straight to ProviderRow — no
  // display-string mapping in between, same as SearchScreen.
  const sortedProfiles = useMemo(() => {
    const withDistance = rawUsers.map(u => ({
      ...u,
      __km: (myCoords && hasCoords(u)) ? haversineKm(myCoords.lat, myCoords.lng, u.lat, u.lng) : null,
    }));
    const useDistancePrimary = sortBy === 'nearest' && !!myCoords;
    const withinTierCompare = compareForSort(sortBy, { useDistancePrimary });

    return [...withDistance].sort((a, b) => {
      const at = a.__categoryTier ?? 2, bt = b.__categoryTier ?? 2;
      if (at !== bt) return bt - at;
      return withinTierCompare(a, b);
    });
  }, [rawUsers, sortBy, myCoords]);

  const displayed = search.trim()
    ? sortedProfiles.filter(p => {
        const q = search.trim().toLowerCase();
        const name = (p.name || p.companyName || '').toLowerCase();
        return name.includes(q) || tradeLine(p).toLowerCase().includes(q);
      })
    : sortedProfiles;

  const nearestUnavailable = sortBy === 'nearest' && !myCoords && locationDenied;
  const sortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label || 'Best match';

  const typeLabel = { professional: 'professionals', worker: 'workers', contractor: 'contractors', supplier: 'suppliers', business: 'companies' }[profileType] || 'profiles';
  const countLabel = loading ? 'Loading...' : `${displayed.length} ${typeLabel} found`;

  return (
    <View style={ss.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── HEADER ── */}
      <View style={ss.header}>
        <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()}>
          <Text style={ss.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={ss.headerCenter}>
          <Text style={ss.headerTitle} numberOfLines={1}>{category}</Text>
          <Text style={ss.headerCount}>{countLabel}</Text>
        </View>
        <TouchableOpacity
          style={ss.sortBtn}
          onPress={() => setSortOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={ss.sortLabel} numberOfLines={1}>Sort: {sortLabel} ⌄</Text>
        </TouchableOpacity>
      </View>

      {/* ── SEARCH BAR ── */}
      <View style={ss.searchWrap}>
        <View style={ss.searchBar}>
          <Text style={ss.searchIcon}>🔍</Text>
          <TextInput
            style={ss.searchInput}
            placeholder={`Search ${category.toLowerCase()}...`}
            placeholderTextColor="#AAAAAA"
            returnKeyType="search"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {nearestUnavailable && (
          <Text style={ss.locationNote}>
            Enable location access to sort by distance — showing best matches instead.
          </Text>
        )}
      </View>

      {/* ── LIST ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B2B" />
          <Text style={{ marginTop: 12, color: '#888888', fontSize: 14 }}>Finding {typeLabel}...</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 8 }}>
            No {typeLabel} found yet
          </Text>
          <Text style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
            Be the first to register in this category!
          </Text>
        </View>
      ) : (
        <ScrollView
          style={ss.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={ss.listContent}
        >
          {displayed.map((profile, i) => (
            <View key={profile.uid || i}>
              {i > 0 && <View style={ss.rowSep} />}
              <ProviderRow
                item={profile}
                onPress={() => openProviderProfile(navigation, destScreen, { category, uid: profile.uid })}
              />
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── Sort sheet ── */}
      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <TouchableOpacity style={ss.modalOverlay} onPress={() => setSortOpen(false)} activeOpacity={1}>
          <TouchableOpacity style={ss.sortSheet} activeOpacity={1} onPress={() => {}}>
            <Text style={ss.sortSheetTitle}>Sort by</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={ss.sortOptionRow}
                onPress={() => { setSortBy(opt.key); setSortOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[ss.sortOptionText, sortBy === opt.key && ss.sortOptionTextActive]}>{opt.label}</Text>
                {sortBy === opt.key && <Text style={ss.sortOptionCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F0' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#1A1A1A', fontWeight: '700' },
  headerCenter: { flex: 1, paddingHorizontal: 10 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
  headerCount: { fontSize: 12, color: '#888888', fontWeight: '500', marginTop: 1 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, maxWidth: 170 },
  sortLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },

  searchWrap: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A', padding: 0 },
  locationNote: { fontSize: 11, color: '#888888', fontWeight: '500', marginTop: 8, fontStyle: 'italic' },

  // ── Sort sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 },
  sortSheet: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  sortSheetTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  sortOptionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderTopWidth: 1, borderTopColor: '#EFEFEF',
  },
  sortOptionText: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  sortOptionTextActive: { color: '#22A559', fontWeight: '700' },
  sortOptionCheck: { fontSize: 14, color: '#22A559', fontWeight: '900' },

  list: { flex: 1 },
  listContent: { paddingTop: 4, paddingBottom: 20 },
  // Matches SearchScreen's row separator exactly — the rows themselves
  // (ProviderRow, see components/ProviderRow.js) carry no card border/shadow
  // of their own, same flat list look as search results.
  rowSep: { height: 1, backgroundColor: '#EFEFEF', marginLeft: 16 },
});
