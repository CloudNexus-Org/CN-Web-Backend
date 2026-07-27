import type { Express } from "express";
import { getAppConfig } from "./config/index.js";
import { createLogger } from "./lib/logger.js";

const logger = createLogger("Server");

export function startServer(app: Express): void {
  const { port, corsOrigins } = getAppConfig();

  app.listen(port, () => {
    logger.info(`API http://localhost:${port}`);
    logger.info(`CORS origins: ${corsOrigins.join(", ")}`);
  });
}
