import crypto from "node:crypto";
import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { BlogPost } from "../models/BlogPost.js";
import { JobPosting } from "../models/JobPosting.js";
import { JobApplication } from "../models/JobApplication.js";
import { ContactInquiry } from "../models/ContactInquiry.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";

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

router.use(authMiddleware);

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
  try {
    const rows = await BlogPost.find().sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch blogs" });
  }
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
  const existing = await BlogPost.findOne({ slug: computedSlug });
  if (existing) {
    res.status(409).json({ error: "Slug already exists" });
    return;
  }
  try {
    const row = await BlogPost.create({
      title: String(b.title).trim(),
      slug: computedSlug,
      excerpt: String(b.excerpt).trim(),
      content: String(b.content).trim(),
      category: b.category ? String(b.category).trim() : null,
      coverImage: b.coverImage ? String(b.coverImage).trim() : null,
      authorName: b.authorName != null && String(b.authorName).trim() ? String(b.authorName).trim() : null,
      authorImage: b.authorImage != null && String(b.authorImage).trim() ? String(b.authorImage).trim() : null,
      published: b.published ?? true,
      authorId: req.userId || null,
    });
    res.status(201).json(row);
  } catch (e) {
    console.error("[admin] POST /blogs", e);
    if (!res.headersSent) {
      res.status(500).json({
        error: e instanceof Error ? e.message : "Save failed",
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
  const existing = await BlogPost.findById(id);
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
  const duplicate = await BlogPost.findOne({ slug: nextSlug, _id: { $ne: id } });
  if (duplicate) {
    res.status(409).json({ error: "Slug already exists" });
    return;
  }

  const updateData: Record<string, any> = {};
  if (b.title !== undefined) updateData.title = String(b.title).trim();
  updateData.slug = nextSlug;
  if (b.excerpt !== undefined) updateData.excerpt = String(b.excerpt).trim();
  if (b.content !== undefined) updateData.content = String(b.content).trim();
  if (typeof b.category === "string") updateData.category = String(b.category).trim();
  if (b.coverImage !== undefined) updateData.coverImage = b.coverImage ? String(b.coverImage).trim() : null;
  if (b.authorName !== undefined) updateData.authorName = b.authorName ? String(b.authorName).trim() : null;
  if (b.authorImage !== undefined) updateData.authorImage = b.authorImage ? String(b.authorImage).trim() : null;
  if (typeof b.published === "boolean") updateData.published = b.published;

  try {
    const row = await BlogPost.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    res.json(row);
  } catch (e) {
    console.error("[admin] PUT /blogs/:id", e);
    if (!res.headersSent) {
      res.status(500).json({
        error: e instanceof Error ? e.message : "Update failed",
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
  const existing = await BlogPost.findById(id);
  if (!existing) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  await BlogPost.findByIdAndDelete(id);
  res.status(204).end();
});

router.get("/applications", async (_req, res) => {
  try {
    const rows = await JobApplication.find().sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch applications" });
  }
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
  const existing = await JobApplication.findById(id);
  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const row = await JobApplication.findByIdAndUpdate(
    id,
    { $set: { status: "APPROVED" } },
    { new: true }
  );
  res.json(row);
});

router.delete("/applications/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const existing = await JobApplication.findById(id);
  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  tryDeleteResumeFile(existing.resumePath);
  await JobApplication.findByIdAndDelete(id);
  res.status(204).end();
});

router.get("/contacts", async (_req, res) => {
  try {
    const rows = await ContactInquiry.find().sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch contacts" });
  }
});

router.get("/job-postings", async (_req, res) => {
  try {
    const rows = await JobPosting.find().sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch job postings" });
  }
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
  const dup = await JobPosting.findOne({ slug: computedSlug });
  if (dup) {
    res.status(409).json({ error: "Slug already exists" });
    return;
  }
  let description = parseStringArray(b.description);
  if (description.length === 0) {
    description = ["Role details will be updated soon."];
  }
  const profileSections = parseProfileSections(b.profileSections);

  const row = await JobPosting.create({
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
  });
  res.status(201).json(row);
});

router.put("/job-postings/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const existing = await JobPosting.findById(id);
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
  const duplicate = await JobPosting.findOne({ slug: nextSlug, _id: { $ne: id } });
  if (duplicate) {
    res.status(409).json({ error: "Slug already exists" });
    return;
  }

  const updateData: Record<string, any> = {};
  if (b.title !== undefined) updateData.title = String(b.title).trim();
  updateData.slug = nextSlug;
  if (b.department !== undefined) updateData.department = String(b.department).trim();
  if (b.location !== undefined) updateData.location = String(b.location || "Remote").trim();
  if (b.employmentType !== undefined)
    updateData.employmentType = String(b.employmentType || "Full-time").trim();
  if (b.tagline !== undefined) updateData.tagline = String(b.tagline).trim();
  if (b.experience !== undefined) updateData.experience = String(b.experience || "2+ years").trim();
  if (b.description !== undefined) {
    let description = parseStringArray(b.description);
    if (description.length === 0) description = ["Role details will be updated soon."];
    updateData.description = description;
  }
  if (b.profileSections !== undefined) {
    updateData.profileSections = parseProfileSections(b.profileSections);
  }
  if (typeof b.published === "boolean") updateData.published = b.published;

  const row = await JobPosting.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  res.json(row);
});

router.delete("/job-postings/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const existing = await JobPosting.findById(id);
  if (!existing) {
    res.status(404).json({ error: "Job posting not found" });
    return;
  }
  await JobPosting.findByIdAndDelete(id);
  res.status(204).end();
});

export default router;
