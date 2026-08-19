import { buildCorsOrigins } from "./cors.js";

export type AppConfig = {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  isTest: boolean;
  mongodbUri: string;
  jwtSecret: string;
  corsOrigins: string[];
};

export function validateRequiredEnv(): void {
  if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/cloudnexus";
    console.warn("[env] MONGODB_URI not set, defaulting to mongodb://127.0.0.1:27017/cloudnexus");
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "default_secret_please_change_in_production_32chars";
    console.warn("[env] JWT_SECRET not set, using default fallback secret");
  }
}

export function getAppConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || "development";

  return {
    port: Number(process.env.PORT) || 4000,
    nodeEnv,
    isProduction: nodeEnv === "production",
    isTest: nodeEnv === "test",
    mongodbUri: (process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/cloudnexus") as string,
    jwtSecret: process.env.JWT_SECRET as string,
    corsOrigins: buildCorsOrigins(),
  };
}
