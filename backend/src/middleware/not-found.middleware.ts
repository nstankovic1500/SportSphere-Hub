import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError';

const notFoundMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(`Ruta nije pronađena: ${req.method} ${req.originalUrl}`, 404));
};

export { notFoundMiddleware };
