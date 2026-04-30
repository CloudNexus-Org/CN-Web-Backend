import crypto from "node:crypto";
import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireAdmin2FA, type AuthRequest } from "../middleware/auth.js";

const router = Router();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return [];
}

type ProfileSection = { heading: string; items: string[] };

function parseProfileSections(input: unknown): ProfileSection[] {
  if (!Array.isArray(input)) return [];
  const out: ProfileSection[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const heading = typeof o.heading === "string" ? o.heading.trim() : "";
    let items: string[] = [];
    if (Array.isArray(o.items)) {
      items = o.items.map((x) => String(x).trim()).filter(Boolean);
    } else if (typeof o.items === "string") {
      items = o.items
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    }
    if (!heading && items.length === 0) continue;
    out.push({ heading: heading || "Details", items });
  }
  return out;
}

router.use(authMiddleware, requireAdmin2FA);

const blogImagesDir = path.join(process.cwd(), "uploads", "blog-images");
fs.mkdirSync(blogImagesDir, { recursive: true });

const blogImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, blogImagesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 16);
    const safeExt = /^\.[a-zA-Z0-9]+$/.test(ext) ? ext : "";
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExt || ".bin"}`);
  },
});

const blogImageMulter = multer({
  storage: blogImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype) || file.mimetype === "image/svg+xml";
    if (ok) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, GIF, or SVG images are allowed"));
  },
});

router.post("/uploads/blog-image", (req, res) => {
  blogImageMulter.single("file")(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      res.status(400).json({ error: msg });
      return;
    }
    const f = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (!f) {
      res.status(400).json({ error: "No file" });
      return;
    }
    const uploadsRoot = path.join(process.cwd(), "uploads");
    const relative = path.relative(uploadsRoot, f.path).replace(/\\/g, "/");
    res.json({ path: relative });
  });
});

router.get("/blogs", async (_req, res) => {
  const rows = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  res.json(rows);
});

router.post("/blogs", async (req: AuthRequest, res) => {
  const b = req.body as {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    coverImage?: string;
    authorName?: string | null;
    authorImage?: string | null;
    published?: boolean;
  };
  if (!b.title || !b.excerpt || !b.content) {
    res.status(400).json({ error: "title, excerpt and content are required" });
    return;
  }
  const computedSlug = slugify(b.slug || b.title);
  if (!computedSlug) {
    res.status(400).json({ error: "Unable to generate slug" });
    return;
  }
  const existing = await prisma.blogPost.findUnique({ where: { slug: computedSlug } });
  if (existing) {
    res.status(409).json({ error: "Slug already exists" });
    return;
  }
  try {
    const row = await prisma.blogPost.create({
      data: {
        title: String(b.title).trim(),
        slug: computedSlug,
        excerpt: String(b.excerpt).trim(),
        content: String(b.content).trim(),
        category: b.category ? String(b.category).trim() : null,
        coverImage: b.coverImage ? String(b.coverImage).trim() : null,
        authorName: b.authorName != null && String(b.authorName).trim() ? String(b.authorName).trim() : null,
        authorImage: b.authorImage != null && String(b.authorImage).trim() ? String(b.authorImage).trim() : null,
        published: b.published ?? true,
        authorId: req.userId,
      },
    });
    res.status(201).json(row);
  } catch (e) {
    console.error("[admin] POST /blogs", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      if (!res.headersSent) res.status(409).json({ error: "Slug already exists" });
      return;
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      if (!res.headersSent) {
        res.status(400).json({
          error:
            "Invalid author account for this post. Sign out and sign in again, or run `npx prisma db push` if the database schema is outdated.",
        });
      }
      return;
    }
    const hint =
      e instanceof Error && /authorName|authorImage|column/i.test(e.message)
        ? " Run `npx prisma db push` (or migrate) on the server so the database matches the latest schema."
        : "";
    if (!res.headersSent) {
      res.status(500).json({
        error: `${e instanceof Error ? e.message : "Save failed"}.${hint}`,
      });
    }
  }
});

router.put("/blogs/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const b = req.body as {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    coverImage?: string | null;
    authorName?: string | null;
    authorImage?: string | null;
    published?: boolean;
  };
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  const nextSlug = b.slug
    ? slugify(String(b.slug))
    : b.title
      ? slugify(String(b.title))
      : existing.slug;
  if (!nextSlug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const duplicate = await prisma.blogPost.findFirst({
    where: { slug: nextSlug, id: { not: id } },
    select: { id: true },
  });
  if (duplicate) {
    res.status(409).json({ error: "Slug already exists" });
    return;
  }

  const coverImage =
    b.coverImage === null
      ? null
      : typeof b.coverImage === "string"
        ? String(b.coverImage).trim() || null
        : undefined;
  const authorName =
    b.authorName === null
      ? null
      : typeof b.authorName === "string"
        ? String(b.authorName).trim() || null
        : undefined;
  const authorImage =
    b.authorImage === null
      ? null
      : typeof b.authorImage === "string"
        ? String(b.authorImage).trim() || null
        : undefined;

  try {
    const row = await prisma.blogPost.update({
      where: { id },
      data: {
        title: b.title ? String(b.title).trim() : undefined,
        slug: nextSlug,
        excerpt: b.excerpt ? String(b.excerpt).trim() : undefined,
        content: b.content ? String(b.content).trim() : undefined,
        category: typeof b.category === "string" ? String(b.category).trim() : undefined,
        ...(coverImage !== undefined ? { coverImage } : {}),
        ...(authorName !== undefined ? { authorName } : {}),
        ...(authorImage !== undefined ? { authorImage } : {}),
        published: typeof b.published === "boolean" ? b.published : undefined,
      },
    });
    res.json(row);
  } catch (e) {
    console.error("[admin] PUT /blogs/:id", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      if (!res.headersSent) res.status(409).json({ error: "Slug already exists" });
      return;
    }
    const hint =
      e instanceof Error && /authorName|authorImage|column/i.test(e.message)
        ? " Run `npx prisma db push` (or migrate) on the server so the database matches the latest schema."
        : "";
    if (!res.headersSent) {
      res.status(500).json({
        error: `${e instanceof Error ? e.message : "Update failed"}.${hint}`,
      });
    }
  }
});

router.delete("/blogs/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  await prisma.blogPost.delete({ where: { id } });
  res.status(204).end();
});

router.get("/applications", async (_req, res) => {
  const rows = await prisma.jobApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  res.json(rows);
});

function tryDeleteResumeFile(relativePath: string | null) {
  if (!relativePath) return;
  const uploadsRoot = path.resolve(path.join(process.cwd(), "uploads"));
  const abs = path.resolve(path.join(uploadsRoot, relativePath));
  if (!abs.startsWith(uploadsRoot + path.sep) && abs !== uploadsRoot) {
    return;
  }
  try {
    fs.unlinkSync(abs);
  } catch {
    /* file missing or permission — ignore */
  }
}

router.patch("/applications/:id/approve", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const existing = await prisma.jobApplication.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const row = await prisma.jobApplication.update({
    where: { id },
    data: { status: "APPROVED" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  res.json(row);
});

router.delete("/applications/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const existing = await prisma.jobApplication.findUnique({
    where: { id },
    select: { id: true, resumePath: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  tryDeleteResumeFile(existing.resumePath);
  await prisma.jobApplication.delete({ where: { id } });
  res.status(204).end();
});

router.get("/contacts", async (_req, res) => {
  const rows = await prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(rows);
});

router.get("/job-postings", async (_req, res) => {
  const rows = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(rows);
});

router.post("/job-postings", async (req, res) => {
  const b = req.body as {
    title?: string;
    slug?: string;
    department?: string;
    location?: string;
    employmentType?: string;
    tagline?: string;
    experience?: string;
    description?: unknown;
    profileSections?: unknown;
    published?: boolean;
  };
  if (!b.title?.trim() || !b.department?.trim()) {
    res.status(400).json({ error: "title and department are required" });
    return;
  }
  const computedSlug = slugify(String(b.slug || b.title));
  if (!computedSlug) {
    res.status(400).json({ error: "Unable to generate slug" });
    return;
  }
  const dup = await prisma.jobPosting.findUnique({ where: { slug: computedSlug } });
  if (dup) {
    res.status(409).json({ error: "Slug already exists" });
    return;
  }
  let description = parseStringArray(b.description);
  if (description.length === 0) {
    description = ["Role details will be updated soon."];
  }
  const profileSections = parseProfileSections(b.profileSections);

  const row = await prisma.jobPosting.create({
    data: {
      title: String(b.title).trim(),
      slug: computedSlug,
      department: String(b.department).trim(),
      location: b.location?.trim() ? String(b.location).trim() : "Remote",
      employmentType: b.employmentType?.trim() ? String(b.employmentType).trim() : "Full-time",
      tagline: b.tagline?.trim() ? String(b.tagline).trim() : "",
      experience: b.experience?.trim() ? String(b.experience).trim() : "2+ years",
      description,
      profileSections,
      published: b.published ?? true,
    },
  });
  res.status(201).json(row);
});

router.put("/job-postings/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const existing = await prisma.jobPosting.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Job posting not found" });
    return;
  }
  const b = req.body as {
    title?: string;
    slug?: string;
    department?: string;
    location?: string;
    employmentType?: string;
    tagline?: string;
    experience?: string;
    description?: unknown;
    profileSections?: unknown;
    published?: boolean;
  };
  const nextSlug = b.slug
    ? slugify(String(b.slug))
    : b.title
      ? slugify(String(b.title))
      : existing.slug;
  if (!nextSlug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const duplicate = await prisma.jobPosting.findFirst({
    where: { slug: nextSlug, id: { not: id } },
    select: { id: true },
  });
  if (duplicate) {
    res.status(409).json({ error: "Slug already exists" });
    return;
  }

  let description: string[] | undefined;
  if (b.description !== undefined) {
    description = parseStringArray(b.description);
    if (description.length === 0) {
      description = ["Role details will be updated soon."];
    }
  }
  let profileSections: ProfileSection[] | undefined;
  if (b.profileSections !== undefined) {
    profileSections = parseProfileSections(b.profileSections);
  }

  const row = await prisma.jobPosting.update({
    where: { id },
    data: {
      title: b.title !== undefined ? String(b.title).trim() : undefined,
      slug: nextSlug,
      department: b.department !== undefined ? String(b.department).trim() : undefined,
      location: b.location !== undefined ? String(b.location || "Remote").trim() : undefined,
      employmentType:
        b.employmentType !== undefined ? String(b.employmentType || "Full-time").trim() : undefined,
      tagline: b.tagline !== undefined ? String(b.tagline).trim() : undefined,
      experience: b.experience !== undefined ? String(b.experience || "2+ years").trim() : undefined,
      description: description !== undefined ? description : undefined,
      profileSections: profileSections !== undefined ? profileSections : undefined,
      published: typeof b.published === "boolean" ? b.published : undefined,
    },
  });
  res.json(row);
});

router.delete("/job-postings/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const existing = await prisma.jobPosting.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    res.status(404).json({ error: "Job posting not found" });
    return;
  }
  await prisma.jobPosting.delete({ where: { id } });
  res.status(204).end();
});

export default router;
