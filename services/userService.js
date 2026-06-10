import { db } from '../config/firebase';
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, where, getDocs, increment,
} from 'firebase/firestore';

export const saveProfile = async (uid, profileData) => {
  await setDoc(doc(db, 'users', uid), {
    ...profileData,
    uid,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

export const getProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const updateProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const getAllUsers = async (profileType, category) => {
  try {
    let q;
    if (category) {
      q = query(
        collection(db, 'users'),
        where('profileType', '==', profileType),
        where('category', '==', category)
      );
    } else {
      q = query(collection(db, 'users'), where('profileType', '==', profileType));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const getUserById = async (uid) => {
  return getProfile(uid);
};

export const recordProfileView = async (viewedUid, viewerUid) => {
  if (!viewedUid || viewedUid === viewerUid) return;
  try {
    await updateDoc(doc(db, 'users', viewedUid), {
      profileViews: increment(1),
    });
  } catch (_) {}
};

export const searchUsers = async (searchQuery) => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const q = searchQuery.toLowerCase().trim();
    return snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => {
        const name = (u.name || u.companyName || '').toLowerCase();
        const cat = (u.category || u.designation || u.workerSkill || u.supplierCategory || '').toLowerCase();
        const pt = (u.profileType || '').toLowerCase();
        const city = (u.city || '').toLowerCase();
        return name.includes(q) || cat.includes(q) || pt.includes(q) || city.includes(q);
      });
  } catch (_) {
    return [];
  }
};
