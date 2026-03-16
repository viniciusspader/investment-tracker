import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    const maskedKeys = ["anthropic_api_key", "financial_datasets_api_key"];
    if (maskedKeys.includes(row.key) && row.value) {
      settings[row.key] = row.value.slice(0, 8) + "••••••••••••••••••••";
    } else {
      settings[row.key] = row.value;
    }
  }
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, string>;
  const db = getDb();

  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `);

  for (const [key, value] of Object.entries(body)) {
    upsert.run(key, value);
  }

  return NextResponse.json({ ok: true });
}
