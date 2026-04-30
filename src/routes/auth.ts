import { Router, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { isSmtpConfigured, sendAdminOtpEmail } from "../lib/mailer.js";
import { authMiddleware, requireAdmin2FA, type AuthRequest, type UserRole } from "../middleware/auth.js";

const router = Router();
const ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 10;

function signToken(
  userId: string,
  role: UserRole,
  admin2fa: boolean,
): string {
  return jwt.sign({ sub: userId, role, admin2fa }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

function makeOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createAdminOtpChallenge(userId: string) {
  const code = makeOtpCode();
  const codeHash = await bcrypt.hash(code, ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.adminTwoFAChallenge.deleteMany({
    where: { userId, consumedAt: null },
  });
  const challenge = await prisma.adminTwoFAChallenge.create({
    data: { userId, codeHash, expiresAt },
  });
  return { code, challenge };
}

async function sendAdminOtpResponse(
  res: Response,
  httpStatus: 200 | 201,
  userEmail: string,
  code: string,
  challenge: { id: string; expiresAt: Date },
  messageWhenEmailed: string,
  messageWhenDevFallback: string,
) {
  const exposeDevCode = process.env.ADMIN_OTP_EXPOSE_DEV_CODE === "true";

  if (isSmtpConfigured()) {
    const sent = await sendAdminOtpEmail(userEmail, code, OTP_EXPIRY_MINUTES);
    if (sent.ok) {
      console.log(`[ADMIN 2FA] OTP emailed to ${userEmail}`);
      res.status(httpStatus).json({
        challengeId: challenge.id,
        expiresAt: challenge.expiresAt.toISOString(),
        message: messageWhenEmailed,
        delivery: "email",
      });
      return;
    }

    console.error(`[ADMIN 2FA] SMTP send failed for ${userEmail}:`, sent.error);

    if (exposeDevCode) {
      console.warn(
        `[ADMIN 2FA] ADMIN_OTP_EXPOSE_DEV_CODE=true — returning OTP in API response for ${userEmail} (not for production).`,
      );
      res.status(httpStatus).json({
        challengeId: challenge.id,
        expiresAt: challenge.expiresAt.toISOString(),
        message: `${messageWhenDevFallback} Email send failed; dev override enabled.`,
        devCode: code,
        delivery: "dev",
      });
      return;
    }

    await prisma.adminTwoFAChallenge.delete({ where: { id: challenge.id } });
    res.status(503).json({
      error:
        "Unable to send verification email. Check SMTP_USER, SMTP_PASS, SMTP_FROM, and Gmail App Password. See server logs for details.",
    });
    return;
  }

  if (exposeDevCode) {
    console.log(`[ADMIN 2FA] SMTP not configured; ADMIN_OTP_EXPOSE_DEV_CODE=true — OTP for ${userEmail}: ${code}`);
    res.status(httpStatus).json({
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt.toISOString(),
      message: messageWhenDevFallback,
      devCode: code,
      delivery: "dev",
    });
    return;
  }

  await prisma.adminTwoFAChallenge.delete({ where: { id: challenge.id } });
  res.status(503).json({
    error:
      "Admin 2FA email is not configured. Set SMTP_USER and SMTP_PASS in backend/.env, or set ADMIN_OTP_EXPOSE_DEV_CODE=true only for local debugging.",
  });
}

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };
  if (!email || !password || !name) {
    res
      .status(400)
      .json({ error: "name, email, and password are required" });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const emailLower = String(email).toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(String(password), ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: emailLower,
      name: String(name).trim(),
      passwordHash,
      role: "USER",
    },
  });
  // No JWT on register — user must sign in (separate step)
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
  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
  });
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
  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
  });
  if (!user || user.role !== "ADMIN") {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }

  const { code, challenge } = await createAdminOtpChallenge(user.id);

  await sendAdminOtpResponse(
    res,
    200,
    user.email,
    code,
    challenge,
    "A verification code was sent to your email.",
    "2FA code generated. Check server logs or use devCode in non-production.",
  );
});

router.post("/admin/signup", async (req, res) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email and password are required" });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const emailLower = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(String(password), ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: emailLower,
      passwordHash,
      role: "ADMIN",
    },
  });

  const { code, challenge } = await createAdminOtpChallenge(user.id);

  await sendAdminOtpResponse(
    res,
    201,
    user.email,
    code,
    challenge,
    "Admin account created. A verification code was sent to your email.",
    "Admin account created. Verify 2FA code to continue.",
  );
});

router.post("/admin/verify-2fa", async (req, res) => {
  const { challengeId, code } = req.body as { challengeId?: string; code?: string };
  if (!challengeId || !code) {
    res.status(400).json({ error: "challengeId and code are required" });
    return;
  }

  const challenge = await prisma.adminTwoFAChallenge.findUnique({
    where: { id: String(challengeId) },
    include: { user: true },
  });

  if (
    !challenge ||
    challenge.consumedAt ||
    challenge.expiresAt.getTime() < Date.now()
  ) {
    res.status(401).json({ error: "Invalid or expired 2FA challenge" });
    return;
  }

  const ok = await bcrypt.compare(String(code), challenge.codeHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid 2FA code" });
    return;
  }

  await prisma.adminTwoFAChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  const token = signToken(challenge.user.id, challenge.user.role, true);
  res.json({
    token,
    user: {
      id: challenge.user.id,
      email: challenge.user.email,
      name: challenge.user.name,
      role: challenge.user.role,
    },
  });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.get("/admin/me", authMiddleware, requireAdmin2FA, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

export default router;
