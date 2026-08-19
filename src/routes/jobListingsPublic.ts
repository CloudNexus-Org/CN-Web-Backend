import { Router } from "express";
import { JobPosting } from "../models/JobPosting.js";

const router = Router();

const selectPublic = "title slug department location employmentType tagline experience description profileSections createdAt updatedAt";

router.get("/", async (_req, res) => {
  try {
    const rows = await JobPosting.find({ published: true })
      .sort({ createdAt: -1 })
      .select(selectPublic);
    res.json(rows);
  } catch (err) {
    console.error("[job-listings] list:", err);
    res.status(500).json({ error: "Could not load job openings" });
  }
});

router.get("/:slug", async (req, res) => {
  const slug = String(req.params.slug || "").trim();
  if (!slug) {
    res.status(400).json({ error: "slug is required" });
    return;
  }
  try {
    const row = await JobPosting.findOne({ slug, published: true }).select(selectPublic);
    if (!row) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    console.error("[job-listings] by slug:", err);
    res.status(500).json({ error: "Could not load job opening" });
  }
});

export default router;
