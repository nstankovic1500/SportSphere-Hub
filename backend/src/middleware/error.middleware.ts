import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';

import { AppError } from '../utils/AppError';

const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: 'Neispravan identifikator resursa',
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Interna serverska greška',
  });
};

export { errorMiddleware };
