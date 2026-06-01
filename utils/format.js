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

/**
 * Normalises a numeric value into a valid transaction-amount string, matching the
 * exact rules the amount keypad enforces while typing:
 *   - never negative
 *   - at most 2 decimal places
 *   - at most 14 integer digits
 *   - plain decimal string (no exponent), trailing zeros trimmed
 *
 * Used so the calculator exports the same kind of value as manual entry.
 */
export const MAX_AMOUNT = 99999999999999.99; // 14 integer digits + 2 decimals

export const normalizeAmount = (value) => {
  let n = Number(value);
  if (!isFinite(n)) return "";
  if (n < 0) n = 0;
  if (n > MAX_AMOUNT) n = MAX_AMOUNT;
  n = Math.round(n * 100) / 100; // clamp to 2 decimals
  let s = n.toFixed(2);
  // trim trailing zeros to match how typed values are stored ("25.50" → "25.5", "25.00" → "25")
  s = s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return s;
};
