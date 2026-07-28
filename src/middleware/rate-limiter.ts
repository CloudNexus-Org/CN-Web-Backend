import type { Request, Response, NextFunction, RequestHandler } from "express";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("RateLimiter");

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

export class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(
    private readonly windowMs = 60 * 1000,
    private readonly maxRequests = 60,
  ) {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private getKey(req: Request): string {
    const visitorId = (req.body as { visitorId?: string } | undefined)
      ?.visitorId;
    return visitorId || req.ip || "unknown";
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  middleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();
      let record = this.store.get(key);

      if (!record || record.resetTime < now) {
        record = { count: 1, resetTime: now + this.windowMs };
        this.store.set(key, record);
        next();
        return;
      }

      record.count++;
      if (record.count > this.maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        logger.warn(`Rate limit exceeded for key: ${key}`, {
          count: record.count,
          limit: this.maxRequests,
        });
        res.status(429).json({
          error: "Too many requests",
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        });
        return;
      }

      next();
    };
  }

  stop(): void {
    clearInterval(this.cleanupInterval);
  }
}

/** Default rate limiter for chatbot endpoints: 60 requests per minute */
export const chatbotRateLimiter = new RateLimiter(60 * 1000, 60);

/** Stricter rate limiter for conversation creation: 10 per minute */
export const conversationRateLimiter = new RateLimiter(60 * 1000, 10);
