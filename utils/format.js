// Formats a rupee amount using Indian K/L/Cr notation, e.g. 85000 -> "₹85K",
// 1850000 -> "₹18.5L", 34000000 -> "₹3.4Cr".
export function formatAmountIndian(amount) {
  const n = Number(amount) || 0;

  const trim = (num) => {
    const rounded = Math.round(num * 10) / 10;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  };

  if (n < 1000) return `₹${n}`;
  if (n < 1_00_000) return `₹${trim(n / 1000)}K`;
  if (n < 1_00_00_000) return `₹${trim(n / 1_00_000)}L`;
  return `₹${trim(n / 1_00_00_000)}Cr`;
}

// Formats a byte count for display, e.g. 850 -> "850 B", 245000 -> "239 KB",
// 3800000 -> "3.6 MB".
export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Accepts an ISO string, JS Date, or Firestore Timestamp (has .toDate()).
// Returns null for anything missing/unparseable.
function toJsDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// "Joined March 2026" for a profile hero. Returns null (hide the line) if
// createdAt is missing/invalid.
export function formatJoinedDate(createdAt) {
  const d = toJsDate(createdAt);
  return d ? `Joined ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}` : null;
}

// True if the account was created within the last month — used to show a
// "New" label instead of ₹0 stats for providers with no completed jobs yet.
// Missing/invalid createdAt is treated as NOT recent (show real stats).
export function isRecentJoin(createdAt) {
  const d = toJsDate(createdAt);
  if (!d) return false;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return d.getTime() > oneMonthAgo.getTime();
}
