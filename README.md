# Wallet Logger

<p align="center">
  <img src="assets/logo.svg" alt="Wallet Logger logo" width="96" height="96" />
</p>

<p align="center">
  <strong>A private, offline-first, multi-currency expense manager for Android - Track income, expenses and transfers across accounts, then understand where your money goes. Your financial data never leaves your device.</strong>
</p>

<p align="center">
  <a href="https://github.com/KarampelasDS/WalletLogger/releases"><img alt="Download" src="https://img.shields.io/badge/Download-APK-4EA758?style=for-the-badge&logo=android&logoColor=white" /></a>
  <img alt="Privacy" src="https://img.shields.io/badge/100%25_Offline-No_Account_·_No_Tracking-4EA758?style=for-the-badge&logo=android&logoColor=white" />
</p>

<p align="center">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img alt="React Native" src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=111827" />
  <img alt="Expo Router" src="https://img.shields.io/badge/Expo_Router-6-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-5-1a1a1d?style=for-the-badge" />
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-expo--sqlite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
</p>

<p align="center">
  <a href="#premise"><img alt="Premise" src="https://img.shields.io/badge/Premise-1a1a1d?style=for-the-badge" /></a>
  <a href="#feature-highlights"><img alt="Features" src="https://img.shields.io/badge/Features-1a1a1d?style=for-the-badge" /></a>
  <a href="#tech-stack"><img alt="Tech Stack" src="https://img.shields.io/badge/Tech_Stack-1a1a1d?style=for-the-badge" /></a>
  <a href="#install-the-apk"><img alt="Install" src="https://img.shields.io/badge/Install-1a1a1d?style=for-the-badge" /></a>
  <a href="#local-setup"><img alt="Local Setup" src="https://img.shields.io/badge/Local_Setup-1a1a1d?style=for-the-badge" /></a>
  <a href="#how-it-works--end-to-end"><img alt="How It Works" src="https://img.shields.io/badge/How_It_Works-1a1a1d?style=for-the-badge" /></a>
  <a href="#backup-import--export"><img alt="Backup & Import" src="https://img.shields.io/badge/Backup_&_Import-1a1a1d?style=for-the-badge" /></a>
  <a href="#database-schema"><img alt="Database" src="https://img.shields.io/badge/Database-1a1a1d?style=for-the-badge" /></a>
  <a href="#app-structure"><img alt="App Structure" src="https://img.shields.io/badge/App_Structure-1a1a1d?style=for-the-badge" /></a>
  <a href="#ownership"><img alt="Ownership" src="https://img.shields.io/badge/Ownership-1a1a1d?style=for-the-badge" /></a>
</p>

---

## Premise

Most budgeting apps assume a single currency, push your spending history to a cloud account, monetise your data, and bury the numbers you actually care about behind a sign-up wall. Wallet Logger takes the opposite approach: it is **private by design**. There is no account, no sign-up, no analytics, and no server — **every transaction lives in a local SQLite database on your device and never leaves it**. Your finances are nobody's business but yours.

Because nothing is uploaded, the app is fully usable on a plane, in airplane mode, or with the network permission denied entirely — and it treats multiple currencies as a first-class feature rather than an afterthought.

You set up your accounts, categories and currencies once through a guided wizard, then log money in three flavours — **Income**, **Expense**, and **Transfer** between your own accounts. Every entry can be recorded in any currency you've added; Wallet Logger converts it to your main currency on the fly using a stored exchange rate, so your balances and statistics always read in one consistent unit while preserving the original amount.

On top of that sits a genuinely deep **statistics dashboard**: month / year / all-time views, a spending calendar, donut and bar breakdowns by category, income-vs-expense trends, transfer analysis, savings-rate and "biggest expense" insights, plus a live search and filters by type, category and account. Everything is worked out on your device from your own data and drawn with custom-built charts — no network round-trips.

And because it's all just a file on your phone, you stay in control of it: **export a backup** whenever you like, **restore** it on a new device, **bring your history over** from another expense app, or **wipe everything** and start fresh.

---

## Feature Highlights

- **Private by design** — no account, no sign-up, no analytics, no cloud. All data is stored locally in SQLite and never transmitted anywhere; the only optional network call is fetching a live exchange rate, which you can decline and enter by hand.
- **Guided first-run setup wizard** — pick your main currency (with live exchange-rate fetching), add starting accounts and balances, and choose income & expense categories before the database is seeded.
- **Three transaction types** — Income, Expense, and account-to-account Transfers, each with date/time, note, category, and account selection via a custom numeric keypad and option pickers.
- **Optional emojis** — give categories and accounts an emoji or leave the slot blank; nothing is forced.
- **True multi-currency** — add any number of currencies, store a per-currency exchange rate to your main currency, and record transactions in their native currency while balances and reports stay in the main unit. If a live rate can't be fetched, you can retry or enter the rate by hand, so adding a currency works fully offline.
- **Automatic balance integrity** — account balances are always kept correct: income adds, expenses subtract, transfers move funds between accounts, and edits cleanly reverse the original entry before re-applying the new one.
- **Change your main currency anytime** — a single action re-scales every stored rate, transaction and account balance in one atomic SQL transaction so nothing drifts.
- **Statistics dashboard** — Month / Year / All-Time tabs with a summary card, KPI cards (savings rate, transaction count, averages, net worth), a spending **calendar**, **donut charts**, category **bar breakdowns**, monthly/yearly **trend charts**, biggest-**income**/biggest-**expense** highlights, and a **Transfers** section.
- **Tap-to-drill-down stats** — tap a calendar day to jump to that day in History, tap a category in a breakdown to filter the whole dashboard to it, or tap a biggest-income/expense card to open that transaction.
- **Powerful filtering & search** — filter reports by transaction type, category and account; a live search across notes, categories, accounts and amounts that lists the actual matching transactions.
- **Built-in calculator on the amount keypad** — type an amount or do quick math (`+ − × ÷`) right where you enter it, then tap a field to switch inputs in one go.
- **Backup, restore & migrate** — export your whole database to a file you keep (save it to a folder or share it to Drive, email or Files), restore it later or on a new phone, or import your existing history from another expense app. Nothing is ever uploaded automatically — you choose where it goes.
- **Reset anytime** — a dedicated, confirmation-gated option wipes all your data and walks you back through setup as if the app were brand new.
- **Swipe between months** — flick left/right on History, Statistics and Account screens to move through periods, with a smooth slide animation; tap the History tab again to jump back to the current month.
- **Polished loading & empty states** — period changes show pulsing skeleton placeholders that match the real layout instead of a bare spinner, and empty months show a clear, friendly message.
- **Account detail pages** — tap any account for its own balance, month navigation, per-month in/out totals, and full transaction history.
- **Graceful deletion** — deleting an account, category or currency never corrupts old records: foreign keys are nulled and snapshot fields preserve the original emoji/name/symbol for display.
- **Drag-to-reorder management** — reorder accounts, categories and currencies; edit rates with a one-tap live refresh from the exchange-rate API.
- **In-app tooltips** — tappable ⓘ explainers on every stat so the numbers are never a mystery.
- **Cohesive dark theme** — a single source-of-truth palette, consistent purple primary actions, and currency-aware number formatting that abbreviates large values (e.g. `10.00M`, `1.20B`) so nothing ever overflows.

---

## Tech Stack

| Layer            | Tools                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Framework        | React Native 0.81 (New Architecture) on Expo SDK 54                   |
| Navigation       | Expo Router 6 (file-based routing)                                    |
| State            | Zustand 5 (with `persist` + AsyncStorage for the setup / main-currency slice) |
| Local database   | SQLite via `expo-sqlite` 16 (async API)                               |
| UI / icons       | Ionicons (`@expo/vector-icons`), custom components, hand-built charts |
| Interactions     | `react-native-draglist`, `react-native-date-picker`, `rn-emoji-keyboard`, `react-native-toast-message` |
| Exchange rates   | [freecurrencyapi.com](https://freecurrencyapi.com) REST API           |
| Build / delivery | EAS Build (Android APK)                                               |

---

## Install the APK

Wallet Logger is distributed as a standalone Android **APK** from the [Releases page](https://github.com/KarampelasDS/WalletLogger/releases). No account, no Play Store, no setup — the app is fully self-contained and works offline (only the optional "refresh exchange rate" button needs the internet).

1. Download the latest `.apk` from [Releases](https://github.com/KarampelasDS/WalletLogger/releases).
2. On your Android device, open it and allow installation from unknown sources if prompted.
3. Launch **Wallet Logger** and follow the setup wizard.

> Android only — no iOS build is provided. The only feature that needs connectivity is fetching live exchange rates when adding or refreshing a currency; you can always type a rate in manually instead.

---

## Local Setup

### Prerequisites

- **Node.js 18+** and **npm**
- An Android emulator or device with a **development build** — this project uses `expo-dev-client`, so SQLite and other native modules need a dev/standalone build rather than plain Expo Go
- A free **[freecurrencyapi.com](https://freecurrencyapi.com)** API key (optional — only for live exchange-rate fetching)

### Step 1 — Clone and install

```bash
git clone https://github.com/KarampelasDS/WalletLogger.git
cd WalletLogger
npm install
```

### Step 2 — Add your exchange-rate API key

Create a `.env.local` file at the project root (it's already git-ignored):

```bash
EXPO_PUBLIC_CURRENCY_API=your_freecurrencyapi_key_here
```

> `EXPO_PUBLIC_*` variables are embedded into the build at compile time, so treat this key as public and scope/limit it accordingly. If you skip it, the app still works — you just enter exchange rates by hand.

### Step 3 — Run

```bash
npx expo start --dev-client     # then press "a" for Android
# or build & run natively:
npx expo run:android
```

### Step 4 — Build a distributable APK (optional)

The repo ships an `eas.json` with an APK build profile:

```bash
npx eas-cli build --platform android --profile preview
```

EAS builds the signed APK in the cloud and returns a download link. Bump `version` in `app.json` for each public release, then attach the resulting `.apk` to a GitHub Release.

---

## How It Works — End to End

### 1. First-run setup wizard

On first launch the app routes to a multi-step wizard (`app/setup/SetupScreen1–6`). It creates the SQLite schema, then walks you through choosing a **main currency** (with a live rate lookup), adding **accounts** with starting balances, and selecting **income** and **expense** categories. The final step batch-inserts everything into the database with small retries for reliability, marks `completedSetup` in the persisted Zustand store, and drops you on the home screen. On every subsequent launch the root layout sees `completedSetup` and goes straight to the app.

### 2. The multi-currency model

Currencies live in two tables. `currencies` is the master catalogue (name, symbol, shorthand). `user_currencies` is the subset you actually use, each with a **`conversion_rate_to_main`** — *"1 unit of this currency equals N units of your main currency."* Exactly one row carries `is_main = 1`, and the main currency always has a rate of `1`.

When you log a transaction in a non-main currency, the app stores both the original `transaction_amount` (in its own currency) **and** `transaction_secondCurrencyAmount` (the amount converted to main, via the stored `exchange_rate`). Every balance and every statistic reads the main-currency value, falling back to the raw amount only for transactions already in the main currency — so the whole app speaks one consistent unit while never losing the original figure.

### 3. Logging transactions & balance integrity

Adding a transaction does two things in concert: it inserts the row, and it adjusts the affected account balance(s).

- **Income** adds to the account balance.
- **Expense** subtracts from it.
- **Transfer** subtracts from the *from* account and adds to the *to* account.

Editing is the tricky part, and Wallet Logger handles it carefully: when you save an edit, it first **reverses the original transaction's effect** on the relevant balances, then applies the new values. Deleting reverses the original effect and removes the row. This "undo-then-redo" approach means balances can never silently drift out of sync, no matter how many times you edit an entry or switch its type.

### 4. Snapshots & graceful deletion

Every transaction stores **snapshot** copies of the things it references — `account_snapshot_name`, `category_emoji_snapshot`, `currency_snapshot_symbol`, the from/to account names for transfers, and so on. When you delete an account, category or currency, its foreign key on past transactions is set to `NULL` rather than cascading away the history. The UI then renders with a simple fallback rule: *use the live joined value if it still exists, otherwise fall back to the snapshot.* The result — your history stays complete and readable forever, even after you reorganise your accounts and categories.

### 5. Changing your main currency

Switching your main currency is a deceptively large operation — every stored rate, every converted amount, and every balance is expressed *relative to the old main*. Wallet Logger does it correctly and atomically inside a single `db.withTransactionAsync`:

1. Read the chosen currency's current rate **R** (1 new-main = R old-main).
2. Re-scale every other currency's `conversion_rate_to_main` by `÷ R` (handling the old main, whose implicit rate was 1).
3. Flip `is_main` to the new currency and set its rate to `1`.
4. Re-scale every transaction's `transaction_secondCurrencyAmount` and `exchange_rate` by `÷ R` (the native `transaction_amount` is untouched).
5. Re-scale every account balance by `÷ R`.

Because it all runs in one transaction, the conversion either fully succeeds or fully rolls back — there is no half-converted state.

### 6. The statistics engine

The Statistics screen is the centrepiece. It has three scopes — **Month**, **Year**, **All Time** — and every panel is computed by aggregating directly in SQL (`SUM`, `GROUP BY`, `strftime` date bucketing) against the local database, then rendered with components built from plain `View`s:

- **Summary card** — income, expenses and net for the period.
- **KPI cards** — savings rate, transaction count, average per day/month, and all-time net worth, each with a tappable ⓘ explanation.
- **Calendar** — a real month grid with a coloured dot per active day (green = income, red = expense, amber = both) and the day's net.
- **Donut charts** — a dependency-free donut drawn with rotated, clipped half-disc `View`s, with a centre total and a percentage legend.
- **Bar breakdowns** — category shares rendered as proportional bars.
- **Trend charts** — month-by-month (Year) and year-by-year (All Time) income-vs-expense columns.
- **Transfers** — total volume moved and the most common from→to routes (transfers don't touch income/expense, so they get their own section).

All of it is driven by a **filter sheet** (transaction type, categories, accounts — applied on confirm) and a **debounced live search** that runs a `LIKE` query across notes, category/account snapshots and amounts, then lists the matching transactions you can tap straight through to edit. Filters and search compose into the SQL `WHERE` clause, so charts, KPIs and results all stay perfectly in sync.

### 7. Design system

A single `constants/theme.js` palette defines the brand purple, semantic income / expense / transfer colours, and surfaces. Primary actions are one consistent purple, destructive actions one red, and large numbers are abbreviated (`1.23M`, `10.00B`, `2.00T`) so values never overflow on any screen size. The bottom navigation highlights the tab you're on, and the corners across the app share one tight, business-like radius for a clean, consistent look.

---

## Backup, Import & Export

Because everything lives in a single SQLite file on your phone, moving or safeguarding your data is simple — and entirely in your hands. It all lives under **Settings → Backup & Restore**, with nothing ever uploaded automatically.

| Action      | What it does                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Export**  | Writes a complete `.db` copy of all your data to a folder you choose, or — via the share sheet — straight to Drive, email or your Files app.   |
| **Restore** | Pick one of those `.db` backups and swap it back in. It verifies the file is a genuine Wallet Logger backup before replacing anything.         |
| **Import**  | Reads a database export from another expense app and translates it into Wallet Logger's accounts, categories, currencies and transactions — including splitting/merging transfers and recomputing balances. |
| **Reset**   | (Under **Settings → Reset App**) Wipes everything and drops you back into first-run setup with the defaults, behind a confirmation prompt.     |

Use **Export** to move to a new phone or keep a safety copy, and **Import** to bring your history over from another app. Restore, Import and Reset all replace what's currently in the app, so the screen nudges you to export a backup first.

---

## Database Schema

All data is local, in a single SQLite database opened through `expo-sqlite`.

```text
currencies(currency_id PK, currency_name, currency_symbol, currency_shorthand, currency_order)

user_currencies(user_currency_id PK, currency_id FK, is_main, conversion_rate_to_main,
                display_order, currency_snapshot_name, currency_snapshot_symbol)

accounts(account_id PK, account_name, account_emoji, account_balance, account_order)

categories(category_id PK, category_name, category_emoji, category_type, category_order)

transactions(transaction_id PK, transaction_type, transaction_amount, transaction_date,
             transaction_note,
             account_id FK, account_snapshot_emoji, account_snapshot_name,
             category_id FK, category_emoji_snapshot, category_name_snapshot,
             account_from_id FK, account_to_id FK, + from/to snapshots,
             currency_id FK, currency_snapshot_name, currency_snapshot_symbol,
             converted_from_currency_id FK, transaction_secondCurrencyAmount, exchange_rate)
```

**Invariants:** account balances are maintained by every transaction; deleting an entity nulls its FK while snapshots preserve display data; `conversion_rate_to_main` is relative to the single `is_main` currency; `transaction_secondCurrencyAmount = transaction_amount × exchange_rate`.

---

## App Structure

```text
app/                              Expo Router file-based routes
  _layout.jsx                     Root layout, navbar, setup gate, toasts
  index.jsx                       Home — monthly transaction history + search
  addTransaction.jsx              Create Income / Expense / Transfer
  editTransaction.jsx             Edit or delete (reverses + re-applies balances)
  accounts.jsx                    Accounts overview (total assets, this-month flow)
  accounts/[accountId].jsx        Single-account detail + history
  statistics.jsx                  Month / Year / All-Time analytics, filters, search
  settings.jsx                    Settings menu
  settings/manageAccounts.jsx     CRUD + drag-reorder accounts
  settings/manageCurrencies.jsx   View / edit rates, delete, reorder currencies
  settings/addCurrency.jsx        Add a currency (master list + live rate)
  settings/manageIncomeCategories.jsx / manageExpenseCategories.jsx
  settings/changeMainCurrency.jsx Atomic main-currency migration
  settings/backup.jsx             Export / share / restore / import data
  settings/reset.jsx              Wipe all data and restart setup
  setup/SetupScreen1–6.jsx        First-run onboarding wizard

components/
  Title/ TotalAssets/ NavBar      Chrome (header, balance, bottom nav)
  Button/ ConfirmModal/ InputModal/ OptionPicker/ EditCurrencyModal
  Keyboard/ KeyboardHeader/       Custom numeric amount keypad
  SelectionScroller/              Setup selection lists
  TransactionRecords/             Grouped-by-day transaction rows
  MonthSwiper/                    Swipe gesture + slide animation between periods
  Skeleton/                       Pulsing loading placeholders
  EmptyState/                     Friendly "no transactions" placeholder
  PieChart/                       Pure-View donut chart (no charting lib)
  InfoTip/                        Reusable tappable tooltip

stores/Store.js                   Zustand store (persisted + transient state, initDB)
constants/theme.js                Single-source colour palette
utils/format.js                   Currency-aware number formatting
utils/backup.js                   Export / share / restore / wipe the database
utils/importExternal.js           Import & translate another app's export
assets/                           App icon, splash, adaptive icon, favicon, logo
```

---

## Ownership

Wallet Logger is a personal project by **Dimitrios Spyridon Karampelas**.

Third-party packages, services, icons, and platform tools remain the property of their respective owners and are used under their own licenses or terms. This project is not affiliated with Expo, freecurrencyapi, or any financial institution.
