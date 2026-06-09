import { db } from '../config/firebase';
import {
  collection, addDoc, query, orderBy,
  onSnapshot, doc, setDoc, getDoc, updateDoc, serverTimestamp, getDocs,
} from 'firebase/firestore';

export const sendMessage = async (chatId, message, senderUid) => {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text: message,
    sender: senderUid,
    timestamp: serverTimestamp(),
  });
  // Update last message in chat document
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: message,
    lastMessageAt: serverTimestamp(),
  }).catch(() => {});
};

export const getChatMessages = (chatId, callback) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(messages);
  });
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
