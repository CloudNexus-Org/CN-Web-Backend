import mongoose from "mongoose";
import { createLogger } from "./logger.js";

const logger = createLogger("Database");

export async function connectDB(): Promise<typeof mongoose> {
  const uri =
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    "mongodb://127.0.0.1:27017/cloudnexus";

  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  try {
    logger.info(`Connecting to MongoDB URI: ${uri}`);
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    throw error;
  }
}
