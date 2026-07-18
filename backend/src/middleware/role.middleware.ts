import type { NextFunction, Response } from 'express';

import type { AuthenticatedRequest } from '../modules/auth/auth.types';
import { UserRole } from '../models/User';
import { AppError } from '../utils/AppError';

const roleMiddleware = (...Roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!Roles.includes(req.auth.role)) {
      next(new AppError('You do not have permission to access this resource', 403));
      return;
    }

    next();
  };
};

export { roleMiddleware };
