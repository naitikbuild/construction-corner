import { db } from '../config/firebase';
import {
  collection, addDoc, getDocs, doc, getDoc,
  updateDoc, arrayUnion, serverTimestamp,
} from 'firebase/firestore';

export const postJob = async (jobData) => {
  const ref = await addDoc(collection(db, 'jobs'), {
    ...jobData,
    applicants: [],
    postedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getAllJobs = async (filters = {}) => {
  const snap = await getDocs(collection(db, 'jobs'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const applyForJob = async (jobId, userId) => {
  await updateDoc(doc(db, 'jobs', jobId), {
    applicants: arrayUnion(userId),
  });
};

export const getJobById = async (jobId) => {
  const snap = await getDoc(doc(db, 'jobs', jobId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
