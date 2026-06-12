import { db } from '../config/firebase';
import {
  collection, addDoc, doc, getDoc, updateDoc,
  getDocs, query, where, serverTimestamp, increment,
} from 'firebase/firestore';

export const markWorkComplete = async (workData) => {
  const ref = await addDoc(collection(db, 'pending_work'), {
    ...workData,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  // Notify the service provider
  if (workData.providerId) {
    await addDoc(collection(db, 'notifications', workData.providerId, 'items'), {
      type: 'work_confirm',
      message: `${workData.customerName || 'Customer'} marked work complete — ₹${workData.amount}`,
      workId: ref.id,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
  return ref.id;
};

export const confirmWork = async (workId, commission) => {
  const pendingRef = doc(db, 'pending_work', workId);
  const pendingSnap = await getDoc(pendingRef);
  if (!pendingSnap.exists()) throw new Error('Work record not found');

  const workData = pendingSnap.data();
  await addDoc(collection(db, 'verified_work'), {
    ...workData,
    commission,
    status: 'verified',
    verifiedAt: serverTimestamp(),
  });
  await updateDoc(pendingRef, { status: 'confirmed' });

  // Update provider's totalVerifiedAmount on their profile
  if (workData.providerId) {
    await updateDoc(doc(db, 'users', workData.providerId), {
      totalVerifiedAmount: increment(workData.amount || 0),
    }).catch(() => {});
  }

  if (workData.customerId) {
    await addDoc(collection(db, 'notifications', workData.customerId, 'items'), {
      type: 'work_verified',
      message: `${workData.providerName || 'Service provider'} confirmed your work record — ₹${workData.amount}`,
      workId,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
};

export const getVerifiedWork = async (uid) => {
  const q = query(collection(db, 'verified_work'), where('providerId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getPendingWork = async (uid) => {
  const q = query(
    collection(db, 'pending_work'),
    where('providerId', '==', uid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getTotalVerifiedAmount = async (uid) => {
  const works = await getVerifiedWork(uid);
  return works.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
};
