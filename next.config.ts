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

const nextConfig: NextConfig = {
  env: emulatorEnv,
};

export default nextConfig;
