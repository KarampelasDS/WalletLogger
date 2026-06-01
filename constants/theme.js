/**
 * Central color palette — single source of truth for the app's styling.
 *
 * Primary actions (buttons, FABs, active states) use `primary` (purple).
 * Destructive actions use `danger` (red).
 * Income / Expense / Transfer keep their fixed semantic colors and must not change.
 */
export const COLORS = {
  // Surfaces
  bg:       "#1A1B25", // screen background
  card:     "#2C2E42", // cards / panels
  cardAlt:  "#393B50", // raised / active card
  border:   "#3a3a4a",

  // Text
  text:      "#fff",
  textMuted: "#aaa",
  textFaint: "#888",

  // Brand accent / primary actions
  primary:         "#734BE9",
  primaryDisabled: "#3A3556",
  // Lighter lavender tint — secondary accent (currency symbols, dates, selections)
  accent:          "#A78BFA",

  // Semantic (transaction types) — DO NOT change
  income:   "#4EA758",
  expense:  "#CD5D5D",
  transfer: "#734BE9",

  // Destructive
  danger:         "#CD5D5D",
  dangerDisabled: "#4a3236",
};
