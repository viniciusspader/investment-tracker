import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "database.sqlite");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      name TEXT,
      asset_type TEXT NOT NULL DEFAULT 'stock',
      quantity REAL NOT NULL,
      avg_buy_price REAL NOT NULL,
      purchase_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS theses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS thesis_tickers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thesis_id INTEGER NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
      ticker TEXT NOT NULL,
      name TEXT,
      reasoning TEXT,
      asset_type TEXT NOT NULL DEFAULT 'stock',
      added_at TEXT DEFAULT (datetime('now')),
      UNIQUE(thesis_id, ticker)
    );
  `);

  migrateOldThesis(db);
  mergeExistingDuplicates(db);
}

function mergeExistingDuplicates(db: Database.Database) {
  // Find tickers with more than one row
  const dupes = db.prepare(`
    SELECT ticker FROM holdings GROUP BY ticker HAVING COUNT(*) > 1
  `).all() as { ticker: string }[];

  for (const { ticker } of dupes) {
    const rows = db.prepare(
      "SELECT * FROM holdings WHERE ticker = ? ORDER BY created_at ASC"
    ).all(ticker) as Holding[];

    // Weighted average price + summed quantity
    let totalQty = 0;
    let totalCost = 0;
    let earliestDate: string | null = null;
    let mergedNotes: string | null = null;
    let mergedName: string | null = null;

    for (const row of rows) {
      totalCost += row.quantity * row.avg_buy_price;
      totalQty += row.quantity;

      // Keep earliest non-null purchase date
      if (row.purchase_date) {
        if (!earliestDate || row.purchase_date < earliestDate) {
          earliestDate = row.purchase_date;
        }
      }
      // Keep first non-null notes and name
      if (!mergedNotes && row.notes) mergedNotes = row.notes;
      if (!mergedName && row.name) mergedName = row.name;
    }

    const mergedAvg = totalCost / totalQty;
    const keepId = rows[0].id;
    const deleteIds = rows.slice(1).map((r) => r.id);

    db.prepare(`
      UPDATE holdings SET quantity = ?, avg_buy_price = ?, purchase_date = ?, name = ?, notes = ?
      WHERE id = ?
    `).run(totalQty, mergedAvg, earliestDate, mergedName, mergedNotes, keepId);

    for (const id of deleteIds) {
      db.prepare("DELETE FROM holdings WHERE id = ?").run(id);
    }
  }
}

function migrateOldThesis(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) as n FROM theses").get() as { n: number }).n;
  if (count > 0) return;

  const textRow = db.prepare(
    "SELECT value FROM settings WHERE key='thesis_text'"
  ).get() as { value: string } | undefined;

  if (!textRow?.value) return;

  const resultsRow = db.prepare(
    "SELECT value FROM settings WHERE key='thesis_results'"
  ).get() as { value: string } | undefined;

  const result = db.prepare("INSERT INTO theses (name, text) VALUES (?, ?)").run("My Thesis", textRow.value);
  const thesisId = result.lastInsertRowid;

  if (resultsRow?.value) {
    try {
      const tickers = JSON.parse(resultsRow.value) as Array<{
        ticker: string; name?: string; reasoning?: string; assetType?: string;
      }>;
      const insertTicker = db.prepare(`
        INSERT OR IGNORE INTO thesis_tickers (thesis_id, ticker, name, reasoning, asset_type)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const t of tickers) {
        insertTicker.run(thesisId, t.ticker?.toUpperCase(), t.name ?? null, t.reasoning ?? null, t.assetType ?? "stock");
      }
    } catch { /* corrupted JSON — skip tickers */ }
  }
}

export interface Holding {
  id: number;
  ticker: string;
  name: string | null;
  asset_type: "stock" | "etf" | "crypto";
  quantity: number;
  avg_buy_price: number;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Thesis {
  id: number;
  name: string;
  text: string;
  created_at: string;
}

export interface ThesisTicker {
  id: number;
  thesis_id: number;
  ticker: string;
  name: string | null;
  reasoning: string | null;
  asset_type: string;
  added_at: string;
}
