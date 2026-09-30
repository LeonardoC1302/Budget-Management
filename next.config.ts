import type { NextConfig } from "next";

// `firebase emulators:exec` sets these for the process it launches (see the
// `dev:emulator` script). Forward them to the client bundle so the Firebase SDK
// can point at the local emulators. Never set in production builds.
const emulatorEnv =
  process.env.NODE_ENV !== "production" && process.env.FIRESTORE_EMULATOR_HOST
    ? {
        NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
        NEXT_PUBLIC_AUTH_EMULATOR_HOST:
          process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "",
      }
    : {};

// Baseline security headers for every response. A Content-Security-Policy is
// deliberately not set yet: Google sign-in, Firestore and the exchange-rate
// API need an allowlist that should be tested before enforcing.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  env: emulatorEnv,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
