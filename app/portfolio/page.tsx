"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Holding {
  id: number;
  ticker: string;
  name: string | null;
  asset_type: string;
  quantity: number;
  avg_buy_price: number;
  purchase_date: string | null;
  notes: string | null;
}

function PortfolioForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("edit");

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [form, setForm] = useState({
    ticker: "",
    name: "",
    asset_type: "stock",
    quantity: "",
    avg_buy_price: "",
    purchase_date: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchHoldings = useCallback(async () => {
    const res = await fetch("/api/portfolio");
    const data: Holding[] = await res.json();
    setHoldings(data);

    if (editId) {
      const h = data.find((x) => x.id === Number(editId));
      if (h) {
        setForm({
          ticker: h.ticker,
          name: h.name || "",
          asset_type: h.asset_type,
          quantity: String(h.quantity),
          avg_buy_price: String(h.avg_buy_price),
          purchase_date: h.purchase_date || "",
          notes: h.notes || "",
        });
      }
    }
  }, [editId]);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      ...form,
      ticker: form.ticker.toUpperCase(),
      quantity: parseFloat(form.quantity),
      avg_buy_price: parseFloat(form.avg_buy_price),
    };

    if (editId) {
      await fetch(`/api/portfolio/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    setForm({ ticker: "", name: "", asset_type: "stock", quantity: "", avg_buy_price: "", purchase_date: "", notes: "" });
    router.push("/");
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    setHoldings((prev) => prev.filter((h) => h.id !== id));
    setDeleting(null);
    if (editId === String(id)) router.push("/portfolio");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{editId ? "Edit Position" : "Add Position"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editId ? "Edit Position" : "New Position"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ticker">Ticker Symbol *</Label>
                  <Input
                    id="ticker"
                    placeholder="e.g. AAPL, BTC"
                    value={form.ticker}
                    onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="asset_type">Asset Type *</Label>
                  <Select value={form.asset_type} onValueChange={(v) => setForm({ ...form, asset_type: v })}>
                    <SelectTrigger id="asset_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Company Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="e.g. Apple Inc."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 10"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="avg_buy_price">Avg Buy Price (USD) *</Label>
                  <Input
                    id="avg_buy_price"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 150.00"
                    value={form.avg_buy_price}
                    onChange={(e) => setForm({ ...form, avg_buy_price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purchase_date">Purchase Date (optional)</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g. Core position, long-term hold"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editId ? "Update Position" : "Add Position"}
                </Button>
                {editId && (
                  <Link href="/portfolio">
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Holdings list */}
        <Card>
          <CardHeader>
            <CardTitle>Current Positions ({holdings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No positions yet.</p>
            ) : (
              <div className="space-y-2">
                {holdings.map((h) => (
                  <div
                    key={h.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${editId === String(h.id) ? "border-green-500 bg-green-500/5" : "border-border"}`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{h.ticker}</div>
                      <div className="text-xs text-muted-foreground">
                        {h.quantity} @ ${h.avg_buy_price} · {h.asset_type}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/portfolio?edit=${h.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(h.id)}
                        disabled={deleting === h.id}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
      <PortfolioForm />
    </Suspense>
  );
}
