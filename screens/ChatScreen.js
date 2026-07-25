import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput, StatusBar,
  KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { injectFonts } from '../theme/typography';
import { getProfile } from '../services/userService';
import {
  sendMessage, createChat, markChatRead,
  subscribeToChat, subscribeToRecentMessages, getOlderMessages,
} from '../services/chatService';
import { formatAmountIndian } from '../utils/format';
import { DEMO_MODE } from '../config/demoMode';
import { DEMO_CHATS } from '../demoData';

const GREEN       = '#22A559';
const GREEN_LIGHT  = '#E8F5EC';
const DARK          = '#262626';
const BG            = '#FAF9F5';
const FILL          = '#F2F2F2';
const BORDER        = '#E5E5E5';
const MID            = '#737373';
const LIGHT          = '#8E8E8E';
const LINK_BLUE      = '#1877F2';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PROFILE_SCREEN = {
  worker: 'WorkerProfile',
  contractor: 'ContractorProfile',
  professional: 'ProfessionalProfile',
  supplier: 'SupplierProfile',
  business: 'BusinessProfile',
};

function formatBubbleTime(date) {
  if (!date) return '';
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function dayLabel(date) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);
  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';
  const year = date.getFullYear() !== now.getFullYear() ? ` ${date.getFullYear()}` : '';
  return `${date.getDate()} ${MONTHS[date.getMonth()]}${year}`.toUpperCase();
}

// Interleaves centred day-separator pseudo-rows between messages from
// different calendar days.
function buildListData(messages) {
  const out = [];
  let lastDayKey = null;
  messages.forEach((m, i) => {
    const d = m.timestamp;
    const dayKey = d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : 'unknown';
    if (dayKey !== lastDayKey) {
      out.push({ __type: 'separator', id: `sep-${dayKey}-${i}`, label: d ? dayLabel(d) : '' });
      lastDayKey = dayKey;
    }
    out.push(m);
  });
  return out;
}

// ─── Date separator ─────────────────────────────────────────────────────────
function DateSeparator({ label }) {
  if (!label) return null;
  return (
    <View style={cs.dateSepWrap}>
      <View style={cs.dateSepPill}><Text style={cs.dateSepText}>{label}</Text></View>
    </View>
  );
}

// ─── Text message bubble ────────────────────────────────────────────────────
function MessageBubble({ item, isSent, isRead }) {
  return (
    <View style={[cs.bubbleRow, isSent ? cs.bubbleRowRight : cs.bubbleRowLeft]}>
      <View style={[cs.bubble, isSent ? cs.bubbleSent : cs.bubbleReceived]}>
        <Text style={cs.bubbleText}>{item.text}</Text>
        <View style={cs.bubbleMetaRow}>
          <Text style={cs.bubbleTime}>{formatBubbleTime(item.timestamp)}</Text>
          {isSent && <Text style={[cs.bubbleTicks, isRead && cs.bubbleTicksRead]}>✓✓</Text>}
        </View>
      </View>
    </View>
  );
}

// ─── Work record card (special message type) ───────────────────────────────
function WorkRecordCard({ item, isSent, onPress }) {
  return (
    <View style={[cs.bubbleRow, isSent ? cs.bubbleRowRight : cs.bubbleRowLeft]}>
      <View style={cs.wrCard}>
        <View style={cs.wrHeaderStrip}>
          <Text style={cs.wrHeaderText}>📄 WORK RECORD · SHARED</Text>
        </View>
        <View style={cs.wrBody}>
          <Text style={cs.wrProjectName} numberOfLines={2}>{item.projectName || 'Untitled project'}</Text>
          {item.workArea ? <Text style={cs.wrMeta}>{item.workArea}</Text> : null}
          {item.contractValue ? (
            <Text style={cs.wrValue}>{formatAmountIndian(item.contractValue)} contract value</Text>
          ) : null}
          <TouchableOpacity style={cs.wrBtn} onPress={onPress} activeOpacity={0.85}>
            <Text style={cs.wrBtnText}>View & confirm details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function ChatScreen({ navigation, route }) {
  const conversation = route?.params?.conversation || {};

  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMeta, setChatMeta] = useState(null);
  const [inputText, setInputText] = useState('');
  const [myUid, setMyUid] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [demoLastReadByOther, setDemoLastReadByOther] = useState(null);

  const listRef = useRef(null);
  const unsubMessagesRef = useRef(null);
  const unsubChatRef = useRef(null);
  const oldestCursorRef = useRef(null);
  const hasMoreOlderRef = useRef(false);
  const chatIdRef = useRef(null);
  const firstLoadRef = useRef(true);
  const isNearBottomRef = useRef(true);
  const loadingOlderRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) { setInitialLoading(false); return; }
      setMyUid(uid);

      if (!conversation.uid) { setInitialLoading(false); return; }

      // Demo conversations are entirely client-side fixtures — never call
      // createChat/sendMessage/Firestore listeners for them.
      if (conversation.isDemo) {
        const demoChat = DEMO_MODE ? DEMO_CHATS.find(c => c.id === conversation.id) : null;
        if (demoChat) {
          const hydrated = demoChat.messages.map(m => ({
            ...m,
            sender: m.sender === 'me' ? uid : demoChat.participant.uid,
          }));
          setMessages(hydrated);
          setDemoLastReadByOther(demoChat.lastReadByOther || null);
        }
        setOtherProfile({
          photoUri: conversation.photoUri || null,
          verified: !!conversation.verified,
          available: !!conversation.available,
          profileType: null,
        });
        setInitialLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 60);
        return;
      }

      getProfile(conversation.uid)
        .then(p => { if (!cancelled) setOtherProfile(p); })
        .catch(() => {});

      const myName = (await AsyncStorage.getItem('userName')) || 'Me';
      const id = await createChat(
        { uid, name: myName },
        { uid: conversation.uid, name: conversation.name || 'User' }
      );
      if (cancelled) return;
      setChatId(id);
      chatIdRef.current = id;
      markChatRead(id, uid);

      unsubChatRef.current = subscribeToChat(id, (chat) => { if (!cancelled) setChatMeta(chat); });

      unsubMessagesRef.current = subscribeToRecentMessages(
        id,
        (recent) => {
          if (cancelled) return;
          setMessages(prev => {
            const freshIds = new Set(recent.map(m => m.id));
            const oldestFreshTs = recent[0]?.timestamp;
            const keptOlder = prev.filter(m =>
              !freshIds.has(m.id) && m.timestamp && oldestFreshTs && m.timestamp < oldestFreshTs
            );
            return [...keptOlder, ...recent];
          });
          setInitialLoading(false);
          const stick = firstLoadRef.current || isNearBottomRef.current;
          const animated = !firstLoadRef.current;
          firstLoadRef.current = false;
          if (stick) {
            setTimeout(() => listRef.current?.scrollToEnd({ animated }), 60);
          }
          markChatRead(id, uid);
        },
        (cursor, hasMore) => {
          oldestCursorRef.current = cursor;
          hasMoreOlderRef.current = hasMore;
        }
      );
    })();

    return () => {
      cancelled = true;
      if (unsubMessagesRef.current) unsubMessagesRef.current();
      if (unsubChatRef.current) unsubChatRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOlder = async () => {
    if (loadingOlderRef.current || !hasMoreOlderRef.current || !chatIdRef.current || !oldestCursorRef.current) return;
    loadingOlderRef.current = true;
    try {
      const { messages: older, cursor, hasMore } = await getOlderMessages(chatIdRef.current, oldestCursorRef.current);
      if (older.length > 0) {
        setMessages(prev => [...older, ...prev]);
        oldestCursorRef.current = cursor;
      }
      hasMoreOlderRef.current = hasMore;
    } catch (_) {
      // stay silent — pagination failing shouldn't disrupt the conversation
    } finally {
      loadingOlderRef.current = false;
    }
  };

  const handleScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    isNearBottomRef.current = distanceFromBottom < 120;
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !myUid) return;
    setInputText('');
    isNearBottomRef.current = true;

    // Demo conversations only ever update local state — never Firestore.
    if (conversation.isDemo) {
      setMessages(prev => [...prev, { id: `demo_local_${Date.now()}`, sender: myUid, text, timestamp: new Date() }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
      return;
    }

    if (!chatId) return;
    try {
      await sendMessage(chatId, text, myUid, conversation.uid);
    } catch (_) {
      // Firestore's own offline-write echo already reflects it locally
    }
  };

  const openProfile = () => {
    if (conversation.isDemo) return; // no real profile screen backs a demo contact
    const pt = (otherProfile?.profileType || '').toLowerCase();
    const screen = PROFILE_SCREEN[pt];
    if (screen && conversation.uid) navigation.navigate(screen, { uid: conversation.uid });
  };

  const openWorkRecord = (recordId) => {
    if (recordId) navigation.navigate('CreateWorkRecord', { recordId });
  };

  const attachmentsComingSoon = () => Alert.alert('Coming soon', 'Attachments will be available in a future update.');

  const otherReadAt = conversation.isDemo
    ? demoLastReadByOther
    : (chatMeta?.lastReadAt?.[conversation.uid]?.toDate?.() || null);
  const available = otherProfile ? otherProfile.available === true : !!conversation.online;
  const photoUri = otherProfile?.photoUri || conversation.photoUri || null;
  const verified = !!otherProfile?.verified;

  const listData = useMemo(() => buildListData(messages), [messages]);

  return (
    <View style={cs.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={cs.header}>
        <TouchableOpacity style={cs.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={cs.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cs.headerInfoRow} onPress={openProfile} activeOpacity={0.7}>
          <View style={cs.headerAvatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={cs.headerAvatarImg} />
            ) : (
              <View style={cs.headerAvatarPlaceholder}>
                <Text style={cs.headerAvatarPlaceholderIcon}>👤</Text>
              </View>
            )}
          </View>
          <View style={cs.headerInfo}>
            <View style={cs.headerNameRow}>
              <Text style={cs.headerName} numberOfLines={1}>{conversation.name || 'User'}</Text>
              {verified ? (
                <View style={cs.verifiedBadge}><Text style={cs.verifiedBadgeText}>✓</Text></View>
              ) : null}
            </View>
            {available ? (
              <View style={cs.statusRow}>
                <View style={cs.statusDot} />
                <Text style={cs.statusAvailable}>Available now</Text>
              </View>
            ) : (
              <Text style={cs.statusBusy}>Busy</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {initialLoading ? (
          <View style={cs.center} />
        ) : (
          <FlatList
            ref={listRef}
            style={{ flex: 1 }}
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              if (item.__type === 'separator') return <DateSeparator label={item.label} />;
              const isSent = !!myUid && item.sender === myUid;
              const isRead = isSent && !!otherReadAt && !!item.timestamp && otherReadAt >= item.timestamp;
              if (item.type === 'work_record') {
                return <WorkRecordCard item={item} isSent={isSent} onPress={() => openWorkRecord(item.workRecordId)} />;
              }
              return <MessageBubble item={item} isSent={isSent} isRead={isRead} />;
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={cs.messageList}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onStartReached={loadOlder}
            onStartReachedThreshold={0.2}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            ListEmptyComponent={
              <View style={cs.emptyWrap}>
                <Text style={cs.emptyIcon}>💬</Text>
                <Text style={cs.emptyTitle}>Start the conversation</Text>
                <Text style={cs.emptySub}>Say hello to {conversation.name || 'them'}!</Text>
              </View>
            }
          />
        )}

        {/* ── Input bar ── */}
        <View style={cs.inputBar}>
          <TouchableOpacity style={cs.plusBtn} onPress={attachmentsComingSoon} activeOpacity={0.7}>
            <Text style={cs.plusIcon}>+</Text>
          </TouchableOpacity>
          <View style={cs.inputWrap}>
            <TextInput
              style={cs.textInput}
              placeholder="Message..."
              placeholderTextColor={LIGHT}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={cs.paperclipBtn} onPress={attachmentsComingSoon} activeOpacity={0.7}>
              <Text style={cs.paperclipIcon}>📎</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[cs.sendBtn, !inputText.trim() && cs.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.85}
          >
            <Text style={cs.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const cs = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1 },

  // ── Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  backIcon: { fontSize: 20, lineHeight: 24, fontWeight: '700', color: DARK },
  headerInfoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarWrap: { width: 40, height: 40, flexShrink: 0 },
  headerAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarPlaceholderIcon: { fontSize: 18, opacity: 0.4 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerName: { fontSize: 15, fontWeight: '700', color: DARK, flexShrink: 1 },
  verifiedBadge: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: LINK_BLUE,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  verifiedBadgeText: { fontSize: 8, color: '#FFFFFF', fontWeight: '900' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  statusAvailable: { fontSize: 11, color: GREEN, fontWeight: '600' },
  statusBusy: { fontSize: 11, color: LIGHT, fontWeight: '600', marginTop: 2 },

  // ── Date separator
  dateSepWrap: { alignItems: 'center', marginVertical: 12 },
  dateSepPill: { backgroundColor: FILL, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  dateSepText: { fontSize: 10, fontWeight: '700', color: MID, letterSpacing: 0.6 },

  // ── Messages
  messageList: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, flexGrow: 1, justifyContent: 'flex-end' },
  bubbleRow: { marginBottom: 8, flexDirection: 'row' },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '75%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9,
  },
  bubbleSent: { backgroundColor: GREEN_LIGHT, borderBottomRightRadius: 4 },
  bubbleReceived: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER },
  bubbleText: { fontSize: 14, lineHeight: 20, color: DARK },
  bubbleMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  bubbleTime: { fontSize: 10, fontWeight: '500', color: LIGHT },
  bubbleTicks: { fontSize: 11, fontWeight: '700', color: LIGHT },
  bubbleTicksRead: { color: GREEN },

  // ── Work record card
  wrCard: {
    maxWidth: '80%', borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BORDER,
  },
  wrHeaderStrip: { backgroundColor: FILL, paddingHorizontal: 12, paddingVertical: 6 },
  wrHeaderText: { fontSize: 10, fontWeight: '700', color: MID, letterSpacing: 0.6 },
  wrBody: { padding: 12 },
  wrProjectName: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 4 },
  wrMeta: { fontSize: 12, color: MID, fontWeight: '500', marginBottom: 2 },
  wrValue: { fontSize: 13, color: GREEN, fontWeight: '700', marginBottom: 10 },
  wrBtn: {
    height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  wrBtnText: { fontSize: 12, fontWeight: '700', color: DARK },

  // ── Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10, opacity: 0.6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 4 },
  emptySub: { fontSize: 13, color: LIGHT, textAlign: 'center', paddingHorizontal: 32 },

  // ── Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  plusBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  plusIcon: { fontSize: 20, lineHeight: 24, fontWeight: '600', color: DARK },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end',
    minHeight: 40, maxHeight: 120,
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  textInput: {
    flex: 1, fontSize: 14, color: DARK, fontWeight: '500',
    paddingVertical: 4, maxHeight: 100,
  },
  paperclipBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  paperclipIcon: { fontSize: 16 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: DARK,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 15, color: '#FFFFFF' },
});
