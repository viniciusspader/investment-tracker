import { NextRequest, NextResponse } from "next/server";
import { getDb, ThesisTicker } from "@/lib/db";
import { getAnalystData, getQuote } from "@/lib/yahoo";
import { isCryptoTicker } from "@/lib/coingecko";

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const db = getDb();

  const tickers = db.prepare(
    "SELECT * FROM thesis_tickers WHERE thesis_id=? ORDER BY added_at DESC"
  ).all(id) as ThesisTicker[];

  const results = await Promise.all(
    tickers.map(async (t) => {
      if (isCryptoTicker(t.ticker)) {
        return { ticker: t.ticker, name: t.name, reasoning: t.reasoning, asset_type: t.asset_type, quote: null, analyst: null };
      }
      const [quote, analyst] = await Promise.all([getQuote(t.ticker), getAnalystData(t.ticker)]);
      return { ticker: t.ticker, name: t.name, reasoning: t.reasoning, asset_type: t.asset_type, quote, analyst };
    })
  );

  return NextResponse.json(results);
}
