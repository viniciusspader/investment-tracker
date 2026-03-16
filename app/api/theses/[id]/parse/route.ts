import { NextRequest, NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo";
import { getDb } from "@/lib/db";

type Params = Promise<{ id: string }>;

interface RawTicker {
  ticker: string;
  name?: string;
  reasoning?: string;
  assetType?: string;
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const { json } = await req.json();

  if (!json?.trim()) return NextResponse.json({ error: "No content to parse." }, { status: 400 });

  let parsed: RawTicker[];
  try {
    const cleaned = json.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Not an array");
  } catch {
    return NextResponse.json(
      { error: "Could not parse the response. Make sure you copied the full JSON array from the AI." },
      { status: 400 }
    );
  }

  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO thesis_tickers (thesis_id, ticker, name, reasoning, asset_type)
    VALUES (?, ?, ?, ?, ?)
  `);

  let added = 0;
  let skipped = 0;
  for (const t of parsed) {
    if (!t.ticker) continue;
    const result = insert.run(id, t.ticker.toUpperCase(), t.name ?? null, t.reasoning ?? null, t.assetType ?? "stock");
    if (result.changes > 0) added++;
    else skipped++;
  }

  // Return updated ticker list with live prices
  const tickers = db.prepare(
    "SELECT * FROM thesis_tickers WHERE thesis_id=? ORDER BY added_at DESC"
  ).all(id) as { ticker: string; name: string | null; reasoning: string | null; asset_type: string }[];

  const quotes = await getMultipleQuotes(tickers.map((t) => t.ticker));
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.ticker, q]));

  return NextResponse.json({
    added,
    skipped,
    tickers: tickers.map((t) => ({ ...t, quote: quoteMap[t.ticker] ?? null })),
  });
}
