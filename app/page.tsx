"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fragment } from "react";
import { RefreshCw, Plus, TrendingUp, TrendingDown, DollarSign, Eye, EyeOff, Newspaper, ExternalLink, ChevronUp, Loader2 } from "lucide-react";
import Link from "next/link";

interface Holding {
  id: number;
  ticker: string;
  name: string | null;
  asset_type: string;
  quantity: number;
  avg_buy_price: number;
  purchase_date: string | null;
}

interface Quote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface EnrichedHolding extends Holding {
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  quoteName?: string;
  totalValue?: number;
  totalCost?: number;
  pnl?: number;
  pnlPercent?: number;
}

interface NewsItem {
  ticker: string;
  title: string;
  url: string;
  date: string;
  source: string;
}

const HIDDEN = "••••••";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(n: number) {
  return "$" + fmt(n);
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [enriched, setEnriched] = useState<EnrichedHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  // news: ticker → items (null = not fetched, [] = fetched but empty)
  const [newsCache, setNewsCache] = useState<Record<string, NewsItem[] | null>>({});
  const [newsLoading, setNewsLoading] = useState<Record<string, boolean>>({});
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const fetchHoldings = useCallback(async () => {
    const res = await fetch("/api/portfolio");
    const data: Holding[] = await res.json();
    setHoldings(data);
    return data;
  }, []);

  const fetchPrices = useCallback(async (data: Holding[]) => {
    if (!data.length) { setEnriched([]); return; }
    const res = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: data.map((h) => ({ ticker: h.ticker, asset_type: h.asset_type })) }),
    });
    const quotes: Quote[] = await res.json();
    const quoteMap = Object.fromEntries(quotes.map((q) => [q.ticker, q]));
    setEnriched(data.map((h) => {
      const q = quoteMap[h.ticker];
      const currentPrice = q?.price;
      const totalValue = currentPrice ? currentPrice * h.quantity : undefined;
      const totalCost = h.avg_buy_price * h.quantity;
      const pnl = totalValue !== undefined ? totalValue - totalCost : undefined;
      const pnlPercent = pnl !== undefined ? (pnl / totalCost) * 100 : undefined;
      return { ...h, currentPrice, change: q?.change, changePercent: q?.changePercent, quoteName: q?.name, totalValue, totalCost, pnl, pnlPercent };
    }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchHoldings();
    await fetchPrices(data);
    setLoading(false);
  }, [fetchHoldings, fetchPrices]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchPrices(holdings);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [load]);

  const toggleNews = useCallback(async (ticker: string, assetType: string) => {
    // collapse if already open
    if (expandedTicker === ticker) {
      setExpandedTicker(null);
      return;
    }
    setExpandedTicker(ticker);

    // crypto has no news
    if (assetType === "crypto") return;

    // already cached
    if (newsCache[ticker] !== undefined) return;

    setNewsLoading((prev) => ({ ...prev, [ticker]: true }));
    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: [ticker] }),
    });
    const items: NewsItem[] = res.ok ? await res.json() : [];
    setNewsCache((prev) => ({ ...prev, [ticker]: items.slice(0, 5) }));
    setNewsLoading((prev) => ({ ...prev, [ticker]: false }));
  }, [expandedTicker, newsCache]);

  const totalValue = enriched.reduce((s, h) => s + (h.totalValue ?? 0), 0);
  const totalCost = enriched.reduce((s, h) => s + (h.totalCost ?? 0), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const todayChange = enriched.reduce((s, h) => {
    if (h.currentPrice && h.change) return s + h.change * h.quantity;
    return s;
  }, 0);

  const prv = (value: string) => privacy ? HIDDEN : value;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading portfolio...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <div className="flex gap-2">
          <Button variant={privacy ? "default" : "outline"} size="sm" onClick={() => setPrivacy((p) => !p)}>
            {privacy ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {privacy ? "Private" : "Sharing"}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/portfolio">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Position
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      {enriched.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prv(fmtCurrency(totalValue))}</div>
              <div className="text-sm text-muted-foreground">Cost: {prv(fmtCurrency(totalCost))}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {prv(`${totalPnl >= 0 ? "+" : ""}${fmtCurrency(totalPnl)}`)}
              </div>
              <div className={`text-sm ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalPnlPct >= 0 ? "+" : ""}{fmt(totalPnlPct)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${todayChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                {prv(`${todayChange >= 0 ? "+" : ""}${fmtCurrency(todayChange)}`)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Holdings table */}
      {enriched.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No positions yet</h2>
            <p className="text-muted-foreground mb-4">Add your first investment to start tracking.</p>
            <Link href="/portfolio">
              <Button><Plus className="h-4 w-4 mr-1" />Add Position</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Ticker</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Today</th>
                  <th className="text-right px-4 py-3">Qty</th>
                  <th className="text-right px-4 py-3">Avg Cost</th>
                  <th className="text-right px-4 py-3">Value</th>
                  <th className="text-right px-4 py-3">P&amp;L</th>
                  <th className="text-right px-4 py-3">Return %</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((h) => {
                  const isExpanded = expandedTicker === h.ticker;
                  const tickerNews = newsCache[h.ticker];
                  const isLoadingNews = newsLoading[h.ticker];

                  return (
                    <Fragment key={h.id}>
                      <tr
                        className={`border-b ${isExpanded ? "border-border" : "border-border/50"} hover:bg-muted/30 transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold">{h.ticker}</div>
                          <div className="text-xs text-muted-foreground">{h.quoteName || h.name}</div>
                          <Badge variant="outline" className="text-xs mt-0.5">{h.asset_type}</Badge>
                        </td>
                        <td className="text-right px-4 py-3 font-mono">
                          {h.currentPrice ? fmtCurrency(h.currentPrice) : "—"}
                        </td>
                        <td className={`text-right px-4 py-3 font-mono ${(h.changePercent ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {h.changePercent !== undefined ? (
                            <span className="flex items-center justify-end gap-1">
                              {h.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {h.changePercent >= 0 ? "+" : ""}{fmt(h.changePercent)}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="text-right px-4 py-3 font-mono text-muted-foreground">{prv(fmt(h.quantity, 4))}</td>
                        <td className="text-right px-4 py-3 font-mono text-muted-foreground">{prv(fmtCurrency(h.avg_buy_price))}</td>
                        <td className="text-right px-4 py-3 font-mono font-semibold">
                          {h.totalValue ? prv(fmtCurrency(h.totalValue)) : "—"}
                        </td>
                        <td className={`text-right px-4 py-3 font-mono ${(h.pnl ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {h.pnl !== undefined ? prv(`${h.pnl >= 0 ? "+" : ""}${fmtCurrency(h.pnl)}`) : "—"}
                        </td>
                        <td className={`text-right px-4 py-3 font-mono ${(h.pnlPercent ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {h.pnlPercent !== undefined ? `${h.pnlPercent >= 0 ? "+" : ""}${fmt(h.pnlPercent)}%` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link href={`/portfolio?edit=${h.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                            </Link>
                            {h.asset_type !== "crypto" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleNews(h.ticker, h.asset_type)}
                                className="text-muted-foreground hover:text-foreground"
                                title="Latest news"
                              >
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Newspaper className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable news row */}
                      {isExpanded && (
                        <tr className="border-b border-border/50 bg-muted/20">
                          <td colSpan={9} className="px-4 py-3">
                            {isLoadingNews ? (
                              <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading news…
                              </div>
                            ) : !tickerNews || tickerNews.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-1">No recent news found.</p>
                            ) : (
                              <div className="space-y-2">
                                {tickerNews.map((item, i) => (
                                  <a
                                    key={i}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start justify-between gap-3 group"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">
                                        {item.title}
                                      </p>
                                      <span className="text-xs text-muted-foreground">
                                        {item.source} · {timeAgo(item.date)}
                                      </span>
                                    </div>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
