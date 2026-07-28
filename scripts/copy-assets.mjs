import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcData = path.join(root, "src", "data");
const distData = path.join(root, "dist", "data");

if (fs.existsSync(srcData)) {
  fs.cpSync(srcData, distData, { recursive: true });
  console.log("[build] Copied src/data → dist/data");
}
