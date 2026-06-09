import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Switch, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import BottomNav from '../components/BottomNav';

import { auth } from '../config/firebase';
import { BLUE, BLUE_LIGHT } from '../constants/colors';

export default function SettingsScreen({ navigation }) {
  const [notifs, setNotifs] = useState({
    jobAlerts: true,
    messages: true,
    tenders: false,
    marketing: false,
    sms: true,
    email: false,
  });

  function toggle(key) {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSignOut() {
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
  }

  const SettingRow = ({ icon, label, onPress, right, danger }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {right || <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );

  const ToggleRow = ({ icon, label, value, onToggle }) => (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: BLUE }}
        thumbColor="#fff"
        style={{ marginLeft: 'auto' }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.profileAvatar}>
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>Naitik Rathod</Text>
            <Text style={styles.profileRole}>Civil Engineer · Ahmedabad</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>⭐ 4.9 · GST Verified</Text>
            </View>
          </View>
          <Text style={styles.profileArrow}>›</Text>
        </TouchableOpacity>

        {/* Account */}
        <Text style={styles.groupLabel}>Account</Text>
        <View style={styles.group}>
          <SettingRow icon="👤" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <SettingRow icon="🔐" label="Change Mobile Number" onPress={() => {}} />
          <SettingRow icon="🏢" label="Business Details" onPress={() => navigation.navigate('BusinessProfile')} />
          <SettingRow icon="🔖" label="Saved & Bookmarks" onPress={() => navigation.navigate('Bookmarks')} />
          <SettingRow icon="📄" label="My Documents & KYC" onPress={() => {}} />
        </View>

        {/* Notifications */}
        <Text style={styles.groupLabel}>Notifications</Text>
        <View style={styles.group}>
          <ToggleRow icon="💼" label="Job Alerts" value={notifs.jobAlerts} onToggle={() => toggle('jobAlerts')} />
          <ToggleRow icon="💬" label="Messages" value={notifs.messages} onToggle={() => toggle('messages')} />
          <ToggleRow icon="📋" label="Tender Updates" value={notifs.tenders} onToggle={() => toggle('tenders')} />
          <ToggleRow icon="📢" label="Marketing & Offers" value={notifs.marketing} onToggle={() => toggle('marketing')} />
          <ToggleRow icon="📱" label="SMS Alerts" value={notifs.sms} onToggle={() => toggle('sms')} />
          <ToggleRow icon="📧" label="Email Notifications" value={notifs.email} onToggle={() => toggle('email')} />
        </View>

        {/* Privacy */}
        <Text style={styles.groupLabel}>Privacy & Security</Text>
        <View style={styles.group}>
          <SettingRow icon="🔒" label="Privacy Settings" onPress={() => {}} />
          <SettingRow icon="👁️" label="Profile Visibility" onPress={() => {}} />
          <SettingRow icon="🗑️" label="Delete Account" onPress={() => Alert.alert('Delete Account', 'This action is irreversible. Please contact support to delete your account.')} />
        </View>

        {/* Help */}
        <Text style={styles.groupLabel}>Help & Support</Text>
        <View style={styles.group}>
          <SettingRow icon="🤝" label="Help Center" onPress={() => {}} />
          <SettingRow icon="💬" label="Chat with Support" onPress={() => navigation.navigate('ChatList')} />
          <SettingRow icon="⭐" label="Rate the App" onPress={() => {}} />
          <SettingRow icon="📤" label="Share Construction Corner" onPress={() => {}} />
          <SettingRow icon="🐛" label="Report a Problem" onPress={() => {}} />
        </View>

        {/* About */}
        <Text style={styles.groupLabel}>About</Text>
        <View style={styles.group}>
          <SettingRow icon="ℹ️" label="About Construction Corner" onPress={() => {}} />
          <SettingRow
            icon="📜"
            label="Terms of Service"
            onPress={() => {}}
          />
          <SettingRow icon="🛡️" label="Privacy Policy" onPress={() => {}} />
          <SettingRow
            icon="🏷️"
            label="App Version"
            onPress={null}
            right={<Text style={styles.versionText}>v1.0.0</Text>}
          />
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutBtnText}>🚪 Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.madeInIndia}>Made with ❤️ in India 🇮🇳</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="MyDashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0ED' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  scroll: { flex: 1 },
  // Profile card
  profileCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: '#E0F5FE' },
  profileAvatar: { width: 60, height: 60, borderRadius: 18, backgroundColor: BLUE_LIGHT, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 3 },
  profileRole: { fontSize: 12, color: '#6B6560', marginBottom: 6 },
  profileBadge: { backgroundColor: BLUE_LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  profileBadgeText: { fontSize: 11, fontWeight: '700', color: BLUE },
  profileArrow: { fontSize: 22, color: '#CCC' },
  // Group
  groupLabel: { fontSize: 11, fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginBottom: 6, marginTop: 8 },
  group: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 4, borderWidth: 1, borderColor: '#EAEAEA' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  rowIconDanger: { backgroundColor: '#FFF1F2' },
  rowIconText: { fontSize: 18 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#111', flex: 1 },
  rowLabelDanger: { color: '#E11D48' },
  rowArrow: { fontSize: 20, color: '#CCC' },
  versionText: { fontSize: 13, fontWeight: '700', color: '#6B6560' },
  // Sign Out
  signOutSection: { marginHorizontal: 16, marginTop: 20, alignItems: 'center' },
  signOutBtn: { width: '100%', paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: '#EF4444', backgroundColor: '#fff', alignItems: 'center', marginBottom: 16 },
  signOutBtnText: { fontSize: 15, fontWeight: '800', color: '#EF4444' },
  madeInIndia: { fontSize: 12, color: '#CCC', fontWeight: '600' },
});
