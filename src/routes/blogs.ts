import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      coverImage: true,
      authorName: true,
      authorImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(rows);
});

router.get("/:slug", async (req, res) => {
  const slug = String(req.params.slug || "");
  if (!slug) {
    res.status(400).json({ error: "slug is required" });
    return;
  }
  const row = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      category: true,
      coverImage: true,
      authorName: true,
      authorImage: true,
      createdAt: true,
      updatedAt: true,
      published: true,
    },
  });
  if (!row || !row.published) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json(row);
});

export default router;
