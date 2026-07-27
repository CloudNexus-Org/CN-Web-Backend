import "./env";
import { validateRequiredEnv } from "./config/index.js";
import { createApp } from "./app.js";
import { startServer } from "./server.js";

validateRequiredEnv();

const app = createApp();

if (process.env.NODE_ENV !== "test") {
  startServer(app);
}

module.exports = app;
