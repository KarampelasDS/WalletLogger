import { File, Directory, Paths } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as SQLite from "expo-sqlite";

const IMPORT_TEMP = "import-temp.sqlite";

function sqliteDir() {
  return new Directory(Paths.document, "SQLite");
}

// Table set used to recognise a supported external SQLite export
const SOURCE_TABLES = ["INOUTCOME", "ASSETS", "ZCATEGORY", "CURRENCY"];

// Transaction-type encoding used by the source format
const TYPE_INCOME = "0";
const TYPE_EXPENSE = "1";
const TYPE_TRANSFER_OUT = "3";
const TYPE_TRANSFER_IN = "4";

function safeDelete(file) {
  try {
    if (file.exists) file.delete();
  } catch {
    // ignore
  }
}

function deleteStaging(dir) {
  safeDelete(new File(dir, IMPORT_TEMP));
  safeDelete(new File(dir, IMPORT_TEMP + "-wal"));
  safeDelete(new File(dir, IMPORT_TEMP + "-shm"));
}

// Split a category name like "🍜 Food" into emoji + name.
// Names without a leading symbol token (e.g. "Other") keep an empty emoji.
function splitEmoji(raw) {
  const trimmed = (raw || "").trim();
  const sp = trimmed.indexOf(" ");
  if (sp > 0) {
    const head = trimmed.slice(0, sp);
    // head is an emoji if it has no alphanumerics and at least one symbol/emoji
    // code point (anything above the basic Latin/punctuation range)
    const hasSymbol = [...head].some((ch) => ch.codePointAt(0) > 0x2000);
    if (!/[A-Za-z0-9]/.test(head) && hasSymbol) {
      return { emoji: head, name: trimmed.slice(sp + 1).trim() };
    }
  }
  return { emoji: "", name: trimmed };
}

function toISO(zdate, wdate) {
  const ms = Number(zdate);
  if (Number.isFinite(ms) && ms > 0) return new Date(ms).toISOString();
  if (wdate) {
    const d = new Date(wdate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

async function openSource(tempName) {
  const probe = await SQLite.openDatabaseAsync(tempName, {
    useNewConnection: true,
  });
  const rows = await probe.getAllAsync(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  const names = rows.map((r) => r.name);
  const ok = SOURCE_TABLES.every((t) => names.includes(t));
  if (!ok) {
    await probe.closeAsync();
    return null;
  }
  return probe;
}

/**
 * Pick a supported external SQLite export and replace all current data with
 * its contents. `db` is the live (open) connection.
 * Returns { success, reason, counts, main }.
 */
export async function importExternalDatabase(db) {
  const res = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: "*/*",
  });
  if (res.canceled) return { success: false, reason: "cancelled" };
  const picked = res.assets?.[0]?.uri;
  if (!picked) return { success: false, reason: "no-file" };

  const dir = sqliteDir();
  try {
    dir.create({ intermediates: true, idempotent: true });
  } catch {
    // already exists
  }
  deleteStaging(dir);
  new File(picked).copy(new File(dir, IMPORT_TEMP));

  let src;
  try {
    src = await openSource(IMPORT_TEMP);
    if (!src) return { success: false, reason: "invalid" };

    // ---- Read source data ----
    const srcCurrencies = await src.getAllAsync(
      "SELECT * FROM CURRENCY WHERE COALESCE(IS_DEL,0) = 0"
    );
    const srcAccounts = await src.getAllAsync(
      "SELECT * FROM ASSETS ORDER BY ORDERSEQ ASC"
    );
    const srcCategories = await src.getAllAsync(
      "SELECT * FROM ZCATEGORY WHERE COALESCE(C_IS_DEL,0) = 0 ORDER BY ORDERSEQ ASC"
    );
    const srcTx = await src.getAllAsync(
      "SELECT * FROM INOUTCOME WHERE COALESCE(IS_DEL,0) = 0 ORDER BY ZDATE ASC"
    );

    const counts = { accounts: 0, categories: 0, currencies: 0, transactions: 0 };

    await db.withTransactionAsync(async () => {
      // ---- Wipe existing data (replace-all import) ----
      await db.execAsync(`
        DELETE FROM transactions;
        DELETE FROM user_currencies;
        DELETE FROM accounts;
        DELETE FROM categories;
        DELETE FROM currencies;
      `);

      // ---- Currencies ----
      // uid -> { id, name, symbol, rate, isMain }
      const curByUid = new Map();
      let mainCurrency = null;
      for (const c of srcCurrencies) {
        const name = c.NAME || c.ISO || "Currency";
        const symbol = c.SYMBOL || c.ISO || "";
        const shorthand = c.ISO || "";
        const rate = num(c.RATE) || 1;
        const isMain = Number(c.IS_MAIN_CURRENCY) === 1 ? 1 : 0;

        const r = await db.runAsync(
          `INSERT INTO currencies (currency_name, currency_symbol, currency_shorthand, currency_order)
           VALUES (?, ?, ?, ?)`,
          [name, symbol, shorthand, num(c.ORDER_SEQ)]
        );
        const currency_id = r.lastInsertRowId;

        await db.runAsync(
          `INSERT INTO user_currencies
            (currency_id, is_main, conversion_rate_to_main, display_order,
             currency_snapshot_name, currency_snapshot_symbol)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [currency_id, isMain, rate, num(c.ORDER_SEQ), name, symbol]
        );

        const entry = { id: currency_id, name, symbol, rate, isMain };
        curByUid.set(c.uid, entry);
        if (isMain) mainCurrency = entry;
        counts.currencies++;
      }
      // Fall back to the first currency if none flagged main
      if (!mainCurrency && curByUid.size) {
        mainCurrency = curByUid.values().next().value;
        await db.runAsync(
          "UPDATE user_currencies SET is_main = 1 WHERE currency_id = ?",
          [mainCurrency.id]
        );
      }

      const rateToMain = (uid) => {
        const c = curByUid.get(uid);
        if (!c || !mainCurrency) return 1;
        // factor that turns an amount in `uid` into main-currency units
        return mainCurrency.rate ? c.rate / mainCurrency.rate : c.rate;
      };

      // ---- Accounts ----
      const accByUid = new Map(); // uid -> { id, name, emoji }
      let accOrder = 1;
      for (const a of srcAccounts) {
        const name = a.NIC_NAME || "Account";
        const emoji = "💰";
        const r = await db.runAsync(
          `INSERT INTO accounts (account_name, account_emoji, account_balance, account_order)
           VALUES (?, ?, 0, ?)`,
          [name, emoji, num(a.ORDERSEQ) || accOrder++]
        );
        accByUid.set(a.uid, { id: r.lastInsertRowId, name, emoji });
        counts.accounts++;
      }

      // ---- Categories ----
      const catByUid = new Map(); // uid -> { id, name, emoji, type }
      let catOrder = 1;
      for (const cat of srcCategories) {
        const { emoji, name } = splitEmoji(cat.NAME);
        const type = Number(cat.TYPE) === 0 ? "Income" : "Expense";
        const r = await db.runAsync(
          `INSERT INTO categories (category_name, category_emoji, category_type, category_order)
           VALUES (?, ?, ?, ?)`,
          [name, emoji, type, num(cat.ORDERSEQ) || catOrder++]
        );
        catByUid.set(cat.uid, { id: r.lastInsertRowId, name, emoji, type });
        counts.categories++;
      }

      // ---- Transactions ----
      // Transfers arrive as paired rows (type 3 + 4) sharing txUidTrans.
      // Use the OUT row (3) as canonical; skip the IN row (4).
      for (const t of srcTx) {
        const doType = String(t.DO_TYPE);
        if (doType === TYPE_TRANSFER_IN) continue;

        const dateISO = toISO(t.ZDATE, t.WDATE);
        const note = t.ZCONTENT || "";
        const cur = curByUid.get(t.currencyUid) || mainCurrency;
        const curId = cur ? cur.id : null;
        const curName = cur ? cur.name : "";
        const curSymbol = cur ? cur.symbol : "";

        if (doType === TYPE_TRANSFER_OUT) {
          const from = accByUid.get(t.assetUid);
          const to = accByUid.get(t.toAssetUid);
          const amount = num(t.ZMONEY);
          await db.runAsync(
            `INSERT INTO transactions (
               transaction_type, transaction_amount, transaction_date, transaction_note,
               account_from_id, account_from_snapshot_emoji, account_from_snapshot_name,
               account_to_id, account_to_snapshot_emoji, account_to_snapshot_name,
               currency_id, currency_snapshot_name, currency_snapshot_symbol
             ) VALUES ('Transfer', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              amount, dateISO, note,
              from?.id ?? null, from?.emoji ?? "", from?.name ?? "",
              to?.id ?? null, to?.emoji ?? "", to?.name ?? "",
              curId, curName, curSymbol,
            ]
          );
          counts.transactions++;
          continue;
        }

        // Income / Expense
        const type = doType === TYPE_INCOME ? "Income" : "Expense";
        const acc = accByUid.get(t.assetUid);
        const cat = catByUid.get(t.ctgUid);
        const original = num(t.ZMONEY);
        const factor = rateToMain(t.currencyUid);
        const baseAmount = +(original * factor).toFixed(2);
        const isMainCur = !cur || (mainCurrency && cur.id === mainCurrency.id);

        await db.runAsync(
          `INSERT INTO transactions (
             transaction_type, transaction_amount, category_id,
             category_emoji_snapshot, category_name_snapshot,
             transaction_date, transaction_note, account_id,
             account_snapshot_emoji, account_snapshot_name,
             currency_id, currency_snapshot_name, currency_snapshot_symbol,
             converted_from_currency_id, transaction_secondCurrencyAmount, exchange_rate
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            type, baseAmount, cat?.id ?? null,
            cat?.emoji ?? "", cat?.name ?? (t.CATEGORY_NAME || ""),
            dateISO, note, acc?.id ?? null,
            acc?.emoji ?? "", acc?.name ?? (t.ASSET_NIC || ""),
            curId, curName, curSymbol,
            mainCurrency ? mainCurrency.id : curId,
            isMainCur ? baseAmount : original,
            isMainCur ? 1 : factor,
          ]
        );
        counts.transactions++;
      }

      // ---- Recompute account balances (main currency) ----
      await db.execAsync(`
        UPDATE accounts SET account_balance = ROUND(
          COALESCE((SELECT SUM(CASE transaction_type
              WHEN 'Income' THEN transaction_amount
              WHEN 'Expense' THEN -transaction_amount END)
            FROM transactions WHERE account_id = accounts.account_id), 0)
          + COALESCE((SELECT SUM(transaction_amount) FROM transactions
              WHERE transaction_type='Transfer' AND account_to_id = accounts.account_id), 0)
          - COALESCE((SELECT SUM(transaction_amount) FROM transactions
              WHERE transaction_type='Transfer' AND account_from_id = accounts.account_id), 0)
        , 2);
      `);
    });

    // Read back the main currency so the caller can update the store
    const main = await db.getFirstAsync(`
      SELECT c.currency_id, c.currency_name, c.currency_symbol,
             uc.conversion_rate_to_main
      FROM user_currencies uc
      JOIN currencies c ON uc.currency_id = c.currency_id
      WHERE uc.is_main = 1 LIMIT 1
    `);

    return { success: true, counts, main };
  } finally {
    try {
      await src?.closeAsync();
    } catch {
      // ignore
    }
    deleteStaging(sqliteDir());
  }
}
