import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';

// Extend the base Error to support custom statusCode and MongoDB error codes
interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  path?: string;
  value?: unknown;
  errors?: Record<string, MongooseError.ValidatorError | MongooseError.CastError>;
}

// ── Global Error Handler ──────────────────────────────────────────────────────
// Mounted LAST in server.ts as app.use(errorHandler)
const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);

  // Multer file errors
  if (err.name === 'MulterError') {
    res.status(400).json({ message: err.message });
    return;
  }

  // Custom file-filter errors from uploadMiddleware.ts
  if (err.message?.includes('Only')) {
    res.status(400).json({ message: err.message });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({ message: messages.join('. ') });
    return;
  }

  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    res.status(409).json({ message: `${field} is already in use.` });
    return;
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    return;
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error.',
  });
};

export default errorHandler;