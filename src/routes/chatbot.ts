import { randomUUID } from "crypto";
import { Router } from "express";
import { chatbotRateLimiter } from "../middleware/rate-limiter.js";
import { createLogger } from "../lib/logger.js";

const router = Router();
const logger = createLogger("Chatbot");

const CHATBOT_SERVICE_URL =
  process.env.CHATBOT_SERVICE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

type UpstreamChatResponse = {
  response?: string;
  query_type?: string;
  retrieved_docs?: unknown[];
};

router.post("/message", chatbotRateLimiter.middleware(), async (req, res) => {
  const { message, sessionId } = req.body as {
    message?: string;
    sessionId?: string | null;
  };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const sid =
    typeof sessionId === "string" && sessionId.trim()
      ? sessionId.trim()
      : randomUUID();

  try {
    const upstream = await fetch(`${CHATBOT_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: message.trim() }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      logger.error("Chatbot upstream error", {
        status: upstream.status,
        detail: detail.slice(0, 500),
      });
      res.status(502).json({ error: "Chatbot service unavailable" });
      return;
    }

    const data = (await upstream.json()) as UpstreamChatResponse;

    res.json({
      sessionId: sid,
      intent: data.query_type ?? null,
      answer: data.response ?? "I could not generate a response.",
      meta: {
        retrievedDocs: data.retrieved_docs ?? [],
      },
    });
  } catch (err) {
    logger.error("Chatbot proxy failed", {
      error: err instanceof Error ? err.message : String(err),
      serviceUrl: CHATBOT_SERVICE_URL,
    });
    res.status(503).json({ error: "Chatbot service unreachable" });
  }
});

export default router;
