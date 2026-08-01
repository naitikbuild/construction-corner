import { db } from '../config/firebase';
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, where, getDocs, increment,
} from 'firebase/firestore';
import { DEMO_MODE } from '../config/demoMode';
import { DEMO_PROFILES, getDemoProfile, isDemoUid } from '../demoData';

// `createdAt` must only ever be set once, at true account creation — this is
// called on every profile save (including routine edits), so callers always
// pass a fresh "now" as a fallback. If the doc already has a createdAt (from
// its original save), that original value wins so a provider's "joined
// date" never drifts forward just because they edited their profile later.
export const saveProfile = async (uid, profileData) => {
  const ref = doc(db, 'users', uid);
  let createdAt = profileData.createdAt || new Date().toISOString();
  try {
    const existing = await getDoc(ref);
    if (existing.exists() && existing.data().createdAt) {
      createdAt = existing.data().createdAt;
    }
  } catch (_) {}

  await setDoc(ref, {
    ...profileData,
    uid,
    createdAt,
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
    // Fetch by profileType only — category matching (primary OR extra
    // skills/services/tools) happens client-side below via categoryMatchTier,
    // same "fetch broad, filter locally" pattern searchUsers already uses.
    const q = query(collection(db, 'users'), where('profileType', '==', profileType));
    const snap = await getDocs(q);
    results = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (e) {
    results = [];
  }

  if (DEMO_MODE) {
    const demoMatches = DEMO_PROFILES.filter(p => p.profileType === profileType);
    results = [...demoMatches, ...results];
  }

  if (category) {
    results = results
      .map(u => ({ ...u, __categoryTier: categoryMatchTier(u, category) }))
      .filter(u => u.__categoryTier > 0);
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

// ─── Search matching ────────────────────────────────────────────────────────
// A provider's PRIMARY skill/category always ranks above one who only matches
// via extra skills/services/tools, which in turn ranks above one who only
// matches via a verified PROJECT's "Type of work" tags — e.g. a Contractor
// whose primary is "RCC Contractor" but who lists "Waterproofing" as a
// service/extra skill should still show up for a "waterproofing" search
// (above a mason who merely did "Italian Marble" work on one project, but
// below a primary "Waterproofing Contractor"). `matchTier`/`categoryMatchTier`
// return that priority (3 = primary/name/city, 2 = extra-only,
// 1 = project-type-of-work-only, 0 = no match) so callers can sort on it
// before applying the normal verified/revenue/rating ranking.

function norm(s) {
  return (s || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

// One provider's PRIMARY skill/category, across every profile type — worker
// (primarySkill/workerSkill), contractor (category/contractorType),
// professional (designation/category). Irrelevant fields are just undefined
// for a given type and drop out harmlessly.
function primaryFields(u) {
  return [u.category, u.designation, u.workerSkill, u.primarySkill, u.contractorType, u.supplierCategory, u.companyType]
    .filter(Boolean)
    .map(norm);
}

// Everything a provider ALSO offers beyond their primary — worker skillTags,
// contractor services/otherSkills/skillTags, professional extraSkills/
// services/tools/skillTags.
function extraFields(u) {
  const arrays = [u.skillTags, u.otherSkills, u.extraSkills, u.services, u.tools];
  return arrays.filter(Array.isArray).flat().filter(Boolean).map(norm);
}

function nameCityFields(u) {
  return [u.name, u.companyName, u.city, u.area].filter(Boolean).map(norm);
}

// "Type of work" tags, name, and category on this provider's verified
// projects (see CreateWorkRecordScreen's "Type of work" field; keywords
// stored as `keywords` on the project) — the lowest-priority match source,
// since it's about ONE project rather than the provider's stated skillset.
// This is also what guarantees a provider shows up in the fetched result set
// at all when only a project (not their skills) matches — the Projects tab
// (see SearchScreen.js) then does its own finer per-project matching/ranking
// on top of that same fetched set.
function projectFields(u) {
  const projects = Array.isArray(u.projects) ? u.projects : [];
  return projects
    .flatMap(p => [...(Array.isArray(p.keywords) ? p.keywords : []), p.name, p.category])
    .filter(Boolean)
    .map(norm);
}

function matchesAny(fields, q) {
  return fields.some(f => f.includes(q));
}

// Free-text search: primary skill, name, and city all count as a top-tier
// (3) match; extra skills/services/tools are tier 2; a match found only in a
// verified project's "Type of work" tags is tier 1; no match is 0.
export function matchTier(u, query) {
  const q = norm(query);
  if (!q) return 3;
  if (matchesAny(primaryFields(u), q) || matchesAny(nameCityFields(u), q)) return 3;
  if (matchesAny(extraFields(u), q)) return 2;
  if (matchesAny(projectFields(u), q)) return 1;
  return 0;
}

// Category listings: only primary vs. extra skill/service/tool fields count
// (a name/city coincidentally containing the category text shouldn't count).
function categoryMatchTier(u, category) {
  const q = norm(category);
  if (!q) return 2;
  if (matchesAny(primaryFields(u), q)) return 2;
  if (matchesAny(extraFields(u), q)) return 1;
  return 0;
}

export const searchUsers = async (searchQuery) => {
  const q = searchQuery.replace(/^#+/, '');
  let results = [];
  try {
    const snap = await getDocs(collection(db, 'users'));
    results = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .map(u => ({ ...u, __matchTier: matchTier(u, q) }))
      .filter(u => u.__matchTier > 0);
  } catch (_) {
    results = [];
  }

  if (DEMO_MODE) {
    const demoMatches = DEMO_PROFILES
      .map(u => ({ ...u, __matchTier: matchTier(u, q) }))
      .filter(u => u.__matchTier > 0);
    results = [...demoMatches, ...results];
  }

  return results;
};
