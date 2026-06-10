import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Switch, Alert, Linking, Share, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import BottomNav from '../components/BottomNav';

import { auth } from '../config/firebase';
import { getProfile, updateProfile } from '../services/userService';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
const ORANGE = '#FF6B2B';
const ORANGE_LIGHT = '#FFF3E0';

const APP_VERSION = '1.0.0';
const SUPPORT_WHATSAPP = 'https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20Construction%20Corner%20app';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.constructioncorner';
const SHARE_MSG = 'Join me on Construction Corner – India\'s #1 Construction Network! Find verified contractors, professionals & material suppliers. Download: https://play.google.com/store/apps/details?id=com.constructioncorner';

const PROFILE_SCREEN = {
  professional: 'ProfessionalProfile',
  worker: 'WorkerProfile',
  business: 'BusinessProfile',
  supplier: 'SupplierProfile',
};

export default function SettingsScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [uid, setUid] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifs, setNotifs] = useState({
    jobAlerts: true,
    messages: true,
    workUpdates: true,
    tenders: false,
    marketing: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedUid = await AsyncStorage.getItem('uid');
      if (!storedUid) return;
      setUid(storedUid);
      const data = await getProfile(storedUid);
      if (data) {
        setProfile(data);
        if (data.notificationPrefs) setNotifs({ ...notifs, ...data.notificationPrefs });
      }
    } catch (_) {}
  };

  const handleToggleNotif = async (key) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    setNotifSaving(true);
    try {
      if (uid) {
        await updateDoc(doc(db, 'users', uid), { notificationPrefs: updated });
      }
    } catch (_) {}
    finally { setNotifSaving(false); }
  };

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This is permanent. Your profile, work history, and all data will be deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      await deleteUser(user);
      await AsyncStorage.clear();
      navigation.reset({ index: 0, routes: [{ name: 'AccountType' }] });
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-login Required',
          'For security, please sign out and sign in again before deleting your account.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Cannot Delete',
          'Please contact support at support@constructioncorner.in to delete your account.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: SHARE_MSG, title: 'Construction Corner' });
    } catch (_) {}
  };

  const handleRateApp = () => {
    Linking.openURL(PLAY_STORE_URL).catch(() =>
      Alert.alert('Error', 'Could not open Play Store. Please search for Construction Corner on Play Store.')
    );
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL(SUPPORT_WHATSAPP).catch(() =>
      Alert.alert('Error', 'Could not open WhatsApp. Please contact support@constructioncorner.in')
    );
  };

  const handleViewProfile = () => {
    if (!profile || !uid) return;
    const pt = (profile.profileType || '').toLowerCase();
    const screen = PROFILE_SCREEN[pt] || 'MyDashboard';
    navigation.navigate(screen, { uid });
  };

  const displayName = profile?.name || profile?.companyName || 'Your Profile';
  const displayRole = [
    profile?.designation || profile?.category || profile?.workerSkill || profile?.companyType || '',
    profile?.city,
  ].filter(Boolean).join(' · ');

  const SettingRow = ({ icon, label, onPress, right, danger, subtitle }) => (
    <TouchableOpacity
      style={[styles.row, !onPress && { opacity: 0.8 }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );

  const ToggleRow = ({ icon, label, value, onToggle, subtitle }) => (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: ORANGE }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={handleViewProfile} activeOpacity={0.85}>
          <View style={styles.profileAvatar}>
            <Text style={{ fontSize: 32 }}>
              {profile?.profileType === 'worker' ? '👷'
                : profile?.profileType === 'supplier' ? '🏭'
                : profile?.profileType === 'business' ? '🏢'
                : '🏛️'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.profileRole} numberOfLines={1}>{displayRole || 'Construction Professional'}</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>
                CC Score: {profile?.ccScore || 500}
              </Text>
            </View>
          </View>
          <Text style={styles.profileArrow}>›</Text>
        </TouchableOpacity>

        {/* Account */}
        <Text style={styles.groupLabel}>Account</Text>
        <View style={styles.group}>
          <SettingRow icon="✏️" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <SettingRow icon="🔖" label="Saved Profiles" onPress={() => navigation.navigate('Bookmarks')} />
          <SettingRow icon="📊" label="Work History" onPress={() => navigation.navigate('WorkHistory')} />
          <SettingRow icon="💰" label="Commission Wallet" onPress={() => navigation.navigate('CommissionWallet')} />
        </View>

        {/* Notifications */}
        <Text style={styles.groupLabel}>
          Notifications {notifSaving ? '• Saving...' : ''}
        </Text>
        <View style={styles.group}>
          <ToggleRow icon="💼" label="Job Alerts" subtitle="New jobs matching your profile" value={notifs.jobAlerts} onToggle={() => handleToggleNotif('jobAlerts')} />
          <ToggleRow icon="💬" label="Messages" subtitle="New messages from your network" value={notifs.messages} onToggle={() => handleToggleNotif('messages')} />
          <ToggleRow icon="✅" label="Work Updates" subtitle="Work confirmations and reviews" value={notifs.workUpdates} onToggle={() => handleToggleNotif('workUpdates')} />
          <ToggleRow icon="📋" label="Tender Updates" subtitle="New tenders in your area" value={notifs.tenders} onToggle={() => handleToggleNotif('tenders')} />
          <ToggleRow icon="📢" label="Offers & Promotions" subtitle="Deals and platform updates" value={notifs.marketing} onToggle={() => handleToggleNotif('marketing')} />
        </View>

        {/* Privacy & Security */}
        <Text style={styles.groupLabel}>Privacy & Security</Text>
        <View style={styles.group}>
          <SettingRow
            icon="🗑️"
            label="Delete Account"
            subtitle="Permanently delete all your data"
            danger
            onPress={handleDeleteAccount}
          />
        </View>

        {/* Help & Support */}
        <Text style={styles.groupLabel}>Help & Support</Text>
        <View style={styles.group}>
          <SettingRow
            icon="💬"
            label="WhatsApp Support"
            subtitle="Chat with us on WhatsApp"
            onPress={handleWhatsAppSupport}
          />
          <SettingRow
            icon="⭐"
            label="Rate the App"
            subtitle="Love Construction Corner? Leave a review!"
            onPress={handleRateApp}
          />
          <SettingRow
            icon="📤"
            label="Share with Friends"
            subtitle="Invite your network to join"
            onPress={handleShare}
          />
          <SettingRow
            icon="📧"
            label="Email Support"
            subtitle="support@constructioncorner.in"
            onPress={() => Linking.openURL('mailto:support@constructioncorner.in')}
          />
        </View>

        {/* About */}
        <Text style={styles.groupLabel}>About</Text>
        <View style={styles.group}>
          <SettingRow icon="ℹ️" label="About Construction Corner" onPress={() => navigation.navigate('About')} />
          <SettingRow icon="📜" label="Terms of Service" onPress={() => navigation.navigate('Terms')} />
          <SettingRow icon="🛡️" label="Privacy Policy" onPress={() => navigation.navigate('Privacy')} />
          <SettingRow
            icon="🏷️"
            label="App Version"
            onPress={null}
            right={<Text style={styles.versionText}>v{APP_VERSION}</Text>}
          />
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutBtnText}>🚪  Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.madeInIndia}>Made with ❤️ in India 🇮🇳</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="Settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  header: {
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: '#1A1A1A' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  scroll: { flex: 1 },

  profileCard: {
    backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: '#EFEFEF',
    shadowColor: '#FF6B2B', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: ORANGE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 3 },
  profileRole: { fontSize: 12, color: '#666666', marginBottom: 6 },
  profileBadge: {
    backgroundColor: ORANGE_LIGHT, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  profileBadgeText: { fontSize: 11, fontWeight: '700', color: ORANGE },
  profileArrow: { fontSize: 22, color: '#CCC' },

  groupLabel: {
    fontSize: 11, fontWeight: '800', color: '#888', textTransform: 'uppercase',
    letterSpacing: 1.5, paddingHorizontal: 20, marginBottom: 6, marginTop: 12,
  },
  group: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#EFEFEF',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF', gap: 12,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: '#FFF0F0' },
  rowIconText: { fontSize: 18 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  rowLabelDanger: { color: '#E74C3C' },
  rowSub: { fontSize: 11, color: '#888', marginTop: 1 },
  rowArrow: { fontSize: 20, color: '#CCC' },
  versionText: { fontSize: 13, fontWeight: '700', color: '#666666' },

  signOutSection: { marginHorizontal: 16, marginTop: 24, alignItems: 'center', gap: 12 },
  signOutBtn: {
    width: '100%', backgroundColor: '#FFF0F0', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1, borderColor: '#FFCACA',
  },
  signOutBtnText: { fontSize: 15, fontWeight: '800', color: '#E74C3C' },
  madeInIndia: { fontSize: 13, color: '#888', fontWeight: '500' },
});
