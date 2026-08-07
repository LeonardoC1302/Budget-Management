import { NextResponse } from "next/server";
import {
  MarketDataRateLimitError,
  MarketDataUnavailableError,
  getQuotes,
} from "@/lib/services/marketData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get("symbols") ?? url.searchParams.get("symbol");
  if (!symbolsParam) {
    return NextResponse.json({ error: "missing symbol(s)" }, { status: 400 });
  }
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  try {
    const quotes = await getQuotes(symbols);
    return NextResponse.json({ quotes });
  } catch (err) {
    console.error("[api/market/quote] failed:", err);
    if (err instanceof MarketDataUnavailableError) {
      return NextResponse.json({ error: err.message, quotes: [] }, { status: 503 });
    }
    if (err instanceof MarketDataRateLimitError) {
      return NextResponse.json({ error: err.message, quotes: [] }, { status: 429 });
    }
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message, quotes: [] }, { status: 502 });
  }
}
