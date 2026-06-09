import { db } from '../config/firebase';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, writeBatch, getDocs,
  serverTimestamp, addDoc,
} from 'firebase/firestore';

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
