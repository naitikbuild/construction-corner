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
