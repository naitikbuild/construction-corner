import { db } from '../config/firebase';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc, writeBatch, getDocs,
  serverTimestamp, addDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const subscribeNotifications = (uid, callback) => {
  const q = query(
    collection(db, 'notifications', uid, 'items'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(items);
  }, () => callback([]));
};

export const markNotificationRead = async (uid, notifId) => {
  try {
    await updateDoc(doc(db, 'notifications', uid, 'items', notifId), { read: true });
  } catch (_) {}
};

export const markAllNotificationsRead = async (uid) => {
  try {
    const snap = await getDocs(collection(db, 'notifications', uid, 'items'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      if (!d.data().read) batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (_) {}
};

export const deleteNotification = async (uid, notifId) => {
  try {
    await deleteDoc(doc(db, 'notifications', uid, 'items', notifId));
  } catch (_) {}
};

export const deleteAllNotifications = async (uid) => {
  try {
    const snap = await getDocs(collection(db, 'notifications', uid, 'items'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (_) {}
};

export const sendNotification = async (uid, type, message, extra = {}) => {
  try {
    await addDoc(collection(db, 'notifications', uid, 'items'), {
      type,
      message,
      read: false,
      createdAt: serverTimestamp(),
      ...extra,
    });
  } catch (_) {}
};

// ─── Guest notifications (AsyncStorage) ────────────────────────────────────
// Guests have no Firebase Auth session, so notifications live on-device instead.
// Items are stored in the same shape a Firestore item would have after
// subscribeNotifications() maps it: { id, type, message, read, createdAt, ... }.

const GUEST_NOTIFS_KEY = 'guestNotifications';

export const getGuestNotifications = async () => {
  try {
    const raw = await AsyncStorage.getItem(GUEST_NOTIFS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
};

const saveGuestNotifications = async (list) => {
  try {
    await AsyncStorage.setItem(GUEST_NOTIFS_KEY, JSON.stringify(list));
  } catch (_) {}
};

export const addGuestNotification = async (type, message, extra = {}) => {
  const list = await getGuestNotifications();
  const item = {
    id: `guest_notif_${Date.now()}`,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    ...extra,
  };
  await saveGuestNotifications([item, ...list]);
  return item.id;
};

export const markGuestNotificationRead = async (notifId) => {
  const list = await getGuestNotifications();
  await saveGuestNotifications(list.map(n => (n.id === notifId ? { ...n, read: true } : n)));
};

export const markAllGuestNotificationsRead = async () => {
  const list = await getGuestNotifications();
  await saveGuestNotifications(list.map(n => ({ ...n, read: true })));
};

export const deleteGuestNotification = async (notifId) => {
  const list = await getGuestNotifications();
  await saveGuestNotifications(list.filter(n => n.id !== notifId));
};

export const clearGuestNotifications = async () => {
  await saveGuestNotifications([]);
};
