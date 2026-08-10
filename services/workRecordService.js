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
//                                  Not a dead end for the provider though —
//                                  same as 'draft', it's fully editable and
//                                  deletable; editing and resending goes
//                                  through sendWorkToClient again, which
//                                  flips it back to pending_start_approval.
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
  // Only reached for a record with a partner — sits BEFORE
  // pending_start_approval in the lifecycle: the client is never notified
  // until the partner approves the split (see sendForPartnerApproval /
  // approvePartnerSplit below). A solo record (no partner) skips this
  // entirely, same as before.
  PENDING_PARTNER_APPROVAL: 'pending_partner_approval',
  PENDING_START_APPROVAL: 'pending_start_approval',
  ONGOING: 'ongoing',
  REJECTED: 'rejected',
  // Partner declined the split — mirrors REJECTED (client declining the
  // start): not shown as ongoing, fully editable/deletable, provider can fix
  // the partner/split and resend.
  PARTNER_DECLINED: 'partner_declined',
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
    // Optional partnership — see CreateWorkRecordScreen's Partner section.
    // partnerApprovalStatus is separate from the client-facing `status`
    // lifecycle above; 'pending' vs null (never 'approved'/'declined' yet —
    // that flow doesn't exist until a later prompt).
    partnerId: data.partnerId ?? null,
    partnerName: data.partnerName ?? null,
    providerSharePct: data.providerSharePct ?? null,
    partnerSharePct: data.partnerSharePct ?? null,
    partnerApprovalStatus: data.partnerApprovalStatus ?? null,
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

// Provider sends a record that HAS a partner: saves the latest field edits
// and routes it to the PARTNER first instead of the client — reuses the same
// lockedAt/lockedBy/lockedByName fields as sendWorkToClient (here meaning
// "when/who sent this for partner approval"). The client is not notified at
// this point; see approvePartnerSplit below for what happens once the
// partner responds.
export const sendForPartnerApproval = async (recordId, data, { sentBy, sentByName }) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    ...data,
    status: WORK_RECORD_STATUS.PENDING_PARTNER_APPROVAL,
    partnerApprovalStatus: 'pending',
    lockedAt: serverTimestamp(),
    lockedBy: sentBy,
    lockedByName: sentByName || '',
    updatedAt: serverTimestamp(),
  });
};

// Partner approves their split — the record can now proceed to the client
// for start approval, same as a solo record always has (see
// PartnerApprovalScreen, which sends the client the 'work_start_request'
// notification right after calling this).
export const approvePartnerSplit = async (recordId, approvedBy) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    status: WORK_RECORD_STATUS.PENDING_START_APPROVAL,
    partnerApprovalStatus: 'approved',
    partnerApprovedAt: serverTimestamp(),
    partnerApprovedBy: approvedBy || null,
    updatedAt: serverTimestamp(),
  });
};

// Partner declines the split — the record never reaches the client. Mirrors
// rejectWorkStart below: fully editable/deletable, the provider can change
// the partner or split and resend (back through sendForPartnerApproval).
export const declinePartnerSplit = async (recordId, declinedBy) => {
  await updateDoc(doc(db, 'work_records', recordId), {
    status: WORK_RECORD_STATUS.PARTNER_DECLINED,
    partnerApprovalStatus: 'declined',
    partnerDeclinedAt: serverTimestamp(),
    partnerDeclinedBy: declinedBy || null,
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

// Statuses the provider can still freely rewrite or discard entirely: a
// DRAFT was never sent, a REJECTED record's client declined to start, and a
// PARTNER_DECLINED record's partner declined the split — none of these are
// part of any engagement/verified/dispute trail yet, so all three stay
// deletable and (see CreateWorkRecordScreen) fully editable, same rules.
// Everything past that (pending_start/partner_approval onward) is part of
// that trail and must never be deletable.
const DELETABLE_STATUSES = [WORK_RECORD_STATUS.DRAFT, WORK_RECORD_STATUS.REJECTED, WORK_RECORD_STATUS.PARTNER_DECLINED];

// Permanently discards a draft or a rejected record the provider decided not
// to pursue (edit-and-resend instead goes through sendWorkToClient, not
// this). Ownership + status are both re-checked against the live doc (not
// whatever the caller thinks the status is) so this can't be used to delete
// someone else's record or a record that changed status mid-flight.
export const deleteWorkRecord = async (recordId, requestingUid) => {
  const ref = doc(db, 'work_records', recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const rec = snap.data();
  if (rec.providerId !== requestingUid) throw new Error('You can only delete your own work records.');
  if (!DELETABLE_STATUSES.includes(rec.status)) throw new Error('Only draft or declined work records can be deleted.');
  await deleteDoc(ref);
};

export const getWorkRecord = async (recordId) => {
  const snap = await getDoc(doc(db, 'work_records', recordId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Every work record for a provider worth showing on their real profile:
// ongoing, pending_completion_approval, verified, completed_paid, disputed.
// Excluded: 'draft' (private, still being filled in), 'pending_partner_approval'
// (awaiting the partner — not even sent to the client yet), 'pending_start_approval'
// (sent but not yet approved — not ongoing yet), 'rejected' (client declined
// to start) and 'partner_declined' (partner declined the split) — none ever
// shown, publicly or as ongoing. Demo profiles have no real `work_records`
// docs — their projects come from the demoData.js fixtures instead — so this
// always returns [] for a demo uid.
const HIDDEN_FROM_PROFILE = [
  WORK_RECORD_STATUS.DRAFT,
  WORK_RECORD_STATUS.PENDING_PARTNER_APPROVAL,
  WORK_RECORD_STATUS.PENDING_START_APPROVAL,
  WORK_RECORD_STATUS.REJECTED,
  WORK_RECORD_STATUS.PARTNER_DECLINED,
];
export const getProviderWorkRecords = async (providerId) => {
  if (!providerId || (DEMO_MODE && isDemoUid(providerId))) return [];
  const q = query(collection(db, 'work_records'), where('providerId', '==', providerId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => !HIDDEN_FROM_PROFILE.includes(r.status));
};

// Every work record where `uid` is an APPROVED partner — a record a
// provider merely proposed (partnerApprovalStatus 'pending') or that was
// declined never appears here or anywhere on the partner's profile (see the
// REVENUE SPLIT rules on getWorkRecordShareAmount below). Same
// HIDDEN_FROM_PROFILE filter as getProviderWorkRecords for symmetry — an
// ongoing partnered project should show as ONGOING on the partner's profile
// too, not just appear once verified.
export const getPartnerWorkRecords = async (uid) => {
  if (!uid || (DEMO_MODE && isDemoUid(uid))) return [];
  const q = query(
    collection(db, 'work_records'),
    where('partnerId', '==', uid),
    where('partnerApprovalStatus', '==', 'approved')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => !HIDDEN_FROM_PROFILE.includes(r.status));
};

// Every real work record `uid` is a party to — either as the lead provider,
// or (once approved) as the partner. A record can never match both queries
// for the same uid (the partner picker excludes the provider themselves —
// see CreateWorkRecordScreen), so no dedup is needed. Every profile screen's
// PROJECTS section and verified-revenue stat row should read from this
// (not getProviderWorkRecords directly) so a partner sees their share of a
// partnered record even though they're not its providerId.
export const getPartyWorkRecords = async (uid) => {
  const [asProvider, asPartner] = await Promise.all([
    getProviderWorkRecords(uid),
    getPartnerWorkRecords(uid),
  ]);
  return [...asProvider, ...asPartner];
};

// This record's labour-charge revenue attributable to `uid` — the single
// source of truth for the split so every screen's number agrees. Solo (no
// partner, or a partner that hasn't approved) always attributes the full
// amount to the provider and nothing to anyone else — pending/declined
// partners get nothing, per spec. An approved partner splits it by the
// agreed percentages; anyone who is neither this record's provider nor its
// approved partner gets 0.
export const getWorkRecordShareAmount = (record, uid) => {
  const labour = record.labourCharge || 0;
  const hasApprovedPartner = !!record.partnerId && record.partnerApprovalStatus === 'approved';
  if (!hasApprovedPartner) {
    return uid && uid === record.providerId ? labour : 0;
  }
  if (uid === record.providerId) return labour * (record.providerSharePct || 0) / 100;
  if (uid === record.partnerId) return labour * (record.partnerSharePct || 0) / 100;
  return 0;
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

// Every work record where `uid` is named as the partner, REGARDLESS of
// partnerApprovalStatus — for the partner's own "My Work Records" list (see
// MyWorkRecordsScreen), where a still-pending or already-declined
// partnership needs to stay visible so the partner can act on or review it.
// Unlike getPartnerWorkRecords (approved-only, used for the public profile),
// this deliberately includes 'pending_partner_approval' and
// 'partner_declined'. The one status excluded is 'draft' — the provider
// hasn't sent it yet, so the partner shouldn't see it at all until they do
// (mirrors why getAllProviderWorkRecords is never used for anyone but the
// provider themselves).
export const getAllPartnerWorkRecords = async (uid) => {
  if (!uid || (DEMO_MODE && isDemoUid(uid))) return [];
  const q = query(collection(db, 'work_records'), where('partnerId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.status !== WORK_RECORD_STATUS.DRAFT);
};

// Maps a work_record doc to the "project" shape ProjectsList/AllProjectsModal/
// ProjectDetailModal already render (see demoData.js's `projects` fixtures
// for the same shape). Only 'verified'/'completed_paid' records are truly
// DONE; everything else getProviderWorkRecords returns (ongoing,
// pending_completion_approval, disputed) reads as ONGOING — there's no
// separate "pending confirmation" badge in those shared components yet.
// 'pending_start_approval' and 'rejected' records never reach this function
// at all — getProviderWorkRecords filters them out before the profile ever
// sees them. `uid` is whichever profile this project is being shown ON —
// needed to compute `myShareAmount` for a partnered record (see
// getWorkRecordShareAmount) so it reads correctly whether this is the
// provider's or the partner's own profile. `value` (contract value) is
// deliberately NEVER split — only the labour-charge revenue is.
export const workRecordToProject = (record, uid) => ({
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
  // Partnership metadata — only meaningful once isPartnership is true (a
  // merely-pending partner never reaches a real profile at all, see
  // HIDDEN_FROM_PROFILE, so there's no "proposed split" state to render here).
  isPartnership: !!record.partnerId && record.partnerApprovalStatus === 'approved',
  providerName: record.lockedByName || '',
  providerSharePct: record.providerSharePct ?? null,
  providerShareAmount: getWorkRecordShareAmount(record, record.providerId),
  partnerName: record.partnerName || '',
  partnerSharePct: record.partnerSharePct ?? null,
  partnerShareAmount: record.partnerId ? getWorkRecordShareAmount(record, record.partnerId) : 0,
  labourCharge: record.labourCharge || 0,
  myShareAmount: getWorkRecordShareAmount(record, uid),
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
// `amount` is `uid`'s SHARE of the labour charge (see
// getWorkRecordShareAmount) — the full amount when solo, split by the
// agreed percentage when there's an approved partner — never the contract
// value, which still only shows on the record detail for context. `rating`
// is always the client's FULL rating, never split — both the provider and
// an approved partner get the exact same rating on this same record.
export const workRecordToVerifiedWork = (record, uid) => ({
  id: record.id,
  amount: getWorkRecordShareAmount(record, uid),
  rating: record.rating || 0,
  review: record.review || '',
  customerName: record.clientName || '',
  workType: record.projectName || '',
  verifiedAt: record.confirmedAt || record.lockedAt || null,
  status: 'verified',
});
