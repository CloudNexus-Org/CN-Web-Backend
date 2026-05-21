const path = require("path");
const dotenv = require("dotenv");

// Load backend/.env regardless of process.cwd()
const envPath = path.resolve(__dirname, "..", ".env");
const result = dotenv.config({ path: envPath, override: true });
if (result.error) {
  console.warn(`[env] Could not load ${envPath}:`, result.error.message);
} else if (process.env.NODE_ENV !== "production") {
  console.log(`[env] Loaded ${envPath}`);
  console.log(`[env] SMTP_USER set: ${Boolean(process.env.SMTP_USER?.trim())}`);
}
