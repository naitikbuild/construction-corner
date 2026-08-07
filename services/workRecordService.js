import { db } from '../config/firebase';
import {
  collection, addDoc, doc, updateDoc, deleteDoc, getDoc, getDocs, query, where, serverTimestamp,
} from 'firebase/firestore';
import { DEMO_MODE } from '../config/demoMode';
import { isDemoUid } from '../demoData';

// Work Record system — replaces pending_work/verified_work for the
// provider-authored "agreed job" flow. TWO-APPROVAL lifecycle: the client
// approves the START of the engagement before it counts as ongoing, and
// separately confirms the COMPLETION before it counts as verified.
//
//   draft                       → private to the provider, being filled in.
//                                  Client not notified, never shown elsewhere.
//   pending_start_approval      → provider sent it. Client notified to approve
//                                  the engagement. NOT shown as ongoing yet.
//   ongoing                     → client approved the start. Shows as an
//                                  ONGOING project on the provider's profile.
//                                  Still fully editable (amount, photos,
//                                  details) — see sendWorkToClient/
//                                  approveWorkStart below.
//   rejected                    → client declined the start approval. Not
//                                  shown as ongoing (or anywhere public).
//   pending_completion_approval → provider marked the work complete (see
//                                  markWorkComplete below). Client notified
//                                  to confirm + rate. Still fully editable by
//                                  the provider, same as pending_start_approval
//                                  — nothing locks until the client acts.
//   verified                    → the CLIENT confirmed + rated the completed
//                                  work; counts toward verified totals. All
//                                  fields lock EXCEPT the work amount
//                                  (contractValue / labourCharge), which
//                                  stays editable — a correction "bucket" for
//                                  mistakes before commission is paid.
//   completed_paid               → commission paid; permanently locked,
//                                  nothing editable (the payment flow itself
//                                  isn't built yet — this status just
//                                  reserves the end of the amount-editable
//                                  window).
//   disputed                    → client raised an issue with a completed
//                                  record instead of confirming; permanently
//                                  locked, does not count toward verified
//                                  totals. Distinct from 'rejected' (which is
//                                  about declining the START, not disputing a
//                                  finished job).
//
// completed_paid/verified/disputed are reached from
// ClientWorkRecordReviewScreen (+ RateWorkRecordScreen for confirm) — see
// confirmWorkRecord/disputeWorkRecord below. Verified totals and the
// "VERIFIED PROJECTS" stat row must only count 'verified' (and, later,
// 'completed_paid') records.
export const WORK_RECORD_STATUS = {
  DRAFT: 'draft',
  PENDING_START_APPROVAL: 'pending_start_approval',
  ONGOING: 'ongoing',
  REJECTED: 'rejected',
  PENDING_COMPLETION_APPROVAL: 'pending_completion_approval',
  VERIFIED: 'verified',
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

// Saves the latest field edits and sends the record to the client for START
// approval: flips status to 'pending_start_approval' in one write. NOT a
// lock — the provider can keep editing every field (see
// CreateWorkRecordScreen's editability rules) right through
// 'pending_start_approval' and 'ongoing', up until they mark it complete
// (next phase). Reuses the lockedAt/lockedBy/lockedByName field names from
// the single-approval version of this flow — they now mean "when/who sent
// this for start approval" rather than "locked".
export const sendWorkToClient = async (recordId, data, { lockedBy, lockedByName }) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    ...data,
    status: WORK_RECORD_STATUS.PENDING_START_APPROVAL,
    lockedAt: serverTimestamp(),
    lockedBy,
    lockedByName: lockedByName || '',
    updatedAt: serverTimestamp(),
  });
};

// Client approves the start of the engagement — flips status to 'ongoing'.
// From this point the record shows as an ONGOING project on the provider's
// profile (see getProviderWorkRecords/workRecordToProject) and remains fully
// editable by the provider.
export const approveWorkStart = async (recordId, approvedBy) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    status: WORK_RECORD_STATUS.ONGOING,
    startApprovedAt: serverTimestamp(),
    startApprovedBy: approvedBy || null,
    updatedAt: serverTimestamp(),
  });
};

// Client declines the start approval — flips status to 'rejected'. Never
// shown as ongoing, never shown on the public profile at all (see
// getProviderWorkRecords). Distinct from disputeWorkRecord below, which is
// about disputing a COMPLETED job, not declining to start one.
export const rejectWorkStart = async (recordId, rejectedBy) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    status: WORK_RECORD_STATUS.REJECTED,
    startRejectedAt: serverTimestamp(),
    startRejectedBy: rejectedBy || null,
    updatedAt: serverTimestamp(),
  });
};

// Provider marks an ONGOING record complete: saves the latest field edits
// and sends it to the client for COMPLETION approval in one write. Like
// sendWorkToClient, this is NOT a lock — the provider can keep editing every
// field right through 'pending_completion_approval', up until the client
// confirms (see CreateWorkRecordScreen's editability rules).
export const markWorkComplete = async (recordId, data, { completedBy, completedByName }) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    ...data,
    status: WORK_RECORD_STATUS.PENDING_COMPLETION_APPROVAL,
    completedAt: serverTimestamp(),
    completedBy,
    completedByName: completedByName || '',
    updatedAt: serverTimestamp(),
  });
};

// Permanently discards a draft the provider decided not to pursue. Scoped to
// DRAFT only — once a record has been sent to the client
// (pending_start_approval) or they've acted on it (ongoing/rejected/
// confirmed/completed_paid/disputed), it's part of the engagement/verified/
// dispute trail and must never be deletable, only the lifecycle transitions
// above. Ownership + status are both re-checked against the live doc (not
// whatever the caller thinks the status is) so this can't be used to delete
// someone else's record or a record that changed status mid-flight.
export const deleteWorkRecord = async (recordId, requestingUid) => {
  const ref = doc(db, 'work_records', recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const rec = snap.data();
  if (rec.providerId !== requestingUid) throw new Error('You can only delete your own work records.');
  if (rec.status !== WORK_RECORD_STATUS.DRAFT) throw new Error('Only draft work records can be deleted.');
  await deleteDoc(ref);
};

export const getWorkRecord = async (recordId) => {
  const snap = await getDoc(doc(db, 'work_records', recordId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Every work record for a provider worth showing on their real profile:
// ongoing, pending_completion_approval, verified, completed_paid, disputed.
// Excluded: 'draft' (private, still being filled in), 'pending_start_approval'
// (sent but not yet approved — not ongoing yet) and 'rejected' (client
// declined to start — never shown, publicly or as ongoing). Demo profiles
// have no real `work_records` docs — their projects come from the
// demoData.js fixtures instead — so this always returns [] for a demo uid.
const HIDDEN_FROM_PROFILE = [
  WORK_RECORD_STATUS.DRAFT,
  WORK_RECORD_STATUS.PENDING_START_APPROVAL,
  WORK_RECORD_STATUS.REJECTED,
];
export const getProviderWorkRecords = async (providerId) => {
  if (!providerId || (DEMO_MODE && isDemoUid(providerId))) return [];
  const q = query(collection(db, 'work_records'), where('providerId', '==', providerId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => !HIDDEN_FROM_PROFILE.includes(r.status));
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
// for the same shape). Only 'verified'/'completed_paid' records are truly
// DONE; everything else getProviderWorkRecords returns (ongoing,
// pending_completion_approval, disputed) reads as ONGOING — there's no
// separate "pending confirmation" badge in those shared components yet.
// 'pending_start_approval' and 'rejected' records never reach this function
// at all — getProviderWorkRecords filters them out before the profile ever
// sees them.
export const workRecordToProject = (record) => ({
  id: record.id,
  name: record.projectName || '',
  location: record.location || '',
  category: record.category || '',
  keywords: record.keywords || [],
  value: record.contractValue || 0,
  status: (record.status === WORK_RECORD_STATUS.VERIFIED || record.status === WORK_RECORD_STATUS.COMPLETED_PAID) ? 'done' : 'ongoing',
  photoUri: record.photos?.[0] || null,
  clientReview: record.review || '',
  workArea: record.workArea || '',
  plannedStart: record.plannedStart || null,
  plannedFinish: record.plannedFinish || null,
  recordStatus: record.status,
});

// Client confirms a completed record: stores their overall rating, the 4
// per-category ratings, written review and any review photos, and flips
// status to 'verified'. From this point on the record counts toward the
// provider's verified totals (via workRecordToVerifiedWork) and shows as
// DONE in Verified Projects (via workRecordToProject).
export const confirmWorkRecord = async (recordId, { rating, categoryRatings, review, reviewPhotos, confirmedBy }) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    status: WORK_RECORD_STATUS.VERIFIED,
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

// Maps a VERIFIED work_record to the shape the profile screens' verified-
// work stat row expects (same fields the legacy `verified_work` docs have —
// amount/rating/review/verifiedAt — so the existing rating-average/jobs-
// count/reviews-list logic keeps working unchanged for real accounts).
// `amount` is the LABOUR CHARGE, not the contract value — verified
// Revenue is what the provider actually earned (labour), not the full
// project value, which still only shows on the record detail for context.
export const workRecordToVerifiedWork = (record) => ({
  id: record.id,
  amount: record.labourCharge || 0,
  rating: record.rating || 0,
  review: record.review || '',
  customerName: record.clientName || '',
  workType: record.projectName || '',
  verifiedAt: record.confirmedAt || record.lockedAt || null,
  status: 'verified',
});
