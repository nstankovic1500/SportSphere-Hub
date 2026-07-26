import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { AppError } from '../utils/AppError';

const runUploadMiddleware = (
  uploadHandler: (req: Request, res: Response, callback: (error?: unknown) => void) => void,
) => (req: Request, res: Response, next: NextFunction) => {
  uploadHandler(req, res, (error?: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('Image size must not exceed 5 MB', 400));
        return;
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        next(new AppError('Unexpected upload field', 400));
        return;
      }

      next(new AppError(error.message, 400));
      return;
    }

    next(error);
  });
};

export { runUploadMiddleware };
