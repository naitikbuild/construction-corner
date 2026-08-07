import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Switch, Alert, Linking,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, deleteDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getProfile, updateProfile } from '../services/userService';
import { getCurrentUid } from '../utils/session';

const APP_VERSION = '1.0.0';
const SUPPORT_EMAIL = 'support@constructioncorner.in';
const SUPPORT_WHATSAPP = 'https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20Construction%20Corner%20app';

// ─── Text input modal (Change phone / Change email / Report a problem) ───────
function InputModal({ visible, title, placeholder, value, onChangeText, onClose, onSave, multiline, keyboardType, secureTextEntry, saveLabel, busy }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <Text style={m.title}>{title}</Text>
          <TextInput
            style={[m.input, multiline && m.inputMultiline]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#8E8E8E"
            multiline={multiline}
            keyboardType={keyboardType || 'default'}
            secureTextEntry={secureTextEntry}
            autoFocus
          />
          <View style={m.btnRow}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose} disabled={busy}>
              <Text style={m.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.saveBtn} onPress={onSave} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={m.saveBtnText}>{saveLabel || 'Save'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const m = injectFonts({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  sheet: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  title: { fontSize: 15, fontWeight: '700', color: '#262626', marginBottom: 14 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#262626',
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#262626' },
  saveBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#262626', alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});

// ─── Reusable rows ─────────────────────────────────────────────────────────
function Row({ label, subtitle, onPress, right, danger }) {
  return (
    <TouchableOpacity
      style={s.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && s.rowLabelDanger]}>{label}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : (onPress ? <Text style={s.rowArrow}>›</Text> : null)}
    </TouchableOpacity>
  );
}

function ToggleRow({ label, subtitle, value, onToggle }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E5E5', true: '#EAF7EF' }}
        thumbColor={value ? '#22A559' : '#FFFFFF'}
      />
    </View>
  );
}

function Group({ title, rightNote, children }) {
  return (
    <View style={s.groupWrap}>
      <View style={s.groupHeadRow}>
        <Text style={s.groupLabel}>{title}</Text>
        {rightNote ? <Text style={s.groupNote}>{rightNote}</Text> : null}
      </View>
      <View style={s.group}>{children}</View>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [profile, setProfile] = useState(null);

  const [phoneModal, setPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [emailModal, setEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [reportModal, setReportModal] = useState(false);
  const [reportInput, setReportInput] = useState('');
  const [reauthModal, setReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthBusy, setReauthBusy] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const storedUid = await getCurrentUid();
      if (!storedUid) { setLoading(false); return; }
      setUid(storedUid);

      let data = null;
      try { data = await getProfile(storedUid); } catch (_) {}
      if (!data) {
        try {
          const local = await AsyncStorage.getItem('localProfile');
          if (local) data = JSON.parse(local);
        } catch (_) {}
      }
      if (data) setProfile(data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const isGuest = !!uid && uid.startsWith('guest_');
  const isPersonal = (profile?.profileType || '').toLowerCase() === 'personal';

  // ── Persist any profile patch — Firestore for real users, AsyncStorage for guests
  const persistSetting = async (patch) => {
    const merged = { ...(profile || {}), ...patch };
    setProfile(merged);
    if (!uid) return;
    try {
      if (isGuest) {
        await AsyncStorage.setItem('localProfile', JSON.stringify({ ...merged, uid }));
      } else {
        await updateProfile(uid, patch);
      }
    } catch (_) {
      Alert.alert('Could not save', 'Your change could not be saved. Please try again.');
    }
  };

  const notifs = {
    push: profile?.notificationPrefs?.push !== false,
    messages: profile?.notificationPrefs?.messages !== false,
    workRequests: profile?.notificationPrefs?.workRequests !== false,
  };
  const toggleNotif = (key) => {
    persistSetting({ notificationPrefs: { ...notifs, [key]: !notifs[key] } });
  };

  const available = profile?.available !== false;
  const blockedUsers = profile?.blockedUsers || [];

  const unblockUser = (blockedUid) => {
    persistSetting({ blockedUsers: blockedUsers.filter(u => u.uid !== blockedUid) });
  };

  // ── Account: phone / email ────────────────────────────────────────────────
  const openPhoneModal = () => { setPhoneInput(profile?.phone || ''); setPhoneModal(true); };
  const savePhone = async () => {
    const v = phoneInput.trim();
    if (!v) { setPhoneModal(false); return; }
    await persistSetting({ phone: v });
    await AsyncStorage.setItem('phone', v);
    setPhoneModal(false);
  };

  const openEmailModal = () => { setEmailInput(profile?.email || ''); setEmailModal(true); };
  const saveEmail = async () => {
    const v = emailInput.trim();
    if (!v) { setEmailModal(false); return; }
    await persistSetting({ email: v });
    setEmailModal(false);
  };

  // ── Support: report a problem ─────────────────────────────────────────────
  const submitReport = async () => {
    const message = reportInput.trim();
    if (!message) { setReportModal(false); return; }
    try {
      if (uid && !isGuest) {
        await addDoc(collection(db, 'reports'), { uid, message, createdAt: serverTimestamp() });
      }
    } catch (_) {}
    setReportInput('');
    setReportModal(false);
    Alert.alert('Thanks for letting us know', 'Our team will look into this.');
  };

  // ── Navigation shortcuts ──────────────────────────────────────────────────
  const goEditProfile = () => navigation.navigate('EditProfile', { profileType: (profile?.profileType || '').toLowerCase() || undefined });
  const goWorkHistory = () => navigation.navigate('WorkHistory', { uid });
  const goMyWorkRecords = () => navigation.navigate('MyWorkRecords');
  const goMyReviews = () => navigation.navigate('ReviewsList', { uid });
  const goMyBookings = () => navigation.navigate('PersonalProfile');
  const goClientReviews = () => navigation.navigate('ClientReviews');

  // ── Sign out ───────────────────────────────────────────────────────────────
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
            try { if (auth.currentUser) await signOut(auth); } catch (_) {}
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          },
        },
      ]
    );
  };

  // ── Delete account — confirmed twice ─────────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile, work history and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: confirmDeleteStep2 },
      ]
    );
  };

  const confirmDeleteStep2 = () => {
    Alert.alert(
      'Are you absolutely sure?',
      'This is your last chance to cancel — your account will be deleted immediately and cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Permanently', style: 'destructive', onPress: performDelete },
      ]
    );
  };

  // deleteUser already drops the Firebase session, but sign out explicitly
  // too so there's no ambiguity, then wipe every cached key (uid,
  // localProfile, userName, hasSeenOnboarding, ...) — not just 'uid' — so
  // nothing about this account lingers on the device.
  // navigation.reset (not navigate) so the deleted account's screens are
  // fully gone from the stack — back button can't return into the app.
  // 'Login' is the app's actual first screen for this exact state: with no
  // live Firebase user and 'hasSeenOnboarding' just cleared above, it's
  // exactly what App.js's own initial-route logic would pick on a fresh
  // launch (see App.js's onAuthStateChanged effect) — it shows the welcome
  // splash → onboarding flow, not the signed-in Home screen.
  const finishLocalCleanup = async () => {
    await signOut(auth).catch(() => {});
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const performDelete = async () => {
    const user = auth.currentUser;
    try {
      // Firestore data goes first and is best-effort (own try/catch) — a
      // user doc that's already missing shouldn't block account deletion.
      if (uid && !isGuest) {
        try { await deleteDoc(doc(db, 'users', uid)); } catch (_) {}
      }
      if (user) {
        await deleteUser(user);
      }
      await finishLocalCleanup();
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        // Firestore data is already gone at this point — the Auth account
        // must still be removed too, otherwise the email/phone stays
        // "already registered" forever. Password accounts can recover in
        // place via reauthenticateWithCredential; anything else (phone
        // sign-in) falls back to asking for a fresh login.
        const hasPassword = user?.providerData?.some(p => p.providerId === 'password');
        if (hasPassword) {
          setReauthPassword('');
          setReauthModal(true);
        } else {
          Alert.alert(
            'Re-login Required',
            'Your data has been deleted. For security, please sign out, sign in again, then delete your account once more to finish removing it.'
          );
          await finishLocalCleanup();
        }
        return;
      }
      Alert.alert('Delete Failed', 'Something went wrong while deleting your account. Please try again.');
    }
  };

  // ── Delete account: reauth retry (password accounts only) ────────────────
  const submitReauthDelete = async () => {
    const password = reauthPassword.trim();
    if (!password) return;
    const user = auth.currentUser;
    if (!user?.email) { setReauthModal(false); return; }
    setReauthBusy(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
      setReauthBusy(false);
      setReauthModal(false);
      setReauthPassword('');
      await finishLocalCleanup();
    } catch (err) {
      setReauthBusy(false);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        Alert.alert('Incorrect Password', 'Please enter your current password to confirm account deletion.');
      } else {
        Alert.alert('Could Not Verify', 'Something went wrong confirming your identity. Please try again.');
      }
    }
  };

  const cancelReauthDelete = async () => {
    setReauthModal(false);
    setReauthPassword('');
    // The Firestore doc is already deleted by this point (performDelete ran
    // it before hitting requires-recent-login) — leaving the user signed in
    // with no profile would be a worse, silently-broken state than telling
    // them plainly and finishing the local sign-out.
    Alert.alert(
      'Account Data Deleted',
      'Your profile and data have been removed. To finish removing your account, sign in again and delete it once more.'
    );
    await finishLocalCleanup();
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#262626" />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={s.nav}>
        <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
          <Text style={s.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Settings</Text>
        <View style={s.navBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {isPersonal ? (
          <>
            {/* ACCOUNT — client version: no provider-only visibility toggle */}
            <Group title="ACCOUNT">
              <Row label="Edit Profile" onPress={goEditProfile} />
              <Row label="Change Phone Number" subtitle={profile?.phone ? `+91 ${profile.phone}` : 'Not added'} onPress={openPhoneModal} />
              <Row label="Change Email" subtitle={profile?.email || 'Not added'} onPress={openEmailModal} />
            </Group>

            {/* MY BOOKINGS */}
            <Group title="MY BOOKINGS">
              <Row label="My Bookings" subtitle="View the services you've hired" onPress={goMyBookings} />
              <Row label="Reviews as a Client" subtitle="What providers you've hired said about you" onPress={goClientReviews} />
            </Group>

            {/* NOTIFICATIONS */}
            <Group title="NOTIFICATIONS">
              <ToggleRow label="Push Notifications" value={notifs.push} onToggle={() => toggleNotif('push')} />
              <ToggleRow label="Alerts" subtitle="Messages and booking updates" value={notifs.messages} onToggle={() => toggleNotif('messages')} />
            </Group>

            {/* PRIVACY — client version: just blocked users, no "who can call me" */}
            <Group title="PRIVACY">
              <View style={s.blockedWrap}>
                <Text style={s.rowLabel}>Blocked Users</Text>
                {blockedUsers.length === 0 ? (
                  <Text style={s.rowSub}>No blocked users</Text>
                ) : (
                  blockedUsers.map((u, i) => (
                    <View key={u.uid || i} style={s.blockedRow}>
                      <Text style={s.blockedName} numberOfLines={1}>{u.name || 'User'}</Text>
                      <TouchableOpacity onPress={() => unblockUser(u.uid)}>
                        <Text style={s.unblockText}>Unblock</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </Group>
          </>
        ) : (
          <>
            {/* ACCOUNT */}
            <Group title="ACCOUNT">
              <Row label="Edit Profile" onPress={goEditProfile} />
              <Row label="Change Phone Number" subtitle={profile?.phone ? `+91 ${profile.phone}` : 'Not added'} onPress={openPhoneModal} />
              <Row label="Change Email" subtitle={profile?.email || 'Not added'} onPress={openEmailModal} />
            </Group>

            {/* WORK */}
            <Group title="WORK">
              <ToggleRow
                label="Availability"
                subtitle={available ? 'Available for work' : 'Marked as Busy'}
                value={available}
                onToggle={() => persistSetting({ available: !available })}
              />
              <Row label="Work History" subtitle="View your verified work history" onPress={goWorkHistory} />
              <Row label="My Work Records" subtitle="Drafts, awaiting confirmation & completed" onPress={goMyWorkRecords} />
              <Row label="My Reviews" onPress={goMyReviews} />
              <Row label="Reviews as a Client" subtitle="What providers you've hired said about you" onPress={goClientReviews} />
            </Group>

            {/* NOTIFICATIONS */}
            <Group title="NOTIFICATIONS">
              <ToggleRow label="Push Notifications" value={notifs.push} onToggle={() => toggleNotif('push')} />
              <ToggleRow label="New Message Alerts" value={notifs.messages} onToggle={() => toggleNotif('messages')} />
              <ToggleRow label="Work Request Alerts" value={notifs.workRequests} onToggle={() => toggleNotif('workRequests')} />
            </Group>

            {/* PRIVACY */}
            <Group title="PRIVACY">
              <View style={s.blockedWrap}>
                <Text style={s.rowLabel}>Blocked Users</Text>
                {blockedUsers.length === 0 ? (
                  <Text style={s.rowSub}>No blocked users</Text>
                ) : (
                  blockedUsers.map((u, i) => (
                    <View key={u.uid || i} style={s.blockedRow}>
                      <Text style={s.blockedName} numberOfLines={1}>{u.name || 'User'}</Text>
                      <TouchableOpacity onPress={() => unblockUser(u.uid)}>
                        <Text style={s.unblockText}>Unblock</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </Group>
          </>
        )}

        {/* SUPPORT */}
        <Group title="SUPPORT">
          <Row
            label="Help & FAQ"
            onPress={() => Linking.openURL(SUPPORT_WHATSAPP).catch(() =>
              Alert.alert('Help & FAQ', `For help, reach us at ${SUPPORT_EMAIL}`))}
          />
          <Row
            label="Contact Support"
            subtitle={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
          <Row label="Report a Problem" onPress={() => { setReportInput(''); setReportModal(true); }} />
        </Group>

        {/* LEGAL */}
        <Group title="LEGAL">
          <Row label="Privacy Policy" onPress={() => navigation.navigate('Privacy')} />
          <Row label="Terms of Service" onPress={() => navigation.navigate('Terms')} />
        </Group>

        {/* ABOUT */}
        <Group title="ABOUT">
          <Row label="App Version" right={<Text style={s.versionText}>v{APP_VERSION}</Text>} />
        </Group>

        {/* ACCOUNT ACTIONS */}
        <Group title="ACCOUNT ACTIONS">
          <Row label="Sign Out" onPress={handleSignOut} />
          <Row label="Delete Account" subtitle="Permanently delete all your data" danger onPress={handleDeleteAccount} />
        </Group>

      </ScrollView>

      <InputModal
        visible={phoneModal}
        title="Change Phone Number"
        placeholder="10-digit mobile number"
        value={phoneInput}
        onChangeText={setPhoneInput}
        onClose={() => setPhoneModal(false)}
        onSave={savePhone}
        keyboardType="phone-pad"
      />
      <InputModal
        visible={emailModal}
        title="Change Email"
        placeholder="you@example.com"
        value={emailInput}
        onChangeText={setEmailInput}
        onClose={() => setEmailModal(false)}
        onSave={saveEmail}
        keyboardType="email-address"
      />
      <InputModal
        visible={reportModal}
        title="Report a Problem"
        placeholder="Describe what went wrong..."
        value={reportInput}
        onChangeText={setReportInput}
        onClose={() => setReportModal(false)}
        onSave={submitReport}
        multiline
      />
      <InputModal
        visible={reauthModal}
        title="Confirm Your Password"
        placeholder="Current password"
        value={reauthPassword}
        onChangeText={setReauthPassword}
        onClose={cancelReauthDelete}
        onSave={submitReauthDelete}
        secureTextEntry
        saveLabel="Delete Account"
        busy={reauthBusy}
      />
    </View>
  );
}

const GREEN       = '#22A559';
const GREEN_LIGHT  = '#EAF7EF';
const DARK          = '#262626';
const BG            = '#FAF9F5';
const FILL          = '#F2F2F2';
const BORDER        = '#E5E5E5';
const MID            = '#737373';
const LIGHT          = '#8E8E8E';
const ALERT          = '#B00020';

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: FILL, alignItems: 'center', justifyContent: 'center',
  },
  navBack: { fontSize: 20, fontWeight: '700', color: DARK },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: DARK },

  groupWrap: { marginHorizontal: 14, marginTop: 20 },
  groupHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 2 },
  groupLabel: { fontSize: 11, fontWeight: '600', color: LIGHT, letterSpacing: 1 },
  groupNote: { fontSize: 11, color: LIGHT },
  group: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    gap: 10,
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: DARK },
  rowLabelDanger: { color: ALERT },
  rowSub: { fontSize: 11, color: LIGHT, marginTop: 2 },
  rowArrow: { fontSize: 18, color: LIGHT },
  versionText: { fontSize: 13, fontWeight: '600', color: MID },

  blockedWrap: { paddingHorizontal: 14, paddingVertical: 14 },
  blockedRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: BORDER, marginTop: 8,
  },
  blockedName: { fontSize: 13, fontWeight: '500', color: DARK, flex: 1 },
  unblockText: { fontSize: 12, fontWeight: '700', color: GREEN },
});
