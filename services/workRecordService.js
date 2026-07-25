import { db } from '../config/firebase';
import {
  collection, addDoc, doc, updateDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { DEMO_MODE } from '../config/demoMode';
import { isDemoUid } from '../demoData';

// New Work Record system — replaces pending_work/verified_work for the
// provider-authored "agreed job" flow. Records start as editable 'draft'
// docs in `work_records`; locking/confirmation/rating happen in later work.
export const createWorkRecord = async (providerId, data) => {
  if (DEMO_MODE && isDemoUid(providerId)) throw new Error('Demo profiles cannot create work records.');
  const ref = await addDoc(collection(db, 'work_records'), {
    providerId,
    clientId: data.clientId,
    clientName: data.clientName || '',
    clientPhoto: data.clientPhoto || '',
    clientRole: data.clientRole || '',
    projectName: data.projectName,
    workArea: data.workArea || '',
    plannedStart: data.plannedStart || null,
    plannedFinish: data.plannedFinish || null,
    contractValue: data.contractValue ?? null,
    labourCharge: data.labourCharge ?? null,
    photos: data.photos || [],
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateWorkRecord = async (recordId, data) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Permanently locks a record: saves the latest field edits and flips status
// to 'locked' in one write. Irreversible — there is no unlock path. Does NOT
// touch verified-work totals; that only happens after client confirmation
// and commission payment, which are not built yet.
export const lockWorkRecord = async (recordId, data, { lockedBy, lockedByName }) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    ...data,
    status: 'locked',
    lockedAt: serverTimestamp(),
    lockedBy,
    lockedByName: lockedByName || '',
    updatedAt: serverTimestamp(),
  });
};

export const getWorkRecord = async (recordId) => {
  const snap = await getDoc(doc(db, 'work_records', recordId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
