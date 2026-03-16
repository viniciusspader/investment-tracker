"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  TrendingUp, TrendingDown, Loader2, Sparkles, Copy, Check,
  Save, ClipboardPaste, Plus, Trash2, RefreshCw,
} from "lucide-react";
import { SignalCard, SignalData } from "@/components/analyst/SignalCard";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Thesis {
  id: number;
  name: string;
  text: string;
  created_at: string;
  ticker_count: number;
}

interface Quote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECTORS = [
  "AI & Machine Learning",
  "Semiconductors",
  "Renewable Energy",
  "Biotech & Healthcare",
  "Cybersecurity",
  "Consumer Discretionary",
  "Financials",
  "Commodities & Materials",
];

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtMarketCap(n?: number) {
  if (!n) return "—";
  if (n >= 1e12) return "$" + fmt(n / 1e12, 1) + "T";
  if (n >= 1e9) return "$" + fmt(n / 1e9, 1) + "B";
  return "$" + fmt(n / 1e6, 1) + "M";
}

function buildPrompt(thesis: string): string {
  return `You are a financial research assistant. Given this investment thesis, suggest 8-10 relevant US-listed stocks or ETFs.

Investment thesis: "${thesis}"

Respond with ONLY a valid JSON array (no markdown, no explanation outside the array). Format:
[
  {"ticker": "NVDA", "name": "NVIDIA Corporation", "reasoning": "One sentence why this fits the thesis", "assetType": "stock"},
  ...
]

Rules:
- Only suggest real, US-listed tickers on NYSE or NASDAQ
- Mix stocks and ETFs where appropriate
- assetType must be exactly "stock" or "etf"
- reasoning must be 1 concise sentence`;
}

// ─── Sector Browser ───────────────────────────────────────────────────────────

function QuoteCard({ q }: { q: Quote }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
      <div>
        <div className="font-semibold">{q.ticker}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">{q.name}</div>
        <div className="text-xs text-muted-foreground">Cap: {fmtMarketCap(q.marketCap)}</div>
      </div>
      <div className="text-right">
        <div className="font-mono font-semibold">${fmt(q.price)}</div>
        <div className={`text-sm font-mono flex items-center justify-end gap-1 ${q.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
          {q.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {q.changePercent >= 0 ? "+" : ""}{fmt(q.changePercent)}%
        </div>
      </div>
    </div>
  );
}

function SectorBrowser() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tickers, setTickers] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSector = async (sector: string) => {
    setSelected(sector);
    setLoading(true);
    const res = await fetch(`/api/sector?sector=${encodeURIComponent(sector)}`);
    const data: Quote[] = await res.json();
    setTickers(data);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SECTORS.map((s) => (
          <Button key={s} variant={selected === s ? "default" : "outline"} size="sm" onClick={() => loadSector(s)}>
            {s}
          </Button>
        ))}
      </div>
      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading {selected}...
        </div>
      )}
      {!loading && selected && tickers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{selected} — Top tickers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tickers.map((q) => <QuoteCard key={q.ticker} q={q} />)}
          </div>
        </div>
      )}
      {!loading && !selected && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Select a sector to browse tickers.
        </div>
      )}
    </div>
  );
}

// ─── Thesis Detail ────────────────────────────────────────────────────────────

interface ThesisDetailProps {
  thesis: Thesis;
  onUpdated: (t: Thesis) => void;
  onDeleted: () => void;
}

function ThesisDetail({ thesis, onUpdated, onDeleted }: ThesisDetailProps) {
  const [name, setName] = useState(thesis.name);
  const [text, setText] = useState(thesis.text);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [signalsLoaded, setSignalsLoaded] = useState(false);
  const [addTicker, setAddTicker] = useState("");
  const [addingTicker, setAddingTicker] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reset local state when thesis changes
  useEffect(() => {
    setName(thesis.name);
    setText(thesis.text);
    setSignals([]);
    setSignalsLoaded(false);
    setPasteValue("");
    setParseError(null);
    setAddError(null);
    setAddTicker("");
  }, [thesis.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/theses/${thesis.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, text }),
    });
    const updated: Thesis = await res.json();
    setSaving(false);
    setSaved(true);
    onUpdated({ ...updated, ticker_count: thesis.ticker_count });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(buildPrompt(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSignals = async () => {
    setLoadingSignals(true);
    const res = await fetch(`/api/theses/${thesis.id}/signals`);
    const data: SignalData[] = await res.json();
    setSignals(data);
    setSignalsLoaded(true);
    setLoadingSignals(false);
  };

  const handleAddTicker = async () => {
    const ticker = addTicker.trim().toUpperCase();
    if (!ticker) return;
    setAddingTicker(true);
    setAddError(null);
    const res = await fetch(`/api/theses/${thesis.id}/tickers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAddError(data.error ?? "Failed to add ticker");
    } else {
      setAddTicker("");
      onUpdated({ ...thesis, name, text, ticker_count: thesis.ticker_count + 1 });
      // Refresh signals if they were loaded
      if (signalsLoaded) loadSignals();
    }
    setAddingTicker(false);
  };

  const handleRemoveTicker = async (ticker: string) => {
    await fetch(`/api/theses/${thesis.id}/tickers/${ticker}`, { method: "DELETE" });
    setSignals((prev) => prev.filter((s) => s.ticker !== ticker));
    onUpdated({ ...thesis, name, text, ticker_count: Math.max(0, thesis.ticker_count - 1) });
  };

  const handleParse = async () => {
    setParseError(null);
    setParsing(true);
    const res = await fetch(`/api/theses/${thesis.id}/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: pasteValue }),
    });
    const data = await res.json();
    if (!res.ok) {
      setParseError(data.error);
    } else {
      setPasteValue("");
      onUpdated({ ...thesis, name, text, ticker_count: data.added + thesis.ticker_count });
      if (signalsLoaded) loadSignals();
    }
    setParsing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete thesis "${thesis.name}"? This will also remove all its tickers.`)) return;
    setDeleting(true);
    await fetch(`/api/theses/${thesis.id}`, { method: "DELETE" });
    onDeleted();
  };

  return (
    <div className="space-y-6">

      {/* Name + Text */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-semibold text-base"
              placeholder="Thesis name"
            />
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
              placeholder="Describe your investment thesis…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving || (!name.trim() && !text.trim())}>
            {saved
              ? <><Check className="h-4 w-4 mr-1 text-green-500" />Saved</>
              : <><Save className="h-4 w-4 mr-1" />{saving ? "Saving…" : "Save"}</>}
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-1" />{deleting ? "Deleting…" : "Delete thesis"}
          </Button>
        </div>
      </div>

      {/* AI Prompt */}
      <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
        <div>
          <h3 className="font-semibold text-sm">Get AI Recommendations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Copy this prompt into any AI (Perplexity, Gemini, Grok, ChatGPT), then paste the JSON back below.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleCopyPrompt} disabled={!text.trim()}>
          {copied
            ? <><Check className="h-4 w-4 mr-1 text-green-500" />Copied!</>
            : <><Copy className="h-4 w-4 mr-1" />Copy AI Prompt</>}
        </Button>
        {text.trim() && (
          <pre className="text-xs bg-background border border-border rounded p-3 whitespace-pre-wrap text-muted-foreground max-h-28 overflow-y-auto">
            {buildPrompt(text)}
          </pre>
        )}
      </div>

      {/* Paste AI Response */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Paste AI Response</h3>
        <p className="text-xs text-muted-foreground">Paste the JSON array from the AI to bulk-add tickers to this thesis.</p>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[70px] resize-y"
          placeholder={'[{"ticker": "NVDA", "name": "NVIDIA", "reasoning": "...", "assetType": "stock"}, ...]'}
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
        />
        {parseError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{parseError}</div>
        )}
        <Button size="sm" onClick={handleParse} disabled={parsing || !pasteValue.trim()}>
          {parsing
            ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Processing…</>
            : <><ClipboardPaste className="h-4 w-4 mr-1" />Apply Response</>}
        </Button>
      </div>

      {/* Add single ticker */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Add Ticker Manually</h3>
        <div className="flex gap-2">
          <Input
            className="w-32 font-mono uppercase"
            placeholder="AAPL"
            value={addTicker}
            onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
          />
          <Button size="sm" onClick={handleAddTicker} disabled={addingTicker || !addTicker.trim()}>
            {addingTicker ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        {addError && <p className="text-sm text-red-400">{addError}</p>}
      </div>

      {/* Signals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            Analyst Signals
            {thesis.ticker_count > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{thesis.ticker_count} tickers</Badge>
            )}
          </h3>
          <Button size="sm" variant="outline" onClick={loadSignals} disabled={loadingSignals || thesis.ticker_count === 0}>
            {loadingSignals
              ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Loading…</>
              : <><RefreshCw className="h-4 w-4 mr-1" />{signalsLoaded ? "Refresh" : "Load Signals"}</>}
          </Button>
        </div>

        {!signalsLoaded && thesis.ticker_count === 0 && (
          <p className="text-sm text-muted-foreground">No tickers yet. Add some above or paste an AI response.</p>
        )}
        {!signalsLoaded && thesis.ticker_count > 0 && (
          <p className="text-sm text-muted-foreground">Click "Load Signals" to fetch analyst data for all {thesis.ticker_count} tickers.</p>
        )}

        {signalsLoaded && signals.length === 0 && (
          <p className="text-sm text-muted-foreground">No analyst data available for the tickers in this thesis.</p>
        )}

        {signals.length > 0 && (
          <div className="space-y-3">
            {signals.map((s) => (
              <SignalCard
                key={s.ticker}
                data={s}
                onRemove={() => handleRemoveTicker(s.ticker)}
              />
            ))}
            <p className="text-xs text-muted-foreground text-center">
              Data from Yahoo Finance. For informational purposes only. Not financial advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Thesis Tab ───────────────────────────────────────────────────────────────

function ThesisTab() {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Thesis | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/theses");
    const data: Thesis[] = await res.json();
    setTheses(data);
    setLoading(false);
    if (data.length > 0 && !selected) setSelected(data[0]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/theses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), text: "" }),
    });
    const thesis: Thesis = await res.json();
    const withCount = { ...thesis, ticker_count: 0 };
    setTheses((prev) => [withCount, ...prev]);
    setSelected(withCount);
    setNewName("");
    setShowNew(false);
    setCreating(false);
  };

  const handleUpdated = (updated: Thesis) => {
    setTheses((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelected(updated);
  };

  const handleDeleted = () => {
    const remaining = theses.filter((t) => t.id !== selected?.id);
    setTheses(remaining);
    setSelected(remaining[0] ?? null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />Loading theses…
      </div>
    );
  }

  return (
    <div className="flex gap-6 min-h-[400px]">
      {/* Sidebar */}
      <div className="w-52 shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Theses</span>
          <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setShowNew((v) => !v)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {showNew && (
          <div className="flex gap-1">
            <Input
              autoFocus
              className="h-7 text-sm"
              placeholder="Name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowNew(false); }}
            />
            <Button size="sm" className="h-7 px-2" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
          </div>
        )}

        {theses.length === 0 && !showNew && (
          <p className="text-sm text-muted-foreground">No theses yet. Click + to create one.</p>
        )}

        {theses.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
              selected?.id === t.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <div className="font-medium truncate">{t.name}</div>
            <div className="text-xs opacity-70">{t.ticker_count} tickers</div>
          </button>
        ))}
      </div>

      {/* Detail Panel */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <ThesisDetail
            key={selected.id}
            thesis={selected}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a thesis or create one.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Buy Ideas</h1>
      <Tabs defaultValue="thesis">
        <TabsList>
          <TabsTrigger value="thesis" className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> My Theses
          </TabsTrigger>
          <TabsTrigger value="sector">Browse by Sector</TabsTrigger>
        </TabsList>

        <TabsContent value="thesis" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Investment Theses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ThesisTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sector" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Sector Browser</CardTitle></CardHeader>
            <CardContent><SectorBrowser /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
