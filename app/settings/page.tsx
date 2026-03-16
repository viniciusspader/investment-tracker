"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);

  const [fdKey, setFdKey] = useState("");
  const [fdSaved, setFdSaved] = useState(false);
  const [hasFdKey, setHasFdKey] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.anthropic_api_key) {
          setHasKey(true);
          setApiKey(data.anthropic_api_key);
        }
        if (data.financial_datasets_api_key) {
          setHasFdKey(true);
          setFdKey(data.financial_datasets_api_key);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || apiKey.includes("•")) return;
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anthropic_api_key: apiKey.trim() }),
    });
    setHasKey(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFdSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fdKey.trim() || fdKey.includes("•")) return;
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financial_datasets_api_key: fdKey.trim() }),
    });
    setHasFdKey(true);
    setFdSaved(true);
    setTimeout(() => setFdSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Anthropic API Key</CardTitle>
          <CardDescription>
            Required for the AI Thesis feature (Buy Ideas → AI Thesis tab). The key is stored locally on your computer only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground text-sm">Loading...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {hasKey && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  API key is configured
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="api-key">{hasKey ? "Replace API Key" : "API Key"}</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder={hasKey ? "Enter new key to replace existing..." : "sk-ant-..."}
                  value={apiKey.includes("•") ? "" : apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!apiKey.trim() || apiKey.includes("•")}>
                  {saved ? "Saved!" : "Save Key"}
                </Button>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Get an API key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored in the local SQLite database file on your computer. It is never transmitted anywhere except directly to Anthropic when you use the AI Thesis feature.
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Datasets API Key</CardTitle>
          <CardDescription>
            Required for company news on the dashboard and fundamentals (revenue, net income, free cash flow) on sell signals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground text-sm">Loading...</div>
          ) : (
            <form onSubmit={handleFdSave} className="space-y-4">
              {hasFdKey && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  API key is configured
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="fd-key">{hasFdKey ? "Replace API Key" : "API Key"}</Label>
                <Input
                  id="fd-key"
                  type="password"
                  placeholder={hasFdKey ? "Enter new key to replace existing..." : "your-api-key"}
                  value={fdKey.includes("•") ? "" : fdKey}
                  onChange={(e) => setFdKey(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!fdKey.trim() || fdKey.includes("•")}>
                  {fdSaved ? "Saved!" : "Save Key"}
                </Button>
                <a
                  href="https://financialdatasets.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Get an API key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Stored locally in your SQLite database. Used only to fetch news and financial statements from financialdatasets.ai.
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start justify-between border-b border-border pb-3">
            <div>
              <div className="font-medium">Yahoo Finance</div>
              <div className="text-muted-foreground">Stock & ETF prices, analyst ratings</div>
            </div>
            <span className="text-green-500 text-xs font-medium">Free</span>
          </div>
          <div className="flex items-start justify-between border-b border-border pb-3">
            <div>
              <div className="font-medium">CoinGecko</div>
              <div className="text-muted-foreground">Cryptocurrency prices</div>
            </div>
            <span className="text-green-500 text-xs font-medium">Free</span>
          </div>
          <div className="flex items-start justify-between border-b border-border pb-3">
            <div>
              <div className="font-medium">Financial Datasets</div>
              <div className="text-muted-foreground">Company news, income statements, cash flow</div>
            </div>
            {hasFdKey
              ? <span className="text-green-500 text-xs font-medium">Configured</span>
              : <span className="text-yellow-500 text-xs font-medium">API Key required</span>}
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">Anthropic Claude</div>
              <div className="text-muted-foreground">AI thesis-to-ticker suggestions</div>
            </div>
            <span className="text-yellow-500 text-xs font-medium">API Key required</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Investment Tracker runs entirely on your local machine.</p>
          <p>Portfolio data is stored in <code className="text-foreground bg-muted px-1 rounded">database.sqlite</code> in the project folder.</p>
          <p>No data is sent to any server except when fetching live market prices.</p>
        </CardContent>
      </Card>
    </div>
  );
}
