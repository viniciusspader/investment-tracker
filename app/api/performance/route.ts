import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { getDb } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinance as any)({ suppressNotices: ["yahooSurvey"] });

interface PeriodReturns {
  "1W": number | null;
  "1M": number | null;
  "3M": number | null;
  "6M": number | null;
  "YTD": number | null;
  "1Y": number | null;
}

interface TickerPerformance {
  ticker: string;
  currentPrice: number;
  periods: PeriodReturns;
}

function getPeriodDates(): Record<keyof PeriodReturns, Date> {
  const now = new Date();
  const ytd = new Date(now.getFullYear(), 0, 1); // Jan 1 this year

  const daysAgo = (d: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    return dt;
  };

  return {
    "1W": daysAgo(7),
    "1M": daysAgo(30),
    "3M": daysAgo(90),
    "6M": daysAgo(182),
    "YTD": ytd,
    "1Y": daysAgo(365),
  };
}

function findClosestPrice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quotes: any[],
  targetDate: Date
): number | null {
  if (!quotes.length) return null;

  const target = targetDate.getTime();
  let closest = quotes[0];
  let minDiff = Math.abs(new Date(quotes[0].date).getTime() - target);

  for (const q of quotes) {
    const diff = Math.abs(new Date(q.date).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = q;
    }
  }

  return closest?.close ?? null;
}

async function getPerformance(ticker: string): Promise<TickerPerformance | null> {
  try {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(start.getDate() - 5); // buffer for weekends

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await yahooFinance.chart(ticker, {
      period1: start,
      period2: end,
      interval: "1d",
    }) as any;

    const quotes = result.quotes ?? [];
    if (!quotes.length) return null;

    const currentPrice = quotes[quotes.length - 1]?.close;
    if (!currentPrice) return null;

    const periodDates = getPeriodDates();
    const periods: PeriodReturns = {
      "1W": null, "1M": null, "3M": null,
      "6M": null, "YTD": null, "1Y": null,
    };

    for (const [period, date] of Object.entries(periodDates) as [keyof PeriodReturns, Date][]) {
      const pastPrice = findClosestPrice(quotes, date);
      if (pastPrice && pastPrice > 0) {
        periods[period] = ((currentPrice - pastPrice) / pastPrice) * 100;
      }
    }

    return { ticker, currentPrice, periods };
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest) {
  const db = getDb();
  const holdings = db.prepare(
    "SELECT DISTINCT ticker FROM holdings WHERE asset_type != 'crypto'"
  ).all() as { ticker: string }[];

  const tickers = ["SPY", ...holdings.map((h) => h.ticker)];

  const results = await Promise.all(tickers.map(getPerformance));
  const valid = results.filter(Boolean) as TickerPerformance[];

  return NextResponse.json(valid);
}
