/** Comma-separated env entries, plus localhost ↔ 127.0.0.1 twin (avoids CORS "Failed to fetch" in dev). */
export function buildCorsOrigins(): string[] {
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
