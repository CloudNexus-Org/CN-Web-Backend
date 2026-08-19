import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, type UserRole } from "../models/User.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/auth.js";

const router = Router();
const ROUNDS = 10;

function signToken(userId: string, role: UserRole, admin2fa: boolean): string {
  return jwt.sign(
    { sub: userId, role, admin2fa },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    },
  );
}

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };
  if (!email || !password || !name) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const emailLower = String(email).toLowerCase();
  const existing = await User.findOne({ email: emailLower });
  if (existing) {
    res
      .status(409)
      .json({ error: "An account with this email already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(String(password), ROUNDS);
  const user = await User.create({
    email: emailLower,
    name: String(name).trim(),
    passwordHash,
    role: "USER",
  });

  res.status(201).json({
    message: "Account created. Sign in with your email and password.",
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = signToken(user.id, user.role, user.role !== "ADMIN");
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || user.role !== "ADMIN") {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }

  const token = signToken(user.id, user.role, true);
  res.status(200).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.post("/admin/signup", async (_req, res) => {
  res.status(403).json({ error: "Public admin registration is disabled. Admin accounts must be created directly by system administrators." });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
});

router.get(
  "/admin/me",
  authMiddleware,
  async (req: AuthRequest, res) => {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  },
);

export default router;
