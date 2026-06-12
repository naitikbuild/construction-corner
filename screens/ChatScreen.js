import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, StatusBar, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { sendMessage, getChatMessages, createChat } from '../services/chatService';

const ORANGE = '#FF6B2B';

// ─── Sample Messages per conversation ────────────────────────────────────────

const SAMPLE_MESSAGES = {
  '1': [ // Rahul Mehta — Civil Contractor
    { id: 'm1', text: 'Hello! Aapka profile dekha, bahut impressive hai', sent: false, time: '10:02 AM' },
    { id: 'm2', text: 'Thank you! Kaise help kar sakta hoon?', sent: true, time: '10:04 AM' },
    { id: 'm3', text: 'Site engineer chahiye tha apne project ke liye — Ahmedabad mein G+4 residential', sent: false, time: '10:05 AM' },
    { id: 'm4', text: 'Zaroor, project ka scope batao — kitne sqft aur timeline kya hai?', sent: true, time: '10:06 AM' },
    { id: 'm5', text: 'Around 4000 sqft hai, July se start karna hai. Budget ₹45K/month ka hai', sent: false, time: '10:08 AM' },
    { id: 'm6', text: 'Reasonable hai. Kal site visit ka plan kar sakte hain. Timing?', sent: true, time: '10:10 AM' },
    { id: 'm7', text: 'Site engineer ke baare mein baat karni thi, kya aap kal available hain?', sent: false, time: '10:12 AM' },
  ],
  '2': [ // Priya Agarwal — Architect
    { id: 'm1', text: 'Hi! Maine aapko ProfessionalList mein dekha, aapke portfolio se impressed hoon', sent: true, time: '9:30 AM' },
    { id: 'm2', text: 'Thank you! Kaunsa project tha aapka?', sent: false, time: '9:32 AM' },
    { id: 'm3', text: 'Bopal mein 3BHK ka interior — roughly 1800 sqft', sent: true, time: '9:33 AM' },
    { id: 'm4', text: 'Perfect! Mera rate ₹1,200/sqft hai for complete design. Site visit free hai', sent: false, time: '9:35 AM' },
    { id: 'm5', text: 'Sounds good. Kab available hain aap?', sent: true, time: '9:36 AM' },
    { id: 'm6', text: 'This Saturday 11am? Address share kar dena', sent: false, time: '9:38 AM' },
    { id: 'm7', text: 'Done! Address bhejta hoon aaj evening mein', sent: true, time: '9:40 AM' },
    { id: 'm8', text: 'Drawings ready ho gayi hain, please review karein aur feedback dein', sent: false, time: '11:15 AM' },
  ],
  '3': [ // Gujarat Cement Traders
    { id: 'm1', text: 'Hello, cement ka latest rate kya hai?', sent: true, time: '8:00 AM' },
    { id: 'm2', text: 'Good morning! OPC 53 Grade — ₹340/bag. PPC — ₹320/bag', sent: false, time: '8:05 AM' },
    { id: 'm3', text: 'Minimum order kitna?', sent: true, time: '8:06 AM' },
    { id: 'm4', text: '50 bags minimum. 100+ bags pe free delivery. GST separate', sent: false, time: '8:08 AM' },
    { id: 'm5', text: 'Ok, 200 bags OPC 53 chahiye. Delivery kab milegi?', sent: true, time: '8:10 AM' },
    { id: 'm6', text: 'Order aaj karo to kal tak delivery. Payment advance ya COD?', sent: false, time: '8:12 AM' },
    { id: 'm7', text: 'Aaj ki rate list bhejte hain. OPC 53 grade - ₹340/bag, delivery free above 100 bags', sent: false, time: '11:00 AM' },
  ],
  '4': [ // Suresh Patel
    { id: 'm1', text: 'Suresh bhai, construction ke liye quote chahiye tha', sent: true, time: 'Yesterday 3:00 PM' },
    { id: 'm2', text: 'Bilkul! Project details bhejo — location, area, floors?', sent: false, time: 'Yesterday 3:10 PM' },
    { id: 'm3', text: 'Gandhinagar, plot 200 sqyd, G+2 residential, budget 80L', sent: true, time: 'Yesterday 3:15 PM' },
    { id: 'm4', text: 'Comfortable budget hai. Kya turnkey chahiye ya just structure?', sent: false, time: 'Yesterday 3:20 PM' },
    { id: 'm5', text: 'Turnkey preferred. Kab de sakte ho rough estimate?', sent: true, time: 'Yesterday 3:22 PM' },
    { id: 'm6', text: 'Tender document share karo please, review karke batate hain', sent: false, time: 'Yesterday 5:45 PM' },
  ],
  '5': [ // Raj Steel Suppliers
    { id: 'm1', text: 'TMT bars ka rate kya chal raha hai?', sent: true, time: '2d ago 10:00 AM' },
    { id: 'm2', text: 'Fe 500D — ₹58/kg. Fe 550 — ₹62/kg. 10mm se 32mm available', sent: false, time: '2d ago 10:15 AM' },
    { id: 'm3', text: '5 MT Fe 500D chahiye — 12mm aur 16mm mix', sent: true, time: '2d ago 10:20 AM' },
    { id: 'm4', text: 'Stock available hai. Kal delivery possible hai Ahmedabad mein', sent: false, time: '2d ago 10:25 AM' },
    { id: 'm5', text: 'Price negotiable hai kya? 5 MT pe?', sent: true, time: '2d ago 10:30 AM' },
    { id: 'm6', text: '₹56/kg final kar sakte hain 5MT ke liye. Payment 50% advance', sent: false, time: '2d ago 10:45 AM' },
    { id: 'm7', text: 'Order confirm kar do jaldi, stock limited hai — Fe 500D available hai', sent: false, time: '2d ago 2:00 PM' },
  ],
  '6': [ // Ankit Sharma
    { id: 'm1', text: 'Hi Ankit! Living room ka 3D render ready hua?', sent: true, time: '3d ago 4:00 PM' },
    { id: 'm2', text: 'Ji! Kal tak ready ho jaayega. Koi changes hain?', sent: false, time: '3d ago 4:10 PM' },
    { id: 'm3', text: 'Sofa ka color change karna tha — grey se beige karo', sent: true, time: '3d ago 4:12 PM' },
    { id: 'm4', text: 'Done! 3D render ready hai, WhatsApp pe bhejta hoon', sent: false, time: '3d ago 6:30 PM' },
  ],
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isSent = message.sent;
  return (
    <View style={[styles.bubbleRow, isSent ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={[styles.bubbleText, isSent ? styles.bubbleTextSent : styles.bubbleTextReceived]}>
          {message.text}
        </Text>
        <Text style={[styles.bubbleTime, isSent ? styles.bubbleTimeSent : styles.bubbleTimeReceived]}>
          {message.time}{isSent ? '  ✓✓' : ''}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChatScreen({ navigation, route }) {
  const conversation = route?.params?.conversation || {
    id: '1',
    name: 'Rahul Mehta',
    role: 'Civil Contractor',
    emoji: '👷',
    avatarBg: '#EFF6FF',
    online: true,
  };

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [myUid, setMyUid] = useState(null);
  const [chatId, setChatId] = useState(null);
  const listRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    initChat();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const initChat = async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) return;
      setMyUid(uid);

      if (conversation.uid) {
        const myName = await AsyncStorage.getItem('userName') || 'Me';
        const id = await createChat(
          { uid, name: myName },
          { uid: conversation.uid, name: conversation.name }
        );
        setChatId(id);
        const unsub = getChatMessages(id, (msgs) => {
          const formatted = msgs.map(m => ({
            id: m.id,
            text: m.text,
            sent: m.sender === uid,
            time: m.timestamp
              ? new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : '',
          }));
          setMessages(formatted);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
        });
        unsubRef.current = unsub;
      }
    } catch (_) {}
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    const optimistic = {
      id: `opt_${Date.now()}`,
      text,
      sent: true,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    // Optimistic update for instant feedback
    if (!chatId) {
      setMessages(prev => [...prev, optimistic]);
    }
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    if (chatId && myUid) {
      try {
        await sendMessage(chatId, text, myUid);
      } catch (_) {
        // Message shown optimistically; fail silently
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ORANGE} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: conversation.avatarBg }]}>
          <Text style={styles.headerAvatarEmoji}>{conversation.emoji}</Text>
          {conversation.online && <View style={styles.headerOnlineDot} />}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{conversation.name}</Text>
          <Text style={styles.headerStatus}>
            {conversation.online ? '🟢 Online now' : '⚫ Offline'}
            {' · '}{conversation.role}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Text style={styles.headerActionIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowMenu(true)}>
            <Text style={styles.headerActionIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat date divider */}
      <View style={styles.dateDivider}>
        <View style={styles.dateDividerLine} />
        <Text style={styles.dateDividerText}>Today</Text>
        <View style={styles.dateDividerLine} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 }}>Start the conversation</Text>
              <Text style={{ fontSize: 13, color: '#888', textAlign: 'center', paddingHorizontal: 32 }}>
                Say hello to {conversation.name}!
              </Text>
            </View>
          }
        />

        {/* Mark Work Complete Banner */}
        <TouchableOpacity
          style={styles.markWorkBanner}
          onPress={() => navigation.navigate('MarkWorkComplete', { workerName: conversation.name, workerEmoji: conversation.emoji, workerRole: conversation.role, workerUid: conversation.uid })}
          activeOpacity={0.85}
        >
          <Text style={styles.markWorkIcon}>✅</Text>
          <View style={styles.markWorkInfo}>
            <Text style={styles.markWorkTitle}>Work completed with {conversation.name}?</Text>
            <Text style={styles.markWorkSub}>Mark it to build your verified profile</Text>
          </View>
          <Text style={styles.markWorkArrow}>›</Text>
        </TouchableOpacity>

        {/* Typing Indicator (decorative) */}
        {conversation.online && (
          <View style={styles.typingWrap}>
            <View style={[styles.typingAvatar, { backgroundColor: conversation.avatarBg }]}>
              <Text style={{ fontSize: 12 }}>{conversation.emoji}</Text>
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDots}>● ● ●</Text>
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#A0ADB8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* ─── 3-dot Menu Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('MarkWorkComplete', { workerName: conversation.name, workerEmoji: conversation.emoji, workerRole: conversation.role, workerUid: conversation.uid });
              }}
            >
              <Text style={styles.menuItemIcon}>✅</Text>
              <Text style={styles.menuItemText}>Mark Work Complete</Text>
            </TouchableOpacity>
            <View style={styles.menuSep} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemIcon}>🔕</Text>
              <Text style={styles.menuItemText}>Mute Notifications</Text>
            </TouchableOpacity>
            <View style={styles.menuSep} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemIcon}>🚫</Text>
              <Text style={[styles.menuItemText, { color: '#E11D48' }]}>Block</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: ORANGE,
    paddingTop: 52, paddingBottom: 14,
    paddingHorizontal: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: 'white', lineHeight: 30 },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  headerAvatarEmoji: { fontSize: 20 },
  headerOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#2ECC71', borderWidth: 2, borderColor: ORANGE,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: 'white', marginBottom: 2 },
  headerStatus: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 6 },
  headerActionBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerActionIcon: { fontSize: 18, color: 'white' },

  // Date divider
  dateDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  dateDividerLine: { flex: 1, height: 1, backgroundColor: '#EFEFEF' },
  dateDividerText: { fontSize: 11, fontWeight: '700', color: '#888' },

  // Messages
  messageList: { paddingHorizontal: 14, paddingBottom: 8, flexGrow: 1, justifyContent: 'flex-end' },
  bubbleRow: { marginBottom: 6 },
  bubbleRowLeft: { alignItems: 'flex-start' },
  bubbleRowRight: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  bubbleSent: { backgroundColor: ORANGE, borderBottomRightRadius: 4 },
  bubbleReceived: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextSent: { color: 'white' },
  bubbleTextReceived: { color: '#1A1A1A' },
  bubbleTime: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  bubbleTimeSent: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeReceived: { color: '#888' },

  // Typing indicator
  typingWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingBottom: 6,
  },
  typingAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  typingBubble: {
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  typingDots: { fontSize: 8, color: '#888', letterSpacing: 3 },

  // Mark work complete banner
  markWorkBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 14, marginBottom: 8, padding: 12,
    backgroundColor: '#F0FFF4', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#2ECC71',
  },
  markWorkIcon: { fontSize: 22 },
  markWorkInfo: { flex: 1 },
  markWorkTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A2E' },
  markWorkSub: { fontSize: 11, color: '#2ECC71', marginTop: 1 },
  markWorkArrow: { fontSize: 22, color: '#1A1A2E', fontWeight: '900' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1, borderTopColor: '#EFEFEF',
  },
  attachBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F5F0',
    alignItems: 'center', justifyContent: 'center',
  },
  attachIcon: { fontSize: 18 },
  textInput: {
    flex: 1, minHeight: 40, maxHeight: 110,
    backgroundColor: '#F5F5F0', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#1A1A1A', fontWeight: '500',
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: ORANGE,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#FFCBA8' },
  sendIcon: { fontSize: 16, color: 'white' },

  // 3-dot menu
  menuOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuDropdown: {
    position: 'absolute', top: 96, right: 14,
    backgroundColor: '#FFFFFF', borderRadius: 14, minWidth: 220,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuItemIcon: { fontSize: 18 },
  menuItemText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  menuSep: { height: 1, backgroundColor: '#EFEFEF', marginHorizontal: 14 },
});
