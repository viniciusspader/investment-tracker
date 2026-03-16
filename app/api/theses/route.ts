import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET — all theses with ticker count
export async function GET() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT t.id, t.name, t.text, t.created_at, COUNT(tt.id) as ticker_count
    FROM theses t
    LEFT JOIN thesis_tickers tt ON tt.thesis_id = t.id
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `).all();
  return NextResponse.json(rows);
}

// POST — create a new thesis
export async function POST(req: NextRequest) {
  const { name, text } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const db = getDb();
  const result = db.prepare("INSERT INTO theses (name, text) VALUES (?, ?)").run(name.trim(), text ?? "");
  return NextResponse.json({ id: result.lastInsertRowid });
}
