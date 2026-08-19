import type { Express } from "express";
import { getAppConfig } from "./config/index.js";
import { createLogger } from "./lib/logger.js";
import { connectDB } from "./lib/db.js";

const logger = createLogger("Server");

export async function startServer(app: Express): Promise<void> {
  const { port, corsOrigins } = getAppConfig();

  try {
    await connectDB();
  } catch (error) {
    logger.error("Failed to connect to MongoDB, starting server anyway...", error);
  }

  app.listen(port, () => {
    logger.info(`API http://localhost:${port}`);
    logger.info(`CORS origins: ${corsOrigins.join(", ")}`);
  });
}
