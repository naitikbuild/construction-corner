import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, StatusBar, useWindowDimensions, Animated, Alert,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/BottomNav';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { getProfile } from '../services/userService';
import { startVoiceSearch } from '../services/voiceSearchService';
import {
  SKILLED_WORKER_CATEGORIES,
  UNSKILLED_WORKER_CATEGORIES,
  CONTRACTOR_CATEGORIES,
  PROFESSIONAL_CATEGORIES,
  CATEGORY_ICONS,
} from '../constants/categories';

const GREETING_THRESHOLD = 10;
const GREETING_ANIM_MS = 220;

// Collapses the greeting row's own HEIGHT (not a translateY on an absolutely
// positioned overlay) so the search bar — a normal sibling right below it —
// naturally slides up to fill the space as it shrinks, with zero gap and no
// manual scroll-content offset math. Same hide/show scroll heuristics as
// hooks/useAutoHideHeader (10px threshold, direction-accumulator, forced
// visible at the top) but sized to the greeting row's own measured height.
function useCollapsingGreeting() {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [measured, setMeasured] = useState(false);

  const fullHeight = useRef(0);
  const hidden = useRef(false);
  const lastY = useRef(0);
  const accumulated = useRef(0);

  const onGreetingLayout = (e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && h !== fullHeight.current) {
      fullHeight.current = h;
      if (!hidden.current) heightAnim.setValue(h);
      setMeasured(true);
    }
  };

  const showGreeting = () => {
    if (!hidden.current) return;
    hidden.current = false;
    Animated.parallel([
      Animated.timing(heightAnim, { toValue: fullHeight.current, duration: GREETING_ANIM_MS, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 1, duration: GREETING_ANIM_MS, useNativeDriver: false }),
    ]).start();
  };

  const hideGreeting = () => {
    if (hidden.current) return;
    hidden.current = true;
    Animated.parallel([
      Animated.timing(heightAnim, { toValue: 0, duration: GREETING_ANIM_MS, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 0, duration: GREETING_ANIM_MS, useNativeDriver: false }),
    ]).start();
  };

  const onScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastY.current;
    lastY.current = y;

    if (y <= 0) {
      accumulated.current = 0;
      showGreeting();
      return;
    }

    if ((delta > 0 && accumulated.current < 0) || (delta < 0 && accumulated.current > 0)) {
      accumulated.current = 0;
    }
    accumulated.current += delta;

    if (accumulated.current > GREETING_THRESHOLD) {
      hideGreeting();
      accumulated.current = 0;
    } else if (accumulated.current < -GREETING_THRESHOLD) {
      showGreeting();
      accumulated.current = 0;
    }
  };

  return {
    greetingStyle: measured ? { height: heightAnim, opacity: opacityAnim } : { opacity: opacityAnim },
    onGreetingLayout,
    onScroll,
  };
}

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
  if (c.includes('piling')) return '⚒️';
  if (c.includes('rcc')) return '🏗️';
  if (c.includes('solar')) return '☀️';
  if (c.includes('elevator') || c.includes('lift')) return '🛗';
  if (c.includes('stp') || c.includes('wtp')) return '🚰';
  if (c.includes('soil')) return '🧪';
  if (c.includes('signage') || c.includes('branding')) return '🪧';
  if (c.includes('cctv') || c.includes('security system')) return '📹';
  if (c.includes('pest')) return '🐜';
  if (c.includes('labour')) return '👷';
  if (c.includes('turnkey')) return '🔑';
  if (c.includes('3d')) return '🖥️';
  if (c.includes('helper')) return '🤝';
  if (c.includes('grill') || c.includes('gate')) return '🚪';
  if (c.includes('centering') || c.includes('shuttering')) return '🏗️';
  if (c.includes('plaster')) return '🧱';
  if (c.includes('floor') || c.includes('tile')) return '🪨';
  if (c.includes('bar bend')) return '🔩';
  if (c.includes('pop') || c.includes('false ceiling')) return '🧱';
  if (c.includes('project engineer') || c.includes('planning engineer')) return '📋';
  if (c.includes('construction manager')) return '💼';
  if (c.includes('quantity surveyor')) return '📊';
  return fallback;
}

// Shared "2-row grid + See More/See Less" browse section, driven entirely by a category list.
// `tabs` (optional) renders a Skilled/Unskilled-style switcher above the grid — each tab
// carries its own category list, so the grid always reflects whichever tab is active.
function ProviderSection({ title, subtitle, categories, tabs, activeTab, onTabChange, profileType, iconFallback, expanded, onToggleExpand, navigation, width }) {
  const visible = expanded ? categories : categories.slice(0, 8);
  return (
    <>
      <View style={styles.secHead}>
        <Text style={styles.secTitle}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.secSubtitle}>{subtitle}</Text> : null}
      {tabs && (
        <View style={styles.sectionPad}>
          <View style={styles.workerTabRow}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.workerTabBtn, activeTab === tab.key && styles.workerTabBtnActive]}
                onPress={() => onTabChange(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.workerTabBtnText, activeTab === tab.key && styles.workerTabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <View style={styles.sectionPad}>
        <View style={styles.iconsGrid}>
          {visible.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.iconItem, { width: (width - 28) / 4 - 9 }]}
              onPress={() => navigation.navigate('CategoryList', { category, profileType })}
            >
              <View style={styles.iconBox}>
                {CATEGORY_ICONS[category] ? (
                  <Image source={CATEGORY_ICONS[category]} style={styles.iconImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.iconEmoji}>{iconForCategory(category, iconFallback)}</Text>
                )}
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
  const { greetingStyle, onGreetingLayout, onScroll } = useCollapsingGreeting();

  const [workersExpanded, setWorkersExpanded] = useState(false);
  const [contractorsExpanded, setContractorsExpanded] = useState(false);
  const [professionalsExpanded, setProfessionalsExpanded] = useState(false);
  const [workerTypeTab, setWorkerTypeTab] = useState('skilled');

  const [listening, setListening] = useState(false);
  const micPulse = useRef(new Animated.Value(1)).current;
  const stopListeningRef = useRef(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  // Stop any in-flight recognition session if the screen unmounts mid-listen.
  useEffect(() => {
    return () => { stopListeningRef.current?.(); };
  }, []);

  // Pulse the mic while actively listening; snap back to rest otherwise.
  useEffect(() => {
    if (!listening) {
      micPulse.stopAnimation();
      micPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.25, duration: 500, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [listening]);

  const handleMicPress = async () => {
    if (listening) return;
    setListening(true);
    const stop = await startVoiceSearch({
      onResult: (transcript) => {
        if (transcript) navigation.navigate('Search', { query: transcript });
      },
      onEnd: () => setListening(false),
      onError: (code) => {
        setListening(false);
        if (code === 'denied') {
          Alert.alert(
            'Microphone Permission Needed',
            'Please allow microphone access to use voice search. You can still type your search normally.'
          );
        } else if (code === 'unsupported') {
          Alert.alert(
            'Voice Search Unavailable',
            'Voice search needs a development build of the app to work — it isn\'t available in this preview (Expo Go). You can still type your search normally.'
          );
        } else if (code !== 'no-speech' && code !== 'aborted') {
          Alert.alert('Voice Search Error', "Didn't catch that — please try again or type your search.");
        }
      },
    });
    stopListeningRef.current = stop;
  };

  // Refreshes the shared 'userName' AsyncStorage cache that other screens
  // (chat, enquiry prefill, etc.) read from — no longer rendered here since
  // the greeting/location row was removed.
  const loadUserInfo = async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) return;
      let profile = null;
      if (auth.currentUser) {
        profile = await getProfile(uid);
      } else {
        const local = await AsyncStorage.getItem('localProfile');
        if (local) profile = JSON.parse(local);
      }
      const name = profile?.name || profile?.companyName || '';
      if (name) await AsyncStorage.setItem('userName', name);
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

      {/* HEADER — greeting row collapses (height+opacity) on scroll down; the
          search bar is a normal sibling right below it, so it slides up to
          sit flush at the top with no gap as the greeting shrinks away. */}
      <View style={styles.headerContainer}>
        <Animated.View style={[styles.greetingCollapse, greetingStyle]}>
          <View style={styles.headerTop} onLayout={onGreetingLayout}>
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
        </Animated.View>

        <View style={styles.searchWrap}>
          <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
            <Text style={styles.searchPlaceholder}>
              {listening ? 'Listening...' : 'Search professionals, materials...'}
            </Text>
            <TouchableOpacity
              style={[styles.micBtn, listening && styles.micBtnActive]}
              onPress={handleMicPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.75}
            >
              <Animated.Text style={[{ fontSize: 14 }, { transform: [{ scale: micPulse }] }]}>
                🎤
              </Animated.Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >

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

        {/* SOLO WORKERS */}
        <ProviderSection
          title="Solo Workers"
          subtitle="Independent skilled and unskilled workers for hire"
          categories={workerTypeTab === 'unskilled' ? UNSKILLED_WORKER_CATEGORIES : SKILLED_WORKER_CATEGORIES}
          tabs={[{ key: 'skilled', label: 'Skilled' }, { key: 'unskilled', label: 'Unskilled' }]}
          activeTab={workerTypeTab}
          onTabChange={(key) => { setWorkerTypeTab(key); setWorkersExpanded(false); }}
          profileType="worker"
          iconFallback="👷"
          expanded={workersExpanded}
          onToggleExpand={() => setWorkersExpanded(e => !e)}
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

  // Header container — constant top clearance (status bar) that never moves;
  // the greeting row collapses inside it, so the search bar below always sits
  // flush under this padding whether the greeting is shown or hidden.
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
  },
  // overflow:hidden clips the greeting content as its animated height shrinks.
  greetingCollapse: {
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
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

  // Search — always visible, pinned below the animated greeting header.
  // No `elevation` here: on Android, elevation promotes a view to its own
  // compositing layer with independent Z-stacking, which can paint it above
  // the greeting row regardless of actual layout position — exactly what
  // was making the greeting look "half hidden behind the search bar" while
  // expanding. The border is enough separation without it.
  searchWrap: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
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
  micBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#EFEFEF',
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: '#22A559' },

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

  // Skilled / Unskilled tab switcher (Solo Workers section)
  workerTabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  workerTabBtn: {
    flex: 1, height: 38, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E5E5', backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  workerTabBtnActive: { backgroundColor: '#262626', borderColor: '#262626' },
  workerTabBtnText: { fontSize: 13, fontWeight: '600', color: '#737373' },
  workerTabBtnTextActive: { color: '#FFFFFF' },

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
    overflow: 'hidden',
  },
  iconEmoji: { fontSize: 28 },
  iconImage: { width: '100%', height: '100%', borderRadius: 14 },
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
});
