import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import { getAppConfig } from "./config/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.js";
import applicationRoutes from "./routes/applications.js";
import contactRoutes from "./routes/contacts.js";
import blogRoutes from "./routes/blogs.js";
import jobListingsPublicRoutes from "./routes/jobListingsPublic.js";
import adminRoutes from "./routes/admin.js";
import healthRoutes from "./routes/health.js";
import chatbotRoutes from "./routes/chatbot.js";

export function createApp(): Express {
  const config = getAppConfig();
  const app = express();

  if (config.isProduction) {
    app.set("trust proxy", 1);
  }

  app.disable("x-powered-by");

  app.use(
    cors({
      origin: config.corsOrigins.length === 1 ? config.corsOrigins[0] : config.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRoutes);

  app.use("/auth", authRoutes);
  app.use("/applications", applicationRoutes);
  app.use("/contacts", contactRoutes);
  app.use("/blogs", blogRoutes);
  app.use("/job-listings", jobListingsPublicRoutes);
  app.use("/admin", adminRoutes);
  app.use("/chatbot", chatbotRoutes);

  // Dev-only: serve files under /uploads from repo root (replace with S3 later)
  const uploadDir = path.join(process.cwd(), "uploads");
  app.use(
    "/uploads",
    express.static(uploadDir, { fallthrough: true }),
    (_req, res) => {
      res.status(404).end();
    },
  );

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);

  return app;
}
