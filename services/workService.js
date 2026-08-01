import { db } from '../config/firebase';
import {
  collection, addDoc, doc, getDoc, updateDoc,
  getDocs, query, where, serverTimestamp, increment,
} from 'firebase/firestore';
import { DEMO_MODE } from '../config/demoMode';
import { getDemoProfile, isDemoUid } from '../demoData';

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
  if (DEMO_MODE && isDemoUid(uid)) {
    const demo = getDemoProfile(uid);
    return demo?.demoVerifiedWork || [];
  }
  const q = query(collection(db, 'verified_work'), where('providerId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getPendingWork = async (uid) => {
  if (DEMO_MODE && isDemoUid(uid)) return []; // demo profiles have no pending bookings
  const q = query(
    collection(db, 'pending_work'),
    where('providerId', '==', uid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getTotalVerifiedAmount = async (uid) => {
  if (DEMO_MODE && isDemoUid(uid)) {
    const demo = getDemoProfile(uid);
    return demo?.demoVerifiedAmount || 0;
  }
  const works = await getVerifiedWork(uid);
  return works.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
};

// All services a client has booked — pending confirmation + verified — most recent first.
export const getWorkByCustomer = async (uid) => {
  const [pendingSnap, verifiedSnap] = await Promise.all([
    getDocs(query(collection(db, 'pending_work'), where('customerId', '==', uid))),
    getDocs(query(collection(db, 'verified_work'), where('customerId', '==', uid))),
  ]);
  const pending = pendingSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(w => w.status === 'pending');
  const verified = verifiedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const all = [...pending, ...verified];
  all.sort((a, b) => {
    const at = a.verifiedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
    const bt = b.verifiedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });
  return all;
};
