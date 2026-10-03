import { t } from "@/lib/i18n";

// Device-local app lock. Settings live in localStorage per signed-in user, so
// a PIN set on the phone doesn't lock the laptop and vice versa.
//
// This is a screen lock: it keeps someone holding an unlocked phone out of
// the app. It doesn't encrypt anything; the Firestore cache in IndexedDB is
// readable by anyone with devtools on an unlocked computer.

const KEY_PREFIX = "perch:lock:";
const PBKDF2_ITERATIONS = 150_000;

export interface LockSettings {
  pinHash: string;
  salt: string;
  pinLength: number;
  // WebAuthn credential for fingerprint / face unlock, base64url.
  credentialId?: string;
  // Lock again after the app has been in the background this long.
  timeoutMinutes: number;
}

export const LOCK_TIMEOUTS = [0, 1, 5, 15] as const;

function storageKey(uid: string): string {
  return `${KEY_PREFIX}${uid}`;
}

export function readLockSettings(uid: string): LockSettings | null {
  try {
    const raw = window.localStorage.getItem(storageKey(uid));
    return raw ? (JSON.parse(raw) as LockSettings) : null;
  } catch {
    return null;
  }
}

function writeLockSettings(uid: string, settings: LockSettings | null): void {
  try {
    if (settings) window.localStorage.setItem(storageKey(uid), JSON.stringify(settings));
    else window.localStorage.removeItem(storageKey(uid));
  } catch {
    // Storage blocked: the lock can't persist, so it simply stays off.
  }
  window.dispatchEvent(new Event("perch:lock-changed"));
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const s = atob(b64 + "===".slice((b64.length + 3) % 4));
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromBase64Url(salt), iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toBase64Url(bits);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export async function setPin(uid: string, pin: string): Promise<void> {
  if (!isValidPin(pin)) throw new Error(t("PIN must be 4 to 6 digits."));
  const salt = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const existing = readLockSettings(uid);
  writeLockSettings(uid, {
    pinHash: await hashPin(pin, salt),
    salt,
    pinLength: pin.length,
    credentialId: existing?.credentialId,
    timeoutMinutes: existing?.timeoutMinutes ?? 1,
  });
}

export async function verifyPin(uid: string, pin: string): Promise<boolean> {
  const settings = readLockSettings(uid);
  if (!settings) return true;
  return (await hashPin(pin, settings.salt)) === settings.pinHash;
}

export function removeLock(uid: string): void {
  writeLockSettings(uid, null);
}

export function setLockTimeout(uid: string, minutes: number): void {
  const settings = readLockSettings(uid);
  if (settings) writeLockSettings(uid, { ...settings, timeoutMinutes: minutes });
}

/** True when the device has a fingerprint / face / device-PIN authenticator. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    return (
      typeof window !== "undefined" &&
      !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

export async function enableBiometric(
  uid: string,
  userName: string,
): Promise<void> {
  const settings = readLockSettings(uid);
  if (!settings) throw new Error(t("Set a PIN first."));
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "PerchCR", id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(uid.slice(0, 64)),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "discouraged",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error(t("Couldn't set up fingerprint unlock."));
  writeLockSettings(uid, { ...settings, credentialId: toBase64Url(credential.rawId) });
}

export function disableBiometric(uid: string): void {
  const settings = readLockSettings(uid);
  if (settings) writeLockSettings(uid, { ...settings, credentialId: undefined });
}

/**
 * Ask the platform authenticator to verify the user. There's no server to
 * check the signature against, so success means the device confirmed the
 * person (fingerprint, face or device PIN), which is all a local lock needs.
 */
export async function verifyBiometric(uid: string): Promise<boolean> {
  const settings = readLockSettings(uid);
  if (!settings?.credentialId) return false;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [
          { type: "public-key", id: fromBase64Url(settings.credentialId), transports: ["internal"] },
        ],
        userVerification: "required",
        rpId: window.location.hostname,
        timeout: 60_000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}
