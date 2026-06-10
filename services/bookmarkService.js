import { db } from '../config/firebase';
import {
  doc, setDoc, deleteDoc, getDoc,
  getDocs, collection, serverTimestamp,
} from 'firebase/firestore';

export const addBookmark = async (myUid, profile) => {
  await setDoc(doc(db, 'bookmarks', myUid, 'items', profile.uid), {
    uid: profile.uid,
    name: profile.name || profile.companyName || 'Unknown',
    profileType: profile.profileType || '',
    category: profile.category || profile.designation || profile.workerSkill || '',
    city: profile.city || '',
    state: profile.state || '',
    savedAt: serverTimestamp(),
  });
};

export const removeBookmark = async (myUid, profileUid) => {
  await deleteDoc(doc(db, 'bookmarks', myUid, 'items', profileUid));
};

export const isBookmarked = async (myUid, profileUid) => {
  try {
    const snap = await getDoc(doc(db, 'bookmarks', myUid, 'items', profileUid));
    return snap.exists();
  } catch (_) {
    return false;
  }
};

export const toggleBookmark = async (myUid, profile) => {
  const saved = await isBookmarked(myUid, profile.uid);
  if (saved) {
    await removeBookmark(myUid, profile.uid);
    return false;
  } else {
    await addBookmark(myUid, profile);
    return true;
  }
};

export const getBookmarks = async (myUid) => {
  try {
    const snap = await getDocs(collection(db, 'bookmarks', myUid, 'items'));
    return snap.docs.map(d => ({ ...d.data() }));
  } catch (_) {
    return [];
  }
};
