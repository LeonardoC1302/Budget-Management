import { NextResponse } from "next/server";
import { getBccrSnapshot } from "@/lib/services/bccrRates";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireUser(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const force = url.searchParams.get("refresh") === "1";
  try {
    const snapshot = await getBccrSnapshot({ force });
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[api/rates/bccr] failed:", err);
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: message, entities: [], fetchedAt: null },
      { status: 502 },
    );
  }
}
