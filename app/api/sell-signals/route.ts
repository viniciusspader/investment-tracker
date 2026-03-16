import { NextRequest, NextResponse } from "next/server";
import { getAnalystData, getQuote } from "@/lib/yahoo";
import { isCryptoTicker } from "@/lib/coingecko";
import { getDb } from "@/lib/db";
import { getFundamentals, getEarnings } from "@/lib/financial-datasets";

export async function POST(req: NextRequest) {
  const { tickers } = await req.json() as { tickers: string[] };

  const nonCrypto = tickers.filter((t) => !isCryptoTicker(t));

  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key='financial_datasets_api_key'").get() as { value: string } | undefined;
  const apiKey = row?.value ?? null;

  const results = await Promise.all(
    nonCrypto.map(async (ticker) => {
      const [quote, analyst, fundamentals, earnings] = await Promise.all([
        getQuote(ticker),
        getAnalystData(ticker),
        apiKey ? getFundamentals(ticker, apiKey) : Promise.resolve(null),
        apiKey ? getEarnings(ticker, apiKey) : Promise.resolve(null),
      ]);
      return { ticker, quote, analyst, fundamentals, earnings };
    })
  );

  return NextResponse.json(results);
}
