import { auth } from "@/lib/firebase/client";

/**
 * fetch() for this app's own /api routes. Attaches the signed-in user's
 * Firebase ID token so the routes can refuse anonymous callers (they proxy a
 * rate-limited market-data key and scrape a third-party site). The SDK caches
 * the token and refreshes it only when it's close to expiring.
 */
export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
