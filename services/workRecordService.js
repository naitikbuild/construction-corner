import { db } from '../config/firebase';
import {
  collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, serverTimestamp,
} from 'firebase/firestore';
import { DEMO_MODE } from '../config/demoMode';
import { isDemoUid } from '../demoData';

// New Work Record system — replaces pending_work/verified_work for the
// provider-authored "agreed job" flow. Records start as editable 'draft'
// docs in `work_records` and move through a fixed lifecycle:
//
//   draft            → fully editable by the provider only, never shown elsewhere
//   sent_to_client   → provider marked it complete and sent it to the client for
//                      confirmation, but it is NOT locked — the provider can still
//                      edit every field in case something needs correcting before
//                      the client confirms
//   confirmed        → the CLIENT confirmed + rated; counts toward verified totals.
//                      All fields lock EXCEPT the work amount (contractValue /
//                      labourCharge), which stays editable — a correction "bucket"
//                      for mistakes before commission is paid
//   completed_paid   → commission paid; permanently locked, nothing editable
//                      (the payment flow itself isn't built yet — this status
//                      just reserves the end of the amount-editable window)
//   disputed         → client raised an issue instead of confirming; permanently
//                      locked, does not count toward verified totals
//
// The client reaches 'confirmed' or 'disputed' from ClientWorkRecordReviewScreen
// (+ RateWorkRecordScreen for confirm) — see confirmWorkRecord/disputeWorkRecord
// below. Verified totals and the "VERIFIED PROJECTS" stat row must only count
// 'confirmed' (and, later, 'completed_paid') records.
export const WORK_RECORD_STATUS = {
  DRAFT: 'draft',
  SENT_TO_CLIENT: 'sent_to_client',
  CONFIRMED: 'confirmed',
  COMPLETED_PAID: 'completed_paid',
  DISPUTED: 'disputed',
};
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
    category: data.category || '',
    location: data.location || '',
    keywords: data.keywords || [],
    plannedStart: data.plannedStart || null,
    plannedFinish: data.plannedFinish || null,
    contractValue: data.contractValue ?? null,
    labourCharge: data.labourCharge ?? null,
    photos: data.photos || [],
    status: WORK_RECORD_STATUS.DRAFT,
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

// Marks a record complete and sends it to the client: saves the latest field
// edits and flips status to 'sent_to_client' in one write. NOT a hard lock —
// the provider can keep editing every field (see CreateWorkRecordScreen's
// editability rules) right up until the client confirms. Does NOT touch
// verified-work totals; that only happens once a client confirms the record.
export const lockWorkRecord = async (recordId, data, { lockedBy, lockedByName }) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    ...data,
    status: WORK_RECORD_STATUS.SENT_TO_CLIENT,
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

// Every non-draft work record for a provider (sent_to_client, confirmed,
// completed_paid, disputed) — everything worth showing on their real profile.
// Drafts are excluded: they're private, in-progress edits the provider
// hasn't marked complete yet. Demo profiles have no real `work_records`
// docs — their projects come from the demoData.js fixtures instead — so
// this always returns [] for a demo uid.
export const getProviderWorkRecords = async (providerId) => {
  if (!providerId || (DEMO_MODE && isDemoUid(providerId))) return [];
  const q = query(collection(db, 'work_records'), where('providerId', '==', providerId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.status !== WORK_RECORD_STATUS.DRAFT);
};

// Every work record for a provider, INCLUDING drafts — for the provider's own
// "My Work Records" list (see MyWorkRecordsScreen), where an in-progress
// draft needs to stay findable instead of being orphaned. Never use this for
// anything shown on someone else's profile — only getProviderWorkRecords
// (drafts excluded) is meant for that.
export const getAllProviderWorkRecords = async (providerId) => {
  if (!providerId || (DEMO_MODE && isDemoUid(providerId))) return [];
  const q = query(collection(db, 'work_records'), where('providerId', '==', providerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Maps a work_record doc to the "project" shape ProjectsList/AllProjectsModal/
// ProjectDetailModal already render (see demoData.js's `projects` fixtures
// for the same shape). Only 'confirmed'/'completed_paid' records are truly
// DONE; anything still awaiting client action reads as ONGOING — there's no
// separate "pending confirmation" badge in those shared components yet.
export const workRecordToProject = (record) => ({
  id: record.id,
  name: record.projectName || '',
  location: record.location || '',
  category: record.category || '',
  keywords: record.keywords || [],
  value: record.contractValue || 0,
  status: (record.status === WORK_RECORD_STATUS.CONFIRMED || record.status === WORK_RECORD_STATUS.COMPLETED_PAID) ? 'done' : 'ongoing',
  photoUri: record.photos?.[0] || null,
  clientReview: record.review || '',
  workArea: record.workArea || '',
  plannedStart: record.plannedStart || null,
  plannedFinish: record.plannedFinish || null,
  recordStatus: record.status,
});

// Client confirms a locked record: stores their overall rating, the 4
// per-category ratings, written review and any review photos, and flips
// status to 'confirmed'. From this point on the record counts toward the
// provider's verified totals (via workRecordToVerifiedWork) and shows as
// DONE in Verified Projects (via workRecordToProject).
export const confirmWorkRecord = async (recordId, { rating, categoryRatings, review, reviewPhotos, confirmedBy }) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    status: WORK_RECORD_STATUS.CONFIRMED,
    rating: rating || 0,
    categoryRatings: categoryRatings || {},
    review: (review || '').trim(),
    reviewPhotos: reviewPhotos || [],
    confirmedAt: serverTimestamp(),
    confirmedBy: confirmedBy || null,
    updatedAt: serverTimestamp(),
  });
};

// Client raises an issue instead of confirming — flips status to 'disputed'.
// Doesn't touch verified totals; a disputed record never counts.
export const disputeWorkRecord = async (recordId, { disputedBy, reason }) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    status: WORK_RECORD_STATUS.DISPUTED,
    disputedAt: serverTimestamp(),
    disputedBy: disputedBy || null,
    disputeReason: (reason || '').trim(),
    updatedAt: serverTimestamp(),
  });
};

// Provider rates the client back, once (and only once) the client has
// confirmed the record. Stored as a nested `providerReview` — deliberately
// separate from the client's own `rating`/`review` fields above — so the two
// directions never collide. Per product decision this is shown ONLY on the
// client's own profile (via getClientReviews below), never on either
// work-record detail screen. Guards against a double-rate with a read first.
export const rateClient = async (recordId, { rating, categoryRatings, review, ratedBy }) => {
  const ref = doc(db, 'work_records', recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Work record not found.');
  if (snap.data().providerReview) throw new Error('You have already rated this client.');
  await updateDoc(ref, {
    providerReview: {
      rating: rating || 0,
      categoryRatings: categoryRatings || {},
      review: (review || '').trim(),
      ratedBy: ratedBy || null,
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
};

// Every work record where `clientUid` was the CLIENT and the provider left
// them a `providerReview` — i.e. this user's reputation AS a client, meant
// for their own profile (see RULES: never the work-record detail screens).
// Works for any profile type, since any user can be picked as a client.
export const getClientReviews = async (clientUid) => {
  if (!clientUid || (DEMO_MODE && isDemoUid(clientUid))) return [];
  const q = query(collection(db, 'work_records'), where('clientId', '==', clientUid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.providerReview && r.providerReview.rating > 0);
};

// Maps a CONFIRMED work_record to the shape the profile screens' verified-
// work stat row expects (same fields the legacy `verified_work` docs have —
// amount/rating/review/verifiedAt — so the existing rating-average/jobs-
// count/reviews-list logic keeps working unchanged for real accounts).
export const workRecordToVerifiedWork = (record) => ({
  id: record.id,
  amount: record.contractValue || 0,
  rating: record.rating || 0,
  review: record.review || '',
  customerName: record.clientName || '',
  workType: record.projectName || '',
  verifiedAt: record.confirmedAt || record.lockedAt || null,
  status: 'verified',
});
