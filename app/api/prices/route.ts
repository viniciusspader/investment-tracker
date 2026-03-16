import { NextRequest, NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo";
import { getCryptoQuote, isCryptoTicker } from "@/lib/coingecko";

export async function POST(req: NextRequest) {
  const { tickers } = await req.json() as { tickers: { ticker: string; asset_type: string }[] };

  const stockTickers = tickers
    .filter((t) => t.asset_type !== "crypto")
    .map((t) => t.ticker);

  const cryptoTickers = tickers
    .filter((t) => t.asset_type === "crypto" || isCryptoTicker(t.ticker))
    .map((t) => t.ticker);

  const [stockQuotes, cryptoResults] = await Promise.all([
    stockTickers.length > 0 ? getMultipleQuotes(stockTickers) : [],
    Promise.all(cryptoTickers.map(getCryptoQuote)),
  ]);

  const cryptoQuotes = cryptoResults.filter(Boolean);

  const all = [...stockQuotes, ...cryptoQuotes];
  return NextResponse.json(all);
}
