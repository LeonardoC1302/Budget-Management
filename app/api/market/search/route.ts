import { NextResponse } from "next/server";
import {
  MarketDataRateLimitError,
  MarketDataUnavailableError,
  searchSymbols,
} from "@/lib/services/marketData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const results = await searchSymbols(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[api/market/search] failed:", err);
    if (err instanceof MarketDataUnavailableError) {
      return NextResponse.json({ error: err.message, results: [] }, { status: 503 });
    }
    if (err instanceof MarketDataRateLimitError) {
      return NextResponse.json({ error: err.message, results: [] }, { status: 429 });
    }
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message, results: [] }, { status: 502 });
  }
}
