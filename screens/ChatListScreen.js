import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput, StatusBar,
  ActivityIndicator, Image,
} from 'react-native';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { injectFonts } from '../theme/typography';
import { getProfile } from '../services/userService';
import { markChatRead } from '../services/chatService';
import { getCurrentUid } from '../utils/session';
import { DEMO_MODE } from '../config/demoMode';
import { DEMO_CHATS } from '../demoData';

const GREEN       = '#22A559';
const DARK          = '#262626';
const BG            = '#FAF9F5';
const FILL          = '#F2F2F2';
const BORDER        = '#E5E5E5';
const MID            = '#737373';
const LIGHT          = '#8E8E8E';
const LINK_BLUE      = '#1877F2';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// WhatsApp-style rules: time-of-day today, "Yesterday", weekday name within
// the last week, otherwise a short date.
function formatChatTime(date) {
  if (!date) return '';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);

  if (diffDays <= 0) {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return WEEKDAYS[date.getDay()];
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// Maps a DEMO_CHATS fixture to the exact same row shape real Firestore chats
// are mapped to below — entirely client-side, never touches Firestore.
function demoChatToRow(chat) {
  const last = chat.messages[chat.messages.length - 1] || null;
  const sentByMe = last?.sender === 'me';
  const lastMessage = last?.type === 'work_record' ? '📄 Work record shared' : (last?.text || '');
  const read = sentByMe && chat.lastReadByOther && last?.timestamp
    ? chat.lastReadByOther >= last.timestamp
    : false;
  return {
    id: chat.id,
    uid: chat.participant.uid,
    name: chat.participant.name,
    role: chat.participant.category || '',
    emoji: '👤',
    avatarBg: FILL,
    photoUri: chat.participant.photoUri || null,
    verified: !!chat.participant.verified,
    available: !!chat.participant.available,
    online: !!chat.participant.available,
    lastMessage,
    sentByMe,
    read,
    unread: chat.unreadCount || 0,
    timeLabel: formatChatTime(last?.timestamp || null),
    sortTs: last?.timestamp ? last.timestamp.getTime() : 0,
    isDemo: true,
  };
}

// ─── Conversation row ────────────────────────────────────────────────────────
function ConversationRow({ item, onPress }) {
  const hasUnread = item.unread > 0;
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={s.avatarWrap}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={s.avatarImg} />
        ) : (
          <View style={s.avatarPlaceholder}>
            <Text style={s.avatarPlaceholderIcon}>👤</Text>
          </View>
        )}
        {item.available && <View style={s.onlineDot} />}
      </View>

      <View style={s.rowInfo}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{item.name}</Text>
          {item.verified ? (
            <View style={s.verifiedBadge}><Text style={s.verifiedBadgeText}>✓</Text></View>
          ) : null}
        </View>
        <Text style={[s.preview, hasUnread && s.previewUnread]} numberOfLines={1}>
          {item.sentByMe ? 'You: ' : ''}{item.lastMessage}
        </Text>
      </View>

      <View style={s.rightCol}>
        <Text style={[s.time, hasUnread && s.timeUnread]} numberOfLines={1}>{item.timeLabel}</Text>
        {hasUnread ? (
          <View style={s.unreadBadge}>
            <Text style={s.unreadBadgeText}>{item.unread}</Text>
          </View>
        ) : item.sentByMe ? (
          <Text style={[s.ticks, item.read && s.ticksRead]}>✓✓</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function ChatListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const myUidRef = useRef(null);
  const unsubRef = useRef(null);
  const profileCacheRef = useRef({}); // otherUid -> profile, avoids refetching on every snapshot

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const uid = await getCurrentUid();
      if (!uid) { setLoading(false); return; }
      myUidRef.current = uid;

      const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid));
      unsubRef.current = onSnapshot(q, async (snap) => {
        if (cancelled) return;
        const docs = snap.docs.map(d => ({ id: d.id, data: d.data() }));

        const otherUids = docs
          .map(({ data }) => (data.participants || []).find(p => p !== uid))
          .filter(Boolean);
        const uncached = [...new Set(otherUids)].filter(u => !profileCacheRef.current[u]);
        if (uncached.length > 0) {
          const fetched = await Promise.all(uncached.map(u => getProfile(u).catch(() => null)));
          uncached.forEach((u, i) => { profileCacheRef.current[u] = fetched[i] || {}; });
        }
        if (cancelled) return;

        const mapped = docs.map(({ id, data }) => {
          const otherUid = (data.participants || []).find(p => p !== uid);
          const profile = profileCacheRef.current[otherUid] || {};
          const ts = data.lastMessageAt?.toDate?.() || null;
          const sentByMe = !!data.lastMessageSenderId && data.lastMessageSenderId === uid;
          const lastReadAt = data.lastReadAt?.[otherUid]?.toDate?.() || null;
          const read = sentByMe && ts && lastReadAt ? lastReadAt >= ts : false;

          return {
            id,
            uid: otherUid,
            name: profile.name || profile.companyName || data.participantNames?.[otherUid] || 'User',
            role: profile.category || profile.designation || profile.workerSkill || profile.contractorType || '',
            emoji: '👤',
            avatarBg: FILL,
            photoUri: profile.photoUri || null,
            verified: !!profile.verified,
            available: !!profile.available,
            online: !!profile.available,
            lastMessage: data.lastMessage || 'Start a conversation',
            sentByMe,
            read,
            unread: sentByMe ? 0 : Number(data.unreadCount?.[uid] || 0),
            timeLabel: formatChatTime(ts),
            sortTs: ts ? ts.getTime() : 0,
          };
        });

        const demoRows = DEMO_MODE ? DEMO_CHATS.map(demoChatToRow) : [];
        const combined = [...mapped, ...demoRows];
        combined.sort((a, b) => b.sortTs - a.sortTs);
        setConversations(combined);
        setLoading(false);
      }, () => {
        // Even if the real chats query fails, demo content should still
        // preview correctly.
        setConversations(DEMO_MODE ? DEMO_CHATS.map(demoChatToRow) : []);
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    );
  }, [search, conversations]);

  const openChat = (item) => {
    // Demo conversations are client-side only — never write to Firestore
    // for them, and pass through the fields ChatScreen needs to render them
    // without any Firestore reads either.
    if (item.isDemo) {
      navigation.navigate('Chat', {
        conversation: {
          id: item.id,
          uid: item.uid,
          name: item.name,
          role: item.role,
          emoji: item.emoji,
          avatarBg: item.avatarBg,
          online: item.online,
          isDemo: true,
          photoUri: item.photoUri,
          verified: item.verified,
          available: item.available,
        },
      });
      return;
    }

    if (item.unread > 0 && myUidRef.current) {
      markChatRead(item.id, myUidRef.current);
    }
    navigation.navigate('Chat', {
      conversation: {
        id: item.id,
        uid: item.uid,
        name: item.name,
        role: item.role,
        emoji: item.emoji,
        avatarBg: item.avatarBg,
        online: item.online,
      },
    });
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Messages</Text>
          <TouchableOpacity
            style={s.composeBtn}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
          >
            <Text style={s.composeIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search messages"
            placeholderTextColor={LIGHT}
            numberOfLines={1}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={s.clearBtn}><Text style={s.clearBtnText}>✕</Text></View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={DARK} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationRow item={item} onPress={() => openChat(item)} />}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={() => (
            conversations.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>💬</Text>
                <Text style={s.emptyTitle}>No conversations yet</Text>
                <Text style={s.emptySub}>Browse providers and start a conversation</Text>
                <TouchableOpacity
                  style={s.browseBtn}
                  onPress={() => navigation.navigate('Search')}
                  activeOpacity={0.85}
                >
                  <Text style={s.browseBtnText}>Browse Providers</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>🔍</Text>
                <Text style={s.emptyTitle}>No matches found</Text>
                <Text style={s.emptySub}>Try a different name or keyword</Text>
              </View>
            )
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={filtered.length === 0 ? { flexGrow: 1 } : { paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 52, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, marginBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  backIcon: { fontSize: 20, lineHeight: 24, fontWeight: '700', color: DARK },
  headerTitle: { fontSize: 20, fontWeight: '700', color: DARK },
  composeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  composeIcon: { fontSize: 15, lineHeight: 18 },

  // ── Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: FILL, borderRadius: 14, marginHorizontal: 14,
    paddingHorizontal: 13, paddingVertical: 10,
  },
  searchIcon: { fontSize: 15, lineHeight: 18 },
  searchInput: { flex: 1, fontSize: 14, color: DARK, fontWeight: '500', paddingVertical: 0 },
  clearBtn: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 9, fontWeight: '900', color: MID },

  // ── Row
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  separator: { height: 1, backgroundColor: BORDER, marginLeft: 16 },

  avatarWrap: { width: 52, height: 52, flexShrink: 0 },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPlaceholderIcon: { fontSize: 22, opacity: 0.4 },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: GREEN, borderWidth: 2, borderColor: '#FFFFFF',
  },

  rowInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  name: { fontSize: 15, fontWeight: '700', color: DARK, flexShrink: 1 },
  verifiedBadge: {
    width: 15, height: 15, borderRadius: 8, backgroundColor: LINK_BLUE,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  verifiedBadgeText: { fontSize: 9, color: '#FFFFFF', fontWeight: '900' },
  preview: { fontSize: 13, color: MID, fontWeight: '400' },
  previewUnread: { color: DARK, fontWeight: '600' },

  rightCol: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  time: { fontSize: 11, color: LIGHT, fontWeight: '500' },
  timeUnread: { color: GREEN, fontWeight: '700' },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  ticks: { fontSize: 13, color: LIGHT, fontWeight: '700' },
  ticksRead: { color: GREEN },

  // ── Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 6 },
  emptyIcon: { fontSize: 48, marginBottom: 6, opacity: 0.6 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: DARK },
  emptySub: { fontSize: 13, color: LIGHT, fontWeight: '500', textAlign: 'center' },
  browseBtn: {
    marginTop: 14, backgroundColor: DARK, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  browseBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
