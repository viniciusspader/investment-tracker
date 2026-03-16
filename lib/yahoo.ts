import YahooFinance from "yahoo-finance2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinance as any)({ suppressNotices: ["yahooSurvey"] });

export interface QuoteResult {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  week52High?: number;
  week52Low?: number;
  currency?: string;
}

export interface AnalystData {
  ticker: string;
  targetMeanPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  recommendationMean?: number;
  recommendationKey?: string;
  numberOfAnalystOpinions?: number;
  buyPercent?: number;
  holdPercent?: number;
  sellPercent?: number;
}

export async function getQuote(ticker: string): Promise<QuoteResult | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await yahooFinance.quote(ticker) as any;
    return {
      ticker,
      name: result.longName || result.shortName || ticker,
      price: result.regularMarketPrice ?? 0,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      marketCap: result.marketCap,
      volume: result.regularMarketVolume,
      week52High: result.fiftyTwoWeekHigh,
      week52Low: result.fiftyTwoWeekLow,
      currency: result.currency,
    };
  } catch {
    return null;
  }
}

export async function getMultipleQuotes(tickers: string[]): Promise<QuoteResult[]> {
  const results = await Promise.all(tickers.map(getQuote));
  return results.filter((r): r is QuoteResult => r !== null);
}

export async function getAnalystData(ticker: string): Promise<AnalystData | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ["financialData", "recommendationTrend"],
    }) as any;

    const financial = summary.financialData;
    const trend = summary.recommendationTrend?.trend?.[0];

    let buyPercent: number | undefined;
    let holdPercent: number | undefined;
    let sellPercent: number | undefined;

    if (trend) {
      const total = (trend.strongBuy ?? 0) + (trend.buy ?? 0) + (trend.hold ?? 0) + (trend.sell ?? 0) + (trend.strongSell ?? 0);
      if (total > 0) {
        buyPercent = Math.round(((trend.strongBuy ?? 0) + (trend.buy ?? 0)) / total * 100);
        holdPercent = Math.round((trend.hold ?? 0) / total * 100);
        sellPercent = Math.round(((trend.sell ?? 0) + (trend.strongSell ?? 0)) / total * 100);
      }
    }

    return {
      ticker,
      targetMeanPrice: financial?.targetMeanPrice ?? undefined,
      targetHighPrice: financial?.targetHighPrice ?? undefined,
      targetLowPrice: financial?.targetLowPrice ?? undefined,
      recommendationMean: financial?.recommendationMean ?? undefined,
      recommendationKey: financial?.recommendationKey ?? undefined,
      numberOfAnalystOpinions: financial?.numberOfAnalystOpinions ?? undefined,
      buyPercent,
      holdPercent,
      sellPercent,
    };
  } catch {
    return null;
  }
}

export async function getSectorTickers(sector: string): Promise<QuoteResult[]> {
  const sectorMap: Record<string, string[]> = {
    "AI & Machine Learning": ["NVDA", "MSFT", "GOOGL", "META", "AMZN", "AMD", "PLTR", "AI", "SOUN", "BBAI"],
    "Semiconductors": ["NVDA", "AMD", "INTC", "TSM", "QCOM", "AVGO", "MU", "AMAT", "LRCX", "KLAC"],
    "Renewable Energy": ["ENPH", "FSLR", "NEE", "SEDG", "RUN", "PLUG", "BE", "ARRY", "NOVA", "CSIQ"],
    "Biotech & Healthcare": ["JNJ", "PFE", "MRNA", "AMGN", "GILD", "BIIB", "REGN", "VRTX", "ILMN", "ABBV"],
    "Cybersecurity": ["CRWD", "PANW", "FTNT", "ZS", "S", "CYBR", "OKTA", "TENB", "RPD", "VRNS"],
    "Consumer Discretionary": ["AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "TGT", "LOW", "BKNG", "ABNB"],
    "Financials": ["JPM", "BAC", "GS", "MS", "V", "MA", "BLK", "AXP", "C", "WFC"],
    "Commodities & Materials": ["XOM", "CVX", "COP", "LNG", "FCX", "NEM", "GOLD", "AA", "CF", "MOS"],
  };

  const tickers = sectorMap[sector] || [];
  return getMultipleQuotes(tickers);
}

export async function getSparkline(ticker: string): Promise<number[]> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await yahooFinance.chart(ticker, {
      period1: start,
      period2: end,
      interval: "1d",
    }) as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.quotes.map((q: any) => q.close ?? 0).filter((p: number) => p > 0);
  } catch {
    return [];
  }
}
