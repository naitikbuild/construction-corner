import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput, StatusBar,
  KeyboardAvoidingView, Platform, Image, Alert, Modal, Linking, ActivityIndicator,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { injectFonts } from '../theme/typography';
import { getProfile, blockUser, unblockUser } from '../services/userService';
import {
  sendMessage, sendAttachmentMessage, createChat, markChatRead,
  subscribeToChat, subscribeToRecentMessages, getOlderMessages,
} from '../services/chatService';
import PhotoViewer from '../components/PhotoViewer';
import { formatAmountIndian, formatFileSize } from '../utils/format';
import { getCurrentUid } from '../utils/session';
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
  personal: 'PersonalProfile',
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

// ─── Image message bubble ───────────────────────────────────────────────────
function ImageBubble({ item, isSent, isRead, onPress, onRetry }) {
  const uploading = item.__status === 'uploading';
  const failed = item.__status === 'error';
  return (
    <View style={[cs.bubbleRow, isSent ? cs.bubbleRowRight : cs.bubbleRowLeft]}>
      <View style={[cs.bubble, cs.imageBubble, isSent ? cs.bubbleSent : cs.bubbleReceived]}>
        <TouchableOpacity
          onPress={failed ? onRetry : onPress}
          activeOpacity={0.85}
          disabled={uploading}
        >
          <View style={cs.imageWrap}>
            <Image source={{ uri: item.uri }} style={cs.image} resizeMode="cover" />
            {(uploading || failed) && (
              <View style={cs.imageOverlay}>
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={cs.imageRetryText}>↻ Tap to retry</Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={cs.bubbleMetaRow}>
          <Text style={cs.bubbleTime}>{uploading ? 'Sending…' : formatBubbleTime(item.timestamp)}</Text>
          {isSent && !uploading && !failed && <Text style={[cs.bubbleTicks, isRead && cs.bubbleTicksRead]}>✓✓</Text>}
        </View>
      </View>
    </View>
  );
}

// ─── File message bubble ────────────────────────────────────────────────────
function FileBubble({ item, isSent, isRead, onPress, onRetry }) {
  const uploading = item.__status === 'uploading';
  const failed = item.__status === 'error';
  return (
    <View style={[cs.bubbleRow, isSent ? cs.bubbleRowRight : cs.bubbleRowLeft]}>
      <TouchableOpacity
        style={[cs.bubble, cs.fileBubble, isSent ? cs.bubbleSent : cs.bubbleReceived]}
        onPress={failed ? onRetry : onPress}
        activeOpacity={0.85}
        disabled={uploading}
      >
        <View style={cs.fileRow}>
          <View style={cs.fileIconWrap}>
            {uploading ? (
              <ActivityIndicator color={DARK} size="small" />
            ) : (
              <Text style={cs.fileIcon}>{failed ? '⚠️' : '📄'}</Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={cs.fileName} numberOfLines={1}>{item.fileName || 'File'}</Text>
            <Text style={cs.fileSize}>
              {failed ? 'Failed to send' : uploading ? 'Sending…' : formatFileSize(item.fileSize)}
            </Text>
          </View>
        </View>
        <View style={cs.bubbleMetaRow}>
          <Text style={cs.bubbleTime}>{uploading ? '' : formatBubbleTime(item.timestamp)}</Text>
          {isSent && !uploading && !failed && <Text style={[cs.bubbleTicks, isRead && cs.bubbleTicksRead]}>✓✓</Text>}
          {failed && <Text style={cs.retryInlineText}>Tap to retry</Text>}
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Attachment picker (bottom sheet) ───────────────────────────────────────
function AttachmentSheet({ visible, onClose, onPhotoLibrary, onCamera, onDocument, insets }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cs.sheetOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={[cs.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={cs.sheetHandle} />
          <Text style={cs.sheetTitle}>Attach</Text>

          <TouchableOpacity style={cs.sheetRow} onPress={onPhotoLibrary} activeOpacity={0.7}>
            <View style={cs.sheetIconWrap}><Text style={cs.sheetIconText}>🖼️</Text></View>
            <Text style={cs.sheetLabel}>Photo Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cs.sheetRow} onPress={onCamera} activeOpacity={0.7}>
            <View style={cs.sheetIconWrap}><Text style={cs.sheetIconText}>📷</Text></View>
            <Text style={cs.sheetLabel}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cs.sheetRow} onPress={onDocument} activeOpacity={0.7}>
            <View style={cs.sheetIconWrap}><Text style={cs.sheetIconText}>📄</Text></View>
            <Text style={cs.sheetLabel}>Document</Text>
          </TouchableOpacity>

          <TouchableOpacity style={cs.sheetCancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={cs.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function ChatScreen({ navigation, route }) {
  const conversation = route?.params?.conversation || {};
  const insets = useSafeAreaInsets();

  const [otherProfile, setOtherProfile] = useState(null);
  const [myBlockedUsers, setMyBlockedUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatMeta, setChatMeta] = useState(null);
  const [inputText, setInputText] = useState('');
  const [myUid, setMyUid] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [demoLastReadByOther, setDemoLastReadByOther] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Attachments — optimistic local queue so an upload shows a sending
  // indicator immediately and can be retried on failure, before the synced
  // Firestore copy (via subscribeToRecentMessages) replaces it.
  const [attachSheetOpen, setAttachSheetOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [viewer, setViewer] = useState({ visible: false, photos: [], index: 0 });

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
      // Prefer the live Firebase auth uid over the cached AsyncStorage copy —
      // see utils/session.js. A stale cache here misattributes sent messages
      // and read receipts to the wrong uid.
      const uid = await getCurrentUid();
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

      // My own blockedUsers — needed to tell "I blocked them" apart from
      // "they blocked me" (see isBlocked/iBlockedThem below), which decide
      // both the freeze note's wording and the header menu's Block/Unblock
      // label. Fire-and-forget, same as the other-profile fetch above — the
      // chat itself must never wait on this.
      getProfile(uid)
        .then(p => { if (!cancelled) setMyBlockedUsers(p?.blockedUsers || []); })
        .catch(() => {});

      try {
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
      } catch (err) {
        if (cancelled) return;
        console.warn('ChatScreen: failed to open conversation', err);
        setInitialLoading(false);
        Alert.alert('Could not open chat', 'Something went wrong opening this conversation. Please try again.');
        navigation.goBack();
      }
    })();

    return () => {
      cancelled = true;
      if (unsubMessagesRef.current) unsubMessagesRef.current();
      if (unsubChatRef.current) unsubChatRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Belt-and-suspenders: also re-mark read whenever this screen regains
  // focus (e.g. coming back from the other participant's profile without a
  // fresh mount), on top of marking read on initial open and on every
  // incoming message above — this screen being on-screen should never leave
  // a conversation showing as unread.
  useFocusEffect(
    useCallback(() => {
      if (chatIdRef.current && myUid) {
        markChatRead(chatIdRef.current, myUid);
      }
    }, [myUid])
  );

  // Keep the latest messages / the text being typed in view whenever the
  // keyboard opens — without this, KeyboardAvoidingView shrinks the FlatList
  // but the scroll offset stays put, so the last message can end up hidden
  // right behind the now-risen input bar.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => sub.remove();
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
    // Belt-and-suspenders — the input bar is already replaced by a frozen
    // notice below whenever isBlocked is true, so this should never
    // actually be reachable, but never trust that alone for a hard block.
    const blocked = myBlockedUsers.some(u => u.uid === conversation.uid)
      || (otherProfile?.blockedUsers || []).some(u => u.uid === myUid);
    if (blocked) return;
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

  // ── Block / unblock — conversation header menu. Unlike a profile screen
  // (which gets replaced entirely by a "not available" notice once blocked),
  // this screen stays open post-block so existing messages remain visible —
  // so, unlike the profile screens' menus, this one needs to offer Unblock
  // too, not just Block (see the header render below).
  const iBlockedThem = myBlockedUsers.some(u => u.uid === conversation.uid);
  const theyBlockedMe = !!otherProfile && (otherProfile.blockedUsers || []).some(u => u.uid === myUid);
  const isBlocked = iBlockedThem || theyBlockedMe;

  const handleMenuPress = () => {
    if (iBlockedThem) {
      Alert.alert(
        `Unblock ${conversation.name || 'this user'}?`,
        "You'll be able to see each other's profile and message again.",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: async () => {
              try {
                await unblockUser(myUid, conversation.uid);
                setMyBlockedUsers(prev => prev.filter(u => u.uid !== conversation.uid));
              } catch (err) {
                Alert.alert('Could Not Unblock', err.message || 'Something went wrong. Please try again.');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        `Block ${conversation.name || 'this user'}?`,
        "You won't be able to see each other's profile or message.",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              try {
                await blockUser(myUid, conversation.uid, conversation.name || 'User');
                setMyBlockedUsers(prev => [...prev, { uid: conversation.uid, name: conversation.name || 'User' }]);
              } catch (err) {
                Alert.alert('Could Not Block', err.message || 'Something went wrong. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  const openWorkRecord = (recordId) => {
    // push, not navigate — guarantees a fresh CreateWorkRecordScreen mount for
    // this exact recordId instead of reusing a stale instance already on the
    // stack (which would show/edit whatever record was open before).
    if (recordId) navigation.push('CreateWorkRecord', { recordId });
  };

  // ── Attachments ─────────────────────────────────────────────────────────
  const sendAttachment = async (type, asset) => {
    if (!myUid) return;
    const localId = `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const fileName = asset.name || asset.fileName || (type === 'image' ? `Photo_${Date.now()}.jpg` : 'File');
    const fileSize = asset.size ?? asset.fileSize ?? null;
    const mimeType = asset.mimeType || '';

    // Demo conversations only ever update local state — never Firestore/Storage.
    if (conversation.isDemo) {
      setMessages(prev => [...prev, {
        id: `demo_local_${Date.now()}`, type, uri: asset.uri, fileName, fileSize, mimeType,
        sender: myUid, timestamp: new Date(),
      }]);
      isNearBottomRef.current = true;
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
      return;
    }

    if (!chatId) return;
    isNearBottomRef.current = true;
    setPendingAttachments(prev => [...prev, {
      id: localId, type, uri: asset.uri, fileName, fileSize, mimeType,
      sender: myUid, timestamp: new Date(), __status: 'uploading',
    }]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

    try {
      await sendAttachmentMessage(chatId, myUid, conversation.uid, { type, uri: asset.uri, fileName, fileSize, mimeType });
      setPendingAttachments(prev => prev.filter(p => p.id !== localId));
    } catch (err) {
      console.warn('ChatScreen: attachment send failed', err);
      setPendingAttachments(prev => prev.map(p => (p.id === localId ? { ...p, __status: 'error' } : p)));
    }
  };

  const retryAttachment = async (localId) => {
    const item = pendingAttachments.find(p => p.id === localId);
    if (!item || !chatId) return;
    setPendingAttachments(prev => prev.map(p => (p.id === localId ? { ...p, __status: 'uploading' } : p)));
    try {
      await sendAttachmentMessage(chatId, myUid, conversation.uid, {
        type: item.type, uri: item.uri, fileName: item.fileName, fileSize: item.fileSize, mimeType: item.mimeType,
      });
      setPendingAttachments(prev => prev.filter(p => p.id !== localId));
    } catch (err) {
      console.warn('ChatScreen: attachment retry failed', err);
      setPendingAttachments(prev => prev.map(p => (p.id === localId ? { ...p, __status: 'error' } : p)));
    }
  };

  const handlePickPhotoLibrary = async () => {
    setAttachSheetOpen(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo access needed', 'Please allow photo library access to attach images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.length) return;
      for (const asset of result.assets) {
        // eslint-disable-next-line no-await-in-loop
        await sendAttachment('image', asset);
      }
    } catch (_) {
      Alert.alert('Could not open photo library', 'Please try again.');
    }
  };

  const handlePickCamera = async () => {
    setAttachSheetOpen(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera access needed', 'Please allow camera access to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      await sendAttachment('image', result.assets[0]);
    } catch (_) {
      Alert.alert('Could not open camera', 'Please try again.');
    }
  };

  const handlePickDocument = async () => {
    setAttachSheetOpen(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      await sendAttachment('file', result.assets[0]);
    } catch (_) {
      Alert.alert('Could not open document picker', 'Please try again.');
    }
  };

  const openFile = async (uri) => {
    try {
      const supported = await Linking.canOpenURL(uri);
      if (!supported) { Alert.alert('Could not open file', 'No app available to open this file.'); return; }
      await Linking.openURL(uri);
    } catch (_) {
      Alert.alert('Could not open file', 'Please try again.');
    }
  };

  const otherReadAt = conversation.isDemo
    ? demoLastReadByOther
    : (chatMeta?.lastReadAt?.[conversation.uid]?.toDate?.() || null);
  const available = otherProfile ? otherProfile.available === true : !!conversation.online;
  const photoUri = otherProfile?.photoUri || conversation.photoUri || null;
  const verified = !!otherProfile?.verified;

  // Pending (still-uploading/failed) attachments are appended after synced
  // messages so they show at the bottom while sending, same as a normal send.
  const combinedMessages = useMemo(() => [...messages, ...pendingAttachments], [messages, pendingAttachments]);
  const listData = useMemo(() => buildListData(combinedMessages), [combinedMessages]);

  const openImageViewer = (item) => {
    const imgs = combinedMessages.filter(m => m.type === 'image' && m.uri && m.__status !== 'error');
    const idx = imgs.findIndex(m => m.id === item.id);
    setViewer({ visible: true, photos: imgs.map(m => m.uri), index: idx >= 0 ? idx : 0 });
  };
  const closeViewer = () => setViewer(v => ({ ...v, visible: false }));

  return (
    <View style={cs.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={cs.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
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
        {!conversation.isDemo && (
          <TouchableOpacity style={cs.moreBtn} onPress={handleMenuPress} activeOpacity={0.7}>
            <Text style={cs.moreIcon}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Android relies on windowSoftInputMode="adjustResize" (app.json's
          android.softwareKeyboardLayoutMode) to resize the whole screen for
          the keyboard, so KeyboardAvoidingView is left inert there — giving
          it a 'height'/'padding' behavior too would double-compensate and
          leave a large empty gap above the input bar. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
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
              if (item.type === 'image') {
                return (
                  <ImageBubble
                    item={item}
                    isSent={isSent}
                    isRead={isRead}
                    onPress={() => openImageViewer(item)}
                    onRetry={() => retryAttachment(item.id)}
                  />
                );
              }
              if (item.type === 'file') {
                return (
                  <FileBubble
                    item={item}
                    isSent={isSent}
                    isRead={isRead}
                    onPress={() => openFile(item.uri)}
                    onRetry={() => retryAttachment(item.id)}
                  />
                );
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

        {/* ── Input bar — frozen (existing messages stay visible, but no new
            ones either direction) once either side has blocked the other ── */}
        {isBlocked ? (
          <View style={[cs.blockedBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <Text style={cs.blockedBarText}>
              {iBlockedThem ? 'You blocked this user' : 'This conversation is unavailable'}
            </Text>
          </View>
        ) : (
          <View style={[cs.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <TouchableOpacity style={cs.plusBtn} onPress={() => setAttachSheetOpen(true)} activeOpacity={0.7}>
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
        )}
      </KeyboardAvoidingView>

      <AttachmentSheet
        visible={attachSheetOpen}
        onClose={() => setAttachSheetOpen(false)}
        onPhotoLibrary={handlePickPhotoLibrary}
        onCamera={handlePickCamera}
        onDocument={handlePickDocument}
        insets={insets}
      />

      <PhotoViewer
        visible={viewer.visible}
        photos={viewer.photos}
        initialIndex={viewer.index}
        onClose={closeViewer}
      />
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
  moreBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  moreIcon: { fontSize: 20, lineHeight: 24, fontWeight: '700', color: DARK },
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

  // ── Image message bubble
  imageBubble: { padding: 4, maxWidth: '65%' },
  imageWrap: {
    width: 200, height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: FILL,
  },
  image: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  imageRetryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // ── File message bubble
  fileBubble: { minWidth: 190 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fileIcon: { fontSize: 17 },
  fileName: { fontSize: 13, fontWeight: '700', color: DARK },
  fileSize: { fontSize: 11, color: LIGHT, fontWeight: '500', marginTop: 2 },
  retryInlineText: { fontSize: 10, fontWeight: '700', color: '#B00020', marginLeft: 4 },

  // ── Attachment sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 10,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER,
    alignSelf: 'center', marginBottom: 14,
  },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 10 },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: BORDER,
  },
  sheetIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetIconText: { fontSize: 18 },
  sheetLabel: { fontSize: 14, fontWeight: '600', color: DARK },
  sheetCancelBtn: {
    marginTop: 12, height: 46, borderRadius: 12, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetCancelText: { fontSize: 14, fontWeight: '700', color: DARK },

  // ── Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10, opacity: 0.6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 4 },
  emptySub: { fontSize: 13, color: LIGHT, textAlign: 'center', paddingHorizontal: 32 },

  // ── Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  blockedBar: {
    backgroundColor: FILL, paddingHorizontal: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: BORDER, alignItems: 'center',
  },
  blockedBarText: { fontSize: 13, color: MID, fontWeight: '600' },
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
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: DARK,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 15, color: '#FFFFFF' },
});
