import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { ticker, name, asset_type, quantity, avg_buy_price, purchase_date, notes } = body;

  const db = getDb();
  db.prepare(`
    UPDATE holdings SET ticker=?, name=?, asset_type=?, quantity=?, avg_buy_price=?, purchase_date=?, notes=?
    WHERE id=?
  `).run(
    ticker?.toUpperCase(),
    name || null,
    asset_type || "stock",
    Number(quantity),
    Number(avg_buy_price),
    purchase_date || null,
    notes || null,
    id
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM holdings WHERE id=?").run(id);
  return NextResponse.json({ ok: true });
}
