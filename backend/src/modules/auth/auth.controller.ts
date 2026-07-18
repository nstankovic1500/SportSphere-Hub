import type { Request, Response } from 'express';

import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';
import type { AuthenticatedRequest, LoginRequestBody, RegisterRequestBody } from './auth.types';
import { adminLogin, getCurrentUser, login, register } from './auth.service';

const loginController = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginRequestBody;
  const data = await login(body.username, body.password);

  res.status(200).json({
    success: true,
    data,
  });
});

const adminLoginController = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginRequestBody;
  const data = await adminLogin(body.username, body.password);

  res.status(200).json({
    success: true,
    data,
  });
});

const registerController = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RegisterRequestBody;
  const data = await register(body);

  res.status(201).json({
    success: true,
    message: 'Registration request created successfully.',
    data,
  });
});

const currentUserController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

export { adminLoginController, currentUserController, loginController, registerController };
