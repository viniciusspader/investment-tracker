import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ConsensusBar } from "./ConsensusBar";
import { Week52Bar } from "./Week52Bar";
import type { Fundamentals, Earnings } from "@/lib/financial-datasets";

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtLargeNumber(n: number): string {
  if (Math.abs(n) >= 1e12) return "$" + (n / 1e12).toFixed(1) + "T";
  if (Math.abs(n) >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  return "$" + n.toLocaleString();
}

function recommendationColor(key?: string): "default" | "destructive" | "secondary" {
  if (!key) return "secondary";
  const k = key.toLowerCase();
  if (k.includes("buy")) return "default";
  if (k.includes("sell")) return "destructive";
  return "secondary";
}

function surpriseColor(surprise?: string) {
  if (!surprise) return "text-muted-foreground";
  return surprise === "BEAT" ? "text-green-500" : "text-red-500";
}

function surprisePct(actual?: number, estimate?: number): string {
  if (actual == null || estimate == null || estimate === 0) return "";
  const pct = ((actual - estimate) / Math.abs(estimate)) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

export interface SignalData {
  ticker: string;
  name?: string | null;
  reasoning?: string | null;
  asset_type?: string;
  quote: {
    price: number;
    changePercent: number;
    week52High?: number;
    week52Low?: number;
  } | null;
  analyst: {
    targetMeanPrice?: number;
    recommendationKey?: string;
    numberOfAnalystOpinions?: number;
    buyPercent?: number;
    holdPercent?: number;
    sellPercent?: number;
  } | null;
  fundamentals?: Fundamentals | null;
  earnings?: Earnings | null;
}

function GrowthBadge({ value }: { value?: number }) {
  if (value == null) return <span className="text-muted-foreground text-xs">—</span>;
  const positive = value >= 0;
  return (
    <span className={`text-xs font-mono flex items-center gap-0.5 ${positive ? "text-green-500" : "text-red-500"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{fmt(value, 1)}% YoY
    </span>
  );
}

export function SignalCard({ data, onRemove }: { data: SignalData; onRemove?: () => void }) {
  const upside =
    data.quote?.price && data.analyst?.targetMeanPrice
      ? ((data.analyst.targetMeanPrice - data.quote.price) / data.quote.price) * 100
      : undefined;

  const hasFundamentals = data.fundamentals &&
    (data.fundamentals.revenue != null || data.fundamentals.netIncome != null || data.fundamentals.freeCashFlow != null);

  const hasEarnings = data.earnings &&
    (data.earnings.revenue != null || data.earnings.eps != null);

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base">{data.ticker}</span>
            {data.asset_type && <Badge variant="outline" className="text-xs">{data.asset_type}</Badge>}
            {data.analyst?.recommendationKey && (
              <Badge variant={recommendationColor(data.analyst.recommendationKey)}>
                {data.analyst.recommendationKey.replace(/_/g, " ").toUpperCase()}
              </Badge>
            )}
          </div>
          {data.name && <div className="text-sm text-muted-foreground">{data.name}</div>}
          {data.reasoning && <p className="text-sm mt-1 text-muted-foreground italic">&ldquo;{data.reasoning}&rdquo;</p>}
        </div>

        <div className="flex items-start gap-3 shrink-0">
          {data.quote && (
            <div className="text-right">
              <div className="font-mono font-semibold">${fmt(data.quote.price)}</div>
              <div className={`text-sm font-mono flex items-center justify-end gap-1 ${data.quote.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                {data.quote.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {data.quote.changePercent >= 0 ? "+" : ""}{fmt(data.quote.changePercent)}%
              </div>
            </div>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-muted-foreground hover:text-red-500 transition-colors mt-0.5"
              title="Remove ticker"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Analyst signals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Analyst Consensus
            {data.analyst?.numberOfAnalystOpinions ? ` (${data.analyst.numberOfAnalystOpinions})` : ""}
          </div>
          {data.analyst?.buyPercent !== undefined ? (
            <ConsensusBar buy={data.analyst.buyPercent} hold={data.analyst.holdPercent} sell={data.analyst.sellPercent} />
          ) : (
            <span className="text-sm text-muted-foreground">No data</span>
          )}
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Analyst Price Target
          </div>
          {data.analyst?.targetMeanPrice ? (
            <div>
              <div className="font-mono font-semibold">${fmt(data.analyst.targetMeanPrice)}</div>
              {upside !== undefined && (
                <div className={`text-sm ${upside >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {upside >= 0 ? "+" : ""}{fmt(upside)}% vs current
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No data</span>
          )}
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            52-Week Range
          </div>
          <Week52Bar
            low={data.quote?.week52Low}
            high={data.quote?.week52High}
            current={data.quote?.price}
          />
        </div>
      </div>

      {/* Earnings vs Estimates panel */}
      {hasEarnings && (
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last Earnings vs Estimates
            </div>
            <span className="text-xs text-muted-foreground">
              {data.earnings!.fiscalPeriod} · {new Date(data.earnings!.reportPeriod).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Revenue */}
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <div className="text-xs text-muted-foreground mb-1">Revenue</div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-sm font-semibold">
                    {data.earnings!.revenue != null ? fmtLargeNumber(data.earnings!.revenue) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    est. {data.earnings!.estimatedRevenue != null ? fmtLargeNumber(data.earnings!.estimatedRevenue) : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${surpriseColor(data.earnings!.revenueSurprise)}`}>
                    {data.earnings!.revenueSurprise ?? "—"}
                  </div>
                  <div className={`text-xs font-mono ${surpriseColor(data.earnings!.revenueSurprise)}`}>
                    {surprisePct(data.earnings!.revenue, data.earnings!.estimatedRevenue)}
                  </div>
                </div>
              </div>
            </div>

            {/* EPS */}
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <div className="text-xs text-muted-foreground mb-1">EPS</div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-sm font-semibold">
                    {data.earnings!.eps != null ? `$${fmt(data.earnings!.eps)}` : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    est. {data.earnings!.estimatedEps != null ? `$${fmt(data.earnings!.estimatedEps)}` : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${surpriseColor(data.earnings!.epsSurprise)}`}>
                    {data.earnings!.epsSurprise ?? "—"}
                  </div>
                  <div className={`text-xs font-mono ${surpriseColor(data.earnings!.epsSurprise)}`}>
                    {surprisePct(data.earnings!.eps, data.earnings!.estimatedEps)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fundamentals panel */}
      {hasFundamentals && (
        <div className="border-t border-border pt-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Fundamentals (Annual)
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Revenue</div>
              <div className="font-mono text-sm font-semibold">
                {data.fundamentals?.revenue != null ? fmtLargeNumber(data.fundamentals.revenue) : "—"}
              </div>
              <GrowthBadge value={data.fundamentals?.revenueGrowth} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Net Income</div>
              <div className={`font-mono text-sm font-semibold ${(data.fundamentals?.netIncome ?? 0) < 0 ? "text-red-500" : ""}`}>
                {data.fundamentals?.netIncome != null ? fmtLargeNumber(data.fundamentals.netIncome) : "—"}
              </div>
              <GrowthBadge value={data.fundamentals?.netIncomeGrowth} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Free Cash Flow</div>
              <div className={`font-mono text-sm font-semibold ${(data.fundamentals?.freeCashFlow ?? 0) < 0 ? "text-red-500" : ""}`}>
                {data.fundamentals?.freeCashFlow != null ? fmtLargeNumber(data.fundamentals.freeCashFlow) : "—"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
