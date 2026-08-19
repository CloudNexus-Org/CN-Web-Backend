import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

/** Liveness probe — unchanged contract for Docker / load balancers */
router.get("/", (_req, res) => {
  res.json({ ok: true });
});

/** Readiness probe — checks database connectivity (additive endpoint) */
router.get("/ready", async (_req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      res.json({ ok: true, db: "connected" });
    } else {
      res.status(503).json({ ok: false, db: "disconnected" });
    }
  } catch {
    res.status(503).json({ ok: false, db: "disconnected" });
  }
});

export default router;
