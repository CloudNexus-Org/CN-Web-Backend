import { Router } from "express";
import { BlogPost } from "../models/BlogPost.js";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await BlogPost.find({ published: true })
    .sort({ createdAt: -1 })
    .select("title slug excerpt category coverImage authorName authorImage createdAt updatedAt");
  res.json(rows);
});

router.get("/:slug", async (req, res) => {
  const slug = String(req.params.slug || "");
  if (!slug) {
    res.status(400).json({ error: "slug is required" });
    return;
  }
  const row = await BlogPost.findOne({ slug, published: true })
    .select("title slug excerpt content category coverImage authorName authorImage createdAt updatedAt published");
  if (!row) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json(row);
});

export default router;
