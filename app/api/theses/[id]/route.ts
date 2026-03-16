import { NextRequest, NextResponse } from "next/server";
import { getDb, Thesis, ThesisTicker } from "@/lib/db";

type Params = Promise<{ id: string }>;

// GET — thesis detail with its tickers
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const db = getDb();
  const thesis = db.prepare("SELECT * FROM theses WHERE id=?").get(id) as Thesis | undefined;
  if (!thesis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tickers = db.prepare(
    "SELECT * FROM thesis_tickers WHERE thesis_id=? ORDER BY added_at DESC"
  ).all(id) as ThesisTicker[];

  return NextResponse.json({ ...thesis, tickers });
}

// PATCH — update name or text
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  if (body.name !== undefined) {
    db.prepare("UPDATE theses SET name=? WHERE id=?").run(body.name, id);
  }
  if (body.text !== undefined) {
    db.prepare("UPDATE theses SET text=? WHERE id=?").run(body.text, id);
  }
  return NextResponse.json({ ok: true });
}

// DELETE — delete thesis (cascades to tickers)
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM theses WHERE id=?").run(id);
  return NextResponse.json({ ok: true });
}
