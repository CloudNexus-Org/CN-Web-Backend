import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

const selectPublic = {
  id: true,
  title: true,
  slug: true,
  department: true,
  location: true,
  employmentType: true,
  tagline: true,
  experience: true,
  description: true,
  profileSections: true,
  createdAt: true,
  updatedAt: true,
} as const;

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.jobPosting.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: selectPublic,
    });
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
    const row = await prisma.jobPosting.findUnique({
      where: { slug },
      select: { ...selectPublic, published: true },
    });
    if (!row || !row.published) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    const { published: _published, ...publicRow } = row;
    res.json(publicRow);
  } catch (err) {
    console.error("[job-listings] by slug:", err);
    res.status(500).json({ error: "Could not load job opening" });
  }
});

export default router;
