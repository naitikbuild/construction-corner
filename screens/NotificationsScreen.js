import {
  View, Text, TouchableOpacity, StyleSheet,
  SectionList, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import { useState, useEffect, useRef } from 'react';

import { BLUE } from '../constants/colors';
import { auth } from '../config/firebase';
import { getCurrentUid } from '../utils/session';
import { openMyProfile } from '../utils/profileNav';
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
  return (
    <TouchableOpacity
      style={[styles.card, item.unread && styles.cardUnread]}
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
//
// card.type is always the SAME string as the raw Firestore `type` field for
// every entry below — the tap-routing switch in renderItem matches on this
// directly, so a raw type and its typeMap key must never diverge (a past
// version remapped work_confirmed -> 'work_verified', which made the
// switch's own 'work_confirmed' branch permanently unreachable).
function notifToCard(n) {
  const typeMap = {
    // Client: provider sent a record, needs to approve the START of the
    // engagement (first of the two-approval lifecycle — see
    // workRecordService.js).
    work_start_request: { icon: '📝', iconBg: '#FFF3E0', iconColor: '#B26A00', filter: 'Work' },
    // Provider: client approved the start — record is now ongoing.
    work_started:   { icon: '🟢', iconBg: '#F0FDF4', iconColor: '#15803D', filter: 'Work' },
    // Provider: client declined the start approval.
    work_rejected:  { icon: '✕', iconBg: '#FDEAEA', iconColor: '#B00020', filter: 'Work' },
    // Partner: provider added them as a partner with a revenue split, needs
    // to approve before the record proceeds to the client (gates
    // work_start_request above — see workRecordService.js).
    partner_split_request: { icon: '🤝', iconBg: '#FFF3E0', iconColor: '#B26A00', filter: 'Work' },
    // Provider: partner approved the split — record now sent to the client.
    partner_split_approved: { icon: '🤝', iconBg: '#F0FDF4', iconColor: '#15803D', filter: 'Work' },
    // Provider: partner declined the split — record never reached the client.
    partner_split_declined: { icon: '✕', iconBg: '#FDEAEA', iconColor: '#B00020', filter: 'Work' },
    // Client: provider marked the work complete, needs to confirm + rate
    // (second of the two-approval lifecycle).
    work_completion_request: { icon: '🧾', iconBg: '#FFF3E0', iconColor: '#B26A00', filter: 'Work' },
    // Provider: client confirmed + rated — provider can rate them back.
    work_confirmed: { icon: '⭐', iconBg: '#F0FDF4', iconColor: '#15803D', filter: 'Work' },
    // Partner (only on a record with an approved split): client confirmed +
    // rated — same rating as the provider's, plus their own revenue share.
    // Distinct from work_confirmed because a partner can't rate the client
    // back (see rateClient — provider-only), so this routes differently.
    partner_work_verified: { icon: '⭐', iconBg: '#F0FDF4', iconColor: '#15803D', filter: 'Work' },
    // Provider: client raised an issue instead of confirming.
    work_disputed:  { icon: '⚑', iconBg: '#FDEAEA', iconColor: '#B00020', filter: 'Work' },
    // Client: provider rated them back after confirming.
    client_rated:   { icon: '👍', iconBg: '#F0FDF4', iconColor: '#15803D', filter: 'Work' },
    // Legacy pending_work/verified_work flow (services/workService.js
    // confirmWork) — still actively written, so still routed, not removed.
    work_verified:  { icon: '✅', iconBg: '#F0FDF4', iconColor: '#15803D', filter: 'Work' },
    message:        { icon: '🔔', iconBg: '#E0F5FE', iconColor: BLUE, filter: 'Messages' },
  };
  const meta = typeMap[n.type] || { icon: '🔔', iconBg: '#E0F5FE', iconColor: BLUE, filter: 'All' };
  const ts = n.createdAt ? new Date(n.createdAt) : new Date();
  const diffMins = Math.round((Date.now() - ts.getTime()) / 60000);
  let time = diffMins < 60 ? `${diffMins}m ago`
    : diffMins < 1440 ? `${Math.round(diffMins / 60)}h ago`
    : diffMins < 2880 ? 'Yesterday'
    : `${Math.round(diffMins / 1440)}d ago`;
  return {
    id: n.id,
    type: typeMap[n.type] ? n.type : 'general',
    icon: meta.icon,
    iconBg: meta.iconBg,
    iconColor: meta.iconColor,
    title: n.message || 'New notification',
    description: n.message || '',
    time,
    unread: !n.read,
    filter: meta.filter,
    workId: n.workId || null,
    recordId: n.recordId || null,
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
      const uid = await getCurrentUid();
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
              // Client: approve/decline the start of the engagement.
              if (item.type === 'work_start_request') navigation.navigate('WorkStartApproval', { recordId: item.recordId });
              // Provider: client approved/declined the start — open their
              // own record view (now ongoing, or rejected).
              else if (item.type === 'work_started' || item.type === 'work_rejected') navigation.push('CreateWorkRecord', { recordId: item.recordId });
              // Partner: approve/decline the revenue split, before the
              // record is even allowed to reach the client.
              else if (item.type === 'partner_split_request') navigation.navigate('PartnerApproval', { recordId: item.recordId });
              // Provider: partner approved/declined the split — open their
              // own record view.
              else if (item.type === 'partner_split_approved' || item.type === 'partner_split_declined') navigation.push('CreateWorkRecord', { recordId: item.recordId });
              // Client: review the completed record, confirm + rate the
              // provider (second of the two-approval lifecycle).
              else if (item.type === 'work_completion_request') navigation.navigate('WorkRecordReview', { recordId: item.recordId });
              // Provider: client confirmed + rated — rate the client back.
              else if (item.type === 'work_confirmed') navigation.navigate('RateClient', { recordId: item.recordId });
              // Partner: client confirmed + rated — open their own record
              // view (there's no "rate the client back" for a partner, only
              // the provider does that — see rateClient).
              else if (item.type === 'partner_work_verified') navigation.push('CreateWorkRecord', { recordId: item.recordId });
              // Provider: open their own record view for the disputed record.
              // push (not navigate) via CreateWorkRecord — it's the provider's
              // own editable screen, same entry point as opening from
              // MyWorkRecords (see CreateWorkRecordScreen's load effect).
              else if (item.type === 'work_disputed') navigation.push('CreateWorkRecord', { recordId: item.recordId });
              // Client: provider rated them back — open the record detail.
              // CreateWorkRecordScreen auto-redirects a non-owning viewer
              // (the client) to the read-only WorkRecordReview screen, so
              // this is a safe universal entry point for either role.
              else if (item.type === 'client_rated') navigation.push('CreateWorkRecord', { recordId: item.recordId });
              // Legacy pending_work/verified_work flow — still written by
              // services/workService.js's confirmWork(), so still routed.
              else if (item.type === 'work_verified') navigation.navigate('WorkHistory');
              else if (item.type === 'message') navigation.navigate('ChatList');
              else if (item.type === 'job_update' || item.type === 'job_match') navigation.navigate('Home');
              else if (item.type === 'payment' || item.type === 'review') openMyProfile(navigation);
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
