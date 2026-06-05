import { Response } from "express";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: ApiResponse<T>["meta"]
): void => {
  const response: ApiResponse<T> = {
    success: statusCode < 400,
    message,
  };

  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;

  res.status(statusCode).json(response);
};
