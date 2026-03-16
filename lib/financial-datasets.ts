const API_BASE = "https://api.financialdatasets.ai";

async function request<T>(path: string, apiKey: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "X-API-KEY": apiKey },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export interface NewsItem {
  ticker: string;
  title: string;
  url: string;
  date: string;
  source: string;
  summary?: string;
}

export interface Fundamentals {
  revenue?: number;
  revenueGrowth?: number;    // YoY %
  netIncome?: number;
  netIncomeGrowth?: number;  // YoY %
  freeCashFlow?: number;
}

interface IncomeStatement {
  revenue?: number;
  net_income?: number;
}

interface CashFlowStatement {
  free_cash_flow?: number;
}

export interface Earnings {
  fiscalPeriod: string;
  reportPeriod: string;
  revenue?: number;
  estimatedRevenue?: number;
  revenueSurprise?: "BEAT" | "MISS" | string;
  eps?: number;
  estimatedEps?: number;
  epsSurprise?: "BEAT" | "MISS" | string;
  netIncome?: number;
}

export async function getEarnings(ticker: string, apiKey: string): Promise<Earnings | null> {
  const data = await request<{
    earnings: {
      fiscal_period: string;
      report_period: string;
      quarterly: {
        revenue?: number;
        estimated_revenue?: number;
        revenue_surprise?: string;
        earnings_per_share?: number;
        estimated_earnings_per_share?: number;
        eps_surprise?: string;
        net_income?: number;
      };
    };
  }>(`/earnings/?ticker=${ticker}`, apiKey);

  const e = data?.earnings;
  if (!e) return null;

  return {
    fiscalPeriod: e.fiscal_period,
    reportPeriod: e.report_period,
    revenue: e.quarterly.revenue ?? undefined,
    estimatedRevenue: e.quarterly.estimated_revenue ?? undefined,
    revenueSurprise: e.quarterly.revenue_surprise ?? undefined,
    eps: e.quarterly.earnings_per_share ?? undefined,
    estimatedEps: e.quarterly.estimated_earnings_per_share ?? undefined,
    epsSurprise: e.quarterly.eps_surprise ?? undefined,
    netIncome: e.quarterly.net_income ?? undefined,
  };
}

export async function getCompanyNews(ticker: string, apiKey: string): Promise<NewsItem[]> {
  const data = await request<{ news: NewsItem[] }>(`/news/?ticker=${ticker}&limit=5`, apiKey);
  return data?.news ?? [];
}

export async function getFundamentals(ticker: string, apiKey: string): Promise<Fundamentals | null> {
  const [incomeData, cashData] = await Promise.all([
    request<{ income_statements: IncomeStatement[] }>(
      `/financials/income-statements/?ticker=${ticker}&period=annual&limit=2`,
      apiKey
    ),
    request<{ cash_flow_statements: CashFlowStatement[] }>(
      `/financials/cash-flow-statements/?ticker=${ticker}&period=annual&limit=1`,
      apiKey
    ),
  ]);

  const statements = incomeData?.income_statements ?? [];
  if (statements.length === 0) return null;

  const latest = statements[0];
  const prior = statements[1];

  const revenueGrowth =
    latest.revenue != null && prior?.revenue != null && prior.revenue !== 0
      ? ((latest.revenue - prior.revenue) / Math.abs(prior.revenue)) * 100
      : undefined;

  const netIncomeGrowth =
    latest.net_income != null && prior?.net_income != null && prior.net_income !== 0
      ? ((latest.net_income - prior.net_income) / Math.abs(prior.net_income)) * 100
      : undefined;

  return {
    revenue: latest.revenue,
    revenueGrowth,
    netIncome: latest.net_income,
    netIncomeGrowth,
    freeCashFlow: cashData?.cash_flow_statements?.[0]?.free_cash_flow,
  };
}
