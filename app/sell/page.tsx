"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { SignalCard, SignalData } from "@/components/analyst/SignalCard";

interface Holding {
  id: number;
  ticker: string;
  asset_type: string;
}

export default function SellPage() {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasHoldings, setHasHoldings] = useState(true);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const holdingsRes = await fetch("/api/portfolio");
    const holdings: Holding[] = await holdingsRes.json();

    if (!holdings.length) {
      setHasHoldings(false);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const stockTickers = holdings.filter((h) => h.asset_type !== "crypto").map((h) => h.ticker);

    if (!stockTickers.length) {
      setSignals([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const res = await fetch("/api/sell-signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: stockTickers }),
    });
    const data: SignalData[] = await res.json();
    setSignals(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading sell signals...
      </div>
    );
  }

  if (!hasHoldings) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Sell Signals</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No holdings to analyze</h2>
            <p className="text-muted-foreground mb-4">Add positions to your portfolio first.</p>
            <Link href="/portfolio"><Button>Add Positions</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sell Signals</h1>
          <p className="text-sm text-muted-foreground mt-1">Analyst consensus for your holdings. You make the final call.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {signals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No analyst data available. Crypto positions are not analyzed here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {signals.map((row) => <SignalCard key={row.ticker} data={row} />)}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Data from Yahoo Finance. For informational purposes only. Not financial advice.
      </p>
    </div>
  );
}
