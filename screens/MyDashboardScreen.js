import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
} from 'react-native';
import BottomNav from '../components/BottomNav';

import { BLUE, BLUE_LIGHT } from '../constants/colors';

const PENDING_CONFIRMATIONS = [
  {
    id: 'pc1',
    workerName: 'Ramesh Vishwakarma',
    workerEmoji: '👷',
    role: 'Mason',
    amount: '₹20,000',
    markedBy: 'Suresh Patel',
    timeAgo: '2h ago',
  },
  {
    id: 'pc2',
    workerName: 'Priya Agarwal',
    workerEmoji: '🛋️',
    role: 'Interior Designer',
    amount: '₹45,000',
    markedBy: 'Kavya Shah',
    timeAgo: '1d ago',
  },
];

const ACTIVITY = [
  { icon: '📋', color: '#E0F5FE', title: 'Job Posted', sub: 'Site Engineer – Bopal Project', time: '2h ago' },
  { icon: '👷', color: '#F0FDF4', title: 'Profile Viewed', sub: 'Naitik Rathod – Civil Engineer', time: '5h ago' },
  { icon: '💬', color: '#FEF9C3', title: 'New Message', sub: 'Mehta Builders replied to your enquiry', time: '1d ago' },
  { icon: '⭐', color: '#FDF4FF', title: 'Review Received', sub: 'Rajesh Shah gave you 5 stars', time: '2d ago' },
  { icon: '📦', color: '#FFF7ED', title: 'Order Delivered', sub: 'Cement – 50 bags from Gujarat BMC', time: '3d ago' },
];

const QUICK_ACTIONS = [
  { icon: '📋', label: 'Post Job', screen: 'PostJob', bg: BLUE_LIGHT, color: BLUE },
  { icon: '👷', label: 'Find Worker', screen: 'WorkerList', bg: '#F0FDF4', color: '#16A34A' },
  { icon: '🏗️', label: 'Materials', screen: 'MaterialMarketplace', bg: '#FFF7ED', color: '#EA580C' },
  { icon: '📊', label: 'Tenders', screen: 'Tenders', bg: '#FDF4FF', color: '#7E22CE' },
  { icon: '💬', label: 'Messages', screen: 'ChatList', bg: '#DCFCE7', color: '#15803D' },
  { icon: '⚙️', label: 'Settings', screen: 'Settings', bg: '#F5F5F5', color: '#555' },
];

export default function MyDashboardScreen({ navigation }) {
  const [profileCompletion] = useState(72);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good Morning 👋</Text>
            <Text style={styles.userName}>Naitik Rathod</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>3</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
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
            { icon: '📋', label: 'Jobs Posted', value: '3', color: BLUE, bg: BLUE_LIGHT },
            { icon: '❤️', label: 'Saved', value: '12', color: '#E11D48', bg: '#FFF1F2' },
            { icon: '👁️', label: 'Profile Views', value: '48', color: '#16A34A', bg: '#F0FDF4' },
            { icon: '💬', label: 'Messages', value: '6', color: '#EA580C', bg: '#FFF7ED' },
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
              <View style={[styles.ccScoreBarFill, { width: '76%' }]} />
            </View>
            <Text style={styles.ccScoreHint}>Complete profile & get reviews to improve</Text>
          </View>
          <View style={styles.ccScoreRight}>
            <Text style={styles.ccScoreNumber}>762</Text>
            <Text style={styles.ccScoreRating}>Good</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionCard, { backgroundColor: action.bg }]}
              onPress={() => navigation.navigate(action.screen)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Work Confirmations */}
        {PENDING_CONFIRMATIONS.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Pending Confirmations</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{PENDING_CONFIRMATIONS.length} pending</Text>
              </View>
            </View>
            {PENDING_CONFIRMATIONS.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.confirmCard}
                onPress={() => navigation.navigate('ConfirmWork', { confirmation: item })}
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
                    onPress={() => navigation.navigate('ConfirmWork', { confirmation: item })}>
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

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="MyDashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0ED' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16 },
  greeting: { fontSize: 13, color: '#6B6560', fontWeight: '600' },
  userName: { fontSize: 20, fontWeight: '900', color: '#111', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  notifBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#E11D48', alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  avatarBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: BLUE_LIGHT, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  // Completion Card
  completionCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E0F5FE' },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  completionTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  completionSub: { fontSize: 12, color: '#6B6560', marginTop: 3 },
  completionPct: { fontSize: 28, fontWeight: '900', color: BLUE },
  progressBg: { height: 8, backgroundColor: '#EEE', borderRadius: 4, marginBottom: 12 },
  progressFill: { height: 8, backgroundColor: BLUE, borderRadius: 4 },
  completeBtn: { backgroundColor: BLUE_LIGHT, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  completeBtnText: { fontSize: 13, fontWeight: '800', color: BLUE },
  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statBox: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#6B6560', textAlign: 'center' },
  // CC Score
  ccScoreCard: { backgroundColor: '#0EA5E9', marginHorizontal: 16, borderRadius: 16, padding: 18, flexDirection: 'row', marginBottom: 20 },
  ccScoreLeft: { flex: 1 },
  ccScoreTitle: { fontSize: 15, fontWeight: '900', color: '#fff', marginBottom: 3 },
  ccScoreSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  ccScoreBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 8 },
  ccScoreBarFill: { height: 6, backgroundColor: '#4ADE80', borderRadius: 3 },
  ccScoreHint: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  ccScoreRight: { alignItems: 'center', justifyContent: 'center', paddingLeft: 16 },
  ccScoreNumber: { fontSize: 36, fontWeight: '900', color: '#4ADE80' },
  ccScoreRating: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  // Section
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginHorizontal: 16, marginBottom: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, marginTop: 4 },
  seeAll: { fontSize: 12, fontWeight: '700', color: BLUE },
  // Quick Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  actionCard: { width: '30%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, flex: 1 },
  actionIcon: { fontSize: 26 },
  actionLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  // Jobs
  jobCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#EAEAEA' },
  jobIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: BLUE_LIGHT, alignItems: 'center', justifyContent: 'center' },
  jobTitle: { fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 3 },
  jobMeta: { fontSize: 11, color: '#6B6560', marginBottom: 3 },
  jobApplicants: { fontSize: 11, color: '#555' },
  jobStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  jobStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  jobStatusText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  // Pending Confirmations
  pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' },
  pendingBadgeText: { fontSize: 11, fontWeight: '800', color: '#B45309' },
  confirmCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#FDE68A', borderStyle: 'dashed' },
  confirmAvatar: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#FEF9C3', alignItems: 'center', justifyContent: 'center' },
  confirmName: { fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 2 },
  confirmMeta: { fontSize: 11, color: '#6B6560', marginBottom: 3 },
  confirmAmount: { fontSize: 12, fontWeight: '800', color: '#15803D' },
  confirmActions: { alignItems: 'flex-end', gap: 6 },
  confirmBtn: { backgroundColor: '#15803D', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  confirmBtnText: { fontSize: 12, fontWeight: '900', color: '#fff' },
  confirmTime: { fontSize: 10, color: '#aaa', fontWeight: '600' },
  // Activity
  activityRow: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 2 },
  activitySub: { fontSize: 11, color: '#6B6560' },
  activityTime: { fontSize: 10, color: '#aaa', fontWeight: '600' },
});
