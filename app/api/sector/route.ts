import { NextRequest, NextResponse } from "next/server";
import { getSectorTickers } from "@/lib/yahoo";

export const SECTORS = [
  "AI & Machine Learning",
  "Semiconductors",
  "Renewable Energy",
  "Biotech & Healthcare",
  "Cybersecurity",
  "Consumer Discretionary",
  "Financials",
  "Commodities & Materials",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sector = searchParams.get("sector");

  if (!sector) {
    return NextResponse.json({ sectors: SECTORS });
  }

  const tickers = await getSectorTickers(sector);
  return NextResponse.json(tickers);
}
