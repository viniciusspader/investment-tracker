function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function Week52Bar({ low, high, current }: { low?: number; high?: number; current?: number }) {
  if (!low || !high || !current) return <span className="text-muted-foreground text-sm">—</span>;
  const pct = Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100));
  return (
    <div className="space-y-1">
      <div className="relative h-2 bg-muted rounded">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-1 bg-foreground rounded"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex text-xs text-muted-foreground justify-between">
        <span>${fmt(low)}</span>
        <span className="text-foreground">{fmt(pct, 0)}%</span>
        <span>${fmt(high)}</span>
      </div>
    </div>
  );
}
