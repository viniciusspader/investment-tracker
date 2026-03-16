import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = Promise<{ id: string; ticker: string }>;

// DELETE — remove a ticker from a thesis
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { id, ticker } = await params;
  const db = getDb();
  db.prepare("DELETE FROM thesis_tickers WHERE thesis_id=? AND ticker=?").run(id, ticker.toUpperCase());
  return NextResponse.json({ ok: true });
}
