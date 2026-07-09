// One-time Garmin authentication — mirrors `garmin-mcp-auth`.
//
// Logs in with GARMIN_EMAIL / GARMIN_PASSWORD ONCE and persists the OAuth
// tokens so the app never has to log in again (fresh logins get rate-limited
// by Garmin's Cloudflare edge with HTTP 429 "Error 1015").
//
// Usage:
//   node --env-file=.env.local scripts/garmin-auth.mjs          # authenticate + save
//   node --env-file=.env.local scripts/garmin-auth.mjs --verify # test existing tokens
//
// Tokens are written to GARMIN_TOKEN_DIR (default: ~/.garminconnect), matching
// the python garmin_mcp layout. The script also prints a GARMIN_TOKENS JSON
// blob you can paste into Vercel env vars for serverless deployments.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GarminConnect } from "garmin-connect";

const verify = process.argv.includes("--verify");
const email = process.env.GARMIN_EMAIL;
const password = process.env.GARMIN_PASSWORD;
const dir = process.env.GARMIN_TOKEN_DIR || path.join(os.homedir(), ".garminconnect");

const gc = new GarminConnect({ username: email ?? "", password: password ?? "" });

async function withRetry(fn, { tries = 5 } = {}) {
  let wait = 30_000;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const msg = e?.message ?? String(e);
      const rateLimited = msg.includes("429") || msg.toLowerCase().includes("rate");
      if (!rateLimited || attempt === tries) throw e;
      console.log(`Rate limited by Garmin. Waiting ${wait / 1000}s before retry ${attempt + 1}/${tries}…`);
      await new Promise((r) => setTimeout(r, wait));
      wait *= 2;
    }
  }
}

if (verify) {
  if (!fs.existsSync(path.join(dir, "oauth1_token.json"))) {
    console.error(`No tokens found in ${dir}. Run without --verify first.`);
    process.exit(1);
  }
  gc.loadTokenByFile(dir);
  // Use the profile endpoint — it always returns for an authenticated user,
  // unlike day-scoped metrics (steps/sleep) which can be empty for a given day.
  const profile = await withRetry(() => gc.getUserProfile());
  const who = profile?.displayName || profile?.userName || profile?.fullName || "unknown";
  console.log(`Tokens valid. Authenticated as: ${who}`);
  process.exit(0);
}

if (!email || !password) {
  console.error("Set GARMIN_EMAIL and GARMIN_PASSWORD (e.g. in .env.local) first.");
  process.exit(1);
}

console.log("Logging in to Garmin Connect…");
await withRetry(() => gc.login());
console.log("Login OK.");

fs.mkdirSync(dir, { recursive: true });
gc.exportTokenToFile(dir);
console.log(`Tokens saved to ${dir}`);

const tokens = gc.exportToken();
console.log("\nFor Vercel / serverless, set this env var (single line):\n");
console.log(`GARMIN_TOKENS=${JSON.stringify(tokens)}`);

process.exit(0);
