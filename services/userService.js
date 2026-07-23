import { db } from '../config/firebase';
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, where, getDocs, increment,
} from 'firebase/firestore';
import { DEMO_MODE } from '../config/demoMode';
import { DEMO_PROFILES, getDemoProfile, isDemoUid } from '../demoData';

export const saveProfile = async (uid, profileData) => {
  await setDoc(doc(db, 'users', uid), {
    ...profileData,
    uid,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

export const getProfile = async (uid) => {
  if (DEMO_MODE && isDemoUid(uid)) {
    return getDemoProfile(uid);
  }
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const updateProfile = async (uid, data) => {
  if (DEMO_MODE && isDemoUid(uid)) return; // demo profiles are read-only fixtures
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const getAllUsers = async (profileType, category) => {
  let results = [];
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
    results = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (e) {
    results = [];
  }

  if (DEMO_MODE) {
    const demoMatches = DEMO_PROFILES.filter(
      p => p.profileType === profileType && (!category || p.category === category)
    );
    results = [...demoMatches, ...results];
  }

  return results;
};

export const getUserById = async (uid) => {
  return getProfile(uid);
};

export const recordProfileView = async (viewedUid, viewerUid) => {
  if (!viewedUid || viewedUid === viewerUid) return;
  if (DEMO_MODE && isDemoUid(viewedUid)) return; // demo profiles have no Firestore doc to update
  try {
    await updateDoc(doc(db, 'users', viewedUid), {
      profileViews: increment(1),
    });
  } catch (_) {}
};

function matchesSearchQuery(u, q) {
  const name = (u.name || u.companyName || '').toLowerCase();
  const cat = (u.category || u.designation || u.workerSkill || u.supplierCategory || '').toLowerCase();
  const primarySkill = (u.primarySkill || '').toLowerCase();
  const skillTags = (u.skillTags || []).map(s => s.toLowerCase());
  const pt = (u.profileType || '').toLowerCase();
  const city = (u.city || '').toLowerCase();
  return name.includes(q) || cat.includes(q) || primarySkill.includes(q) ||
         skillTags.some(s => s.includes(q)) || pt.includes(q) || city.includes(q);
}

export const searchUsers = async (searchQuery) => {
  const q = searchQuery.toLowerCase().trim().replace(/^#+/, '');
  let results = [];
  try {
    const snap = await getDocs(collection(db, 'users'));
    results = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => matchesSearchQuery(u, q));
  } catch (_) {
    results = [];
  }

  if (DEMO_MODE) {
    results = [...DEMO_PROFILES.filter(u => matchesSearchQuery(u, q)), ...results];
  }

  return results;
};
