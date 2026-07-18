import type { NextFunction, Response } from 'express';

import type { AuthenticatedRequest } from '../modules/auth/auth.types';
import { getCurrentUser, verifyToken } from '../modules/auth/auth.service';
import { AppError } from '../utils/AppError';

const authMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    next(new AppError('Authentication token is required', 401));
    return;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (!token) {
    next(new AppError('Authentication token is required', 401));
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await getCurrentUser(payload.userId);

    req.auth = payload;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export { authMiddleware };
