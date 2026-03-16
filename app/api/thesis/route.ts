import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET — return saved thesis text and results
export async function GET() {
  const db = getDb();
  const rows = db.prepare(
    "SELECT key, value FROM settings WHERE key IN ('thesis_text', 'thesis_results')"
  ).all() as { key: string; value: string }[];

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return NextResponse.json({
    thesis: map.thesis_text ?? "",
    results: map.thesis_results ? JSON.parse(map.thesis_results) : [],
  });
}
