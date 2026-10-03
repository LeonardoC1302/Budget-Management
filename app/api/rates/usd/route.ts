import { NextResponse } from "next/server";
import { getBccrUsdRates } from "@/lib/services/bccrUsdRates";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Units of each currency per 1 USD, from the BCCR (see bccrUsdRates.ts). */
export async function GET(req: Request) {
  const denied = await requireUser(req);
  if (denied) return denied;
  try {
    return NextResponse.json(await getBccrUsdRates());
  } catch (err) {
    console.error("[api/rates/usd] failed:", err);
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
