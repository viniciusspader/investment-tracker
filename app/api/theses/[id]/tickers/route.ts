import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = Promise<{ id: string }>;

// POST — add a single ticker manually
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const { ticker, name, reasoning, asset_type } = await req.json();

  if (!ticker?.trim()) return NextResponse.json({ error: "Ticker is required" }, { status: 400 });

  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO thesis_tickers (thesis_id, ticker, name, reasoning, asset_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, ticker.toUpperCase().trim(), name ?? null, reasoning ?? null, asset_type ?? "stock");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ticker already exists in this thesis" }, { status: 409 });
  }
}
