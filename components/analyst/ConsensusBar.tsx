export function ConsensusBar({ buy = 0, hold = 0, sell = 0 }: { buy?: number; hold?: number; sell?: number }) {
  return (
    <div className="space-y-1">
      <div className="flex rounded overflow-hidden h-2 w-full">
        <div className="bg-green-500 transition-all" style={{ width: `${buy}%` }} />
        <div className="bg-yellow-500 transition-all" style={{ width: `${hold}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${sell}%` }} />
      </div>
      <div className="flex text-xs text-muted-foreground gap-2">
        <span className="text-green-500">Buy {buy}%</span>
        <span className="text-yellow-500">Hold {hold}%</span>
        <span className="text-red-500">Sell {sell}%</span>
      </div>
    </div>
  );
}
