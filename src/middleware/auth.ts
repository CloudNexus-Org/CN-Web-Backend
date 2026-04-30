import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type UserRole = "USER" | "ADMIN";
type TokenPayload = { sub: string; role?: UserRole; admin2fa?: boolean };

export type AuthRequest = Request & {
  userId?: string;
  userRole?: UserRole;
  isAdmin2faVerified?: boolean;
};

function parseBearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
}

function getTokenPayload(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Server misconfiguration");
  }
  return jwt.verify(token, secret) as TokenPayload;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const token = parseBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  try {
    const p = getTokenPayload(token);
    req.userId = p.sub;
    req.userRole = p.role ?? "USER";
    req.isAdmin2faVerified = Boolean(p.admin2fa);
    next();
  } catch (err) {
    if (err instanceof Error && err.message === "Server misconfiguration") {
      res.status(500).json({ error: "Server misconfiguration" });
      return;
    }
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireAdmin2FA(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.userRole !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  if (!req.isAdmin2faVerified) {
    res.status(403).json({ error: "2FA verification required" });
    return;
  }
  next();
}
