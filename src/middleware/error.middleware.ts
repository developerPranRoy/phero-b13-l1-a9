import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

interface ErrorResponse {
  success: false;
  message: string;
  stack?: string;
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
  } else if (err instanceof Error && err.message.includes("duplicate key")) {

    error = new AppError("Duplicate value — this record already exists", 409);
  } else if (err instanceof Error && (err as NodeJS.ErrnoException).code === "23503") {

    error = new AppError("Related record not found", 400);
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
    console.error("💥 ERROR:", err);
  }

  const response: ErrorResponse = {
    success: false,
    message: error.message,
  };

  if (isDev && err instanceof Error) response.stack = err.stack;

  res.status(error.statusCode).json(response);
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};
