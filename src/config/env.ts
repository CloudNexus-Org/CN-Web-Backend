import { buildCorsOrigins } from "./cors.js";

export type AppConfig = {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  isTest: boolean;
  databaseUrl: string;
  jwtSecret: string;
  corsOrigins: string[];
};

export function validateRequiredEnv(): void {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET");
    process.exit(1);
  }
}

export function getAppConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || "development";

  return {
    port: Number(process.env.PORT) || 4000,
    nodeEnv,
    isProduction: nodeEnv === "production",
    isTest: nodeEnv === "test",
    databaseUrl: process.env.DATABASE_URL as string,
    jwtSecret: process.env.JWT_SECRET as string,
    corsOrigins: buildCorsOrigins(),
  };
}
