import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, TextInput, StatusBar,
} from 'react-native';
import { useState, useMemo } from 'react';

import { BLUE } from '../constants/colors';

const LIGHT_BLUE = '#E0F5FE';

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

  const filtered = useMemo(() => {
    if (!search.trim()) return CONVERSATIONS;
    const q = search.toLowerCase();
    return CONVERSATIONS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [search]);

  const totalUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

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
  container: { flex: 1, backgroundColor: 'white' },

  // Header
  header: {
    backgroundColor: 'white',
    paddingTop: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1A202C' },
  headerSub: { fontSize: 12, fontWeight: '600', color: BLUE, marginTop: 2 },
  composeBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: LIGHT_BLUE,
    alignItems: 'center', justifyContent: 'center',
  },
  composeBtnText: { fontSize: 18 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F2F0ED', borderRadius: 12, marginHorizontal: 16,
    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A202C', fontWeight: '500' },
  searchClear: { fontSize: 13, color: '#A0ADB8', fontWeight: '700', paddingHorizontal: 4 },

  // Filter tabs
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 0 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F0ED' },
  filterTabActive: { backgroundColor: LIGHT_BLUE },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#718096' },
  filterTabTextActive: { color: BLUE, fontWeight: '800' },

  // Items
  item: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: 'white' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  avatarEmoji: { fontSize: 26 },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#38A169', borderWidth: 2, borderColor: 'white',
  },
  itemContent: { flex: 1, justifyContent: 'center' },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1A202C', flex: 1, marginRight: 8 },
  itemTime: { fontSize: 11, fontWeight: '600', color: '#A0ADB8' },
  itemTimeUnread: { color: BLUE, fontWeight: '700' },
  itemBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemPreview: { flex: 1, fontSize: 13, color: '#718096', fontWeight: '400' },
  itemPreviewBold: { color: '#2D3748', fontWeight: '600' },
  itemRole: { fontSize: 11, fontWeight: '600', color: '#A0ADB8', marginTop: 3 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: 'white' },

  separator: { height: 1, backgroundColor: '#F0F4F8', marginLeft: 82 },

  // Empty
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748' },
  emptySub: { fontSize: 13, color: '#A0ADB8' },
});
