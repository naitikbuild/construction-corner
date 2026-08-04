// Shared provider ranking — the "Best match" formula and its building blocks
// (plus the sort-menu options and distance math) live here once so Search
// and every category listing (CategoryListScreen) rank providers exactly the
// same way instead of drifting apart as separate copies.

export function verifiedAmountNum(u) {
  return Number(u.totalVerifiedAmount ?? u.demoVerifiedAmount ?? 0) || 0;
}

export function jobsCountNum(u) {
  return Number(u.jobsCompleted ?? 0) || 0;
}

export function hasVerifiedWork(u) {
  return jobsCountNum(u) > 0 || verifiedAmountNum(u) > 0;
}

export function ratingNum(u) {
  const r = Number(u.rating);
  return Number.isFinite(r) ? r : 0;
}

export function onTimeNum(u) {
  const n = parseFloat(u.onTimeRate);
  return Number.isFinite(n) ? n : -1;
}

// "Best match" — the default ranking, tuned for construction: verified work
// (proven, app-confirmed jobs) outranks unverified every time; among verified
// (or among unverified) providers, higher revenue wins since it reflects
// consistent, repeat work rather than a single lucky job; then rating, then
// on-time reliability; available-now providers get a final nudge ahead of
// otherwise-equal peers. New providers with zero revenue/no verified work
// still sort in — just toward the bottom — never filtered out.
export function bestMatchCompare(a, b) {
  const av = hasVerifiedWork(a) ? 1 : 0;
  const bv = hasVerifiedWork(b) ? 1 : 0;
  if (av !== bv) return bv - av;

  const arev = verifiedAmountNum(a), brev = verifiedAmountNum(b);
  if (arev !== brev) return brev - arev;

  const ar = ratingNum(a), br = ratingNum(b);
  if (ar !== br) return br - ar;

  const aot = onTimeNum(a), bot = onTimeNum(b);
  if (aot !== bot) return bot - aot;

  const aa = a.available === true ? 1 : 0;
  const ba = b.available === true ? 1 : 0;
  return ba - aa;
}

export function hasCoords(u) {
  return typeof u.lat === 'number' && typeof u.lng === 'number';
}

// Great-circle distance in km between two lat/lng points.
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Distance-first comparator, ties broken by verified work then revenue — used
// whenever the searcher/browser's coordinates are known and distance-based
// ranking applies ("Nearest" sort, or Search's "near me" mode).
export function distanceCompare(a, b) {
  if (a.__km != null && b.__km != null && a.__km !== b.__km) return a.__km - b.__km;
  if (a.__km != null && b.__km == null) return -1;
  if (a.__km == null && b.__km != null) return 1;
  return bestMatchCompare(a, b);
}

export const SORT_OPTIONS = [
  { key: 'best', label: 'Best match' },
  { key: 'nearest', label: 'Nearest' },
  { key: 'revenue', label: 'Highest revenue' },
  { key: 'rating', label: 'Highest rated' },
  { key: 'jobs', label: 'Most jobs' },
];

// Resolves the compare function for a chosen sort key. `useDistancePrimary`
// should be true only when the caller actually has the viewer's coordinates
// AND distance-based ranking should apply — otherwise 'nearest' (and 'best'
// when distance mode isn't active) fall back to bestMatchCompare.
export function compareForSort(sortBy, { useDistancePrimary } = {}) {
  if (useDistancePrimary) return distanceCompare;
  if (sortBy === 'revenue') return (a, b) => verifiedAmountNum(b) - verifiedAmountNum(a);
  if (sortBy === 'rating') return (a, b) => ratingNum(b) - ratingNum(a);
  if (sortBy === 'jobs') return (a, b) => jobsCountNum(b) - jobsCountNum(a);
  return bestMatchCompare;
}
