import path from "path";
import fs from "fs";
import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const uploadRoot = path.join(process.cwd(), "uploads", "resumes");
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _f, cb) => {
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
      if (err) {
        res
          .status(400)
          .json({ error: err instanceof Error ? err.message : "Upload error" });
        return;
      }
      next();
    });
  },
  async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const f = req.file;
    const b = req.body as Record<string, string | undefined>;
    if (!b.jobTitle || !b.jobSlug) {
      res.status(400).json({ error: "jobTitle and jobSlug are required" });
      return;
    }
    if (!b.fullName || !b.email || !b.phone) {
      res.status(400).json({ error: "fullName, email, and phone are required" });
      return;
    }
    const relativePath = f
      ? path
          .relative(path.join(process.cwd(), "uploads"), f.path)
          .split(path.sep)
          .join("/")
      : null;
    const row = await prisma.jobApplication.create({
      data: {
        userId,
        jobSlug: String(b.jobSlug),
        jobTitle: String(b.jobTitle),
        fullName: String(b.fullName).trim(),
        email: String(b.email).toLowerCase().trim(),
        phone: String(b.phone).trim(),
        currentCompany: b.currentCompany ? String(b.currentCompany) : null,
        ctc: b.ctc ? String(b.ctc) : null,
        experience: b.experience ? String(b.experience) : null,
        resumeFileName: f ? f.originalname : null,
        resumePath: relativePath,
      },
    });
    res.status(201).json({
      id: row.id,
      message: "Application saved",
    });
  },
);

export default router;
