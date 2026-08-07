import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, StatusBar, useWindowDimensions, Animated, Alert,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/BottomNav';
import UnreadBadge from '../components/UnreadBadge';
import { auth } from '../config/firebase';
import { getCurrentUid } from '../utils/session';
import { openMyProfile } from '../utils/profileNav';
import { getProfile } from '../services/userService';
import { startVoiceSearch } from '../services/voiceSearchService';
import { subscribeNotifications } from '../services/notificationService';
import {
  SOLO_WORKER_CATEGORIES,
  CONTRACTOR_CATEGORIES,
  PROFESSIONAL_CATEGORIES,
  CATEGORY_ICONS,
} from '../constants/categories';

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

  const [workersExpanded, setWorkersExpanded] = useState(false);
  const [contractorsExpanded, setContractorsExpanded] = useState(false);
  const [professionalsExpanded, setProfessionalsExpanded] = useState(false);

  const [listening, setListening] = useState(false);
  const micPulse = useRef(new Animated.Value(1)).current;
  const stopListeningRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUserInfo();
  }, []);

  // Bell badge — only for real signed-in accounts (guests have no live
  // Firestore notifications to count). Live count, so it updates the moment
  // a notification is read/deleted from the Notifications screen too.
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = subscribeNotifications(auth.currentUser.uid, (items) => {
      setUnreadCount(items.filter(n => !n.read).length);
    });
    return unsub;
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
      const uid = await getCurrentUid();
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

  const handleProfilePress = () => openMyProfile(navigation);
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* SEARCH — pinned at the top, always visible, never overlapped. */}
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

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* BRAND ROW — part of the normal scrollable content, so it scrolls
            away naturally with the page. No collapse animation. */}
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
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
              <UnreadBadge count={unreadCount} />
            </TouchableOpacity>
          </View>
        </View>

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

        {/* SKILL EXPERTS */}
        <ProviderSection
          title="Skill Experts"
          subtitle="Independent skilled workers for hire"
          categories={SOLO_WORKER_CATEGORIES}
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

  // Brand row now lives inside the ScrollView content, so it scrolls away
  // naturally with the page — no collapse animation, no overlap possible.
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
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
    position: 'relative',
  },
  // Search — always visible, pinned below the animated greeting header.
  // No `elevation` here: on Android, elevation promotes a view to its own
  // compositing layer with independent Z-stacking, which can paint it above
  // the greeting row regardless of actual layout position — exactly what
  // was making the greeting look "half hidden behind the search bar" while
  // expanding. The border is enough separation without it.
  searchWrap: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
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
