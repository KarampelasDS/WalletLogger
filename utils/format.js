/**
 * Formats a currency amount with suffix abbreviation for large values,
 * keeping output short enough to fit any UI container without font scaling hacks.
 *
 * 666               → "666.00"
 * 1,234,567         → "1.23M"
 * 9,999,999,999,334 → "10.00T"
 */
export const fmtAmount = (n) => {
  const num = Number(n);
  if (!isFinite(num)) return "0.00";
  const abs = Math.abs(num);
  const opts = { maximumFractionDigits: 2, minimumFractionDigits: 2 };
  if (abs >= 1e12) return (num / 1e12).toLocaleString("en-US", opts) + "T";
  if (abs >= 1e9)  return (num / 1e9).toLocaleString("en-US", opts)  + "B";
  if (abs >= 1e6)  return (num / 1e6).toLocaleString("en-US", opts)  + "M";
  return num.toLocaleString("en-US", opts);
};
