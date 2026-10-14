import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = (err as AppError).statusCode || 500;
  const code = (err as AppError).code || 'INTERNAL_ERROR';

  console.error(`[${req.method} ${req.url}] Error:`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'An unexpected internal server error occurred.',
      code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
}
