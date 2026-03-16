import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST — save thesis text
export async function POST(req: NextRequest) {
  const { thesis } = await req.json();
  const db = getDb();
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('thesis_text', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  ).run(thesis ?? "");
  return NextResponse.json({ ok: true });
}
