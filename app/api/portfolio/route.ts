import { NextRequest, NextResponse } from "next/server";
import { getDb, Holding } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const holdings = db.prepare("SELECT * FROM holdings ORDER BY created_at DESC").all() as Holding[];
  return NextResponse.json(holdings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, name, asset_type, quantity, avg_buy_price, purchase_date, notes } = body;

  if (!ticker || !quantity || !avg_buy_price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  const upperTicker = ticker.toUpperCase();
  const newQty = Number(quantity);
  const newPrice = Number(avg_buy_price);

  // Check if a holding for this ticker already exists
  const existing = db.prepare("SELECT * FROM holdings WHERE ticker = ?").get(upperTicker) as Holding | undefined;

  if (existing) {
    // Merge: weighted average price, summed quantity
    const mergedQty = existing.quantity + newQty;
    const mergedAvg = (existing.quantity * existing.avg_buy_price + newQty * newPrice) / mergedQty;

    // Keep earliest non-null purchase date
    const incomingDate = purchase_date || null;
    let mergedDate: string | null;
    if (existing.purchase_date && incomingDate) {
      mergedDate = existing.purchase_date < incomingDate ? existing.purchase_date : incomingDate;
    } else {
      mergedDate = existing.purchase_date || incomingDate;
    }

    db.prepare(`
      UPDATE holdings
      SET quantity = ?, avg_buy_price = ?, purchase_date = ?, name = COALESCE(?, name), notes = COALESCE(?, notes)
      WHERE ticker = ?
    `).run(mergedQty, mergedAvg, mergedDate, name || null, notes || null, upperTicker);

    return NextResponse.json({ id: existing.id, merged: true });
  }

  // No existing holding — insert as new
  const result = db.prepare(`
    INSERT INTO holdings (ticker, name, asset_type, quantity, avg_buy_price, purchase_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    upperTicker,
    name || null,
    asset_type || "stock",
    newQty,
    newPrice,
    purchase_date || null,
    notes || null
  );

  return NextResponse.json({ id: result.lastInsertRowid });
}
