import { NextRequest, NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo";
import { getDb } from "@/lib/db";

interface RawTicker {
  ticker: string;
  name?: string;
  reasoning?: string;
  assetType?: string;
}

// POST — parse JSON pasted from any AI and enrich with live prices
export async function POST(req: NextRequest) {
  const { json } = await req.json();

  if (!json?.trim()) {
    return NextResponse.json({ error: "No content to parse." }, { status: 400 });
  }

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

  const tickers = parsed.map((t) => t.ticker?.toUpperCase()).filter(Boolean);
  const quotes = await getMultipleQuotes(tickers);
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.ticker, q]));

  const enriched = parsed.map((t) => ({
    ticker: t.ticker?.toUpperCase(),
    name: t.name ?? t.ticker,
    reasoning: t.reasoning ?? "",
    assetType: t.assetType ?? "stock",
    quote: quoteMap[t.ticker?.toUpperCase()] ?? null,
  }));

  // Persist results
  const db = getDb();
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('thesis_results', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  ).run(JSON.stringify(enriched));

  return NextResponse.json(enriched);
}
