import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, TextInput, StatusBar, ActivityIndicator,
} from 'react-native';
import { useState, useMemo, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const ORANGE = '#FF6B2B';
const ORANGE_LIGHT = '#FFF3E0';

// ─── Sample Data ─────────────────────────────────────────────────────────────

const CONVERSATIONS = [
  {
    id: '1',
    name: 'Rahul Mehta',
    role: 'Civil Contractor',
    emoji: '👷',
    avatarBg: '#EFF6FF',
    lastMessage: 'Site engineer ke baare mein baat karni thi, kya aap kal available hain?',
    time: '2m ago',
    unread: 3,
    online: true,
  },
  {
    id: '2',
    name: 'Priya Agarwal',
    role: 'Architect',
    emoji: '🏛️',
    avatarBg: '#FDF2F8',
    lastMessage: 'Drawings ready ho gayi hain, please review karein aur feedback dein',
    time: '1h ago',
    unread: 1,
    online: true,
  },
  {
    id: '3',
    name: 'Gujarat Cement Traders',
    role: 'Cement Supplier',
    emoji: '🏭',
    avatarBg: '#FFF7ED',
    lastMessage: "Aaj ki rate list bhejte hain. OPC 53 grade - ₹340/bag, delivery free above 100 bags",
    time: '3h ago',
    unread: 0,
    online: false,
  },
  {
    id: '4',
    name: 'Suresh Patel',
    role: 'Builder & Developer',
    emoji: '🏢',
    avatarBg: '#F0FDF4',
    lastMessage: 'Tender document share karo please, review karke batate hain',
    time: 'Yesterday',
    unread: 0,
    online: false,
  },
  {
    id: '5',
    name: 'Raj Steel Suppliers',
    role: 'Steel & TMT Supplier',
    emoji: '⚙️',
    avatarBg: '#F8FAFC',
    lastMessage: 'Order confirm kar do jaldi, stock limited hai — Fe 500D available hai',
    time: '2d ago',
    unread: 2,
    online: false,
  },
  {
    id: '6',
    name: 'Ankit Sharma',
    role: 'Interior Designer',
    emoji: '🛋️',
    avatarBg: '#FDF4FF',
    lastMessage: '3D render ready hai, WhatsApp pe bhejta hoon',
    time: '3d ago',
    unread: 0,
    online: false,
  },
];

// ─── Conversation Item ────────────────────────────────────────────────────────

function ConversationItem({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: item.avatarBg }]}>
          <Text style={styles.avatarEmoji}>{item.emoji}</Text>
        </View>
        {item.online && <View style={styles.onlineDot} />}
      </View>

      {/* Content */}
      <View style={styles.itemContent}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.itemTime, item.unread > 0 && styles.itemTimeUnread]}>
            {item.time}
          </Text>
        </View>
        <View style={styles.itemBottomRow}>
          <Text
            style={[styles.itemPreview, item.unread > 0 && styles.itemPreviewBold]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread}</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemRole}>{item.role}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChatListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    setupRealTimeChats();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const setupRealTimeChats = async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) { setLoading(false); setConversations(CONVERSATIONS); return; }
      uidRef.current = uid;

      const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid));
      unsubRef.current = onSnapshot(q, (snap) => {
        setLoading(false);
        if (snap.empty) {
          setConversations(CONVERSATIONS);
          return;
        }
        const mapped = snap.docs.map(d => {
          const data = d.data();
          const otherUid = (data.participants || []).find(p => p !== uid);
          const otherName = data.participantNames?.[otherUid] || 'User';
          const ts = data.lastMessageAt?.toDate?.();
          let time = '';
          if (ts) {
            const diffMins = Math.round((Date.now() - ts.getTime()) / 60000);
            time = diffMins < 60 ? `${diffMins}m ago`
              : diffMins < 1440 ? `${Math.round(diffMins / 60)}h ago`
              : 'Yesterday';
          }
          return {
            id: d.id,
            name: otherName,
            role: 'Construction Professional',
            emoji: '👷',
            avatarBg: '#EFF6FF',
            lastMessage: data.lastMessage || 'Start a conversation',
            time,
            unread: 0,
            online: false,
            uid: otherUid,
          };
        });
        // Sort by most recent
        mapped.sort((a, b) => (b.time < a.time ? -1 : 1));
        setConversations(mapped.length > 0 ? mapped : CONVERSATIONS);
      }, () => {
        setLoading(false);
        setConversations(CONVERSATIONS);
      });
    } catch (_) {
      setLoading(false);
      setConversations(CONVERSATIONS);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [search, conversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            {totalUnread > 0 && (
              <Text style={styles.headerSub}>{totalUnread} unread conversations</Text>
            )}
          </View>
          <TouchableOpacity style={styles.composeBtn}>
            <Text style={styles.composeBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#A0ADB8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {['All', 'Unread', 'Contractors', 'Suppliers'].map((f, i) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, i === 0 && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, i === 0 && styles.filterTabTextActive]}>
                {f}
                {f === 'Unread' && totalUnread > 0 ? ` (${totalUnread})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      {loading && (
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={{ marginTop: 10, color: '#888', fontSize: 13 }}>Loading chats...</Text>
        </View>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            item={item}
            onPress={() => navigation.navigate('Chat', { conversation: item })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations found</Text>
            <Text style={styles.emptySub}>Try searching for a name or role</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filtered.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  headerSub: { fontSize: 12, fontWeight: '600', color: ORANGE, marginTop: 2 },
  composeBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: ORANGE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  composeBtnText: { fontSize: 18 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5F5F0', borderRadius: 12, marginHorizontal: 16,
    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  searchClear: { fontSize: 13, color: '#888', fontWeight: '700', paddingHorizontal: 4 },

  // Filter tabs
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 0 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F0' },
  filterTabActive: { backgroundColor: ORANGE_LIGHT },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#888' },
  filterTabTextActive: { color: ORANGE, fontWeight: '800' },

  // Items
  item: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: '#FFFFFF' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  avatarEmoji: { fontSize: 26 },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#2ECC71', borderWidth: 2, borderColor: '#FFFFFF',
  },
  itemContent: { flex: 1, justifyContent: 'center' },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', flex: 1, marginRight: 8 },
  itemTime: { fontSize: 11, fontWeight: '600', color: '#888' },
  itemTimeUnread: { color: ORANGE, fontWeight: '700' },
  itemBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemPreview: { flex: 1, fontSize: 13, color: '#666666', fontWeight: '400' },
  itemPreviewBold: { color: '#1A1A1A', fontWeight: '600' },
  itemRole: { fontSize: 11, fontWeight: '600', color: '#888', marginTop: 3 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

  separator: { height: 1, backgroundColor: '#EFEFEF', marginLeft: 82 },

  // Empty
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  emptySub: { fontSize: 13, color: '#888' },
});
