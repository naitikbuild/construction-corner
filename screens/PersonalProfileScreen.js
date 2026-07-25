import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView, Image, Alert, Animated,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import PhotoViewer from '../components/PhotoViewer';
import { useAutoHideHeader } from '../hooks/useAutoHideHeader';

import { auth } from '../config/firebase';
import { getProfile } from '../services/userService';
import { getWorkByCustomer } from '../services/workService';
import { formatAmountIndian } from '../utils/format';

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

const DARK = '#262626';
const GREEN = '#22A559';
const GREEN_LIGHT = '#EAF7EF';
const FILL = '#F2F2F2';
const BORDER = '#E5E5E5';
const TEXT_DARK = '#262626';
const TEXT_MID = '#737373';
const TEXT_LIGHT = '#8E8E8E';
const ALERT = '#B00020';

function BookingCard({ item }) {
  const verified = item.status === 'verified';
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingAvatar}>
        <Text style={{ fontSize: 20 }}>👷</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bookingName} numberOfLines={1}>{item.providerName || 'Professional'}</Text>
        <Text style={styles.bookingSkill} numberOfLines={1}>{item.workType || 'Construction Work'}</Text>
        {item.date ? <Text style={styles.bookingDate}>{item.date}</Text> : null}
      </View>
      <View style={styles.bookingRight}>
        <Text style={styles.bookingAmount}>{formatAmountIndian(item.amount)}</Text>
        <View style={[styles.statusPill, verified ? styles.statusVerified : styles.statusPending]}>
          <Text style={[styles.statusText, { color: verified ? GREEN : TEXT_MID }]}>
            {verified ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PersonalProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [myUid, setMyUid] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const { headerAnimatedStyle, headerHeight, onHeaderLayout, onScroll } = useAutoHideHeader();

  const load = useCallback(async () => {
    try {
      const me = await AsyncStorage.getItem('uid');
      if (!me) { setLoading(false); return; }
      setMyUid(me);

      let p = null;
      try { p = await getProfile(me); } catch (_) {}
      if (!p) {
        try {
          const local = await AsyncStorage.getItem('localProfile');
          if (local) p = JSON.parse(local);
        } catch (_) {}
      }
      setProfile(p);

      try {
        const work = await getWorkByCustomer(me);
        setBookings(work || []);
      } catch (_) {
        setBookings([]);
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Construction Corner?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.clear();
            } catch (_) {}
            navigation.reset({ index: 0, routes: [{ name: 'AccountType' }] });
          },
        },
      ]
    );
  };

  const locationLine = profile
    ? [profile.area, profile.city].filter(Boolean).join(', ') + (profile.pincode ? ` — ${profile.pincode}` : '')
    : '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <AnimatedSafeAreaView
        style={[styles.header, styles.headerFloating, headerAnimatedStyle]}
        onLayout={onHeaderLayout}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </AnimatedSafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Profile summary */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={0.8}
            disabled={!profile?.photoUri}
            onPress={() => setViewerVisible(true)}
          >
            {profile?.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={{ fontSize: 36 }}>👤</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName} numberOfLines={2}>{profile?.name || 'Your Name'}</Text>
          {locationLine ? <Text style={styles.profileLocation}>📍 {locationLine}</Text> : null}
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('PersonalProfileSetup')}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* My Bookings */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>My Bookings</Text>
          {bookings.length > 0 && (
            <Text style={styles.sectionCount}>{bookings.length}</Text>
          )}
        </View>

        {!loading && bookings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>You haven't booked any services yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.emptyBtnText}>Browse Professionals →</Text>
            </TouchableOpacity>
          </View>
        )}

        {bookings.map(item => <BookingCard key={item.id} item={item} />)}

        {/* Settings / Sign Out */}
        <View style={{ height: 12 }} />
        <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsRowText}>⚙️ Settings</Text>
          <Text style={styles.settingsRowArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>🚪 Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav
        navigation={navigation}
        active="MyDashboard"
        onProfilePress={() => navigation.navigate('PersonalProfile', { uid: myUid })}
      />

      <PhotoViewer
        visible={viewerVisible}
        photos={profile?.photoUri ? [profile.photoUri] : []}
        initialIndex={0}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = injectFonts({
  container: { flex: 1, backgroundColor: '#FAF9F5' },

  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER },
  headerFloating: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: TEXT_DARK },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { flex: 1 },

  profileCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 22,
    alignItems: 'center', borderWidth: 1, borderColor: BORDER,
  },
  avatarWrap: { marginBottom: 12 },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER,
  },
  profileName: { fontSize: 19, fontWeight: '700', color: TEXT_DARK, marginBottom: 4, lineHeight: 23, textAlign: 'center' },
  profileLocation: { fontSize: 13, color: TEXT_MID, marginBottom: 14 },
  editBtn: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10,
    backgroundColor: FILL,
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: TEXT_DARK },

  sectionHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 12, marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  sectionCount: {
    fontSize: 12, fontWeight: '600', color: TEXT_DARK,
    backgroundColor: FILL, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
  },

  emptyState: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: BORDER, marginBottom: 12,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 13, color: TEXT_MID, fontWeight: '500', textAlign: 'center', marginBottom: 16 },
  emptyBtn: { backgroundColor: DARK, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  bookingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER,
  },
  bookingAvatar: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  bookingName: { fontSize: 13, fontWeight: '700', color: TEXT_DARK, marginBottom: 2 },
  bookingSkill: { fontSize: 11, color: TEXT_MID, marginBottom: 2 },
  bookingDate: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  bookingRight: { alignItems: 'flex-end', gap: 6 },
  bookingAmount: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPending: { backgroundColor: FILL },
  statusVerified: { backgroundColor: GREEN_LIGHT },
  statusText: { fontSize: 10, fontWeight: '600' },

  settingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15,
    borderWidth: 1, borderColor: BORDER,
  },
  settingsRowText: { fontSize: 14, fontWeight: '600', color: TEXT_DARK },
  settingsRowArrow: { fontSize: 20, color: TEXT_LIGHT },
  signOutBtn: {
    marginHorizontal: 16, paddingVertical: 15, borderRadius: 14,
    borderWidth: 1.5, borderColor: ALERT, backgroundColor: '#fff', alignItems: 'center',
  },
  signOutBtnText: { fontSize: 15, fontWeight: '700', color: ALERT },
});
