import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";

// Only defined when the dev server runs under `npm run dev:emulator`.
const FIRESTORE_EMULATOR_HOST = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
const AUTH_EMULATOR_HOST = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST;

export const EMULATOR_PROJECT_ID = "demo-perch";

export const usingEmulator =
  process.env.NODE_ENV !== "production" && !!FIRESTORE_EMULATOR_HOST;

// Emulator mode swaps in a `demo-` project ID. Firebase treats demo projects as
// emulator-only, so a misrouted request can never reach the real project.
const config = usingEmulator
  ? {
      apiKey: "demo-api-key",
      authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
      projectId: EMULATOR_PROJECT_ID,
      appId: "demo-app-id",
    }
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

if (!config.apiKey || !config.projectId || !config.appId) {
  throw new Error(
    "Missing Firebase configuration. Copy .env.example to .env.local and fill in the NEXT_PUBLIC_FIREBASE_* values from the Firebase console.",
  );
}

const existingApp = getApps()[0];
export const app: FirebaseApp = existingApp ?? initializeApp(config);
export const auth: Auth = getAuth(app);
export const db: Firestore = existingApp
  ? getFirestore(app)
  : initializeFirestore(app, { ignoreUndefinedProperties: true });
export const googleProvider = new GoogleAuthProvider();

// Connect once per app instance. HMR re-evaluates this module against the
// same app, and connecting twice throws.
if (usingEmulator && !existingApp) {
  const [fsHost, fsPort] = FIRESTORE_EMULATOR_HOST!.split(":");
  connectFirestoreEmulator(db, fsHost, Number(fsPort));
  if (AUTH_EMULATOR_HOST) {
    connectAuthEmulator(auth, `http://${AUTH_EMULATOR_HOST}`, {
      disableWarnings: true,
    });
  }
}
