import {
  View, Text, TouchableOpacity, StyleSheet,
  SectionList, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BLUE } from '../constants/colors';
import { auth } from '../config/firebase';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getGuestNotifications,
  markGuestNotificationRead,
  markAllGuestNotificationsRead,
  deleteGuestNotification,
  clearGuestNotifications,
} from '../services/notificationService';

const LIGHT_BLUE = '#E0F5FE';

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

function NotifCard({ item, onPress, onDelete }) {
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

      {/* Delete */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

// Works for both a real Firestore notification doc and a guest AsyncStorage
// item — both share the same { id, type, message, read, createdAt } shape.
function notifToCard(n) {
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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef(null);
  const isGuestRef = useRef(false);
  const unsubRef = useRef(null);

  useEffect(() => {
    init();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const init = async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) { setLoading(false); return; }
      uidRef.current = uid;

      if (auth.currentUser) {
        isGuestRef.current = false;
        unsubRef.current = subscribeNotifications(uid, (items) => {
          setLoading(false);
          setNotifications(items.map(notifToCard));
        });
      } else {
        isGuestRef.current = true;
        const items = await getGuestNotifications();
        setLoading(false);
        setNotifications(items.map(notifToCard));
      }
    } catch (_) {
      setLoading(false);
    }
  };

  const filtered = activeFilter === 'All'
    ? notifications
    : notifications.filter((n) => n.filter === activeFilter);

  const sections = groupByDate(filtered);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (!uidRef.current) return;
    if (isGuestRef.current) await markAllGuestNotificationsRead();
    else await markAllNotificationsRead(uidRef.current);
  };

  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    if (!uidRef.current) return;
    if (isGuestRef.current) await markGuestNotificationRead(id);
    else await markNotificationRead(uidRef.current, id);
  };

  const deleteOne = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!uidRef.current) return;
    if (isGuestRef.current) await deleteGuestNotification(id);
    else await deleteNotification(uidRef.current, id);
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear all notifications?',
      'This will permanently remove all your notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setNotifications([]);
            if (!uidRef.current) return;
            if (isGuestRef.current) await clearGuestNotifications();
            else await deleteAllNotifications(uidRef.current);
          },
        },
      ]
    );
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
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markAllBtn}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllBtn}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
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
          <NotifCard
            item={item}
            onPress={() => {
              markRead(item.id);
              if (item.type === 'work_confirm') navigation.navigate('ConfirmWork', { workId: item.workId });
              else if (item.type === 'work_verified') navigation.navigate('WorkHistory');
              else if (item.type === 'work_locked') navigation.navigate('WorkRecordReview', { recordId: item.recordId });
              else if (item.type === 'work_confirmed') navigation.navigate('RateClient', { recordId: item.recordId });
              else if (item.type === 'work_disputed') navigation.navigate('CreateWorkRecord', { recordId: item.recordId });
              else if (item.type === 'message') navigation.navigate('ChatList');
              else if (item.type === 'job_update' || item.type === 'job_match') navigation.navigate('Home');
              else if (item.type === 'payment' || item.type === 'review') navigation.navigate('MyDashboard');
            }}
            onDelete={() => deleteOne(item.id)}
          />
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
            {notifications.length === 0 ? (
              <>
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySub}>You'll see updates about your work, messages and more here</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>No notifications here</Text>
                <Text style={styles.emptySub}>{`No ${activeFilter.toLowerCase()} notifications yet`}</Text>
              </>
            )}
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

const styles = injectFonts({
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
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 10 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1A202C' },
  headerBadge: {
    backgroundColor: BLUE, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  headerBadgeText: { fontSize: 11, fontWeight: '800', color: 'white' },
  headerActions: { alignItems: 'flex-end', gap: 4 },
  markAllBtn: { fontSize: 12, fontWeight: '700', color: BLUE },
  clearAllBtn: { fontSize: 12, fontWeight: '700', color: '#E53E3E' },

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
  deleteBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#F2F0ED',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 4,
  },
  deleteBtnText: { fontSize: 11, fontWeight: '800', color: '#A0ADB8' },

  separator: { height: 1, backgroundColor: '#F0F4F8', marginLeft: 74 },

  // Empty
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748' },
  emptySub: { fontSize: 13, color: '#A0ADB8', textAlign: 'center', paddingHorizontal: 40 },
});
