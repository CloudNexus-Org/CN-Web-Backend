import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/**
 * Load backend/.env regardless of process.cwd() (fixes monorepo / concurrently cases
 * where dotenv would otherwise pick the wrong directory).
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "..", ".env");

const result = dotenv.config({ path: envPath, override: true });
if (result.error) {
  console.warn(`[env] Could not load ${envPath}:`, result.error.message);
} else if (process.env.NODE_ENV !== "production") {
  console.log(`[env] Loaded ${envPath}`);
  console.log(`[env] SMTP_USER set: ${Boolean(process.env.SMTP_USER?.trim())}`);
}
