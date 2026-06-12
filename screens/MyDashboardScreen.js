import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import BottomNav from '../components/BottomNav';

import { auth } from '../config/firebase';
const ORANGE = '#FF6B2B';
const NAVY = '#1A1A2E';
import { getProfile } from '../services/userService';
import { getPendingWork, getTotalVerifiedAmount } from '../services/workService';

const ACTIVITY = [
  { icon: '📋', color: '#E0F5FE', title: 'Job Posted', sub: 'Site Engineer – Bopal Project', time: '2h ago' },
  { icon: '👷', color: '#F0FDF4', title: 'Profile Viewed', sub: 'Naitik Rathod – Civil Engineer', time: '5h ago' },
  { icon: '💬', color: '#FEF9C3', title: 'New Message', sub: 'Mehta Builders replied to your enquiry', time: '1d ago' },
  { icon: '⭐', color: '#FDF4FF', title: 'Review Received', sub: 'Rajesh Shah gave you 5 stars', time: '2d ago' },
  { icon: '📦', color: '#FFF7ED', title: 'Order Delivered', sub: 'Cement – 50 bags from Gujarat BMC', time: '3d ago' },
];

const QUICK_ACTIONS = [
  { icon: '📋', label: 'Post Job', screen: 'PostJob', bg: '#FFF3E0', color: ORANGE },
  { icon: '👷', label: 'Find Worker', screen: 'CategoryList', params: { category: 'Workers', profileType: 'worker' }, bg: '#F0FFF4', color: '#2ECC71' },
  { icon: '🏗️', label: 'Materials', screen: 'MaterialMarketplace', bg: '#FFF7ED', color: '#FF8C00' },
  { icon: '📊', label: 'Tenders', screen: 'Tenders', bg: '#F5F5F0', color: NAVY },
  { icon: '💬', label: 'Messages', screen: 'ChatList', bg: '#F0FFF4', color: '#2ECC71' },
  { icon: '⚙️', label: 'Settings', screen: 'Settings', bg: '#F5F5F0', color: '#666666' },
];

const PROFILE_SCREEN_MAP = {
  professional: 'ProfessionalProfile',
  worker: 'WorkerProfile',
  supplier: 'SupplierProfile',
  business: 'BusinessProfile',
};

export default function MyDashboardScreen({ navigation }) {
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [userName, setUserName] = useState('');
  const [ccScore, setCcScore] = useState(500);
  const [verifiedAmt, setVerifiedAmt] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [profileType, setProfileType] = useState(null);
  const [myUid, setMyUid] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const calcProfileCompletion = (profile) => {
    const pt = (profile.profileType || '').toLowerCase();
    let fields = ['name', 'city', 'profileType', 'category', 'about'];
    if (pt === 'worker') fields = [...fields, 'workerSkill', 'experience', 'phone'];
    if (pt === 'professional') fields = [...fields, 'designation', 'experience', 'phone'];
    if (pt === 'business') fields = [...fields, 'companyName', 'phone', 'companyType'];
    if (pt === 'supplier') fields = [...fields, 'companyName', 'phone', 'supplierCategory'];
    const filled = fields.filter(f => profile[f] && String(profile[f]).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const loadDashboard = async () => {
    try {
      const cached = await AsyncStorage.getItem('userName');
      if (cached) setUserName(cached);
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) return;
      setMyUid(uid);
      const [profile, totalAmt, pending] = await Promise.all([
        getProfile(uid),
        getTotalVerifiedAmount(uid),
        getPendingWork(uid),
      ]);
      if (profile) {
        const name = profile.name || profile.companyName || '';
        if (name) { setUserName(name); AsyncStorage.setItem('userName', name); }
        setCcScore(profile.ccScore || 500);
        setProfileCompletion(calcProfileCompletion(profile));
        setProfileViews(profile.profileViews || 0);
        if (profile.profileType) setProfileType(profile.profileType.toLowerCase());
      }
      setVerifiedAmt(totalAmt);
      if (pending.length > 0) {
        const mapped = pending.map(p => ({
          id: p.id,
          workerName: p.customerName || 'Customer',
          workerEmoji: '🏠',
          role: p.workType || 'Construction Work',
          amount: `₹${Number(p.amount || 0).toLocaleString('en-IN')}`,
          markedBy: p.customerName || 'Customer',
          timeAgo: 'Recently',
          workId: p.id,
          workData: p,
        }));
        setPendingConfirmations(mapped);
      }
    } catch (_) {}
  };

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{(() => { const h = new Date().getHours(); return h < 12 ? 'Good Morning 🌅' : h < 17 ? 'Good Afternoon ☀️' : 'Good Evening 🌙'; })()}</Text>
            <Text style={styles.userName}>{userName || 'Welcome!'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>3</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => {
              const screen = PROFILE_SCREEN_MAP[profileType] || 'ProfessionalProfile';
              navigation.navigate(screen, { uid: myUid });
            }}>
              <Text style={{ fontSize: 22 }}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Completion */}
        <View style={styles.completionCard}>
          <View style={styles.completionRow}>
            <View>
              <Text style={styles.completionTitle}>Profile Strength</Text>
              <Text style={styles.completionSub}>Add more details to attract clients</Text>
            </View>
            <Text style={styles.completionPct}>{profileCompletion}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${profileCompletion}%` }]} />
          </View>
          <TouchableOpacity style={styles.completeBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.completeBtnText}>Complete Profile →</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: '✅', label: 'Verified ₹', value: verifiedAmt > 0 ? `₹${Math.round(verifiedAmt / 1000)}K` : '₹0', color: '#2ECC71', bg: '#F0FFF4' },
            { icon: '⭐', label: 'CC Score', value: String(ccScore), color: ORANGE, bg: '#FFF3E0' },
            { icon: '👁️', label: 'Profile Views', value: profileViews > 0 ? String(profileViews) : '0', color: NAVY, bg: '#F5F5F0' },
            { icon: '💬', label: 'Messages', value: '—', color: '#FF8C00', bg: '#FFF7ED' },
          ].map(stat => (
            <View key={stat.label} style={[styles.statBox, { backgroundColor: stat.bg }]}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* CC Score */}
        <View style={styles.ccScoreCard}>
          <View style={styles.ccScoreLeft}>
            <Text style={styles.ccScoreTitle}>CC Score</Text>
            <Text style={styles.ccScoreSub}>Construction Corner Trust Score</Text>
            <View style={styles.ccScoreBarBg}>
              <View style={[styles.ccScoreBarFill, { width: `${Math.min(ccScore / 10, 100)}%` }]} />
            </View>
            <Text style={styles.ccScoreHint}>Complete profile & get reviews to improve</Text>
          </View>
          <View style={styles.ccScoreRight}>
            <Text style={styles.ccScoreNumber}>{ccScore}</Text>
            <Text style={styles.ccScoreRating}>{ccScore >= 750 ? 'Excellent' : ccScore >= 600 ? 'Good' : 'New'}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionCard, { backgroundColor: action.bg }]}
              onPress={() => navigation.navigate(action.screen, action.params)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Work Confirmations */}
        {pendingConfirmations.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Pending Confirmations</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingConfirmations.length} pending</Text>
              </View>
            </View>
            {pendingConfirmations.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.confirmCard}
                onPress={() => navigation.navigate('ConfirmWork', { workId: item.workId, workData: item.workData })}
              >
                <View style={styles.confirmAvatar}>
                  <Text style={{ fontSize: 22 }}>{item.workerEmoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmName}>{item.workerName}</Text>
                  <Text style={styles.confirmMeta}>{item.role} · marked by {item.markedBy}</Text>
                  <Text style={styles.confirmAmount}>{item.amount} work complete</Text>
                </View>
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={styles.confirmBtn}
                    onPress={() => navigation.navigate('ConfirmWork', { workId: item.workId, workData: item.workData })}>
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  </TouchableOpacity>
                  <Text style={styles.confirmTime}>{item.timeAgo}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Active Jobs */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Active Job Posts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        {[
          { icon: '🏗️', title: 'Site Engineer Needed', location: 'Bopal, Ahmedabad', budget: '₹45K/mo', applicants: 7, status: 'Active' },
          { icon: '📐', title: 'AutoCAD Designer', location: 'Navrangpura, Ahmedabad', budget: '₹25K/mo', applicants: 3, status: 'Active' },
        ].map((job, i) => (
          <TouchableOpacity key={i} style={styles.jobCard} onPress={() => navigation.navigate('Jobs')}>
            <View style={styles.jobIcon}>
              <Text style={{ fontSize: 22 }}>{job.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobMeta}>{job.location} · {job.budget}</Text>
              <Text style={styles.jobApplicants}>👥 {job.applicants} applicants</Text>
            </View>
            <View style={styles.jobStatusBadge}>
              <View style={styles.jobStatusDot} />
              <Text style={styles.jobStatusText}>{job.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Recent Activity */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        {ACTIVITY.map((item, i) => (
          <View key={i} style={styles.activityRow}>
            <View style={[styles.activityIcon, { backgroundColor: item.color }]}>
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activitySub}>{item.sub}</Text>
            </View>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>🚪 Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="MyDashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16 },
  greeting: { fontSize: 13, color: '#666666', fontWeight: '600' },
  userName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  notifBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#E74C3C', alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  avatarBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  // Completion Card
  completionCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EFEFEF' },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  completionTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  completionSub: { fontSize: 12, color: '#666666', marginTop: 3 },
  completionPct: { fontSize: 28, fontWeight: '800', color: ORANGE },
  progressBg: { height: 8, backgroundColor: '#EFEFEF', borderRadius: 4, marginBottom: 12 },
  progressFill: { height: 8, backgroundColor: ORANGE, borderRadius: 4 },
  completeBtn: { backgroundColor: '#FFF3E0', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  completeBtnText: { fontSize: 13, fontWeight: '800', color: ORANGE },
  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statBox: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#666666', textAlign: 'center' },
  // CC Score Card (dark navy)
  ccScoreCard: { backgroundColor: NAVY, marginHorizontal: 16, borderRadius: 16, padding: 18, flexDirection: 'row', marginBottom: 20 },
  ccScoreLeft: { flex: 1 },
  ccScoreTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 3 },
  ccScoreSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  ccScoreBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 8 },
  ccScoreBarFill: { height: 6, backgroundColor: '#2ECC71', borderRadius: 3 },
  ccScoreHint: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  ccScoreRight: { alignItems: 'center', justifyContent: 'center', paddingLeft: 16 },
  ccScoreNumber: { fontSize: 36, fontWeight: '800', color: '#2ECC71' },
  ccScoreRating: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  // Section
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginHorizontal: 16, marginBottom: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, marginTop: 4 },
  seeAll: { fontSize: 12, fontWeight: '700', color: ORANGE },
  // Quick Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  actionCard: { width: '30%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, flex: 1 },
  actionIcon: { fontSize: 26 },
  actionLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  // Jobs
  jobCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#EFEFEF' },
  jobIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  jobTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 3 },
  jobMeta: { fontSize: 11, color: '#666666', marginBottom: 3 },
  jobApplicants: { fontSize: 11, color: '#555' },
  jobStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FFF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  jobStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ECC71' },
  jobStatusText: { fontSize: 10, fontWeight: '700', color: '#2ECC71' },
  // Pending Confirmations
  pendingBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FFE0C4' },
  pendingBadgeText: { fontSize: 11, fontWeight: '800', color: ORANGE },
  confirmCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#FFE0C4', borderStyle: 'dashed' },
  confirmAvatar: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  confirmName: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  confirmMeta: { fontSize: 11, color: '#666666', marginBottom: 3 },
  confirmAmount: { fontSize: 12, fontWeight: '800', color: '#2ECC71' },
  confirmActions: { alignItems: 'flex-end', gap: 6 },
  confirmBtn: { backgroundColor: ORANGE, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  confirmBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  confirmTime: { fontSize: 10, color: '#aaa', fontWeight: '600' },
  // Activity
  activityRow: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  activitySub: { fontSize: 11, color: '#666666' },
  activityTime: { fontSize: 10, color: '#aaa', fontWeight: '600' },
  // Sign Out
  signOutBtn: { marginHorizontal: 16, marginTop: 8, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: '#E74C3C', backgroundColor: '#fff', alignItems: 'center' },
  signOutBtnText: { fontSize: 15, fontWeight: '800', color: '#E74C3C' },
});
