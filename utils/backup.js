import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as SQLite from "expo-sqlite";

const DB_NAME = "ExpenseManager.db";

// Tables that must exist for a file to be considered a valid Wallet Logger backup
const REQUIRED_TABLES = [
  "currencies",
  "user_currencies",
  "accounts",
  "categories",
  "transactions",
];

function sqliteDir() {
  return new Directory(Paths.document, "SQLite");
}

function dbFile() {
  return new File(sqliteDir(), DB_NAME);
}

function safeDelete(file) {
  try {
    if (file.exists) file.delete();
  } catch {
    // ignore
  }
}

// expo-sqlite keeps WAL/SHM sidecars next to the db file
function deleteSidecars(baseName) {
  const dir = sqliteDir();
  safeDelete(new File(dir, baseName + "-wal"));
  safeDelete(new File(dir, baseName + "-shm"));
}

/**
 * Flush the WAL into the main db file, then let the user pick a folder and
 * save the backup .db there (Storage Access Framework on Android).
 * Returns { success, reason, fileName }.
 */
export async function exportDatabase(db) {
  // Collapse the write-ahead log so the .db file is fully self-contained
  await checkpoint(db);

  // Let the user choose a destination folder
  let destDir;
  try {
    destDir = await Directory.pickDirectoryAsync();
  } catch {
    destDir = null;
  }
  if (!destDir) return { success: false, reason: "cancelled" };

  const fileName = backupName();

  // Read the live db bytes and write them into the chosen folder
  const bytes = await dbFile().bytes();
  const out = destDir.createFile(fileName, "application/octet-stream");
  out.write(bytes);

  return { success: true, fileName };
}

function backupName() {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `WalletLogger-backup-${stamp}.db`;
}

async function checkpoint(db) {
  try {
    await db.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");
  } catch {
    // non-fatal
  }
}

/**
 * Flush the WAL, copy the db to a cache file, and open the system share sheet.
 * The share sheet's "Save to Files" / cloud targets avoid the Android folder
 * restrictions that block saving directly into Download.
 * Returns { success, reason }.
 */
export async function shareBackup(db) {
  await checkpoint(db);

  const dest = new File(Paths.cache, backupName());
  safeDelete(dest);
  dbFile().copy(dest);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(dest.uri, {
    mimeType: "application/octet-stream",
    dialogTitle: "Wallet Logger backup",
  });
  return { success: true };
}

// Open `tempName` (relative to the SQLite dir) and confirm it has our schema
async function validateBackup(tempName) {
  let probe;
  try {
    probe = await SQLite.openDatabaseAsync(tempName, { useNewConnection: true });
    const rows = await probe.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    const names = rows.map((r) => r.name);
    return REQUIRED_TABLES.every((t) => names.includes(t));
  } catch {
    return false;
  } finally {
    try {
      await probe?.closeAsync();
    } catch {
      // ignore
    }
  }
}

/**
 * Erase all user data, leaving empty tables behind. The caller is responsible
 * for clearing persisted setup state and sending the user back to onboarding.
 */
export async function wipeDatabase(db) {
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM user_currencies;
    DELETE FROM accounts;
    DELETE FROM categories;
    DELETE FROM currencies;
  `);
}

/**
 * Let the user pick a .db backup, validate it, then atomically replace the
 * live database. `db` is the current open connection (will be closed).
 * Returns { success, reason }.
 */
export async function restoreDatabase(db) {
  const res = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: "*/*",
  });
  if (res.canceled) return { success: false, reason: "cancelled" };

  const pickedUri = res.assets?.[0]?.uri;
  if (!pickedUri) return { success: false, reason: "no-file" };

  const dir = sqliteDir();
  try {
    dir.create({ intermediates: true, idempotent: true });
  } catch {
    // already exists
  }

  // Stage the picked file in the SQLite dir so we can validate, then move it in
  const TEMP_NAME = "restore-temp.db";
  const tempFile = new File(dir, TEMP_NAME);
  safeDelete(tempFile);
  deleteSidecars(TEMP_NAME);
  new File(pickedUri).copy(tempFile);

  const valid = await validateBackup(TEMP_NAME);
  if (!valid) {
    safeDelete(tempFile);
    return { success: false, reason: "invalid" };
  }

  // Close the live connection before swapping files on disk
  try {
    await db.closeAsync();
  } catch {
    // ignore — may already be closed
  }

  // Remove the live db + its WAL/SHM sidecars, then move the validated file in
  safeDelete(dbFile());
  deleteSidecars(DB_NAME);
  tempFile.move(dbFile());

  return { success: true };
}
