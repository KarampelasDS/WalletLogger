// Built-in currency catalogue — the set always available to add in the app.
// Single source of truth used by onboarding, the Add Currency screen, and the
// importer (so importing never removes currencies from the catalogue).

export const CURRENCY_CATALOGUE = [
  { name: "Euro", symbol: "€", shorthand: "EUR" },
  { name: "US Dollar", symbol: "$", shorthand: "USD" },
  { name: "British Pound", symbol: "£", shorthand: "GBP" },
  { name: "Japanese Yen", symbol: "¥", shorthand: "JPY" },
  { name: "Swiss Franc", symbol: "CHF", shorthand: "CHF" },
  { name: "Canadian Dollar", symbol: "C$", shorthand: "CAD" },
  { name: "Australian Dollar", symbol: "A$", shorthand: "AUD" },
  { name: "Chinese Yuan", symbol: "CN¥", shorthand: "CNY" },
  { name: "Indian Rupee", symbol: "₹", shorthand: "INR" },
  { name: "Mexican Peso", symbol: "MX$", shorthand: "MXN" },
  { name: "Brazilian Real", symbol: "R$", shorthand: "BRL" },
  { name: "Russian Ruble", symbol: "₽", shorthand: "RUB" },
  { name: "Polish Złoty", symbol: "zł", shorthand: "PLN" },
  { name: "Czech Koruna", symbol: "Kč", shorthand: "CZK" },
  { name: "Hungarian Forint", symbol: "Ft", shorthand: "HUF" },
  { name: "Danish Krone", symbol: "kr", shorthand: "DKK" },
  { name: "Swedish Krona", symbol: "kr", shorthand: "SEK" },
  { name: "Norwegian Krone", symbol: "kr", shorthand: "NOK" },
  { name: "Icelandic Króna", symbol: "kr", shorthand: "ISK" },
  { name: "Bulgarian Lev", symbol: "лв", shorthand: "BGN" },
  { name: "Romanian Leu", symbol: "lei", shorthand: "RON" },
  { name: "Turkish Lira", symbol: "₺", shorthand: "TRY" },
  { name: "Israeli Shekel", symbol: "₪", shorthand: "ILS" },
  { name: "South African Rand", symbol: "R", shorthand: "ZAR" },
  { name: "Singapore Dollar", symbol: "S$", shorthand: "SGD" },
  { name: "New Zealand Dollar", symbol: "NZ$", shorthand: "NZD" },
  { name: "South Korean Won", symbol: "₩", shorthand: "KRW" },
  { name: "Honk Kong Dollar", symbol: "HK$", shorthand: "HKD" },
  { name: "Croatian Kuna", symbol: "kn", shorthand: "HRK" },
  { name: "Indonesian Rupiah", symbol: "Rp", shorthand: "IDR" },
  { name: "Malaysian Ringgit", symbol: "RM", shorthand: "MYR" },
  { name: "Philippine Peso", symbol: "₱", shorthand: "PHP" },
  { name: "Thai Baht", symbol: "฿", shorthand: "THB" },
];

/**
 * Ensure every catalogue currency exists in the `currencies` master table.
 * Self-heals installs whose catalogue was previously gutted (e.g. by an older
 * import). Matches by shorthand so it never creates duplicates.
 */
export async function ensureCurrencyCatalogue(db) {
  if (!db) return;
  const existing = await db.getAllAsync(
    "SELECT currency_shorthand FROM currencies"
  );
  const have = new Set(
    existing.map((r) => (r.currency_shorthand || "").toUpperCase())
  );
  let order = existing.length;
  for (const c of CURRENCY_CATALOGUE) {
    if (have.has(c.shorthand.toUpperCase())) continue;
    await db.runAsync(
      "INSERT INTO currencies (currency_name, currency_symbol, currency_shorthand, currency_order) VALUES (?, ?, ?, ?)",
      [c.name, c.symbol, c.shorthand, order++]
    );
  }
}
