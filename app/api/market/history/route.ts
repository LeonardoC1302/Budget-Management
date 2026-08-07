import { NextResponse } from "next/server";
import {
  MarketDataRateLimitError,
  MarketDataUnavailableError,
  getHistory,
  type MarketRange,
} from "@/lib/services/marketData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_RANGES: readonly MarketRange[] = ["1M", "3M", "6M", "1Y", "5Y"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol")?.trim();
  const range = url.searchParams.get("range")?.toUpperCase() as
    | MarketRange
    | undefined;

  if (!symbol) {
    return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  }
  if (!range || !VALID_RANGES.includes(range)) {
    return NextResponse.json(
      { error: "range must be one of 1M, 3M, 6M, 1Y, 5Y" },
      { status: 400 },
    );
  }

  try {
    const history = await getHistory(symbol, range);
    return NextResponse.json(history);
  } catch (err) {
    console.error("[api/market/history] failed:", err);
    if (err instanceof MarketDataUnavailableError) {
      return NextResponse.json(
        { error: err.message, symbol, quoteCurrency: "USD", points: [] },
        { status: 503 },
      );
    }
    if (err instanceof MarketDataRateLimitError) {
      return NextResponse.json(
        { error: err.message, symbol, quoteCurrency: "USD", points: [] },
        { status: 429 },
      );
    }
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: message, symbol, quoteCurrency: "USD", points: [] },
      { status: 502 },
    );
  }
}
