import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/** Liveness probe — unchanged contract for Docker / load balancers */
router.get("/", (_req, res) => {
  res.json({ ok: true });
});

/** Readiness probe — checks database connectivity (additive endpoint) */
router.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "connected" });
  } catch {
    res.status(503).json({ ok: false, db: "disconnected" });
  }
});

export default router;
