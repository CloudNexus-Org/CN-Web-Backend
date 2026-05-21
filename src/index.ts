import "./env";
import path from "path";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import applicationRoutes from "./routes/applications.js";
import contactRoutes from "./routes/contacts.js";
import blogRoutes from "./routes/blogs.js";
import jobListingsPublicRoutes from "./routes/jobListingsPublic.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

/** Comma-separated env entries, plus localhost ↔ 127.0.0.1 twin (avoids CORS "Failed to fetch" in dev). */
function buildCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN || "http://localhost:3000";
  const bases = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const out = new Set<string>();
  for (const o of bases) {
    out.add(o);
    try {
      const u = new URL(o);
      const host = u.hostname.toLowerCase();
      if (host === "localhost") {
        u.hostname = "127.0.0.1";
        out.add(u.toString().replace(/\/$/, ""));
      } else if (host === "127.0.0.1") {
        u.hostname = "localhost";
        out.add(u.toString().replace(/\/$/, ""));
      }
    } catch {
      /* ignore bad URL */
    }
  }
  return [...out];
}

const corsOrigins = buildCorsOrigins();

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET");
  process.exit(1);
}

app.use(
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/applications", applicationRoutes);
app.use("/contacts", contactRoutes);
app.use("/blogs", blogRoutes);
app.use("/job-listings", jobListingsPublicRoutes);
app.use("/admin", adminRoutes);

// Dev-only: serve files under /uploads from repo root (replace with S3 later)
const uploadDir = path.join(process.cwd(), "uploads");
app.use(
  "/uploads",
  express.static(uploadDir, { fallthrough: true }),
  (_req, res) => {
    res.status(404).end();
  },
);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});



if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`API http://localhost:${port}`);
    console.log(`CORS origins: ${corsOrigins.join(", ")}`);
  });
}

module.exports = app;
// Reload trigger
