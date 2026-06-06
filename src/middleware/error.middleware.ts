import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

// pg DatabaseError exposes a `code` string property
interface PgError extends Error {
  code?: string;
}

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = process.env.NODE_ENV === "development";

  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if ((err as PgError).code === "23505") {
    // unique_violation — more reliable than message sniffing
    error = new AppError("Duplicate value — this record already exists", 409);
  } else if ((err as PgError).code === "23503") {
    // foreign_key_violation
    error = new AppError("Related record not found", 400);
  } else if ((err as PgError).code === "22P02") {
    // invalid_text_representation (e.g. bad UUID format)
    error = new AppError("Invalid ID format", 400);
  } else if (err instanceof Error && err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again.", 401);
  } else if (err instanceof Error && err.name === "TokenExpiredError") {
    error = new AppError("Your token has expired. Please log in again.", 401);
  } else if (err instanceof Error) {
    error = new AppError(isDev ? err.message : "Something went wrong", 500);
  } else {
    error = new AppError("Something went wrong", 500);
  }

  if (!error.isOperational || error.statusCode >= 500) {
    console.error("ERROR:", err);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(isDev && err instanceof Error ? { stack: err.stack } : {}),
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};
