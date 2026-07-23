import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, useWindowDimensions, Alert
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/BottomNav';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { getProfile } from '../services/userService';
import {
  SOLO_WORKER_CATEGORIES,
  CONTRACTOR_CATEGORIES,
  PROFESSIONAL_CATEGORIES,
} from '../constants/categories';

// Single remaining banner — Nation Building.
const banner = { bg: '#0A3D1A', title: "Let's Be a Part of\nIndia's Revolution", tag: '🇮🇳 Nation Building', emoji: '🇮🇳' };

const PROFILE_SCREEN_MAP = {
  worker: 'WorkerProfile',
  contractor: 'ContractorProfile',
  professional: 'ProfessionalProfile',
  business: 'BusinessProfile',
  supplier: 'SupplierProfile',
  personal: 'PersonalProfile',
};

// Cosmetic icon per category — purely a display helper, not a data source.
// Category lists themselves live in constants/categories.js.
function iconForCategory(category, fallback) {
  const c = category.toLowerCase();
  if (c.includes('electric')) return '⚡';
  if (c.includes('plumb')) return '🔧';
  if (c.includes('paint')) return '🎨';
  if (c.includes('mason')) return '🧱';
  if (c.includes('weld')) return '🔥';
  if (c.includes('carpen')) return '🪚';
  if (c.includes('waterproof')) return '💧';
  if (c.includes('roof')) return '🏠';
  if (c.includes('glass') || c.includes('aluminium')) return '🪟';
  if (c.includes('architect')) return '🏛️';
  if (c.includes('interior')) return '🛋️';
  if (c.includes('structural')) return '🏗️';
  if (c.includes('civil')) return '🏗️';
  if (c.includes('site supervisor')) return '🦺';
  if (c.includes('site engineer')) return '👷';
  if (c.includes('survey')) return '🗺️';
  if (c.includes('safety')) return '⛑️';
  if (c.includes('hvac')) return '❄️';
  if (c.includes('estimat')) return '🧮';
  if (c.includes('draftsman')) return '📏';
  if (c.includes('bim')) return '💻';
  if (c.includes('landscap')) return '🌿';
  if (c.includes('demolition')) return '🔨';
  if (c.includes('road')) return '🛣️';
  if (c.includes('fabricat')) return '🔩';
  if (c.includes('borewell')) return '🕳️';
  if (c.includes('earthwork') || c.includes('excavation')) return '⛏️';
  if (c.includes('labour')) return '👷';
  if (c.includes('turnkey')) return '🔑';
  if (c.includes('3d')) return '🖥️';
  if (c.includes('helper')) return '🤝';
  if (c.includes('grill') || c.includes('gate')) return '🚪';
  if (c.includes('centering') || c.includes('shuttering')) return '🏗️';
  if (c.includes('plaster')) return '🧱';
  if (c.includes('floor') || c.includes('tile')) return '🪨';
  if (c.includes('bar bender')) return '🔩';
  if (c.includes('pop') || c.includes('false ceiling')) return '🧱';
  if (c.includes('project engineer') || c.includes('planning engineer')) return '📋';
  if (c.includes('construction manager')) return '💼';
  if (c.includes('quantity surveyor')) return '📊';
  return fallback;
}

// Shared "2-row grid + See More/See Less" browse section, driven entirely by a category list.
function ProviderSection({ title, subtitle, categories, profileType, iconFallback, expanded, onToggleExpand, navigation, width }) {
  const visible = expanded ? categories : categories.slice(0, 8);
  return (
    <>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.secSubtitle}>{subtitle}</Text> : null}
      <View style={styles.sectionPad}>
        <View style={styles.iconsGrid}>
          {visible.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.iconItem, { width: (width - 28) / 4 - 9 }]}
              onPress={() => navigation.navigate('CategoryList', { category, profileType })}
            >
              <View style={styles.iconBox}>
                <Text style={styles.iconEmoji}>{iconForCategory(category, iconFallback)}</Text>
              </View>
              <Text style={styles.iconName} numberOfLines={2}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {categories.length > 8 && (
          <TouchableOpacity style={styles.seeMoreBtn} onPress={onToggleExpand}>
            <Text style={styles.seeMoreText}>
              {expanded ? 'See Less ↑' : `See More (${categories.length - 8} more) ↓`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('');

  const [workersExpanded, setWorkersExpanded] = useState(false);
  const [contractorsExpanded, setContractorsExpanded] = useState(false);
  const [professionalsExpanded, setProfessionalsExpanded] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const cached = await AsyncStorage.getItem('userName');
      if (cached) setUserName(cached);
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) return;
      let profile = null;
      if (auth.currentUser) {
        profile = await getProfile(uid);
      } else {
        const local = await AsyncStorage.getItem('localProfile');
        if (local) profile = JSON.parse(local);
      }
      if (profile) {
        const name = profile.name || profile.companyName || '';
        if (name) { setUserName(name); AsyncStorage.setItem('userName', name); }
        if (profile.city) setUserLocation(`${profile.city}${profile.state ? `, ${profile.state}` : ''}`);
      }
    } catch (_) {}
  };

  const handleProfilePress = async () => {
    try {
      const user = auth.currentUser;
      let uid, profile;
      if (user) {
        uid = user.uid;
        profile = await getProfile(uid);
      } else {
        uid = await AsyncStorage.getItem('uid');
        if (!uid) { navigation.navigate('AccountType'); return; }
        const local = await AsyncStorage.getItem('localProfile');
        if (!local) { navigation.navigate('AccountType'); return; }
        profile = JSON.parse(local);
      }
      const screen = PROFILE_SCREEN_MAP[profile?.profileType] || 'MyDashboard';
      navigation.navigate(screen, { uid });
    } catch (_) {
      navigation.navigate('MyDashboard');
    }
  };
  const handleResetApp = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (_) {}
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.brandLogo}>
              <Text style={{ fontSize: 18 }}>🏗️</Text>
            </View>
            <Text style={styles.brandName}>
              Construction <Text style={{ color: '#FC8019' }}>Corner</Text>
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.resetHeaderBtn} onPress={handleResetApp}>
              <Text style={styles.resetHeaderBtnText}>↺ Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('ChatList')}>
              <Text style={{ fontSize: 18 }}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LOCATION BAR */}
        <View style={styles.locationBar}>
          <Text style={styles.locationText}>
            📍 {userLocation || 'Ahmedabad, Gujarat'}  ▾
            {userName ? `  ·  👋 ${userName.split(' ')[0]}` : ''}
          </Text>
          <TouchableOpacity onPress={() => Alert.alert('Change Location', 'Coming soon!')}>
            <Text style={styles.locationChange}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search professionals, materials...</Text>
          <View style={styles.filterBtn}>
            <Text style={{ fontSize: 14 }}>⚙️</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* BANNER — Nation Building only */}
        <View style={styles.sectionPad}>
          <View style={[styles.bannerSlide, { backgroundColor: banner.bg }]}>
            <View style={styles.bannerContent}>
              <View>
                <Text style={styles.bannerTag}>{banner.tag}</Text>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerCta}>View Details →</Text>
              </View>
              <Text style={styles.bannerEmoji}>{banner.emoji}</Text>
            </View>
          </View>
        </View>

        {/* SOLO WORKERS */}
        <ProviderSection
          title="Solo Workers"
          subtitle="Independent skilled workers for hire"
          categories={SOLO_WORKER_CATEGORIES}
          profileType="worker"
          iconFallback="👷"
          expanded={workersExpanded}
          onToggleExpand={() => setWorkersExpanded(e => !e)}
          navigation={navigation}
          width={width}
        />

        {/* CONTRACTORS */}
        <ProviderSection
          title="Contractors"
          subtitle="Individual contractors with a crew for bigger jobs"
          categories={CONTRACTOR_CATEGORIES}
          profileType="contractor"
          iconFallback="🏗️"
          expanded={contractorsExpanded}
          onToggleExpand={() => setContractorsExpanded(e => !e)}
          navigation={navigation}
          width={width}
        />

        {/* PROFESSIONALS */}
        <ProviderSection
          title="Professionals"
          subtitle="Architects, engineers & consultants"
          categories={PROFESSIONAL_CATEGORIES}
          profileType="professional"
          iconFallback="🏛️"
          expanded={professionalsExpanded}
          onToggleExpand={() => setProfessionalsExpanded(e => !e)}
          navigation={navigation}
          width={width}
        />

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="Home" onProfilePress={handleProfilePress} />
    </View>
  );
}

const styles = injectFonts({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1, backgroundColor: '#FAF9F5' },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F2F2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 18, fontWeight: '900', color: '#262626' },
  headerIcons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FAF9F5',
    alignItems: 'center', justifyContent: 'center',
  },
  resetHeaderBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#262626', alignItems: 'center', justifyContent: 'center',
  },
  resetHeaderBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    backgroundColor: '#F5F5F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#888888' },
  filterBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#EFEFEF',
    alignItems: 'center', justifyContent: 'center',
  },

  // Section layout
  sectionPad: { paddingHorizontal: 14, paddingBottom: 4 },
  secHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 20,
    marginBottom: 4,
  },
  secTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  secSubtitle: { fontSize: 12, color: '#888888', paddingHorizontal: 14, marginBottom: 10 },

  // Icon grid
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  iconItem: { alignItems: 'center' },
  iconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderWidth: 0.5,
    borderColor: '#EFEFEF',
  },
  iconEmoji: { fontSize: 28 },
  iconName: { fontSize: 9, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', lineHeight: 13 },

  seeMoreBtn: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  seeMoreText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },

  // Banner
  bannerSlide: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 130,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  bannerTag: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  bannerTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', lineHeight: 24, marginBottom: 8 },
  bannerCta: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  bannerEmoji: { fontSize: 52 },

  // Location bar
  locationBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F5F5F0',
    paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: 10,
  },
  locationText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  locationChange: { fontSize: 13, fontWeight: '700', color: '#2ECC71' },

});
