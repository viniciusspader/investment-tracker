// CoinGecko free API — no key required
const BASE = "https://api.coingecko.com/api/v3";

const TICKER_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  UNI: "uniswap",
  LTC: "litecoin",
  ATOM: "cosmos",
  NEAR: "near",
};

export interface CryptoQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
}

export async function getCryptoQuote(ticker: string): Promise<CryptoQuote | null> {
  const id = TICKER_TO_ID[ticker.toUpperCase()];
  if (!id) return null;

  try {
    const res = await fetch(
      `${BASE}/simple/price?ids=${id}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const coin = data[id];

    return {
      ticker: ticker.toUpperCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      price: coin.usd,
      change: coin.usd * (coin.usd_24h_change / 100),
      changePercent: coin.usd_24h_change,
      marketCap: coin.usd_market_cap,
    };
  } catch {
    return null;
  }
}

export function isCryptoTicker(ticker: string): boolean {
  return ticker.toUpperCase() in TICKER_TO_ID;
}
