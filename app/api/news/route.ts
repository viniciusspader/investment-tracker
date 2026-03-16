import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCompanyNews, NewsItem } from "@/lib/financial-datasets";

export async function POST(req: NextRequest) {
  const { tickers } = await req.json() as { tickers: string[] };

  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key='financial_datasets_api_key'").get() as { value: string } | undefined;
  const apiKey = row?.value;

  if (!apiKey) {
    return NextResponse.json({ error: "Financial Datasets API key not configured" }, { status: 400 });
  }

  const results = await Promise.all(
    tickers.map((ticker) => getCompanyNews(ticker, apiKey))
  );

  const allNews: (NewsItem & { ticker: string })[] = results
    .flatMap((news, i) => news.map((item) => ({ ...item, ticker: tickers[i] })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 25);

  return NextResponse.json(allNews);
}
