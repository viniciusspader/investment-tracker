"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

const PERIODS = ["1W", "1M", "3M", "6M", "YTD", "1Y"] as const;
type Period = typeof PERIODS[number];

interface TickerPerformance {
  ticker: string;
  currentPrice: number;
  periods: Record<Period, number | null>;
}

function fmt(n: number | null): string {
  if (n === null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

function Cell({ value, spy }: { value: number | null; spy: number | null }) {
  if (value === null) return <td className="text-center px-3 py-3 text-muted-foreground text-sm">—</td>;

  const isPositive = value >= 0;
  const beatingBenchmark = spy !== null && value > spy;
  const laggingBenchmark = spy !== null && value < spy;

  return (
    <td className="text-center px-3 py-3">
      <div className={`inline-flex flex-col items-center`}>
        <span className={`font-mono text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {fmt(value)}
        </span>
        {spy !== null && (
          <span className={`text-xs ${beatingBenchmark ? "text-green-400/70" : laggingBenchmark ? "text-red-400/70" : "text-muted-foreground"}`}>
            {beatingBenchmark ? "↑" : laggingBenchmark ? "↓" : "="} vs SPY
          </span>
        )}
      </div>
    </td>
  );
}

export default function PerformancePage() {
  const [data, setData] = useState<TickerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await fetch("/api/performance");
    const json: TickerPerformance[] = await res.json();
    setData(json);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const spy = data.find((d) => d.ticker === "SPY");
  const holdings = data.filter((d) => d.ticker !== "SPY");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Fetching historical data... (this takes ~10s)
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Period returns for each holding vs S&P 500 (SPY) benchmark.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Period Returns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Ticker</th>
                  <th className="text-right px-3 py-3">Price</th>
                  {PERIODS.map((p) => (
                    <th key={p} className="text-center px-3 py-3">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* SPY benchmark row */}
                {spy && (
                  <tr className="border-b border-border bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-semibold">SPY</div>
                      <div className="text-xs text-muted-foreground">S&P 500 Benchmark</div>
                    </td>
                    <td className="text-right px-3 py-3 font-mono">${spy.currentPrice.toFixed(2)}</td>
                    {PERIODS.map((p) => (
                      <td key={p} className="text-center px-3 py-3">
                        <span className={`font-mono text-sm font-medium ${(spy.periods[p] ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {fmt(spy.periods[p])}
                        </span>
                      </td>
                    ))}
                  </tr>
                )}

                {/* Holdings rows */}
                {holdings.map((row) => (
                  <tr key={row.ticker} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">{row.ticker}</td>
                    <td className="text-right px-3 py-3 font-mono">${row.currentPrice.toFixed(2)}</td>
                    {PERIODS.map((p) => (
                      <Cell
                        key={p}
                        value={row.periods[p]}
                        spy={spy?.periods[p] ?? null}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span><span className="text-green-400/70">↑ vs SPY</span> — beating benchmark for that period</span>
        <span><span className="text-red-400/70">↓ vs SPY</span> — lagging benchmark for that period</span>
      </div>
    </div>
  );
}
