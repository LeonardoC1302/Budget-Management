import { auth } from "@/lib/firebase/client";
import type { OwnerCtx, OwnerPermission } from "@/lib/types";

// Module-level cache mirrored from React's `AccessContext`. Store code
// (non-React) reads it synchronously so `list()` in each firebase*Store can
// fan out across owners without having to become async-hooked into React.
let contextCache: OwnerCtx[] = [];

// Called from AccessContext whenever the set of grantors changes.
export function setAccessibleContexts(next: OwnerCtx[]): void {
  contextCache = next;
}

// Returns [{self, "You", "owner"}, ...grantors]. Always includes self as the
// first entry so backwards-compat is trivial: a user with zero connections
// gets exactly one context (themselves), and stores behave as before.
export function getAccessibleContexts(): OwnerCtx[] {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const self: OwnerCtx = { uid, nickname: "You", permission: "owner" };
  const grantors = contextCache.filter((c) => c.uid !== uid);
  return [self, ...grantors];
}

// Looks up the OwnerCtx for a specific ownerUid, or undefined.
export function findOwnerCtx(ownerUid: string): OwnerCtx | undefined {
  return getAccessibleContexts().find((c) => c.uid === ownerUid);
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

// Resolves the uid a mutation should target. If `ownerUid` is undefined, the
// caller is acting on their own data. If it matches self, same thing. If it
// matches a grantor, we check the permission before returning it.
export function requireWriteUid(ownerUid?: string): string {
  const self = auth.currentUser?.uid;
  if (!self) throw new Error("Not signed in.");
  if (!ownerUid || ownerUid === self) return self;
  const ctx = findOwnerCtx(ownerUid);
  if (!ctx) {
    throw new PermissionError(
      `No access to owner ${ownerUid}. The connection may have been revoked.`,
    );
  }
  if (ctx.permission !== "write" && ctx.permission !== "owner") {
    throw new PermissionError(
      `Read-only access to ${ctx.nickname}'s data.`,
    );
  }
  return ownerUid;
}

// Whether the signed-in user is allowed to write to `ownerUid`'s tree.
export function canWriteTo(ownerUid: string): boolean {
  const self = auth.currentUser?.uid;
  if (!self || !ownerUid) return false;
  if (ownerUid === self) return true;
  const ctx = findOwnerCtx(ownerUid);
  return ctx?.permission === "write";
}

export type { OwnerCtx, OwnerPermission };
