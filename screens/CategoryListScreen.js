import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { getAllUsers } from '../services/userService';
import { formatAmountIndian, isRecentJoin } from '../utils/format';

const PROFILE_SCREEN = {
  professional: 'ProfessionalProfile',
  worker:       'WorkerProfile',
  contractor:   'ContractorProfile',
  supplier:     'SupplierProfile',
  business:     'BusinessProfile',
};

// ─── Default ranking ("Best match") ────────────────────────────────────────
// Same rules as the Search screen's default sort, tuned for construction:
// verified (proven, app-confirmed) work outranks unverified; then revenue,
// since it reflects consistent repeat work over a single lucky job; then
// rating, then on-time reliability; available-now providers get a final
// nudge ahead of otherwise-equal peers. Zero-revenue/unverified providers
// still appear — just ranked toward the bottom, never filtered out.
function verifiedAmountNum(u) {
  return Number(u.totalVerifiedAmount ?? u.demoVerifiedAmount ?? 0) || 0;
}
function hasVerifiedWork(u) {
  return Number(u.jobsCompleted ?? 0) > 0 || verifiedAmountNum(u) > 0;
}
function ratingNum(u) {
  const r = Number(u.rating);
  return Number.isFinite(r) ? r : 0;
}
function onTimeNum(u) {
  const n = parseFloat(u.onTimeRate);
  return Number.isFinite(n) ? n : -1;
}
function bestMatchCompare(a, b) {
  const av = hasVerifiedWork(a) ? 1 : 0;
  const bv = hasVerifiedWork(b) ? 1 : 0;
  if (av !== bv) return bv - av;

  const arev = verifiedAmountNum(a), brev = verifiedAmountNum(b);
  if (arev !== brev) return brev - arev;

  const ar = ratingNum(a), br = ratingNum(b);
  if (ar !== br) return br - ar;

  const aot = onTimeNum(a), bot = onTimeNum(b);
  if (aot !== bot) return bot - aot;

  const aa = a.available === true ? 1 : 0;
  const ba = b.available === true ? 1 : 0;
  return ba - aa;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function ProfileCard({ profile, isLast, onPress }) {
  // Zero jobs AND joined under a month ago -> a subtle "New" label instead of
  // the "₹0 verified work" line. Past the first month with still no jobs,
  // the real (zero) verified-amount line shows as normal.
  const isNew = profile.jobsCompleted === 0 && isRecentJoin(profile.createdAt);
  return (
    <TouchableOpacity
      style={[ss.card, isLast && ss.cardLast]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={[ss.thumb, { backgroundColor: profile.avatarBg }]}>
        <Text style={ss.thumbEmoji}>{profile.avatar}</Text>
        <View style={ss.ratingBadge}>
          <Text style={ss.ratingText}>★ {profile.rating}</Text>
        </View>
      </View>

      <View style={ss.info}>
        <Text style={ss.name} numberOfLines={2}>
          {profile.name}
          <Text style={ss.verifiedTick}> ✓</Text>
        </Text>
        <Text style={ss.desig} numberOfLines={1}>{profile.designation}</Text>
        <Text style={ss.meta} numberOfLines={1}>📍 {profile.location}{profile.experience ? `  ·  ${profile.experience}` : ''}</Text>
        {isNew ? (
          <View style={ss.newBadge}>
            <Text style={ss.newBadgeText}>New</Text>
          </View>
        ) : (
          <Text style={ss.verifiedAmt}>{profile.verifiedAmt} verified work</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Map Firestore user to card shape ─────────────────────────────────────────
function firestoreUserToCard(user) {
  const emojiMap = { professional: '🏛️', worker: '👷', contractor: '👷‍♂️', supplier: '🏭', business: '🏢' };
  const bgMap = { professional: '#EDE7F6', worker: '#FFF3E0', contractor: '#E5E5E5', supplier: '#E3F2FD', business: '#E8F5E9' };
  const pt = (user.profileType || '').toLowerCase();
  return {
    uid: user.uid,
    avatar: emojiMap[pt] || '👤',
    avatarBg: bgMap[pt] || '#F5F5F5',
    name: user.name || user.companyName || 'Unknown',
    designation: user.designation || user.workerSkill || user.supplierCategory || user.companyType || '',
    location: [user.city, user.state].filter(Boolean).join(', ') || 'India',
    experience: user.experience ? `${user.experience} yrs exp` : user.workerExperience ? `${user.workerExperience} yrs exp` : '',
    rating: user.rating ? String(user.rating) : '4.5',
    verifiedAmt: formatAmountIndian(user.totalVerifiedAmount ?? user.demoVerifiedAmount ?? 0),
    jobsCompleted: Number(user.jobsCompleted ?? 0) || 0,
    createdAt: user.createdAt || null,
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CategoryListScreen({ navigation, route }) {
  const { category = 'Professionals', profileType = 'professional' } = route?.params || {};
  const destScreen = PROFILE_SCREEN[profileType] || 'ProfessionalProfile';
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProfiles();
  }, [category, profileType]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers(profileType, category);
      // Primary-category matches (__categoryTier 2) rank above providers who
      // only match via extra skills/services/tools (tier 1); within each
      // tier, keep the existing default ranking (verified, revenue, rating).
      const ranked = [...users].sort((a, b) => {
        const at = a.__categoryTier ?? 2, bt = b.__categoryTier ?? 2;
        if (at !== bt) return bt - at;
        return bestMatchCompare(a, b);
      });
      setProfiles(ranked.map(firestoreUserToCard));
    } catch (_) {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const displayed = search.trim()
    ? profiles.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.designation.toLowerCase().includes(search.toLowerCase())
      )
    : profiles;

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
          onPress={() => Alert.alert('Sort & Filter', 'Coming soon!')}
        >
          <Text style={ss.sortIcon}>⇅</Text>
          <Text style={ss.sortLabel}>Sort</Text>
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
            <ProfileCard
              key={profile.uid || i}
              profile={profile}
              isLast={i === displayed.length - 1}
              onPress={() => navigation.navigate(destScreen, { category, profile, uid: profile.uid })}
            />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  sortIcon: { fontSize: 14, color: '#1A1A2E' },
  sortLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },

  searchWrap: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A', padding: 0 },

  list: { flex: 1 },
  listContent: { paddingTop: 8, paddingHorizontal: 12, paddingBottom: 20 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 14, gap: 14,
    borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  cardLast: {},

  thumb: { width: 64, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  thumbEmoji: { fontSize: 30 },

  ratingBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2ECC71', borderTopLeftRadius: 8, borderBottomRightRadius: 14, paddingHorizontal: 6, paddingVertical: 3 },
  ratingText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },

  info: { flex: 1, paddingTop: 2 },
  name: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 3, lineHeight: 17 },
  verifiedTick: { fontSize: 13, fontWeight: '900', color: '#1877F2' },
  desig: { fontSize: 12, color: '#666666', fontWeight: '500', marginBottom: 3 },
  meta: { fontSize: 11, color: '#888888', fontWeight: '400', marginBottom: 5 },
  verifiedAmt: {
    fontSize: 12, fontWeight: '700', color: '#2ECC71',
    backgroundColor: '#F0FFF4', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  newBadge: {
    alignSelf: 'flex-start', backgroundColor: '#EAF7EF',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  newBadgeText: { fontSize: 12, fontWeight: '700', color: '#22A559' },
});
