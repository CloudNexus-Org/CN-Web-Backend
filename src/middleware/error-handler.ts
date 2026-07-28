import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("ErrorHandler");

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error("Error caught by error handler:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(err, res);
    return;
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    res.status(400).json({
      error: "Validation failed",
      message: err.message,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    res.status(401).json({
      error: "Invalid or expired token",
    });
    return;
  }

  // Default error response
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
}

function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  res: Response,
): void {
  switch (err.code) {
    case "P2002":
      // Unique constraint violation
      res.status(409).json({
        error: "A record with this value already exists",
        field: (err.meta?.target as string[]) || [],
      });
      break;

    case "P2003":
      // Foreign key constraint violation
      res.status(400).json({
        error: "Referenced record does not exist",
      });
      break;

    case "P2025":
      // Record not found
      res.status(404).json({
        error: "Record not found",
      });
      break;

    default:
      res.status(500).json({
        error: "Database error",
        message:
          process.env.NODE_ENV === "production"
            ? "A database error occurred"
            : err.message,
      });
  }
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
}
