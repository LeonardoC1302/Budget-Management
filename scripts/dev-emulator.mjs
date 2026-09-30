// Runs `next dev` against the local Firebase emulators (Auth + Firestore).
// Test data persists in .emulator-data/ between runs; `npm run emulator:reset`
// wipes it. Nothing here talks to the real Firebase project: the demo-perch
// project ID is emulator-only by Firebase's own rules.
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { delimiter, join } from "node:path";

const DATA_DIR = ".emulator-data";
const PROJECT_ID = "demo-perch";

// winget installs Java without refreshing PATH for already-open shells.
function withJavaOnPath(env) {
  const pathKey = Object.keys(env).find((k) => k.toLowerCase() === "path") ?? "PATH";
  const current = env[pathKey] ?? "";
  if (/java/i.test(current) || process.platform !== "win32") return env;
  const roots = [
    "C:\\Program Files\\Eclipse Adoptium",
    "C:\\Program Files\\Java",
    "C:\\Program Files\\Microsoft",
  ];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const jdk = readdirSync(root).find((d) => /^(jdk|jre)-?\d/i.test(d));
    if (jdk) {
      return { ...env, [pathKey]: `${join(root, jdk, "bin")}${delimiter}${current}` };
    }
  }
  return env;
}

const args = [
  "firebase",
  "emulators:exec",
  "--project",
  PROJECT_ID,
  "--only",
  "auth,firestore",
  "--ui",
  `--export-on-exit=${DATA_DIR}`,
];
if (existsSync(join(DATA_DIR, "firebase-export-metadata.json"))) {
  args.push(`--import=${DATA_DIR}`);
}
args.push('"next dev"');

// One command string: shell mode is needed on Windows to resolve npx.cmd.
const child = spawn(`npx ${args.join(" ")}`, {
  stdio: "inherit",
  shell: true,
  env: withJavaOnPath(process.env),
});
child.on("exit", (code) => process.exit(code ?? 0));
