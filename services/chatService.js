import { db } from '../config/firebase';
import {
  collection, addDoc, query, orderBy, limit, startAfter,
  onSnapshot, doc, setDoc, getDoc, updateDoc, serverTimestamp, getDocs, increment,
} from 'firebase/firestore';

const MESSAGE_PAGE_SIZE = 30;

const mapMessageDoc = (d) => {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    timestamp: data.timestamp?.toDate?.() || null,
  };
};

export const sendMessage = async (chatId, message, senderUid, recipientUid) => {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text: message,
    sender: senderUid,
    timestamp: serverTimestamp(),
  });
  // Update last message + who sent it (drives "You: " prefix and read-tick
  // display in ChatListScreen) and bump the recipient's unread counter.
  const update = {
    lastMessage: message,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderUid,
  };
  if (recipientUid) {
    update[`unreadCount.${recipientUid}`] = increment(1);
  }
  await updateDoc(doc(db, 'chats', chatId), update).catch(() => {});
};

// Shares a work record as a distinct message type — ChatScreen renders these
// as a card instead of a text bubble. `record` needs { id, projectName,
// workArea, contractValue }.
export const sendWorkRecordMessage = async (chatId, senderUid, recipientUid, record) => {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    type: 'work_record',
    workRecordId: record.id,
    projectName: record.projectName || '',
    workArea: record.workArea || '',
    contractValue: record.contractValue ?? null,
    sender: senderUid,
    timestamp: serverTimestamp(),
  });
  const update = {
    lastMessage: '📄 Work record shared',
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderUid,
  };
  if (recipientUid) {
    update[`unreadCount.${recipientUid}`] = increment(1);
  }
  await updateDoc(doc(db, 'chats', chatId), update).catch(() => {});
};

// Clears the current user's unread count and records when they last opened
// the chat — a sent message counts as "read" once lastReadAt[otherUid] is at
// or after that message's timestamp, which both ChatListScreen and
// ChatScreen use to decide whether to show read-receipt ticks.
export const markChatRead = async (chatId, uid) => {
  if (!chatId || !uid) return;
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCount.${uid}`]: 0,
    [`lastReadAt.${uid}`]: serverTimestamp(),
  }).catch(() => {});
};

// Live updates for the chat document itself (lastReadAt, unreadCount) — used
// to drive per-message read-tick colour in ChatScreen without needing a
// separate `read` flag on every message.
export const subscribeToChat = (chatId, callback) => {
  return onSnapshot(doc(db, 'chats', chatId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, () => callback(null));
};

// Real-time window of the most recent messages (oldest→newest). Returns the
// unsubscribe function; `onCursor` receives the oldest loaded doc snapshot so
// older pages can be fetched with `getOlderMessages` as the user scrolls up.
export const subscribeToRecentMessages = (chatId, onMessages, onCursor) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(MESSAGE_PAGE_SIZE)
  );
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.slice().reverse();
    onMessages(docs.map(mapMessageDoc));
    onCursor(snap.docs[snap.docs.length - 1] || null, snap.docs.length === MESSAGE_PAGE_SIZE);
  });
};

// One-shot fetch of the next older page, given the oldest doc snapshot
// currently loaded.
export const getOlderMessages = async (chatId, beforeDocSnap) => {
  if (!beforeDocSnap) return { messages: [], cursor: null, hasMore: false };
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'desc'),
    startAfter(beforeDocSnap),
    limit(MESSAGE_PAGE_SIZE)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.slice().reverse();
  return {
    messages: docs.map(mapMessageDoc),
    cursor: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === MESSAGE_PAGE_SIZE,
  };
};

export const getUserChats = async (userId) => {
  const snap = await getDocs(collection(db, 'chats'));
  return snap.docs
    .filter(d => {
      const data = d.data();
      return data.participants && data.participants.includes(userId);
    })
    .map(d => ({ id: d.id, ...d.data() }));
};

export const createChat = async (user1, user2) => {
  const chatId = [user1.uid, user2.uid].sort().join('_');
  const chatRef = doc(db, 'chats', chatId);
  const existing = await getDoc(chatRef);
  if (!existing.exists()) {
    await setDoc(chatRef, {
      participants: [user1.uid, user2.uid],
      participantNames: {
        [user1.uid]: user1.name,
        [user2.uid]: user2.name,
      },
      createdAt: serverTimestamp(),
      lastMessage: '',
    });
  }
  return chatId;
};
