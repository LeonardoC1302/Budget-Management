import { NextResponse } from "next/server";
import {
  MarketDataRateLimitError,
  MarketDataUnavailableError,
  getPriceOnDate,
} from "@/lib/services/marketData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol")?.trim();
  const date = url.searchParams.get("date")?.trim();
  if (!symbol || !date) {
    return NextResponse.json({ error: "missing symbol or date" }, { status: 400 });
  }

  try {
    const result = await getPriceOnDate(symbol, date);
    if (!result) {
      return NextResponse.json({ error: "no data" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/market/priceOnDate] failed:", err);
    if (err instanceof MarketDataUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof MarketDataRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
