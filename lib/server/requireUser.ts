import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
import { NextResponse } from "next/server";

// Firebase ID tokens are JWTs signed by Google. Verifying them against the
// published keys is Firebase's documented approach for backends without the
// Admin SDK: RS256, audience = project ID, issuer = securetoken URL.
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// `npm run dev:emulator` sets this for the dev server. Emulator tokens are
// unsigned, so in that mode (and never in production) the claims are only
// decoded.
const usingEmulator =
  process.env.NODE_ENV !== "production" && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

async function verify(token: string): Promise<boolean> {
  if (usingEmulator) {
    const claims = decodeJwt(token);
    return typeof claims.sub === "string" && claims.sub.length > 0;
  }
  if (!PROJECT_ID) return false;
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
    algorithms: ["RS256"],
  });
  return typeof payload.sub === "string" && payload.sub.length > 0;
}

/**
 * Returns a 401 response unless the request carries a valid Firebase ID
 * token; returns null when the caller is signed in. Usage:
 *   const denied = await requireUser(req); if (denied) return denied;
 */
export async function requireUser(req: Request): Promise<NextResponse | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token) {
    try {
      if (await verify(token)) return null;
    } catch {
      // Expired, malformed or wrongly signed: fall through to 401.
    }
  }
  return NextResponse.json({ error: "Sign in required." }, { status: 401 });
}
