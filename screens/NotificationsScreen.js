import {
  View, Text, TouchableOpacity, StyleSheet,
  SectionList, StatusBar, ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BLUE } from '../constants/colors';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

const LIGHT_BLUE = '#E0F5FE';

// ─── Sample Data ──────────────────────────────────────────────────────────────

const ALL_NOTIFICATIONS = [
  {
    id: 'nw1',
    type: 'work_confirm',
    icon: '🛡️',
    iconBg: '#DCFCE7',
    iconColor: '#15803D',
    title: 'Confirm work marked by customer',
    description: 'Suresh Patel marked ₹20,000 work complete with you. Confirm to add this to your verified profile.',
    time: '30 min ago',
    unread: true,
    filter: 'Work',
  },
  {
    id: 'nw2',
    type: 'work_verified',
    icon: '✅',
    iconBg: '#F0FDF4',
    iconColor: '#15803D',
    title: 'Work confirmed! ₹45,000 added to profile',
    description: 'Kavya Shah confirmed the work. ₹45,000 has been added to your verified work history. Tamper-proof record created.',
    time: '2 hr ago',
    unread: true,
    filter: 'Work',
  },
  {
    id: 'n1',
    type: 'message',
    icon: '🔔',
    iconBg: LIGHT_BLUE,
    iconColor: BLUE,
    title: 'New message from Rahul Mehta',
    description: 'Site engineer ke baare mein baat karni thi, kya aap kal available hain?',
    time: '2 min ago',
    unread: true,
    filter: 'Messages',
  },
  {
    id: 'n2',
    type: 'job_update',
    icon: '✅',
    iconBg: '#F0FFF4',
    iconColor: '#38A169',
    title: 'Application shortlisted!',
    description: 'Shapoorji Pallonji ne aapki Site Engineer application shortlist ki hai. Interview schedule hogi.',
    time: '15 min ago',
    unread: true,
    filter: 'Jobs',
  },
  {
    id: 'n3',
    type: 'profile_view',
    icon: '👁️',
    iconBg: '#FDF4FF',
    iconColor: '#9F7AEA',
    title: '5 people viewed your profile',
    description: 'Aapka profile Suresh Patel, Priya Agarwal aur 3 aur logon ne dekha aaj',
    time: '1 hr ago',
    unread: true,
    filter: 'All',
  },
  {
    id: 'n4',
    type: 'job_match',
    icon: '💼',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    title: 'New job matching your skills',
    description: 'L&T Construction: Structural Engineer chahiye — Ahmedabad, ₹65K/mo. Aapke skills se match karta hai!',
    time: '2 hr ago',
    unread: true,
    filter: 'Jobs',
  },
  {
    id: 'n5',
    type: 'payment',
    icon: '₹',
    iconBg: '#F0FFF4',
    iconColor: '#276749',
    title: 'Payment received ₹25,000',
    description: 'Ankit Shah ne AutoCAD Drawing project ke liye ₹25,000 bheje hain. Amount credited.',
    time: '3 hr ago',
    unread: false,
    filter: 'Payments',
  },
  {
    id: 'n6',
    type: 'review',
    icon: '⭐',
    iconBg: '#FFFBEB',
    iconColor: '#F59E0B',
    title: 'New review from Kavya Shah',
    description: '"Excellent work on our G+4 project. Very professional and delivered on time." — ⭐⭐⭐⭐⭐',
    time: 'Yesterday',
    unread: false,
    filter: 'All',
  },
  {
    id: 'n7',
    type: 'job_match',
    icon: '💼',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    title: 'Urgent: Electrician needed in Surat',
    description: 'Tata Projects: Electrical Supervisor — Surat, ₹55K/mo. Apply karo abhi, sirf 3 seats bachi hain!',
    time: 'Yesterday',
    unread: false,
    filter: 'Jobs',
  },
  {
    id: 'n8',
    type: 'message',
    icon: '🔔',
    iconBg: LIGHT_BLUE,
    iconColor: BLUE,
    title: 'Gujarat Cement Traders ka message',
    description: 'OPC 53 Grade ki aaj ki rate list ready hai — ₹340/bag. 100+ bags pe free delivery.',
    time: 'Yesterday',
    unread: false,
    filter: 'Messages',
  },
  {
    id: 'n9',
    type: 'payment',
    icon: '₹',
    iconBg: '#F0FFF4',
    iconColor: '#276749',
    title: 'Payment received ₹8,500',
    description: 'Ravi Patel ne 3D Visualization project ke liye ₹8,500 bheje hain. Invoice #INV-2024-089.',
    time: '2 days ago',
    unread: false,
    filter: 'Payments',
  },
  {
    id: 'n10',
    type: 'job_update',
    icon: '✅',
    iconBg: '#F0FFF4',
    iconColor: '#38A169',
    title: 'Profile verified successfully!',
    description: 'Badhai ho! Aapka Construction Corner profile verify ho gaya. Ab aap "Verified" badge ke saath dikhenge.',
    time: '3 days ago',
    unread: false,
    filter: 'All',
  },
];

const FILTERS = ['All', 'Work', 'Jobs', 'Messages', 'Payments'];

// ─── Group notifications by date ─────────────────────────────────────────────

function groupByDate(notifications) {
  const today = [];
  const yesterday = [];
  const older = [];

  notifications.forEach((n) => {
    if (n.time.includes('min') || n.time.includes('hr') || n.time === 'Today') {
      today.push(n);
    } else if (n.time === 'Yesterday') {
      yesterday.push(n);
    } else {
      older.push(n);
    }
  });

  const sections = [];
  if (today.length)     sections.push({ title: 'Today',     data: today });
  if (yesterday.length) sections.push({ title: 'Yesterday', data: yesterday });
  if (older.length)     sections.push({ title: 'Earlier',   data: older });
  return sections;
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotifCard({ item, onPress }) {
  const isWorkConfirm = item.type === 'work_confirm';
  return (
    <TouchableOpacity
      style={[styles.card, item.unread && styles.cardUnread, isWorkConfirm && styles.cardWorkConfirm]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
        <Text style={[styles.iconText, { color: item.iconColor }]}>{item.icon}</Text>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, item.unread && styles.cardTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        {isWorkConfirm && (
          <View style={styles.confirmCTA}>
            <Text style={styles.confirmCTAText}>✅  Confirm Now  →</Text>
          </View>
        )}
      </View>

      {/* Unread dot */}
      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

function firestoreNotifToCard(n) {
  const typeMap = {
    work_confirmation: { icon: '🛡️', iconBg: '#DCFCE7', iconColor: '#15803D', filter: 'Work', type: 'work_confirm' },
    work_confirmed:   { icon: '✅', iconBg: '#F0FDF4', iconColor: '#15803D', filter: 'Work', type: 'work_verified' },
    message:          { icon: '🔔', iconBg: '#E0F5FE', iconColor: BLUE, filter: 'Messages', type: 'message' },
  };
  const meta = typeMap[n.type] || { icon: '🔔', iconBg: '#E0F5FE', iconColor: BLUE, filter: 'All', type: 'general' };
  const ts = n.createdAt ? new Date(n.createdAt) : new Date();
  const diffMins = Math.round((Date.now() - ts.getTime()) / 60000);
  let time = diffMins < 60 ? `${diffMins}m ago`
    : diffMins < 1440 ? `${Math.round(diffMins / 60)}h ago`
    : diffMins < 2880 ? 'Yesterday'
    : `${Math.round(diffMins / 1440)}d ago`;
  return {
    id: n.id,
    type: meta.type,
    icon: meta.icon,
    iconBg: meta.iconBg,
    iconColor: meta.iconColor,
    title: n.message || 'New notification',
    description: n.message || '',
    time,
    unread: !n.read,
    filter: meta.filter,
    workId: n.workId || null,
  };
}

export default function NotificationsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifications, setNotifications] = useState(ALL_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('uid').then(uid => {
      if (!uid) { setLoading(false); return; }
      uidRef.current = uid;
      unsubRef.current = subscribeNotifications(uid, (items) => {
        setLoading(false);
        if (items.length > 0) {
          const mapped = items.map(firestoreNotifToCard);
          setNotifications([...mapped, ...ALL_NOTIFICATIONS]);
        } else {
          setNotifications(ALL_NOTIFICATIONS);
        }
      });
    });
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const filtered = activeFilter === 'All'
    ? notifications
    : notifications.filter((n) => n.filter === activeFilter);

  const sections = groupByDate(filtered);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (uidRef.current) await markAllNotificationsRead(uidRef.current);
  };

  const markRead = async (id, isFirestore) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    if (uidRef.current && isFirestore) {
      await markNotificationRead(uidRef.current, id);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllBtn}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterWrap}>
        {FILTERS.map((f) => {
          const count = f === 'All'
            ? notifications.filter((n) => n.unread).length
            : notifications.filter((n) => n.filter === f && n.unread).length;
          const active = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, active && styles.filterTabActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{f}</Text>
              {count > 0 && (
                <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : null}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotifCard item={item} onPress={() => {
            const isFirestore = !ALL_NOTIFICATIONS.find(n => n.id === item.id);
            markRead(item.id, isFirestore);
            if (item.type === 'work_confirm') navigation.navigate('ConfirmWork', { workId: item.workId });
            else if (item.type === 'work_verified') navigation.navigate('WorkHistory');
            else if (item.type === 'message') navigation.navigate('ChatList');
            else if (item.type === 'job_update' || item.type === 'job_match') navigation.navigate('Jobs');
            else if (item.type === 'payment' || item.type === 'review') navigation.navigate('MyDashboard');
          }} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications here</Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'All'
                ? "You're all caught up!"
                : `No ${activeFilter.toLowerCase()} notifications yet`}
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={sections.length === 0 && styles.emptyContainer}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0ED' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', paddingTop: 52, paddingBottom: 14,
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F2F0ED',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: '#1A202C', lineHeight: 30 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1A202C' },
  headerBadge: {
    backgroundColor: BLUE, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  headerBadgeText: { fontSize: 11, fontWeight: '800', color: 'white' },
  markAllBtn: { fontSize: 12, fontWeight: '700', color: BLUE, width: 80, textAlign: 'right' },

  // Filters
  filterWrap: {
    flexDirection: 'row', backgroundColor: 'white',
    paddingHorizontal: 14, paddingBottom: 12, paddingTop: 10,
    gap: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F2F0ED', borderWidth: 1.5, borderColor: 'transparent',
  },
  filterTabActive: { backgroundColor: LIGHT_BLUE, borderColor: BLUE },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#718096' },
  filterTabTextActive: { color: BLUE, fontWeight: '800' },
  filterBadge: {
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#CBD5E0',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterBadgeActive: { backgroundColor: BLUE },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: '#718096' },
  filterBadgeTextActive: { color: 'white' },

  // Section header
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionHeaderText: { fontSize: 12, fontWeight: '800', color: '#A0ADB8', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14,
  },
  cardUnread: { backgroundColor: '#FAFCFF' },
  iconWrap: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconText: { fontSize: 20, fontWeight: '700' },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#4A5568', lineHeight: 19 },
  cardTitleUnread: { fontWeight: '800', color: '#1A202C' },
  cardTime: { fontSize: 11, fontWeight: '600', color: '#A0ADB8', flexShrink: 0 },
  cardDesc: { fontSize: 13, color: '#718096', lineHeight: 19 },
  cardWorkConfirm: { borderLeftWidth: 3, borderLeftColor: '#4CAF50', backgroundColor: '#F0FDF4' },
  confirmCTA: {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: '#4CAF50', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  confirmCTAText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  unreadDot: {
    width: 9, height: 9, borderRadius: 5, backgroundColor: BLUE,
    marginTop: 5, flexShrink: 0,
  },

  separator: { height: 1, backgroundColor: '#F0F4F8', marginLeft: 74 },

  // Empty
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748' },
  emptySub: { fontSize: 13, color: '#A0ADB8' },
});
