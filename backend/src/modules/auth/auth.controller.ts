import type { Request, Response } from 'express';

import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';
import type { AuthenticatedRequest, LoginRequestBody, RegisterRequestBody } from './auth.types';
import {
  adminLogin as adminLoginService,
  getCurrentUser,
  login as loginService,
  register as registerService,
} from './auth.service';

const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginRequestBody;
  const data = await loginService(body.username, body.password);

  res.status(200).json({
    success: true,
    data,
  });
});

const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginRequestBody;
  const data = await adminLoginService(body.username, body.password);

  res.status(200).json({
    success: true,
    data,
  });
});

const register = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RegisterRequestBody;
  const data = await registerService(body);

  res.status(201).json({
    success: true,
    message: 'Registration request created successfully.',
    data,
  });
});

const currentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.auth) {
    throw new AppError('Invalid or expired token', 401);
  }

  const data = await getCurrentUser(req.auth.userId);

  res.status(200).json({
    success: true,
    data: {
      user: data,
    },
  });
});

export { adminLogin, currentUser, login, register };
